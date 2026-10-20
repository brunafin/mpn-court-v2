import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import {
  BillingPixPayload,
  getBillingPayment,
  getPayerDataNeeded,
} from "../api/billing";
import { useErrors } from "../contexts/ErrorsContext";
import { formatCpfMask, isValidCpf } from "../utils/formatCpf";
import { openReceiptWhatsApp } from "../utils/manualPix";

export type PixPayer = { cpf?: string; email?: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ReceiptDetails = {
  amount?: number | null;
  companyName?: string | null;
  dueLabel?: string | null;
};

/** PIX automático compartilhado por Planos e Mensalidades. */
export function useBillingPix(options: {
  companyPublicId: string;
  onPaid?: () => void | Promise<void>;
}) {
  const { companyPublicId, onPaid } = options;
  const { notifyError } = useErrors();
  const onPaidRef = useRef(onPaid);
  onPaidRef.current = onPaid;

  const [pix, setPix] = useState<BillingPixPayload | null>(null);
  const [paying, setPaying] = useState(false);
  const [needCpf, setNeedCpf] = useState(false);
  const [needEmail, setNeedEmail] = useState(false);
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const needPayerData = needEmail || needCpf;

  useEffect(() => {
    if (!paying || !pix || !companyPublicId || pix.paid) return;
    const paymentId = pix.paymentId;
    const timer = window.setInterval(() => {
      void (async () => {
        try {
          const status = await getBillingPayment(companyPublicId, paymentId);
          if (!status.paid) return;
          setPix((prev) =>
            prev ? { ...prev, paid: true, status: "paid" } : prev,
          );
          await onPaidRef.current?.();
        } catch {
          // polling silencioso
        }
      })();
    }, 5000);
    return () => window.clearInterval(timer);
  }, [paying, pix, companyPublicId]);

  const resetPayUi = useCallback(() => {
    setPaying(false);
    setPix(null);
    setNeedCpf(false);
    setNeedEmail(false);
  }, []);

  const charge = useCallback(async (request: () => Promise<BillingPixPayload>) => {
    setGenerating(true);
    try {
      const payload = await request();
      setPix(payload);
      setPaying(true);
      setNeedCpf(false);
      setNeedEmail(false);
    } catch (error) {
      const needed = getPayerDataNeeded(error);
      if (needed) {
        setNeedEmail(needed.email);
        setNeedCpf(needed.cpf);
        setPaying(true);
        return;
      }
      throw error;
    } finally {
      setGenerating(false);
    }
  }, []);

  const submitPayer = useCallback(
    async (event: FormEvent, onValid: (payer: PixPayer) => Promise<void>) => {
      event.preventDefault();
      const digits = cpf.replace(/\D/g, "");
      const trimmedEmail = email.trim();
      if (needEmail && !EMAIL_PATTERN.test(trimmedEmail)) {
        notifyError({ message: "Informe um e-mail válido." });
        return;
      }
      if (needCpf && !isValidCpf(digits)) {
        notifyError({
          message:
            digits.length === 11
              ? "Informe um CPF válido."
              : "Informe um CPF válido com 11 dígitos.",
        });
        return;
      }
      await onValid({
        ...(needEmail || trimmedEmail ? { email: trimmedEmail } : {}),
        ...(needCpf || isValidCpf(digits) ? { cpf: digits } : {}),
      });
    },
    [cpf, email, needCpf, needEmail, notifyError],
  );

  const copyPix = useCallback(async () => {
    if (!pix?.pixCopyPaste) return;
    try {
      await navigator.clipboard.writeText(pix.pixCopyPaste);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      notifyError({
        message: "Não foi possível copiar. Selecione o código manualmente.",
      });
    }
  }, [notifyError, pix?.pixCopyPaste]);

  const sendReceipt = useCallback((params?: ReceiptDetails) => {
    openReceiptWhatsApp(params);
  }, []);

  const onCpfChange = useCallback((value: string) => {
    setCpf(formatCpfMask(value));
  }, []);

  const payerHint = [
    "Para o PIX automático (Mercado Pago), falta:",
    needEmail && needCpf ? "e-mail e CPF." : needEmail ? "e-mail." : "CPF.",
  ].join(" ");

  return {
    pix,
    paying,
    needCpf,
    needEmail,
    needPayerData,
    cpf,
    email,
    setEmail,
    onCpfChange,
    generating,
    copied,
    payerHint,
    charge,
    submitPayer,
    copyPix,
    resetPayUi,
    sendReceipt,
  };
}
