import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { format, isValid, parseISO } from "date-fns";
import { useLoading } from "../../hooks/useLoading";
import { MdOutlineArrowBackIos, MdOutlineCheck, MdOutlinePostAdd } from "react-icons/md";
import NewReminderModal from "../../components/NewNote";
import { checkIsRead, createNote, INote, notesByDate } from "../../api/notes";
import { useNotification } from "../../contexts/NotificationContext";
import DateStrip from "../Reservation/DateStrip";
import CalendarButton from "../Reservation/CalendarButton";
import {
  getAccessToken,
  getAccessTokenPayload,
} from "../../utils/authCookie";
import { buttonClassName } from "../../components/Button";
import { useErrors } from "../../contexts/ErrorsContext";
import EmptyState from "../../components/EmptyState";
import { PageTitle } from "../../components/PageTitle";
import { useCompanyCapabilities } from "../../contexts/CompanyBrandingContext";

function parseIncomingDate(value: unknown): Date {
  if (value instanceof Date && isValid(value)) {
    return new Date(value.setHours(0, 0, 0, 0));
  }
  if (typeof value === "string" && value.trim()) {
    const iso = value.includes("T") ? value : `${value}T00:00:00`;
    const parsed = parseISO(iso);
    if (isValid(parsed)) {
      return new Date(parsed.setHours(0, 0, 0, 0));
    }
  }
  return new Date(new Date().setHours(0, 0, 0, 0));
}

function DayReminders() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshUnreadCount } = useNotification();
  const { notifyError } = useErrors();
  const { loading, withLoading } = useLoading();
  const caps = useCompanyCapabilities();
  const canMutate = caps.canMutate;
  const [companyPublicId, setCompanyPublicId] = useState<string>("");
  const [showNewReminderModal, setShowNewReminderModal] = useState(false);
  const [date, setDate] = useState<Date>(() =>
    parseIncomingDate(location.state?.date)
  );
  const [notifications, setNotifications] = useState<INote[]>([]);
  const [message, setMessage] = useState<string>("");
  const [creatingNote, setCreatingNote] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);

  useEffect(() => {
    if (!getAccessToken()) {
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    const payload = getAccessTokenPayload<{ companyPublicId?: string }>();
    setCompanyPublicId(payload?.companyPublicId || "");
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!companyPublicId) return;
    const dateInput = format(date, "yyyy-MM-dd");
    await withLoading(async () => {
      try {
        const response = await notesByDate(companyPublicId, dateInput);
        setNotifications(response);
        if (date.toDateString() === new Date().toDateString()) {
          await refreshUnreadCount();
        }
      } catch (error) {
        console.error("Erro ao buscar lembretes da empresa:", error);
      }
    });
  }, [companyPublicId, date, refreshUnreadCount, withLoading]);

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- evita loop com withLoading instável
  }, [companyPublicId, date]);

  const handleCheckIsRead = async (id: string) => {
    if (markingId) return;
    setMarkingId(id);
    try {
      await checkIsRead(id);
      setNotifications((prev) =>
        prev.filter((note) => note.id !== parseInt(id, 10))
      );
      await refreshUnreadCount();
    } catch (error) {
      console.error("Erro ao marcar lembrete como lido:", error);
    } finally {
      setMarkingId(null);
    }
  };

  const handleSubmit = async (
    event?: React.FormEvent
  ): Promise<void> => {
    event?.preventDefault?.();
    if (!message.trim()) {
      notifyError({
        message: "Uma mensagem é necessária para criar um lembrete.",
        type: "error",
      });
      return;
    }
    if (creatingNote) return;
    setCreatingNote(true);
    try {
      await createNote({
        companyPublicId,
        date: format(date, "yyyy-MM-dd"),
        message,
      });
      setShowNewReminderModal(false);
      setMessage("");
      await fetchNotifications();
    } finally {
      setCreatingNote(false);
    }
  };

  const createBtnClass = buttonClassName({
    variant: "primary",
    size: "md",
    className: "justify-center",
  });

  const showListLoading = loading && notifications.length === 0;
  const dateKey = format(date, "yyyy-MM-dd");

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-master text-text-light">
      <header className="sticky top-0 z-10 bg-master px-4 py-3 lg:px-6">
        <div className="mx-auto flex w-full max-w-lg items-center gap-3 lg:max-w-5xl">
          <button
            type="button"
            onClick={() =>
              navigate("/reservas", {
                state: { date: dateKey },
              })
            }
            aria-label="Voltar para reservas"
            className="mpn-tap flex size-11 items-center justify-center rounded-xl text-text-light transition hover:bg-text-light/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
          >
            <MdOutlineArrowBackIos size={20} aria-hidden />
          </button>
          <PageTitle>Lembretes</PageTitle>
        </div>
      </header>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="shrink-0 bg-master-light px-3 pb-3 pt-2 lg:px-6">
          <div className="mx-auto w-full lg:max-w-5xl">
            <div className="lg:mb-0 lg:flex lg:items-center lg:gap-4">
              <div className="mb-2 lg:mb-0 lg:shrink-0">
                <CalendarButton selectedDate={date} setSelectedDate={setDate} />
              </div>
              <div className="mb-3 min-w-0 flex-1 lg:mb-0">
                <DateStrip selectedDate={date} setSelectedDate={setDate} />
              </div>
              {canMutate ? (
                <button
                  type="button"
                  onClick={() => setShowNewReminderModal(true)}
                  className={`${createBtnClass} lg:w-auto lg:min-w-[12rem] lg:shrink-0`}
                >
                  <MdOutlinePostAdd size={22} className="shrink-0" aria-hidden />
                  Criar lembrete
                </button>
              ) : null}
            </div>
            {!canMutate && caps.ready ? (
              <p className="mt-2 text-sm text-text-light/65">
                Conta em somente leitura — não é possível criar ou marcar
                lembretes.
              </p>
            ) : null}
          </div>
        </div>

        {showListLoading ? (
          <ul
            className="mx-auto flex w-full max-w-lg flex-1 animate-pulse flex-col gap-3 overflow-y-auto px-4 pb-6 pt-5 lg:max-w-5xl lg:px-6"
            aria-label="Carregando lembretes"
          >
            {Array.from({ length: 3 }).map((_, index) => (
              <li
                key={index}
                className="rounded-2xl bg-master-light/70 px-4 py-5"
              >
                <span className="mb-3 block h-4 w-24 rounded bg-text-light/10" />
                <span className="block h-5 w-full rounded bg-text-light/10" />
              </li>
            ))}
          </ul>
        ) : notifications.length > 0 ? (
          <ul className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-3 overflow-y-auto px-4 pb-6 pt-5 lg:max-w-5xl lg:grid lg:grid-cols-2 lg:content-start lg:px-6">
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className={`rounded-2xl bg-master-light p-4 transition-opacity ${
                  markingId === notification.id.toString() ? "opacity-60" : ""
                }`}
              >
                {notification.from && (
                  <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-text-light/55">
                    {notification.from}
                  </p>
                )}
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 flex-1 text-lg leading-7 text-text-light">
                    {notification.message}
                  </p>
                  <button
                    type="button"
                    aria-label="Marcar lembrete como lido"
                    disabled={
                      !canMutate || markingId === notification.id.toString()
                    }
                    onClick={() =>
                      handleCheckIsRead(notification.id.toString())
                    }
                    className="flex min-h-12 shrink-0 items-center gap-1.5 rounded-xl bg-master px-3 text-base font-semibold text-accent-green transition hover:bg-accent-green/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-green disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <MdOutlineCheck size={22} aria-hidden />
                    {markingId === notification.id.toString()
                      ? "…"
                      : "Lido"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="Nenhum lembrete neste dia"
            description={
              canMutate
                ? "Use Criar lembrete acima ou escolha outra data."
                : "Escolha outra data ou regularize a conta para criar lembretes."
            }
            className="pb-16"
          />
        )}
      </section>

      <NewReminderModal
        isOpen={showNewReminderModal}
        onClose={() => {
          if (!creatingNote) setShowNewReminderModal(false);
        }}
        handleSubmit={handleSubmit}
        isSubmitting={creatingNote}
        date={date.toLocaleString("pt-BR", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })}
        message={message}
        setMessage={setMessage}
      />
    </div>
  );
}

export default DayReminders;
