import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "../types/user";

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;

  setToken: (token: string) => void;
  setUser: (user: User) => void;
  login: (token: string, user: User) => void;
  logout: () => void;

  // check for global role
  isSuperadmin: () => boolean;
  isAdmin: () => boolean;
  isStandardUser: () => boolean;

  // check for dept role
  isDepartmentHead: () => boolean;
  isSupervisor: () => boolean;
  isIntern: () => boolean;

  // advanced permission checks
  canAccessUserDirectory: () => boolean;
  canManageUsers: () => boolean;
  canWhitelistEmails: () => boolean;
  canManageDepartments: () => boolean;
  canAssignRoles: () => boolean;
  canViewAllDepartments: () => boolean;
  canManageOwnDepartment: () => boolean;

  // util
  getUserFullName: () => string;
  getUserDepartmentId: () => number | null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      setToken: (token: string) => {
        set({ token });
      },

      setUser: (user: User) => {
        set({ user, isAuthenticated: !!user });
      },

      login: (token: string, user: User) => {
        set({
          token,
          user,
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        });
        localStorage.removeItem("auth-storage");
      },

      // check global role
      isSuperadmin: () => {
        const { user } = get();
        return user?.global_role === "Superadmin";
      },

      isAdmin: () => {
        const { user } = get();
        return user?.global_role === "Admin";
      },

      isStandardUser: () => {
        const { user } = get();
        return user?.global_role === "Standard_User";
      },

      // check dept role
      isDepartmentHead: () => {
        const { user } = get();
        return user?.department_role === "Head";
      },

      isSupervisor: () => {
        const { user } = get();
        return user?.department_role === "Supervisor";
      },

      isIntern: () => {
        const { user } = get();
        return user?.department_role === "Intern";
      },

      // advanced permission checks
      canAccessUserDirectory: () => {
        const { user } = get();
        if (!user) return false;

        if (user.global_role === "Superadmin" || user.global_role === "Admin") {
          return true;
        }

        return (
          user.department_role === "Head" ||
          user.department_role === "Supervisor"
        );
      },

      canManageUsers: () => {
        const { user } = get();
        if (!user) return false;

        return user.global_role === "Superadmin";
      },

      canWhitelistEmails: () => {
        const { user } = get();
        if (!user) return false;

        // allow only Superadmins to whitelist emails
        return user.global_role === "Superadmin";
      },

      canManageDepartments: () => {
        const { user } = get();
        if (!user) return false;

        // allow Superadmins and Admins to manage departments
        return (
          user.global_role === "Superadmin" || user.global_role === "Admin"
        );
      },

      canAssignRoles: () => {
        const { user } = get();
        if (!user) return false;

        return user.global_role === "Superadmin";
      },

      canViewAllDepartments: () => {
        const { user } = get();
        if (!user) return false;

        // allow Superadmins and Admins to view all departments
        return (
          user.global_role === "Superadmin" || user.global_role === "Admin"
        );
      },

      canManageOwnDepartment: () => {
        const { user } = get();
        if (!user) return false;

        // allow Department Heads and Supervisors to manage their own department
        return (
          user.department_role === "Head" ||
          user.department_role === "Supervisor"
        );
      },

      // util functions
      getUserFullName: () => {
        const { user } = get();
        if (!user) return "Guest";
        return `${user.first_name} ${user.last_name}`;
      },

      getUserDepartmentId: () => {
        const { user } = get();
        if (
          !user ||
          typeof user.department_id === "undefined" ||
          user.department_id === null
        ) {
          return null;
        }

        if (typeof user.department_id === "number") {
          return Number.isFinite(user.department_id)
            ? user.department_id
            : null;
        }

        const parsed = Number(user.department_id);
        return Number.isFinite(parsed) ? parsed : null;
      },
    }),
    {
      name: "auth-storage",
      // only persist token and user, not computed values
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.isAuthenticated = Boolean(state.token && state.user);
      },
    },
  ),
);
