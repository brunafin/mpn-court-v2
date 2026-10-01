import { useEffect, useId, type ReactNode } from "react";
import { BsX } from "react-icons/bs";
import {
  MdCheck,
  MdOutlineDarkMode,
  MdOutlineSchedule,
  MdOutlineWbSunny,
  MdOutlineWbTwilight,
} from "react-icons/md";
import type { IconType } from "react-icons";
import { ReservationStatusEnum } from "../enum";
import { StatusIcons } from "../statusIcons";

export type AgendaPeriodFilter = "" | "morning" | "afternoon" | "evening";

export const AGENDA_PERIOD_OPTIONS: {
  label: string;
  value: AgendaPeriodFilter;
}[] = [
  { label: "Todos", value: "" },
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
    "Todos"
  );
}

const STATUS_OPTIONS: {
  label: string;
  value: ReservationStatusEnum | null;
  Icon?: IconType;
  iconClass?: string;
  selectedClass?: string;
}[] = [
  { label: "Todos", value: null },
  {
    label: "Disponível",
    value: ReservationStatusEnum.AVAILABLE,
    Icon: StatusIcons.available,
    iconClass: "bg-accent-green/15 text-accent-green",
    selectedClass: "bg-accent-green/20 text-accent-green ring-accent-green/50",
  },
  {
    label: "Reservado",
    value: ReservationStatusEnum.RESERVED,
    Icon: StatusIcons.reserved,
    iconClass: "bg-accent-blue/15 text-accent-blue-soft",
    selectedClass:
      "bg-accent-blue/20 text-accent-blue-soft ring-accent-blue/50",
  },
  {
    label: "Fixo",
    value: ReservationStatusEnum.FIXED,
    Icon: StatusIcons.fixed,
    iconClass: "bg-accent-purple/15 text-accent-purple-soft",
    selectedClass:
      "bg-accent-purple/20 text-accent-purple-soft ring-accent-purple/50",
  },
  {
    label: "Inativo",
    value: ReservationStatusEnum.INACTIVE,
    Icon: StatusIcons.inactive,
    iconClass: "bg-danger-400/15 text-danger-soft",
    selectedClass: "bg-danger-400/20 text-danger-soft ring-danger-soft/50",
  },
];

const PERIOD_VISUAL: {
  value: AgendaPeriodFilter;
  hint: string;
  Icon: IconType;
}[] = [
  { value: "", hint: "O dia inteiro", Icon: MdOutlineSchedule },
  { value: "morning", hint: "5h–12h", Icon: MdOutlineWbSunny },
  { value: "afternoon", hint: "12h–18h", Icon: MdOutlineWbTwilight },
  { value: "evening", hint: "18h–5h", Icon: MdOutlineDarkMode },
];

export function agendaStatusLabel(
  status: ReservationStatusEnum | null,
): string | null {
  if (!status) return null;
  return STATUS_OPTIONS.find((option) => option.value === status)?.label ?? null;
}

type AgendaFiltersSheetProps = {
  open: boolean;
  sports: string[];
  showSportSection: boolean;
  selectedStatus: ReservationStatusEnum | null;
  selectedSport: string;
  selectedPeriod: AgendaPeriodFilter;
  onSelectStatus: (status: ReservationStatusEnum | null) => void;
  onSelectSport: (sport: string) => void;
  onSelectPeriod: (period: AgendaPeriodFilter) => void;
  onClose: () => void;
};

function AgendaFiltersSheet({
  open,
  sports,
  showSportSection,
  selectedStatus,
  selectedSport,
  selectedPeriod,
  onSelectStatus,
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

  const activeLabels = [
    agendaStatusLabel(selectedStatus),
    selectedSport || null,
    selectedPeriod ? agendaPeriodLabel(selectedPeriod) : null,
  ].filter(Boolean) as string[];

  const clearFilters = () => {
    onSelectStatus(null);
    onSelectSport("");
    onSelectPeriod("");
  };

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-end justify-center sm:items-center sm:p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/75"
        aria-label="Fechar"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[min(85dvh,40rem)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-master text-text-light shadow-2xl sm:rounded-2xl"
      >
        <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-text-light/20 sm:hidden" />
        <div className="flex shrink-0 items-start justify-between gap-4 px-5 pb-5 pt-5">
          <div className="min-w-0">
            <h2 id={titleId} className="text-xl font-semibold leading-7">
              Filtros
            </h2>
            <p className="mt-1 text-base text-text-light/70">
              {activeLabels.length > 0
                ? activeLabels.join(" · ")
                : "Nenhum filtro ativo"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mpn-tap-solid flex size-11 shrink-0 items-center justify-center rounded-full bg-master-light text-text-light/70"
            aria-label="Fechar"
          >
            <BsX size={24} aria-hidden />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-8 overflow-y-auto px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <section aria-label="Status">
            <SectionLabel>Status</SectionLabel>
            <div className="flex flex-wrap gap-2.5">
              {STATUS_OPTIONS.map((option) => (
                <ChoiceChip
                  key={option.label}
                  selected={selectedStatus === option.value}
                  label={option.label}
                  selectedClass={option.selectedClass}
                  onClick={() => onSelectStatus(option.value)}
                  icon={
                    option.Icon ? (
                      <span
                        className={`flex size-7 items-center justify-center rounded-full ${option.iconClass}`}
                      >
                        <option.Icon size={16} aria-hidden />
                      </span>
                    ) : undefined
                  }
                />
              ))}
            </div>
          </section>

          <section aria-label="Horário">
            <SectionLabel>Horário</SectionLabel>
            <div className="grid grid-cols-2 gap-3">
              {PERIOD_VISUAL.map((option) => {
                const selected = selectedPeriod === option.value;
                const label =
                  AGENDA_PERIOD_OPTIONS.find(
                    (item) => item.value === option.value,
                  )?.label ?? option.hint;
                return (
                  <button
                    key={option.value || "any"}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onSelectPeriod(option.value)}
                    className={`mpn-tap flex min-h-[4.75rem] items-center gap-3 rounded-xl px-3.5 py-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue ${
                      selected
                        ? "bg-accent-blue/20 text-text-light ring-1 ring-inset ring-accent-blue/50"
                        : "bg-master-light text-text-light/70 hover:bg-text-light/10"
                    }`}
                  >
                    <span
                      className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
                        selected
                          ? "bg-accent-blue text-text-light"
                          : "bg-accent-blue/15 text-accent-blue-soft"
                      }`}
                    >
                      <option.Icon size={18} aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-base font-semibold">
                        {label}
                      </span>
                      <span className="block text-base text-text-light/55">
                        {option.hint}
                      </span>
                    </span>
                    {selected ? (
                      <MdCheck className="ml-auto shrink-0" size={18} aria-hidden />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </section>

          {showSportSection ? (
            <section aria-label="Esporte">
              <SectionLabel>Esporte</SectionLabel>
              <div className="flex flex-wrap gap-2.5">
                <ChoiceChip
                  selected={!selectedSport}
                  label="Todos"
                  onClick={() => onSelectSport("")}
                />
                {sports.map((sport) => (
                  <ChoiceChip
                    key={sport}
                    selected={selectedSport === sport}
                    label={sport}
                    onClick={() => onSelectSport(sport)}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {activeLabels.length > 0 ? (
            <button
              type="button"
              onClick={clearFilters}
              className="mpn-tap text-base font-semibold text-accent-blue-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
            >
              Limpar filtros
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-3 text-base font-semibold uppercase tracking-wider text-text-light/55">
      {children}
    </h3>
  );
}

function ChoiceChip({
  selected,
  label,
  onClick,
  icon,
  selectedClass = "bg-accent-blue/20 text-text-light ring-accent-blue/50",
}: {
  selected: boolean;
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  selectedClass?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`mpn-tap inline-flex min-h-11 items-center gap-2 rounded-full text-base font-semibold ring-1 ring-inset transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue ${
        icon ? "py-1 pl-1.5 pr-3" : "px-3.5"
      } ${
        selected
          ? selectedClass
          : "bg-master-light text-text-light/70 ring-transparent hover:bg-text-light/10"
      }`}
    >
      {icon}
      {label}
      {selected ? <MdCheck size={16} aria-hidden /> : null}
    </button>
  );
}

export default AgendaFiltersSheet;
