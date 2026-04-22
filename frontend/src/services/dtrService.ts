// frontend/src/services/dtrService.ts

import api from "./api";
import type { DailyTimeRecord } from "../types/dtr";

interface DTRResponse {
  success: boolean;
  data: DailyTimeRecord;
}

interface DTRListResponse {
  success: boolean;
  data: DailyTimeRecord[];
}

export const dtrService = {
  clockIn: async (): Promise<DailyTimeRecord> => {
    const res = await api.post<DTRResponse>("/dtr/time-in");
    return res.data.data;
  },

  clockOut: async (remarks: string): Promise<DailyTimeRecord> => {
    const res = await api.post<DTRResponse>("/dtr/time-out", { remarks });
    return res.data.data;
  },

  getDTRRecords: async (): Promise<DailyTimeRecord[]> => {
    const res = await api.get<DTRListResponse>("/dtr/me");
    return res.data.data;
  },
};
