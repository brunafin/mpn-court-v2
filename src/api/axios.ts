import axios from 'axios';
import { IError } from '../contexts/ErrorsContext';
import { getAccessToken } from '../utils/authCookie';

let notifyError: ((error: IError) => void) | null = null;

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

function userFacingErrorMessage(error: unknown): string {
  const status = (error as { response?: { status?: number } })?.response
    ?.status;
  if (status === 401 || status === 403) {
    return 'Sessão inválida ou sem permissão. Faça login novamente.';
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
    const data = error?.response?.data as
      | { code?: string; message?: { code?: string } }
      | undefined;
    const isCpfRequired =
      data?.code === 'CPF_REQUIRED' ||
      data?.message?.code === 'CPF_REQUIRED';
    if (notifyError && !isCpfRequired) {
      notifyError({ message: userFacingErrorMessage(error), type: 'error' });
    }
    return Promise.reject(error);
  }
);

export default api;
