import { useEffect, useState } from "react";
import {
  ACCESS_TOKEN_CHANGE_EVENT,
  getAccessTokenPayload,
} from "../utils/authCookie";

export function readCompanyPublicId(): string {
  const payload = getAccessTokenPayload<{
    companyPublicId?: string | null;
  }>();
  return payload?.companyPublicId || "";
}

/** Id da empresa no JWT. Atualiza quando o token muda, sem cada tela ler o cookie. */
export function useCompanyPublicId(): string {
  const [companyPublicId, setCompanyPublicId] = useState(readCompanyPublicId);

  useEffect(() => {
    const sync = () => setCompanyPublicId(readCompanyPublicId());
    sync();
    window.addEventListener(ACCESS_TOKEN_CHANGE_EVENT, sync);
    return () => window.removeEventListener(ACCESS_TOKEN_CHANGE_EVENT, sync);
  }, []);

  return companyPublicId;
}
