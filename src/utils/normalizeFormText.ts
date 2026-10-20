/** Enquanto digita: tira emoji e símbolos, sem cortar o espaço do fim. */
function keepTyping(value: string, pattern: RegExp, max: number): string {
  return value.normalize("NFC").replace(pattern, "").slice(0, max);
}

const TITLE = /[^\p{L}\p{M}\p{N}\s'\u2019\-\.&]/gu;
const ADDRESS = /[^\p{L}\p{M}\p{N}\s'\u2019\-.,/ºª]/gu;

/** Nome da quadra: cabe na agenda e no card. */
export const COURT_NAME_MAX_LENGTH = 8;

export function sanitizeTitleInput(value: string, max: number): string {
  return keepTyping(value, TITLE, max);
}

/** Rua, bairro e cidade em maiúsculas, no padrão do ViaCEP. */
export function uppercaseAddressInput(value: string, max: number): string {
  return keepTyping(value, ADDRESS, max).toUpperCase();
}

export function collapseSpaces(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}
