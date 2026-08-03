/** Limite alinhado ao `varchar(50)` / DTO da API. */
export const PERSON_NAME_MAX_LENGTH = 50;

/**
 * Caracteres permitidos no nome: letras (com acento), marcas diacríticas,
 * espaço, hífen e apóstrofo. Bloqueia emoji, emoticon e demais símbolos.
 * Sem flag `g` no teste — `/g` + `.test()` mantém lastIndex e falha em seguida.
 */
const DISALLOWED_PERSON_NAME_CHAR = /[^\p{L}\p{M}\s'\u2019\-]/u;
const DISALLOWED_PERSON_NAME_CHARS_GLOBAL = /[^\p{L}\p{M}\s'\u2019\-]/gu;

function stripDisallowedPersonNameChars(value: string): string {
  return value
    .normalize("NFC")
    .replace(DISALLOWED_PERSON_NAME_CHARS_GLOBAL, "")
    .replace(/[\uFE0F\u200D]/g, "");
}

/**
 * Remove emojis/símbolos e normaliza o nome do contato.
 * Nomes com emoji estouravam o limite (UTF-16 vs varchar) e geravam erro genérico.
 */
export function sanitizePersonName(value: string): string {
  return stripDisallowedPersonNameChars(value)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, PERSON_NAME_MAX_LENGTH);
}

/** Sanitiza enquanto digita (mantém espaços intermediários). */
export function sanitizePersonNameInput(value: string): string {
  return stripDisallowedPersonNameChars(value).slice(0, PERSON_NAME_MAX_LENGTH);
}

/** Retorna true se o trecho inserido (teclado/cola) contém caracteres inválidos. */
export function personNameInsertHasDisallowedChars(data: string): boolean {
  return DISALLOWED_PERSON_NAME_CHAR.test(data);
}
