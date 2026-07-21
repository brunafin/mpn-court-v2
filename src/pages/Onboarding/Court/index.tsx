import { useCallback, useEffect, useMemo, useState } from "react";
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
  CourtFloor,
  getOrCreateOnboardingDraft,
  isArenaConfigured,
  MockCourt,
  MockOnboardingState,
  upsertMockCourt,
} from "../../../onboarding/mockStore";
import {
  getSports,
  getTypeOfCourts,
  Sport,
  TypeOfCourt,
} from "../../../api/onboarding";
import { getAccessToken } from "../../../utils/authCookie";
import { formatCurrencyBRL } from "../../../utils/formatCurrency";

function OnboardingCourt() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<MockOnboardingState | null>(null);
  const [sportsCatalog, setSportsCatalog] = useState<Sport[]>([]);
  const [typesCatalog, setTypesCatalog] = useState<TypeOfCourt[]>([]);
  const [catalogError, setCatalogError] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [courtName, setCourtName] = useState("");
  const [priceDigits, setPriceDigits] = useState("");
  const [sportIds, setSportIds] = useState<number[]>([]);
  const [typeOfCourtId, setTypeOfCourtId] = useState<number | "">("");
  const [floor, setFloor] = useState<CourtFloor | "">("");
  const [formError, setFormError] = useState("");

  const price = useMemo(() => {
    const cents = Number(priceDigits);
    if (!Number.isFinite(cents) || cents <= 0) return 0;
    return cents / 100;
  }, [priceDigits]);

  const openEditor = useCallback((slotIndex: number, court?: MockCourt | null) => {
    setEditingIndex(slotIndex);
    setCourtName(court?.name ?? `Q${slotIndex + 1}`);
    setPriceDigits(
      court && court.defaultPrice > 0
        ? String(Math.round(court.defaultPrice * 100))
        : ""
    );
    setSportIds(court?.sportIds ?? []);
    setTypeOfCourtId(court?.typeOfCourtId ?? "");
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

  useEffect(() => {
    let active = true;
    Promise.all([getSports(), getTypeOfCourts()])
      .then(([sports, types]) => {
        if (!active) return;
        setSportsCatalog(sports);
        setTypesCatalog(types);
      })
      .catch(() => {
        if (active) setCatalogError("Não foi possível carregar esportes e tipos.");
      });
    return () => {
      active = false;
    };
  }, []);

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
    (_, i) => state.courts[i] ?? null
  );
  const doneCount = Math.min(
    state.courts.filter(
      (c) => c.defaultPrice > 0 && c.sportIds.length > 0 && !!c.typeOfCourtId
    ).length,
    state.courtCount
  );

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    setFormError("");
    if (editingIndex === null || !courtName.trim()) return;

    if (price <= 0) {
      setFormError("Informe o preço padrão da quadra.");
      return;
    }

    if (!typeOfCourtId) {
      setFormError("Selecione o tipo de quadra.");
      return;
    }

    if (sportIds.length === 0) {
      setFormError("Selecione ao menos um esporte.");
      return;
    }

    const existing = state.courts[editingIndex];
    if (!existing && editingIndex !== state.courts.length) return;

    upsertMockCourt(
      {
        id: existing?.id ?? `court-${editingIndex + 1}-${Date.now()}`,
        name: courtName.trim(),
        defaultPrice: price,
        sportIds,
        typeOfCourtId,
        floor: floor || undefined,
      },
      existing ? editingIndex : undefined
    );

    const next = getOrCreateOnboardingDraft();
    setState(next);
    setEditingIndex(null);

    if (areAllCourtsCreated(next)) {
      navigate("/comecar");
    } else {
      openEditor(next.courts.length);
    }
  };

  return (
    <div className="min-h-dvh bg-master px-4 py-6 text-text-light">
      <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-lg flex-col">
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
          Cada quadra tem seu preço; a grade de horários usa esse valor
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
                  Quadra {Math.min((editingIndex ?? doneCount) + 1, state.courtCount)} de{" "}
                  {state.courtCount}
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
                    court.sportIds.length > 0 &&
                    !!court.typeOfCourtId;
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
                      onClick={() => openEditor(index, court)}
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

            {catalogError && (
              <p className="mt-4 rounded-lg bg-danger-400/15 px-3 py-2 text-sm font-medium text-danger-400">
                {catalogError}
              </p>
            )}

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
                  error={formError.includes("preço") ? formError : undefined}
                />

                <Select
                  name="typeOfCourt"
                  title="Tipo de quadra"
                  mode="dark"
                  required
                  placeholder="Selecione o tipo"
                  className="mt-1"
                  value={typeOfCourtId}
                  options={typesCatalog.map((t) => ({ id: t.id, name: t.name }))}
                  onChange={(e) => {
                    setTypeOfCourtId(e.target.value ? Number(e.target.value) : "");
                    if (formError) setFormError("");
                  }}
                />

                <CheckboxGroup
                  name="sports"
                  title="Esportes aceitos"
                  mode="dark"
                  required
                  className="mt-1"
                  options={sportsCatalog.map((s) => ({
                    value: String(s.id),
                    label: s.name,
                  }))}
                  value={sportIds.map(String)}
                  onChange={(next) => {
                    setSportIds(next.map(Number));
                    if (formError) setFormError("");
                  }}
                  error={formError.includes("esporte") ? formError : undefined}
                />

                <Select
                  name="floor"
                  title="Tipo de piso (opcional)"
                  mode="dark"
                  placeholder="Selecione o piso"
                  className="mt-1"
                  value={floor}
                  options={COURT_FLOORS.map((f) => ({
                    id: f.key,
                    name: f.label,
                  }))}
                  onChange={(e) => setFloor(e.target.value as CourtFloor | "")}
                />

                {formError && !/preço|esporte/.test(formError) && (
                  <p className="mb-2 text-base font-medium text-danger-400" role="alert">
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
                      !typeOfCourtId ||
                      sportIds.length === 0
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
