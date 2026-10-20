import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useLocation } from "react-router-dom";
import { counterNotes } from "../api/notes";
import { useCompanyPublicId } from "../hooks/useCompanyPublicId";

interface NotificationContextProps {
  unreadCount: number;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
  refreshUnreadCount: () => Promise<void>;
  /** Dia em foco na agenda, para o aviso da foto abrir os lembretes desse dia. */
  reminderDate: Date | null;
  setReminderDate: React.Dispatch<React.SetStateAction<Date | null>>;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(
  undefined
);

function normalizeCount(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.floor(parsed);
}

function NotificationCounterSync({
  refreshUnreadCount,
}: {
  refreshUnreadCount: () => Promise<void>;
}) {
  const location = useLocation();

  useEffect(() => {
    refreshUnreadCount();
  }, [location.pathname, refreshUnreadCount]);

  return null;
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const companyPublicId = useCompanyPublicId();
  const [unreadCount, setUnreadCount] = useState(0);
  const [reminderDate, setReminderDate] = useState<Date | null>(null);
  const lastUnreadReadAt = useRef(0);

  const refreshUnreadCount = useCallback(async () => {
    if (!companyPublicId) return;

    try {
      const count = await counterNotes(companyPublicId);
      lastUnreadReadAt.current = Date.now();
      setUnreadCount(normalizeCount(count));
    } catch (error) {
      console.error("Erro ao buscar lembretes não lidos:", error);
    }
  }, [companyPublicId]);

  useEffect(() => {
    const onFocus = () => {
      if (Date.now() - lastUnreadReadAt.current < 30_000) return;
      void refreshUnreadCount();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshUnreadCount]);

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        setUnreadCount,
        refreshUnreadCount,
        reminderDate,
        setReminderDate,
      }}
    >
      <NotificationCounterSync refreshUnreadCount={refreshUnreadCount} />
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification deve ser usado dentro do NotificationProvider"
    );
  }
  return context;
};
