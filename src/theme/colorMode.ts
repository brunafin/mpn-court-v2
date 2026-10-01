export type ColorMode = "dark" | "light";

export const COLOR_MODE_STORAGE_KEY = "mpn-color-mode";

const THEME_COLOR: Record<ColorMode, string> = {
  dark: "#081425",
  light: "#e8eef6",
};

export function readColorMode(): ColorMode {
  try {
    return localStorage.getItem(COLOR_MODE_STORAGE_KEY) === "light"
      ? "light"
      : "dark";
  } catch {
    return "dark";
  }
}

export function applyColorMode(mode: ColorMode) {
  document.documentElement.classList.toggle("mpn-theme-light", mode === "light");
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", THEME_COLOR[mode]);
}

export function writeColorMode(mode: ColorMode) {
  try {
    localStorage.setItem(COLOR_MODE_STORAGE_KEY, mode);
  } catch {
    // preferência segue só nesta sessão se o armazenamento estiver bloqueado
  }
  applyColorMode(mode);
}
