import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import { jwtDecode } from "jwt-decode";
import { MdOutlineInfo, MdShare } from "react-icons/md";
import { useLoading } from "../../hooks/useLoading";
import Loader from "../../components/Loader";
import { IInfo, infosByCompanyPublicId, updatePreferencesByCompanyPublicId } from "../../api/companies";

function Info() {
  const navigate = useNavigate();
  const { loading, withLoading } = useLoading();
  const [publicId, setPublicId] = useState<string>('');
  const [isHiddenInactiveHours, setIsHiddenInactiveHours] = useState<boolean>(false);
  const [info, setInfo] = useState<IInfo | null>(null);


  useEffect(() => {
    const token = Cookies.get("access_token");
    if (!token) {
      navigate("/");
    }
  }, [navigate]);

  const getInfosFromCookie = (): { companyName: string, companyPublicId: string } | null => {
    const match = document.cookie.match(/access_token=([^;]+)/);
    if (!match) return null;
    try {
      const token = match[1];
      const payload = jwtDecode<any>(token);
      return { companyName: payload?.companyName || '', companyPublicId: payload?.companyPublicId || '' };
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const info = getInfosFromCookie();
    setPublicId(info?.companyPublicId || '');
  }, []);

  useEffect(() => {
    if (!publicId) return;
    withLoading(async () => {
      try {
        const response = await infosByCompanyPublicId(publicId);
        setInfo(response);
        setIsHiddenInactiveHours(response?.preferences?.isHiddenInactiveHours || false);
      } catch (error) {
        console.error('Erro ao buscar informações da empresa:', error);
      }
    });
  }, [publicId]);


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

  const updatePreferences = async (isHiddenInactiveHoursInput: boolean): Promise<void> => {
    if (!publicId) {
      alert('Informações da empresa não disponíveis.');
      return;
    }
    await withLoading(async () => {
      await updatePreferencesByCompanyPublicId(publicId, {
        isHiddenInactiveHours: isHiddenInactiveHoursInput,
      });
    });
  };

  if (loading) return <Loader />;

  return (
    <>
      <Header />
      <section className="bg-neutral-800 h-[calc(100vh-64px)] w-full flex flex-col">
        <h2 className="text-lg bg-neutral-900 text-center p-3">Minhas informações</h2>
        <section className="mb-8">
          <h3 className="text-neutral-300 bg-neutral-700 py-1 px-2">Dados do site</h3>
          <div className="p-3 flex flex-col gap-6 md:gap-4 justify-between md:items-start">
            <a target="_blank" href={info?.link} className="underline p-3">Ir para a minha página</a>
            <button onClick={copyToClipboard} className="hidden md:block border-1 border-neutral-300 py-1 px-2 rounded-sm hover:underline active:underline">Copiar Link</button>
            <button onClick={shareLink} className="flex items-center justify-center p-1 gap-2 border-1 border-neutral-200 rounded-sm"><MdShare /> Compartilhar link da quadra</button>
          </div>
        </section>
        <section className="mb-8">
          <h3 className="text-neutral-300 bg-neutral-700 py-1 px-2">Preferências</h3>
          <div className="flex items-center pt-3 gap-1 mx-4 mb-2">
            <input
              type="checkbox"
              id="is-hidden-inactive-hours"
              checked={isHiddenInactiveHours}
              onChange={async (e) => {
                setIsHiddenInactiveHours(e.target.checked);
                if (info?.companyName) {
                  await updatePreferences(e.target.checked)
                }
              }}
            />
            <label
              htmlFor="is-hidden-inactive-hours"
              className="text-neutral-200 pt-1 ms-1"
            >
              Ocultar horários inativos
            </label>
          </div>
          <div className="flex items-start gap-1 px-4">
            <MdOutlineInfo size={20} />
            <p className="text-sm text-neutral-300">
              Mostrar na agenda somente os horários disponíveis, reservados e fixos.
            </p>
          </div>
        </section>
        <section className="mb-8">
          <h3 className="text-neutral-300 bg-neutral-700 py-1 px-2">Plano</h3>
          <p className="text-neutral-300 py-1 px-2 font-bold">{info?.plan.name}</p>
          <p className="text-neutral-300 py-1 px-2">
            Valor: {info?.plan.price != null ? `R$ ${Number(info.plan.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}/mês
          </p>
          {info?.plan.day_due && (
            <p className="text-neutral-300 py-1 px-2">
              Vencimento: dia {info?.plan.day_due} de cada mês.
            </p>
          )}
          {/* {info?.plan && info.plan.history.length > 0 && (
            <>
              <h4 className="text-neutral-300 font-bold mt-2 py-2 px-2 bg-neutral-700">Histórico de pagamento</h4>
              <ul className="flex flex-col gap-2 py-2">
                {info?.plan.history.map((item) => (
                  <li className={`text-neutral-300 px-2 flex items-center gap-2 border-b border-neutral-100 border-b-1 w-full border-l-3 ${item.paied ? 'border-l-tertiary-500' : 'border-l-secondary-400'}`}>
                    {item.paied ? (
                      <MdCheck />
                    ) : (
                      <MdOutlineSchedule />
                    )}
                    {formatDateToDDMMYYYY(item.date)} - R$ {Number(item.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} - {item.form_of_payment}
                  </li>
                ))}
              </ul>
            </>
          )} */}
        </section>
      </section>
    </>
  );
}
export default Info;
