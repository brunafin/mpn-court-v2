import { useEffect, useId, useRef, useState } from "react";
import { BsList, BsX } from "react-icons/bs";
import {
  MdOutlineHome,
  MdOutlineInfo,
  MdOutlineLogout,
  MdOutlineNotifications,
  MdOutlinePayments,
} from "react-icons/md";
import { GiSoccerField } from "react-icons/gi";
import { Link, useLocation } from "react-router-dom";
import { logoutAndRedirect } from "../../utils/authCookie";
import {
  useCompanyBranding,
  useCompanyCapabilities,
} from "../../contexts/CompanyBrandingContext";
import ArenaHomeLink from "../ArenaHomeLink";
import CompanyAvatar from "../CompanyAvatar";
import {
  billingNavDescription,
  billingNavLabel,
  billingNavPath,
} from "../../utils/billingNav";
import ThemeModeSwitch from "../ThemeModeSwitch";

type NavItem = {
  to: string;
  label: string;
  description: string;
  Icon: typeof MdOutlineHome;
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
      description: "Reservas do dia",
      Icon: MdOutlineHome,
      match: (path) => path === "/reservas" || path.startsWith("/reservas/"),
    },
    {
      to: "/notificacoes",
      label: "Lembretes",
      description: "Avisos do dia",
      Icon: MdOutlineNotifications,
      match: (path) => path.startsWith("/notificacoes"),
    },
    {
      to: "/quadras",
      label: "Quadras",
      description: "Ativar no site",
      Icon: GiSoccerField,
      match: (path) => path.startsWith("/quadras"),
    },
    {
      to: "/minhas-infos",
      label: "Minhas informações",
      description: "Dados da conta",
      Icon: MdOutlineInfo,
      match: (path) => path.startsWith("/minhas-infos"),
    },
    {
      to: billingPath,
      label: billingNavLabel(effective),
      description: billingNavDescription(effective),
      Icon: MdOutlinePayments,
      match: (path) =>
        path.startsWith("/mensalidades") || path.startsWith("/planos"),
    },
  ];
}

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const location = useLocation();
  const { companyName } = useCompanyBranding();
  const caps = useCompanyCapabilities();
  const navItems = buildNavItems(caps.entitlement, caps.ready);
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 50);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [menuOpen]);

  const getNavLinkClass = (isActive: boolean) =>
    `flex min-h-14 items-center gap-3 rounded-xl px-3 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue ${
      isActive
        ? "bg-text-light/90 text-master"
        : "text-text-light hover:bg-text-light/10"
    }`;

  return (
    <header className="mpn-header-safe sticky top-0 z-20 flex min-h-16 shrink-0 items-center gap-3 bg-master px-3 lg:hidden">
      <ArenaHomeLink sizeClass="size-12" roundedClass="rounded-xl" />

      <h1 className="min-w-0 flex-1 truncate text-base font-semibold text-text-light sm:text-lg">
        <Link
          to="/reservas"
          className="block truncate rounded-lg py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
        >
          {companyName}
        </Link>
      </h1>

      <div className="flex shrink-0 items-center">
        <button
          type="button"
          aria-label="Abrir menu"
          aria-expanded={menuOpen}
          aria-haspopup="dialog"
          onClick={() => setMenuOpen(true)}
          className="mpn-tap flex size-11 items-center justify-center rounded-xl text-text-light transition hover:bg-text-light/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
        >
          <BsList size={26} aria-hidden />
        </button>
      </div>

      {menuOpen && (
        <div
          className="fixed inset-0 z-40 flex justify-end"
          role="presentation"
        >
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-black/60"
            onClick={() => setMenuOpen(false)}
          />

          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative z-10 flex h-full w-[min(100%,20rem)] flex-col bg-master text-text-light shadow-2xl"
          >
            <div className="mpn-chrome-top flex items-center gap-3 px-3 pb-3">
              <CompanyAvatar
                sizeClass="size-12"
                roundedClass="rounded-xl"
                decorative
              />
              <h2
                id={titleId}
                className="min-w-0 flex-1 truncate text-base font-semibold text-text-light"
              >
                {companyName || "Navegação"}
              </h2>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Fechar"
                className="flex size-11 shrink-0 items-center justify-center rounded-full bg-master-light text-text-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
              >
                <BsX size={24} aria-hidden />
              </button>
            </div>

            <nav
              aria-label="Menu principal"
              className="flex-1 overflow-y-auto px-3 py-2"
            >
              <ul className="flex flex-col gap-1.5">
                {navItems.map(({ to, label, description, Icon, match }) => {
                  const isActive = match(location.pathname);
                  return (
                    <li key={to}>
                      <Link
                        to={to}
                        aria-current={isActive ? "page" : undefined}
                        className={getNavLinkClass(isActive)}
                      >
                        <Icon
                          size={20}
                          className={`shrink-0 ${
                            isActive ? "text-master" : "text-text-light/70"
                          }`}
                          aria-hidden
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-base font-semibold leading-5">
                            {label}
                          </span>
                          <span
                            className={`block truncate text-base ${
                              isActive ? "text-master/70" : "text-text-light/70"
                            }`}
                          >
                            {description}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
              <div className="mb-2 px-1">
                <ThemeModeSwitch />
              </div>
              <button
                type="button"
                className="mpn-tap flex min-h-14 w-full items-center gap-3 rounded-xl px-3 text-base font-semibold text-text-light/70 transition hover:bg-text-light/10 hover:text-text-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
                onClick={() => {
                  void logoutAndRedirect();
                }}
              >
                <MdOutlineLogout size={20} aria-hidden />
                Sair
              </button>
            </div>
          </aside>
        </div>
      )}
    </header>
  );
}

export default Header;
