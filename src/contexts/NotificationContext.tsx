// NotificationContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { counterNotes } from '../api/notes';
import { jwtDecode } from 'jwt-decode';

interface NotificationContextProps {
    unreadCount: number;
    setUnreadCount: (count: number) => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [companyPublicId, setCompanyPublicId] = useState<string>('');

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

    useEffect(() => {
        if (!companyPublicId) return;
        const fetchCount = async () => {
            try {
                const response = await counterNotes(companyPublicId);
                if (response) {
                    setUnreadCount(response);
                }
            } catch (error) {
                console.error('Erro ao buscar informações da empresa:', error);
            }
        };
        fetchCount();
    }, [companyPublicId]);

    return (
        <NotificationContext.Provider value={{ unreadCount, setUnreadCount }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification deve ser usado dentro do NotificationProvider');
    }
    return context;
};
