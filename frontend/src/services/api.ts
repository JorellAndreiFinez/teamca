import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { config } from '../config/env';

const api = axios.create({
  baseURL: config.backendUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// request interceptor to add token
api.interceptors.request.use(
<<<<<<< HEAD
  (requestConfig: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const persisted = window.localStorage.getItem('auth-storage');

      if (persisted) {
        try {
          const parsed = JSON.parse(persisted) as { state?: { token?: string | null } };
          const token = parsed?.state?.token;

          if (token) {
            requestConfig.headers.Authorization = `Bearer ${token}`;
          }
        } catch {
          // ignore persistent payloads that can't be parsed
        }
      }
    }

    return requestConfig;
=======
  (reqConfig) => {
    try {
      const stored = localStorage.getItem('auth-storage');
      if (stored) {
        const parsed = JSON.parse(stored);
        const token = parsed?.state?.token;
        if (token) {
          reqConfig.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch {
      // ignore parse errors
    }
    return reqConfig;
>>>>>>> f0d231d (feat: implement dashboard with role-based views, sidebar, DTR/tasks/profile pages, and backend mock API)
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// response interceptor to handle errors
api.interceptors.response.use(
<<<<<<< HEAD
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
=======
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
    }
>>>>>>> f0d231d (feat: implement dashboard with role-based views, sidebar, DTR/tasks/profile pages, and backend mock API)
    return Promise.reject(error);
  }
);

export default api;