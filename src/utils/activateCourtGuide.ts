const guideSeenKey = (companyPublicId: string) =>
  `mpn:activate-court-guide-seen:${companyPublicId}`;

export function hasSeenActivateCourtGuide(companyPublicId: string): boolean {
  if (!companyPublicId) return true;
  try {
    return localStorage.getItem(guideSeenKey(companyPublicId)) === "1";
  } catch {
    return false;
  }
}

export function markActivateCourtGuideSeen(companyPublicId: string): void {
  if (!companyPublicId) return;
  try {
    localStorage.setItem(guideSeenKey(companyPublicId), "1");
  } catch {
    // ignore quota / private mode
  }
}
