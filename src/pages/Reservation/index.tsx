import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReservationItem from "./ReservationItem";
import {
  normalizeReservationStatus,
  ReservationStatusEnum,
} from "./enum";
import LegendAndFilters from "./Legend";
import { IReservationItemProps } from "./interface";
import { getSchedulesByCompanyPublicIdAndDate } from "../../api/schedules";
import { infosByCompanyPublicId } from "../../api/companies";
import AppLayout from "../../components/AppLayout";
import {
  getAccessToken,
  getAccessTokenPayload,
} from "../../utils/authCookie";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLoading } from "../../hooks/useLoading";
import ActivateCourtGuideModal from "../../components/ActivateCourtGuideModal";
import { useNotification } from "../../contexts/NotificationContext";
import { notesByDate } from "../../api/notes";
import ReminderBadge from "../../components/ReminderBadge";
import DateStrip from "./DateStrip";
import CalendarButton from "./CalendarButton";
import { addDays, format, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  MdChevronRight,
  MdOutlineEventNote,
  MdOutlineNotifications,
  MdOutlinePublic,
} from "react-icons/md";
import EmptyState, {
  emptyStateActionClassName,
} from "../../components/EmptyState";
import {
  getSchedulesDayCache,
  isSchedulesDayCacheFresh,
  setSchedulesDayCache,
} from "../../utils/schedulesDayCache";
import { normalizeText } from "../../utils/normalizeText";
import {
  hasSeenActivateCourtGuide,
  markActivateCourtGuideSeen,
} from "../../utils/activateCourtGuide";
import { useCompanyCapabilities } from "../../contexts/CompanyBrandingContext";
import { buttonClassName } from "../../components/Button";
import { useDaySwipe } from "../../hooks/useDaySwipe";

type ReservationLocationState = {
  date?: string;
  showActivateGuide?: boolean;
  status?: ReservationStatusEnum | null;
  court?: string;
  customerQuery?: string;
};

function toDateKey(value: Date) {
  return format(value, "yyyy-MM-dd");
}

function Reservation() {
  const { loading, withLoading } = useLoading();
  const { refreshUnreadCount } = useNotification();
  const caps = useCompanyCapabilities();

  const [showActivateGuide, setShowActivateGuide] = useState(false);
  const [dayUnreadCount, setDayUnreadCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = (location.state as ReservationLocationState | null) ?? null;
  const dateFrom = locationState?.date;

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
    useState<ReservationStatusEnum | null>(
      () => normalizeReservationStatus(locationState?.status) ?? null,
    );
  const [courtSelected, setCourtSelected] = useState<string>(
    () => locationState?.court || "all",
  );
  const [customerQuery, setCustomerQuery] = useState(
    () => locationState?.customerQuery || "",
  );
  const [list, setList] = useState<IReservationItemProps[]>([]);
  const [courtsNameList, setCourtsNameList] = useState<string[]>([]);
  const [loadedDateKey, setLoadedDateKey] = useState<string | null>(null);
  const [companyPublicId, setCompanyPublicId] = useState<string>("");
  const [portalActive, setPortalActive] = useState<boolean | null>(null);
  const fetchGenRef = useRef(0);
  const forceGuideFromNavRef = useRef(Boolean(locationState?.showActivateGuide));

  useEffect(() => {
    if (!getAccessToken()) {
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    const payload = getAccessTokenPayload<{ companyPublicId?: string }>();
    setCompanyPublicId(payload?.companyPublicId || "");
  }, []);

  useEffect(() => {
    if (!locationState?.showActivateGuide) return;
    forceGuideFromNavRef.current = true;
    setShowActivateGuide(true);
    navigate(location.pathname, {
      replace: true,
      state: {
        ...(dateFrom ? { date: dateFrom } : {}),
        ...(locationState?.status != null
          ? { status: locationState.status }
          : {}),
        ...(locationState?.court ? { court: locationState.court } : {}),
        ...(locationState?.customerQuery
          ? { customerQuery: locationState.customerQuery }
          : {}),
      },
    });
  }, [dateFrom, location.pathname, locationState, navigate]);

  useEffect(() => {
    if (!companyPublicId) return;
    let cancelled = false;

    const loadPortalStatus = async () => {
      try {
        const info = await infosByCompanyPublicId(companyPublicId);
        if (cancelled) return;
        const active =
          typeof info.isActive === "boolean"
            ? info.isActive
            : (info.courts ?? []).some((court) => court.show);
        setPortalActive(active);
        if (active) {
          setShowActivateGuide(false);
          return;
        }
        if (
          forceGuideFromNavRef.current ||
          !hasSeenActivateCourtGuide(companyPublicId)
        ) {
          setShowActivateGuide(true);
        }
      } catch {
        if (!cancelled) setPortalActive(null);
      }
    };

    void loadPortalStatus();

    const onFocus = () => {
      void loadPortalStatus();
    };
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
    };
  }, [companyPublicId]);

  const handleCloseActivateGuide = () => {
    setShowActivateGuide(false);
    forceGuideFromNavRef.current = false;
    markActivateCourtGuideSeen(companyPublicId);
  };

  const applyDayData = useCallback(
    (response: IReservationItemProps[], dateInput: string) => {
      const uniqueCourts = [
        ...new Set(response.map((item) => item.court)),
      ].sort((a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" }));
      setList(response);
      setCourtsNameList(uniqueCourts);
      setLoadedDateKey(dateInput);
      if (companyPublicId) {
        setSchedulesDayCache(
          companyPublicId,
          dateInput,
          response,
          uniqueCourts,
        );
      }
    },
    [companyPublicId],
  );

  const fetchData = useCallback(
    async (dateInput: string, opts?: { silent?: boolean }) => {
      if (!companyPublicId) {
        return;
      }
      const gen = ++fetchGenRef.current;
      const run = async () => {
        const response = await getSchedulesByCompanyPublicIdAndDate({
          companyPublicId,
          date: dateInput,
        });
        // Ignora resposta se o usuário já mudou de dia
        if (gen !== fetchGenRef.current) return;
        applyDayData(response, dateInput);
      };
      try {
        if (opts?.silent) {
          await run();
        } else {
          await withLoading(run);
        }
      } catch (error: any) {
        // Evita skeleton infinito se a carga do dia falhar
        if (gen === fetchGenRef.current && !opts?.silent) {
          setLoadedDateKey(dateInput);
          setList([]);
          setCourtsNameList([]);
        }
        if (error?.response?.status !== 401) {
          console.error(error);
        }
      }
    },
    [companyPublicId, navigate, withLoading, applyDayData],
  );

  useEffect(() => {
    if (!companyPublicId || !date) return;
    const dateInput = toDateKey(date);
    const cached = getSchedulesDayCache(companyPublicId, dateInput);

    if (cached) {
      setList(cached.list);
      setCourtsNameList(cached.courtsNameList);
      setLoadedDateKey(dateInput);
      // Fresco: não refetch. Velho: revalida sem spinner.
      if (!isSchedulesDayCacheFresh(companyPublicId, dateInput)) {
        void fetchData(dateInput, { silent: true });
      }
      return;
    }

    void fetchData(dateInput);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- evita loop com withLoading instável
  }, [companyPublicId, date]);

  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);

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

  const filteredList = useMemo(() => {
    const query = normalizeText(customerQuery.trim());
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
        return elementStatus.status === statusSelected;
      })
      .filter((elementCourt) => {
        if (!courtSelected || courtSelected === "all") return elementCourt;
        return elementCourt.court === courtSelected;
      })
      .filter((elementCustomer) => {
        if (!query) return true;
        return normalizeText(elementCustomer.customerName || "").includes(
          query
        );
      });
  }, [list, date, statusSelected, courtSelected, customerQuery]);

  // Skeleton enquanto o dia selecionado ainda não foi aplicado (evita empty state piscando)
  const showListLoading = loadedDateKey !== toDateKey(date);
  const showUnreadBadge = dayUnreadCount > 0;
  const hasActiveFilters = Boolean(statusSelected || customerQuery.trim());
  const dayTitle = format(date, "EEEE, d 'de' MMMM", { locale: ptBR });
  const agendaScrollRef = useRef<HTMLDivElement>(null);

  const shiftDay = useCallback((deltaDays: -1 | 1) => {
    setDate((current) => startOfDay(addDays(current, deltaDays)));
    agendaScrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const daySwipe = useDaySwipe(shiftDay);

  const listShellClass =
    "mx-auto w-full space-y-1.5 px-3 pb-6 pt-2 sm:px-4 lg:max-w-6xl lg:space-y-2 lg:px-8";

  const clearDayFilters = () => {
    setStatusSelected(null);
    setCustomerQuery("");
  };

  const hoursList = showListLoading ? (
    <ul className={`animate-pulse ${listShellClass}`} aria-label="Carregando horários">
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
      className={`transition-opacity ${listShellClass} ${
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
          listFilters={{
            status: statusSelected,
            court: courtSelected,
            customerQuery,
          }}
          key={item.scheduleId}
        />
      ))}
    </ul>
  ) : (
    <EmptyState
      title={
        customerQuery.trim()
          ? "Nenhum horário com este cliente."
          : statusSelected
            ? "Nenhum horário para o filtro selecionado."
            : "Nenhum horário encontrado."
      }
      description={
        customerQuery.trim()
          ? "Tente outro nome ou limpe a busca."
          : statusSelected
            ? "Limpe o filtro de status para ver todos os horários do dia."
            : undefined
      }
      action={
        hasActiveFilters ? (
          <button
            type="button"
            onClick={clearDayFilters}
            className={emptyStateActionClassName()}
          >
            Limpar filtros
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
      {!caps.canViewAgenda ? (
        <section className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden bg-master px-4 text-text-light">
          <EmptyState
            title="Teste grátis encerrado"
            description="Contrate um plano mensal para voltar a ver a agenda e publicar no site."
            action={
              <Link
                to="/planos"
                className={buttonClassName({
                  variant: "primary",
                  size: "md",
                  className: "mt-2 inline-flex w-auto",
                  fullWidth: false,
                })}
              >
                Contrate um plano
              </Link>
            }
          />
        </section>
      ) : (
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden bg-master text-text-light">
        <div className="shrink-0 bg-master-light px-3 pb-2 pt-2 lg:bg-transparent lg:px-8 lg:pb-3 lg:pt-5">
          <div className="mx-auto w-full lg:max-w-6xl">
            <div className="flex items-center justify-between gap-2">
              <CalendarButton selectedDate={date} setSelectedDate={setDate} />
              <div className="flex shrink-0 items-center gap-1">
                <Link
                  to="/configuracoes-horarios"
                  state={{ date }}
                  aria-label="Detalhes do dia"
                  className="mpn-tap flex size-11 items-center justify-center rounded-xl text-text-light/85 transition hover:bg-text-light/10 hover:text-text-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue lg:rounded-full lg:bg-master"
                >
                  <MdOutlineEventNote size={22} aria-hidden />
                </Link>
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
              </div>
            </div>
          </div>
        </div>

        <div
          ref={agendaScrollRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain"
          {...daySwipe}
        >
          <div className="sticky top-0 z-20 border-b border-text-light/8 bg-master-light/95 px-3 pb-3 pt-1 backdrop-blur-sm lg:bg-master/95 lg:px-8 lg:pb-4 lg:pt-2">
            <div className="mx-auto w-full lg:max-w-6xl">
              <DateStrip selectedDate={date} setSelectedDate={setDate} />
              <p
                className="mt-2 truncate text-sm font-semibold capitalize text-text-light/70 lg:mt-3 lg:text-base"
                aria-live="polite"
              >
                {dayTitle}
              </p>
            </div>
          </div>

          <div className="bg-master-light px-3 pb-4 pt-3 lg:bg-transparent lg:px-8 lg:pb-5 lg:pt-4">
            <div className="mx-auto w-full lg:max-w-6xl">
              <LegendAndFilters
                statusSelected={statusSelected}
                setStatusSelected={setStatusSelected}
                courtsNameList={courtsNameList}
                courtSelected={courtSelected}
                setCourtSelected={setCourtSelected}
              />

              <label className="mt-3 block">
                <span className="sr-only">Buscar cliente no dia</span>
                <input
                  type="search"
                  value={customerQuery}
                  onChange={(e) => setCustomerQuery(e.target.value)}
                  placeholder="Buscar cliente no dia"
                  autoComplete="off"
                  enterKeyHint="search"
                  className="mpn-tap h-11 w-full rounded-xl border border-text-light/10 bg-master px-3.5 text-base text-text-light placeholder:text-text-light/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue lg:bg-master-light"
                />
              </label>

              {portalActive === false && (
                <Link
                  to="/quadras"
                  className="mpn-tap mt-3 flex min-h-12 w-full items-center justify-between gap-3 rounded-xl bg-accent-blue px-4 py-3 text-left text-base font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <MdOutlinePublic size={22} className="shrink-0" aria-hidden />
                    <span className="min-w-0 truncate">Ativar a minha quadra</span>
                  </span>
                  <MdChevronRight size={22} className="shrink-0 opacity-90" aria-hidden />
                </Link>
              )}
            </div>
          </div>

          <div className="mx-auto hidden w-full max-w-6xl px-8 pb-2 pt-1 lg:block">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-text-light/50">
              Agenda do dia
            </h2>
          </div>

          {hoursList}
        </div>

        <ActivateCourtGuideModal
          isOpen={showActivateGuide}
          onClose={handleCloseActivateGuide}
        />
      </section>
      )}
    </AppLayout>
  );
}

export default Reservation;
