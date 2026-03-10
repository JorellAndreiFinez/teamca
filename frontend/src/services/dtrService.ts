import api from './api';
import type { DailyTimeRecord } from '../types/dtr';

export const dtrService = {
  clockIn: async () => {
    const response = await api.post('/dtr/clock-in');
    return response.data;
  },
  
  clockOut: async () => {
    const response = await api.post('/dtr/clock-out');
    return response.data;
  },
  
  getDTRRecords: async (userId: string) => {
    const response = await api.get(`/dtr/${userId}`);
    return response.data;
  },
};