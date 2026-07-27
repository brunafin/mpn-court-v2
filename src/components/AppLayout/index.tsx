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
  useCompanyCapabilities,
} from "../../contexts/CompanyBrandingContext";
import PendingBillingModal from "../PendingBillingModal";
import { buttonClassName } from "../Button";

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

const WHATSAPP_CONTRACT =
  import.meta.env.VITE_WHATSAPP_CONTRACT_URL ||
  "https://wa.me/5551989589197?text=Ol%C3%A1%2C%20quero%20contratar%20o%20plano%20mensal%20da%20Marca%20Pra%20N%C3%B3s";

type AppLayoutProps = {
  children: ReactNode;
};

function AccessBanners() {
  const caps = useCompanyCapabilities();
  const location = useLocation();

  if (caps.entitlement === "none") {
    return (
      <div
        role="status"
        className="shrink-0 border-b border-warning-500/35 bg-warning-500/15 px-4 py-3"
      >
        <p className="text-sm font-semibold text-text-light">
          Período de teste encerrado
        </p>
        <p className="mt-1 text-sm text-text-light/80">
          Contrate um plano mensal para voltar a ver a agenda e publicar no
          site.
        </p>
        <a
          href={WHATSAPP_CONTRACT}
          target="_blank"
          rel="noreferrer"
          className={buttonClassName({
            variant: "primary",
            size: "md",
            className: "mt-3 inline-flex w-auto",
            fullWidth: false,
          })}
        >
          Contratar plano
        </a>
      </div>
    );
  }

  if (caps.accessMode === "read_only") {
    const onBilling = location.pathname.startsWith("/mensalidades");
    return (
      <div
        role="status"
        className="shrink-0 border-b border-warning-500/35 bg-warning-500/15 px-4 py-3"
      >
        <p className="text-sm font-semibold text-text-light">
          Conta em modo somente leitura
        </p>
        <p className="mt-1 text-sm text-text-light/80">
          Você pode visualizar a agenda, mas não criar, alterar ou excluir.
          Regularize a mensalidade para liberar.
        </p>
        {!onBilling ? (
          <Link
            to="/mensalidades"
            className={buttonClassName({
              variant: "secondary",
              size: "md",
              className: "mt-3 inline-flex w-auto",
              fullWidth: false,
            })}
          >
            Ir para mensalidades
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

  const visibleNav = navItems.filter((item) => {
    if (caps.entitlement === "none" && item.to === "/reservas") return false;
    return true;
  });

  return (
    <div className="flex h-full min-h-0 flex-1">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-text-light/10 bg-master-light lg:flex">
        <div className="flex items-center gap-3 px-4 py-5">
          <Link
            to={caps.canViewAgenda ? "/reservas" : "/mensalidades"}
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
            {visibleNav.map(({ to, label, Icon, match }) => {
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
        <AccessBanners />
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
