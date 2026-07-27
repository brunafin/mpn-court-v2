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
let sessionExpiredHandling = false;

export const setAxiosErrorNotifier = (notifier: (error: IError) => void) => {
  notifyError = notifier;
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
  (error) => Promise.reject(error)
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

function userFacingErrorMessage(error: unknown): string {
  const status = (error as { response?: { status?: number } })?.response
    ?.status;
  if (status === 403) {
    return 'Você não tem permissão para esta ação.';
  }
  if (status === 404) {
    return 'Recurso não encontrado.';
  }
  if (status === 429) {
    return 'Muitas tentativas. Aguarde um momento e tente de novo.';
  }
  if (typeof status === 'number' && status >= 500) {
    return 'Serviço temporariamente indisponível. Tente novamente.';
  }
  // Não ecoar message/stack da API (pode vazar detalhes internos)
  return 'Não foi possível concluir a operação. Tente novamente.';
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status as number | undefined;
    const data = error?.response?.data as
      | {
          code?: string;
          message?: string | { code?: string; message?: string };
        }
      | undefined;
    const messageText =
      typeof data?.message === 'string'
        ? data.message
        : String(data?.message?.message ?? '');
    const isCpfRequired =
      data?.code === 'CPF_REQUIRED' ||
      (typeof data?.message === 'object' &&
        data?.message?.code === 'CPF_REQUIRED') ||
      (error?.response?.status === 422 && /CPF/i.test(messageText));
    const silent = Boolean(error?.config?.silentError);

    // 401: login trata na tela; demais rotas → um único redirect, sem toast
    if (status === 401) {
      if (!isAuthEndpoint(error)) {
        handleSessionExpired();
      }
      return Promise.reject(error);
    }

    if (notifyError && !isCpfRequired && !silent) {
      notifyError({ message: userFacingErrorMessage(error), type: 'error' });
    }
    return Promise.reject(error);
  }
);

export default api;
