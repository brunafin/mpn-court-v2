import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { invalidateSchedulesDayCache } from "./schedulesDayCache";

const COOKIE_NAME = "access_token";
/** Fallback se o JWT não tiver `exp` — alinhado ao TTL 1h da API. */
const ACCESS_TOKEN_FALLBACK_DAYS = 1 / 24;

/** Em http://localhost o flag Secure impede o cookie de gravar — login “200” e UI de senha inválida. */
function cookieOptions(expires?: Date | number) {
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:";
  return {
    path: "/",
    secure,
    sameSite: "strict" as const,
    ...(expires ? { expires } : {}),
  };
}

function tokenExpiryDate(token: string): Date | undefined {
  try {
    const { exp } = jwtDecode<{ exp?: number }>(token);
    if (typeof exp === "number") {
      return new Date(exp * 1000);
    }
  } catch {
    // ignore
  }
  return undefined;
}

export function setAccessToken(token: string) {
  Cookies.set(
    COOKIE_NAME,
    token,
    cookieOptions(tokenExpiryDate(token) ?? ACCESS_TOKEN_FALLBACK_DAYS),
  );
}

export function getAccessToken(): string | undefined {
  return Cookies.get(COOKIE_NAME);
}

export function getAccessTokenPayload<T = Record<string, unknown>>(): T | null {
  const token = getAccessToken();
  if (!token) return null;
  try {
    return jwtDecode<T>(token);
  } catch {
    return null;
  }
}

export function isAccessTokenExpired(): boolean {
  const token = getAccessToken();
  if (!token) return true;
  const payload = getAccessTokenPayload<{ exp?: number }>();
  if (!payload) return true;
  if (typeof payload.exp !== "number") return false;
  return payload.exp * 1000 <= Date.now();
}

/** Remove o cookie com os mesmos atributos usados no set (Secure/SameSite). */
export function clearAccessToken() {
  const opts = cookieOptions();
  Cookies.remove(COOKIE_NAME, { path: "/" });
  Cookies.remove(COOKIE_NAME, opts);
  // Fallback para limpeza via document.cookie
  document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; Secure; SameSite=Strict`;
}

/** Remove SW + Cache Storage sem deixar worker órfão (causa ERR_FAILED no refresh). */
async function clearServiceWorkerAndCaches() {
  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }
  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }
}

export async function logoutAndRedirect(options?: {
  keepOnboardingDraft?: boolean;
}) {
  clearAccessToken();
  const { clearMockOnboarding } = await import("../onboarding/mockStore");
  if (!options?.keepOnboardingDraft) {
    clearMockOnboarding({ allUsers: true });
  }
  invalidateSchedulesDayCache();

  try {
    await clearServiceWorkerAndCaches();
  } catch {
    // ignore — logout não deve travar por falha de cache/SW
  }

  window.location.replace("/");
}
