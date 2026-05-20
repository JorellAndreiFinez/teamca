// frontend/src/components/leave/LeaveApprovalPanel.tsx

import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '../../store/authStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { leaveService } from '../../services/leaveService';
import type { ILeave, IReviewHistoryEntry } from '../../types/leave';

// ─── helpers ───────────────────────────────────────────────────────────────────

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

const LEAVE_TYPE_LABELS: Record<string, string> = {
  vacation: 'Vacation',
  sick: 'Sick',
  emergency: 'Emergency',
  unpaid: 'Unpaid',
  other: 'Other',
};

const LEAVE_TYPE_COLORS: Record<string, string> = {
  vacation: 'bg-blue-50 text-blue-700 border-blue-200',
  sick: 'bg-orange-50 text-orange-700 border-orange-200',
  emergency: 'bg-red-50 text-red-700 border-red-200',
  unpaid: 'bg-slate-50 text-slate-700 border-slate-200',
  other: 'bg-purple-50 text-purple-700 border-purple-200',
};

// ─── sub-components ────────────────────────────────────────────────────────────

/**
 * Review history timeline shown at the bottom of each leave card.
 */
function ReviewHistory({ history }: { history: IReviewHistoryEntry[] }) {
  if (!history || history.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-slate-100">
      <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">
        Review History
      </p>
      <div className="space-y-2">
        {history.map((entry, i) => (
          <div key={i} className="flex items-start gap-2 text-xs">
            <span
              className={`mt-0.5 inline-block w-2 h-2 rounded-full flex-shrink-0 ${
                entry.action === 'approved'
                  ? 'bg-green-500'
                  : entry.action === 'rejected'
                  ? 'bg-red-500'
                  : 'bg-slate-400'
              }`}
            />
            <div className="min-w-0">
              <span className="font-medium text-slate-700 capitalize">{entry.action}</span>
              <span className="text-slate-500"> by {entry.actor_name}</span>
              <span className="text-slate-400"> · {formatDateTime(entry.timestamp)}</span>
              {entry.reason && (
                <p className="text-slate-500 mt-0.5 italic">"{entry.reason}"</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Modal for entering a rejection reason.
 */
function RejectModal({
  leave,
  onConfirm,
  onCancel,
  loading,
}: {
  leave: ILeave;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);

  const isValid = reason.trim().length >= 5;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!isValid) return;
    onConfirm(reason.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div>
          <h3 className="font-semibold text-slate-900 text-lg">Reject Leave Request</h3>
          <p className="text-sm text-slate-500 mt-1">
            {leave.applicant?.name
              ? `${leave.applicant.name}'s`
              : 'This'}{' '}
            {LEAVE_TYPE_LABELS[leave.leaveType] ?? leave.leaveType} leave —{' '}
            {formatDate(leave.startDate)} to {formatDate(leave.endDate)} ({leave.duration} day
            {leave.duration !== 1 ? 's' : ''})
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="rejectionReason"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Reason for rejection <span className="text-red-500">*</span>
            </label>
            <textarea
              id="rejectionReason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              onBlur={() => setTouched(true)}
              rows={3}
              maxLength={500}
              placeholder="Explain why this leave is being rejected..."
              className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-red-300 ${
                touched && !isValid
                  ? 'border-red-400 bg-red-50'
                  : 'border-slate-300 bg-white'
              }`}
            />
            {touched && !isValid && (
              <p className="text-xs text-red-600 mt-1">
                Please provide a reason (at least 5 characters).
              </p>
            )}
            <p className="text-xs text-slate-400 mt-1 text-right">{reason.length}/500</p>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              onClick={onCancel}
              disabled={loading}
              size="sm"
              variant="outline"
              className="text-slate-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !isValid}
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
            >
              {loading ? 'Rejecting...' : 'Confirm Rejection'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── main component ────────────────────────────────────────────────────────────

export default function LeaveApprovalPanel() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.global_role === 'Admin' || user?.global_role === 'Superadmin';
  const isHead = user?.departments?.some((d) => d.department_role === 'Head');

  const [leaves, setLeaves] = useState<ILeave[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // reject modal state
  const [rejectTarget, setRejectTarget] = useState<ILeave | null>(null);
  const [rejectLoading, setRejectLoading] = useState(false);

  // ── fetch pending leaves ────────────────────────────────────────────────────
  const fetchPending = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await leaveService.getPendingLeaves();
      setLeaves(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pending leaves');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin || isHead) {
      fetchPending();
    }
  }, [isAdmin, isHead, fetchPending]);

  // ── approve ─────────────────────────────────────────────────────────────────
  const handleApprove = async (leaveId: string) => {
    try {
      setActionLoading(leaveId);
      const updated = await leaveService.approveLeave(leaveId);
      // Remove from pending queue (it's no longer pending)
      setLeaves((prev) => prev.filter((l) => l._id !== leaveId));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to approve leave');
    } finally {
      setActionLoading(null);
    }
  };

  // ── reject (open modal first) ───────────────────────────────────────────────
  const handleRejectClick = (leave: ILeave) => {
    setRejectTarget(leave);
  };

  const handleRejectConfirm = async (reason: string) => {
    if (!rejectTarget) return;
    try {
      setRejectLoading(true);
      await leaveService.rejectLeave(rejectTarget._id, reason);
      // Remove from pending queue
      setLeaves((prev) => prev.filter((l) => l._id !== rejectTarget._id));
      setRejectTarget(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to reject leave');
    } finally {
      setRejectLoading(false);
    }
  };

  // ── access guard ────────────────────────────────────────────────────────────
  if (!isAdmin && !isHead) return null;

  // ── loading state ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Card>
        <div className="space-y-3 animate-pulse">
          {[1, 2].map((i) => (
            <div key={i} className="border border-slate-200 rounded-lg p-4 space-y-2">
              <div className="h-4 bg-slate-200 rounded w-1/2" />
              <div className="h-3 bg-slate-100 rounded w-3/4" />
              <div className="flex gap-2 justify-end mt-3">
                <div className="h-8 w-20 bg-slate-100 rounded" />
                <div className="h-8 w-20 bg-slate-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  // ── error state ─────────────────────────────────────────────────────────────
  if (error) {
    return (
      <Card>
        <div className="text-center py-6 space-y-3">
          <p className="text-red-600 text-sm">{error}</p>
          <Button size="sm" variant="outline" onClick={fetchPending}>
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  // ── empty state ─────────────────────────────────────────────────────────────
  if (leaves.length === 0) {
    return (
      <Card>
        <div className="text-center py-8">
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-slate-600 font-medium">No pending leave requests</p>
          <p className="text-slate-400 text-sm mt-1">All caught up!</p>
        </div>
      </Card>
    );
  }

  // ── main render ─────────────────────────────────────────────────────────────
  return (
    <>
      {/* Rejection modal */}
      {rejectTarget && (
        <RejectModal
          leave={rejectTarget}
          onConfirm={handleRejectConfirm}
          onCancel={() => setRejectTarget(null)}
          loading={rejectLoading}
        />
      )}

      <Card>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">
              Pending Approvals{' '}
              <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                {leaves.length}
              </span>
            </h3>
            <button
              onClick={fetchPending}
              className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>

          <div className="space-y-3">
            {leaves.map((leave) => {
              const isThisLoading = actionLoading === leave._id;
              const typeColorClass =
                LEAVE_TYPE_COLORS[leave.leaveType] ?? LEAVE_TYPE_COLORS.other;

              return (
                <div
                  key={leave._id}
                  className="border border-slate-200 rounded-lg p-4 space-y-3 hover:border-slate-300 transition-colors"
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {/* Applicant name (if populated) */}
                      {leave.applicant && (
                        <p className="font-semibold text-slate-900 text-sm truncate">
                          {leave.applicant.name}
                          <span className="ml-1 text-xs font-normal text-slate-400">
                            ({leave.applicant.email})
                          </span>
                        </p>
                      )}

                      {/* Date range */}
                      <p className="font-medium text-slate-800 mt-0.5">
                        {formatDate(leave.startDate)} – {formatDate(leave.endDate)}
                      </p>

                      {/* Duration + reason */}
                      <p className="text-sm text-slate-500 mt-0.5">
                        {leave.duration} day{leave.duration !== 1 ? 's' : ''} ·{' '}
                        <span className="italic">{leave.reason}</span>
                      </p>
                    </div>

                    {/* Leave type badge */}
                    <span
                      className={`flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded border ${typeColorClass}`}
                    >
                      {LEAVE_TYPE_LABELS[leave.leaveType] ?? leave.leaveType}
                    </span>
                  </div>

                  {/* Submitted date */}
                  <p className="text-xs text-slate-400">
                    Submitted {formatDateTime(leave.createdAt)}
                  </p>

                  {/* Review history (if any) */}
                  <ReviewHistory history={leave.reviewHistory} />

                  {/* Action buttons */}
                  <div className="flex gap-2 justify-end pt-1">
                    <Button
                      onClick={() => handleRejectClick(leave)}
                      disabled={isThisLoading}
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-300 hover:bg-red-50 disabled:opacity-50"
                    >
                      Reject
                    </Button>
                    <Button
                      onClick={() => handleApprove(leave._id)}
                      disabled={isThisLoading}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                    >
                      {isThisLoading ? 'Processing...' : 'Approve'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </>
  );
}