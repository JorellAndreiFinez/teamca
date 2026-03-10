import api from './api';
import type { User, InternProfile } from '../types/user';

export const userService = {
  getProfile: async (userId: string) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },
  
  updateProfile: async (userId: string, userData: any) => {
    const response = await api.put(`/users/${userId}`, userData);
    return response.data;
  },
  
  getAllUsers: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  // FOR SUPERADMIN: 
 
  // add new user email (no password)
  whitelistEmail: async (email: string) => {
    const response = await api.post('/users/whitelist', { email });
    return response.data;
  },

  // remove whitelisted email
  removeWhitelistedEmail: async (userId: string) => {
    const response = await api.delete(`/users/whitelist/${userId}`);
    return response.data;
  },
};