import { MdFilterList, MdNotInterested } from "react-icons/md";
import { ReservationStatusEnum } from "../enum";
import { StatusIcons } from "../statusIcons";

interface LegendProps {
  statusSelected: ReservationStatusEnum | null;
  setStatusSelected: (status: ReservationStatusEnum | null) => void;
  courtsNameList: string[];
  courtSelected: string;
  setCourtSelected: (court: string) => void;
}

const STATUS_OPTIONS: {
  value: ReservationStatusEnum | null;
  label: string;
  iconWrapClass: string;
  Icon?: (typeof StatusIcons)[keyof typeof StatusIcons];
}[] = [
  {
    value: null,
    label: "Todos",
    iconWrapClass: "bg-text-light/10 text-text-light/80",
  },
  {
    value: ReservationStatusEnum.AVAILABLE,
    label: "Disponível",
    iconWrapClass: "bg-accent-green/15 text-accent-green",
    Icon: StatusIcons.available,
  },
  {
    value: ReservationStatusEnum.RESERVED,
    label: "Reservado",
    iconWrapClass: "bg-accent-blue/15 text-accent-blue",
    Icon: StatusIcons.reserved,
  },
  {
    value: ReservationStatusEnum.FIXED,
    label: "Fixo",
    iconWrapClass: "bg-accent-purple/15 text-accent-purple-soft",
    Icon: StatusIcons.fixed,
  },
  {
    value: ReservationStatusEnum.INACTIVE,
    label: "Inativo",
    iconWrapClass: "bg-danger-400/15 text-danger-400",
    Icon: MdNotInterested,
  },
];

function LegendAndFilters({
  setStatusSelected,
  statusSelected,
  courtsNameList,
  courtSelected,
  setCourtSelected,
}: LegendProps) {
  const hasCourts = courtsNameList.length > 1;
  const hasActiveFilter =
    statusSelected !== null || (hasCourts && courtSelected !== "all");

  const clearFilters = () => {
    setStatusSelected(null);
    setCourtSelected("all");
  };

  const chipClass = (
    selected: boolean,
    tone: "neutral" | "green" | "blue" | "purple" | "danger" = "neutral"
  ) => {
    const tones = {
      neutral: selected
        ? "bg-text-light/12 text-text-light ring-text-light/25"
        : "bg-master text-text-light/75 ring-transparent hover:bg-master/80 hover:text-text-light",
      green: selected
        ? "bg-accent-green/15 text-accent-green ring-accent-green/45"
        : "bg-master text-text-light/75 ring-transparent hover:bg-accent-green/10 hover:text-accent-green",
      blue: selected
        ? "bg-accent-blue/15 text-accent-blue-soft ring-accent-blue/45"
        : "bg-master text-text-light/75 ring-transparent hover:bg-accent-blue/10 hover:text-accent-blue-soft",
      purple: selected
        ? "bg-accent-purple/15 text-accent-purple-soft ring-accent-purple/45"
        : "bg-master text-text-light/75 ring-transparent hover:bg-accent-purple/10 hover:text-accent-purple-soft",
      danger: selected
        ? "bg-danger-400/15 text-danger-soft ring-danger-400/45"
        : "bg-master text-text-light/75 ring-transparent hover:bg-danger-400/10 hover:text-danger-soft",
    };

    return `mpn-tap flex min-h-10 shrink-0 items-center gap-2 rounded-full px-3.5 text-sm font-semibold ring-1 ring-inset transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue ${tones[tone]}`;
  };

  const statusTone = (
    value: ReservationStatusEnum | null
  ): "neutral" | "green" | "blue" | "purple" | "danger" => {
    if (value === ReservationStatusEnum.AVAILABLE) return "green";
    if (
      value === ReservationStatusEnum.RESERVED ||
      value === ReservationStatusEnum.PREPAID
    ) {
      return "blue";
    }
    if (value === ReservationStatusEnum.FIXED) return "purple";
    if (value === ReservationStatusEnum.INACTIVE) return "danger";
    return "neutral";
  };

  return (
    <div className="flex items-center gap-2">
      <div
        role="group"
        aria-label="Filtros"
        className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-wrap lg:overflow-visible"
      >
        {STATUS_OPTIONS.map(({ value, label, iconWrapClass, Icon }) => {
          const selected = statusSelected === value;
          return (
            <button
              key={label}
              type="button"
              aria-pressed={selected}
              onClick={() => setStatusSelected(value)}
              className={chipClass(selected, statusTone(value))}
            >
              <span
                className={`flex size-7 shrink-0 items-center justify-center rounded-full ${iconWrapClass}`}
              >
                {Icon ? (
                  <Icon size={16} aria-hidden />
                ) : (
                  <MdFilterList size={16} aria-hidden />
                )}
              </span>
              {label}
            </button>
          );
        })}

        {hasCourts && (
          <>
            <span
              className="mx-0.5 h-6 w-px shrink-0 bg-text-light/15"
              aria-hidden
            />
            <button
              type="button"
              aria-pressed={courtSelected === "all"}
              onClick={() => setCourtSelected("all")}
              className={chipClass(courtSelected === "all")}
            >
              Todas
            </button>
            {courtsNameList.map((court) => {
              const selected = courtSelected === court;
              return (
                <button
                  key={court}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setCourtSelected(court)}
                  className={chipClass(selected)}
                >
                  {court}
                </button>
              );
            })}
          </>
        )}
      </div>

      {hasActiveFilter && (
        <button
          type="button"
          onClick={clearFilters}
          className="mpn-tap flex min-h-10 shrink-0 items-center rounded-full px-3 text-sm font-semibold text-accent-blue transition hover:bg-text-light/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
        >
          Limpar
        </button>
      )}
    </div>
  );
}

export default LegendAndFilters;
