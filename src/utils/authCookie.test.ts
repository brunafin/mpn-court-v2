import Cookies from "js-cookie";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearAccessToken,
  getAccessToken,
  isAccessTokenExpired,
  setAccessToken,
} from "./authCookie";

function jwtWithExp(exp: number): string {
  const encode = (value: object) =>
    btoa(JSON.stringify(value))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  return `${encode({ alg: "none", typ: "JWT" })}.${encode({ exp })}.sig`;
}

afterEach(() => {
  clearAccessToken();
  vi.restoreAllMocks();
});

describe("cookie de sessão", () => {
  it("grava a validade do cookie no exp do JWT", () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const set = vi.spyOn(Cookies, "set");

    setAccessToken(jwtWithExp(exp));

    expect(set).toHaveBeenCalledWith(
      "access_token",
      expect.any(String),
      expect.objectContaining({
        expires: new Date(exp * 1000),
        path: "/",
        sameSite: "strict",
      }),
    );
  });

  it("trata token vencido como expirado e token vigente como válido", () => {
    const past = Math.floor(Date.now() / 1000) - 60;
    Cookies.set("access_token", jwtWithExp(past), { path: "/" });
    expect(isAccessTokenExpired()).toBe(true);

    const future = Math.floor(Date.now() / 1000) + 3600;
    Cookies.set("access_token", jwtWithExp(future), { path: "/" });
    expect(isAccessTokenExpired()).toBe(false);
  });

  it("limpa o cookie", () => {
    const future = Math.floor(Date.now() / 1000) + 3600;
    setAccessToken(jwtWithExp(future));
    expect(getAccessToken()).toBeTruthy();

    clearAccessToken();

    expect(getAccessToken()).toBeUndefined();
    expect(isAccessTokenExpired()).toBe(true);
  });
});
