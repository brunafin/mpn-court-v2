import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MdCheckCircle,
  MdOutlineCalendarMonth,
  MdOutlineCircle,
} from "react-icons/md";
import { buttonClassName } from "../../components/Button";
import EmptyState from "../../components/EmptyState";
import OnboardingFooter from "../../components/OnboardingFooter";
import {
  buildChecklist,
  clearMockOnboarding,
  getMockOnboarding,
  getOnboardingProgress,
  isEstablishmentReady,
  isMockSession,
  MockOnboardingState,
} from "../../onboarding/mockStore";

function OnboardingChecklist() {
  const navigate = useNavigate();
  const [state, setState] = useState<MockOnboardingState | null>(null);

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
    navigate("/cadastro");
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
          Protótipo — progresso salvo só neste navegador
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
                  <Link
                    to="/reservas"
                    className={buttonClassName({
                      variant: "primary",
                      className: "justify-center",
                    })}
                  >
                    <MdOutlineCalendarMonth size={22} aria-hidden />
                    Ir para a agenda
                  </Link>
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
