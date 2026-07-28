import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { MdChevronLeft } from "react-icons/md";
import Input from "../../../components/Input";
import Button, { buttonClassName } from "../../../components/Button";
import CheckboxGroup from "../../../components/CheckboxGroup";
import Select from "../../../components/Select";
import OnboardingFooter from "../../../components/OnboardingFooter";
import {
  areAllCourtsCreated,
  COURT_FLOORS,
  COURT_SPORTS,
  CourtFloor,
  CourtSport,
  getEnabledScheduleSlots,
  getOrCreateOnboardingDraft,
  isArenaConfigured,
  MockCourt,
  MockOnboardingState,
  upsertMockCourt,
  WeekDayKey,
} from "../../../onboarding/mockStore";
import { getAccessToken } from "../../../utils/authCookie";
import { formatCurrencyBRL } from "../../../utils/formatCurrency";

function scrollCourtPageToTop(pageEl: HTMLElement | null) {
  window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  pageEl?.scrollTo({ top: 0, behavior: "smooth" });
}

function digitsFromReais(value: number): string {
  if (!(value > 0)) return "";
  return String(Math.round(value * 100));
}

function reaisFromDigits(digits: string): number {
  const cents = Number(digits);
  if (!Number.isFinite(cents) || cents <= 0) return 0;
  return cents / 100;
}

function slotKey(dayKey: WeekDayKey, hour: string): string {
  return `${dayKey}|${hour}`;
}

function OnboardingCourt() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pageRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<MockOnboardingState | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [courtName, setCourtName] = useState("");
  const [priceDigits, setPriceDigits] = useState("");
  const [customPricing, setCustomPricing] = useState(false);
  /** Digits de preço por dia|hora (override local no editor). */
  const [slotPriceDigits, setSlotPriceDigits] = useState<Record<string, string>>(
    {},
  );
  const [sports, setSports] = useState<CourtSport[]>([]);
  const [floor, setFloor] = useState<CourtFloor | "">("");
  const [formError, setFormError] = useState("");

  const price = useMemo(() => reaisFromDigits(priceDigits), [priceDigits]);

  const enabledDays = useMemo(
    () => getEnabledScheduleSlots(state?.scheduleTemplate),
    [state?.scheduleTemplate],
  );

  const openEditor = useCallback((slotIndex: number, court?: MockCourt | null) => {
    setEditingIndex(slotIndex);
    setCourtName(court?.name ?? `Q${slotIndex + 1}`);
    setPriceDigits(
      court && court.defaultPrice > 0
        ? digitsFromReais(court.defaultPrice)
        : "",
    );
    const enabled = Boolean(court?.customPricingEnabled);
    setCustomPricing(enabled);
    const digits: Record<string, string> = {};
    if (enabled && court?.priceOverrides) {
      for (const [dayKey, hours] of Object.entries(court.priceOverrides)) {
        if (!hours) continue;
        for (const [hour, value] of Object.entries(hours)) {
          if (typeof value === "number" && value > 0) {
            digits[slotKey(dayKey as WeekDayKey, hour)] = digitsFromReais(value);
          }
        }
      }
    }
    setSlotPriceDigits(digits);
    setSports(court?.sports ?? []);
    setFloor(court?.floor ?? "");
    setFormError("");
  }, []);

  useEffect(() => {
    if (!getAccessToken()) {
      navigate("/");
      return;
    }
    const mock = getOrCreateOnboardingDraft();
    if (!isArenaConfigured(mock)) {
      navigate("/comecar/estabelecimento");
      return;
    }
    setState(mock);
    if (!mock.hasScheduleTemplate) return;

    const requested = Number.parseInt(searchParams.get("q") ?? "", 10);
    if (
      Number.isInteger(requested) &&
      requested >= 0 &&
      requested < mock.courtCount &&
      requested <= mock.courts.length
    ) {
      openEditor(requested, mock.courts[requested] ?? null);
      return;
    }

    if (!areAllCourtsCreated(mock)) {
      openEditor(mock.courts.length);
    }
  }, [navigate, searchParams, openEditor]);

  if (!state) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-master text-text-light/70">
        Carregando…
      </div>
    );
  }

  const blocked = !state.hasScheduleTemplate;
  const slots: Array<MockCourt | null> = Array.from(
    { length: state.courtCount },
    (_, i) => state.courts[i] ?? null,
  );
  const doneCount = Math.min(
    state.courts.filter(
      (c) => c.defaultPrice > 0 && c.sports.length > 0 && !!c.floor,
    ).length,
    state.courtCount,
  );

  const handleSlotPriceChange = (dayKey: WeekDayKey, hour: string, raw: string) => {
    const digits = raw.replace(/\D/g, "");
    const key = slotKey(dayKey, hour);
    setSlotPriceDigits((prev) => {
      const next = { ...prev };
      if (digits === "") {
        delete next[key];
      } else {
        next[key] = digits;
      }
      return next;
    });
    if (formError) setFormError("");
  };

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    setFormError("");
    if (editingIndex === null || !courtName.trim()) return;

    if (price <= 0) {
      setFormError("Informe o preço padrão da quadra.");
      return;
    }

    if (sports.length === 0) {
      setFormError("Selecione ao menos um esporte.");
      return;
    }

    if (!floor) {
      setFormError("Selecione o tipo de piso.");
      return;
    }

    let priceOverrides: MockCourt["priceOverrides"];
    if (customPricing) {
      const overrides: NonNullable<MockCourt["priceOverrides"]> = {};
      for (const day of enabledDays) {
        for (const hour of day.hours) {
          const digits = slotPriceDigits[slotKey(day.dayKey, hour)];
          const slotPrice = digits ? reaisFromDigits(digits) : price;
          if (!(slotPrice > 0)) {
            setFormError(
              `Informe o preço de ${day.dayLabel} às ${hour}.`,
            );
            return;
          }
          if (slotPrice !== price) {
            if (!overrides[day.dayKey]) overrides[day.dayKey] = {};
            overrides[day.dayKey]![hour] = slotPrice;
          }
        }
      }
      priceOverrides =
        Object.keys(overrides).length > 0 ? overrides : undefined;
    }

    const existing = state.courts[editingIndex];
    if (!existing && editingIndex !== state.courts.length) return;

    upsertMockCourt(
      {
        id: existing?.id ?? `court-${editingIndex + 1}-${Date.now()}`,
        name: courtName.trim(),
        defaultPrice: price,
        customPricingEnabled: customPricing || undefined,
        priceOverrides,
        sports,
        floor,
      },
      existing ? editingIndex : undefined,
    );

    const next = getOrCreateOnboardingDraft();
    setState(next);
    setEditingIndex(null);

    if (areAllCourtsCreated(next)) {
      navigate("/comecar");
      return;
    }

    openEditor(next.courts.length);
    requestAnimationFrame(() => {
      scrollCourtPageToTop(pageRef.current);
    });
  };

  return (
    <div
      ref={pageRef}
      className="min-h-dvh bg-master px-4 py-6 text-text-light lg:h-full lg:min-h-0 lg:overflow-y-auto"
    >
      <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-lg flex-col lg:min-h-full">
        <div className="-ml-2 flex items-center gap-1">
          <Link
            to="/comecar"
            aria-label="Voltar"
            className="mpn-tap flex size-11 shrink-0 items-center justify-center rounded-xl text-text-light/80"
          >
            <MdChevronLeft size={28} aria-hidden />
          </Link>
          <h1 className="min-w-0 truncate text-2xl font-bold tracking-tight">
            Quadras
          </h1>
        </div>
        <p className="mt-3 rounded-lg bg-master-light px-3 py-2 text-sm font-medium text-text-light/70">
          Informe o preço padrão; se quiser, personalize por horário
        </p>

        {blocked ? (
          <div className="mt-6 rounded-2xl bg-master-light p-5">
            <p className="text-base text-text-light/80">
              Configure o horário antes de criar as quadras.
            </p>
            <Link
              to="/comecar/horario"
              className={buttonClassName({
                variant: "primary",
                className: "mt-4",
              })}
            >
              Ir para horário
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between text-sm text-text-light/60">
                <span>
                  Quadra{" "}
                  {Math.min((editingIndex ?? doneCount) + 1, state.courtCount)}{" "}
                  de {state.courtCount}
                </span>
                <span>
                  {doneCount}/{state.courtCount} concluídas
                </span>
              </div>
              <div className="flex gap-1.5">
                {slots.map((court, index) => {
                  const done =
                    !!court &&
                    court.defaultPrice > 0 &&
                    court.sports.length > 0 &&
                    !!court.floor;
                  const current = editingIndex === index;
                  const clickable = index <= state.courts.length;
                  return (
                    <button
                      key={court?.id ?? `seg-${index}`}
                      type="button"
                      aria-label={`Quadra ${index + 1}${
                        done ? " (concluída)" : ""
                      }`}
                      aria-current={current || undefined}
                      disabled={!clickable}
                      onClick={() => {
                        openEditor(index, court);
                        requestAnimationFrame(() => {
                          scrollCourtPageToTop(pageRef.current);
                        });
                      }}
                      className="mpn-tap min-w-0 flex-1 py-2 disabled:cursor-default"
                    >
                      <span
                        className={`block h-2 rounded-full transition-colors ${
                          done
                            ? "bg-accent-green"
                            : current
                              ? "bg-accent-blue"
                              : "bg-master-light"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {editingIndex !== null && (
              <form
                onSubmit={handleSave}
                className="mt-4 rounded-2xl bg-master-light p-5"
                noValidate
              >
                <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-light/45">
                  Quadra {editingIndex + 1} de {state.courtCount}
                </p>
                <Input
                  name="courtName"
                  title="Nome da quadra"
                  placeholder={`Q${editingIndex + 1}`}
                  type="text"
                  mode="dark"
                  value={courtName}
                  onChange={(e) => {
                    setCourtName(e.target.value);
                    if (formError) setFormError("");
                  }}
                  required
                />
                <Input
                  name="courtPrice"
                  title="Preço padrão (R$/hora)"
                  placeholder="R$ 0,00"
                  type="text"
                  inputMode="numeric"
                  mode="dark"
                  value={
                    priceDigits
                      ? formatCurrencyBRL(Number(priceDigits) / 100)
                      : ""
                  }
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "");
                    setPriceDigits(digits === "" ? "" : digits);
                    if (formError) setFormError("");
                  }}
                  required
                  className="mt-1"
                  error={
                    formError.includes("preço padrão") ? formError : undefined
                  }
                />

                <label className="mt-3 flex min-h-14 cursor-pointer items-center gap-3 rounded-xl bg-master/40 px-3 py-3">
                  <input
                    type="checkbox"
                    className="size-5 shrink-0 accent-accent-blue"
                    checked={customPricing}
                    onChange={(e) => {
                      const on = e.target.checked;
                      setCustomPricing(on);
                      if (!on) setSlotPriceDigits({});
                      if (formError) setFormError("");
                    }}
                  />
                  <span>
                    <span className="block text-base font-medium text-text-light">
                      Preços personalizados
                    </span>
                    <span className="mt-0.5 block text-base text-text-light/60">
                      Defina valores diferentes por dia e horário
                    </span>
                  </span>
                </label>

                {customPricing && (
                  <div className="mt-4 space-y-4">
                    {enabledDays.length === 0 ? (
                      <p className="text-base text-text-light/70">
                        Nenhum horário aberto na grade. Volte e ajuste o horário.
                      </p>
                    ) : (
                      enabledDays.map((day) => (
                        <fieldset key={day.dayKey} className="min-w-0">
                          <legend className="mb-2 text-base font-semibold text-text-light/80">
                            {day.dayLabel}
                          </legend>
                          <ul className="space-y-3">
                            {day.hours.map((hour) => {
                              const key = slotKey(day.dayKey, hour);
                              const digits = slotPriceDigits[key];
                              const inputId = `price-${day.dayKey}-${hour.replace(":", "")}`;
                              return (
                                <li
                                  key={key}
                                  className="flex items-center gap-3"
                                >
                                  <label
                                    htmlFor={inputId}
                                    className="w-14 shrink-0 text-base font-medium tabular-nums text-text-light/80"
                                  >
                                    {hour}
                                  </label>
                                  <input
                                    id={inputId}
                                    name={inputId}
                                    type="text"
                                    inputMode="numeric"
                                    enterKeyHint="next"
                                    aria-label={`Preço ${day.dayLabel} às ${hour}`}
                                    placeholder={
                                      price > 0
                                        ? formatCurrencyBRL(price)
                                        : "R$ 0,00"
                                    }
                                    value={
                                      digits
                                        ? formatCurrencyBRL(
                                            Number(digits) / 100,
                                          )
                                        : ""
                                    }
                                    onChange={(e) =>
                                      handleSlotPriceChange(
                                        day.dayKey,
                                        hour,
                                        e.target.value,
                                      )
                                    }
                                    className="mpn-field-dark min-h-14 min-w-0 flex-1 rounded-xl border-0 bg-master px-4 py-3.5 text-lg font-medium leading-7 text-text-light placeholder:font-normal placeholder:text-text-light/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/80 focus-visible:ring-offset-2 focus-visible:ring-offset-master-light"
                                  />
                                </li>
                              );
                            })}
                          </ul>
                        </fieldset>
                      ))
                    )}
                  </div>
                )}

                <CheckboxGroup
                  name="sports"
                  title="Esportes aceitos"
                  mode="dark"
                  required
                  className="mt-1"
                  options={COURT_SPORTS.map((s) => ({
                    value: s.key,
                    label: s.label,
                  }))}
                  value={sports}
                  onChange={(next) => {
                    setSports(next as CourtSport[]);
                    if (formError) setFormError("");
                  }}
                  error={formError.includes("esporte") ? formError : undefined}
                />

                <Select
                  name="floor"
                  title="Tipo de piso"
                  mode="dark"
                  required
                  placeholder="Selecione o piso"
                  className="mt-1"
                  value={floor}
                  options={COURT_FLOORS.map((f) => ({
                    id: f.key,
                    name: f.label,
                  }))}
                  onChange={(e) => {
                    setFloor(e.target.value as CourtFloor | "");
                    if (formError) setFormError("");
                  }}
                />

                {formError &&
                  !/preço padrão|esporte/.test(formError) && (
                  <p
                    className="mb-2 text-base font-medium text-danger-400"
                    role="alert"
                  >
                    {formError}
                  </p>
                )}

                <div className="mt-4 flex flex-col gap-2">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={
                      !courtName.trim() ||
                      price <= 0 ||
                      sports.length === 0 ||
                      !floor
                    }
                  >
                    {editingIndex >= state.courtCount - 1
                      ? "Salvar e concluir"
                      : "Salvar e ir para a próxima"}
                  </Button>
                </div>
              </form>
            )}

            {areAllCourtsCreated(state) && editingIndex === null && (
              <Link
                to="/comecar"
                className={buttonClassName({
                  variant: "success",
                  className: "mt-6",
                })}
              >
                Concluir e voltar ao checklist
              </Link>
            )}
          </>
        )}

        <OnboardingFooter />
      </div>
    </div>
  );
}

export default OnboardingCourt;
