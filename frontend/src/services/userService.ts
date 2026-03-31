// frontend/src/services/userService.ts
import api from "./api";
import { User, UserProfile } from "../types/user";

export type UserProfileResponse = UserProfile;

export const userService = {
  getAllUsers: async (): Promise<User[]> => {
    try {
      const { data } = await api.get<User[]>("/users");
      return data;
    } catch {
      return [];
    }
  },

  createUser: async (payload: any): Promise<User> => {
    try {
      const { data } = await api.post<User>("/users", payload);
      console.log("[createUser] success:", data);
      return data;
    } catch (err) {
      console.error("[createUser] error:", err);
      throw err;
    }
  },

  updateUser: async (userId: string, payload: Partial<User>): Promise<User> => {
    try {
      const { data } = await api.put<User>(`/users/${userId}`, payload);
      console.log("[updateUser] success:", data);
      return data;
    } catch (err) {
      console.error("[updateUser] error:", err);
      throw err;
    }
  },

  // DELETE USER
  deleteUser: async (userId: string): Promise<void> => {
    try {
      await api.delete(`/users/${userId}`);
      console.log(`[deleteUser] User ${userId} deleted successfully`);
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || "Failed to delete user";
      console.error(`[deleteUser] Failed to delete user ${userId}:`, message);
      const error = new Error(message);
      throw error;
    }
  },

  getProfile: async (userId: string): Promise<UserProfileResponse> => {
    const { data } = await api.get<UserProfileResponse>(`/users/${userId}`);
    return data;
  },

  whitelistEmail: async (email: string): Promise<void> => {
    await api.post("/users/whitelisted", { email });
  },
};

