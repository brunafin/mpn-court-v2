/** Valor máximo permitido por horário/quadra (reais). */
export const MAX_COURT_PRICE_REAIS = 1000;

export const MAX_COURT_PRICE_CENTS = MAX_COURT_PRICE_REAIS * 100;

/** Limita dígitos de centavos ao teto de R$ 1.000,00. */
export function capCourtPriceDigits(digits: string): string {
  if (digits === "") return "";
  const cents = Number(digits);
  if (!Number.isFinite(cents) || cents <= 0) return "";
  return String(Math.min(cents, MAX_COURT_PRICE_CENTS));
}
