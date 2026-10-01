import { useMemo } from "react";

interface LegendProps {
  courtsNameList: string[];
  courtSelected: string;
  setCourtSelected: (court: string) => void;
}

function LegendAndFilters({
  courtsNameList,
  courtSelected,
  setCourtSelected,
}: LegendProps) {
  const hasCourts = courtsNameList.length > 1;
  const courtsSorted = useMemo(
    () =>
      [...courtsNameList].sort((a, b) =>
        a.localeCompare(b, "pt-BR", { sensitivity: "base" })
      ),
    [courtsNameList]
  );

  if (!hasCourts) return null;

  const chipClass = (selected: boolean) =>
    `mpn-tap flex min-h-10 shrink-0 items-center rounded-full px-3.5 text-base font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue ${
      selected
        ? "bg-text-light/90 text-master"
        : "bg-master-light text-text-light/70 hover:bg-text-light/10 hover:text-text-light"
    }`;

  return (
    <div
      role="group"
      aria-label="Filtro de quadras"
      className="flex min-w-0 items-center gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-wrap lg:overflow-visible"
    >
      <button
        type="button"
        aria-pressed={courtSelected === "all"}
        onClick={() => setCourtSelected("all")}
        className={chipClass(courtSelected === "all")}
      >
        Todas
      </button>
      {courtsSorted.map((court) => {
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
    </div>
  );
}

export default LegendAndFilters;
