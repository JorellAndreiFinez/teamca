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
  return !!requestUser.department_role && allowedRoles.includes(requestUser.department_role);
};

export const hasSharedDepartment = (
  requestUser: AuthUser,
  targetDepartmentId: unknown
): boolean => {
  if (!requestUser.department_id || !targetDepartmentId) {
    return false;
  }

  return String(requestUser.department_id) === String(targetDepartmentId);
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

    const hasRole =
      !!req.user.department_role &&
      allowedRoles.includes(req.user.department_role);

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
      !!req.user.department_role &&
      departmentRoles.includes(req.user.department_role);

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