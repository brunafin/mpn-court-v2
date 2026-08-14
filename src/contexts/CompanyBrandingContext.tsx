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
  ACCESS_TOKEN_CHANGE_EVENT,
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
  /** Primeiro /infos falhou e ainda não há capabilities. */
  capabilitiesError: boolean;
  refreshCapabilities: () => Promise<void>;
};

/**
 * Fallback fail-closed até o /infos: sem agenda, sem mutate, sem portal.
 * Trial expirado = paywall (canViewAgenda false); só inadimplente pago é readonly.
 */
const defaultCapabilities: CompanyCapabilities = {
  entitlement: "none",
  accessMode: "full",
  accessReason: null,
  canViewAgenda: false,
  canMutate: false,
  canPayBilling: false,
  portalEligible: false,
};

const CompanyBrandingContext =
  createContext<CompanyBrandingContextValue | null>(null);

export function CompanyBrandingProvider({ children }: { children: ReactNode }) {
  const [companyName, setCompanyName] = useState(() => {
    const payload = getAccessTokenPayload<{ companyName?: string }>();
    return payload?.companyName?.trim() || "";
  });
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null);
  const [capabilities, setCapabilities] = useState<CompanyCapabilities | null>(
    null,
  );
  const [capabilitiesError, setCapabilitiesError] = useState(false);

  const loadInfos = useCallback(async () => {
    const payload = getAccessTokenPayload<{
      companyName?: string;
      companyPublicId?: string | null;
    }>();

    if (payload?.companyName) {
      setCompanyName(payload.companyName);
    }

    const companyPublicId = payload?.companyPublicId;
    if (!companyPublicId || !getAccessToken()) {
      // Sem estabelecimento ainda (onboarding) — não fica “ready” falso eterno
      // depois que o JWT ganhar companyPublicId; só limpa se perdeu a conta.
      if (!companyPublicId) {
        setCapabilities(null);
        setCapabilitiesError(false);
      }
      return;
    }

    setCapabilitiesError(false);
    try {
      const info = await infosByCompanyPublicId(companyPublicId);
      if (info.companyName) setCompanyName(info.companyName);
      setCompanyLogoUrl(info.logoUrl || null);
      if (info.capabilities) {
        setCapabilities(info.capabilities);
        setCapabilitiesError(false);
      }
    } catch {
      setCapabilitiesError(true);
    }
  }, []);

  useEffect(() => {
    void loadInfos();
  }, [loadInfos]);

  // Pós-onboarding (e login) atualiza o JWT sem remount do provider.
  useEffect(() => {
    const onTokenChange = () => {
      void loadInfos();
    };
    window.addEventListener(ACCESS_TOKEN_CHANGE_EVENT, onTokenChange);
    return () => {
      window.removeEventListener(ACCESS_TOKEN_CHANGE_EVENT, onTokenChange);
    };
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
      capabilitiesError,
      refreshCapabilities: loadInfos,
    }),
    [
      companyName,
      companyLogoUrl,
      setLogoUrl,
      capabilities,
      capabilitiesError,
      loadInfos,
    ],
  );

  return (
    <CompanyBrandingContext.Provider value={value}>
      {children}
    </CompanyBrandingContext.Provider>
  );
}

const brandingFallback: CompanyBrandingContextValue = {
  companyName: "",
  logoUrl: null,
  setLogoUrl: () => undefined,
  setCompanyName: () => undefined,
  capabilities: null,
  capabilitiesError: false,
  refreshCapabilities: async () => undefined,
};

export function useCompanyBranding() {
  const ctx = useContext(CompanyBrandingContext);
  if (!ctx) {
    return brandingFallback;
  }
  return ctx;
}

export type CompanyCapabilitiesState = CompanyCapabilities & {
  /** `false` enquanto infos/capabilities ainda não chegaram da API. */
  ready: boolean;
  /** /infos falhou e não há capabilities — não é paywall nem skeleton eterno. */
  loadError: boolean;
  retry: () => Promise<void>;
};

export function useCompanyCapabilities(): CompanyCapabilitiesState {
  const ctx = useContext(CompanyBrandingContext);
  if (!ctx?.capabilities) {
    return {
      ...defaultCapabilities,
      ready: false,
      loadError: Boolean(ctx?.capabilitiesError),
      retry: ctx?.refreshCapabilities ?? (async () => undefined),
    };
  }
  return {
    ...ctx.capabilities,
    ready: true,
    loadError: false,
    retry: ctx.refreshCapabilities,
  };
}
