import { useAuthStore } from '../../store/authStore';
import { getRouteAccess, getRouteAccessDescription } from '../../lib/roleRoutes';

type UnauthorizedPageProps = {
  /**
   * The path the user tried to reach. When omitted, falls back to
   * `window.location.pathname` so the component can be dropped anywhere.
   */
  path?: string;
};

function LockIcon() {
  return (
    <svg
      className="h-10 w-10"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  );
}

export default function UnauthorizedPage({ path }: UnauthorizedPageProps) {
  const user = useAuthStore((state) => state.user);
  const getUserFullName = useAuthStore((state) => state.getUserFullName);

  const resolvedPath =
    path ?? (typeof window !== 'undefined' ? window.location.pathname : '');

  const access = getRouteAccess(resolvedPath);
  const pageLabel = access?.label ?? 'this page';
  const requiredRoles = getRouteAccessDescription(resolvedPath);

  const globalRole = user?.global_role;
  const deptRole = user?.departments?.[0]?.department_role;

  const currentRoleLabel = (() => {
    if (!user) return null;
    if (globalRole === 'Superadmin') return 'Super Admin';
    if (globalRole === 'Admin') return 'Admin';
    if (deptRole) return deptRole;
    return globalRole ?? 'Unknown role';
  })();

  const fullName = user ? getUserFullName() : null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        {/* Icon + code */}
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-rose-100 text-rose-500">
            <LockIcon />
          </div>
          <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-rose-500">
            403 — Access Denied
          </span>
        </div>

        {/* Heading */}
        <h1 className="mb-2 text-center text-2xl font-semibold text-slate-900">
          You can&rsquo;t access {pageLabel}
        </h1>

        {/* Context */}
        <p className="mb-6 text-center text-sm leading-relaxed text-slate-500">
          {fullName ? (
            <>
              <span className="font-medium text-slate-700">{fullName}</span>
              {currentRoleLabel ? (
                <>
                  {' '}({currentRoleLabel})
                </>
              ) : null}
              {' '}doesn&rsquo;t have the permissions required to view this page.
            </>
          ) : (
            'Your account doesn\u2019t have the permissions required to view this page.'
          )}
        </p>

        {/* Required-role pill */}
        <div className="mb-8 rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-400">
            Required access
          </p>
          <p className="text-sm font-medium text-slate-700">{requiredRoles}</p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Go back
          </button>
          <a
            href="/dashboard"
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}