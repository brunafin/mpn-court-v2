/** Limite alinhado ao campo observação da reserva. */
export const OBSERVATION_MAX_LENGTH = 150;

/** Limite alinhado ao textarea de lembrete no Manager. */
export const REMINDER_MESSAGE_MAX_LENGTH = 100;

/**
 * Caracteres permitidos em observação/lembrete: letras (com acento),
 * números, espaço, @ e pontuação básica. Bloqueia emoji, emoticon e
 * demais símbolos — mesmo critério do nome, com @ e dígitos liberados.
 * Sem flag `g` no teste — `/g` + `.test()` mantém lastIndex e falha em seguida.
 */
const DISALLOWED_NOTE_TEXT_CHAR =
  /[^\p{L}\p{M}\p{N}\s@.,!?;:'"\u2018\u2019\u201C\u201D\-–—()\/]/u;
const DISALLOWED_NOTE_TEXT_CHARS_GLOBAL =
  /[^\p{L}\p{M}\p{N}\s@.,!?;:'"\u2018\u2019\u201C\u201D\-–—()\/]/gu;

function stripDisallowedNoteTextChars(value: string): string {
  return value
    .normalize("NFC")
    .replace(DISALLOWED_NOTE_TEXT_CHARS_GLOBAL, "")
    .replace(/[\uFE0F\u200D]/g, "");
}

/**
 * Remove emojis/símbolos e normaliza texto de observação ou lembrete.
 */
export function sanitizeNoteText(
  value: string,
  maxLength: number,
): string {
  return stripDisallowedNoteTextChars(value)
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[^\S\n]{2,}/g, " ")
    .trim()
    .slice(0, maxLength);
}

/** Sanitiza enquanto digita (mantém espaços/quebras intermediários). */
export function sanitizeNoteTextInput(
  value: string,
  maxLength: number,
): string {
  return stripDisallowedNoteTextChars(value).slice(0, maxLength);
}

/** Retorna true se o trecho inserido (teclado/cola) contém caracteres inválidos. */
export function noteTextInsertHasDisallowedChars(data: string): boolean {
  return DISALLOWED_NOTE_TEXT_CHAR.test(data);
}
