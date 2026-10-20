/** Esportes disponíveis para novas quadras. */
export type CourtSport =
  | "futsal"
  | "fut5"
  | "fut6"
  | "fut7"
  | "fut11"
  | "volei_quadra"
  | "volei_areia"
  | "basquete"
  | "futevolei"
  | "beach_tennis"
  | "tenis"
  | "padel"
  | "pickleball";

export const COURT_SPORTS: { key: CourtSport; label: string }[] = [
  { key: "futsal", label: "Futsal" },
  { key: "fut5", label: "Fut5" },
  { key: "fut6", label: "Fut6" },
  { key: "fut7", label: "Fut7" },
  { key: "volei_quadra", label: "Vôlei de quadra" },
  { key: "volei_areia", label: "Vôlei de areia" },
  { key: "fut11", label: "Futebol de campo 11" },
  { key: "beach_tennis", label: "Beach Tennis" },
  { key: "futevolei", label: "Futevôlei" },
  { key: "basquete", label: "Basquete" },
  { key: "padel", label: "Padel" },
  { key: "pickleball", label: "Pickleball" },
  { key: "tenis", label: "Tênis" },
];

/** Os seis primeiros ficam à vista; o restante abre em "Ver mais". */
export const COURT_SPORTS_PREVIEW_COUNT = 6;

const LEGACY_SPORT_KEYS: Record<string, CourtSport> = {
  society: "fut7",
  voleibol: "volei_quadra",
  volei_praia: "volei_areia",
};

/** Nomes do catálogo UI → se usa rede (alinhado ao seed da API). */
const SPORT_NEEDS_NET: Record<CourtSport, boolean> = {
  futsal: false,
  fut5: false,
  fut6: false,
  fut7: false,
  fut11: false,
  volei_quadra: true,
  volei_areia: true,
  basquete: false,
  futevolei: true,
  beach_tennis: true,
  tenis: true,
  padel: true,
  pickleball: true,
};

/** Tipos de piso mais comuns em quadras/arenas no Brasil. */
export type CourtFloor =
  | "madeira"
  | "emborrachado"
  | "poliesportivo"
  | "cimento"
  | "grama_sintetica"
  | "gramado_natural"
  | "areia"
  | "saibro";

export const COURT_FLOORS: { key: CourtFloor; label: string }[] = [
  { key: "madeira", label: "Madeira" },
  { key: "emborrachado", label: "Emborrachado (vinílico)" },
  { key: "poliesportivo", label: "Poliesportivo (pintado)" },
  { key: "cimento", label: "Cimento / piso queimado" },
  { key: "grama_sintetica", label: "Grama sintética" },
  { key: "gramado_natural", label: "Gramado natural" },
  { key: "areia", label: "Areia" },
  { key: "saibro", label: "Saibro" },
];

const COURT_SPORT_KEYS = COURT_SPORTS.map((sport) => sport.key);
const COURT_FLOOR_KEYS = COURT_FLOORS.map((floor) => floor.key);

export function courtSportLabel(key: CourtSport): string {
  return COURT_SPORTS.find((sport) => sport.key === key)?.label ?? key;
}

export function courtFloorLabel(key: CourtFloor): string {
  return COURT_FLOORS.find((floor) => floor.key === key)?.label ?? key;
}

export function sportPayloadFromKey(key: CourtSport): {
  name: string;
  needsNet?: boolean;
} {
  return { name: courtSportLabel(key), needsNet: SPORT_NEEDS_NET[key] };
}

export function resolveCourtSportKey(key: string): CourtSport | null {
  const mapped = LEGACY_SPORT_KEYS[key] ?? key;
  return (COURT_SPORT_KEYS as string[]).includes(mapped)
    ? (mapped as CourtSport)
    : null;
}

export function isCourtFloorKey(key: string): key is CourtFloor {
  return (COURT_FLOOR_KEYS as string[]).includes(key);
}
