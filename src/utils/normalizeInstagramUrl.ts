/** Normaliza @handle ou URL para https://instagram.com/handle em minúsculas. */
export function normalizeInstagramUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let handle = trimmed;
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      handle = new URL(trimmed).pathname.replace(/^\//, "").split("/")[0] ?? "";
    } catch {
      return trimmed;
    }
  }

  handle = handle.replace(/^@/, "").replace(/^instagram\.com\//i, "").toLowerCase();
  if (!/^[a-z0-9._]{1,30}$/.test(handle)) return trimmed;
  return `https://instagram.com/${handle}`;
}
