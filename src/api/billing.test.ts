import { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { describe, expect, it } from "vitest";
import {
  getPayerDataNeeded,
  isPixUnavailableError,
} from "./billing";

function apiError(status: number, data: unknown) {
  const error = new AxiosError("falha");
  error.response = {
    status,
    data,
    statusText: "",
    headers: {},
    config: {} as InternalAxiosRequestConfig,
  };
  return error;
}

describe("parse de erro de PIX", () => {
  it("pede CPF sem tratar como toast de falha genérica", () => {
    expect(
      getPayerDataNeeded(apiError(422, { code: "CPF_REQUIRED" })),
    ).toEqual({ email: false, cpf: true });
  });

  it("pede e-mail", () => {
    expect(
      getPayerDataNeeded(apiError(422, { code: "EMAIL_REQUIRED" })),
    ).toEqual({ email: true, cpf: false });
  });

  it("pede os dois quando o pagador não tem dado nenhum", () => {
    expect(
      getPayerDataNeeded(
        apiError(422, { code: "PAYER_DATA_REQUIRED", missing: [] }),
      ),
    ).toEqual({ email: true, cpf: true });
  });

  it("reconhece PIX indisponível sem pedir CPF nem e-mail", () => {
    const error = apiError(409, { code: "PIX_UNAVAILABLE" });
    expect(isPixUnavailableError(error)).toBe(true);
    expect(getPayerDataNeeded(error)).toBeNull();
  });

  it("ignora erro que não é de pagador", () => {
    expect(getPayerDataNeeded(apiError(500, { message: "falhou" }))).toBeNull();
    expect(isPixUnavailableError(new Error("rede"))).toBe(false);
  });
});
