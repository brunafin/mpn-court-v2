import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import { jwtDecode } from "jwt-decode";
import { MdShare } from "react-icons/md";

function Info() {
  const navigate = useNavigate();
  const [info, setInfo] = useState<{ link: string } | null>(null);

  useEffect(() => {
    const token = Cookies.get("access_token");
    if (!token) {
      navigate("/");
    }
  }, [navigate]);

  const getInfosFromCookie = () => {
    const match = document.cookie.match(/access_token=([^;]+)/);
    if (!match) return "";
    try {
      const token = match[1];
      const payload = jwtDecode<any>(token);
      return payload?.link || "";
    } catch {
      return "";
    }
  };

  useEffect(() => {
    setInfo({
      link: getInfosFromCookie()
    });
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
          title: 'Reserva de Quadra',
          text: 'Confira o link para reservar sua quadra!',
          url: info?.link,
        });
        alert('Compartilhamento realizado!');
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
        <div className="bg-neutral-800 flex flex-col gap-4 py-2 mb-4 mt-2 mx-2 rounded-sm md:mx-auto">
          <h2 className="text-lg">Minhas informações</h2>
          <a target="_blank" href={info?.link} className="hover:underline active:underline">Ir para a minha página</a>
          <button onClick={copyToClipboard} className="border-1 border-neutral-300 py-1 px-2 rounded-sm hover:underline active:underline">Copiar Link</button>
          <button onClick={shareLink} className="flex items-center gap-2 justify-center border-1 border-neutral-100 rounded-sm py-1 px-2"><MdShare /> Compartilhar Link</button>
        </div>
      </section>
    </>
  );
}
export default Info;
