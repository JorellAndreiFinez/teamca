import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/ui/Button';
import LeaveRequestForm from './LeaveRequestForm';
import LeaveListTable from './LeaveListTable';
import { leaveService } from '../../services/leaveService';
import type { ILeave, CreateLeavePayload } from '../../types/leave';

export default function LeavePage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  const [mounted, setMounted] = useState(false);
  const [leaves, setLeaves] = useState<ILeave[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'request' | 'history'>('request');
  const [error, setError] = useState('');

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch leave history
  React.useEffect(() => {
    const fetchLeaves = async () => {
      if (!isAuthenticated) return;

      try {
        setLoading(true);
        const data = await leaveService.getMyLeaves();
        setLeaves(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load leave history');
      } finally {
        setLoading(false);
      }
    };

    if (mounted && isAuthenticated) {
      fetchLeaves();
    }
  }, [isAuthenticated, mounted]);

  const handleCreateLeave = async (payload: CreateLeavePayload) => {
    try {
      setFormLoading(true);
      setError('');
      const newLeave = await leaveService.createLeave(payload);
      setLeaves((prev) => [newLeave, ...prev]);
      setActiveTab('history');
    } catch (err) {
      throw err;
    } finally {
      setFormLoading(false);
    }
  };

  const handleCancelLeave = async (leaveId: string) => {
    try {
      await leaveService.cancelLeave(leaveId);
      setLeaves((prev) =>
        prev.map((leave) =>
          leave._id === leaveId ? { ...leave, status: 'cancelled' as const } : leave
        )
      );
    } catch (err) {
      throw err;
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin">⏳</div>
          <p className="text-slate-600 mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">Please log in to view leave requests</p>
        </div>
      </div>
    );
  }

  const pendingCount = leaves.filter((l) => l.status === 'pending').length;
  const approvedCount = leaves.filter((l) => l.status === 'approved').length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Leave Management</h1>
        <p className="text-sm text-slate-500 mt-1">
          Submit leave requests and view your leave history
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-amber-200/70 bg-amber-50/80 p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700">Pending</p>
          <p className="mt-1.5 text-2xl font-bold text-amber-900 tabular-nums">{pendingCount}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/80 p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">Approved</p>
          <p className="mt-1.5 text-2xl font-bold text-emerald-900 tabular-nums">{approvedCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Total Requests</p>
          <p className="mt-1.5 text-2xl font-bold text-slate-900 tabular-nums">{leaves.length}</p>
        </div>
        <div className="rounded-2xl border border-blue-200/70 bg-blue-50/80 p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-700">Status</p>
          <p className="mt-2 text-sm font-semibold text-blue-900">Active</p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab('request')}
            className={`pb-3 font-medium text-sm transition-colors ${
              activeTab === 'request'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Submit Request
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 font-medium text-sm transition-colors ${
              activeTab === 'history'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            History
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {activeTab === 'request' && (
          <div>
            <LeaveRequestForm onSubmit={handleCreateLeave} loading={formLoading} />
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <LeaveListTable
              leaves={leaves}
              isLoading={loading}
              onCancel={handleCancelLeave}
            />
          </div>
        )}
      </div>
    </div>
  );
}
