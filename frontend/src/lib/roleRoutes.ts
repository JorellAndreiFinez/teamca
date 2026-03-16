import type { DepartmentRole, GlobalRole, User } from '../types/user';

type RoleAccessOptions = {
  allowedGlobalRoles?: GlobalRole[];
  allowedDepartmentRoles?: DepartmentRole[];
};

export function getDashboardRouteForUser(user: User | null): string {
  if (!user) {
    return '/login';
  }

  return '/dashboard';
}

export function hasRoleAccess(user: User | null, options?: RoleAccessOptions): boolean {
  if (!user) {
    return false;
  }

  const globalRoles = options?.allowedGlobalRoles ?? [];
  const departmentRoles = options?.allowedDepartmentRoles ?? [];

  if (globalRoles.length === 0 && departmentRoles.length === 0) {
    return true;
  }

  const hasAllowedGlobalRole = globalRoles.includes(user.global_role);
  const hasAllowedDepartmentRole = departmentRoles.includes(user.department_role);

  return hasAllowedGlobalRole || hasAllowedDepartmentRole;
}