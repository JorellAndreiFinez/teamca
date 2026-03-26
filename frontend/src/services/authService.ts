// frontend/src/services/authService.ts
import api from "./api";

interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
    global_role: string;
    department_role?: string;
    is_active: boolean;
    departments?: string[];
    createdAt: string;
    updatedAt: string;
  };
}

export interface CheckEmailResponse {
  exists: boolean;
  needsSetup: boolean;
}

export const authService = {
  login: async ({ email, password }: LoginPayload): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>("/auth/login", {
      email,
      password,
    });
    return response.data;
  },

  checkEmail: async (email: string): Promise<CheckEmailResponse> => {
    const response = await api.post<CheckEmailResponse>("/auth/check-email", {
      email,
    });
    return response.data;
  },
};
