import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppLayout from "../../components/AppLayout";
import {
  MdCheckCircle,
  MdContentCopy,
  MdOutlineInfo,
  MdOpenInNew,
  MdShare,
} from "react-icons/md";
import { useLoading } from "../../hooks/useLoading";
import {
  IInfo,
  infosByCompanyPublicId,
  updatePreferencesByCompanyPublicId,
} from "../../api/companies";
import { formatCurrencyBRL } from "../../utils/formatCurrency";
import { useErrors } from "../../contexts/ErrorsContext";
import {
  getAccessToken,
  getAccessTokenPayload,
} from "../../utils/authCookie";
import { buttonClassName } from "../../components/Button";
import { PageEyebrow } from "../../components/PageTitle";
import {
  canPublish,
  getMockOnboarding,
  isMockSession,
  MockOnboardingState,
  updateMockOnboarding,
} from "../../onboarding/mockStore";
import { formatPhoneMask } from "../../utils/formatPhone";

function MockInfo() {
  const navigate = useNavigate();
  const { notifyError } = useErrors();
  const [state, setState] = useState<MockOnboardingState | null>(null);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (!isMockSession()) {
      navigate("/");
      return;
    }
    const mock = getMockOnboarding();
    if (!mock) {
      navigate("/cadastro");
      return;
    }
    setState(mock);
  }, [navigate]);

  if (!state) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-master text-text-light/70">
        Carregando…
      </div>
    );
  }

  const ready = canPublish(state);
  const published = state.isPublished;

  const handlePublish = () => {
    if (!ready) {
      notifyError({
        message: "Conclua a configuração básica antes de ativar no portal.",
        type: "error",
      });
      return;
    }
    setPublishing(true);
    try {
      const next = updateMockOnboarding({ isPublished: true });
      if (next) setState(next);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-master px-4 py-8 text-text-light">
      <div className="mx-auto w-full max-w-lg">
        <Link
          to="/comecar"
          className="text-sm font-semibold text-accent-blue-soft underline-offset-2 hover:underline"
        >
          ← Configuração básica
        </Link>

        <PageEyebrow className="mb-2 mt-4">Minhas informações</PageEyebrow>
        <h1 className="text-2xl font-bold tracking-tight">
          {state.arenaName.trim() || "Seu estabelecimento"}
        </h1>
        <p className="mt-1 text-base text-text-light/65">
          {state.ownerName} · {formatPhoneMask(state.ownerPhone)}
        </p>
        <p className="mt-3 rounded-lg bg-warning-500/15 px-3 py-2 text-sm font-medium text-warning-500">
          Protótipo — ativação mock, não publica de verdade
        </p>

        <div className="mt-6 space-y-4">
          <div className="rounded-2xl bg-master-light px-4 py-5">
            <p className="text-base font-medium text-text-light/70">Conta</p>
            <p className="mt-1 text-lg font-semibold text-text-light">
              {state.email}
            </p>
          </div>

          <div className="rounded-2xl bg-master-light p-4 sm:p-5">
            <p className="mb-2 text-lg font-semibold text-text-light">
              Ativar no portal
            </p>
            <p className="mb-4 text-base leading-6 text-text-light/65">
              Liberar a arena no portal de reservas é opcional. Você já pode
              usar a agenda sem ativar.
            </p>

            {published ? (
              <div className="flex items-start gap-3 rounded-xl bg-accent-green/15 px-4 py-3.5">
                <MdCheckCircle
                  size={24}
                  className="mt-0.5 shrink-0 text-accent-green"
                  aria-hidden
                />
                <div>
                  <p className="text-lg font-semibold text-accent-green">
                    Ativa no portal
                  </p>
                  <p className="mt-0.5 text-base text-text-light/70">
                    (mock) — na API real isso publicaria a arena.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {!ready && (
                  <div className="mb-4 flex items-start gap-2 rounded-xl bg-master px-4 py-3">
                    <MdOutlineInfo
                      size={20}
                      className="mt-0.5 shrink-0 text-text-light/55"
                      aria-hidden
                    />
                    <p className="text-base leading-6 text-text-light/65">
                      Conclua estabelecimento, horários e quadras em{" "}
                      <Link
                        to="/comecar"
                        className="font-semibold text-accent-blue-soft underline-offset-2 hover:underline"
                      >
                        Configuração básica
                      </Link>{" "}
                      para liberar a ativação.
                    </p>
                  </div>
                )}
                <button
                  type="button"
                  disabled={!ready || publishing}
                  onClick={handlePublish}
                  className={buttonClassName({
                    variant: "primary",
                    className: "justify-center",
                  })}
                >
                  {publishing ? "Ativando…" : "Ativar no portal"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RealInfo() {
  const navigate = useNavigate();
  const { loading, withLoading } = useLoading();
  const { notifyError } = useErrors();
  const [publicId, setPublicId] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [isHiddenInactiveHours, setIsHiddenInactiveHours] = useState(false);
  const [info, setInfo] = useState<IInfo | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);

  useEffect(() => {
    if (!getAccessToken()) {
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    const payload = getAccessTokenPayload<{
      companyName?: string;
      companyPublicId?: string;
    }>();
    setPublicId(payload?.companyPublicId || "");
    setCompanyName(payload?.companyName || "");
  }, []);

  useEffect(() => {
    if (!publicId) return;
    withLoading(async () => {
      try {
        const response = await infosByCompanyPublicId(publicId);
        setInfo(response);
        setIsHiddenInactiveHours(
          response?.preferences?.isHiddenInactiveHours || false
        );
        if (response?.companyName) {
          setCompanyName(response.companyName);
        }
      } catch (error) {
        console.error("Erro ao buscar informações da empresa:", error);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- evita loop com withLoading instável
  }, [publicId]);

  const copyToClipboard = async () => {
    if (!info?.link) return;
    try {
      await navigator.clipboard.writeText(info.link);
      setCopyFeedback(true);
      window.setTimeout(() => setCopyFeedback(false), 2000);
    } catch {
      notifyError({
        message: "Não foi possível copiar o link. Tente novamente.",
        type: "error",
      });
    }
  };

  const shareLink = async () => {
    if (!info?.link) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: companyName || "Minha quadra",
          text: companyName ? `Confira ${companyName}` : "Confira a minha página",
          url: info.link,
        });
      } catch {
        // Usuário cancelou — sem alerta agressivo
      }
      return;
    }
    await copyToClipboard();
  };

  const updatePreferences = async (
    isHiddenInactiveHoursInput: boolean
  ): Promise<void> => {
    if (!publicId) {
      notifyError({
        message: "Informações da empresa não disponíveis.",
        type: "error",
      });
      return;
    }
    await withLoading(async () => {
      await updatePreferencesByCompanyPublicId(publicId, {
        isHiddenInactiveHours: isHiddenInactiveHoursInput,
      });
    });
  };

  const primaryBtnClass = buttonClassName({ variant: "primary", size: "md" });
  const secondaryBtnClass = buttonClassName({ variant: "secondary" });

  const isInitialLoading = loading && !info;

  return (
    <AppLayout>
      <section
        className={`mx-auto min-h-0 w-full max-w-lg flex-1 overflow-y-auto bg-master px-4 pb-10 pt-5 text-text-light transition-opacity lg:max-w-5xl lg:px-8 lg:pt-6 ${
          loading && info ? "opacity-80" : ""
        }`}
        aria-busy={loading}
      >
        <PageEyebrow className="mb-5">Minhas informações</PageEyebrow>

        {isInitialLoading ? (
          <div
            className="animate-pulse space-y-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0"
            aria-label="Carregando informações"
          >
            <div className="h-28 rounded-2xl bg-master-light/70 lg:col-span-2" />
            <div className="h-40 rounded-2xl bg-master-light/70 lg:col-span-2" />
            <div className="h-36 rounded-2xl bg-master-light/70" />
            <div className="h-32 rounded-2xl bg-master-light/70" />
          </div>
        ) : (
          <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
            <div className="rounded-2xl bg-master-light px-4 py-5 lg:col-span-2 lg:px-6">
              <p className="text-base font-medium text-text-light/70">
                Empresa
              </p>
              <p className="mt-1 text-2xl font-bold leading-snug text-text-light">
                {companyName || info?.companyName || "—"}
              </p>
            </div>

            <div className="rounded-2xl bg-master-light p-4 sm:p-5 lg:col-span-2 lg:p-6">
              <p className="mb-3 text-lg font-semibold text-text-light">
                Página pública
              </p>
              <p className="mb-4 break-all text-base leading-6 text-text-light/70">
                {info?.link || "Link não disponível"}
              </p>
              <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap">
                <button
                  type="button"
                  onClick={shareLink}
                  disabled={!info?.link}
                  className={`${primaryBtnClass} lg:w-auto lg:min-w-[12rem]`}
                >
                  <MdShare size={20} aria-hidden />
                  Compartilhar link
                </button>
                <a
                  href={info?.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${secondaryBtnClass} lg:w-auto lg:min-w-[12rem]`}
                  aria-disabled={!info?.link}
                  onClick={(e) => {
                    if (!info?.link) e.preventDefault();
                  }}
                >
                  <MdOpenInNew size={20} aria-hidden />
                  Abrir minha página
                </a>
                <button
                  type="button"
                  onClick={copyToClipboard}
                  disabled={!info?.link}
                  className={`${secondaryBtnClass} lg:w-auto lg:min-w-[12rem]`}
                >
                  <MdContentCopy size={20} aria-hidden />
                  {copyFeedback ? "Link copiado!" : "Copiar link"}
                </button>
              </div>
            </div>

            <div className="rounded-2xl bg-master-light p-4 sm:p-5 lg:p-6">
              <p className="mb-3 text-lg font-semibold text-text-light">
                Preferências
              </p>
              <label
                htmlFor="is-hidden-inactive-hours"
                className={`flex min-h-16 cursor-pointer items-center justify-between gap-3 rounded-xl px-4 py-3.5 transition focus-within:ring-2 focus-within:ring-accent-blue/80 ${
                  isHiddenInactiveHours
                    ? "bg-accent-blue/15 ring-2 ring-accent-blue/70"
                    : "bg-master"
                }`}
              >
                <span className="text-lg font-medium text-text-light">
                  Ocultar horários inativos
                </span>
                <input
                  type="checkbox"
                  id="is-hidden-inactive-hours"
                  checked={isHiddenInactiveHours}
                  onChange={async (e) => {
                    const next = e.target.checked;
                    setIsHiddenInactiveHours(next);
                    await updatePreferences(next);
                  }}
                  className="size-7 shrink-0 rounded accent-accent-blue"
                />
              </label>
              <div className="mt-3 flex items-start gap-2 px-1">
                <MdOutlineInfo
                  size={20}
                  className="mt-0.5 shrink-0 text-text-light/55"
                  aria-hidden
                />
                <p className="text-base leading-6 text-text-light/65">
                  Na agenda, mostram só horários disponíveis, reservados e
                  fixos.
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-master-light p-4 sm:p-5 lg:p-6">
              <p className="mb-3 text-lg font-semibold text-text-light">
                Plano
              </p>
              <p className="text-xl font-bold text-text-light">
                {info?.plan?.name || "—"}
              </p>
              <dl className="mt-4 space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
                <div>
                  <dt className="text-base font-medium text-text-light/70">
                    Valor mensal
                  </dt>
                  <dd className="mt-0.5 text-lg font-semibold text-text-light">
                    {info?.plan?.price != null
                      ? `${formatCurrencyBRL(Number(info.plan.price))}/mês`
                      : "—"}
                  </dd>
                </div>
                {info?.plan?.day_due != null && (
                  <div>
                    <dt className="text-base font-medium text-text-light/70">
                      Vencimento
                    </dt>
                    <dd className="mt-0.5 text-lg font-semibold text-text-light">
                      Dia {info.plan.day_due} de cada mês
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        )}
      </section>
    </AppLayout>
  );
}

function Info() {
  const hasJwt = Boolean(getAccessToken());
  const mockSession = isMockSession() && Boolean(getMockOnboarding());

  if (hasJwt) return <RealInfo />;
  if (mockSession) return <MockInfo />;
  return <RealInfo />;
}

export default Info;
