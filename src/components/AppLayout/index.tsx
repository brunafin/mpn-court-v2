import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  MdOutlineCalendarMonth,
  MdOutlineInfo,
  MdOutlineLogout,
} from "react-icons/md";
import {
  getAccessTokenPayload,
  logoutAndRedirect,
} from "../../utils/authCookie";
import { useEffect, useState } from "react";
import Header from "../Header";
import { getMockOnboarding } from "../../onboarding/mockStore";

type NavItem = {
  to: string;
  label: string;
  Icon: typeof MdOutlineCalendarMonth;
  match: (path: string) => boolean;
};

const navItems: NavItem[] = [
  {
    to: "/reservas",
    label: "Início",
    Icon: MdOutlineCalendarMonth,
    match: (path) => path === "/reservas" || path.startsWith("/reservas/"),
  },
  {
    to: "/minhas-infos",
    label: "Minhas informações",
    Icon: MdOutlineInfo,
    match: (path) => path.startsWith("/minhas-infos"),
  },
];

type AppLayoutProps = {
  children: ReactNode;
};

function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const [companyName, setCompanyName] = useState("");

  useEffect(() => {
    const payload = getAccessTokenPayload<{ companyName?: string }>();
    if (payload?.companyName) {
      setCompanyName(payload.companyName);
      return;
    }
    const mock = getMockOnboarding();
    if (mock?.arenaName) {
      setCompanyName(mock.arenaName);
    }
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-1">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-text-light/10 bg-master-light lg:flex">
        <div className="flex items-center gap-3 px-4 py-5">
          <Link
            to="/reservas"
            className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
          >
            <img
              src={import.meta.env.VITE_LOGO_URL_HEADER}
              alt=""
              aria-hidden
              className="size-full object-contain"
            />
          </Link>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-light/50">
              Gestão
            </p>
            <p className="truncate text-sm font-semibold text-text-light">
              {companyName || "Painel"}
            </p>
          </div>
        </div>

        <nav aria-label="Navegação principal" className="flex-1 px-3 py-2">
          <ul className="flex flex-col gap-1">
            {navItems.map(({ to, label, Icon, match }) => {
              const isActive = match(location.pathname);
              return (
                <li key={to}>
                  <Link
                    to={to}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue ${
                      isActive
                        ? "bg-accent-blue text-white shadow-[0_0_0_1px_rgba(61,111,184,0.45)]"
                        : "text-text-light/70 hover:bg-text-light/10 hover:text-text-light"
                    }`}
                  >
                    <Icon size={20} className="shrink-0" aria-hidden />
                    <span className="truncate">{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-text-light/10 p-3">
          <button
            type="button"
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold text-text-light/70 transition hover:bg-text-light/10 hover:text-text-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
            onClick={() => {
              void logoutAndRedirect();
            }}
          >
            <MdOutlineLogout size={18} aria-hidden />
            Sair
          </button>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Header />
        {children}
      </div>
    </div>
  );
}

export default AppLayout;
