import api from './api';
import type { User } from '../types/user';

type AuthApiUser = User & {
  _id?: string;
  departments?: Array<{
    department_id?: number | string;
    department_role?: 'Head' | 'Supervisor' | 'Intern';
  }>;
};

export type AuthResponse = {
  token: string;
  user: AuthApiUser;
};

export type CheckEmailResponse = {
  exists: boolean;
  needsSetup: boolean;
};

export interface FirstTimeSetupData {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  department_id: string | number;
  school_university: string;
  required_hours: number;
}

export const authService = {
  // Check if email exists and needs first-time setup
  checkEmail: async (email: string): Promise<CheckEmailResponse> => {
    const response = await api.post<CheckEmailResponse>('/auth/check-email', { email });
    return response.data; // { exists: boolean, needsSetup: boolean }
  },

  // login if yes
  login: async (credentials: { email: string; password: string }): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },
  
  // setup acc if no
  completeSetup: async (setupData: FirstTimeSetupData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/complete-setup', setupData);
    return response.data;
  },
  
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
};