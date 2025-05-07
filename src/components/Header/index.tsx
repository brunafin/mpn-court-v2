import { BsList } from "react-icons/bs";

function Header() {
  return (
    <header className="bg-neutral-200 h-16 flex items-center justify-between px-4 sticky top-0 z-10">
      <a href="/">
        <img
          src={import.meta.env.VITE_LOGO_URL_HEADER}
          title="logo"
          alt="logo"
          className="h-16 py-2"
        />
      </a>
      <h1 className="font-bold text-center text-base text-neutral-800">
        Sua Quadra
      </h1>
      <BsList className="text-neutral-800 cursor-pointer" size={24} />
    </header>
  );
}
export default Header;
