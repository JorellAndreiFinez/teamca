import { useEffect, useState } from 'react';
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

function tryRestoreAuthFromStorage() {
  try {
    const persisted = window.localStorage.getItem('auth-storage');
    if (!persisted) return false;

    const parsed = JSON.parse(persisted) as {
      state?: { token?: string | null; user?: unknown | null };
    };

    const token = parsed?.state?.token;
    const user = parsed?.state?.user;

    if (!token || !user) {
      return false;
    }

    useAuthStore.setState({
      token,
      user: user as never,
      isAuthenticated: true,
    });
    return true;
  } catch {
    return false;
  }
}

export default function RouteGuard({
  mode,
  allowedGlobalRoles,
  allowedDepartmentRoles,
}: RouteGuardProps) {
  const { token, user } = useAuthStore((state) => ({
    token: state.token,
    user: state.user,
  }));
  const isAuthenticated = Boolean(token && user);

  // wait to finish hydrating the auth store
  const [hydrated, setHydrated] = useState(useAuthStore.persist.hasHydrated());

  useEffect(() => {
    if (hydrated) return;
    return useAuthStore.persist.onFinishHydration(() => setHydrated(true));
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;

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
      if (tryRestoreAuthFromStorage()) {
        return;
      }
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
  }, [hydrated, allowedDepartmentRoles, allowedGlobalRoles, isAuthenticated, mode, user]);

  return null;
}