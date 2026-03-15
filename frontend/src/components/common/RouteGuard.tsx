import { useEffect } from 'react';
import type { DepartmentRole, GlobalRole } from '../../types/user';
import { useAuthStore } from '../../store/authStore';
import { getDashboardRouteForUser, hasRoleAccess } from '../../lib/roleRoutes';

type GuardMode = 'root' | 'auth' | 'protected';

interface RouteGuardProps {
  mode: GuardMode;
  allowedGlobalRoles?: GlobalRole[];
  allowedDepartmentRoles?: DepartmentRole[];
}

function redirectTo(path: string) {
  if (window.location.pathname === path) {
    return;
  }

  window.location.replace(path);
}

export default function RouteGuard({
  mode,
  allowedGlobalRoles,
  allowedDepartmentRoles,
}: RouteGuardProps) {
  const { isAuthenticated, user } = useAuthStore((state) => ({
    isAuthenticated: state.isAuthenticated,
    user: state.user,
  }));

  useEffect(() => {
    if (mode === 'root') {
      redirectTo(isAuthenticated ? getDashboardRouteForUser(user) : '/login');
      return;
    }

    if (mode === 'auth') {
      if (isAuthenticated) {
        redirectTo(getDashboardRouteForUser(user));
      }
      return;
    }

    if (!isAuthenticated) {
      redirectTo('/login');
      return;
    }

    const canAccess = hasRoleAccess(user, {
      allowedGlobalRoles,
      allowedDepartmentRoles,
    });

    if (!canAccess) {
      redirectTo(getDashboardRouteForUser(user));
    }
  }, [allowedDepartmentRoles, allowedGlobalRoles, isAuthenticated, mode, user]);

  return null;
}