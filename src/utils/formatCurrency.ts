/**
 * Formats a given number as Brazilian currency (BRL).
 *
 * @param value - The numeric value to be formatted.
 * @returns A string representing the value formatted as Brazilian currency (e.g., "R$ 1.234,56").
 *
 * Example:
 * ```typescript
 * const formattedValue = formatCurrencyBRL(1234.56);
 * ```
 */
export function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}