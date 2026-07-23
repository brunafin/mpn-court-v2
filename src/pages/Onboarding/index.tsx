import { useEffect, useMemo, useRef, useState } from "react";
import { AxiosError, isCancel } from "axios";
import { Link, useNavigate } from "react-router-dom";
import {
  MdCheckCircle,
  MdOutlineCalendarMonth,
  MdOutlineCircle,
} from "react-icons/md";
import Button, { buttonClassName } from "../../components/Button";
import OnboardingFooter from "../../components/OnboardingFooter";
import {
  buildChecklist,
  buildWeekTemplatePayload,
  clearMockOnboarding,
  courtSportLabel,
  getOnboardingProgress,
  getOrCreateOnboardingDraft,
  isEstablishmentReady,
  MockOnboardingState,
} from "../../onboarding/mockStore";
import { completeOnboarding } from "../../api/onboarding";
import { uploadCompanyLogo } from "../../api/companies";
import {
  getAccessToken,
  getAccessTokenPayload,
  setAccessToken,
} from "../../utils/authCookie";
import { getPendingLogoFile } from "../../onboarding/pendingLogo";
import { formatCepForStorage } from "../../utils/formatCep";

function OnboardingChecklist() {
  const navigate = useNavigate();
  const [state, setState] = useState<MockOnboardingState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const submittingRef = useRef(false);

  useEffect(() => {
    if (!getAccessToken()) {
      navigate("/");
      return;
    }
    const payload = getAccessTokenPayload<{
      companyPublicId?: string | null;
      username?: string;
    }>();
    if (payload?.companyPublicId) {
      navigate("/reservas");
      return;
    }
    setState(getOrCreateOnboardingDraft({ email: payload?.username }));
  }, [navigate]);

  const items = useMemo(
    () => (state ? buildChecklist(state) : []),
    [state]
  );
  const progress = useMemo(
    () => (state ? getOnboardingProgress(state) : { done: 0, total: 1 }),
    [state]
  );
  const ready = state ? isEstablishmentReady(state) : false;

  const handleFinish = async () => {
    if (!state || !state.scheduleTemplate || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitError("");
    setSubmitting(true);
    try {
      const response = await completeOnboarding({
        companyName: state.arenaName.trim(),
        companyPhone: state.companyPhone?.replace(/\D/g, "") || undefined,
        cep: formatCepForStorage(state.cep),
        street: state.street.trim(),
        number: state.number.trim(),
        neighborhood: state.neighborhood.trim(),
        city: state.city.trim(),
        uf: state.uf.trim().toUpperCase(),
        weekTemplate: buildWeekTemplatePayload(state.scheduleTemplate),
        courts: state.courts.slice(0, state.courtCount).map((court) => ({
          name: court.name,
          sports: court.sports.map((key) => courtSportLabel(key)),
          floor: court.floor as string,
          price: court.defaultPrice,
        })),
      });
      setAccessToken(response.access_token);

      const pendingLogo = getPendingLogoFile();
      if (pendingLogo) {
        try {
          await uploadCompanyLogo(response.companyPublicId, pendingLogo);
        } catch (logoError) {
          console.error(logoError);
        }
      }

      clearMockOnboarding();
      navigate("/reservas", { state: { showActivateGuide: true } });
    } catch (error) {
      if (isCancel(error)) {
        setSubmitError(
          "A conexão foi interrompida. Toque de novo — se o estabelecimento já foi criado, vamos liberar a agenda."
        );
      } else {
        const axiosError = error as AxiosError<{ message?: string | string[] }>;
        const message =
          axiosError?.response?.data?.message ||
          (axiosError.code === "ECONNABORTED"
            ? "A requisição demorou demais. Toque de novo para continuar."
            : "Não foi possível concluir a configuração. Tente novamente.");
        setSubmitError(
          Array.isArray(message) ? message.join(" ") : String(message)
        );
      }
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  if (!state) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-master text-text-light/70">
        Carregando…
      </div>
    );
  }

  return (
    <div className="relative min-h-dvh bg-master px-4 py-6 text-text-light lg:h-full lg:min-h-0 lg:overflow-y-auto">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(37,84,160,0.14),_transparent_50%)]" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-lg flex-col lg:min-h-full">
        <p className="mb-4 rounded-lg bg-master-light px-3 py-2 text-sm font-medium text-text-light/70">
          Complete os passos abaixo para começar a usar a agenda
        </p>

        {!ready ? (
          <>
            <div className="mb-5">
              <div className="mb-2 flex items-center justify-between text-sm text-text-light/60">
                <span>Progresso</span>
                <span>
                  {progress.done}/{progress.total}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-master-light">
                <div
                  className="h-full rounded-full bg-accent-blue transition-all"
                  style={{
                    width: `${(progress.done / Math.max(progress.total, 1)) * 100}%`,
                  }}
                />
              </div>
            </div>

            <ul className="flex flex-col gap-3">
              {items.map((item) => (
                <li
                  key={item.id}
                  className={`rounded-2xl bg-master-light p-4 ${
                    item.locked ? "opacity-50" : ""
                  }`}
                  aria-disabled={item.locked || undefined}
                >
                  <div className="flex gap-3">
                    <div className="shrink-0 pt-0.5">
                      {item.done ? (
                        <MdCheckCircle
                          size={26}
                          className="text-accent-green"
                          aria-label="Concluído"
                        />
                      ) : (
                        <MdOutlineCircle
                          size={26}
                          className="text-text-light/35"
                          aria-label={item.locked ? "Bloqueado" : "Pendente"}
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg font-semibold text-text-light">
                        {item.title}
                      </h2>
                      <p className="mt-0.5 text-base leading-6 text-text-light/65">
                        {item.description}
                      </p>
                      {!item.locked && item.to && (
                        <Link
                          to={item.to}
                          className={buttonClassName({
                            variant: item.done ? "secondary" : "primary",
                            size: "md",
                            className: "mt-3",
                          })}
                        >
                          {item.actionLabel}
                        </Link>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="rounded-2xl bg-master-light p-5">
            <div className="text-center">
              <p className="text-lg font-medium text-text-light">Tudo pronto</p>
              <p className="mt-2 text-base leading-6 text-text-light/65">
                Você já pode usar a agenda
              </p>
              <Button
                type="button"
                variant="primary"
                className="mt-5 h-auto min-h-14 justify-center whitespace-normal px-3 py-3 text-center leading-snug"
                disabled={submitting}
                onClick={handleFinish}
              >
                <MdOutlineCalendarMonth
                  size={22}
                  className="shrink-0"
                  aria-hidden
                />
                <span>
                  {submitting
                    ? "Criando estrutura…"
                    : "Concluir e ir para a agenda"}
                </span>
              </Button>
              {submitting && (
                <p
                  className="mt-3 text-center text-sm leading-5 text-text-light/60"
                  role="status"
                  aria-live="polite"
                >
                  Isso pode levar alguns segundos enquanto montamos a agenda e
                  toda a estrutura do estabelecimento.
                </p>
              )}
              {submitError && (
                <p
                  className="mt-2 text-center text-sm text-danger-400"
                  role="alert"
                >
                  {submitError}
                </p>
              )}
            </div>
            <ul className="mt-4 flex flex-col gap-2 border-t border-text-light/10 pt-4">
              {items.map((item) => (
                <li key={item.id}>
                  <Link
                    to={item.to || "/comecar"}
                    className="mpn-tap flex min-h-12 items-center justify-between rounded-xl px-3 text-base font-semibold text-text-light"
                  >
                    <span>{item.title}</span>
                    <span className="text-sm font-medium text-accent-blue-soft">
                      Editar
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <OnboardingFooter />
      </div>
    </div>
  );
}

export default OnboardingChecklist;
