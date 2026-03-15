import type { NextFunction, Request, Response } from 'express';

type GlobalRole = 'Superadmin' | 'Admin' | 'Standard_User';
type DepartmentRole = 'Head' | 'Supervisor' | 'Intern';

type AuthUser = Express.AuthUser;

export const isSameUser = (requestUser: AuthUser, targetUserId: string): boolean =>
  String(requestUser.user_id) === targetUserId;

export const hasDepartmentRoleIn = (
  requestUser: AuthUser,
  allowedRoles: DepartmentRole[]
): boolean => {
  return requestUser.departments.some((department) =>
    allowedRoles.includes(department.department_role)
  );
};

export const hasSharedDepartment = (
  requestUser: AuthUser,
  targetDepartments: Array<{ department_id: unknown }>
): boolean => {
  const requesterDepartmentIds = new Set(
    requestUser.departments.map((department) => String(department.department_id))
  );

  return targetDepartments.some((department) =>
    requesterDepartmentIds.has(String(department.department_id))
  );
};

export const requireGlobalRole = (...allowedRoles: GlobalRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.global_role)) {
      return res.status(403).json({ message: 'Insufficient global role permissions.' });
    }

    return next();
  };
};

export const requireDepartmentRole = (...allowedRoles: DepartmentRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const hasRole = req.user.departments.some((department) =>
      allowedRoles.includes(department.department_role)
    );

    if (!hasRole) {
      return res.status(403).json({ message: 'Insufficient department role permissions.' });
    }

    return next();
  };
};

export const requireAnyRole = (
  globalRoles: GlobalRole[] = [],
  departmentRoles: DepartmentRole[] = []
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const hasGlobalRole = globalRoles.length > 0 && globalRoles.includes(req.user.global_role);
    const hasDepartmentRole =
      departmentRoles.length > 0 &&
      req.user.departments.some((department) => departmentRoles.includes(department.department_role));

    if (!hasGlobalRole && !hasDepartmentRole) {
      return res.status(403).json({ message: 'Insufficient role permissions.' });
    }

    return next();
  };
};

export default {
  requireGlobalRole,
  requireDepartmentRole,
  requireAnyRole,
  isSameUser,
  hasDepartmentRoleIn,
  hasSharedDepartment,
};