import { useEffect, useId, useRef, useState } from "react";
import { BsList, BsX } from "react-icons/bs";
import {
  MdOutlineHome,
  MdOutlineInfo,
  MdOutlineLogout,
} from "react-icons/md";
import { Link, useLocation } from "react-router-dom";
import {
  getAccessTokenPayload,
  logoutAndRedirect,
} from "../../utils/authCookie";

type NavItem = {
  to: string;
  label: string;
  description: string;
  Icon: typeof MdOutlineHome;
  iconClass: string;
  iconBgClass: string;
  match: (path: string) => boolean;
};

const navItems: NavItem[] = [
  {
    to: "/reservas",
    label: "Início",
    description: "Reservas do dia",
    Icon: MdOutlineHome,
    iconClass: "text-accent-blue",
    iconBgClass: "bg-accent-blue/15",
    match: (path) => path === "/reservas" || path.startsWith("/reservas/"),
  },
  {
    to: "/minhas-infos",
    label: "Minhas informações",
    description: "Dados da conta",
    Icon: MdOutlineInfo,
    iconClass: "text-accent-blue-soft",
    iconBgClass: "bg-accent-blue/10",
    match: (path) => path.startsWith("/minhas-infos"),
  },
];

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const location = useLocation();

  useEffect(() => {
    const payload = getAccessTokenPayload<{ companyName?: string }>();
    if (payload?.companyName) {
      setCompanyName(payload.companyName);
    }
  }, []);

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
    `flex min-h-16 items-center gap-3 rounded-xl px-3 py-3 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue ${
      isActive
        ? "bg-master ring-1 ring-inset ring-accent-blue/40"
        : "bg-master/60 hover:bg-master active:bg-master"
    }`;

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 bg-master px-4 lg:hidden">
      {/* Mobile: logo + nome + hamburger */}
      <Link
        to="/reservas"
        className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
      >
        <img
          src={import.meta.env.VITE_LOGO_URL_HEADER}
          title="logo"
          alt="Logo"
          className="size-full object-contain"
        />
      </Link>

      <h1 className="min-w-0 flex-1 truncate text-base font-semibold text-text-light sm:text-lg">
        <Link
          to={`/reservas`}
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
            className="absolute inset-0 bg-black/75"
            onClick={() => setMenuOpen(false)}
          />

          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative z-10 flex h-full w-[min(100%,20rem)] flex-col bg-master text-text-light shadow-2xl"
          >
            <div className="px-4 pb-4 pt-4">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-neutral-100">
                    <img
                      src={import.meta.env.VITE_LOGO_URL_HEADER}
                      alt=""
                      aria-hidden
                      className="size-full object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-light/65">
                      Menu
                    </p>
                    <h2
                      id={titleId}
                      className="truncate text-lg font-semibold text-text-light"
                    >
                      {companyName || "Navegação"}
                    </h2>
                  </div>
                </div>
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
            </div>

            <nav
              aria-label="Menu principal"
              className="flex-1 overflow-y-auto px-4 py-4"
            >
              <p className="mb-2 px-1 text-sm font-semibold uppercase tracking-wide text-text-light/55">
                Navegação
              </p>
              <ul className="flex flex-col gap-2">
                {navItems.map(
                  ({
                    to,
                    label,
                    description,
                    Icon,
                    iconClass,
                    iconBgClass,
                    match,
                  }) => {
                    const isActive = match(location.pathname);
                    return (
                      <li key={to}>
                        <Link
                          to={to}
                          aria-current={isActive ? "page" : undefined}
                          className={getNavLinkClass(isActive)}
                        >
                          <span
                            className={`flex size-11 shrink-0 items-center justify-center rounded-full ${iconBgClass} ${iconClass}`}
                          >
                            <Icon size={22} aria-hidden />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-lg font-semibold leading-6 text-text-light">
                              {label}
                            </span>
                            <span className="block truncate text-sm text-text-light/65">
                              {description}
                            </span>
                          </span>
                        </Link>
                      </li>
                    );
                  }
                )}
              </ul>
            </nav>

            <div className="border-t border-text-light/10 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-master-light px-4 text-base font-semibold text-text-light transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
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
