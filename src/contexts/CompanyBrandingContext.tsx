import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { infosByCompanyPublicId } from "../api/companies";
import {
  getAccessToken,
  getAccessTokenPayload,
} from "../utils/authCookie";

type CompanyBrandingContextValue = {
  companyName: string;
  /** URL do logo enviado; `null` quando não há — UI usa iniciais. */
  logoUrl: string | null;
  setLogoUrl: (url: string | null) => void;
  setCompanyName: (name: string) => void;
};

const CompanyBrandingContext =
  createContext<CompanyBrandingContextValue | null>(null);

export function CompanyBrandingProvider({ children }: { children: ReactNode }) {
  const [companyName, setCompanyName] = useState("");
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const payload = getAccessTokenPayload<{
      companyName?: string;
      companyPublicId?: string | null;
    }>();

    if (payload?.companyName) {
      setCompanyName(payload.companyName);
    }

    const companyPublicId = payload?.companyPublicId;
    if (!companyPublicId || !getAccessToken()) return;

    let active = true;
    infosByCompanyPublicId(companyPublicId)
      .then((info) => {
        if (!active) return;
        if (info.companyName) setCompanyName(info.companyName);
        setCompanyLogoUrl(info.logoUrl || null);
      })
      .catch(() => {
        // Sem logo: a UI mostra as iniciais do estabelecimento.
      });

    return () => {
      active = false;
    };
  }, []);

  const setLogoUrl = useCallback((url: string | null) => {
    setCompanyLogoUrl(url);
  }, []);

  const value = useMemo(
    () => ({
      companyName,
      logoUrl: companyLogoUrl,
      setLogoUrl,
      setCompanyName,
    }),
    [companyName, companyLogoUrl, setLogoUrl]
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
    };
  }
  return ctx;
}
