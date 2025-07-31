import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import Header from "../../components/Header";
import Loader from "../../components/Loader";
import { useLoading } from "../../hooks/useLoading";
import { MdOutlineCheck, MdOutlinePostAdd } from "react-icons/md";
import Daypicker from "../../components/Daypicker";
import NewReminderModal from "../../components/NewNote";
import { checkIsRead, createNote, INote, notesByDate } from "../../api/notes";
import { useNotification } from "../../contexts/NotificationContext";

const defaultDate = new Date(new Date().setHours(0, 0, 0, 0));  

function Notifications() {
  const navigate = useNavigate();
  const { unreadCount, setUnreadCount } = useNotification();
  const { loading, withLoading } = useLoading();
  const [companyPublicId, setCompanyPublicId] = useState<string>('');
  const [showNewReminderModal, setShowNewReminderModal] = useState(false);
  const [date, setDate] = useState<Date>(defaultDate);
  const [notifications, setNotifications] = useState<INote[]>([]);
  const [message, setMessage] = useState<string>('');
  const [is24before, setIs24before] = useState<boolean>(false);


  useEffect(() => {
    const token = Cookies.get("access_token");
    if (!token) {
      navigate("/");
    }
  }, [navigate]);

  const getInfosFromCookie = (): { companyPublicId: string } | null => {
    const match = document.cookie.match(/access_token=([^;]+)/);
    if (!match) return null;
    try {
      const token = match[1];
      const payload = jwtDecode<any>(token);
      return { companyPublicId: payload?.companyPublicId || '' };
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const info = getInfosFromCookie();
    setCompanyPublicId(info?.companyPublicId || '');
  }, []);

  const fetchNotifications = async () => {
    if (!companyPublicId) return;
    await withLoading(async () => {
      try {
        const response = await notesByDate(companyPublicId, date.toISOString().split('T')[0]);
        setNotifications(response);
        if (date.toDateString() === new Date().toDateString()) {
          setUnreadCount(response.length);
        }
      } catch (error) {
        console.error('Erro ao buscar lembretes da empresa:', error);
      }
    });
  };

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyPublicId, date]);

  const handleCheckIsRead = async (id: string) => {
    try {
      await withLoading(async () => {
        await checkIsRead(id);
        setNotifications((prev) => prev.filter((note) => note.id !== parseInt(id)));
        if (date.toDateString() === new Date().toDateString()) {
          setUnreadCount(unreadCount - 1);
        }
      });
    } catch (error) {
      console.error('Erro ao marcar lembrete como lido:', error);
    }
  };

  const handleSubmit = async (): Promise<void> => {
    if (!message.trim()) {
      return alert("Uma mensagem é necessária para criar um lembrete.");
    }
    await withLoading(async () => {
      await createNote({
        companyPublicId,
        date: date.toISOString().split('T')[0],
        message,
        is24HoursBefore: is24before,
      });
      setShowNewReminderModal(false);
      setMessage('');
      setIs24before(false);
      fetchNotifications();
    });
  };


  if (loading) return <Loader />;

  return (
    <>
      <Header />
      <section className="bg-neutral-800 h-[calc(100vh-64px)] w-full flex flex-col">
        <div className="bg-neutral-900 flex justify-center gap-2 p-3">
            <h2
            className="text-lg cursor-pointer"
            onClick={() => setDate(defaultDate)}
            title="Voltar para hoje"
            >
            Lembretes
            </h2>
          <button
            onClick={() => setShowNewReminderModal(true)}
            className="text-neutral-200 cursor-pointer"
          >
            <MdOutlinePostAdd
              size={24}
              className="text-neutral-200 cursor-pointer"
            />
          </button>
        </div>
        <div className="flex justify-center items-center p-4">
          <Daypicker
            selectedDate={date}
            setSelectedDate={setDate}
          />
        </div>
        {notifications && notifications.length > 0 ? (
          <ul className="flex flex-col items-center gap-4 p-4">
            {notifications.map((notification: any) => (
              <li key={notification.id} className="bg-white text-neutral-700 py-4 ps-4 pe-2 rounded shadow w-full max-w-md">
                {notification.sender && (
                  <span className="text-sm font-bold text-neutral-800 block mb-1">{notification.sender}:
                    {notification.title && (
                      <span className="font-normal text-neutral-600">{' '}({notification.title})</span>
                    )}
                  </span>
                )}
                <div className="flex justify-between items-stretch">
                  <p>{notification.message}</p>
                  <button
                    className="p-2 active:border-2 active:border-neutral-800 rounded-sm bg-tertiary-100"
                    onClick={async () => handleCheckIsRead(notification.id.toString())}

                  >
                    <MdOutlineCheck />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-white mt-4">Tudo em dia.</p>
        )}
      </section >
      <NewReminderModal
        isOpen={showNewReminderModal}
        onClose={() => setShowNewReminderModal(false)}
        handleSubmit={handleSubmit}
        date={date.toLocaleString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' })}
        message={message}
        setMessage={setMessage}
        is24HoursBefore={is24before}
      />
    </>
  );
}
export default Notifications;
