// utils/dtrUtils.ts
// Shared DTR formatting and badge helpers used across DTR-related components.

// ─── Hour / Duration Formatters ───

/**
 * Converts a decimal hours value to a human-readable "Xh Ym" string.
 * e.g. 1.75 → "1h 45m"
 */
export function formatHours(hours: number | undefined): string {
  if (!hours || !Number.isFinite(hours) || hours <= 0) return "0h 0m";
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/**
 * Converts a total-minutes value to a human-readable "Xh Ym" string.
 * e.g. 90 → "1h 30m"
 */
export function formatMinutesAsHours(minutes: number | undefined): string {
  if (!minutes || !Number.isFinite(minutes) || minutes <= 0) return "0h 0m";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ─── Attendance Status Badges ───

/**
 * Returns Tailwind class string for an attendance status badge.
 * Covers: present | late | very_late | absent
 */
export function getAttendanceBadgeClass(status: string | undefined): string {
  switch (status) {
    case "present":
      return "border-emerald-200/70 bg-emerald-50 text-emerald-700";
    case "late":
      return "border-amber-200/70 bg-amber-50 text-amber-700";
    case "very_late":
      return "border-orange-200/70 bg-orange-50 text-orange-700";
    case "absent":
      return "border-rose-200/70 bg-rose-50 text-rose-700";
    default:
      return "border-slate-200/70 bg-slate-50 text-slate-600";
  }
}

/**
 * Returns a human-readable label for an attendance status value.
 */
export function getAttendanceBadgeLabel(status: string | undefined): string {
  switch (status) {
    case "present":
      return "Present";
    case "late":
      return "Late";
    case "very_late":
      return "Very Late";
    case "absent":
      return "Absent";
    default:
      return status ?? "Unknown";
  }
}

// ─── Approval Status Badges ───

/**
 * Returns Tailwind class string for a DTR approval status badge.
 * Covers: approved | rejected | pending (default)
 */
export function getApprovalBadgeClass(status: string | undefined): string {
  switch (status) {
    case "approved":
      return "border-emerald-200/70 bg-emerald-50 text-emerald-700";
    case "rejected":
      return "border-rose-200/70 bg-rose-50 text-rose-700";
    default:
      return "border-amber-200/70 bg-amber-50 text-amber-700";
  }
}

/**
 * Returns a human-readable label for a DTR approval status value.
 */
export function getApprovalBadgeLabel(status: string | undefined): string {
  switch (status) {
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    default:
      return "Pending Review";
  }
}

// ─── Break Type Badges ───

/**
 * Returns Tailwind class string for a break type badge.
 * Covers: lunch | rest | other
 */
export function getBreakTypeBadgeClass(type: string): string {
  switch (type) {
    case "lunch":
      return "border-amber-200/70 bg-amber-50 text-amber-700";
    case "rest":
      return "border-blue-200/70 bg-blue-50 text-blue-700";
    default:
      return "border-slate-200/70 bg-slate-50 text-slate-600";
  }
}

/**
 * Returns a human-readable label for a break type value.
 */
export function getBreakTypeLabel(type: string): string {
  switch (type) {
    case "lunch":
      return "Lunch";
    case "rest":
      return "Rest";
    default:
      return "Other";
  }
}
