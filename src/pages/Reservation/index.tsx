import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReservationItem from "./ReservationItem";
import {
  normalizeReservationStatus,
  ReservationStatusEnum,
} from "./enum";
import LegendAndFilters from "./Legend";
import { IReservationItemProps } from "./interface";
import { getSchedulesByCompanyPublicIdAndDate } from "../../api/schedules";
import { IInfo, infosByCompanyPublicId } from "../../api/companies";
import AppLayout from "../../components/AppLayout";
import {
  getAccessToken,
  getAccessTokenPayload,
} from "../../utils/authCookie";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLoading } from "../../hooks/useLoading";
import ActivateCourtGuideModal from "../../components/ActivateCourtGuideModal";
import { useNotification } from "../../contexts/NotificationContext";
import DateStrip from "./DateStrip";
import CalendarButton from "./CalendarButton";
import { addDays, format, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MdOutlineEventNote, MdOutlineFilterList } from "react-icons/md";
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
import { useErrors } from "../../contexts/ErrorsContext";
import { MPN_PUBLIC_SITE_URL } from "../../constants/legal";
import AgendaFiltersSheet, {
  agendaPeriodLabel,
  agendaStatusLabel,
  AgendaPeriodFilter,
  hourInAgendaPeriod,
} from "./AgendaFiltersSheet";

type ReservationLocationState = {
  date?: string;
  showActivateGuide?: boolean;
  agendaBootstrapping?: boolean;
  status?: ReservationStatusEnum | null;
  court?: string;
  customerQuery?: string;
  logoUploadFailed?: boolean;
};

const AGENDA_BOOTSTRAP_MS = 5000;
const AGENDA_BOOTSTRAP_POLL_MS = 700;

function AgendaConfiguringPanel({
  detail = "Montando a agenda do seu estabelecimento. Isso costuma levar poucos segundos.",
}: {
  detail?: string;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 py-10 text-text-light">
      <div className="w-full max-w-sm text-center">
        <div
          className="mx-auto mb-5 size-12 rounded-full border-2 border-accent-blue/25 border-t-accent-blue animate-spin"
          aria-hidden
        />
        <p className="text-lg font-semibold tracking-tight">
          Configurando os horários…
        </p>
        <p className="mt-2 text-base leading-6 text-text-light/70">{detail}</p>
      </div>
    </div>
  );
}

function arenaPublicUrl(info: IInfo | null): string | null {
  if (!info) return null;
  if (info.slug) {
    return `${MPN_PUBLIC_SITE_URL}/encontre-onde-jogar/${info.slug}`;
  }
  return info.link || null;
}

function toDateKey(value: Date) {
  return format(value, "yyyy-MM-dd");
}

function Reservation() {
  const { loading, withLoading } = useLoading();
  const { refreshUnreadCount, setReminderDate } = useNotification();
  const { notifyError } = useErrors();
  const caps = useCompanyCapabilities();

  const [showActivateGuide, setShowActivateGuide] = useState(false);
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
  const [sportSelected, setSportSelected] = useState("");
  const [periodSelected, setPeriodSelected] =
    useState<AgendaPeriodFilter>("");
  const [filtersSheetOpen, setFiltersSheetOpen] = useState(false);
  const [courtSportsByName, setCourtSportsByName] = useState<
    Record<string, string[]>
  >({});
  const [list, setList] = useState<IReservationItemProps[]>([]);
  const [courtsNameList, setCourtsNameList] = useState<string[]>([]);
  const [loadedDateKey, setLoadedDateKey] = useState<string | null>(null);
  const [dayLoadError, setDayLoadError] = useState(false);
  const [companyPublicId, setCompanyPublicId] = useState<string>("");
  const [publicArenaUrl, setPublicArenaUrl] = useState<string | null>(null);
  const [agendaBootstrapping, setAgendaBootstrapping] = useState(
    () => Boolean(locationState?.agendaBootstrapping),
  );
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
    if (locationState?.logoUploadFailed) {
      notifyError({
        type: "error",
        message:
          "Estabelecimento criado, mas a logo não foi enviada. Envie em Minhas informações.",
      });
    }
    if (
      !locationState?.showActivateGuide &&
      !locationState?.logoUploadFailed &&
      !locationState?.agendaBootstrapping
    ) {
      return;
    }
    if (locationState?.showActivateGuide) {
      forceGuideFromNavRef.current = true;
      setShowActivateGuide(true);
    }
    if (locationState?.agendaBootstrapping) {
      setAgendaBootstrapping(true);
    }
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
  }, [dateFrom, location.pathname, locationState, navigate, notifyError]);

  useEffect(() => {
    if (!companyPublicId) return;
    let cancelled = false;

    const loadPortalStatus = async () => {
      try {
        const info = await infosByCompanyPublicId(companyPublicId);
        if (cancelled) return;

        const byName: Record<string, string[]> = {};
        for (const court of info.courts ?? []) {
          const name = court.name?.trim();
          if (!name) continue;
          byName[name] = (court.sports ?? [])
            .map((sport) => sport.trim())
            .filter(Boolean);
        }
        setCourtSportsByName(byName);

        const active =
          typeof info.isActive === "boolean"
            ? info.isActive
            : (info.courts ?? []).some((court) => court.show);
        setPublicArenaUrl(arenaPublicUrl(info));
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
        if (!cancelled) {
          setCourtSportsByName({});
        }
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
      setDayLoadError(false);
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

  // Pós-onboarding: espera até 5s pelos horários do dia, sem skeleton infinito.
  useEffect(() => {
    if (!agendaBootstrapping || !companyPublicId) return;

    let cancelled = false;
    const deadline = Date.now() + AGENDA_BOOTSTRAP_MS;
    const dateInput = toDateKey(date);

    const poll = async () => {
      while (!cancelled && Date.now() < deadline) {
        try {
          const response = await getSchedulesByCompanyPublicIdAndDate({
            companyPublicId,
            date: dateInput,
          });
          if (cancelled) return;
          if (response.length > 0) {
            applyDayData(response, dateInput);
            setAgendaBootstrapping(false);
            return;
          }
        } catch {
          // Ainda montando — tenta de novo até o prazo.
        }
        await new Promise((resolve) =>
          setTimeout(resolve, AGENDA_BOOTSTRAP_POLL_MS),
        );
      }
      if (!cancelled) {
        setAgendaBootstrapping(false);
      }
    };

    void poll();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bootstrap one-shot após onboarding
  }, [agendaBootstrapping, companyPublicId, applyDayData]);

  const fetchData = useCallback(
    async (dateInput: string, opts?: { silent?: boolean }) => {
      if (!companyPublicId) {
        return;
      }
      const gen = ++fetchGenRef.current;
      if (!opts?.silent) setDayLoadError(false);
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
        if (gen === fetchGenRef.current && !opts?.silent) {
          setLoadedDateKey(dateInput);
          setDayLoadError(true);
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

  const prefetchAdjacentDays = useCallback(
    (centerDate: Date) => {
      if (!companyPublicId) return;
      for (const offset of [-1, 1] as const) {
        const dateInput = toDateKey(addDays(centerDate, offset));
        if (isSchedulesDayCacheFresh(companyPublicId, dateInput)) continue;
        void (async () => {
          try {
            const response = await getSchedulesByCompanyPublicIdAndDate({
              companyPublicId,
              date: dateInput,
            });
            const uniqueCourts = [
              ...new Set(response.map((item) => item.court)),
            ].sort((a, b) =>
              a.localeCompare(b, "pt-BR", { sensitivity: "base" }),
            );
            setSchedulesDayCache(
              companyPublicId,
              dateInput,
              response,
              uniqueCourts,
            );
          } catch {
            // prefetch best-effort — falha não afeta a agenda atual
          }
        })();
      }
    },
    [companyPublicId],
  );

  useEffect(() => {
    // Só busca agenda com entitlement confirmado (trial expirado = paywall, não readonly).
    if (!caps.ready || !caps.canViewAgenda) return;
    if (agendaBootstrapping) return;
    if (!companyPublicId || !date) return;
    const dateInput = toDateKey(date);
    const cached = getSchedulesDayCache(companyPublicId, dateInput);

    if (cached) {
      setList(cached.list);
      setCourtsNameList(cached.courtsNameList);
      setLoadedDateKey(dateInput);
      setDayLoadError(false);
      // Fresco: não refetch. Velho: revalida sem spinner.
      if (!isSchedulesDayCacheFresh(companyPublicId, dateInput)) {
        void fetchData(dateInput, { silent: true });
      }
      return;
    }

    void fetchData(dateInput);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- evita loop com withLoading instável
  }, [companyPublicId, date, caps.ready, caps.canViewAgenda, agendaBootstrapping]);

  useEffect(() => {
    if (!caps.ready || !caps.canViewAgenda) return;
    if (!companyPublicId || !date) return;
    if (loadedDateKey !== toDateKey(date)) return;
    const timer = window.setTimeout(() => {
      prefetchAdjacentDays(date);
    }, 280);
    return () => window.clearTimeout(timer);
  }, [
    companyPublicId,
    date,
    loadedDateKey,
    prefetchAdjacentDays,
    caps.ready,
    caps.canViewAgenda,
  ]);

  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  useEffect(() => {
    setReminderDate(date);
    return () => setReminderDate(null);
  }, [date, setReminderDate]);

  const sportOptions = useMemo(() => {
    const unique = new Map<string, string>();
    for (const sports of Object.values(courtSportsByName)) {
      for (const sport of sports) {
        const key = normalizeText(sport);
        if (!key || unique.has(key)) continue;
        unique.set(key, sport);
      }
    }
    return [...unique.values()].sort((a, b) =>
      a.localeCompare(b, "pt-BR", { sensitivity: "base" }),
    );
  }, [courtSportsByName]);

  const showSportFilter = sportOptions.length > 2;

  useEffect(() => {
    if (!sportSelected) return;
    const selectedKey = normalizeText(sportSelected);
    const stillExists = sportOptions.some(
      (sport) => normalizeText(sport) === selectedKey,
    );
    if (!stillExists) setSportSelected("");
  }, [sportOptions, sportSelected]);

  const filteredList = useMemo(() => {
    const query = normalizeText(customerQuery.trim());
    const sportKey = normalizeText(sportSelected);
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
      .filter((elementSport) => {
        if (!sportKey) return true;
        const courtSports = courtSportsByName[elementSport.court] ?? [];
        return courtSports.some(
          (sport) => normalizeText(sport) === sportKey,
        );
      })
      .filter((elementPeriod) =>
        hourInAgendaPeriod(elementPeriod.time, periodSelected),
      )
      .filter((elementCustomer) => {
        if (!query) return true;
        return normalizeText(elementCustomer.customerName || "").includes(
          query
        );
      });
  }, [
    list,
    date,
    statusSelected,
    courtSelected,
    customerQuery,
    sportSelected,
    periodSelected,
    courtSportsByName,
  ]);

  // Skeleton enquanto o dia selecionado ainda não foi aplicado (evita empty state piscando)
  const showListLoading = loadedDateKey !== toDateKey(date);
  const sheetFiltersActive = Boolean(
    statusSelected || sportSelected || periodSelected,
  );
  const hasActiveFilters = Boolean(
    statusSelected || customerQuery.trim() || sheetFiltersActive,
  );
  const dayTitle = format(date, "EEEE, d 'de' MMMM", { locale: ptBR });

  const shiftDay = useCallback((deltaDays: -1 | 1) => {
    setDate((current) => startOfDay(addDays(current, deltaDays)));
  }, []);

  const daySwipe = useDaySwipe(shiftDay);

  const listShellClass =
    "mx-auto w-full space-y-1.5 px-3 pt-2 lg:max-w-6xl lg:space-y-2 lg:px-8";

  const clearDayFilters = () => {
    setStatusSelected(null);
    setCustomerQuery("");
    setSportSelected("");
    setPeriodSelected("");
  };

  const filterSummaryParts = [
    agendaStatusLabel(statusSelected),
    sportSelected || null,
    periodSelected ? agendaPeriodLabel(periodSelected) : null,
  ].filter(Boolean) as string[];

  const hoursList =
    agendaBootstrapping || showListLoading ? (
      <AgendaConfiguringPanel />
    ) : dayLoadError ? (
    <EmptyState
      title="Não foi possível carregar a agenda."
      description="Sua grade continua no servidor. Tente de novo."
      action={
        <button
          type="button"
          onClick={() => void fetchData(toDateKey(date))}
          className={emptyStateActionClassName()}
        >
          Tentar de novo
        </button>
      }
    />
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
          isPublic={item.isPublic}
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
          ? "Nenhum horário com este cliente"
          : sheetFiltersActive || statusSelected
            ? "Nenhum horário para este filtro"
            : "Nenhum horário neste dia"
      }
      description={
        customerQuery.trim()
          ? "Tente outro nome ou limpe a busca."
          : sheetFiltersActive || statusSelected
            ? "Limpe os filtros para ver todos os horários do dia."
            : "A grade deste dia aparece aqui quando há horários."
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
      {caps.loadError ? (
        <section className="mpn-page items-center justify-center bg-master px-4 text-text-light">
          <EmptyState
            title="Não foi possível carregar sua conta."
            description="Sem isso não dá para saber se a agenda está liberada. Tente de novo."
            action={
              <button
                type="button"
                onClick={() => void caps.retry()}
                className={emptyStateActionClassName()}
              >
                Tentar de novo
              </button>
            }
          />
        </section>
      ) : !caps.ready || agendaBootstrapping ? (
        <section
          className="mpn-page bg-master text-text-light"
          aria-busy="true"
          aria-label="Configurando os horários"
        >
          <AgendaConfiguringPanel />
        </section>
      ) : !caps.canViewAgenda ? (
        <section className="mpn-page items-center justify-center bg-master px-4 text-text-light">
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
      <section className="mpn-page bg-master text-text-light">
        <div
          className="mpn-page-scroll mpn-scroll-end"
          {...daySwipe}
        >
          <div
            data-agenda-day-sticky
            className="sticky top-0 z-10 bg-master-light"
          >
            <div className="mx-auto w-full lg:max-w-6xl lg:px-8">
              <div data-no-day-swipe>
                <DateStrip selectedDate={date} setSelectedDate={setDate} />
              </div>
              <p className="sr-only" aria-live="polite">
                {dayTitle}
              </p>
            </div>
          </div>

          <div className="bg-master px-3 pt-2 lg:px-8">
            <div className="mx-auto flex w-full items-center justify-between gap-2 lg:max-w-6xl">
              <CalendarButton selectedDate={date} setSelectedDate={setDate} />
              <Link
                to="/configuracoes-horarios"
                state={{ date }}
                aria-label="Detalhes do dia"
                className="mpn-tap flex size-11 shrink-0 items-center justify-center rounded-xl text-text-light transition hover:bg-text-light/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
              >
                <MdOutlineEventNote size={22} aria-hidden />
              </Link>
            </div>
          </div>

          <div className="bg-master px-3 pb-4 pt-2 lg:px-8 lg:pb-5">
            <div className="mx-auto w-full lg:max-w-6xl">
              <div data-no-day-swipe>
                <LegendAndFilters
                  courtsNameList={courtsNameList}
                  courtSelected={courtSelected}
                  setCourtSelected={setCourtSelected}
                />
              </div>

              <div className="mt-2 flex items-center gap-2">
                <label className="min-w-0 flex-1">
                  <span className="sr-only">Buscar cliente no dia</span>
                  <input
                    type="search"
                    value={customerQuery}
                    onChange={(e) => setCustomerQuery(e.target.value)}
                    placeholder="Buscar cliente"
                    autoComplete="off"
                    enterKeyHint="search"
                    className="mpn-tap h-10 w-full rounded-xl bg-master-light px-3.5 text-base text-text-light placeholder:text-text-light/55 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setFiltersSheetOpen(true)}
                  aria-label={
                    sheetFiltersActive
                      ? `Filtros ativos: ${filterSummaryParts.join(", ")}`
                      : "Filtros"
                  }
                  aria-pressed={sheetFiltersActive}
                  className={`mpn-tap relative flex size-10 shrink-0 items-center justify-center rounded-xl transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue ${
                    sheetFiltersActive
                      ? "bg-accent-blue/20 text-accent-blue-soft"
                      : "bg-master-light text-text-light/70 hover:bg-text-light/10"
                  }`}
                >
                  <MdOutlineFilterList size={20} aria-hidden />
                  {sheetFiltersActive ? (
                    <span
                      className="absolute -right-1 -top-1 size-2.5 rounded-full bg-accent-blue"
                      aria-hidden
                    />
                  ) : null}
                </button>
              </div>

              {filterSummaryParts.length > 0 ? (
                <p className="mt-2 truncate px-1 text-base text-text-light/70">
                  {filterSummaryParts.join(" · ")}
                </p>
              ) : null}

            </div>
          </div>

          {hoursList}
        </div>

        <ActivateCourtGuideModal
          isOpen={showActivateGuide}
          onClose={handleCloseActivateGuide}
          publicUrl={publicArenaUrl}
          onGoToCourts={() => {
            handleCloseActivateGuide();
            navigate("/quadras");
          }}
        />
        <AgendaFiltersSheet
          open={filtersSheetOpen}
          sports={sportOptions}
          showSportSection={showSportFilter}
          selectedStatus={statusSelected}
          selectedSport={sportSelected}
          selectedPeriod={periodSelected}
          onClose={() => setFiltersSheetOpen(false)}
          onSelectStatus={setStatusSelected}
          onSelectSport={setSportSelected}
          onSelectPeriod={setPeriodSelected}
        />
      </section>
      )}
    </AppLayout>
  );
}

export default Reservation;
