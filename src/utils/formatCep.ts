/** Mantém só dígitos do CEP (máx. 8). */
export function onlyCepDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, 8);
}

/** Máscara `00000-000`. */
export function formatCepMask(value: string): string {
  const digits = onlyCepDigits(value);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

/** Formato persistido no banco (`char(9)`): `00000-000`. */
export function formatCepForStorage(value: string): string {
  const digits = onlyCepDigits(value);
  if (digits.length !== 8) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function isValidCep(value: string): boolean {
  return onlyCepDigits(value).length === 8;
}
