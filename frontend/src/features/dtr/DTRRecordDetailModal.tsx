import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import DTRHoursBar from "../../components/dtrHoursBar";
import type { DailyTimeRecord, ClockEntry, IBreak } from "../../types/dtr";
import { formatTime as formatTimeBase } from "../../utils/dateUtils";
import {
  formatHours,
  formatMinutesAsHours,
  getAttendanceBadgeClass,
  getAttendanceBadgeLabel,
  getApprovalBadgeClass,
  getApprovalBadgeLabel,
  getBreakTypeBadgeClass,
  getBreakTypeLabel,
} from "../../utils/dtrUtils";

// formatDate — modal-specific: includes weekday ("Wednesday, April 25, 2026")
function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// formatTime — normalises string | Date before delegating to dateUtils
function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatTimeBase(d);
}

// formatTimestamp — "May 20, 2026, 12:00 PM" used only in the footer
function formatTimestamp(date: Date | string | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}


function StatChip({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "blue" | "emerald" | "orange" | "rose" | "default";
}) {
  const accentClass = {
    blue: "bg-blue-50 border-blue-200/70 text-blue-900",
    emerald: "bg-emerald-50 border-emerald-200/70 text-emerald-900",
    orange: "bg-orange-50 border-orange-200/70 text-orange-900",
    rose: "bg-rose-50 border-rose-200/70 text-rose-900",
    default: "bg-slate-50 border-slate-200/70 text-slate-800",
  }[accent ?? "default"];

  return (
    <div
      className={`flex flex-col gap-0.5 rounded-xl border px-4 py-3 ${accentClass}`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-60">
        {label}
      </p>
      <p className="text-lg font-bold tabular-nums">{value}</p>
    </div>
  );
}

function BreakTable({ breaks }: { breaks: IBreak[] }) {
  const completed = breaks.filter((b) => b.breakStart && b.breakEnd);

  if (completed.length === 0) {
    return (
      <p className="text-[12px] italic text-slate-400">No breaks recorded</p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/80">
      <table className="w-full text-xs">
        <thead className="border-b border-slate-200 bg-slate-50">
          <tr>
            <th className="px-3 py-2 text-left font-semibold uppercase tracking-[0.15em] text-[10px] text-slate-500">
              #
            </th>
            <th className="px-3 py-2 text-left font-semibold uppercase tracking-[0.15em] text-[10px] text-slate-500">
              Type
            </th>
            <th className="px-3 py-2 text-left font-semibold uppercase tracking-[0.15em] text-[10px] text-slate-500">
              Start
            </th>
            <th className="px-3 py-2 text-left font-semibold uppercase tracking-[0.15em] text-[10px] text-slate-500">
              End
            </th>
            <th className="px-3 py-2 text-left font-semibold uppercase tracking-[0.15em] text-[10px] text-slate-500">
              Duration
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {completed.map((br, idx) => {
            const startMs = new Date(br.breakStart).getTime();
            const endMs = br.breakEnd ? new Date(br.breakEnd).getTime() : 0;
            const durationMin =
              br.duration != null
                ? br.duration
                : Math.round((endMs - startMs) / 60000);

            const durationLabel =
              durationMin >= 60
                ? `${Math.floor(durationMin / 60)}h ${durationMin % 60}m`
                : `${durationMin}m`;

            return (
              <tr key={idx} className="bg-white hover:bg-slate-50/70">
                <td className="px-3 py-2 font-medium text-slate-500">
                  {idx + 1}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getBreakTypeBadgeClass(br.type)}`}
                  >
                    {getBreakTypeLabel(br.type)}
                  </span>
                </td>
                <td className="px-3 py-2 tabular-nums text-slate-700">
                  {formatTime(br.breakStart)}
                </td>
                <td className="px-3 py-2 tabular-nums text-slate-700">
                  {br.breakEnd ? formatTime(br.breakEnd) : "—"}
                </td>
                <td className="px-3 py-2 font-semibold tabular-nums text-slate-800">
                  {durationLabel}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ClockSessionCard({
  clock,
  index,
}: {
  clock: ClockEntry;
  index: number;
}) {
  const [showBreaks, setShowBreaks] = React.useState(false);

  const hasTimeOut = Boolean(clock.timeOut);
  const hasBreaks = (clock.breaks?.length ?? 0) > 0;

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm">
      {/* Session Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
            Session {index + 1}
          </span>
          {clock.status && (
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${getAttendanceBadgeClass(clock.status)}`}
            >
              {getAttendanceBadgeLabel(clock.status)}
            </span>
          )}
          {!hasTimeOut && (
            <span className="inline-flex items-center rounded-full border border-blue-200/70 bg-blue-50 px-2.5 py-0.5 text-[10px] font-semibold text-blue-700">
              Still Active
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-500">
          {clock.totalHours != null && clock.totalHours > 0 && (
            <span className="tabular-nums text-slate-700">
              {formatHours(clock.totalHours)} worked
            </span>
          )}
          {clock.overtimeHours != null && clock.overtimeHours > 0 && (
            <span className="tabular-nums text-orange-600">
              +{formatHours(clock.overtimeHours)} OT
            </span>
          )}
        </div>
      </div>

      {/* Time In / Out */}
      <div className="grid grid-cols-2 gap-4 px-4 py-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Time In
          </p>
          <p className="mt-1 font-semibold tabular-nums text-slate-800">
            {formatTime(clock.timeIn)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Time Out
          </p>
          <p className="mt-1 font-semibold tabular-nums text-slate-800">
            {hasTimeOut ? formatTime(clock.timeOut!) : "—"}
          </p>
        </div>
      </div>

      {/* Hours Bar */}
      {hasTimeOut && (
        <div className="px-4 pb-3">
          <DTRHoursBar
            timeIn={clock.timeIn}
            timeOut={clock.timeOut!}
            breaks={clock.breaks ?? []}
            className="w-full"
          />
        </div>
      )}

      {/* Remarks */}
      {clock.remarks ? (
        <div className="border-t border-slate-100 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Remarks
          </p>
          <p className="mt-1 text-sm leading-relaxed text-slate-700">
            {clock.remarks}
          </p>
        </div>
      ) : (
        <div className="border-t border-slate-100 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Remarks
          </p>
          <p className="mt-1 text-sm italic text-slate-400">
            No remarks provided
          </p>
        </div>
      )}

      {/* Break Details Toggle */}
      <div className="border-t border-slate-100 px-4 py-3">
        <button
          type="button"
          onClick={() => setShowBreaks((v) => !v)}
          className="flex w-full items-center justify-between text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 transition hover:text-slate-800"
        >
          <span>
            Break Details
            {hasBreaks && (
              <span className="ml-2 inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-100 text-[9px] font-bold text-amber-700">
                {clock.breaks!.filter((b) => b.breakEnd).length}
              </span>
            )}
          </span>
          <svg
            className={`h-3.5 w-3.5 transition-transform ${showBreaks ? "rotate-180" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showBreaks && (
          <div className="mt-3">
            <BreakTable breaks={clock.breaks ?? []} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── main component ───

type DTRRecordDetailModalProps = {
  record: DailyTimeRecord | null;
  open: boolean;
  onClose: () => void;
};

export default function DTRRecordDetailModal({
  record,
  open,
  onClose,
}: DTRRecordDetailModalProps) {
  if (!record) return null;

  // Aggregate totals across all sessions (fallback to per-clock if top-level missing)
  const totalHours =
    record.totalHours ??
    record.clocks.reduce((sum, c) => sum + (c.totalHours ?? 0), 0);

  const totalOvertimeHours = record.clocks.reduce(
    (sum, c) => sum + (c.overtimeHours ?? 0),
    0,
  );

  const undertimeHours = record.undertimeHours ?? 0;

  // totalBreakTime stored in minutes on the document
  const totalBreakMinutes = record.totalBreakTime ?? 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex max-h-[90vh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        {/* ── Header ── */}
        <DialogHeader className="border-b border-slate-200 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <DialogTitle className="text-lg font-bold text-slate-900">
                {formatDate(record.date)}
              </DialogTitle>

              <div className="flex flex-wrap items-center gap-2">
                {/* Approval status */}
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getApprovalBadgeClass(record.status)}`}
                >
                  {getApprovalBadgeLabel(record.status)}
                </span>

                {/* Attendance status */}
                {record.attendanceStatus && (
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getAttendanceBadgeClass(record.attendanceStatus)}`}
                  >
                    {getAttendanceBadgeLabel(record.attendanceStatus)}
                  </span>
                )}

                {/* Session count */}
                <span className="inline-flex items-center rounded-full border border-slate-200/70 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {record.clocks.length}{" "}
                  {record.clocks.length === 1 ? "Session" : "Sessions"}
                </span>
              </div>
            </div>

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200/80 text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
              aria-label="Close"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </DialogHeader>

        {/* ── Scrollable Body ── */}
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-6 px-6 py-5">
            {/* ── Summary Chips ── */}
            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Day Summary
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatChip
                  label="Total Hours"
                  value={formatHours(totalHours)}
                  accent="blue"
                />
                <StatChip
                  label="Overtime"
                  value={formatHours(totalOvertimeHours)}
                  accent={totalOvertimeHours > 0 ? "orange" : "default"}
                />
                <StatChip
                  label="Undertime"
                  value={formatHours(undertimeHours)}
                  accent={undertimeHours > 0 ? "rose" : "default"}
                />
                <StatChip
                  label="Break Time"
                  value={formatMinutesAsHours(totalBreakMinutes)}
                  accent="default"
                />
              </div>
            </div>

            {/* ── Clock Sessions ── */}
            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Clock Sessions
              </p>

              {record.clocks.length === 0 ? (
                <div className="rounded-xl border border-slate-200/80 bg-slate-50 px-4 py-8 text-center">
                  <p className="text-sm text-slate-400">No sessions recorded</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {record.clocks.map((clock, idx) => (
                    <ClockSessionCard key={idx} clock={clock} index={idx} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
            <span>Created {formatTimestamp(record.createdAt)}</span>
            {record.updatedAt && record.updatedAt !== record.createdAt && (
              <span>Updated {formatTimestamp(record.updatedAt)}</span>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
