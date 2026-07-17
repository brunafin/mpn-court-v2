import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import {
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

function Info() {
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
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <Header />
      <section
        className={`mx-auto min-h-0 w-full max-w-lg flex-1 overflow-y-auto bg-master px-4 pb-10 pt-5 text-text-light transition-opacity ${
          loading && info ? "opacity-80" : ""
        }`}
        aria-busy={loading}
      >
        <PageEyebrow className="mb-5">Minhas informações</PageEyebrow>

        {isInitialLoading ? (
          <div
            className="animate-pulse space-y-4"
            aria-label="Carregando informações"
          >
            <div className="h-28 rounded-2xl bg-master-light/70" />
            <div className="h-40 rounded-2xl bg-master-light/70" />
            <div className="h-36 rounded-2xl bg-master-light/70" />
            <div className="h-32 rounded-2xl bg-master-light/70" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl bg-master-light px-4 py-5">
              <p className="text-base font-medium text-text-light/70">
                Empresa
              </p>
              <p className="mt-1 text-2xl font-bold leading-snug text-text-light">
                {companyName || info?.companyName || "—"}
              </p>
            </div>

            <div className="rounded-2xl bg-master-light p-4 sm:p-5">
              <p className="mb-3 text-lg font-semibold text-text-light">
                Página pública
              </p>
              <p className="mb-4 break-all text-base leading-6 text-text-light/70">
                {info?.link || "Link não disponível"}
              </p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={shareLink}
                  disabled={!info?.link}
                  className={primaryBtnClass}
                >
                  <MdShare size={20} aria-hidden />
                  Compartilhar link
                </button>
                <a
                  href={info?.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={secondaryBtnClass}
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
                  className={secondaryBtnClass}
                >
                  <MdContentCopy size={20} aria-hidden />
                  {copyFeedback ? "Link copiado!" : "Copiar link"}
                </button>
              </div>
            </div>

            <div className="rounded-2xl bg-master-light p-4 sm:p-5">
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

            <div className="rounded-2xl bg-master-light p-4 sm:p-5">
              <p className="mb-3 text-lg font-semibold text-text-light">
                Plano
              </p>
              <p className="text-xl font-bold text-text-light">
                {info?.plan?.name || "—"}
              </p>
              <dl className="mt-4 space-y-3">
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
    </div>
  );
}

export default Info;
