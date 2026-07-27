import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { clearMockOnboarding } from "../onboarding/mockStore";
import { invalidateSchedulesDayCache } from "./schedulesDayCache";

const COOKIE_NAME = "access_token";

/** Em http://localhost o flag Secure impede o cookie de gravar — login “200” e UI de senha inválida. */
function cookieOptions() {
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:";
  return {
    path: "/",
    secure,
    sameSite: "strict" as const,
  };
}

export function setAccessToken(token: string) {
  Cookies.set(COOKIE_NAME, token, cookieOptions());
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

/** Remove o cookie com os mesmos atributos usados no set (Secure/SameSite). */
export function clearAccessToken() {
  const opts = cookieOptions();
  Cookies.remove(COOKIE_NAME, { path: "/" });
  Cookies.remove(COOKIE_NAME, opts);
  // Fallback para limpeza via document.cookie
  document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; Secure; SameSite=Strict`;
}

export async function logoutAndRedirect() {
  clearAccessToken();
  clearMockOnboarding();
  invalidateSchedulesDayCache();

  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } catch {
    // ignore — logout não deve travar por falha de cache
  }

  window.location.replace("/");
}
