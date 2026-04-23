import api from "./api";
import type { InternProfile } from "../types/user";

export interface InternProfilePayload {
  user_id: string;
  school_university: string;
  required_hours: number;
  rendered_hours_total?: number;
  expected_end_date: string;
  actual_end_date?: string | null;
}

export const internProfileService = {
  getInternProfileByUserId: async (
    userId: string,
  ): Promise<InternProfile | null> => {
    return api
      .get<InternProfile>(`/intern-profiles/user/${userId}`)
      .then((response) => response.data)
      .catch((err: any) => {
        // 404 handling
        const status = err?.response?.status || (err as any).status;
        if (status === 404 || status === 304) {
          return null;
        }
        console.debug("[internProfileService] Could not load profile:", {
          status,
          userId,
        });
        return null;
      });
  },

  createInternProfile: async (
    payload: InternProfilePayload,
  ): Promise<InternProfile> => {
    const { data } = await api.post<InternProfile>("/intern-profiles", payload);
    return data;
  },

  updateInternProfile: async (
    userId: string,
    payload: Partial<InternProfilePayload>,
  ): Promise<InternProfile> => {
    const { data } = await api.put<InternProfile>(
      `/intern-profiles/user/${userId}`,
      payload,
    );
    return data;
  },
};
