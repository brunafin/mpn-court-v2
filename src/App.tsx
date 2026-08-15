import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import SignUpVerifyCode from "./pages/SignUp/VerifyCode";
import CompleteProfile from "./pages/SignUp/CompleteProfile";
import ForgotPassword from "./pages/ForgotPassword";
import ForgotPasswordReset from "./pages/ForgotPassword/Reset";
import OnboardingArena from "./pages/Onboarding/Arena";
import OnboardingChecklist from "./pages/Onboarding";
import OnboardingSchedule from "./pages/Onboarding/Schedule";
import OnboardingCourt from "./pages/Onboarding/Court";
import Reservation from "./pages/Reservation";
import ReservationDetails from "./pages/Reservation/Details";
import ChangePassword from "./pages/ChangePassword";
import Info from "./pages/Info";
import Courts from "./pages/Courts";
import Billing from "./pages/Billing";
import Plans from "./pages/Plans";
import ConfigDay from "./pages/ConfigDay";
import Notifications from "./pages/Notifications";
import ProtectedRoute from "./components/ProtectedRoute";
import { NotificationProvider } from "./contexts/NotificationContext";
import { ErrorsProvider, useErrors } from "./contexts/ErrorsContext";
import { setAxiosErrorNotifier } from "./api/axios";
import ProductInactiveModal from "./components/ProductInactiveModal";

/** Telas altas (auth + onboarding) — não podem herdar overflow-hidden do shell. */
function isScrollableShellPath(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname.startsWith("/cadastro") ||
    pathname.startsWith("/esqueci-senha") ||
    pathname.startsWith("/comecar")
  );
}

function showTestEnvBanner(): boolean {
  if (import.meta.env.VITE_ENVIRONMENT !== "production") return true;
  return (
    typeof window !== "undefined" &&
    /sandbox/i.test(window.location.hostname)
  );
}

function App() {
  const { pathname } = useLocation();
  const scrollableShell = isScrollableShellPath(pathname);

  useEffect(() => {
    if (import.meta.env.VITE_ENVIRONMENT === "production") {
      (function (c: any, l: any, a: any, r: any, i: any, t?: any, y?: any) {
        c[a] =
          c[a] ||
          function () {
            (c[a].q = c[a].q || []).push(arguments);
          };
        t = l.createElement(r);
        t.async = 1;
        t.src = "https://www.clarity.ms/tag/" + i;
        y = l.getElementsByTagName(r)[0];
        y.parentNode.insertBefore(t, y);
        // Replay mascarado; campos sensíveis também usam data-clarity-mask
        c[a]("set", "maskingMode", "masked");
      })(window, document, "clarity", "script", "skzyiavfyw");
    }
  }, []);

  const InitAxiosNotifier = () => {
    const { notifyError } = useErrors();

    useEffect(() => {
      setAxiosErrorNotifier(notifyError);
    }, [notifyError]);

    return null;
  };

  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-master">
      {showTestEnvBanner() && (
        <p className="shrink-0 bg-warning-500/90 px-3 py-1.5 text-center text-sm font-semibold text-master">
          Ambiente de teste — dados podem ser fictícios
        </p>
      )}
      <div
        className={
          scrollableShell
            ? "flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain"
            : "mpn-page"
        }
      >
        <ErrorsProvider>
          <InitAxiosNotifier />
          <ProductInactiveModal />
          <NotificationProvider>
            <Routes>
              <Route index element={<Login />} />
              <Route path="/cadastro" element={<SignUp />} />
              <Route path="/cadastro/codigo" element={<SignUpVerifyCode />} />
              <Route
                path="/cadastro/completar"
                element={<CompleteProfile />}
              />
              <Route path="/esqueci-senha" element={<ForgotPassword />} />
              <Route
                path="/esqueci-senha/redefinir"
                element={<ForgotPasswordReset />}
              />
              <Route element={<ProtectedRoute />}>
                <Route path="/comecar" element={<OnboardingChecklist />} />
                <Route
                  path="/comecar/estabelecimento"
                  element={<OnboardingArena />}
                />
                <Route
                  path="/comecar/horario"
                  element={<OnboardingSchedule />}
                />
                <Route path="/comecar/quadra" element={<OnboardingCourt />} />
                <Route path="/reservas" element={<Reservation />} />
                <Route path="/reservas/:id" element={<ReservationDetails />} />
                <Route path="/alterar-senha" element={<ChangePassword />} />
                <Route path="/minhas-infos" element={<Info />} />
                <Route path="/quadras" element={<Courts />} />
                <Route path="/mensalidades" element={<Billing />} />
                <Route path="/planos" element={<Plans />} />
                <Route
                  path="/configuracoes-horarios"
                  element={<ConfigDay />}
                />
                <Route path="/notificacoes" element={<Notifications />} />
              </Route>
            </Routes>
          </NotificationProvider>
        </ErrorsProvider>
      </div>
    </div>
  );
}

export default App;
