import React from 'react';
import type { ILeave } from '../../types/leave';

interface LeaveListTableProps {
  leaves: ILeave[];
  isLoading?: boolean;
  onCancel?: (leaveId: string) => Promise<void>;
}

export default function LeaveListTable({ leaves, isLoading = false, onCancel }: LeaveListTableProps) {
  const getStatusBadgeColor = (status: ILeave['status']) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'cancelled':
        return 'bg-slate-100 text-slate-800 border-slate-300';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

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
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />
        ))}
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
      {leaves.map((leave) => (
        <div
          key={leave._id}
          className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-start justify-between gap-4">
            {/* Left: Date and Duration */}
            <div className="flex-1">
              <p className="font-medium text-slate-900">
                {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
              </p>
              <p className="text-sm text-slate-600 mt-1">
                {leave.duration} day{leave.duration !== 1 ? 's' : ''} • {leave.reason}
              </p>
            </div>

            {/* Right: Status and Actions */}
            <div className="flex items-center gap-3">
              <div
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeColor(
                  leave.status
                )}`}
              >
                {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
              </div>

              {/* Cancel button - only for pending */}
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
        </div>
      ))}
    </div>
  );
}
