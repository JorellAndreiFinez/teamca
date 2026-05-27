import api from "./api";
import { ActivityLogsResponse } from "../types/activityLog";

const ENDPOINT = "/activity";

const toSafeISOString = (dateStr?: string): string | undefined => {
  if (!dateStr) return undefined;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? undefined : date.toISOString();
};

type ActivityLogParams = {
  limit: number;
  skip: number;
  startDate?: string;
  endDate?: string;
};

export const activityLogService = {
  // fetch logs w/ filter
  getLogs: async (
    limit: number = 20,
    skip: number = 0,
    startDate?: string,
    endDate?: string,
  ): Promise<ActivityLogsResponse> => {
    const params: ActivityLogParams = { limit, skip };

    const safeStart = toSafeISOString(startDate);
    const safeEnd = toSafeISOString(endDate);
    if (safeStart) params.startDate = safeStart;
    if (safeEnd) params.endDate = safeEnd;

    const response = await api.get<ActivityLogsResponse>(ENDPOINT, {
      params,
      headers: { "Content-Type": "application/json" },
    });

    return response.data;
  },

  // export activity logs to csv
  exportToCSV: async (startDate?: string, endDate?: string): Promise<Blob> => {
    const response = await api.post(
      `${ENDPOINT}/export`,
      {
        startDate: toSafeISOString(startDate),
        endDate: toSafeISOString(endDate),
      },
      {
        responseType: "blob",
        headers: { "Content-Type": "application/json" },
      },
    );

    return response.data as Blob;
  },

  // download csv file
  downloadCSV: (blob: Blob, filename: string = "activity-logs.csv") => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },
};
