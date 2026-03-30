// frontend\src\store\authStore.ts

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  token: string | null;
  user: any | null;
  isAuthenticated: boolean;

  isHydrated: boolean;
  setHydrated: (state: boolean) => void;

  login: (token: string, user: any) => void;
  logout: () => void;

  canManageUsers: () => boolean;
  canWhitelistEmails: () => boolean;
  canManageOwnDepartment: () => boolean;
  canViewAllDepartments: () => boolean;
  isIntern: () => boolean;
  getUserFullName: () => string;
  isSuperadmin: () => boolean;
  isAdmin: () => boolean;
}

export const useAuthStore = create(
  persist<AuthState>(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      isHydrated: false,
      setHydrated: (state: boolean) => set({ isHydrated: state }),

      login: (token, user) =>
        set({
          token,
          user,
          isAuthenticated: true,
        }),

      logout: () =>
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        }),

      canManageUsers: () => {
        const user = get().user;
        return (
          user?.global_role === "Admin" || user?.global_role === "Superadmin"
        );
      },

      canWhitelistEmails: () => {
        const user = get().user;
        return user?.global_role === "Superadmin";
      },

      canManageOwnDepartment: () => {
        const user = get().user;
        const departmentRole = user?.departments?.[0]?.department_role;
        return departmentRole === "Head" || departmentRole === "Supervisor";
      },

      canViewAllDepartments: () => {
        const user = get().user;
        return user?.global_role === "Admin" || user?.global_role === "Superadmin";
      },

      isIntern: () => {
        const user = get().user;
        return user?.departments?.[0]?.department_role === "Intern";
      },

      getUserFullName: () => {
        const user = get().user;
        return user
          ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim()
          : "";
      },

      isSuperadmin: () => {
        const user = get().user;
        return user?.global_role === "Superadmin";
      },
      isAdmin: () => {
        const user = get().user;
        return user?.global_role === "Admin";
      },
    }),

    {
      name: "auth-storage",
      storage: {
        getItem: (key) => {
          const value = localStorage.getItem(key);
          return value ? JSON.parse(value) : null;
        },
        setItem: (key, value) => {
          localStorage.setItem(key, JSON.stringify(value));
        },
        removeItem: (key) => {
          localStorage.removeItem(key);
        },
      },

      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
