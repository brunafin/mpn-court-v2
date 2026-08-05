import { useState } from "react";
import { MdContentCopy, MdOutlineWhatsapp } from "react-icons/md";
import { buttonClassName } from "../Button";
import { useErrors } from "../../contexts/ErrorsContext";
import {
  getManualPixKey,
  isManualPixConfigured,
  openReceiptWhatsApp,
} from "../../utils/manualPix";

type ManualPixPayProps = {
  amount?: number | null;
  companyName?: string | null;
  dueLabel?: string | null;
  /** Destaque maior quando é o caminho principal (sem Mercado Pago). */
  primary?: boolean;
  className?: string;
};

function ManualPixPay({
  amount,
  companyName,
  dueLabel,
  primary = false,
  className = "",
}: ManualPixPayProps) {
  const { notifyError } = useErrors();
  const [copied, setCopied] = useState(false);

  if (!isManualPixConfigured()) return null;

  const key = getManualPixKey();

  const copyKey = async () => {
    try {
      await navigator.clipboard.writeText(key);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      notifyError({
        message: "Não foi possível copiar. Selecione a chave manualmente.",
      });
    }
  };

  return (
    <div
      className={`rounded-2xl border border-text-light/10 bg-master px-4 py-4 ${className}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-text-light/50">
        {primary ? "Pagar com chave PIX" : "Ou pague com nossa chave PIX"}
      </p>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-text-light/50">
        Chave PIX
      </p>
      <p className="mt-1 break-all rounded-xl border border-text-light/15 bg-master-light px-3 py-2 font-mono text-sm text-text-light">
        {key}
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => void copyKey()}
          className={`${buttonClassName({
            variant: primary ? "primary" : "secondary",
            size: "md",
          })} w-full sm:flex-1`}
        >
          <span className="inline-flex items-center justify-center gap-2">
            <MdContentCopy size={18} aria-hidden />
            {copied ? "Chave copiada!" : "Copiar chave PIX"}
          </span>
        </button>
        <button
          type="button"
          onClick={() =>
            openReceiptWhatsApp({ amount, companyName, dueLabel })
          }
          className={`${buttonClassName({
            variant: primary ? "secondary" : "primary",
            size: "md",
          })} w-full sm:flex-1`}
        >
          <span className="inline-flex items-center justify-center gap-2">
            <MdOutlineWhatsapp size={18} aria-hidden />
            Enviar comprovante
          </span>
        </button>
      </div>
    </div>
  );
}

export default ManualPixPay;
