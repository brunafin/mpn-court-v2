/** Normaliza @handle ou URL parcial para https://instagram.com/... */
export function normalizeInstagramUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const handle = trimmed.replace(/^@/, "").replace(/^instagram\.com\//i, "");
  if (!/^[A-Za-z0-9._]{1,30}$/.test(handle)) return trimmed;
  return `https://instagram.com/${handle}`;
}
