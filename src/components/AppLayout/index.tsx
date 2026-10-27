import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  MdOutlineGroups,
  MdOutlineLogout,
  MdOutlineNotifications,
  MdOutlineTune,
} from "react-icons/md";
import { TbMoneybag } from "react-icons/tb";
import type { IconType } from "react-icons";
import { GiSoccerField } from "react-icons/gi";
import BrandCalendarIcon from "../Icons/BrandCalendarIcon";
import { logoutAndRedirect } from "../../utils/authCookie";
import Header from "../Header";
import ArenaHomeLink from "../ArenaHomeLink";
import {
  useCompanyBranding,
  useCompanyCapabilities,
} from "../../contexts/CompanyBrandingContext";
import PendingBillingModal from "../PendingBillingModal";
import ReadOnlyAccessModal, {
  ReadOnlyAccessBanner,
  useReadOnlyNotice,
} from "../ReadOnlyAccessModal";
import { billingNavLabel, billingNavPath } from "../../utils/billingNav";
import { MPN_SPLIT_TEAMS_URL } from "../../constants/legal";
type NavItem = {
  to: string;
  label: string;
  Icon: IconType;
  match: (path: string) => boolean;
  external?: boolean;
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
      label: "Agenda",
      Icon: BrandCalendarIcon,
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
      to: MPN_SPLIT_TEAMS_URL,
      label: "Separar times",
      Icon: MdOutlineGroups,
      match: () => false,
      external: true,
    },
    {
      to: billingPath,
      label: billingNavLabel(effective),
      Icon: TbMoneybag,
      match: (path) =>
        path.startsWith("/mensalidades") || path.startsWith("/planos"),
    },
    {
      to: "/preferencias",
      label: "Preferências",
      Icon: MdOutlineTune,
      match: (path) => path.startsWith("/preferencias"),
    },
  ];
}

type AppLayoutProps = {
  children: ReactNode;
};

function AppLayoutShell({ children }: AppLayoutProps) {
  const location = useLocation();
  const { companyName } = useCompanyBranding();
  const caps = useCompanyCapabilities();
  const readOnlyNotice = useReadOnlyNotice();
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
            {navItems.map(({ to, label, Icon, match, external }) => {
              const isActive = match(location.pathname);
              const className = `flex min-h-11 items-center gap-3 rounded-xl px-3 text-base font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                isActive
                  ? "bg-text-light/90 text-master"
                  : "text-text-light/70 hover:bg-text-light/10 hover:text-text-light"
              }`;
              const content = (
                <>
                  <Icon size={20} className="shrink-0" aria-hidden />
                  <span className="truncate">{label}</span>
                </>
              );
              return (
                <li key={to}>
                  {external ? (
                    <a
                      href={to}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={className}
                    >
                      {content}
                    </a>
                  ) : (
                    <Link
                      to={to}
                      aria-current={isActive ? "page" : undefined}
                      className={className}
                    >
                      {content}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="px-3 pb-3 pt-2">
          <button
            type="button"
            className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-base font-semibold text-text-light/70 transition hover:bg-text-light/10 hover:text-text-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
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
        <ReadOnlyAccessBanner notice={readOnlyNotice} />
        {children}
      </div>
      <ReadOnlyAccessModal notice={readOnlyNotice} />
      <PendingBillingModal />
    </div>
  );
}

function AppLayout({ children }: AppLayoutProps) {
  return <AppLayoutShell>{children}</AppLayoutShell>;
}

export default AppLayout;
