import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useLocation } from "react-router-dom";
import { counterNotes } from "../api/notes";
import { getAccessTokenPayload } from "../utils/authCookie";

interface NotificationContextProps {
  unreadCount: number;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(
  undefined
);

function getCompanyPublicIdFromCookie(): string {
  const payload = getAccessTokenPayload<{ companyPublicId?: string }>();
  return payload?.companyPublicId || "";
}

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
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    const companyPublicId = getCompanyPublicIdFromCookie();
    if (!companyPublicId) return;

    try {
      const count = await counterNotes(companyPublicId);
      setUnreadCount(normalizeCount(count));
    } catch (error) {
      console.error("Erro ao buscar lembretes não lidos:", error);
    }
  }, []);

  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  useEffect(() => {
    const onFocus = () => {
      refreshUnreadCount();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshUnreadCount]);

  return (
    <NotificationContext.Provider
      value={{ unreadCount, setUnreadCount, refreshUnreadCount }}
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
