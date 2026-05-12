import api from "./api";
import { User, UserProfile } from "../types/user";

export type UserProfileResponse = UserProfile;

// safe API error shape
type ApiError = {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
};

// proper payload types (no any)
export type CreateUserPayload = Record<string, unknown>;
export type ActivateWhitelistPayload = Record<string, unknown>;

export const userService = {
  getAllUsers: async (): Promise<User[]> => {
    try {
      const { data } = await api.get<User[]>("/users");
      return data;
    } catch {
      return [];
    }
  },

  createUser: async (payload: CreateUserPayload): Promise<User> => {
    const { data } = await api.post<User>("/users", payload);
    return data;
  },

  updateUser: async (userId: string, payload: Partial<User>): Promise<User> => {
    const { data } = await api.put<User>(`/users/${userId}`, payload);
    return data;
  },

  deleteUser: async (userId: string): Promise<void> => {
    try {
      await api.delete(`/users/${userId}`);
    } catch (err: unknown) {
      const e = err as ApiError;

      const message =
        e?.response?.data?.message || e?.message || "Failed to delete user";

      throw new Error(message, { cause: err });
    }
  },

  getProfile: async (userId: string): Promise<UserProfileResponse> => {
    const { data } = await api.get<UserProfileResponse>(`/users/${userId}`);
    return data;
  },

  createWhitelistedUser: async (email: string): Promise<User> => {
    const { data } = await api.post<User>("/users/whitelist", { email });
    return data;
  },

  activateWhitelistedUser: async (
    userId: string,
    payload: ActivateWhitelistPayload,
  ): Promise<User> => {
    const { data } = await api.post<User>(
      `/users/${userId}/activate-whitelist`,
      payload,
    );
    return data;
  },
};
