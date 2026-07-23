import { Navigate, Outlet } from "react-router-dom";
import { getAccessToken } from "../../utils/authCookie";

/** Exige JWT; redireciona para login se ausente. */
export default function ProtectedRoute() {
  if (!getAccessToken()) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
