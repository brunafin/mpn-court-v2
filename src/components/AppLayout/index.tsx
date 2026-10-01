import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  MdOutlineCalendarMonth,
  MdOutlineInfo,
  MdOutlineLogout,
  MdOutlineNotifications,
  MdOutlinePayments,
} from "react-icons/md";
import { GiSoccerField } from "react-icons/gi";
import { logoutAndRedirect } from "../../utils/authCookie";
import Header from "../Header";
import ArenaHomeLink from "../ArenaHomeLink";
import {
  useCompanyBranding,
  useCompanyCapabilities,
} from "../../contexts/CompanyBrandingContext";
import PendingBillingModal from "../PendingBillingModal";
import { buttonClassName } from "../Button";
import { billingNavLabel, billingNavPath } from "../../utils/billingNav";
import ThemeModeSwitch from "../ThemeModeSwitch";

type NavItem = {
  to: string;
  label: string;
  Icon: typeof MdOutlineCalendarMonth;
  match: (path: string) => boolean;
};

function buildNavItems(
  entitlement: string | null | undefined,
  ready: boolean,
): NavItem[] {
  const effective = ready
    ? (entitlement as "trial" | "paid" | "none" | undefined)
    : undefined;
  const billingPath = billingNavPath(effective);
  return [
    {
      to: "/reservas",
      label: "Início",
      Icon: MdOutlineCalendarMonth,
      match: (path) => path === "/reservas" || path.startsWith("/reservas/"),
    },
    {
      to: "/notificacoes",
      label: "Lembretes",
      Icon: MdOutlineNotifications,
      match: (path) => path.startsWith("/notificacoes"),
    },
    {
      to: "/quadras",
      label: "Quadras",
      Icon: GiSoccerField,
      match: (path) => path.startsWith("/quadras"),
    },
    {
      to: "/minhas-infos",
      label: "Minhas informações",
      Icon: MdOutlineInfo,
      match: (path) => path.startsWith("/minhas-infos"),
    },
    {
      to: billingPath,
      label: billingNavLabel(effective),
      Icon: MdOutlinePayments,
      match: (path) =>
        path.startsWith("/mensalidades") || path.startsWith("/planos"),
    },
  ];
}

type AppLayoutProps = {
  children: ReactNode;
};

function AccessBanners() {
  const caps = useCompanyCapabilities();
  const location = useLocation();

  if (caps.accessMode === "read_only") {
    const billingPath = billingNavPath(caps.entitlement);
    const onBilling =
      location.pathname.startsWith("/mensalidades") ||
      location.pathname.startsWith("/planos");
    return (
      <div
        role="status"
        className="shrink-0 border-b border-warning-500/35 bg-warning-500/15 px-4 py-3"
      >
        <p className="text-base font-semibold text-text-light">
          Conta em modo somente leitura
        </p>
        <p className="mt-1 text-base text-text-light/70">
          Você pode visualizar a agenda, mas não criar, alterar ou excluir.
          Suas quadras ficam ocultas no site até a regularização (sem alterar
          quais estavam publicadas).
        </p>
        {!onBilling ? (
          <Link
            to={billingPath}
            className={buttonClassName({
              variant: "secondary",
              size: "md",
              className: "mt-3 inline-flex w-auto",
              fullWidth: false,
            })}
          >
            Ir para {billingNavLabel(caps.entitlement).toLowerCase()}
          </Link>
        ) : null}
      </div>
    );
  }

  return null;
}

function AppLayoutShell({ children }: AppLayoutProps) {
  const location = useLocation();
  const { companyName } = useCompanyBranding();
  const caps = useCompanyCapabilities();
  const navItems = buildNavItems(caps.entitlement, caps.ready);
  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <aside className="hidden w-56 shrink-0 flex-col bg-master lg:flex">
        <div className="flex items-center gap-3 px-3 py-4">
          <ArenaHomeLink sizeClass="size-11" roundedClass="rounded-xl" />
          <p className="min-w-0 truncate text-base font-semibold text-text-light">
            {companyName || "Painel"}
          </p>
        </div>

        <nav aria-label="Navegação principal" className="flex-1 px-3 py-2">
          <ul className="flex flex-col gap-1.5">
            {navItems.map(({ to, label, Icon, match }) => {
              const isActive = match(location.pathname);
              return (
                <li key={to}>
                  <Link
                    to={to}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-base font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue ${
                      isActive
                        ? "bg-text-light/90 text-master"
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

        <div className="px-3 pb-3 pt-2">
          <div className="mb-2 px-1">
            <ThemeModeSwitch />
          </div>
          <button
            type="button"
            className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-base font-semibold text-text-light/70 transition hover:bg-text-light/10 hover:text-text-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
            onClick={() => {
              void logoutAndRedirect();
            }}
          >
            <MdOutlineLogout size={18} aria-hidden />
            Sair
          </button>
        </div>
      </aside>

      <div className="mpn-page min-w-0">
        <Header />
        <AccessBanners />
        {children}
      </div>
      <PendingBillingModal />
    </div>
  );
}

function AppLayout({ children }: AppLayoutProps) {
  return <AppLayoutShell>{children}</AppLayoutShell>;
}

export default AppLayout;
