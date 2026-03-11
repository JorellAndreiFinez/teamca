import api from './api';
import type { User, InternProfile } from '../types/user';

export interface UpsertUserPayload {
  first_name?: string;
  last_name?: string;
  email?: string;
  password?: string;
  global_role?: User['global_role'];
  is_active?: boolean;
  departments?: Array<{
    department_id: string | number;
    department_role: User['department_role'];
  }>;
}

export interface UpsertInternProfilePayload {
  school_university?: string;
  required_hours?: number;
  rendered_hours_total?: number;
  expected_end_date?: string;
  actual_end_date?: string | null;
}

export interface UserProfileResponse extends User {
  intern_profile?: InternProfile;
}

export const userService = {
  getProfile: async (userId: string): Promise<UserProfileResponse> => {
    const { data } = await api.get(`/users/${userId}`);
    return data;
  },
  
  getAllUsers: async (): Promise<User[]> => {
    const { data } = await api.get('/users');
    return data;
  },

  createUser: async (payload: UpsertUserPayload): Promise<UserProfileResponse> => {
    const { data } = await api.post('/users', payload);
    return data;
  },

  updateProfile: async (userId: string, payload: UpsertUserPayload): Promise<UserProfileResponse> => {
    const { data } = await api.put(`/users/${userId}`, payload);
    return data;
  },

  upsertInternProfile: async (
    userId: string,
    payload: UpsertInternProfilePayload
  ): Promise<UserProfileResponse> => {
    const { data } = await api.put(`/users/${userId}/intern-profile`, payload);
    return data;
  },
  
  // add new user w/ email (superadmin only)
  whitelistEmail: async (email: string): Promise<{ message: string; user: User }> => {
    const { data } = await api.post('/users/whitelist', { email });
    return data;
  },

  activateWhitelistedUser: async (
    userId: string,
    payload: UpsertUserPayload
  ): Promise<UserProfileResponse> => {
    const { data } = await api.put(`/users/${userId}/activate`, payload);
    return data;
  },
};