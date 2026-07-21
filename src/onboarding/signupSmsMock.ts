const PENDING_KEY = "mpn_signup_pending";

export type PendingSignup = {
  email: string;
  ownerName: string;
  ownerPhone: string;
  password: string;
  /** Código SMS mock (só neste navegador). */
  smsCode: string;
  /** Epoch ms — código expira em 10 min. */
  expiresAt: number;
  sentAt: number;
};

function generateSmsCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function getPendingSignup(): PendingSignup | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingSignup;
    if (
      typeof parsed.email !== "string" ||
      typeof parsed.ownerName !== "string" ||
      typeof parsed.ownerPhone !== "string" ||
      typeof parsed.password !== "string" ||
      typeof parsed.smsCode !== "string" ||
      typeof parsed.expiresAt !== "number"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingSignup(): void {
  sessionStorage.removeItem(PENDING_KEY);
}

export function startPendingSignup(input: {
  email: string;
  ownerName: string;
  ownerPhone: string;
  password: string;
}): PendingSignup {
  const now = Date.now();
  const pending: PendingSignup = {
    ...input,
    smsCode: generateSmsCode(),
    sentAt: now,
    expiresAt: now + 10 * 60 * 1000,
  };
  sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending));
  // Protótipo: simula envio SMS
  console.info("[mpn mock SMS]", pending.ownerPhone, pending.smsCode);
  return pending;
}

export function resendPendingSmsCode(): PendingSignup | null {
  const current = getPendingSignup();
  if (!current) return null;
  const now = Date.now();
  const next: PendingSignup = {
    ...current,
    smsCode: generateSmsCode(),
    sentAt: now,
    expiresAt: now + 10 * 60 * 1000,
  };
  sessionStorage.setItem(PENDING_KEY, JSON.stringify(next));
  console.info("[mpn mock SMS]", next.ownerPhone, next.smsCode);
  return next;
}

export function verifyPendingSmsCode(code: string): {
  ok: boolean;
  reason?: "missing" | "expired" | "invalid";
  pending?: PendingSignup;
} {
  const pending = getPendingSignup();
  if (!pending) return { ok: false, reason: "missing" };
  if (Date.now() > pending.expiresAt) {
    return { ok: false, reason: "expired", pending };
  }
  if (pending.smsCode !== code.trim()) {
    return { ok: false, reason: "invalid", pending };
  }
  return { ok: true, pending };
}
