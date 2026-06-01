import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { canAccessRoute } from '../../lib/roleRoutes';
import UnauthorizedPage from './UnauthorizedPage';

type RouteGuardProps = {
  /**
   * The path this guard protects. Defaults to `window.location.pathname`
   * so it works without any prop when placed directly inside a page component.
   */
  path?: string;
  /**
   * Content to render when the user is authorised.
   */
  children: React.ReactNode;
  /**
   * When true, unauthenticated visitors are redirected to /login instead of
   * seeing the Unauthorized page. Defaults to true.
   */
  redirectUnauthenticated?: boolean;
};

/**
 * RouteGuard — drop this around any page component (or at the top of a page)
 * to enforce role-based access.
 *
 * Usage inside a page:
 *   export default function ReportsPage() {
 *     return (
 *       <RouteGuard>
 *         <ActualReportsContent />
 *       </RouteGuard>
 *     );
 *   }
 *
 * Usage in a router/layout:
 *   <RouteGuard path="/reports/dtr">
 *     <DtrReportsPage />
 *   </RouteGuard>
 */
export default function RouteGuard({
  path,
  children,
  redirectUnauthenticated = true,
}: RouteGuardProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const user = useAuthStore((state) => state.user);

  const resolvedPath = React.useMemo(
    () => path ?? (typeof window !== 'undefined' ? window.location.pathname : ''),
    [path],
  );

  // Wait for Zustand to rehydrate from localStorage before making any access
  // decision — avoids a flash of the Unauthorized page on hard refresh.
  if (!isHydrated) {
    return null;
  }

  // Unauthenticated → redirect to login (or show 403 if caller prefers)
  if (!isAuthenticated || !user) {
    if (redirectUnauthenticated) {
      if (typeof window !== 'undefined') {
        window.location.replace('/login');
      }
      return null;
    }

    return <UnauthorizedPage path={resolvedPath} />;
  }

  // Authenticated but insufficient role → 403 UI
  if (!canAccessRoute(user, resolvedPath)) {
    return <UnauthorizedPage path={resolvedPath} />;
  }

  return <>{children}</>;
}