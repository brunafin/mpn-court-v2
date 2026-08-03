import axios from 'axios';
import { IError } from '../contexts/ErrorsContext';
import { getAccessToken, logoutAndRedirect } from '../utils/authCookie';

declare module 'axios' {
  export interface AxiosRequestConfig {
    /** Se true, o interceptor não mostra toast de erro. */
    silentError?: boolean;
  }
}

let notifyError: ((error: IError) => void) | null = null;
let onProductInactive: ((message: string) => void) | null = null;
let sessionExpiredHandling = false;

export const setAxiosErrorNotifier = (notifier: (error: IError) => void) => {
  notifyError = notifier;
};

export const setProductInactiveHandler = (
  handler: ((message: string) => void) | null,
) => {
  onProductInactive = handler;
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

function isAuthEndpoint(error: unknown): boolean {
  const url = (error as { config?: { url?: string } })?.config?.url ?? '';
  return url.includes('/auth/');
}

function handleSessionExpired() {
  if (sessionExpiredHandling) return;
  sessionExpiredHandling = true;
  void logoutAndRedirect();
}

type ApiErrorBody = {
  code?: string;
  message?: string | string[] | { code?: string; message?: string };
  error?: string;
};

function messageFromBody(
  data: ApiErrorBody | undefined,
): string | undefined {
  if (!data) return undefined;
  const raw = data.message;
  if (typeof raw === 'string' && raw.trim()) return raw.trim();
  if (Array.isArray(raw)) {
    const joined = raw.filter((m) => typeof m === 'string' && m.trim()).join(' ');
    return joined || undefined;
  }
  if (raw && typeof raw === 'object' && typeof raw.message === 'string') {
    return raw.message.trim() || undefined;
  }
  return undefined;
}

function parseApiError(error: unknown): {
  status?: number;
  code?: string;
  message?: string;
} {
  const status = (error as { response?: { status?: number } })?.response
    ?.status;
  const data = (error as { response?: { data?: ApiErrorBody } })?.response
    ?.data;

  const nested =
    data?.message && typeof data.message === 'object' && !Array.isArray(data.message)
      ? data.message
      : null;
  const code = data?.code || nested?.code;
  const message = messageFromBody(data);

  return { status, code, message };
}

/** Mensagens conhecidas da API são exibidas; demais 4xx/5xx ficam genéricas. */
export function userFacingErrorMessage(error: unknown): string {
  const { status, code, message } = parseApiError(error);

  if (code === 'PRODUCT_INACTIVE' || code === 'ACCOUNT_READ_ONLY') {
    return (
      message ||
      (code === 'ACCOUNT_READ_ONLY'
        ? 'Sua conta está em modo somente leitura. Regularize a pendência para editar a agenda.'
        : 'Seu teste grátis expirou. Contrate um plano para continuar usando a agenda.')
    );
  }

  if (status === 403) {
    return message || 'Você não tem permissão para esta ação.';
  }
  if (status === 404 || status === 409) {
    return message || (status === 409
      ? 'Não foi possível concluir por conflito com outro registro.'
      : 'Recurso não encontrado.');
  }
  if (status === 429) {
    return 'Muitas tentativas. Aguarde um momento e tente de novo.';
  }
  if (typeof status === 'number' && status >= 500) {
    return 'Serviço temporariamente indisponível. Tente novamente.';
  }
  if (message && typeof status === 'number' && status >= 400 && status < 500) {
    return message;
  }
  return 'Não foi possível concluir a operação. Tente novamente.';
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { status, code, message } = parseApiError(error);
    const messageText = message ?? '';
    const data = (error as { response?: { data?: ApiErrorBody } })?.response
      ?.data;
    const isCpfRequired =
      data?.code === 'CPF_REQUIRED' ||
      (typeof data?.message === 'object' &&
        !Array.isArray(data?.message) &&
        data?.message?.code === 'CPF_REQUIRED') ||
      (error?.response?.status === 422 && /CPF/i.test(messageText));
    const silent = Boolean(error?.config?.silentError);

    if (status === 401) {
      if (!isAuthEndpoint(error)) {
        handleSessionExpired();
      }
      return Promise.reject(error);
    }

    if (code === 'PRODUCT_INACTIVE' && !silent) {
      const msg = userFacingErrorMessage(error);
      if (onProductInactive) {
        onProductInactive(msg);
      } else if (notifyError) {
        notifyError({ message: msg, type: 'error' });
      }
      return Promise.reject(error);
    }

    if (notifyError && !isCpfRequired && !silent) {
      notifyError({ message: userFacingErrorMessage(error), type: 'error' });
    }
    return Promise.reject(error);
  },
);

export default api;
