import { useEffect, useId, useState } from "react";
import {
  MdCheck,
  MdExpandMore,
  MdFilterList,
  MdNotInterested,
} from "react-icons/md";
import { BsX } from "react-icons/bs";
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

const optionRowClass =
  "flex min-h-14 w-full items-center gap-3 rounded-2xl bg-master px-4 text-left text-base font-semibold text-text-light transition hover:bg-master/80 active:bg-master/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue";

function statusLabel(status: ReservationStatusEnum | null) {
  return (
    STATUS_OPTIONS.find((option) => option.value === status)?.label ?? "Todos"
  );
}

function LegendAndFilters({
  setStatusSelected,
  statusSelected,
  courtsNameList,
  courtSelected,
  setCourtSelected,
}: LegendProps) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const hasCourts = courtsNameList.length > 1;
  const hasActiveFilter =
    statusSelected !== null || (hasCourts && courtSelected !== "all");

  const summaryParts = [
    statusSelected !== null ? statusLabel(statusSelected) : null,
    hasCourts && courtSelected !== "all" ? courtSelected : null,
  ].filter(Boolean) as string[];

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const clearFilters = () => {
    setStatusSelected(null);
    setCourtSelected("all");
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          className={`mpn-tap flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-xl px-2.5 text-left text-base font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue ${
            hasActiveFilter
              ? "bg-accent-blue/15 text-text-light ring-1 ring-inset ring-accent-blue/40"
              : "text-text-light/85 hover:bg-text-light/10"
          }`}
        >
          <MdFilterList size={22} className="shrink-0" aria-hidden />
          <span className="min-w-0 truncate">
            {summaryParts.length > 0
              ? `Filtros · ${summaryParts.join(" · ")}`
              : "Filtros"}
          </span>
          <MdExpandMore
            size={22}
            className="ml-auto shrink-0 text-text-light/60"
            aria-hidden
          />
        </button>

        {hasActiveFilter && (
          <button
            type="button"
            onClick={clearFilters}
            className="mpn-tap flex min-h-11 shrink-0 items-center rounded-xl px-3 text-base font-semibold text-accent-blue transition hover:bg-text-light/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
          >
            Limpar
          </button>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-[1100] flex items-end justify-center sm:items-center sm:p-4">
          <button
            type="button"
            aria-label="Fechar filtros"
            className="absolute inset-0 bg-black/75"
            onClick={() => setOpen(false)}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative z-10 flex max-h-[85dvh] w-full max-w-md flex-col rounded-t-3xl bg-master-light text-text-light shadow-2xl sm:rounded-3xl"
          >
            <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-text-light/20 sm:hidden" />

            <div className="flex items-start justify-between gap-3 px-5 pb-2 pt-4">
              <h2
                id={titleId}
                className="text-xl font-semibold leading-7 text-text-light"
              >
                Filtros
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar"
                className="mpn-tap-solid flex size-11 shrink-0 items-center justify-center rounded-full bg-master text-text-light/80"
              >
                <BsX size={24} aria-hidden />
              </button>
            </div>

            <div className="space-y-5 overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              <div>
                <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-text-light/60">
                  Status
                </p>
                <div
                  role="group"
                  aria-label="Filtrar por status"
                  className="flex flex-col gap-2"
                >
                  {STATUS_OPTIONS.map(
                    ({ value, label, iconWrapClass, Icon }) => {
                      const selected = statusSelected === value;
                      return (
                        <button
                          key={label}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => {
                            setStatusSelected(value);
                            setOpen(false);
                          }}
                          className={`${optionRowClass} ${
                            selected
                              ? "ring-1 ring-inset ring-accent-blue/50"
                              : ""
                          }`}
                        >
                          <span
                            className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${iconWrapClass}`}
                          >
                            {Icon ? (
                              <Icon size={22} aria-hidden />
                            ) : (
                              <MdFilterList size={22} aria-hidden />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">{label}</span>
                          {selected && (
                            <MdCheck
                              size={22}
                              className="shrink-0 text-accent-blue"
                              aria-hidden
                            />
                          )}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {hasCourts && (
                <div>
                  <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-text-light/60">
                    Quadra
                  </p>
                  <div
                    role="group"
                    aria-label="Filtrar por quadra"
                    className="flex flex-col gap-2"
                  >
                    <button
                      type="button"
                      aria-pressed={courtSelected === "all"}
                      onClick={() => {
                        setCourtSelected("all");
                        setOpen(false);
                      }}
                      className={`${optionRowClass} ${
                        courtSelected === "all"
                          ? "ring-1 ring-inset ring-accent-blue/50"
                          : ""
                      }`}
                    >
                      <span className="min-w-0 flex-1">Todas</span>
                      {courtSelected === "all" && (
                        <MdCheck
                          size={22}
                          className="shrink-0 text-accent-blue"
                          aria-hidden
                        />
                      )}
                    </button>
                    {courtsNameList.map((court) => {
                      const selected = courtSelected === court;
                      return (
                        <button
                          key={court}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => {
                            setCourtSelected(court);
                            setOpen(false);
                          }}
                          className={`${optionRowClass} ${
                            selected
                              ? "ring-1 ring-inset ring-accent-blue/50"
                              : ""
                          }`}
                        >
                          <span className="min-w-0 flex-1">{court}</span>
                          {selected && (
                            <MdCheck
                              size={22}
                              className="shrink-0 text-accent-blue"
                              aria-hidden
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default LegendAndFilters;
