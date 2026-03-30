// frontend/src/services/authService.ts
import api from "./api";
import type { DepartmentAssignment, GlobalRole } from "../types/user";

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
    global_role: GlobalRole;
    is_active: boolean;
    departments?: DepartmentAssignment[];
    createdAt: string;
    updatedAt: string;
  };
}

export interface CompleteSetupPayload {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  department_id?: string;
  school_university?: string;
  required_hours?: number;
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

  completeSetup: async (payload: CompleteSetupPayload): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>("/auth/complete-setup", payload);
    return response.data;
  },
};

