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

export default api;
