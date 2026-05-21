// frontend/src/services/api.ts
import axios from "axios";
import { useAuthStore } from "@/store/authStore";
import { config } from "@/config/env";

const api = axios.create({
  baseURL: config.backendUrl + "/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((req) => {
  let token = useAuthStore.getState().token;

  if (!token) {
    const stored = localStorage.getItem("auth-storage");
    if (stored) {
      const parsed = JSON.parse(stored);
      token = parsed?.state?.token;
    }
  }

  if (token) {
    req.headers["Authorization"] = `Bearer ${token}`;
  }

  return req;
});

// Handle 401 responses (expired or invalid token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear expired token and redirect to login
      const authStore = useAuthStore.getState();
      authStore.logout();

      // Force redirect to login
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default api;
