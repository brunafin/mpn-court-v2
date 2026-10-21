export type ColorMode = "dark" | "light";

/** Preferência de aparência do painel inteiro. */
export const AGENDA_COLOR_MODE_KEY = "mpn-agenda-color-mode";

/** Seletor antigo, com o mesmo efeito. */
const LEGACY_COLOR_MODE_KEY = "mpn-color-mode";

const THEME_COLOR = {
  light: "#f7f8fa",
  agendaDark: "#081425",
} as const;

/** Valor já gravado neste navegador. Nulo se a pessoa ainda não escolheu aqui. */
export function readStoredColorMode(): ColorMode | null {
  try {
    const stored = localStorage.getItem(AGENDA_COLOR_MODE_KEY);
    if (stored === "dark" || stored === "light") return stored;
    if (localStorage.getItem(LEGACY_COLOR_MODE_KEY) === "dark") return "dark";
    return null;
  } catch {
    return null;
  }
}

export function readAgendaColorMode(): ColorMode {
  return readStoredColorMode() ?? "light";
}

export function writeAgendaColorMode(mode: ColorMode) {
  try {
    localStorage.setItem(AGENDA_COLOR_MODE_KEY, mode);
  } catch {
    // preferência segue só nesta sessão se o armazenamento estiver bloqueado
  }
}

export function applyAgendaChrome(dark: boolean) {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", dark ? THEME_COLOR.agendaDark : THEME_COLOR.light);
  }
}
