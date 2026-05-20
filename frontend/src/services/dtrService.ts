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

interface PaginatedDTRResponse {
  success: boolean;
  data: {
    items: DailyTimeRecord[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

interface TimeAdjustmentRequest {
  _id: string;
  userId: string;
  dtrDate: string;
  adjustmentType: "time_in" | "time_out" | "manual_entry" | "leave";
  requestedValue: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

interface ReminderSettings {
  _id: string;
  userId: string;
  enableClockInReminder: boolean;
  clockInReminderTime: string;
  enableClockOutReminder: boolean;
  clockOutReminderMinutes: number;
  notificationMethod: "push" | "email" | "both";
  timezone: string;
}

export const dtrService = {
  // Basic DTR operations
  clockIn: async (): Promise<DailyTimeRecord> => {
    const res = await api.post<DTRResponse>("/dtr/time-in");
    return res.data.data;
  },

  clockOut: async (remarks: string): Promise<DailyTimeRecord> => {
    const res = await api.post<DTRResponse>("/dtr/time-out", { remarks });
    return res.data.data;
  },

  startBreak: async (breakType: string = "rest"): Promise<DailyTimeRecord> => {
    const res = await api.post<DTRResponse>("/dtr/break-start", { breakType });
    return res.data.data;
  },

  endBreak: async (): Promise<DailyTimeRecord> => {
    const res = await api.post<DTRResponse>("/dtr/break-end");
    return res.data.data;
  },

  getDTRRecords: async (): Promise<DailyTimeRecord[]> => {
    const res = await api.get<DTRListResponse>("/dtr/me");
    return res.data.data;
  },

  getHistory: async (
    page: number = 1,
    limit: number = 10,
    filters?: {
      date_from?: string;
      date_to?: string;
      status?: string;
      sort_by?: string;
    },
  ) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(filters?.date_from && { date_from: filters.date_from }),
      ...(filters?.date_to && { date_to: filters.date_to }),
      ...(filters?.status && filters.status !== "all" && { status: filters.status }),
      ...(filters?.sort_by && { sort_by: filters.sort_by }),
    });

    const res = await api.get<PaginatedDTRResponse>(`/dtr/history?${params.toString()}`);
    return res.data.data;
  },

  // Time Adjustment Requests
  submitAdjustmentRequest: async (
    dtrDate: string,
    adjustmentType: "time_in" | "time_out" | "manual_entry" | "leave",
    requestedValue: string,
    reason: string,
    originalValue?: string,
  ) => {
    const res = await api.post<{ success: boolean; data: TimeAdjustmentRequest }>(
      "/dtr/adjustment-request",
      {
        dtrDate,
        adjustmentType,
        requestedValue,
        reason,
        originalValue,
      },
    );
    return res.data.data;
  },

  getUserAdjustmentRequests: async (status?: string) => {
    const params = status ? `?status=${status}` : "";
    const res = await api.get<{ success: boolean; data: TimeAdjustmentRequest[] }>(
      `/dtr/adjustment-requests${params}`,
    );
    return res.data.data;
  },

  getPendingAdjustmentRequests: async () => {
    const res = await api.get<{ success: boolean; data: TimeAdjustmentRequest[] }>(
      "/dtr/adjustment-requests-pending",
    );
    return res.data.data;
  },

  getAdjustmentRequest: async (id: string) => {
    const res = await api.get<{ success: boolean; data: TimeAdjustmentRequest }>(
      `/dtr/adjustment-request/${id}`,
    );
    return res.data.data;
  },

  approveAdjustmentRequest: async (id: string, reviewNotes?: string) => {
    const res = await api.post<{ success: boolean; data: TimeAdjustmentRequest }>(
      `/dtr/adjustment-request/${id}/approve`,
      { reviewNotes },
    );
    return res.data.data;
  },

  rejectAdjustmentRequest: async (id: string, reviewNotes: string) => {
    const res = await api.post<{ success: boolean; data: TimeAdjustmentRequest }>(
      `/dtr/adjustment-request/${id}/reject`,
      { reviewNotes },
    );
    return res.data.data;
  },

  // Reminder Settings
  getReminderSettings: async (): Promise<ReminderSettings> => {
    const res = await api.get<{ success: boolean; data: ReminderSettings }>("/dtr/reminders");
    return res.data.data;
  },

  updateReminderSettings: async (settings: Partial<ReminderSettings>) => {
    const res = await api.put<{ success: boolean; data: ReminderSettings }>(
      "/dtr/reminders",
      settings,
    );
    return res.data.data;
  },

  resetReminderSettings: async () => {
    const res = await api.post<{ success: boolean; data: ReminderSettings }>(
      "/dtr/reminders/reset",
    );
    return res.data.data;
  },

  // Export
  exportDTR: async (
    startDate: string,
    endDate: string,
    format: "csv" | "json" | "xlsx" | "pdf" = "csv",
    type: "records" | "summary" | "detailed" = "records",
  ) => {
    const params = new URLSearchParams({
      startDate,
      endDate,
      format,
      type,
    });
    return api.get(`/dtr/export?${params.toString()}`, {
      responseType: format === "json" ? "json" : "blob",
    } as any);
  },

  previewExport: async (
    startDate: string,
    endDate: string,
    type: "records" | "summary" | "detailed" = "records",
  ) => {
    const params = new URLSearchParams({
      startDate,
      endDate,
      type,
    });
    const res = await api.get(`/dtr/export/preview?${params.toString()}`);
    return (res.data as any).data;
  },
};

