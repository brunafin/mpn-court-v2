import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import { jwtDecode } from "jwt-decode";
import { MdShare } from "react-icons/md";

function Info() {
  const navigate = useNavigate();
  const [info, setInfo] = useState<{ link: string, companyName: string } | null>(null);

  useEffect(() => {
    const token = Cookies.get("access_token");
    if (!token) {
      navigate("/");
    }
  }, [navigate]);

  const getInfosFromCookie = (): {link: string; companyName: string} | null => {
    const match = document.cookie.match(/access_token=([^;]+)/);
    if (!match) return null;
    try {
      const token = match[1];
      const payload = jwtDecode<any>(token);
      return {link: payload?.link || "", companyName: payload?.companyName || ''};
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const info = getInfosFromCookie();
    setInfo(info);
  }, []);


  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(info?.link ?? '');
      alert('Link copiado para a área de transferência!');
    } catch (err) {
      alert('Falha ao copiar o link.');
    }
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Detalhes da quadra ${info?.companyName}`,
          text: `Quadra ${info?.companyName}`,
          url: info?.link,
        });
      } catch (err) {
        alert('Compartilhamento cancelado ou falhou.');
      }
    } else {
      alert('Compartilhamento não suportado neste navegador.');
    }
  };

  return (
    <>
      <Header />
      <section className="bg-neutral-800 h-[calc(100vh-64px)] w-full flex flex-col">
          <h2 className="text-lg bg-neutral-900 text-center p-3">Minhas informações</h2>
          <a target="_blank" href={info?.link} className="underline mx-auto mt-4">Ir para a minha página</a>
          <button onClick={copyToClipboard} className="hidden md:block border-1 w-fit mx-auto mt-4 border-neutral-300 py-1 px-2 rounded-sm hover:underline active:underline">Copiar Link</button>
          <button onClick={shareLink} className="md:hidden flex items-center w-fit mx-auto mt-4 gap-2 justify-center border-1 border-neutral-100 rounded-sm py-1 px-2"><MdShare /> Compartilhar Link</button>
      </section>
    </>
  );
}
export default Info;
