/** Iniciais a partir do nome do estabelecimento (ex.: "LR Sports" → "LS"). */
export function getCompanyInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.replace(/[^\p{L}\p{N}]/gu, ""))
    .filter(Boolean);

  if (parts.length === 0) return "";
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
