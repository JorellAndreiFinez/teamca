import axios from 'axios';
import { config } from '../config/env';

const api = axios.create({
  baseURL: config.backendUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// request interceptor to add token
api.interceptors.request.use(
  (requestConfig: any) => {
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
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// response interceptor to handle errors
api.interceptors.response.use(
  (response: any) => response,
  (error: any) => {
    return Promise.reject(error);
  }
);

export default api;