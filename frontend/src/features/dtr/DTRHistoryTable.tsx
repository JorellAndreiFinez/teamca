// frontend/src/features/dtr/DTRHistoryTable.tsx

import { useState } from 'react';
import Button from '../../components/ui/Button';
import DTRHoursBar from '../../components/dtrHoursBar';
import type { DTRHistoryItem, DailyTimeRecord, LeaveRecord } from '../../types/dtr';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';

// ── type guards ───────────────────────────────────────────────────────────────

function isLeaveRecord(item: DTRHistoryItem): item is LeaveRecord {
  return (item as LeaveRecord).recordType === 'leave';
}

function isDTRRecord(item: DTRHistoryItem): item is DailyTimeRecord {
  return !isLeaveRecord(item);
}

// ── helpers ───────────────────────────────────────────────────────────────────

const LEAVE_TYPE_LABELS: Record<string, string> = {
  vacation: 'Vacation Leave',
  sick: 'Sick Leave',
  emergency: 'Emergency Leave',
  unpaid: 'Unpaid Leave',
  other: 'Leave',
};

const formatTime = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const formatDate = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
};

const formatDateTime = (date: Date | string) =>
  new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'present':   return 'border-emerald-200/70 bg-emerald-50 text-emerald-700';
    case 'late':      return 'border-amber-200/70 bg-amber-50 text-amber-700';
    case 'very_late': return 'border-orange-200/70 bg-orange-50 text-orange-700';
    case 'absent':    return 'border-rose-200/70 bg-rose-50 text-rose-700';
    default:          return 'border-slate-200/70 bg-slate-50 text-slate-700';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'present':   return 'Present';
    case 'late':      return 'Late';
    case 'very_late': return 'Very Late';
    case 'absent':    return 'Absent';
    default:          return status;
  }
};

// ── props ─────────────────────────────────────────────────────────────────────

type DTRHistoryTableProps = {
  records: DTRHistoryItem[];
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  isLoading?: boolean;
  onPageChange?: (page: number) => void;
  onRowClick?: (record: DailyTimeRecord) => void;
  onEditClick?: (record: DailyTimeRecord) => void;
  onFilterChange?: (filters: any) => void;
  onSortChange?: (sortBy: string) => void;
  onDownload?: () => void;
  onRemind?: () => void;
};

// ── component ─────────────────────────────────────────────────────────────────

export default function DTRHistoryTable({
  records,
  page,
  limit,
  total,
  total_pages,
  isLoading,
  onPageChange,
  onRowClick,
  onEditClick,
  onFilterChange,
  onSortChange,
  onDownload,
  onRemind,
}: DTRHistoryTableProps) {
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'hours_desc' | 'hours_asc'>('date_desc');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [pendingStatusFilter, setPendingStatusFilter] = useState(statusFilter);
  const [pendingSortBy, setPendingSortBy] = useState(sortBy);

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort as any);
    onSortChange?.(newSort);
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    onFilterChange?.({ status });
  };

  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="space-y-4">

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-end gap-2 px-4 pt-4">
        <button
          type="button"
          onClick={() => { setPendingStatusFilter(statusFilter); setShowFilterModal(true); }}
          className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium shadow-sm shadow-slate-950/5 transition ${
            statusFilter !== 'all'
              ? 'border-blue-200/70 bg-blue-50 text-blue-700'
              : 'border-slate-200/80 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
          }`}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h18M6 12h12M10 19h4" />
          </svg>
          Filter
        </button>

        <button
          type="button"
          onClick={() => { setPendingSortBy(sortBy); setShowSortModal(true); }}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm shadow-slate-950/5 transition hover:border-slate-300 hover:bg-slate-50"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M7 12h10M10 17h4" />
          </svg>
          Sort
        </button>

        {onDownload && (
          <button type="button" onClick={onDownload}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm shadow-slate-950/5 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            Download
          </button>
        )}

        {onRemind && (
          <button type="button" onClick={onRemind}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm shadow-slate-950/5 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v1a3 3 0 006 0v-1" />
            </svg>
            Remind
          </button>
        )}
      </div>

      {/* Filter Modal — includes Leave option */}
      <Dialog open={showFilterModal} onOpenChange={setShowFilterModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Filter Records</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            {[
              { value: 'all',       label: 'All Statuses' },
              { value: 'present',   label: 'Present' },
              { value: 'late',      label: 'Late' },
              { value: 'very_late', label: 'Very Late' },
              { value: 'absent',    label: 'Absent' },
              { value: 'leave',     label: 'Approved Leave' },
            ].map((option) => (
              <label key={option.value}
                className="flex items-center gap-3 rounded-xl border border-slate-200/80 px-3 py-2 text-sm text-slate-700"
              >
                <input type="radio" name="statusFilter" value={option.value}
                  checked={pendingStatusFilter === option.value}
                  onChange={(e) => setPendingStatusFilter(e.target.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <Button type="button" className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200"
              onClick={() => setShowFilterModal(false)}>Cancel</Button>
            <Button type="button" className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => { handleStatusFilterChange(pendingStatusFilter); setShowFilterModal(false); }}>
              Apply
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sort Modal */}
      <Dialog open={showSortModal} onOpenChange={setShowSortModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Sort Records</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            {[
              { value: 'date_desc',  label: 'Date (Newest)' },
              { value: 'date_asc',   label: 'Date (Oldest)' },
              { value: 'hours_desc', label: 'Hours (Highest)' },
              { value: 'hours_asc',  label: 'Hours (Lowest)' },
            ].map((option) => (
              <label key={option.value}
                className="flex items-center gap-3 rounded-xl border border-slate-200/80 px-3 py-2 text-sm text-slate-700"
              >
                <input type="radio" name="sortBy" value={option.value}
                  checked={pendingSortBy === option.value}
                  onChange={(e) => setPendingSortBy(e.target.value as any)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <Button type="button" className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200"
              onClick={() => setShowSortModal(false)}>Cancel</Button>
            <Button type="button" className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => { handleSortChange(pendingSortBy); setShowSortModal(false); }}>
              Apply
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-100/70">
              <tr>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Date</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Time In</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Time Out</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Status</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Hours & Breaks</th>
                <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">Loading...</td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">No records found</td>
                </tr>
              ) : (
                records.map((item) => {
                  // ── LEAVE ROW ───────────────────────────────────────────────
                  if (isLeaveRecord(item)) {
                    const leaveLabel = LEAVE_TYPE_LABELS[item.leaveType] ?? 'Approved Leave';
                    const lastApproval = [...item.reviewHistory].reverse().find(h => h.action === 'approved');

                    return (
                      <tr key={String(item._id)} className="bg-teal-50/40">
                        {/* Date — shows range if multi-day */}
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {formatDate(item.startDate)}
                          {item.duration > 1 && (
                            <span className="text-slate-400 text-xs ml-1">
                              → {formatDate(item.endDate)}
                            </span>
                          )}
                        </td>

                        {/* Time In — N/A for leave */}
                        <td className="px-4 py-3 text-slate-400 text-xs">On Leave</td>

                        {/* Time Out — N/A for leave */}
                        <td className="px-4 py-3 text-slate-400 text-xs">—</td>

                        {/* Status badge — Approved Leave */}
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            {leaveLabel}
                          </span>
                        </td>

                        {/* Reviewer info */}
                        <td className="px-4 py-3">
                          <div className="text-xs text-slate-600">
                            <p className="font-medium">{item.duration} day{item.duration !== 1 ? 's' : ''}</p>
                            {lastApproval ? (
                              <p className="text-slate-400 mt-0.5">
                                Approved by <span className="text-slate-600 font-medium">{lastApproval.actor_name}</span>
                                {' · '}{formatDateTime(lastApproval.timestamp)}
                              </p>
                            ) : item.reviewedAt ? (
                              <p className="text-slate-400 mt-0.5">
                                Approved {formatDateTime(item.reviewedAt)}
                              </p>
                            ) : null}
                          </div>
                        </td>

                        {/* No actions for leave rows */}
                        <td className="px-4 py-3 text-center text-slate-300 text-xs">—</td>
                      </tr>
                    );
                  }

                  // ── DTR ROW ─────────────────────────────────────────────────
                  const record = item as DailyTimeRecord;
                  const primaryClock = record.clocks?.[0];

                  return (
                    <tr
                      key={String(record._id)}
                      onClick={() => onRowClick?.(record)}
                      className={`cursor-pointer transition-colors hover:bg-slate-50 ${
                        record.coveredByLeave ? 'bg-teal-50/20' : ''
                      }`}
                    >
                      {/* Date */}
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {formatDate(record.date)}
                        {/* Badge if this DTR day is inside a leave period */}
                        {record.coveredByLeave && (
                          <span className="ml-2 inline-flex items-center rounded-full border border-teal-200 bg-teal-50 px-1.5 py-0.5 text-[10px] font-medium text-teal-600">
                            Leave
                          </span>
                        )}
                      </td>

                      {/* Time In */}
                      <td className="px-4 py-3 text-slate-700 tabular-nums">
                        {primaryClock?.timeIn ? formatTime(primaryClock.timeIn) : '—'}
                      </td>

                      {/* Time Out */}
                      <td className="px-4 py-3 text-slate-700 tabular-nums">
                        {primaryClock?.timeOut ? formatTime(primaryClock.timeOut) : '—'}
                      </td>

                      {/* Attendance status badge */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusBadgeClass(record.attendanceStatus || 'present')}`}>
                          {getStatusLabel(record.attendanceStatus || 'present')}
                        </span>
                      </td>

                      {/* Hours & Breaks bar */}
                      <td className="px-4 py-3">
                        {primaryClock?.timeIn && primaryClock?.timeOut && (
                          <DTRHoursBar
                            timeIn={primaryClock.timeIn}
                            timeOut={primaryClock.timeOut}
                            breaks={primaryClock.breaks || []}
                            className="w-52"
                          />
                        )}
                      </td>

                      {/* Edit action */}
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); onEditClick?.(record); }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200/80 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                          title="Edit"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
        <p className="text-xs text-slate-500">Showing {start}–{end} of {total}</p>
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" variant="outline"
            disabled={page <= 1} onClick={() => onPageChange?.(page - 1)}>
            Previous
          </Button>
          <span className="text-xs text-slate-600">Page {page} / {total_pages}</span>
          <Button type="button" size="sm" variant="outline"
            disabled={page >= total_pages} onClick={() => onPageChange?.(page + 1)}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}