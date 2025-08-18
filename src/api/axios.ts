import axios from 'axios';
import Cookies from 'js-cookie';
import { IError } from '../contexts/ErrorsContext';

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
    const token = Cookies.get('access_token');
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (notifyError) {
      const message = error.response?.data?.message || 'Ocorreu um erro na requisição';
      notifyError({ message, type: 'error' });
    }
    return Promise.reject(error);
  }
);

export default api;
