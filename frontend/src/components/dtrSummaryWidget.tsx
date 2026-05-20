import { useEffect, useState } from 'react';
import api from '../services/api';

interface DTRSummary {
  _id?: string;
  userId: string;
  departmentId: string;
  period: 'week' | 'month';
  startDate: string;
  endDate: string;
  totalHours: number;
  requiredHours: number;
  overtimeHours: number;
  undertimeHours: number;
  totalBreakTime: number;
  daysPresent: number;
  daysLate: number;
  daysAbsent: number;
  daysOnLeave: number;
  lateCount: number;
  undertimeDays: number;
}

interface DTRSummaryWidgetProps {
  userId: string;
  period?: 'week' | 'month';
}

/**
 * DTR Summary Widget
 * 
 * Displays weekly or monthly time tracking statistics.
 * Follows data-forward design: key metrics visible at a glance.
 * 
 * Shows:
 * - Total hours worked vs required
 * - Overtime and undertime
 * - Days present/late/absent
 * - Break time
 */
export function DTRSummaryWidget({
  userId,
  period = 'week',
}: DTRSummaryWidgetProps) {
  const [summary, setSummary] = useState<DTRSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await api.get<{ success: boolean; data: DTRSummary }>(`/dtr/summary/${period}`);
        setSummary(response.data.data);
      } catch (err: any) {
        const message = err.response?.data?.message || err.message || 'Failed to load summary';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [userId, period]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-red-200 p-6">
        <div className="text-sm text-red-600">{error}</div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-sm text-gray-500">No data available</div>
      </div>
    );
  }

  const hoursStatus =
    summary.totalHours >= summary.requiredHours
      ? 'text-green-600'
      : 'text-red-600';

  const periodLabel = period === 'week' ? 'This Week' : 'This Month';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{periodLabel} Summary</h2>
        <p className="text-sm text-gray-500 mt-1">
          {new Date(summary.startDate).toLocaleDateString()} –{' '}
          {new Date(summary.endDate).toLocaleDateString()}
        </p>
      </div>

      {/* Main Hours Card */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded p-4">
          <div className="text-sm text-gray-600 mb-1">Total Hours</div>
          <div className={`text-2xl font-bold ${hoursStatus}`}>
            {summary.totalHours.toFixed(1)}h
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Required: {summary.requiredHours.toFixed(1)}h
          </div>
        </div>

        <div className="bg-gray-50 rounded p-4">
          <div className="text-sm text-gray-600 mb-1">Break Time</div>
          <div className="text-2xl font-bold text-gray-900">
            {Math.floor(summary.totalBreakTime / 60)}h {summary.totalBreakTime % 60}m
          </div>
          <div className="text-xs text-gray-500 mt-2">Not counted toward hours</div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 gap-3">
        {summary.overtimeHours > 0 && (
          <div className="bg-green-50 border border-green-200 rounded p-3">
            <div className="text-xs text-green-600 font-medium">Overtime</div>
            <div className="text-lg font-bold text-green-700 mt-1">
              +{summary.overtimeHours.toFixed(1)}h
            </div>
          </div>
        )}

        {summary.undertimeHours > 0 && (
          <div className="bg-red-50 border border-red-200 rounded p-3">
            <div className="text-xs text-red-600 font-medium">Undertime</div>
            <div className="text-lg font-bold text-red-700 mt-1">
              -{summary.undertimeHours.toFixed(1)}h
            </div>
          </div>
        )}
      </div>

      {/* Attendance Stats */}
      <div className="bg-blue-50 rounded p-4 space-y-2">
        <div className="text-sm font-medium text-gray-900">Attendance</div>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <div className="text-sm font-bold text-blue-600">{summary.daysPresent}</div>
            <div className="text-xs text-gray-500">Present</div>
          </div>
          <div>
            <div className="text-sm font-bold text-orange-600">{summary.daysLate}</div>
            <div className="text-xs text-gray-500">Late</div>
          </div>
          <div>
            <div className="text-sm font-bold text-red-600">{summary.daysAbsent}</div>
            <div className="text-xs text-gray-500">Absent</div>
          </div>
          <div>
            <div className="text-sm font-bold text-purple-600">{summary.daysOnLeave}</div>
            <div className="text-xs text-gray-500">Leave</div>
          </div>
        </div>
      </div>

      {/* Violation Count */}
      {summary.lateCount > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm">
          <div className="font-medium text-yellow-900">
            {summary.lateCount} late {summary.lateCount === 1 ? 'entry' : 'entries'}
          </div>
        </div>
      )}
    </div>
  );
}
