import { Navigate, Outlet, useLocation } from "react-router-dom";
import { CompanyBrandingProvider } from "../../contexts/CompanyBrandingContext";
import {
  clearAccessToken,
  getAccessToken,
  getAccessTokenPayload,
  isAccessTokenExpired,
} from "../../utils/authCookie";

type TokenClaims = {
  termsAccepted?: boolean;
  updatedPassword?: boolean;
};

/**
 * Exige JWT. Bloqueia o app até aceite de termos (ex.: pós-Google)
 * e redireciona senha padrão para /alterar-senha.
 */
export default function ProtectedRoute() {
  const location = useLocation();
  const token = getAccessToken();

  if (!token || isAccessTokenExpired()) {
    if (token) clearAccessToken();
    return <Navigate to="/" replace />;
  }

  const payload = getAccessTokenPayload<TokenClaims>();

  // Contas sem terms_accepted_at (claim explícito false). Token antigo sem claim passa.
  if (payload?.termsAccepted === false) {
    return <Navigate to="/cadastro/completar" replace />;
  }

  if (
    payload?.updatedPassword === false &&
    location.pathname !== "/alterar-senha"
  ) {
    return <Navigate to="/alterar-senha" replace />;
  }

  return (
    <CompanyBrandingProvider>
      <div className="mpn-page">
        <Outlet />
      </div>
    </CompanyBrandingProvider>
  );
}
