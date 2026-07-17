/** Placeholder da máscara de celular BR (DDD + 9 + 8 dígitos). */
export const PHONE_MASK_PLACEHOLDER = "(00) 90000-0000";

/**
 * Mantém só dígitos, no máximo 11 (DDD + 9 + 8).
 * O primeiro dígito após o DDD é sempre 9 (celular).
 */
export function onlyPhoneDigits(value: string): string {
  let digits = value.replace(/\D/g, "");

  if (digits.length <= 2) {
    return digits.slice(0, 2);
  }

  const ddd = digits.slice(0, 2);
  let local = digits.slice(2);
  if (!local.startsWith("9")) {
    local = `9${local}`;
  }

  return `${ddd}${local}`.slice(0, 11);
}

/**
 * Máscara BR celular: (11) 98765-4321
 * Aceita valor com ou sem formatação.
 */
export function formatPhoneMask(value: string): string {
  const digits = onlyPhoneDigits(value);

  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;

  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);

  if (rest.length <= 5) {
    return `(${ddd}) ${rest}`;
  }

  return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5, 9)}`;
}
