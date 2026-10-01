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
import { useErrors } from "../../contexts/ErrorsContext";
import EmptyState, {
  emptyStateActionClassName,
} from "../../components/EmptyState";
import { PageTitle } from "../../components/PageTitle";
import { useCompanyCapabilities } from "../../contexts/CompanyBrandingContext";
import {
  REMINDER_MESSAGE_MAX_LENGTH,
  sanitizeNoteText,
} from "../../utils/sanitizeNoteText";

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
  const { withLoading } = useLoading();
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
  const [loadError, setLoadError] = useState(false);
  const [loadedDateKey, setLoadedDateKey] = useState<string | null>(null);

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
    setLoadError(false);
    await withLoading(async () => {
      try {
        const response = await notesByDate(companyPublicId, dateInput);
        setNotifications(response);
        setLoadedDateKey(dateInput);
        setLoadError(false);
        if (date.toDateString() === new Date().toDateString()) {
          await refreshUnreadCount();
        }
      } catch (error) {
        setLoadError(true);
        setLoadedDateKey(dateInput);
        setNotifications([]);
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
    const safeMessage = sanitizeNoteText(message, REMINDER_MESSAGE_MAX_LENGTH);
    if (!safeMessage) {
      notifyError({
        message: "Uma mensagem é necessária para criar um lembrete.",
        type: "error",
      });
      return;
    }
    if (creatingNote) return;
    setMessage(safeMessage);
    setCreatingNote(true);
    try {
      await createNote({
        companyPublicId,
        date: format(date, "yyyy-MM-dd"),
        message: safeMessage,
      });
      setShowNewReminderModal(false);
      setMessage("");
      await fetchNotifications();
    } finally {
      setCreatingNote(false);
    }
  };

  const dateKey = format(date, "yyyy-MM-dd");
  const showListLoading = loadedDateKey !== dateKey && !loadError;

  return (
    <div className="mpn-page bg-master text-text-light">
      <header className="mpn-chrome-top z-10 shrink-0 bg-master px-3 pb-2 lg:px-8">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-2">
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
        <div className="sticky top-0 z-10 shrink-0 bg-master-light">
          <div className="mx-auto w-full lg:max-w-6xl lg:px-8">
            <DateStrip selectedDate={date} setSelectedDate={setDate} />
          </div>
        </div>
        <div className="shrink-0 bg-master px-3 pt-2 lg:px-8">
          <div className="mx-auto flex w-full items-center justify-between gap-2 lg:max-w-6xl">
            <CalendarButton selectedDate={date} setSelectedDate={setDate} />
            {canMutate ? (
              <button
                type="button"
                onClick={() => setShowNewReminderModal(true)}
                aria-label="Criar lembrete"
                className="mpn-tap flex size-11 shrink-0 items-center justify-center rounded-xl text-text-light transition hover:bg-text-light/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
              >
                <MdOutlinePostAdd size={22} aria-hidden />
              </button>
            ) : null}
          </div>
          {!canMutate && caps.ready ? (
            <p className="mx-auto mt-2 w-full text-base text-text-light/70 lg:max-w-6xl">
              Conta em somente leitura. Não é possível criar ou marcar
              lembretes.
            </p>
          ) : null}
        </div>

        {showListLoading ? (
          <ul
            className="mpn-page-scroll mpn-scroll-end mx-auto flex w-full max-w-6xl flex-col gap-1.5 px-3 pt-3 lg:px-8"
            aria-label="Carregando lembretes"
          >
            {Array.from({ length: 3 }).map((_, index) => (
              <li
                key={index}
                className="rounded-xl bg-master-light/70 px-4 py-5"
              >
                <span className="mb-3 block h-4 w-24 rounded bg-text-light/10" />
                <span className="block h-5 w-full rounded bg-text-light/10" />
              </li>
            ))}
          </ul>
        ) : loadError ? (
          <EmptyState
            title="Não foi possível carregar os lembretes."
            description="Tente de novo. Nada foi apagado."
            action={
              <button
                type="button"
                onClick={() => void fetchNotifications()}
                className={emptyStateActionClassName()}
              >
                Tentar de novo
              </button>
            }
            className="pb-16"
          />
        ) : notifications.length > 0 ? (
          <ul className="mpn-page-scroll mpn-scroll-end mx-auto flex w-full max-w-6xl flex-col gap-1.5 px-3 pt-3 lg:px-8">
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className={`flex min-h-14 items-center gap-3 rounded-xl bg-master-light px-3 py-2.5 transition-opacity ${
                  markingId === notification.id.toString() ? "opacity-60" : ""
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-base leading-6 text-text-light">
                    {notification.message}
                  </p>
                  {notification.from ? (
                    <p className="text-base text-text-light/55">
                      {notification.from}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  aria-label="Marcar lembrete como lido"
                  disabled={
                    !canMutate || markingId === notification.id.toString()
                  }
                  onClick={() =>
                    handleCheckIsRead(notification.id.toString())
                  }
                  className="mpn-tap flex size-10 shrink-0 items-center justify-center rounded-xl text-text-light/70 transition hover:bg-text-light/10 hover:text-text-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <MdOutlineCheck size={20} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="Nenhum lembrete neste dia"
            description={
              canMutate
                ? "Toque em criar, ao lado do mês, ou escolha outra data."
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
