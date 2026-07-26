import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  MdOutlineCalendarMonth,
  MdOutlineInfo,
  MdOutlineLogout,
  MdOutlinePayments,
} from "react-icons/md";
import { logoutAndRedirect } from "../../utils/authCookie";
import Header from "../Header";
import CompanyAvatar from "../CompanyAvatar";
import {
  CompanyBrandingProvider,
  useCompanyBranding,
} from "../../contexts/CompanyBrandingContext";
import PendingBillingModal from "../PendingBillingModal";

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
    to: "/mensalidades",
    label: "Mensalidades",
    Icon: MdOutlinePayments,
    match: (path) => path.startsWith("/mensalidades"),
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

function AppLayoutShell({ children }: AppLayoutProps) {
  const location = useLocation();
  const { companyName } = useCompanyBranding();

  return (
    <div className="flex h-full min-h-0 flex-1">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-text-light/10 bg-master-light lg:flex">
        <div className="flex items-center gap-3 px-4 py-5">
          <Link
            to="/reservas"
            className="shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
          >
            <CompanyAvatar sizeClass="size-11" roundedClass="rounded-xl" />
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
                        ? "bg-accent-blue text-white shadow-[0_0_0_1px_rgba(37,84,160,0.45)]"
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
      <PendingBillingModal />
    </div>
  );
}

function AppLayout({ children }: AppLayoutProps) {
  return (
    <CompanyBrandingProvider>
      <AppLayoutShell>{children}</AppLayoutShell>
    </CompanyBrandingProvider>
  );
}

export default AppLayout;
