import api from './api';
import type { DailyTimeRecord } from '../types/dtr';

export const dtrService = {
  clockIn: async (): Promise<DailyTimeRecord> => {
    const response = await api.post<DailyTimeRecord>('/dtr/clock-in');
    return (response as { data: DailyTimeRecord }).data;
  },
  
  clockOut: async (): Promise<DailyTimeRecord> => {
    const response = await api.post<DailyTimeRecord>('/dtr/clock-out');
    return (response as { data: DailyTimeRecord }).data;
  },
  
  getDTRRecords: async (userId: string): Promise<DailyTimeRecord[]> => {
    const response = await api.get<DailyTimeRecord[]>(`/dtr/${userId}`);
    return response.data;
  },
};