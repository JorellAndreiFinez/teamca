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

  const departmentRole = user.departments?.[0]?.department_role;
  const hasAllowedGlobalRole = !!user.global_role && globalRoles.includes(user.global_role);
  const hasAllowedDepartmentRole = !!departmentRole && departmentRoles.includes(departmentRole);

  return hasAllowedGlobalRole || hasAllowedDepartmentRole;
}