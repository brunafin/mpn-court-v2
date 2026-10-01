import { Link, useLocation, useNavigate } from "react-router-dom";
import { MdOutlineArrowBackIos, MdOutlineEventBusy } from "react-icons/md";
import { useLoading } from "../../hooks/useLoading";
import { IReservationItemProps } from "../Reservation/interface";
import {
  getAllSchedulesByCompanyPublicIdAndDate,
  setAvailabilityBatch,
  setDayAvailability,
} from "../../api/schedules";
import { ReservationStatusEnum } from "../Reservation/enum";
import { format, isValid, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  getAccessToken,
  getAccessTokenPayload,
} from "../../utils/authCookie";
import { StatusIcons } from "../Reservation/statusIcons";
import EmptyState, {
  emptyStateActionClassName,
} from "../../components/EmptyState";
import { PageTitle } from "../../components/PageTitle";
import ConfirmSheet, { ConfirmTone } from "../../components/ConfirmSheet";
import { useErrors } from "../../contexts/ErrorsContext";
import { invalidateSchedulesDayCache } from "../../utils/schedulesDayCache";
import { useCompanyCapabilities } from "../../contexts/CompanyBrandingContext";
import { billingNavPath } from "../../utils/billingNav";
import { useCallback, useEffect, useMemo, useState } from "react";

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
  const { notifyError } = useErrors();
  const location = useLocation();
  const navigate = useNavigate();
  const caps = useCompanyCapabilities();
  const canMutate = caps.canMutate;
  const [companyPublicId, setCompanyPublicId] = useState<string>("");
  const [list, setList] = useState<IReservationItemProps[]>([]);
  const [date] = useState<Date>(() => parseIncomingDate(location.state?.date));
  const [confirmCloseDay, setConfirmCloseDay] = useState(false);
  const [dayActionLoading, setDayActionLoading] = useState(false);
  const [selectedInactiveIds, setSelectedInactiveIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [batchActivateLoading, setBatchActivateLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const dateKey = format(date, "yyyy-MM-dd");
  const dayName = format(date, "d 'de' MMMM", { locale: ptBR });
  const dayTitleRaw = format(date, "EEEE, d 'de' MMMM", { locale: ptBR });
  const dayTitle =
    dayTitleRaw.charAt(0).toLocaleUpperCase("pt-BR") + dayTitleRaw.slice(1);

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
        setLoadError(false);
        await withLoading(async () => {
          const dayData = await getAllSchedulesByCompanyPublicIdAndDate({
            companyPublicId,
            date: dateInput,
          });
          setList(dayData.schedules);
          setSelectedInactiveIds(new Set());
          setLoadError(false);
        });
      } catch (error: any) {
        setLoadError(true);
        if (error?.response?.status !== 401) {
          console.error(error);
        }
      }
    },
    [companyPublicId, dateKey],
  );

  useEffect(() => {
    if (!companyPublicId) return;
    fetchData(dateKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- evita loop com withLoading instável
  }, [companyPublicId, dateKey]);

  const counts = useMemo(() => {
    const available = list.filter(
      (item) => item.status === ReservationStatusEnum.AVAILABLE,
    ).length;
    const reserved = list.filter(
      (item) => item.status === ReservationStatusEnum.RESERVED,
    ).length;
    const fixed = list.filter(
      (item) => item.status === ReservationStatusEnum.FIXED,
    ).length;
    const inactive = list.filter(
      (item) => item.status === ReservationStatusEnum.INACTIVE,
    ).length;
    return { available, reserved, fixed, inactive };
  }, [list]);

  const inactiveHours = useMemo(() => {
    return list.filter(
      (item) => item.status === ReservationStatusEnum.INACTIVE,
    );
  }, [list]);

  const selectableInactiveHours = useMemo(() => {
    return inactiveHours.filter((item) => {
      const isPast =
        new Date(`${dateKey}T${item.time}`) <
        new Date(new Date().setSeconds(0, 0));
      return !isPast;
    });
  }, [inactiveHours, dateKey]);

  const allSelectableSelected =
    selectableInactiveHours.length > 0 &&
    selectableInactiveHours.every((item) =>
      selectedInactiveIds.has(item.scheduleId),
    );

  const summaryRows = [
    {
      key: "available",
      label: "Disponíveis",
      count: counts.available,
      Icon: StatusIcons.available,
      iconClass: "text-accent-green",
      iconBgClass: "bg-accent-green/15",
      barClass: "bg-accent-green",
    },
    {
      key: "reserved",
      label: "Reservados",
      count: counts.reserved,
      Icon: StatusIcons.reserved,
      iconClass: "text-accent-blue-soft",
      iconBgClass: "bg-accent-blue/15",
      barClass: "bg-accent-blue",
    },
    {
      key: "fixed",
      label: "Fixos",
      count: counts.fixed,
      Icon: StatusIcons.fixed,
      iconClass: "text-accent-purple-soft",
      iconBgClass: "bg-accent-purple/15",
      barClass: "bg-accent-purple",
    },
    {
      key: "inactive",
      label: "Inativos",
      count: counts.inactive,
      Icon: StatusIcons.inactive,
      iconClass: "text-danger-soft",
      iconBgClass: "bg-danger-400/15",
      barClass: "bg-danger-soft",
    },
  ];

  const totalHours =
    counts.available + counts.reserved + counts.fixed + counts.inactive;
  const showSummaryLoading = loading && list.length === 0;

  const toggleInactiveSelection = (scheduleId: string) => {
    setSelectedInactiveIds((prev) => {
      const next = new Set(prev);
      if (next.has(scheduleId)) next.delete(scheduleId);
      else next.add(scheduleId);
      return next;
    });
  };

  const toggleSelectAllInactive = () => {
    if (allSelectableSelected) {
      setSelectedInactiveIds(new Set());
      return;
    }
    setSelectedInactiveIds(
      new Set(selectableInactiveHours.map((item) => item.scheduleId)),
    );
  };

  const handleConfirmCloseDay = async () => {
    if (!canMutate || !companyPublicId || dayActionLoading) return;
    setDayActionLoading(true);
    try {
      const result = await setDayAvailability(
        companyPublicId,
        dateKey,
        false,
      );
      invalidateSchedulesDayCache(companyPublicId, dateKey);
      setConfirmCloseDay(false);
      await fetchData(dateKey);
      notifyError({
        type: "success",
        message:
          result.updated === 0
            ? "Nenhum horário livre para inativar."
            : `Dia inativado: ${result.updated} horário${result.updated === 1 ? "" : "s"} inativado${result.updated === 1 ? "" : "s"}.`,
      });
    } catch (error) {
      if (
        (error as { response?: { status?: number } })?.response?.status !== 401
      ) {
        console.error(error);
      }
    } finally {
      setDayActionLoading(false);
    }
  };

  const handleActivateSelected = async () => {
    if (
      !canMutate ||
      !companyPublicId ||
      selectedInactiveIds.size === 0 ||
      batchActivateLoading
    )
      return;
    setBatchActivateLoading(true);
    try {
      const result = await setAvailabilityBatch(
        companyPublicId,
        [...selectedInactiveIds],
        true,
        dateKey,
      );
      invalidateSchedulesDayCache(companyPublicId, dateKey);
      await fetchData(dateKey);
      notifyError({
        type: "success",
        message:
          result.updated === 0
            ? "Nenhum horário selecionado pôde ser reativado."
            : `${result.updated} horário${result.updated === 1 ? "" : "s"} reativado${result.updated === 1 ? "" : "s"}.`,
      });
    } catch (error) {
      if (
        (error as { response?: { status?: number } })?.response?.status !== 401
      ) {
        console.error(error);
      }
    } finally {
      setBatchActivateLoading(false);
    }
  };

  return (
    <div className="mpn-page bg-master text-text-light">
      <header className="mpn-chrome-top z-10 shrink-0 bg-master px-3 pb-2 lg:px-8">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-2">
          <button
            type="button"
            onClick={() =>
              navigate(`/reservas`, {
                state: { date: dateKey },
              })
            }
            aria-label="Voltar para reservas"
            className="mpn-tap flex size-11 shrink-0 items-center justify-center rounded-xl text-text-light transition hover:bg-text-light/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
          >
            <MdOutlineArrowBackIos size={20} aria-hidden />
          </button>
          <div className="min-w-0">
            <PageTitle>Detalhes do dia</PageTitle>
            <p className="truncate text-base text-text-light/70">{dayTitle}</p>
          </div>
        </div>
      </header>

      <section className="mpn-page-scroll mpn-scroll-end mx-auto w-full max-w-6xl px-3 pt-2 lg:px-8">
        {!canMutate && caps.ready ? (
          <p className="mb-3 rounded-xl bg-master-light px-3 py-3 text-base leading-5 text-text-light/70">
            Conta em somente leitura — não é possível alterar horários.{" "}
            <Link
              to={billingNavPath(caps.entitlement)}
              className="font-semibold text-accent-blue-soft underline-offset-2 hover:underline"
            >
              Regularizar
            </Link>
          </p>
        ) : null}

        {loadError ? (
          <EmptyState
            title="Não foi possível carregar o dia."
            description="Os horários continuam no servidor. Tente de novo."
            action={
              <button
                type="button"
                onClick={() => void fetchData(dateKey)}
                className={emptyStateActionClassName()}
              >
                Tentar de novo
              </button>
            }
          />
        ) : (
        <>
        <div
          className={loading && list.length > 0 ? "opacity-70" : ""}
          aria-busy={loading}
        >
          <ul
            className={`flex flex-col gap-1.5 lg:grid lg:grid-cols-4 lg:gap-2 ${
              showSummaryLoading ? "animate-pulse" : ""
            }`}
            aria-label={showSummaryLoading ? "Carregando resumo" : "Resumo do dia"}
          >
            {summaryRows.map((row) => {
              const Icon = row.Icon;
              return (
                <li
                  key={row.key}
                  className="relative flex min-h-14 items-center overflow-hidden rounded-xl bg-master-light"
                >
                  <span
                    className={`absolute inset-y-2.5 left-0 w-1 rounded-full ${
                      showSummaryLoading ? "bg-text-light/15" : row.barClass
                    }`}
                    aria-hidden
                  />
                  <div className="flex min-w-0 flex-1 items-center gap-3 py-2.5 pl-4 pr-3">
                    {showSummaryLoading ? (
                      <>
                        <span className="size-8 shrink-0 rounded-full bg-text-light/10" />
                        <span className="h-4 w-24 rounded bg-text-light/10" />
                        <span className="ml-auto h-4 w-6 rounded bg-text-light/10" />
                      </>
                    ) : (
                      <>
                        <span
                          className={`flex size-8 shrink-0 items-center justify-center rounded-full ${row.iconBgClass} ${row.iconClass}`}
                        >
                          <Icon size={16} aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1 truncate text-base font-semibold text-text-light">
                          {row.label}
                        </span>
                        <span className="shrink-0 text-base font-semibold tabular-nums text-text-light">
                          {row.count}
                        </span>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="mt-2 flex items-center justify-between px-1">
            <span className="text-base text-text-light/70">Total do dia</span>
            {showSummaryLoading ? (
              <span className="h-4 w-6 animate-pulse rounded bg-text-light/10" />
            ) : (
              <span className="text-base font-semibold tabular-nums text-text-light">
                {totalHours}
              </span>
            )}
          </div>
        </div>

        {canMutate && counts.available > 0 ? (
          <button
            type="button"
            disabled={showSummaryLoading || dayActionLoading}
            onClick={() => setConfirmCloseDay(true)}
            className="mpn-tap mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-master-light px-4 text-base font-semibold text-danger-soft transition hover:bg-text-light/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue disabled:cursor-not-allowed disabled:opacity-50 lg:w-auto lg:min-w-[14rem]"
          >
            <MdOutlineEventBusy size={20} className="shrink-0" aria-hidden />
            Inativar o dia inteiro
          </button>
        ) : null}

        {inactiveHours.length > 0 && (
          <section className="mt-6">
            <div className="mb-2">
              <div className="mb-1 flex items-baseline justify-between gap-3">
                <h3 className="text-base font-semibold text-text-light">
                  Horários inativos
                </h3>
                <span className="text-base font-medium tabular-nums text-text-light/70">
                  {inactiveHours.length}
                </span>
              </div>
              <p className="text-base leading-5 text-text-light/70">
                {canMutate
                  ? "Selecione e reative em lote — sem diferença entre inativação avulsa ou do dia."
                  : "Somente leitura — reativação indisponível."}
              </p>
            </div>

            {canMutate && selectableInactiveHours.length > 0 && (
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={loading || batchActivateLoading}
                  onClick={toggleSelectAllInactive}
                  className="mpn-tap inline-flex min-h-11 items-center justify-center rounded-xl bg-master-light px-3 text-base font-semibold text-text-light/70 transition hover:bg-text-light/10 hover:text-text-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {allSelectableSelected
                    ? "Limpar seleção"
                    : "Selecionar todos"}
                </button>
                {selectedInactiveIds.size > 0 && (
                  <button
                    type="button"
                    disabled={loading || batchActivateLoading}
                    onClick={handleActivateSelected}
                    aria-busy={batchActivateLoading}
                    className="mpn-tap inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-master-light px-3 text-base font-semibold text-accent-green transition hover:bg-text-light/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-green disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <StatusIcons.available
                      size={20}
                      className="shrink-0"
                      aria-hidden
                    />
                    Ativar selecionados ({selectedInactiveIds.size})
                  </button>
                )}
              </div>
            )}

            <ul className="flex flex-col gap-1.5 lg:grid lg:grid-cols-2 lg:gap-2">
              {inactiveHours.map((inactiveHour) => {
                const isPast =
                  new Date(`${dateKey}T${inactiveHour.time}`) <
                  new Date(new Date().setSeconds(0, 0));
                const checked = selectedInactiveIds.has(
                  inactiveHour.scheduleId,
                );
                const checkboxId = `inactive-${inactiveHour.scheduleId}`;

                return (
                  <li
                    key={inactiveHour.scheduleId}
                    className={`relative flex min-h-14 items-center gap-3 overflow-hidden rounded-xl bg-master-light py-2.5 pl-4 pr-3 ${
                      isPast ? "opacity-50" : ""
                    }`}
                  >
                    <span
                      className="absolute inset-y-2.5 left-0 w-1 rounded-full bg-danger-soft"
                      aria-hidden
                    />
                    <input
                      id={checkboxId}
                      type="checkbox"
                      className="size-5 shrink-0 rounded border-text-light/30 accent-accent-green disabled:opacity-40"
                      checked={checked}
                      disabled={
                        !canMutate || loading || batchActivateLoading || isPast
                      }
                      onChange={() =>
                        toggleInactiveSelection(inactiveHour.scheduleId)
                      }
                      aria-label={`Selecionar ${inactiveHour.time} da quadra ${inactiveHour.court}`}
                    />
                    <label
                      htmlFor={checkboxId}
                      className="flex min-w-0 flex-1 cursor-pointer items-center gap-3"
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-danger-400/15 text-danger-soft">
                        <StatusIcons.inactive size={16} aria-hidden />
                      </span>
                      <div className="flex min-w-0 items-baseline gap-1.5">
                        <p className="min-w-0 truncate text-base font-semibold text-text-light">
                          {inactiveHour.court}
                        </p>
                        <span
                          className="shrink-0 text-base font-medium tabular-nums text-text-light/70"
                          aria-hidden
                        >
                          —
                        </span>
                        <p className="shrink-0 text-base font-semibold tabular-nums text-text-light">
                          {inactiveHour.time}
                        </p>
                      </div>
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
        </>
        )}
      </section>

      <ConfirmSheet
        isOpen={confirmCloseDay}
        title="Inativar o dia inteiro?"
        description={
          counts.available === 1
            ? counts.reserved + counts.fixed > 0
              ? `1 horário livre de ${dayName} deixa de aparecer como disponível. Reservas e fixos continuam.`
              : `1 horário livre de ${dayName} deixa de aparecer como disponível.`
            : counts.reserved + counts.fixed > 0
              ? `${counts.available} horários livres de ${dayName} deixam de aparecer como disponíveis. Reservas e fixos continuam.`
              : `${counts.available} horários livres de ${dayName} deixam de aparecer como disponíveis.`
        }
        confirmLabel="Inativar horários livres"
        tone={"danger" as ConfirmTone}
        loading={dayActionLoading}
        onConfirm={handleConfirmCloseDay}
        onClose={() => {
          if (!dayActionLoading) setConfirmCloseDay(false);
        }}
      />
    </div>
  );
}

export default ConfigDay;
