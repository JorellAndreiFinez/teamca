// frontend/src/services/userService.ts
import api from "./api";
import { User } from "../types/user";

export const userService = {
  getAllUsers: async (): Promise<User[]> => {
    try {
      const { data } = await api.get<User[]>("/users");
      return data;
    } catch (err) {
      console.error("Failed to fetch users:", err);
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
    } catch (err) {
      console.error(`[deleteUser] Failed to delete user ${userId}:`, err);
      throw err;
    }
  },
};
