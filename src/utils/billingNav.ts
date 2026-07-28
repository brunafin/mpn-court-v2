import type { IInfo } from "../api/companies";

type Entitlement = NonNullable<IInfo["capabilities"]>["entitlement"];

/** Teste grátis / sem plano: Planos. Cliente pago: Mensalidades. */
export function billingNavLabel(
  entitlement: Entitlement | null | undefined,
): string {
  return entitlement === "paid" ? "Mensalidades" : "Planos";
}

export function billingNavPath(
  entitlement: Entitlement | null | undefined,
): string {
  return entitlement === "paid" ? "/mensalidades" : "/planos";
}

export function billingNavDescription(
  entitlement: Entitlement | null | undefined,
): string {
  return entitlement === "paid"
    ? "Cobrança da plataforma"
    : "Escolha e contrate seu plano";
}

export function isPaidEntitlement(
  entitlement: Entitlement | null | undefined,
): boolean {
  return entitlement === "paid";
}
