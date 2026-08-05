import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MdCheckCircleOutline,
  MdContentCopy,
  MdOutlineCalendarMonth,
  MdOutlinePublic,
} from "react-icons/md";
import AppLayout from "../../components/AppLayout";
import { buttonClassName } from "../../components/Button";
import ManualPixPay from "../../components/ManualPixPay";
import { PageEyebrow } from "../../components/PageTitle";
import {
  useCompanyBranding,
  useCompanyCapabilities,
} from "../../contexts/CompanyBrandingContext";
import { useErrors } from "../../contexts/ErrorsContext";
import { useLoading } from "../../hooks/useLoading";
import {
  BillingPixPayload,
  BillingSummary,
  getBillingPayment,
  getBillingSummary,
  getPayerDataNeeded,
  isPixUnavailableError,
  startBillingContract,
} from "../../api/billing";
import {
  getAccessToken,
  getAccessTokenPayload,
} from "../../utils/authCookie";
import { formatCurrencyBRL } from "../../utils/formatCurrency";
import { formatDateToDDMMYYYY } from "../../utils/formatDateToDDMMYYYY";
import { isPaidEntitlement } from "../../utils/billingNav";
import { formatCpfMask } from "../../utils/formatCpf";
import { isManualPixConfigured } from "../../utils/manualPix";

const WHATSAPP_CONTRACT =
  import.meta.env.VITE_WHATSAPP_CONTRACT_URL ||
  "https://wa.me/5551989589197?text=Ol%C3%A1%2C%20quero%20contratar%20o%20plano%20mensal%20da%20Marca%20Pra%20N%C3%B3s";

const BENEFITS = [
  {
    Icon: MdOutlineCalendarMonth,
    title: "Agenda completa",
    description:
      "Reserve, fixe horários e gerencie o dia a dia da arena sem limites do teste grátis.",
  },
  {
    Icon: MdOutlinePublic,
    title: "Presença no site",
    description:
      "Publique suas quadras para o público encontrar horários livres online.",
  },
] as const;

function openWhatsAppContract() {
  window.open(WHATSAPP_CONTRACT, "_blank", "noopener,noreferrer");
}

function PlansPage() {
  const navigate = useNavigate();
  const { notifyError } = useErrors();
  const { loading, withLoading } = useLoading();
  const caps = useCompanyCapabilities();
  const { refreshCapabilities, companyName } = useCompanyBranding();
  const manualPix = isManualPixConfigured();
  const [companyPublicId, setCompanyPublicId] = useState("");
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [pix, setPix] = useState<BillingPixPayload | null>(null);
  const [paying, setPaying] = useState(false);
  const [needCpf, setNeedCpf] = useState(false);
  const [needEmail, setNeedEmail] = useState(false);
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!getAccessToken()) {
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    if (caps.ready && isPaidEntitlement(caps.entitlement)) {
      navigate("/mensalidades", { replace: true });
    }
  }, [caps.ready, caps.entitlement, navigate]);

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
          message: "Não foi possível carregar as informações do plano.",
        });
      }
    });
  }, [companyPublicId, notifyError, withLoading]);

  useEffect(() => {
    void load();
  }, [load]);

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
            setPix((prev) =>
              prev ? { ...prev, paid: true, status: "paid" } : prev,
            );
            await refreshCapabilities();
            await load();
          }
        } catch {
          // polling silencioso
        }
      })();
    }, 5000);
    return () => window.clearInterval(timer);
  }, [paying, pix, companyPublicId, load, refreshCapabilities]);

  useEffect(() => {
    if (pix?.paid && caps.ready && isPaidEntitlement(caps.entitlement)) {
      navigate("/mensalidades", { replace: true });
    }
  }, [pix?.paid, caps.ready, caps.entitlement, navigate]);

  const needPayerData = needEmail || needCpf;

  const startContract = async (payer?: { cpf?: string; email?: string }) => {
    if (!companyPublicId) return;
    if (!summary?.pixEnabled) {
      openWhatsAppContract();
      return;
    }
    setGenerating(true);
    try {
      const payload = await startBillingContract(companyPublicId, payer);
      setPix(payload);
      setPaying(true);
      setNeedCpf(false);
      setNeedEmail(false);
    } catch (error) {
      if (isPixUnavailableError(error)) {
        openWhatsAppContract();
        return;
      }
      const needed = getPayerDataNeeded(error);
      if (needed) {
        setNeedEmail(needed.email);
        setNeedCpf(needed.cpf);
        setPaying(true);
        return;
      }
      notifyError({
        message: "Não foi possível iniciar a contratação. Tente novamente.",
      });
    } finally {
      setGenerating(false);
    }
  };

  const onSubmitPayerData = async (event: FormEvent) => {
    event.preventDefault();
    const digits = cpf.replace(/\D/g, "");
    const trimmedEmail = email.trim();
    if (needEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      notifyError({ message: "Informe um e-mail válido." });
      return;
    }
    if (needCpf && digits.length !== 11) {
      notifyError({ message: "Informe um CPF válido com 11 dígitos." });
      return;
    }
    await startContract({
      ...(needEmail || trimmedEmail ? { email: trimmedEmail } : {}),
      ...(needCpf || digits.length === 11 ? { cpf: digits } : {}),
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

  const expired = caps.entitlement === "none";
  const fee = summary?.monthlyFee ?? null;
  const trialEndsLabel = summary?.trialEndsAt
    ? formatDateToDDMMYYYY(summary.trialEndsAt)
    : null;

  const introCopy = expired
    ? trialEndsLabel
      ? `Seu teste grátis expirou em ${trialEndsLabel}. Contrate o plano mensal para reabrir a agenda e continuar publicando no site.`
      : "Seu teste grátis terminou. Contrate o plano mensal para reabrir a agenda e continuar publicando no site."
    : trialEndsLabel
      ? `Aproveite o teste grátis até ${trialEndsLabel} e, quando quiser, contrate o plano mensal para manter a operação da arena no ritmo.`
      : "Aproveite o teste grátis e, quando quiser, contrate o plano mensal para manter a operação da arena no ritmo.";

  const payerHint = [
    "Para o PIX automático (Mercado Pago), falta:",
    needEmail && needCpf
      ? "e-mail e CPF."
      : needEmail
        ? "e-mail."
        : "CPF.",
  ].join(" ");

  return (
    <AppLayout>
      <main className="mx-auto flex w-full max-w-3xl min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-4 py-6 lg:px-8">
        <div>
          <PageEyebrow>Planos</PageEyebrow>
          <p className="mt-2 max-w-xl text-base leading-7 text-text-light/70">
            {introCopy}
          </p>
        </div>

        {loading && !summary ? (
          <p className="text-text-light/60">Carregando…</p>
        ) : (
          <>
            <section className="rounded-3xl bg-master-light p-5 sm:p-6">
              {expired ? (
                <p className="mb-3 inline-flex rounded-full bg-danger-400/15 px-3 py-1 text-sm font-semibold text-danger-soft">
                  Teste grátis encerrado
                  {trialEndsLabel ? ` · ${trialEndsLabel}` : ""}
                </p>
              ) : summary?.isTrial ? (
                <p className="mb-3 inline-flex rounded-full bg-accent-blue/15 px-3 py-1 text-sm font-semibold text-accent-blue-soft">
                  Teste grátis ativo
                </p>
              ) : null}

              <p className="text-sm font-semibold uppercase tracking-wider text-text-light/50">
                Plano Promocional
              </p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-text-light">
                {fee != null ? formatCurrencyBRL(fee) : "—"}
                <span className="ml-1 text-lg font-semibold text-text-light/55">
                  /mês
                </span>
              </p>
              <p className="mt-2 text-base leading-6 text-text-light/70">
                Valor estimado para o seu estabelecimento. O vencimento mensal
                fica no dia do pagamento.
              </p>

              <ul className="mt-5 space-y-3">
                {[
                  "Agenda ilimitada para reservas e horários fixos",
                  "Publicação das quadras no site da Marca Pra Nós",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-base leading-6 text-text-light/85"
                  >
                    <MdCheckCircleOutline
                      size={22}
                      className="mt-0.5 shrink-0 text-accent-green"
                      aria-hidden
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              {!paying ? (
                <>
                  {summary?.pixEnabled ? (
                    <button
                      type="button"
                      disabled={generating}
                      onClick={() => void startContract()}
                      className={`${buttonClassName({
                        variant: "primary",
                        size: "lg",
                      })} mt-6`}
                    >
                      {generating
                        ? "Gerando PIX…"
                        : "Gerar PIX"}
                    </button>
                  ) : null}
                  <p className="mt-3 text-center text-sm text-text-light/55">
                    {summary?.pixEnabled
                      ? "Pague com PIX e o acesso libera na hora — ou use a chave abaixo e envie o comprovante."
                      : manualPix
                        ? "Copie a chave PIX e envie o comprovante no WhatsApp para liberarmos o acesso."
                        : "PIX automático indisponível — falamos no WhatsApp."}
                  </p>
                  {manualPix ? (
                    <ManualPixPay
                      className={summary?.pixEnabled ? "mt-4" : "mt-6"}
                      primary={!summary?.pixEnabled}
                      amount={fee}
                      companyName={companyName || null}
                    />
                  ) : null}
                  {!summary?.pixEnabled && !manualPix ? (
                    <button
                      type="button"
                      onClick={openWhatsAppContract}
                      className={`${buttonClassName({
                        variant: "primary",
                        size: "lg",
                      })} mt-6`}
                    >
                      Contrate pelo WhatsApp
                    </button>
                  ) : summary?.pixEnabled ? (
                    <button
                      type="button"
                      onClick={openWhatsAppContract}
                      className="mt-3 w-full text-center text-sm font-semibold text-accent-blue-soft underline-offset-2 hover:underline"
                    >
                      Prefere só WhatsApp?
                    </button>
                  ) : null}
                </>
              ) : null}

              {paying && needPayerData ? (
                <form onSubmit={onSubmitPayerData} className="mt-6 space-y-3">
                  <p className="text-sm text-text-light/70">{payerHint}</p>
                  {needEmail ? (
                    <input
                      type="email"
                      autoComplete="email"
                      placeholder="E-mail"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="min-h-11 w-full rounded-xl border border-text-light/15 bg-master px-3 text-text-light"
                    />
                  ) : null}
                  {needCpf ? (
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="000.000.000-00"
                      value={cpf}
                      onChange={(e) => setCpf(formatCpfMask(e.target.value))}
                      className="min-h-11 w-full rounded-xl border border-text-light/15 bg-master px-3 text-text-light"
                    />
                  ) : null}
                  <button
                    type="submit"
                    disabled={generating}
                    className={buttonClassName({
                      variant: "primary",
                      size: "md",
                    })}
                  >
                    Gerar PIX
                  </button>
                  <button
                    type="button"
                    className="block text-sm font-semibold text-accent-blue-soft"
                    onClick={resetPayUi}
                  >
                    Cancelar
                  </button>
                </form>
              ) : null}

              {paying && pix && !needPayerData ? (
                <div className="mt-6 space-y-4">
                  {pix.paid ? (
                    <p className="rounded-xl bg-accent-green/15 px-3 py-3 text-sm font-semibold text-accent-green">
                      Pagamento confirmado. Liberando seu plano…
                    </p>
                  ) : (
                    <>
                      <p className="text-base font-semibold text-text-light">
                        Pague {formatCurrencyBRL(pix.value)} via PIX
                      </p>
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
                        className={`${buttonClassName({
                          variant: "secondary",
                          size: "md",
                        })} w-full`}
                      >
                        <span className="inline-flex items-center justify-center gap-2">
                          <MdContentCopy size={18} aria-hidden />
                          {copied ? "Copiado!" : "Copiar código PIX"}
                        </span>
                      </button>
                      <p className="text-center text-xs text-text-light/50">
                        Após pagar, a confirmação aparece em
                        alguns segundos.
                      </p>
                      {manualPix ? (
                        <ManualPixPay
                          className="mt-2"
                          amount={pix.value}
                          companyName={companyName || null}
                        />
                      ) : null}
                    </>
                  )}
                  <button
                    type="button"
                    className="text-sm font-semibold text-accent-blue-soft"
                    onClick={resetPayUi}
                  >
                    Fechar
                  </button>
                </div>
              ) : null}
            </section>

            <section className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-wider text-text-light/50">
                O que você desbloqueia
              </p>
              <ul className="grid gap-3 sm:grid-cols-2">
                {BENEFITS.map(({ Icon, title, description }) => (
                  <li
                    key={title}
                    className="rounded-2xl bg-master-light px-4 py-4"
                  >
                    <span className="flex size-11 items-center justify-center rounded-full bg-accent-blue/15 text-accent-blue">
                      <Icon size={22} aria-hidden />
                    </span>
                    <p className="mt-3 text-base font-semibold text-text-light">
                      {title}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-text-light/65">
                      {description}
                    </p>
                  </li>
                ))}
              </ul>
            </section>

            {!expired && summary?.isTrial ? (
              <p className="text-center text-sm text-text-light/55">
                Enquanto o teste grátis estiver válido, a agenda segue liberada.{" "}
                <Link
                  to="/reservas"
                  className="font-semibold text-accent-blue-soft underline-offset-2 hover:underline"
                >
                  Voltar ao início
                </Link>
              </p>
            ) : null}
          </>
        )}
      </main>
    </AppLayout>
  );
}

export default PlansPage;
