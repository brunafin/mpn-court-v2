import type { IInfo } from "../api/companies";

type Entitlement = NonNullable<IInfo["capabilities"]>["entitlement"];

/** A mesma tela cobre o plano e a cobrança. */
export function billingNavLabel(
  _entitlement: Entitlement | null | undefined,
): string {
  return "Planos e pagamentos";
}

export function billingNavPath(
  entitlement: Entitlement | null | undefined,
): string {
  return entitlement === "paid" ? "/mensalidades" : "/planos";
}

export function billingNavDescription(
  _entitlement: Entitlement | null | undefined,
): string {
  return "Seu plano e as mensalidades";
}

export function isPaidEntitlement(
  entitlement: Entitlement | null | undefined,
): boolean {
  return entitlement === "paid";
}
