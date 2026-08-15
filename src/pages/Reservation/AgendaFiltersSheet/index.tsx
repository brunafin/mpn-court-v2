import { useEffect, useId } from "react";
import { BsX } from "react-icons/bs";

export type AgendaPeriodFilter = "" | "morning" | "afternoon" | "evening";

export const AGENDA_PERIOD_OPTIONS: {
  label: string;
  value: AgendaPeriodFilter;
}[] = [
  { label: "Qualquer horário", value: "" },
  { label: "Manhã", value: "morning" },
  { label: "Tarde", value: "afternoon" },
  { label: "Noite", value: "evening" },
];

/** Mesmos intervalos do site público. */
export function hourInAgendaPeriod(
  startHour: string,
  period: AgendaPeriodFilter,
): boolean {
  if (!period) return true;
  const hour = Number.parseInt(startHour.slice(0, 2), 10);
  if (Number.isNaN(hour)) return true;
  if (period === "morning") return hour >= 5 && hour < 12;
  if (period === "afternoon") return hour >= 12 && hour < 18;
  if (period === "evening") return hour >= 18 || hour < 5;
  return true;
}

export function agendaPeriodLabel(period: AgendaPeriodFilter): string {
  return (
    AGENDA_PERIOD_OPTIONS.find((option) => option.value === period)?.label ??
    "Qualquer horário"
  );
}

type AgendaFiltersSheetProps = {
  open: boolean;
  sports: string[];
  showSportSection: boolean;
  selectedSport: string;
  selectedPeriod: AgendaPeriodFilter;
  onSelectSport: (sport: string) => void;
  onSelectPeriod: (period: AgendaPeriodFilter) => void;
  onClose: () => void;
};

function AgendaFiltersSheet({
  open,
  sports,
  showSportSection,
  selectedSport,
  selectedPeriod,
  onSelectSport,
  onSelectPeriod,
  onClose,
}: AgendaFiltersSheetProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const optionClass = (selected: boolean) =>
    `mpn-tap flex min-h-12 w-full items-center rounded-xl px-4 text-left text-base font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue ${
      selected
        ? "bg-accent-blue/20 text-text-light ring-1 ring-inset ring-accent-blue/50"
        : "bg-master text-text-light/80 hover:bg-master/80"
    }`;

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-end justify-center sm:items-center sm:p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/55"
        aria-label="Fechar"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex h-[100dvh] w-full max-w-lg flex-col bg-master-light text-text-light sm:h-auto sm:max-h-[90dvh] sm:rounded-2xl"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-text-light/10 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:pt-3">
          <h2 id={titleId} className="text-lg font-semibold">
            Filtros
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="mpn-tap flex size-10 items-center justify-center rounded-xl text-text-light/70 hover:bg-text-light/10"
            aria-label="Fechar"
          >
            <BsX size={28} aria-hidden />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {showSportSection ? (
            <section aria-label="Esporte">
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-text-light/50">
                Esporte
              </h3>
              <div className="space-y-2">
                <button
                  type="button"
                  aria-pressed={!selectedSport}
                  className={optionClass(!selectedSport)}
                  onClick={() => onSelectSport("")}
                >
                  Todos
                </button>
                {sports.map((sport) => {
                  const selected = selectedSport === sport;
                  return (
                    <button
                      key={sport}
                      type="button"
                      aria-pressed={selected}
                      className={optionClass(selected)}
                      onClick={() => onSelectSport(sport)}
                    >
                      {sport}
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}

          <section aria-label="Horário">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-text-light/50">
              Horário
            </h3>
            <div className="space-y-2">
              {AGENDA_PERIOD_OPTIONS.map((option) => {
                const selected = selectedPeriod === option.value;
                return (
                  <button
                    key={option.value || "any"}
                    type="button"
                    aria-pressed={selected}
                    className={optionClass(selected)}
                    onClick={() => onSelectPeriod(option.value)}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default AgendaFiltersSheet;
