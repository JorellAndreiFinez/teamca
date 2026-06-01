import type { DepartmentRole, GlobalRole, User } from "../types/user";

// ─── primitive role-check types ───────────────────────────────────────────────

type RoleAccessOptions = {
  allowedGlobalRoles?: GlobalRole[];
  allowedDepartmentRoles?: DepartmentRole[];
};

// ─── per-route access configuration ──────────────────────────────────────────
//
// Each entry mirrors a frontend route path (supports prefix matching via
// the `prefix` flag). Access is the union of allowedGlobalRoles and
// allowedDepartmentRoles — a user satisfying either list is granted access.
// An empty options object means "any authenticated user".

export type RouteAccess = RoleAccessOptions & {
  /** Human-readable label used in the Unauthorized UI. */
  label: string;
  /**
   * When true, any path that *starts with* `path` is covered by this entry.
   * Useful for nested routes like /reports/dtr and /reports/tasks.
   */
  prefix?: boolean;
};

export const ROUTE_ACCESS_MAP: Record<string, RouteAccess> = {
  // ── available to all authenticated users ────────────────────────────────────
  "/dashboard": { label: "Dashboard" },
  "/dtr":       { label: "DTR" },
  "/leave":     { label: "Leave" },
  "/tasks":     { label: "Tasks" },
  "/profile":   { label: "Profile" },

  // ── managers: global Admin/Superadmin OR department Head/Supervisor ──────────
  // Mirrors backend: requireAnyRole(["Superadmin","Admin"], ["Head","Supervisor"])
  "/users": {
    label: "User Directory",
    allowedGlobalRoles: ["Superadmin", "Admin"],
    allowedDepartmentRoles: ["Head", "Supervisor"],
  },
  "/departments": {
    label: "Departments",
    allowedGlobalRoles: ["Superadmin", "Admin"],
    allowedDepartmentRoles: ["Head", "Supervisor"],
  },

  // ── superadmin-only ──────────────────────────────────────────────────────────
  // Mirrors backend: requireGlobalRole("Superadmin")
  "/reports": {
    label: "Reports",
    prefix: true,
    allowedGlobalRoles: ["Superadmin"],
  },
  "/activity-logs": {
    label: "Activity Logs",
    allowedGlobalRoles: ["Superadmin"],
  },
};

// ─── helpers ─────────────────────────────────────────────────────────────────

export function getDashboardRouteForUser(user: User | null): string {
  if (!user) {
    return "/login";
  }

  return "/dashboard";
}

/**
 * Returns true if `user` satisfies the given `RoleAccessOptions`.
 * An empty / undefined options object means "any authenticated user".
 */
export function hasRoleAccess(
  user: User | null,
  options?: RoleAccessOptions,
): boolean {
  if (!user) {
    return false;
  }

  const globalRoles = options?.allowedGlobalRoles ?? [];
  const departmentRoles = options?.allowedDepartmentRoles ?? [];

  // No restrictions → any authenticated user may access
  if (globalRoles.length === 0 && departmentRoles.length === 0) {
    return true;
  }

  const departmentRole = user.departments?.[0]?.department_role;
  const hasAllowedGlobalRole =
    !!user.global_role && globalRoles.includes(user.global_role);
  const hasAllowedDepartmentRole =
    !!departmentRole && departmentRoles.includes(departmentRole);

  return hasAllowedGlobalRole || hasAllowedDepartmentRole;
}

/**
 * Looks up the access config for a given path from ROUTE_ACCESS_MAP.
 * Checks exact matches first, then prefix matches.
 * Returns `null` for paths not present in the map (treated as public/unknown).
 */
export function getRouteAccess(path: string): RouteAccess | null {
  // 1. Exact match
  if (path in ROUTE_ACCESS_MAP) {
    return ROUTE_ACCESS_MAP[path];
  }

  // 2. Prefix match (longest prefix wins)
  let bestMatch: RouteAccess | null = null;
  let bestLength = 0;

  for (const [routePath, access] of Object.entries(ROUTE_ACCESS_MAP)) {
    if (
      access.prefix &&
      path.startsWith(routePath) &&
      routePath.length > bestLength
    ) {
      bestMatch = access;
      bestLength = routePath.length;
    }
  }

  return bestMatch;
}

/**
 * Returns true when a user is allowed to visit the given path.
 * Unauthenticated users are always denied.
 * Paths not in ROUTE_ACCESS_MAP are treated as open (returns true).
 */
export function canAccessRoute(user: User | null, path: string): boolean {
  if (!user) {
    return false;
  }

  const access = getRouteAccess(path);
  if (!access) {
    // Unknown route — not in our map, pass through
    return true;
  }

  return hasRoleAccess(user, access);
}

/**
 * Returns a human-readable description of who can access a route,
 * used in the Unauthorized page to explain the requirement.
 */
export function getRouteAccessDescription(path: string): string {
  const access = getRouteAccess(path);
  if (!access) {
    return "authenticated users";
  }

  const parts: string[] = [];

  if (access.allowedGlobalRoles && access.allowedGlobalRoles.length > 0) {
    const labels: Record<GlobalRole, string> = {
      Superadmin: "Super Admins",
      Admin: "Admins",
      Standard_User: "Standard Users",
    };
    parts.push(
      access.allowedGlobalRoles.map((r) => labels[r] ?? r).join(", "),
    );
  }

  if (
    access.allowedDepartmentRoles &&
    access.allowedDepartmentRoles.length > 0
  ) {
    const labels: Record<DepartmentRole, string> = {
      Head: "Department Heads",
      Supervisor: "Supervisors",
      Intern: "Interns",
    };
    parts.push(
      access.allowedDepartmentRoles.map((r) => labels[r] ?? r).join(", "),
    );
  }

  if (parts.length === 0) {
    return "all authenticated users";
  }

  return parts.join(" and ");
}