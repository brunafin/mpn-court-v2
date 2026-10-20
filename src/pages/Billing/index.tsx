import { FormEvent, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdContentCopy } from "react-icons/md";
import AppLayout from "../../components/AppLayout";
import { buttonClassName } from "../../components/Button";
import EmptyState from "../../components/EmptyState";
import ManualPixPay from "../../components/ManualPixPay";
import { PageEyebrow } from "../../components/PageTitle";
import { useErrors } from "../../contexts/ErrorsContext";
import { useLoading } from "../../hooks/useLoading";
import {
  BillingPaymentItem,
  BillingPixPayload,
  BillingSummary,
  generateBillingPix,
  getBillingPayment,
  getBillingSummary,
  getPayerDataNeeded,
} from "../../api/billing";
import { getAccessToken } from "../../utils/authCookie";
import { useCompanyPublicId } from "../../hooks/useCompanyPublicId";
import { formatCurrencyBRL } from "../../utils/formatCurrency";
import {
  useCompanyBranding,
  useCompanyCapabilities,
} from "../../contexts/CompanyBrandingContext";
import { isPaidEntitlement } from "../../utils/billingNav";
import { formatCpfMask, isValidCpf } from "../../utils/formatCpf";
import { isManualPixConfigured, isMercadoPagoPixUiEnabled } from "../../utils/manualPix";

function todayIso(): string {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
}

function isOverdue(payment: BillingPaymentItem): boolean {
  if (payment.paid || payment.status === "paid") return false;
  if (payment.status === "overdue") return true;
  return Boolean(payment.dueDate && payment.dueDate < todayIso());
}

function latestPayment(summary: BillingSummary): BillingPaymentItem | null {
  if (summary.openPayment) return summary.openPayment;
  const history = summary.history ?? [];
  if (history.length === 0) return null;
  return [...history].sort((a, b) => {
    const byDate = (b.dueDate ?? "").localeCompare(a.dueDate ?? "");
    if (byDate !== 0) return byDate;
    return b.id - a.id;
  })[0];
}

function formatDue(dueDate: string | null): string {
  if (!dueDate) return "—";
  const [y, m, d] = dueDate.split("-");
  if (!y || !m || !d) return dueDate;
  return `${d}/${m}/${y}`;
}

function formatMonthYear(dueDate: string | null): string {
  if (!dueDate) return "Mensalidade";
  const [y, m] = dueDate.split("-");
  if (!y || !m) return "Mensalidade";
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

function BillingPage() {
  const navigate = useNavigate();
  const { notifyError } = useErrors();
  const { loading, withLoading } = useLoading();
  const caps = useCompanyCapabilities();
  const { companyName } = useCompanyBranding();
  const manualPix = isManualPixConfigured();
  const companyPublicId = useCompanyPublicId();
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [paying, setPaying] = useState(false);
  const [pix, setPix] = useState<BillingPixPayload | null>(null);
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [needCpf, setNeedCpf] = useState(false);
  const [needEmail, setNeedEmail] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!getAccessToken()) {
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    if (caps.ready && !isPaidEntitlement(caps.entitlement)) {
      navigate("/planos", { replace: true });
    }
  }, [caps.ready, caps.entitlement, navigate]);

  const canGeneratePix = caps.ready && caps.canPayBilling;

  const load = useCallback(async () => {
    if (!companyPublicId) return;
    await withLoading(async () => {
      try {
        const data = await getBillingSummary(companyPublicId, {
          silentError: true,
        });
        setSummary(data);
      } catch (error) {
        console.error(error);
        notifyError({
          message: "Não foi possível carregar as mensalidades.",
        });
      }
    });
  }, [companyPublicId, notifyError, withLoading]);

  useEffect(() => {
    void load();
  }, [load]);

  const latest = summary && !summary.isTrial ? latestPayment(summary) : null;
  const latestOverdue = latest ? isOverdue(latest) : false;
  const latestPayable =
    latest != null && !latest.paid && latest.status !== "paid";

  useEffect(() => {
    if (!paying || !pix || !companyPublicId || pix.paid) return;
    const timer = window.setInterval(() => {
      void (async () => {
        try {
          const status = await getBillingPayment(
            companyPublicId,
            pix.paymentId,
          );
          if (status.paid) {
            setPix((prev) => (prev ? { ...prev, paid: true, status: "paid" } : prev));
            await load();
          }
        } catch {
          // polling silencioso
        }
      })();
    }, 5000);
    return () => window.clearInterval(timer);
  }, [paying, pix, companyPublicId, load]);

  const needPayerData = needEmail || needCpf;

  const startPay = async (
    payment: BillingPaymentItem,
    payer?: { cpf?: string; email?: string },
  ) => {
    if (!companyPublicId) return;
    if (!summary?.pixEnabled) {
      notifyError({
        message:
          "Pagamento PIX ainda não está disponível. Contate o suporte.",
      });
      return;
    }
    setGenerating(true);
    try {
      const payload = await generateBillingPix(
        companyPublicId,
        payment.id,
        payer,
      );
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
      notifyError({
        message: "Não foi possível gerar o PIX. Tente novamente.",
      });
    } finally {
      setGenerating(false);
    }
  };

  const onSubmitPayerData = async (event: FormEvent) => {
    event.preventDefault();
    if (!latest || !latestPayable) return;
    const digits = cpf.replace(/\D/g, "");
    const trimmedEmail = email.trim();
    if (needEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
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
    await startPay(latest, {
      ...(needEmail || trimmedEmail
        ? { email: trimmedEmail }
        : {}),
      ...(needCpf || isValidCpf(digits) ? { cpf: digits } : {}),
    });
  };

  const copyPix = async () => {
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
  };

  const resetPayUi = () => {
    setPaying(false);
    setPix(null);
    setNeedCpf(false);
    setNeedEmail(false);
  };

  const payerHint = [
    "Para o PIX automático (Mercado Pago), falta:",
    needEmail && needCpf
      ? "e-mail e CPF."
      : needEmail
        ? "e-mail."
        : "CPF.",
  ].join(" ");

  const showAutoPix =
    isMercadoPagoPixUiEnabled() && Boolean(summary?.pixEnabled);

  return (
    <AppLayout>
      <main className="mx-auto flex w-full max-w-2xl min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-3 py-4 lg:px-8">
        <div>
          <PageEyebrow>Planos e pagamentos</PageEyebrow>
        </div>

        {loading && !summary ? (
          <p className="text-text-light/70">Carregando…</p>
        ) : null}

        {summary?.isTrial ? (
          <section className="rounded-xl bg-master-light px-4 py-5">
            <p className="text-base font-semibold text-text-light">
              Teste grátis ativo
            </p>
            <p className="mt-1 text-base text-text-light/70">
              Nenhuma mensalidade enquanto o teste grátis estiver válido.
              {summary.dayDue
                ? ` Depois do teste grátis, o vencimento fica no dia ${summary.dayDue}.`
                : null}
            </p>
          </section>
        ) : null}

        {latest ? (
          <section className="rounded-xl bg-master-light px-4 py-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p
                  className={`text-base font-semibold ${
                    latestOverdue
                      ? "text-danger-ink"
                      : "text-accent-green-ink"
                  }`}
                >
                  {latestOverdue ? "Atrasado" : "Em dia"}
                </p>
                <p className="mt-1 text-base font-semibold text-text-light">
                  {formatMonthYear(latest.dueDate)}
                </p>
                <p className="mt-1 text-base text-text-light/70">
                  Vencimento {formatDue(latest.dueDate)}
                </p>
              </div>
              <p className="text-base font-semibold text-text-light">
                {formatCurrencyBRL(latest.value)}
              </p>
            </div>

            {!paying && latestPayable ? (
              <>
                {showAutoPix && canGeneratePix ? (
                  <button
                    type="button"
                    disabled={generating}
                    className={`${buttonClassName({ variant: "primary", size: "md" })} mt-4 w-full`}
                    onClick={() => void startPay(latest)}
                  >
                    {generating
                      ? "Gerando PIX…"
                      : "Gerar PIX"}
                  </button>
                ) : null}
                {manualPix && canGeneratePix ? (
                  <ManualPixPay
                    className="mt-4"
                    primary={!showAutoPix}
                    amount={latest.value}
                    companyName={companyName || null}
                    dueLabel={formatMonthYear(latest.dueDate)}
                  />
                ) : null}
                {canGeneratePix && !showAutoPix && !manualPix ? (
                  <p className="mt-4 text-base text-text-light/70">
                    PIX automático indisponível no momento. Contate o suporte.
                  </p>
                ) : null}
                {caps.ready && !canGeneratePix ? (
                  <p className="mt-4 text-base text-text-light/70">
                    Pagamento disponível apenas para planos ativos.
                  </p>
                ) : null}
              </>
            ) : null}

            {paying && needPayerData ? (
              <form
                onSubmit={onSubmitPayerData}
                className="mt-4 space-y-3"
                aria-busy={generating || undefined}
              >
                <p className="text-base text-text-light/70">{payerHint}</p>
                {needEmail ? (
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="E-mail"
                    value={email}
                    disabled={generating}
                    onChange={(e) => setEmail(e.target.value)}
                    className="min-h-11 w-full rounded-xl bg-master px-3 text-text-light disabled:cursor-not-allowed disabled:opacity-60"
                  />
                ) : null}
                {needCpf ? (
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="000.000.000-00"
                    value={cpf}
                    disabled={generating}
                    onChange={(e) => setCpf(formatCpfMask(e.target.value))}
                    className="min-h-11 w-full rounded-xl bg-master px-3 text-text-light disabled:cursor-not-allowed disabled:opacity-60"
                  />
                ) : null}
                <button
                  type="submit"
                  disabled={generating}
                  className={buttonClassName({ variant: "primary", size: "md" })}
                >
                  {generating ? "Gerando…" : "Gerar PIX"}
                </button>
                <button
                  type="button"
                  disabled={generating}
                  className="block text-base font-semibold text-accent-blue-soft disabled:opacity-50"
                  onClick={resetPayUi}
                >
                  Cancelar
                </button>
              </form>
            ) : null}

            {paying && pix && !needPayerData ? (
              <div className="mt-4 space-y-4">
                {pix.paid ? (
                  <p className="rounded-xl bg-accent-green/15 px-3 py-3 text-base font-semibold text-accent-green-ink">
                    Pagamento confirmado. Obrigado!
                  </p>
                ) : (
                  <>
                    {pix.pixQrBase64 ? (
                      <img
                        src={`data:image/jpeg;base64,${pix.pixQrBase64}`}
                        alt="QR Code PIX"
                        className="mx-auto size-48 rounded-xl bg-white p-2"
                      />
                    ) : null}
                    <label className="block text-base text-text-light/55">
                      PIX copia e cola
                    </label>
                    <textarea
                      readOnly
                      value={pix.pixCopyPaste ?? ""}
                      rows={3}
                      className="w-full rounded-xl bg-master px-3 py-2 text-base text-text-light"
                    />
                    <button
                      type="button"
                      onClick={() => void copyPix()}
                      className={`${buttonClassName({ variant: "secondary", size: "md" })} w-full`}
                    >
                      <span className="inline-flex items-center justify-center gap-2">
                        <MdContentCopy size={18} aria-hidden />
                        {copied ? "Copiado!" : "Copiar código PIX"}
                      </span>
                    </button>
                    <p className="text-center text-base text-text-light/55">
                      Após pagar, a confirmação aparece
                      automaticamente em alguns segundos.
                    </p>
                    {manualPix ? (
                      <ManualPixPay
                        className="mt-2"
                        amount={pix.value}
                        companyName={companyName || null}
                        dueLabel={formatMonthYear(latest.dueDate)}
                      />
                    ) : null}
                  </>
                )}
                <button
                  type="button"
                  className="text-base font-semibold text-accent-blue-soft"
                  onClick={resetPayUi}
                >
                  Fechar
                </button>
              </div>
            ) : null}
          </section>
        ) : !summary?.isTrial ? (
          <EmptyState
            title="Nenhuma mensalidade ainda"
            description="Quando houver uma mensalidade, ela aparece aqui."
          />
        ) : null}
      </main>
    </AppLayout>
  );
}

export default BillingPage;
