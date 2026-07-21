import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { clearMockSession } from "../onboarding/mockStore";

const COOKIE_NAME = "access_token";

const cookieOptions = {
  path: "/",
  secure: true,
  sameSite: "strict" as const,
};

export function setAccessToken(token: string) {
  Cookies.set(COOKIE_NAME, token, cookieOptions);
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
  Cookies.remove(COOKIE_NAME, { path: "/" });
  Cookies.remove(COOKIE_NAME, cookieOptions);
  // Fallback para limpeza via document.cookie
  document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; Secure; SameSite=Strict`;
}

export async function logoutAndRedirect() {
  clearAccessToken();
  clearMockSession();

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
