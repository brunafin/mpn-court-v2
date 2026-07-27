import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdContentCopy, MdOutlinePayments } from "react-icons/md";
import AppLayout from "../../components/AppLayout";
import { buttonClassName } from "../../components/Button";
import { PageEyebrow, PageTitle } from "../../components/PageTitle";
import { useErrors } from "../../contexts/ErrorsContext";
import { useLoading } from "../../hooks/useLoading";
import {
  BillingPaymentItem,
  BillingPixPayload,
  BillingSummary,
  generateBillingPix,
  getBillingPayment,
  getBillingSummary,
  isCpfRequiredError,
} from "../../api/billing";
import {
  getAccessToken,
  getAccessTokenPayload,
} from "../../utils/authCookie";
import { formatCurrencyBRL } from "../../utils/formatCurrency";

function statusLabel(status: BillingPaymentItem["status"]): string {
  switch (status) {
    case "paid":
      return "Pago";
    case "awaiting_pix":
      return "Aguardando PIX";
    case "overdue":
      return "Vencido";
    default:
      return "Em aberto";
  }
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
  const [companyPublicId, setCompanyPublicId] = useState("");
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [paying, setPaying] = useState(false);
  const [pix, setPix] = useState<BillingPixPayload | null>(null);
  const [cpf, setCpf] = useState("");
  const [needCpf, setNeedCpf] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!getAccessToken()) {
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    const payload = getAccessTokenPayload<{ companyPublicId?: string }>();
    setCompanyPublicId(payload?.companyPublicId || "");
  }, []);

  const load = useCallback(async () => {
    if (!companyPublicId) return;
    await withLoading(async () => {
      try {
        const data = await getBillingSummary(companyPublicId);
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

  const openPayment = summary?.openPayment ?? null;

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

  const historyPaidOrClosed = useMemo(() => {
    if (!summary) return [];
    return summary.history.filter((item) => item.paid || item.id !== openPayment?.id);
  }, [summary, openPayment?.id]);

  const startPay = async (payment: BillingPaymentItem, withCpf?: string) => {
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
        withCpf ? { cpf: withCpf.replace(/\D/g, "") } : undefined,
      );
      setPix(payload);
      setPaying(true);
      setNeedCpf(false);
    } catch (error) {
      if (isCpfRequiredError(error)) {
        setNeedCpf(true);
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

  const onSubmitCpf = async (event: FormEvent) => {
    event.preventDefault();
    if (!openPayment) return;
    const digits = cpf.replace(/\D/g, "");
    if (digits.length !== 11) {
      notifyError({ message: "Informe um CPF válido com 11 dígitos." });
      return;
    }
    await startPay(openPayment, digits);
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

  return (
    <AppLayout>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 lg:px-8">
        <div>
          <PageEyebrow>Financeiro</PageEyebrow>
          <PageTitle>Mensalidades</PageTitle>
          <p className="mt-1 text-sm text-text-light/60">
            Histórico e pagamento da mensalidade da plataforma.
          </p>
        </div>

        {loading && !summary ? (
          <p className="text-text-light/60">Carregando…</p>
        ) : null}

        {summary?.isTrial ? (
          <section className="rounded-2xl bg-master-light px-4 py-5">
            <p className="text-base font-semibold text-text-light">
              Período de teste ativo
            </p>
            <p className="mt-1 text-sm text-text-light/65">
              Nenhuma cobrança enquanto o trial estiver válido.
              {summary.dayDue
                ? ` Após o trial, o vencimento fica no dia ${summary.dayDue}.`
                : null}
            </p>
          </section>
        ) : null}

        {openPayment ? (
          <section className="rounded-2xl bg-master-light px-4 py-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-text-light/50">
                  Atual a pagar
                </p>
                <p className="mt-1 text-lg font-semibold capitalize text-text-light">
                  {formatMonthYear(openPayment.dueDate)}
                </p>
                <p className="mt-1 text-sm text-text-light/65">
                  Vencimento {formatDue(openPayment.dueDate)} ·{" "}
                  {statusLabel(openPayment.status)}
                </p>
              </div>
              <p className="text-xl font-semibold text-accent-green">
                {formatCurrencyBRL(openPayment.value)}
              </p>
            </div>

            {!paying ? (
              <button
                type="button"
                disabled={generating || !summary?.pixEnabled}
                className={`${buttonClassName({ variant: "primary", size: "md" })} mt-4 w-full`}
                onClick={() => void startPay(openPayment)}
              >
                {summary?.pixEnabled ? "Pagar com PIX" : "PIX indisponível"}
              </button>
            ) : null}

            {paying && needCpf ? (
              <form onSubmit={onSubmitCpf} className="mt-4 space-y-3">
                <p className="text-sm text-text-light/70">
                  Informe o CPF do responsável para gerar o PIX (usado só no
                  Mercado Pago).
                </p>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  className="min-h-11 w-full rounded-xl border border-text-light/15 bg-master px-3 text-text-light"
                />
                <button
                  type="submit"
                  disabled={generating}
                  className={buttonClassName({ variant: "primary", size: "md" })}
                >
                  Gerar PIX
                </button>
              </form>
            ) : null}

            {paying && pix && !needCpf ? (
              <div className="mt-4 space-y-4">
                {pix.paid ? (
                  <p className="rounded-xl bg-accent-green/15 px-3 py-3 text-sm font-semibold text-accent-green">
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
                    <label className="block text-xs font-semibold uppercase tracking-wider text-text-light/50">
                      PIX copia e cola
                    </label>
                    <textarea
                      readOnly
                      value={pix.pixCopyPaste ?? ""}
                      rows={3}
                      className="w-full rounded-xl border border-text-light/15 bg-master px-3 py-2 text-sm text-text-light"
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
                    <p className="text-center text-xs text-text-light/50">
                      Após pagar, a confirmação aparece automaticamente em
                      alguns segundos.
                    </p>
                  </>
                )}
                <button
                  type="button"
                  className="text-sm font-semibold text-accent-blue-soft"
                  onClick={() => {
                    setPaying(false);
                    setPix(null);
                    setNeedCpf(false);
                  }}
                >
                  Fechar
                </button>
              </div>
            ) : null}
          </section>
        ) : !summary?.isTrial ? (
          <section className="rounded-2xl bg-master-light px-4 py-5">
            <div className="flex items-center gap-3">
              <MdOutlinePayments
                size={28}
                className="text-accent-blue-soft"
                aria-hidden
              />
              <div>
                <p className="font-semibold text-text-light">
                  Nenhuma mensalidade em aberto
                </p>
                <p className="text-sm text-text-light/60">
                  Quando houver cobrança, ela aparece aqui.
                </p>
              </div>
            </div>
          </section>
        ) : null}

        <section className="rounded-2xl bg-master-light px-4 py-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-light/50">
            Histórico
          </p>
          {historyPaidOrClosed.length === 0 ? (
            <p className="mt-3 text-sm text-text-light/55">
              Sem pagamentos registrados ainda.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-text-light/10">
              {historyPaidOrClosed.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div>
                    <p className="font-semibold capitalize text-text-light">
                      {formatMonthYear(item.dueDate)}
                    </p>
                    <p className="text-sm text-text-light/60">
                      {statusLabel(item.status)}
                      {item.paidAt ? ` · ${formatDue(item.paidAt)}` : null}
                    </p>
                  </div>
                  <p className="font-semibold text-text-light">
                    {formatCurrencyBRL(item.value)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </AppLayout>
  );
}

export default BillingPage;
