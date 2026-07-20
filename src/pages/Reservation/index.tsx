import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import ReservationItem from "./ReservationItem";
import { ReservationStatusEnum } from "./enum";
import LegendAndFilters from "./Legend";
import { IReservationItemProps } from "./interface";
import { getSchedulesByCompanyPublicIdAndDate } from "../../api/schedules";
import AppLayout from "../../components/AppLayout";
import { clearAccessToken, getAccessToken, getAccessTokenPayload } from "../../utils/authCookie";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLoading } from "../../hooks/useLoading";
import NewReminderModal from "../../components/NewNote";
import { useNotification } from "../../contexts/NotificationContext";
import { createNote, notesByDate } from "../../api/notes";
import ReminderBadge from "../../components/ReminderBadge";
import DateStrip from "./DateStrip";
import CalendarButton from "./CalendarButton";
import { format, isSameDay } from "date-fns";
import {
  MdChevronRight,
  MdExpandMore,
  MdOutlineEventNote,
  MdOutlineNotifications,
  MdOutlinePostAdd,
} from "react-icons/md";
import { BsX } from "react-icons/bs";
import EmptyState, {
  emptyStateActionClassName,
} from "../../components/EmptyState";

type SchedulesCache = {
  key: string;
  list: IReservationItemProps[];
  courtsNameList: string[];
};

let schedulesCache: SchedulesCache | null = null;

function toDateKey(value: Date) {
  return format(value, "yyyy-MM-dd");
}

function Reservation() {
  const { loading, withLoading } = useLoading();
  const { refreshUnreadCount } = useNotification();

  const [showNewReminderModal, setShowNewReminderModal] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [is24before, setIs24before] = useState<boolean>(false);
  const [creatingNote, setCreatingNote] = useState(false);
  const [dayUnreadCount, setDayUnreadCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const dateFrom = location.state?.date;

  const [date, setDate] = useState<Date>(
    dateFrom
      ? new Date(
          Number.isNaN(Date.parse(dateFrom))
            ? new Date().setHours(0, 0, 0, 0)
            : new Date(dateFrom + "T00:00:00").setHours(0, 0, 0, 0)
        )
      : new Date(new Date().setHours(0, 0, 0, 0))
  );
  const [statusSelected, setStatusSelected] =
    useState<ReservationStatusEnum | null>(null);
  const [courtSelected, setCourtSelected] = useState<string>("all");
  const [list, setList] = useState<IReservationItemProps[]>([]);
  const [courtsNameList, setCourtsNameList] = useState<string[]>([]);
  const [companyPublicId, setCompanyPublicId] = useState<string>("");
  const [actionsOpen, setActionsOpen] = useState(false);
  const actionsTitleId = useId();
  const actionsDialogId = useId();
  const actionsTriggerRef = useRef<HTMLButtonElement>(null);
  const actionsDialogRef = useRef<HTMLDivElement>(null);
  const actionsFirstItemRef = useRef<HTMLAnchorElement>(null);

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
          const response = await getSchedulesByCompanyPublicIdAndDate({
            companyPublicId,
            date: dateInput,
          });
          const uniqueCourts = [...new Set(response.map((item) => item.court))];
          setList(response);
          setCourtsNameList(uniqueCourts);
          schedulesCache = {
            key: `${companyPublicId}:${dateInput}`,
            list: response,
            courtsNameList: uniqueCourts,
          };
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
    [companyPublicId, navigate]
  );

  useEffect(() => {
    if (!companyPublicId || !date) return;
    const dateInput = toDateKey(date);
    const key = `${companyPublicId}:${dateInput}`;
    if (schedulesCache?.key === key) {
      setList(schedulesCache.list);
      setCourtsNameList(schedulesCache.courtsNameList);
    }
    fetchData(dateInput);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- evita loop com withLoading instável
  }, [companyPublicId, date]);

  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  useEffect(() => {
    setActionsOpen(false);
  }, [date]);

  useEffect(() => {
    if (!actionsOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      actionsFirstItemRef.current?.focus();
    }, 50);

    const getFocusable = () => {
      const root = actionsDialogRef.current;
      if (!root) return [] as HTMLElement[];
      return Array.from(
        root.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setActionsOpen(false);
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = getFocusable();
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (active === first || !actionsDialogRef.current?.contains(active)) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(focusTimer);
      actionsTriggerRef.current?.focus();
    };
  }, [actionsOpen]);

  useEffect(() => {
    if (!companyPublicId || !date) return;

    let cancelled = false;
    const fetchDayReminders = async () => {
      try {
        const notes = await notesByDate(companyPublicId, toDateKey(date));
        if (!cancelled) {
          setDayUnreadCount(Array.isArray(notes) ? notes.length : 0);
        }
      } catch (error) {
        console.error("Erro ao buscar lembretes do dia:", error);
        if (!cancelled) setDayUnreadCount(0);
      }
    };

    fetchDayReminders();
    return () => {
      cancelled = true;
    };
  }, [companyPublicId, date]);

  const handleCreateNote = async (event?: React.FormEvent): Promise<void> => {
    event?.preventDefault?.();
    if (creatingNote) return;
    setCreatingNote(true);
    try {
      await createNote({
        companyPublicId: companyPublicId || "",
        date: toDateKey(date),
        message,
        is24HoursBefore: canRemindDayBefore && is24before,
      });
      setShowNewReminderModal(false);
      setMessage("");
      setIs24before(false);
      await refreshUnreadCount();
      try {
        const notes = await notesByDate(companyPublicId, toDateKey(date));
        setDayUnreadCount(Array.isArray(notes) ? notes.length : 0);
      } catch {
        setDayUnreadCount((prev) => prev + 1);
      }
    } finally {
      setCreatingNote(false);
    }
  };

  const filteredList = useMemo(() => {
    return list
      .filter((elementDate) => {
        if (!date) return elementDate;
        const formattedDate = new Date(
          date.getTime() + date.getTimezoneOffset() * 60000
        )
          .toISOString()
          .split("T")[0];
        return elementDate.date === formattedDate;
      })
      .filter((elementStatus) => {
        if (!statusSelected) return elementStatus;
        if (statusSelected === ReservationStatusEnum.RESERVED) {
          return (
            elementStatus.status === ReservationStatusEnum.RESERVED ||
            elementStatus.status === ReservationStatusEnum.PREPAID
          );
        }
        return elementStatus.status === statusSelected;
      })
      .filter((elementCourt) => {
        if (!courtSelected || courtSelected === "all") return elementCourt;
        return elementCourt.court === courtSelected;
      });
  }, [list, date, statusSelected, courtSelected]);

  const showListLoading = loading && list.length === 0;
  const showUnreadBadge = dayUnreadCount > 0;
  const canRemindDayBefore = !isSameDay(date, new Date());

  const actionRowClass =
    "flex min-h-14 w-full items-center gap-3 rounded-xl px-3.5 text-left text-base font-medium text-text-light/90 transition hover:bg-master active:bg-master/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue";

  const listShellClass =
    "mx-auto w-full space-y-1.5 px-3 pb-6 pt-2 sm:px-4 lg:max-w-6xl lg:space-y-2 lg:px-8";

  const listContent = showListLoading ? (
    <ul
      className={`flex-1 animate-pulse overflow-y-auto ${listShellClass}`}
      aria-label="Carregando horários"
    >
      {Array.from({ length: 6 }).map((_, index) => (
        <li
          key={index}
          className="flex min-h-14 items-stretch rounded-2xl border border-text-light/8 bg-master-light/70"
        >
          <span className="mx-4 my-3.5 h-5 flex-1 rounded bg-text-light/10" />
        </li>
      ))}
    </ul>
  ) : filteredList.length > 0 ? (
    <ul
      className={`flex-1 overflow-y-auto transition-opacity ${listShellClass} ${
        loading ? "opacity-70" : ""
      }`}
    >
      {filteredList.map((item) => (
        <ReservationItem
          scheduleId={item.scheduleId}
          court={item.court}
          customerName={item.customerName}
          date={item.date}
          status={item.status}
          time={item.time}
          isBarbecueIncluded={item.isBarbecueIncluded}
          isEvent={item.isEvent}
          isNeedsNetting={item.isNeedsNetting}
          key={item.scheduleId}
        />
      ))}
    </ul>
  ) : (
    <EmptyState
      title={`Nenhum horário encontrado${
        statusSelected ? " para o filtro selecionado" : ""
      }.`}
      action={
        statusSelected ? (
          <button
            type="button"
            onClick={() => setStatusSelected(null)}
            className={emptyStateActionClassName()}
          >
            Limpar filtro
          </button>
        ) : (
          <Link
            to={`/configuracoes-horarios`}
            state={{ date: date }}
            className={emptyStateActionClassName()}
          >
            Detalhes do dia
          </Link>
        )
      }
    />
  );

  return (
    <AppLayout>
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden bg-master text-text-light">
        <div className="shrink-0 bg-master-light px-3 pb-4 pt-2 lg:bg-transparent lg:px-8 lg:pb-5 lg:pt-5">
          <div className="mx-auto w-full lg:max-w-6xl">
            <div className="mb-2 lg:mb-4 lg:flex lg:flex-col lg:gap-4">
              <div className="mb-2 flex items-center justify-between gap-2 lg:mb-0">
                <CalendarButton selectedDate={date} setSelectedDate={setDate} />
                <div className="flex shrink-0 items-center gap-1">
                  <Link
                    to="/notificacoes"
                    state={{ date }}
                    aria-label={
                      showUnreadBadge
                        ? `Lembretes do dia, ${dayUnreadCount} não lidos`
                        : "Lembretes do dia"
                    }
                    className={`mpn-tap relative flex size-11 items-center justify-center rounded-xl text-text-light/85 transition hover:bg-text-light/10 hover:text-text-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue lg:rounded-full lg:bg-master ${
                      showUnreadBadge
                        ? "ring-1 ring-inset ring-accent-blue/40"
                        : ""
                    }`}
                  >
                    <MdOutlineNotifications size={22} aria-hidden />
                    {showUnreadBadge && (
                      <ReminderBadge
                        count={dayUnreadCount}
                        className="absolute -right-0.5 -top-0.5 min-h-5 min-w-5 px-1 text-[11px]"
                      />
                    )}
                  </Link>
                  <button
                    type="button"
                    ref={actionsTriggerRef}
                    onClick={() => setActionsOpen(true)}
                    aria-haspopup="dialog"
                    aria-expanded={actionsOpen}
                    aria-controls={actionsOpen ? actionsDialogId : undefined}
                    aria-label="Ações do dia"
                    className="mpn-tap flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl px-2 text-base font-semibold text-text-light/85 transition hover:bg-text-light/10 hover:text-text-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue lg:rounded-full lg:bg-master lg:px-4"
                  >
                    <span>Ações</span>
                    <MdExpandMore size={22} className="shrink-0" aria-hidden />
                  </button>
                </div>
              </div>

              <div className="mb-2 min-w-0 lg:mb-0">
                <DateStrip selectedDate={date} setSelectedDate={setDate} />
              </div>
            </div>

            <LegendAndFilters
              statusSelected={statusSelected}
              setStatusSelected={setStatusSelected}
              courtsNameList={courtsNameList}
              courtSelected={courtSelected}
              setCourtSelected={setCourtSelected}
            />
          </div>
        </div>

        <div className="mx-auto hidden w-full max-w-6xl px-8 pb-2 pt-1 lg:block">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-text-light/50">
            Agenda do dia
          </h2>
        </div>

        {listContent}

        {actionsOpen && (
          <div className="fixed inset-0 z-[1100] flex items-end justify-center sm:items-center sm:p-4">
            <button
              type="button"
              tabIndex={-1}
              aria-label="Fechar ações"
              className="absolute inset-0 bg-black/75"
              onClick={() => setActionsOpen(false)}
            />

            <div
              ref={actionsDialogRef}
              id={actionsDialogId}
              role="dialog"
              aria-modal="true"
              aria-labelledby={actionsTitleId}
              className="relative z-10 flex w-full max-w-sm flex-col rounded-t-3xl bg-master-light text-text-light shadow-2xl sm:rounded-2xl"
            >
              <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-text-light/20 sm:hidden" />

              <div className="flex items-center justify-between gap-3 px-4 pb-0.5 pt-3 sm:pt-3.5">
                <h2
                  id={actionsTitleId}
                  className="text-sm font-medium text-text-light/55"
                >
                  Ações do dia
                </h2>
                <button
                  type="button"
                  onClick={() => setActionsOpen(false)}
                  aria-label="Fechar"
                  className="mpn-tap flex size-11 shrink-0 items-center justify-center rounded-full text-text-light/55 hover:bg-master hover:text-text-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
                >
                  <BsX size={22} aria-hidden />
                </button>
              </div>

              <div className="flex flex-col gap-0.5 px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1">
                <Link
                  ref={actionsFirstItemRef}
                  to="/notificacoes"
                  state={{ date: date }}
                  onClick={() => setActionsOpen(false)}
                  className={actionRowClass}
                >
                  <MdOutlineNotifications
                    size={22}
                    className="shrink-0 text-text-light/65"
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">Ver lembretes</span>
                  {showUnreadBadge && (
                    <ReminderBadge count={dayUnreadCount} />
                  )}
                  <MdChevronRight
                    size={20}
                    className="shrink-0 text-text-light/35"
                    aria-hidden
                  />
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setActionsOpen(false);
                    setShowNewReminderModal(true);
                  }}
                  className={actionRowClass}
                >
                  <MdOutlinePostAdd
                    size={22}
                    className="shrink-0 text-text-light/65"
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">Criar lembrete</span>
                  <MdChevronRight
                    size={20}
                    className="shrink-0 text-text-light/35"
                    aria-hidden
                  />
                </button>

                <Link
                  to={`/configuracoes-horarios`}
                  state={{ date: date }}
                  onClick={() => setActionsOpen(false)}
                  className={actionRowClass}
                >
                  <MdOutlineEventNote
                    size={22}
                    className="shrink-0 text-text-light/65"
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">Detalhes do dia</span>
                  <MdChevronRight
                    size={20}
                    className="shrink-0 text-text-light/35"
                    aria-hidden
                  />
                </Link>
              </div>
            </div>
          </div>
        )}

        <NewReminderModal
          isOpen={showNewReminderModal}
          onClose={() => {
            if (!creatingNote) setShowNewReminderModal(false);
          }}
          handleSubmit={handleCreateNote}
          isSubmitting={creatingNote}
          date={date.toLocaleString("pt-BR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          })}
          message={message}
          setMessage={setMessage}
          is24HoursBefore={is24before}
          setIs24HoursBefore={setIs24before}
          showRemind24HoursBefore={canRemindDayBefore}
        />
      </section>
    </AppLayout>
  );
}

export default Reservation;
