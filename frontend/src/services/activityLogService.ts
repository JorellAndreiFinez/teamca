import api from "./api";
import { ActivityLogsResponse } from "../types/activityLog";

const ENDPOINT = "/activity";

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

    if (startDate) params.startDate = new Date(startDate).toISOString();
    if (endDate) params.endDate = new Date(endDate).toISOString();

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
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
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
