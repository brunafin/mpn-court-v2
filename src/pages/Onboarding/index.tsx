import { useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import { Link, useNavigate } from "react-router-dom";
import {
  MdCheckCircle,
  MdOutlineCalendarMonth,
  MdOutlineCircle,
} from "react-icons/md";
import Button, { buttonClassName } from "../../components/Button";
import EmptyState from "../../components/EmptyState";
import OnboardingFooter from "../../components/OnboardingFooter";
import {
  buildChecklist,
  buildWeekTemplatePayload,
  clearMockOnboarding,
  getOnboardingProgress,
  getOrCreateOnboardingDraft,
  isEstablishmentReady,
  MockOnboardingState,
} from "../../onboarding/mockStore";
import { completeOnboarding } from "../../api/onboarding";
import {
  getAccessToken,
  getAccessTokenPayload,
  setAccessToken,
} from "../../utils/authCookie";

function OnboardingChecklist() {
  const navigate = useNavigate();
  const [state, setState] = useState<MockOnboardingState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

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

  const handleReset = () => {
    clearMockOnboarding();
    navigate("/comecar");
  };

  const handleFinish = async () => {
    if (!state || !state.scheduleTemplate || submitting) return;
    setSubmitError("");
    setSubmitting(true);
    try {
      const response = await completeOnboarding({
        companyName: state.arenaName.trim(),
        companyPhone: state.ownerPhone || undefined,
        weekTemplate: buildWeekTemplatePayload(state.scheduleTemplate),
        courts: state.courts.slice(0, state.courtCount).map((court) => ({
          name: court.name,
          type_of_court_id: court.typeOfCourtId as number,
          sport_ids: court.sportIds,
          floor: court.floor,
          price: court.defaultPrice,
        })),
      });
      setAccessToken(response.access_token);
      clearMockOnboarding();
      navigate("/reservas");
    } catch (error) {
      const message =
        (error as AxiosError<{ message?: string }>)?.response?.data?.message ||
        "Não foi possível concluir a configuração. Tente novamente.";
      setSubmitError(message);
    } finally {
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
    <div className="min-h-dvh bg-master px-4 py-6 text-text-light">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(61,111,184,0.14),_transparent_50%)]" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-lg flex-col">
        <p className="mb-4 rounded-lg bg-warning-500/15 px-3 py-2 text-sm font-medium text-warning-500">
          Progresso salvo neste navegador até você concluir a configuração
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
            <EmptyState
              title="Tudo pronto"
              description="Você já pode usar a agenda"
              className="min-h-0 py-4"
              action={
                <div className="flex w-full flex-col gap-2">
                  <Button
                    type="button"
                    variant="primary"
                    className="justify-center"
                    disabled={submitting}
                    onClick={handleFinish}
                  >
                    <MdOutlineCalendarMonth size={22} aria-hidden />
                    {submitting ? "Concluindo…" : "Concluir e ir para a agenda"}
                  </Button>
                  {submitError && (
                    <p
                      className="text-center text-sm text-danger-400"
                      role="alert"
                    >
                      {submitError}
                    </p>
                  )}
                </div>
              }
            />
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

        <OnboardingFooter
          secondary={
            <button
              type="button"
              onClick={handleReset}
              className="text-sm font-medium text-text-light/40 underline-offset-2 hover:underline"
            >
              Apagar conta mock e recomeçar
            </button>
          }
        />
      </div>
    </div>
  );
}

export default OnboardingChecklist;
