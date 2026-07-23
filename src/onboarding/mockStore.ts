import { clearPendingLogo } from "./pendingLogo";

const STORAGE_KEY = "mpn_onboarding_mock";

/** Esportes que uma quadra pode aceitar. */
export type CourtSport =
  | "futsal"
  | "fut5"
  | "fut7"
  | "fut11"
  | "voleibol"
  | "handebol"
  | "basquete"
  | "futevolei"
  | "beach_tennis"
  | "volei_praia";

export const COURT_SPORTS: { key: CourtSport; label: string }[] = [
  { key: "futsal", label: "Futsal" },
  { key: "fut5", label: "Fut5" },
  { key: "fut7", label: "Fut7" },
  { key: "fut11", label: "Fut11" },
  { key: "voleibol", label: "Voleibol" },
  { key: "handebol", label: "Handebol" },
  { key: "basquete", label: "Basquete" },
  { key: "futevolei", label: "Futevôlei" },
  { key: "beach_tennis", label: "Beach tennis" },
  { key: "volei_praia", label: "Vôlei de praia" },
];

/** Tipos de piso mais comuns em quadras/arenas no Brasil. */
export type CourtFloor =
  | "madeira"
  | "emborrachado"
  | "poliesportivo"
  | "cimento"
  | "grama_sintetica"
  | "areia"
  | "saibro";

export const COURT_FLOORS: { key: CourtFloor; label: string }[] = [
  { key: "madeira", label: "Madeira" },
  { key: "emborrachado", label: "Emborrachado (vinílico)" },
  { key: "poliesportivo", label: "Poliesportivo (pintado)" },
  { key: "cimento", label: "Cimento / piso queimado" },
  { key: "grama_sintetica", label: "Grama sintética" },
  { key: "areia", label: "Areia" },
  { key: "saibro", label: "Saibro" },
];

const COURT_SPORT_KEYS = COURT_SPORTS.map((s) => s.key);
const COURT_FLOOR_KEYS = COURT_FLOORS.map((f) => f.key);

export function courtSportLabel(key: CourtSport): string {
  return COURT_SPORTS.find((s) => s.key === key)?.label ?? key;
}

export function courtFloorLabel(key: CourtFloor): string {
  return COURT_FLOORS.find((f) => f.key === key)?.label ?? key;
}

export type MockCourt = {
  id: string;
  name: string;
  /** Preço padrão R$/hora desta quadra (aplicado ao copiar a grade). */
  defaultPrice: number;
  /** Esportes aceitos na quadra. */
  sports: CourtSport[];
  /** Tipo de piso da quadra (obrigatório). */
  floor?: CourtFloor;
};

/** Segunda … Domingo */
export type WeekDayKey =
  | "mon"
  | "tue"
  | "wed"
  | "thu"
  | "fri"
  | "sat"
  | "sun";

export type ScheduleHourSlot = {
  hour: string;
  enabled: boolean;
  /** Valor em reais (ex.: 100) */
  price: number;
};

export type WeekScheduleTemplate = {
  defaultPrice: number;
  days: Record<WeekDayKey, ScheduleHourSlot[]>;
};

/** Dia da semana + ref do backend (getDay: 0=Domingo … 6=Sábado). */
export const WEEK_DAYS: { key: WeekDayKey; label: string; ref: number }[] = [
  { key: "mon", label: "Segunda", ref: 1 },
  { key: "tue", label: "Terça", ref: 2 },
  { key: "wed", label: "Quarta", ref: 3 },
  { key: "thu", label: "Quinta", ref: 4 },
  { key: "fri", label: "Sexta", ref: 5 },
  { key: "sat", label: "Sábado", ref: 6 },
  { key: "sun", label: "Domingo", ref: 0 },
];

/** Faixa comercial padrão (check marcado): 16:00–00:00. Demais horas desmarcadas. */
export const COMMERCIAL_HOUR_START = 16;
/** Último início de slot (23:00–00:00). */
export const COMMERCIAL_HOUR_END = 23;

export function formatHourLabel(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

export function buildDaySlots(defaultPrice: number): ScheduleHourSlot[] {
  const price =
    Number.isFinite(defaultPrice) && defaultPrice >= 0 ? defaultPrice : 0;
  const slots: ScheduleHourSlot[] = [];
  for (let h = 0; h <= 23; h += 1) {
    const inCommercial =
      h >= COMMERCIAL_HOUR_START && h <= COMMERCIAL_HOUR_END;
    slots.push({
      hour: formatHourLabel(h),
      enabled: inCommercial,
      price,
    });
  }
  return slots;
}

export function buildEmptyWeekTemplate(
  defaultPrice = 0
): WeekScheduleTemplate {
  const days = {} as Record<WeekDayKey, ScheduleHourSlot[]>;
  for (const { key } of WEEK_DAYS) {
    days[key] = buildDaySlots(defaultPrice);
  }
  return { defaultPrice, days };
}

/** Garante 00:00–23:00; comercial marcado se o slot não existia no template antigo.
 * Preço fica 0 na grade — o valor real vem de cada quadra. */
export function normalizeWeekTemplate(
  template: WeekScheduleTemplate
): WeekScheduleTemplate {
  const days = {} as Record<WeekDayKey, ScheduleHourSlot[]>;

  for (const { key } of WEEK_DAYS) {
    const existing = template.days[key] ?? [];
    const byHour = new Map(existing.map((s) => [s.hour, s]));
    const slots: ScheduleHourSlot[] = [];
    for (let h = 0; h <= 23; h += 1) {
      const hour = formatHourLabel(h);
      const prev = byHour.get(hour);
      if (prev) {
        slots.push({ hour, enabled: prev.enabled, price: 0 });
      } else {
        const inCommercial =
          h >= COMMERCIAL_HOUR_START && h <= COMMERCIAL_HOUR_END;
        slots.push({ hour, enabled: inCommercial, price: 0 });
      }
    }
    days[key] = slots;
  }

  return { defaultPrice: 0, days };
}

function isScheduleHourSlot(value: unknown): value is ScheduleHourSlot {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.hour === "string" &&
    typeof v.enabled === "boolean" &&
    typeof v.price === "number"
  );
}

function isWeekScheduleTemplate(value: unknown): value is WeekScheduleTemplate {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (typeof v.defaultPrice !== "number" || !v.days || typeof v.days !== "object") {
    return false;
  }
  const days = v.days as Record<string, unknown>;
  return WEEK_DAYS.every(
    ({ key }) =>
      Array.isArray(days[key]) &&
      (days[key] as unknown[]).every(isScheduleHourSlot)
  );
}

export type MockOnboardingState = {
  /** Conta do dono (mantido para compatibilidade; e-mail vem do login). */
  email: string;
  ownerName: string;
  ownerPhone: string;
  /**
   * Estabelecimento — preenchido depois do login, na configuração básica.
   * Vazio até configurar.
   */
  arenaName: string;
  /** Telefone de contato do estabelecimento. */
  companyPhone: string;
  /** Quantas quadras cadastrar (definido na config do estabelecimento). */
  courtCount: number;
  /** Endereço do estabelecimento (CEP obrigatório; restante via ViaCEP + número). */
  cep: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  uf: string;
  hasScheduleTemplate: boolean;
  /** Grade semanal salva no rascunho (opcional em rascunhos antigos). */
  scheduleTemplate?: WeekScheduleTemplate;
  /** Courts já configuradas (form completo por quadra). */
  courts: MockCourt[];
  /** Ativação no portal — fora do checklist de configuração. */
  isPublished: boolean;
  createdAt: string;
};

function isMockCourt(value: unknown): value is MockCourt {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (typeof v.id !== "string" || typeof v.name !== "string") return false;
  if (v.defaultPrice !== undefined && typeof v.defaultPrice !== "number") {
    return false;
  }
  if (v.sports !== undefined && !Array.isArray(v.sports)) {
    return false;
  }
  if (
    v.floor !== undefined &&
    v.floor !== null &&
    typeof v.floor !== "string"
  ) {
    return false;
  }
  return true;
}

function normalizeMockCourt(court: MockCourt): MockCourt {
  const sports = Array.isArray(court.sports)
    ? court.sports.filter((key): key is CourtSport =>
        COURT_SPORT_KEYS.includes(key)
      )
    : [];
  const floor =
    court.floor && COURT_FLOOR_KEYS.includes(court.floor)
      ? court.floor
      : undefined;
  return {
    id: court.id,
    name: court.name,
    defaultPrice:
      Number.isFinite(court.defaultPrice) && court.defaultPrice > 0
        ? court.defaultPrice
        : 0,
    sports,
    floor,
  };
}

function readOptionalString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function withAddressDefaults(
  state: Omit<
    MockOnboardingState,
    | "cep"
    | "street"
    | "number"
    | "neighborhood"
    | "city"
    | "uf"
    | "companyPhone"
  > &
    Partial<
      Pick<
        MockOnboardingState,
        | "cep"
        | "street"
        | "number"
        | "neighborhood"
        | "city"
        | "uf"
        | "companyPhone"
      >
    >
): MockOnboardingState {
  return {
    ...state,
    companyPhone: readOptionalString(state.companyPhone),
    cep: readOptionalString(state.cep),
    street: readOptionalString(state.street),
    number: readOptionalString(state.number),
    neighborhood: readOptionalString(state.neighborhood),
    city: readOptionalString(state.city),
    uf: readOptionalString(state.uf).toUpperCase().slice(0, 2),
  };
}

function isMockOnboardingState(value: unknown): value is MockOnboardingState {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (
    typeof v.email !== "string" ||
    typeof v.ownerName !== "string" ||
    typeof v.ownerPhone !== "string" ||
    typeof v.arenaName !== "string" ||
    typeof v.courtCount !== "number" ||
    v.courtCount < 1 ||
    typeof v.hasScheduleTemplate !== "boolean" ||
    !Array.isArray(v.courts) ||
    !v.courts.every(isMockCourt) ||
    typeof v.isPublished !== "boolean" ||
    typeof v.createdAt !== "string"
  ) {
    return false;
  }
  if (
    v.scheduleTemplate !== undefined &&
    !isWeekScheduleTemplate(v.scheduleTemplate)
  ) {
    return false;
  }
  return true;
}

/** Migra rascunho antigo (1 quadra) para o formato com courtCount. */
function migrateLegacy(raw: unknown): MockOnboardingState | null {
  if (!raw || typeof raw !== "object") return null;
  const v = raw as Record<string, unknown>;
  if (typeof v.courtCount === "number") return null;
  if (typeof v.arenaName !== "string" || typeof v.email !== "string") {
    return null;
  }

  return withAddressDefaults({
    email: v.email as string,
    ownerName: typeof v.ownerName === "string" ? v.ownerName : "",
    ownerPhone: typeof v.ownerPhone === "string" ? v.ownerPhone : "",
    arenaName: typeof v.arenaName === "string" ? v.arenaName : "",
    courtCount: 1,
    hasScheduleTemplate: v.hasScheduleTemplate === true,
    courts: [],
    isPublished: v.isPublished === true,
    createdAt:
      typeof v.createdAt === "string" ? v.createdAt : new Date().toISOString(),
  });
}

export function getMockOnboarding(): MockOnboardingState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (isMockOnboardingState(parsed)) {
      const courts = parsed.courts.map((c) => normalizeMockCourt(c));
      let next: MockOnboardingState = withAddressDefaults({
        ...parsed,
        courts,
      });
      if (next.scheduleTemplate) {
        next = {
          ...next,
          scheduleTemplate: normalizeWeekTemplate(next.scheduleTemplate),
        };
      }
      return next;
    }
    const migrated = migrateLegacy(parsed);
    if (migrated) {
      saveMockOnboarding(migrated);
      return migrated;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveMockOnboarding(state: MockOnboardingState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/** Retorna o rascunho atual ou cria um vazio (após o login do dono). */
export function getOrCreateOnboardingDraft(seed?: {
  email?: string;
}): MockOnboardingState {
  const current = getMockOnboarding();
  if (current) return current;
  const draft: MockOnboardingState = withAddressDefaults({
    email: seed?.email ?? "",
    ownerName: "",
    ownerPhone: "",
    arenaName: "",
    courtCount: 1,
    hasScheduleTemplate: false,
    courts: [],
    isPublished: false,
    createdAt: new Date().toISOString(),
  });
  saveMockOnboarding(draft);
  return draft;
}

export function updateMockOnboarding(
  patch: Partial<MockOnboardingState>
): MockOnboardingState | null {
  const current = getMockOnboarding();
  if (!current) return null;
  const next = { ...current, ...patch };
  saveMockOnboarding(next);
  return next;
}

export function clearMockOnboarding(): void {
  localStorage.removeItem(STORAGE_KEY);
  clearMockSession();
  clearPendingLogo();
}

const SESSION_KEY = "mpn_mock_session";

export function setMockSession(): void {
  sessionStorage.setItem(SESSION_KEY, "1");
}

export function clearMockSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export function isMockSession(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === "1";
}

export function isArenaConfigured(state: MockOnboardingState): boolean {
  const cepDigits = state.cep.replace(/\D/g, "");
  const phoneDigits = state.companyPhone.replace(/\D/g, "");
  return (
    Boolean(state.arenaName.trim()) &&
    state.courtCount >= 1 &&
    phoneDigits.length === 11 &&
    cepDigits.length === 8 &&
    Boolean(state.street.trim()) &&
    Boolean(state.number.trim()) &&
    Boolean(state.neighborhood.trim()) &&
    Boolean(state.city.trim()) &&
    state.uf.trim().length === 2
  );
}

/** Uma quadra está completa quando tem preço, esportes e piso definidos. */
export function isCourtComplete(court: MockCourt): boolean {
  return (
    court.defaultPrice > 0 &&
    court.sports.length > 0 &&
    Boolean(court.floor)
  );
}

export function isEstablishmentReady(state: MockOnboardingState): boolean {
  return (
    isArenaConfigured(state) &&
    state.hasScheduleTemplate &&
    areAllCourtsCreated(state)
  );
}

export function areAllCourtsCreated(state: MockOnboardingState): boolean {
  return (
    isArenaConfigured(state) &&
    state.courts.length >= state.courtCount &&
    state.courts.slice(0, state.courtCount).every(isCourtComplete)
  );
}

export function courtsDoneCount(state: MockOnboardingState): number {
  return Math.min(
    state.courts.filter(isCourtComplete).length,
    state.courtCount
  );
}

/**
 * Progresso granular do onboarding: estabelecimento (1) + horário (1) +
 * uma unidade por quadra cadastrada. Assim cada quadra soma no progresso.
 */
export function getOnboardingProgress(state: MockOnboardingState): {
  done: number;
  total: number;
} {
  const courtUnits = Math.max(1, state.courtCount);
  const total = 2 + courtUnits;
  const done =
    (isArenaConfigured(state) ? 1 : 0) +
    (state.hasScheduleTemplate ? 1 : 0) +
    courtsDoneCount(state);
  return { done: Math.min(done, total), total };
}

export function canPublish(state: MockOnboardingState): boolean {
  return isEstablishmentReady(state);
}

export function upsertMockCourt(
  court: MockCourt,
  index?: number
): MockOnboardingState | null {
  const current = getMockOnboarding();
  if (!current) return null;

  const courts = [...current.courts];
  if (typeof index === "number" && index >= 0 && index < courts.length) {
    courts[index] = court;
  } else {
    const existing = courts.findIndex((c) => c.id === court.id);
    if (existing >= 0) {
      courts[existing] = court;
    } else {
      courts.push(court);
    }
  }

  const next: MockOnboardingState = {
    ...current,
    courts,
    isPublished:
      current.isPublished &&
      isEstablishmentReady({ ...current, courts }),
  };
  saveMockOnboarding(next);
  return next;
}

export function removeMockCourtAt(index: number): MockOnboardingState | null {
  const current = getMockOnboarding();
  if (!current) return null;
  const courts = current.courts.filter((_, i) => i !== index);
  const next: MockOnboardingState = {
    ...current,
    courts,
    isPublished: false,
  };
  saveMockOnboarding(next);
  return next;
}

/** Converte a grade semanal do rascunho para o payload do backend. */
export function buildWeekTemplatePayload(
  template: WeekScheduleTemplate
): { day_of_week_ref: number; hours: string[] }[] {
  return WEEK_DAYS.map(({ key, ref }) => ({
    day_of_week_ref: ref,
    hours: (template.days[key] ?? [])
      .filter((slot) => slot.enabled)
      .map((slot) => slot.hour),
  })).filter((day) => day.hours.length > 0);
}

export type ChecklistItemId = "arena" | "schedule" | "court";

export type ChecklistItem = {
  id: ChecklistItemId;
  title: string;
  description: string;
  done: boolean;
  /** Bloqueado até o passo anterior estar concluído. */
  locked: boolean;
  required: boolean;
  to?: string;
  actionLabel?: string;
};

export function buildChecklist(state: MockOnboardingState): ChecklistItem[] {
  const arenaDone = isArenaConfigured(state);
  const scheduleDone = state.hasScheduleTemplate;
  const courtLabel = arenaDone
    ? state.courtCount === 1
      ? "1 quadra"
      : `${state.courtCount} quadras`
    : "quantidade a definir";

  const scheduleLocked = !arenaDone;
  const courtsLocked = !arenaDone || !scheduleDone;

  const items: ChecklistItem[] = [
    {
      id: "arena",
      title: "Estabelecimento",
      description: arenaDone
        ? `${state.arenaName} · ${state.city}/${state.uf} · ${courtLabel}`
        : "Nome, endereço, contato e número de quadras",
      done: arenaDone,
      locked: false,
      required: true,
      to: "/comecar/estabelecimento",
      actionLabel: arenaDone ? "Editar" : "Configurar",
    },
    {
      id: "schedule",
      title: "Horário de funcionamento",
      description: scheduleLocked
        ? "Conclua o estabelecimento antes"
        : "Grade semanal",
      done: scheduleDone,
      locked: scheduleLocked,
      required: true,
      to: scheduleLocked ? undefined : "/comecar/horario",
      actionLabel: scheduleDone ? "Editar" : "Configurar",
    },
  ];

  const courtCount = Math.max(1, state.courtCount);
  const doneCourts = courtsDoneCount(state);
  const allCourts = areAllCourtsCreated(state);

  items.push({
    id: "court",
    title: "Quadras",
    description: courtsLocked
      ? !arenaDone
        ? "Conclua o estabelecimento antes"
        : "Conclua o horário de funcionamento antes"
      : `${doneCourts} de ${courtCount} ${
          courtCount === 1 ? "quadra" : "quadras"
        } cadastradas`,
    done: allCourts,
    locked: courtsLocked,
    required: true,
    to: courtsLocked ? undefined : "/comecar/quadra",
    actionLabel: allCourts
      ? "Ver quadras"
      : doneCourts === 0
        ? "Configurar quadras"
        : "Continuar",
  });

  return items;
}
