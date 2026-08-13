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

  // Só contas novas (sem terms_accepted_at). Claim false; token antigo sem claim passa.
  if (payload?.termsAccepted === false) {
    return <Navigate to="/cadastro/completar" replace />;
  }

  if (
    payload?.updatedPassword === false &&
    location.pathname !== "/alterar-senha"
  ) {
    return <Navigate to="/alterar-senha" replace />;
  }

  // Onboarding rola no shell do App (como login); mpn-page truncaria o formulário no mobile.
  const isOnboarding = location.pathname.startsWith("/comecar");

  return (
    <CompanyBrandingProvider>
      {isOnboarding ? (
        <Outlet />
      ) : (
        <div className="mpn-page">
          <Outlet />
        </div>
      )}
    </CompanyBrandingProvider>
  );
}
