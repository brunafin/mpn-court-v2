import type { IInfo } from "../api/companies";

type Caps = NonNullable<IInfo["capabilities"]>;

export type PortalStatus = {
  /** Aparece de fato no portal público. */
  onSite: boolean;
  label: "No site" | "Fora do site";
  /** Motivo curto para o dono entender o estado. */
  reason: string;
};

function humanizeAccessReason(reason: string | null | undefined): string | null {
  if (!reason?.trim()) return null;
  const key = reason.trim().toLowerCase();
  if (key === "delinquency" || key === "inadimplencia") {
    return "inadimplência";
  }
  return reason.trim();
}

/**
 * Status unificado do estabelecimento no portal
 * (portalEligible + is_active / quadras show).
 */
export function resolveCompanyPortalStatus(input: {
  isActive?: boolean;
  capabilities?: Pick<
    Caps,
    | "portalEligible"
    | "entitlement"
    | "accessMode"
    | "accessReason"
  > | null;
  courts?: { show: boolean }[];
}): PortalStatus {
  const caps = input.capabilities;
  const portalEligible = caps?.portalEligible ?? true;
  const isActive =
    typeof input.isActive === "boolean"
      ? input.isActive
      : (input.courts ?? []).some((c) => c.show);

  if (caps && !portalEligible) {
    if (caps.entitlement === "none") {
      return {
        onSite: false,
        label: "Fora do site",
        reason:
          "Sem plano ativo — o estabelecimento não aparece no portal público.",
      };
    }
    if (caps.accessMode === "read_only") {
      const detail = humanizeAccessReason(caps.accessReason);
      return {
        onSite: false,
        label: "Fora do site",
        reason: detail
          ? `Conta em modo somente leitura (${detail}). O portal fica oculto até a liberação.`
          : "Conta em modo somente leitura. O portal fica oculto até a liberação.",
      };
    }
    return {
      onSite: false,
      label: "Fora do site",
      reason: "O estabelecimento não está elegível ao portal no momento.",
    };
  }

  if (!isActive) {
    return {
      onSite: false,
      label: "Fora do site",
      reason:
        "Nenhuma quadra está ativada no site. Ative pelo menos uma em Minhas quadras.",
    };
  }

  return {
    onSite: true,
    label: "No site",
    reason: "Visível no portal público (ao menos uma quadra ativada).",
  };
}

/**
 * Status da quadra no portal (show + elegibilidade da empresa).
 */
export function resolveCourtPortalStatus(input: {
  show: boolean;
  portalEligible: boolean;
}): PortalStatus {
  if (!input.show) {
    return {
      onSite: false,
      label: "Fora do site",
      reason: "Oculta pelo estabelecimento.",
    };
  }
  if (!input.portalEligible) {
    return {
      onSite: false,
      label: "Fora do site",
      reason:
        "Marcada para o site, mas o plano ou o acesso da conta bloqueia o portal.",
    };
  }
  return {
    onSite: true,
    label: "No site",
    reason: "Visível no portal público.",
  };
}
