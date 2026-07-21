import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MdCheck, MdChevronLeft, MdChevronRight } from "react-icons/md";
import Button, { buttonClassName } from "../../../components/Button";
import {
  WEEK_DAYS,
  WeekDayKey,
  WeekScheduleTemplate,
  ScheduleHourSlot,
  buildEmptyWeekTemplate,
  getMockOnboarding,
  isArenaConfigured,
  isMockSession,
  normalizeWeekTemplate,
  updateMockOnboarding,
} from "../../../onboarding/mockStore";

function OnboardingSchedule() {
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);
  const [template, setTemplate] = useState<WeekScheduleTemplate>(() =>
    buildEmptyWeekTemplate(0)
  );
  const [ready, setReady] = useState(false);

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
    if (!isArenaConfigured(mock)) {
      navigate("/comecar/estabelecimento");
      return;
    }

    if (mock.scheduleTemplate) {
      setTemplate(normalizeWeekTemplate(mock.scheduleTemplate));
    } else {
      setTemplate(buildEmptyWeekTemplate(0));
    }
    setReady(true);
  }, [navigate]);

  const dayMeta = WEEK_DAYS[stepIndex];
  const daySlots = template.days[dayMeta.key];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === WEEK_DAYS.length - 1;
  const enabledCount = daySlots.filter((s) => s.enabled).length;

  const updateDaySlots = (
    dayKey: WeekDayKey,
    updater: (slots: ScheduleHourSlot[]) => ScheduleHourSlot[]
  ) => {
    setTemplate((prev) => ({
      ...prev,
      days: {
        ...prev.days,
        [dayKey]: updater(prev.days[dayKey].map((s) => ({ ...s }))),
      },
    }));
  };

  const handleToggle = (hour: string) => {
    updateDaySlots(dayMeta.key, (slots) =>
      slots.map((slot) =>
        slot.hour === hour ? { ...slot, enabled: !slot.enabled } : slot
      )
    );
  };

  const handleSelectAll = (enabled: boolean) => {
    updateDaySlots(dayMeta.key, (slots) =>
      slots.map((slot) => ({ ...slot, enabled }))
    );
  };

  const handleBack = () => {
    if (isFirst) {
      navigate("/comecar");
      return;
    }
    setStepIndex((i) => i - 1);
  };

  const handleNextOrSave = () => {
    if (!isLast) {
      setStepIndex((i) => i + 1);
      return;
    }

    updateMockOnboarding({
      hasScheduleTemplate: true,
      scheduleTemplate: normalizeWeekTemplate(template),
    });
    navigate("/comecar");
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-master text-text-light/70">
        Carregando…
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-master pb-28 text-text-light">
      <div className="mx-auto w-full max-w-lg px-4 pt-6">
        <div className="-ml-2 flex items-center gap-1">
          <Link
            to="/comecar"
            aria-label="Voltar"
            className="mpn-tap flex size-11 shrink-0 items-center justify-center rounded-xl text-text-light/80"
          >
            <MdChevronLeft size={28} aria-hidden />
          </Link>
          <h1 className="min-w-0 truncate text-2xl font-bold tracking-tight">
            Horário de funcionamento
          </h1>
        </div>
        <p className="mt-3 rounded-lg bg-warning-500/15 px-3 py-2 text-sm font-medium text-warning-500">
          Mock — grade de horários; o preço fica em cada quadra
        </p>
      </div>

      <div className="sticky top-0 z-10 border-b border-text-light/10 bg-master/95 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto w-full max-w-lg">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-text-light/55">
                Passo {stepIndex + 1} de {WEEK_DAYS.length}
              </p>
              <h2 className="text-xl font-bold uppercase tracking-tight text-text-light">
                {dayMeta.label}
              </h2>
            </div>
            <p className="text-sm font-medium text-text-light/65">
              {enabledCount} horário{enabledCount === 1 ? "" : "s"}
            </p>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => handleSelectAll(true)}
              className="mpn-tap flex min-h-11 flex-1 items-center justify-center rounded-xl bg-master-light px-3 text-sm font-semibold text-text-light"
            >
              Marcar todos
            </button>
            <button
              type="button"
              onClick={() => handleSelectAll(false)}
              className="mpn-tap flex min-h-11 flex-1 items-center justify-center rounded-xl bg-master-light px-3 text-sm font-semibold text-text-light"
            >
              Desmarcar todos
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-lg px-4 pt-4">
        <ul className="space-y-2" aria-label={`Horários de ${dayMeta.label}`}>
          {daySlots.map((slot) => (
            <li key={slot.hour}>
              <label
                className={`mpn-tap flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl px-3 py-2 ${
                  slot.enabled ? "bg-master-light" : "bg-master-light/50"
                }`}
              >
                <span
                  className={`flex size-7 shrink-0 items-center justify-center rounded-md border-2 ${
                    slot.enabled
                      ? "border-accent-blue bg-accent-blue text-white"
                      : "border-text-light/35 bg-master"
                  }`}
                  aria-hidden
                >
                  {slot.enabled && <MdCheck size={18} />}
                </span>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={slot.enabled}
                  onChange={() => handleToggle(slot.hour)}
                />
                <span
                  className={`text-lg font-bold tabular-nums ${
                    slot.enabled ? "text-text-light" : "text-text-light/45"
                  }`}
                >
                  {slot.hour}
                </span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-text-light/10 bg-master/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-lg gap-3">
          <button
            type="button"
            onClick={handleBack}
            className={buttonClassName({
              variant: "ghost",
              size: "lg",
              className: "flex-1 justify-center bg-master-light",
            })}
          >
            <MdChevronLeft size={22} aria-hidden />
            {isFirst ? "Checklist" : "Anterior"}
          </button>
          <Button
            type="button"
            variant="primary"
            className="flex-1"
            onClick={handleNextOrSave}
          >
            {isLast ? (
              "Salvar grade"
            ) : (
              <>
                Próximo
                <MdChevronRight size={22} aria-hidden />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default OnboardingSchedule;
