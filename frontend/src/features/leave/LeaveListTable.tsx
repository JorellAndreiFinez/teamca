import React from 'react';
import type { ILeave } from '../../types/leave';
import { ActivityListItemSkeleton } from '../../components/ui/Skeleton';

interface LeaveListTableProps {
  leaves: ILeave[];
  isLoading?: boolean;
  onCancel?: (leaveId: string) => Promise<void>;
}

const formatDate = (date: Date | string) =>
  new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const formatDateTime = (date: Date | string) =>
  new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

const STATUS_STYLES: Record<
  string,
  { badge: string; dot: string; label: string }
> = {
  approved:  { badge: 'bg-green-100 text-green-800 border-green-300',   dot: 'bg-green-500',  label: 'Approved'  },
  rejected:  { badge: 'bg-red-100 text-red-800 border-red-300',         dot: 'bg-red-500',    label: 'Rejected'  },
  cancelled: { badge: 'bg-slate-100 text-slate-600 border-slate-300',   dot: 'bg-slate-400',  label: 'Cancelled' },
  pending:   { badge: 'bg-yellow-100 text-yellow-800 border-yellow-300',dot: 'bg-yellow-400', label: 'Pending'   },
};

const LEAVE_TYPE_LABELS: Record<string, string> = {
  vacation:  'Vacation',
  sick:      'Sick',
  emergency: 'Emergency',
  unpaid:    'Unpaid',
  other:     'Other',
};

export default function LeaveListTable({ leaves, isLoading = false, onCancel }: LeaveListTableProps) {
  const handleCancel = async (leaveId: string) => {
    if (!onCancel) return;
    if (!window.confirm('Are you sure you want to cancel this leave request?')) return;
    try {
      await onCancel(leaveId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to cancel leave');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => <ActivityListItemSkeleton key={i} />)}
      </div>
    );
  }

  if (leaves.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-600">No leave requests found</p>
        <p className="text-xs text-slate-500 mt-1">Your leave history will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {leaves.map((leave) => {
        const st = STATUS_STYLES[leave.status] ?? STATUS_STYLES.pending;

        // Get the most recent approval or rejection entry from reviewHistory
        const reviewEntry = [...(leave.reviewHistory ?? [])]
          .reverse()
          .find((h) => h.action === 'approved' || h.action === 'rejected');

        return (
          <div
            key={leave._id}
            className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
          >
            {/* Top row: dates + status badge */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-slate-900">
                    {formatDate(leave.startDate)} – {formatDate(leave.endDate)}
                  </p>
                  {leave.leaveType && leave.leaveType !== 'other' && (
                    <span className="text-xs text-slate-400">
                      {LEAVE_TYPE_LABELS[leave.leaveType] ?? leave.leaveType}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600 mt-0.5">
                  {leave.duration} day{leave.duration !== 1 ? 's' : ''} · {leave.reason}
                </p>
              </div>

              {/* Status badge + cancel */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${st.badge}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                  {st.label}
                </span>

                {leave.status === 'pending' && onCancel && (
                  <button
                    onClick={() => handleCancel(leave._id)}
                    className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {/* Reviewer info — shown for approved and rejected */}
            {reviewEntry && (
              <div className={`mt-3 rounded-md px-3 py-2 text-xs ${
                reviewEntry.action === 'approved'
                  ? 'bg-green-50 text-green-800'
                  : 'bg-red-50 text-red-800'
              }`}>
                <span className="font-medium capitalize">{reviewEntry.action}</span>
                {' '}by{' '}
                <span className="font-semibold">{reviewEntry.actor_name}</span>
                {' · '}
                <span>{formatDateTime(reviewEntry.timestamp)}</span>
                {reviewEntry.reason && (
                  <p className="mt-0.5 italic opacity-80">Reason: "{reviewEntry.reason}"</p>
                )}
              </div>
            )}

            {/* Submitted date */}
            <p className="text-xs text-slate-400 mt-2">
              Filed {formatDateTime(leave.createdAt)}
            </p>
          </div>
        );
      })}
    </div>
  );
}