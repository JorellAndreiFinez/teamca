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
=======
  (reqConfig) => {
    try {
      const stored = localStorage.getItem('auth-storage');
      if (stored) {
        const parsed = JSON.parse(stored);
        const token = parsed?.state?.token;
        if (token) {
          reqConfig.headers.Authorization = `Bearer ${token}`;
>>>>>>> 75180937812242ebfb8c998aa2d5b47944bfdfa3
        }
      }
    } catch {
      // ignore parse errors
    }
<<<<<<< HEAD

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
=======
    return reqConfig;
>>>>>>> 75180937812242ebfb8c998aa2d5b47944bfdfa3
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// response interceptor to handle errors
api.interceptors.response.use(
<<<<<<< HEAD
<<<<<<< HEAD
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
=======
=======
>>>>>>> 75180937812242ebfb8c998aa2d5b47944bfdfa3
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
    }
<<<<<<< HEAD
>>>>>>> f0d231d (feat: implement dashboard with role-based views, sidebar, DTR/tasks/profile pages, and backend mock API)
=======
>>>>>>> 75180937812242ebfb8c998aa2d5b47944bfdfa3
    return Promise.reject(error);
  }
);

export default api;