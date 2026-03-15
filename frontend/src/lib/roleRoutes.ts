import type { DepartmentRole, GlobalRole, User } from '../types/user';

type RoleAccessOptions = {
  allowedGlobalRoles?: GlobalRole[];
  allowedDepartmentRoles?: DepartmentRole[];
};

export function getDashboardRouteForUser(user: User | null): string {
  if (!user) {
    return '/login';
  }

  if (user.global_role === 'Superadmin') {
    return '/superadmin';
  }

  if (user.global_role === 'Admin') {
    return '/tasks';
  }

  if (user.department_role === 'Head' || user.department_role === 'Supervisor') {
    return '/tasks';
  }

  return '/dtr';
}

export function hasRoleAccess(user: User | null, options?: RoleAccessOptions): boolean {
  if (!user) {
    return false;
  }

  const hasAllowedGlobalRole = options?.allowedGlobalRoles?.length
    ? options.allowedGlobalRoles.includes(user.global_role)
    : true;

  const hasAllowedDepartmentRole = options?.allowedDepartmentRoles?.length
    ? options.allowedDepartmentRoles.includes(user.department_role)
    : true;

  return hasAllowedGlobalRole && hasAllowedDepartmentRole;
}