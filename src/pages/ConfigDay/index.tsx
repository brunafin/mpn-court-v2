import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  MdOutlineArrowBackIos,
} from "react-icons/md";
import { BsPlus } from "react-icons/bs";
import { useLoading } from "../../hooks/useLoading";
import { IReservationItemProps } from "../Reservation/interface";
import {
  changeAvailability,
  getAllSchedulesByCompanyPublicIdAndDate,
} from "../../api/schedules";
import { ReservationStatusEnum } from "../Reservation/enum";
import { format, isValid, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import AddCourtSchedule from "./AddCourtSchedule";
import { getCourtsByCompanyPublicId } from "../../api/companies";
import {
  clearAccessToken,
  getAccessToken,
  getAccessTokenPayload,
} from "../../utils/authCookie";
import { StatusIcons } from "../Reservation/statusIcons";
import { buttonClassName } from "../../components/Button";
import { PageTitle } from "../../components/PageTitle";

function parseIncomingDate(value: unknown): Date {
  if (value instanceof Date && isValid(value)) {
    return new Date(value.setHours(0, 0, 0, 0));
  }
  if (typeof value === "string" && value.trim()) {
    const iso = value.includes("T") ? value : `${value}T00:00:00`;
    const parsed = parseISO(iso);
    if (isValid(parsed)) {
      return new Date(parsed.setHours(0, 0, 0, 0));
    }
  }
  return new Date(new Date().setHours(0, 0, 0, 0));
}

function ConfigDay() {
  const { loading, withLoading } = useLoading();
  const location = useLocation();
  const navigate = useNavigate();
  const [showAddCourtSchedule, setShowAddCourtSchedule] = useState(false);
  const [companyPublicId, setCompanyPublicId] = useState<string>("");
  const [list, setList] = useState<IReservationItemProps[]>([]);
  const [courts, setCourts] = useState<{ id: number; name: string }[]>([]);
  const [date] = useState<Date>(() => parseIncomingDate(location.state?.date));

  const dateKey = format(date, "yyyy-MM-dd");

  useEffect(() => {
    if (!getAccessToken()) {
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    const payload = getAccessTokenPayload<{ companyPublicId?: string }>();
    setCompanyPublicId(payload?.companyPublicId || "");
  }, []);

  const fetchData = useCallback(
    async (dateInput: string) => {
      if (!companyPublicId) {
        return;
      }
      try {
        await withLoading(async () => {
          const [schedules, courtsResponse] = await Promise.all([
            getAllSchedulesByCompanyPublicIdAndDate({
              companyPublicId,
              date: dateInput,
            }),
            getCourtsByCompanyPublicId(companyPublicId),
          ]);
          setList(schedules);
          setCourts(courtsResponse);
        });
      } catch (error: any) {
        if (error?.response?.status === 401) {
          clearAccessToken();
          navigate("/");
        } else {
          console.error(error);
        }
      }
    },
    [companyPublicId, dateKey]
  );

  useEffect(() => {
    if (!companyPublicId) return;
    fetchData(dateKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- evita loop com withLoading instável
  }, [companyPublicId, dateKey]);

  const counts = useMemo(() => {
    const available = list.filter(
      (item) => item.status === ReservationStatusEnum.AVAILABLE
    ).length;
    const reserved = list.filter(
      (item) =>
        item.status === ReservationStatusEnum.RESERVED ||
        item.status === ReservationStatusEnum.PREPAID
    ).length;
    const fixed = list.filter(
      (item) => item.status === ReservationStatusEnum.FIXED
    ).length;
    const inactive = list.filter(
      (item) => item.status === ReservationStatusEnum.INACTIVE
    ).length;
    return { available, reserved, fixed, inactive };
  }, [list]);

  const hiddenInactiveHours = useMemo(() => {
    if (!list.length || !list[0]?.isHiddenInactiveHours) return [];
    return list.filter(
      (item) => item.status === ReservationStatusEnum.INACTIVE
    );
  }, [list]);

  const summaryRows = [
    {
      key: "available",
      label: "Disponíveis",
      count: counts.available,
      Icon: StatusIcons.available,
      iconClass: "text-accent-green",
      iconBgClass: "bg-accent-green/15",
    },
    {
      key: "reserved",
      label: "Reservados",
      count: counts.reserved,
      Icon: StatusIcons.reserved,
      iconClass: "text-accent-blue",
      iconBgClass: "bg-accent-blue/15",
    },
    {
      key: "fixed",
      label: "Fixos",
      count: counts.fixed,
      Icon: StatusIcons.fixed,
      iconClass: "text-accent-purple",
      iconBgClass: "bg-accent-purple/15",
    },
    {
      key: "inactive",
      label: "Inativos",
      count: counts.inactive,
      Icon: StatusIcons.inactive,
      iconClass: "text-danger-400",
      iconBgClass: "bg-danger-400/15",
    },
  ];

  const totalHours =
    counts.available + counts.reserved + counts.fixed + counts.inactive;
  const showSummaryLoading = loading && list.length === 0;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-master text-text-light">
      <header className="sticky top-0 z-10 bg-master px-4 py-3 lg:px-6">
        <div className="mx-auto flex w-full max-w-lg items-center gap-3 lg:max-w-5xl">
          <button
            type="button"
            onClick={() =>
              navigate(`/reservas`, {
                state: { date: dateKey },
              })
            }
            aria-label="Voltar para reservas"
            className="mpn-tap flex size-11 items-center justify-center rounded-xl text-text-light transition hover:bg-text-light/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
          >
            <MdOutlineArrowBackIos size={20} aria-hidden />
          </button>
          <div className="min-w-0">
            <PageTitle>Detalhes do dia</PageTitle>
            <p className="truncate text-base font-medium capitalize text-text-light/70">
              {format(date, "EEEE, dd/MM/yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-lg min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-8 pt-4 lg:max-w-5xl lg:px-6">
        <div
          className={`mb-4 rounded-2xl bg-master-light px-4 py-2 transition-opacity lg:px-5 lg:py-4 ${
            loading && list.length > 0 ? "opacity-70" : ""
          }`}
          aria-busy={loading}
        >
            <div className="flex items-center justify-between gap-3 px-1 pb-2 pt-3 lg:pb-3">
              <p className="text-sm font-semibold uppercase tracking-wide text-text-light/60">
                Resumo
              </p>
              {!showSummaryLoading && (
                <p className="hidden text-base font-semibold text-text-light/70 lg:block">
                  Total do dia:{" "}
                  <span className="tabular-nums text-text-light">
                    {totalHours}
                  </span>
                </p>
              )}
            </div>
            {showSummaryLoading ? (
              <ul className="animate-pulse lg:grid lg:grid-cols-4 lg:gap-3" aria-label="Carregando resumo">
                {summaryRows.map((row) => (
                  <li
                    key={row.key}
                    className="flex min-h-14 items-center justify-between gap-3 border-b border-text-light/10 last:border-b-0 lg:min-h-24 lg:flex-col lg:items-start lg:justify-center lg:rounded-xl lg:border-b-0 lg:bg-master lg:px-4 lg:py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="size-10 shrink-0 rounded-full bg-text-light/10" />
                      <span className="h-5 w-24 rounded bg-text-light/10" />
                    </div>
                    <span className="h-7 w-8 rounded bg-text-light/10" />
                  </li>
                ))}
                <li className="mt-1 flex min-h-14 items-center justify-between gap-3 border-t border-text-light/15 px-1 lg:hidden">
                  <span className="h-5 w-28 rounded bg-text-light/10" />
                  <span className="h-7 w-8 rounded bg-text-light/10" />
                </li>
              </ul>
            ) : (
              <>
                <ul className="lg:grid lg:grid-cols-4 lg:gap-3">
                  {summaryRows.map((row) => {
                    const Icon = row.Icon;
                    return (
                      <li
                        key={row.key}
                        className="flex min-h-14 items-center justify-between gap-3 border-b border-text-light/10 last:border-b-0 lg:min-h-24 lg:flex-col lg:items-start lg:justify-center lg:gap-2 lg:rounded-xl lg:border-b-0 lg:bg-master lg:px-4 lg:py-3"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex size-10 shrink-0 items-center justify-center rounded-full ${row.iconBgClass} ${row.iconClass}`}
                          >
                            <Icon size={20} aria-hidden />
                          </span>
                          <span className="text-lg font-medium text-text-light">
                            {row.label}
                          </span>
                        </div>
                        <span className="text-2xl font-bold tabular-nums text-text-light lg:pl-0.5">
                          {row.count}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-1 flex min-h-14 items-center justify-between gap-3 border-t border-text-light/15 px-1 lg:hidden">
                  <span className="text-lg font-semibold text-text-light">
                    Total do dia
                  </span>
                  <span className="text-2xl font-bold tabular-nums text-text-light">
                    {totalHours}
                  </span>
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowAddCourtSchedule(true)}
            disabled={loading && courts.length === 0}
            className={buttonClassName({
              variant: "primary",
              className: "mb-6 lg:w-auto lg:min-w-[16rem]",
            })}
          >
            <BsPlus size={26} aria-hidden />
            Adicionar horário
          </button>

          {hiddenInactiveHours.length > 0 && (
            <section>
              <div className="mb-2">
                <div className="mb-1 flex items-end justify-between gap-3">
                  <h3 className="text-lg font-semibold text-text-light">
                    Horários inativos ocultos
                  </h3>
                  <span className="text-base font-medium tabular-nums text-text-light/60">
                    {hiddenInactiveHours.length}
                  </span>
                </div>
                <p className="text-base leading-6 text-text-light/65">
                  Não aparecem na lista de reservas. Ao reativar, voltam como
                  disponíveis.
                </p>
              </div>
              <ul className="flex flex-col gap-2 lg:grid lg:grid-cols-2">
                {hiddenInactiveHours.map((inactiveHour) => {
                  const isPast =
                    new Date(`${dateKey}T${inactiveHour.time}`) <
                    new Date(new Date().setSeconds(0, 0));

                  return (
                    <li
                      key={inactiveHour.scheduleId}
                      className={`flex min-h-16 items-center justify-between gap-3 rounded-xl bg-master-light px-4 py-3 ${
                        isPast ? "pointer-events-none opacity-50" : ""
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-danger-400/15 text-danger-400">
                          <StatusIcons.inactive size={20} aria-hidden />
                        </span>
                        <div className="flex min-w-0 items-baseline gap-1.5">
                          <p className="min-w-0 truncate text-lg font-semibold text-text-light">
                            {inactiveHour.court}
                          </p>
                          <span
                            className="shrink-0 text-lg font-medium tabular-nums text-text-light/70"
                            aria-hidden
                          >
                            —
                          </span>
                          <p className="shrink-0 text-lg font-semibold tabular-nums text-text-light">
                            {inactiveHour.time}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={loading || isPast}
                        aria-label={`Reativar horário ${inactiveHour.time} da quadra ${inactiveHour.court}`}
                        className={buttonClassName({
                          variant: "secondary",
                          size: "md",
                          fullWidth: false,
                          className:
                            "min-h-11 shrink-0 justify-center border-accent-green px-3 text-accent-green hover:bg-accent-green/10 focus-visible:outline-accent-green",
                        })}
                        onClick={async () => {
                          await withLoading(async () => {
                            await changeAvailability(
                              inactiveHour.scheduleId,
                              true
                            );
                            await fetchData(dateKey);
                          });
                        }}
                      >
                        <StatusIcons.unlock
                          size={20}
                          className="shrink-0"
                          aria-hidden
                        />
                        Reativar
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
      </section>

      <AddCourtSchedule
        show={showAddCourtSchedule}
        date={date}
        courts={courts}
        onClose={() => setShowAddCourtSchedule(false)}
        onSuccess={() => fetchData(dateKey)}
      />
    </div>
  );
}

export default ConfigDay;
