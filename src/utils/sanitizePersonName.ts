/** Limite alinhado ao `varchar(50)` / DTO da API. */
export const PERSON_NAME_MAX_LENGTH = 50;

/**
 * Remove emojis e símbolos pictográficos do nome.
 * Nomes com emoji estouravam o limite (UTF-16 vs varchar) e geravam erro genérico.
 */
export function sanitizePersonName(value: string): string {
  return value
    .normalize("NFC")
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/[\uFE0F\u200D]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, PERSON_NAME_MAX_LENGTH);
}

/** Sanitiza enquanto digita (mantém espaços intermediários). */
export function sanitizePersonNameInput(value: string): string {
  return value
    .normalize("NFC")
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/[\uFE0F\u200D]/g, "")
    .slice(0, PERSON_NAME_MAX_LENGTH);
}
