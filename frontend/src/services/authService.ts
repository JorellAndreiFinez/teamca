import api from './api';

export interface FirstTimeSetupData {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  department_id: number;
  school_university: string;
  required_hours: number;
}

export const authService = {
  // Check if email exists and needs first-time setup
  checkEmail: async (email: string) => {
    const response = await api.post('/auth/check-email', { email });
    return response.data; // { exists: boolean, needsSetup: boolean }
  },

  // login if yes
  login: async (credentials: { email: string; password: string }) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  
  // setup acc if no
  completeSetup: async (setupData: FirstTimeSetupData) => {
    const response = await api.post('/auth/complete-setup', setupData);
    return response.data;
  },
  
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
};