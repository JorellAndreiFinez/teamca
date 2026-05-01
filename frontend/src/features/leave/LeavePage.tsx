import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import Card from '../../components/ui/Card';
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-600 font-medium">Pending</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-600 font-medium">Approved</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{approvedCount}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-600 font-medium">Total Requests</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{leaves.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-600 font-medium">Status</p>
          <p className="text-sm font-semibold text-slate-900 mt-1">Active</p>
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
          <Card>
            <LeaveRequestForm onSubmit={handleCreateLeave} loading={formLoading} />
          </Card>
        )}

        {activeTab === 'history' && (
          <Card>
            <LeaveListTable
              leaves={leaves}
              isLoading={loading}
              onCancel={handleCancelLeave}
            />
          </Card>
        )}
      </div>
    </div>
  );
}
