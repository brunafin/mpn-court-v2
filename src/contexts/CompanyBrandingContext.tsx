import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { infosByCompanyPublicId, type IInfo } from "../api/companies";
import {
  getAccessToken,
  getAccessTokenPayload,
} from "../utils/authCookie";

type CompanyCapabilities = NonNullable<IInfo["capabilities"]>;

type CompanyBrandingContextValue = {
  companyName: string;
  /** URL do logo enviado; `null` quando não há — UI usa iniciais. */
  logoUrl: string | null;
  setLogoUrl: (url: string | null) => void;
  setCompanyName: (name: string) => void;
  /** `null` até o infos carregar — não assumir paid/teste grátis. */
  capabilities: CompanyCapabilities | null;
  refreshCapabilities: () => Promise<void>;
};

/** Fallback só para flags de UI; entitlement real exige `capabilities` carregado. */
const defaultCapabilities: CompanyCapabilities = {
  entitlement: "trial",
  accessMode: "full",
  accessReason: null,
  canViewAgenda: true,
  canMutate: false,
  canPayBilling: false,
  portalEligible: true,
};

const CompanyBrandingContext =
  createContext<CompanyBrandingContextValue | null>(null);

export function CompanyBrandingProvider({ children }: { children: ReactNode }) {
  const [companyName, setCompanyName] = useState("");
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null);
  const [capabilities, setCapabilities] = useState<CompanyCapabilities | null>(
    null,
  );

  const loadInfos = useCallback(async () => {
    const payload = getAccessTokenPayload<{
      companyName?: string;
      companyPublicId?: string | null;
    }>();

    if (payload?.companyName) {
      setCompanyName(payload.companyName);
    }

    const companyPublicId = payload?.companyPublicId;
    if (!companyPublicId || !getAccessToken()) return;

    try {
      const info = await infosByCompanyPublicId(companyPublicId);
      if (info.companyName) setCompanyName(info.companyName);
      setCompanyLogoUrl(info.logoUrl || null);
      if (info.capabilities) setCapabilities(info.capabilities);
    } catch {
      // Sem logo: a UI mostra as iniciais do estabelecimento.
    }
  }, []);

  useEffect(() => {
    void loadInfos();
  }, [loadInfos]);

  const setLogoUrl = useCallback((url: string | null) => {
    setCompanyLogoUrl(url);
  }, []);

  const value = useMemo(
    () => ({
      companyName,
      logoUrl: companyLogoUrl,
      setLogoUrl,
      setCompanyName,
      capabilities,
      refreshCapabilities: loadInfos,
    }),
    [companyName, companyLogoUrl, setLogoUrl, capabilities, loadInfos],
  );

  return (
    <CompanyBrandingContext.Provider value={value}>
      {children}
    </CompanyBrandingContext.Provider>
  );
}

export function useCompanyBranding() {
  const ctx = useContext(CompanyBrandingContext);
  if (!ctx) {
    return {
      companyName: "",
      logoUrl: null,
      setLogoUrl: () => undefined,
      setCompanyName: () => undefined,
      /** Sem provider: null (não fingir trial/paid carregados). */
      capabilities: null,
      refreshCapabilities: async () => undefined,
    };
  }
  return ctx;
}

export type CompanyCapabilitiesState = CompanyCapabilities & {
  /** `false` enquanto infos/capabilities ainda não chegaram da API. */
  ready: boolean;
};

export function useCompanyCapabilities(): CompanyCapabilitiesState {
  const ctx = useContext(CompanyBrandingContext);
  if (!ctx?.capabilities) {
    return { ...defaultCapabilities, ready: false };
  }
  return { ...ctx.capabilities, ready: true };
}
