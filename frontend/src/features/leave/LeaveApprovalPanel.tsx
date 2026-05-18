import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { leaveService } from '../../services/leaveService';
import type { ILeave } from '../../types/leave';

/**
 * LeaveApprovalPanel - For admin/department heads to approve pending leave
 * Note: This component loads pending leaves via API 
 * (currently backend has no dept-scoped endpoint, so this is a placeholder)
 */
export default function LeaveApprovalPanel() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.global_role === 'Admin';
  const isHead = user?.departments?.some((d) => d.department_role === 'Head');

  const [leaves, setLeaves] = useState<ILeave[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    // TODO: Implement API endpoint to get pending leaves for department
    // For now, this component is a template ready for backend integration
  }, []);

  const handleApprove = async (leaveId: string) => {
    try {
      setActionLoading(leaveId);
      await leaveService.approveLeave(leaveId);
      setLeaves((prev) =>
        prev.map((leave) =>
          leave._id === leaveId ? { ...leave, status: 'approved' as const } : leave
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to approve leave');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (leaveId: string) => {
    if (!window.confirm('Are you sure you want to reject this leave request?')) return;

    try {
      setActionLoading(leaveId);
      await leaveService.rejectLeave(leaveId);
      setLeaves((prev) =>
        prev.map((leave) =>
          leave._id === leaveId ? { ...leave, status: 'rejected' as const } : leave
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to reject leave');
    } finally {
      setActionLoading(null);
    }
  };

  // Only show this component to admins or department heads
  if (!isAdmin && !isHead) {
    return null;
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return <div className="text-center py-4 text-slate-500">Loading pending leaves...</div>;
  }

  if (leaves.length === 0) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-slate-600">No pending leave requests</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="space-y-4">
        <h3 className="font-semibold text-slate-900">Pending Approvals ({leaves.length})</h3>

        <div className="space-y-3">
          {leaves.map((leave) => (
            <div
              key={leave._id}
              className="border border-slate-200 rounded-lg p-4 space-y-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-slate-900">
                    {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    {leave.duration} day{leave.duration !== 1 ? 's' : ''} • {leave.reason}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  onClick={() => handleReject(leave._id)}
                  disabled={actionLoading === leave._id}
                  size="sm"
                  variant="outline"
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  Reject
                </Button>
                <Button
                  onClick={() => handleApprove(leave._id)}
                  disabled={actionLoading === leave._id}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {actionLoading === leave._id ? 'Processing...' : 'Approve'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
