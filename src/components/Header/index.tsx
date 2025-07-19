import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import { BsList } from "react-icons/bs";
import { MdOutlineLogout } from "react-icons/md";
import { Link } from "react-router-dom";

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [companyName, setCompanyName] = useState("");

  const getCompanyNameFromCookie = () => {
    const match = document.cookie.match(/access_token=([^;]+)/);
    if (!match) return "";
    try {
      const token = match[1];
      const payload = jwtDecode<any>(token);
      return payload?.companyName || "";
    } catch {
      return "";
    }
  };
  
  useEffect(() => {
    setCompanyName(getCompanyNameFromCookie());
  }, []);

  return (
    <header className="bg-neutral-200 h-16 flex items-center justify-between px-4 sticky top-0 z-20">
      <a href="/">
        <img
          src={import.meta.env.VITE_LOGO_URL_HEADER}
          title="logo"
          alt="logo"
          className="h-16 py-2"
        />
      </a>
      <h1 className="font-bold text-center text-base text-neutral-800">
        {companyName}
      </h1>
      <div className="relative">
        <BsList
          className="text-neutral-800 cursor-pointer"
          size={24}
          onClick={() => setMenuOpen((open) => !open)}
        />
        {menuOpen && (
          <nav className="absolute right-0 mt-2 w-64 bg-neutral-800 rounded shadow-lg z-30 px-4 py-2">
            <ul className="mb-4">
              <li>
                <Link
                  className="flex items-start py-3 justify-between"
                  to={`/minhas-infos`}
                >
                  Minhas informações
                </Link>
              </li>
            </ul>
            <button
              className="flex items-center gap-2 py-4 w-full text-left  text-neutral-100"
              onClick={() => {
                document.cookie =
                  "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                window.location.href = "/";
              }}
            >
              <MdOutlineLogout />
              Sair
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}
export default Header;
