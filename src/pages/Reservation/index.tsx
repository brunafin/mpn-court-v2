import { useCallback, useEffect, useId, useMemo, useState } from "react";
import ReservationItem from "./ReservationItem";
import { ReservationStatusEnum } from "./enum";
import LegendAndFilters from "./Legend";
import { IReservationItemProps } from "./interface";
import { getSchedulesByCompanyPublicIdAndDate } from "../../api/schedules";
import Header from "../../components/Header";
import { clearAccessToken, getAccessToken, getAccessTokenPayload } from "../../utils/authCookie";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLoading } from "../../hooks/useLoading";
import NewReminderModal from "../../components/NewNote";
import { useNotification } from "../../contexts/NotificationContext";
import { createNote, notesByDate } from "../../api/notes";
import ReminderBadge from "../../components/ReminderBadge";
import DateStrip from "./DateStrip";
import CalendarButton from "./CalendarButton";
import { format } from "date-fns";
import {
  MdChevronRight,
  MdExpandMore,
  MdOutlineEventNote,
  MdOutlineNotifications,
  MdOutlinePostAdd,
} from "react-icons/md";
import { BsX } from "react-icons/bs";
import { buttonClassName } from "../../components/Button";
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

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActionsOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
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
        is24HoursBefore: is24before,
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

  const actionRowClass =
    "flex min-h-14 w-full items-center gap-3 rounded-2xl bg-master px-4 text-left text-base font-semibold text-text-light transition hover:bg-master/80 active:bg-master/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue";

  const listContent = showListLoading ? (
    <ul
      className="flex-1 animate-pulse overflow-y-auto px-0 pb-6 pt-0 sm:px-4"
      aria-label="Carregando horários"
    >
      {Array.from({ length: 6 }).map((_, index) => (
        <li
          key={index}
          className="flex min-h-16 items-stretch border-b border-text-light/10"
        >
          <span className="w-8 shrink-0 bg-text-light/10" />
          <span className="mx-3 my-4 h-5 flex-1 rounded bg-text-light/10" />
        </li>
      ))}
    </ul>
  ) : filteredList.length > 0 ? (
    <ul
      className={`flex-1 overflow-y-auto px-0 pb-6 pt-0 transition-opacity sm:px-4 md:mx-auto md:w-full md:max-w-2xl ${
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
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <Header />
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden bg-master text-text-light">
        <div className="shrink-0 bg-master-light px-3 pb-4 pt-2">
          <div className="mb-2 flex items-center justify-between gap-2">
            <CalendarButton selectedDate={date} setSelectedDate={setDate} />
            <button
              type="button"
              onClick={() => setActionsOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={actionsOpen}
              aria-label="Ações do dia"
              className="mpn-tap flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl px-2 text-base font-semibold text-text-light/85 transition hover:bg-text-light/10 hover:text-text-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
            >
              <span>Ações</span>
              {showUnreadBadge && <ReminderBadge count={dayUnreadCount} />}
              <MdExpandMore size={22} className="shrink-0" aria-hidden />
            </button>
          </div>

          <div className="mb-2">
            <DateStrip selectedDate={date} setSelectedDate={setDate} />
          </div>

          <LegendAndFilters
            statusSelected={statusSelected}
            setStatusSelected={setStatusSelected}
            courtsNameList={courtsNameList}
            courtSelected={courtSelected}
            setCourtSelected={setCourtSelected}
          />
        </div>

        {listContent}

        {actionsOpen && (
          <div className="fixed inset-0 z-[1100] flex items-end justify-center sm:items-center sm:p-4">
            <button
              type="button"
              aria-label="Fechar ações"
              className="absolute inset-0 bg-black/75"
              onClick={() => setActionsOpen(false)}
            />

            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={actionsTitleId}
              className="relative z-10 flex w-full max-w-md flex-col rounded-t-3xl bg-master-light text-text-light shadow-2xl sm:rounded-3xl"
            >
              <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-text-light/20 sm:hidden" />

              <div className="flex items-start justify-between gap-3 px-5 pb-2 pt-4">
                <h2
                  id={actionsTitleId}
                  className="text-xl font-semibold leading-7 text-text-light"
                >
                  Ações do dia
                </h2>
                <button
                  type="button"
                  onClick={() => setActionsOpen(false)}
                  aria-label="Fechar"
                  className="mpn-tap-solid flex size-11 shrink-0 items-center justify-center rounded-full bg-master text-text-light/80"
                >
                  <BsX size={24} aria-hidden />
                </button>
              </div>

              <div className="space-y-5 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
                <div>
                  <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-text-light/60">
                    Lembretes
                  </p>
                  <div className="flex flex-col gap-2">
                    <Link
                      to="/notificacoes"
                      state={{ date: date }}
                      onClick={() => setActionsOpen(false)}
                      className={`${actionRowClass} ${
                        showUnreadBadge
                          ? "ring-1 ring-inset ring-accent-blue/50"
                          : ""
                      }`}
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-blue/15 text-accent-blue">
                        <MdOutlineNotifications size={22} aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">Ver lembretes</span>
                      {showUnreadBadge && (
                        <ReminderBadge count={dayUnreadCount} />
                      )}
                      <MdChevronRight
                        size={22}
                        className="shrink-0 text-text-light/45"
                        aria-hidden
                      />
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setActionsOpen(false);
                        setShowNewReminderModal(true);
                      }}
                      className={buttonClassName({
                        variant: "secondary",
                        size: "md",
                        className: "justify-center",
                      })}
                    >
                      <MdOutlinePostAdd size={22} className="shrink-0" aria-hidden />
                      Criar lembrete
                    </button>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-text-light/60">
                    Dia
                  </p>
                  <Link
                    to={`/configuracoes-horarios`}
                    state={{ date: date }}
                    onClick={() => setActionsOpen(false)}
                    className={actionRowClass}
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-text-light/10 text-text-light/80">
                      <MdOutlineEventNote size={22} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">Detalhes do dia</span>
                    <MdChevronRight
                      size={22}
                      className="shrink-0 text-text-light/45"
                      aria-hidden
                    />
                  </Link>
                </div>
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
          showRemind24HoursBefore
        />
      </section>
    </div>
  );
}

export default Reservation;
