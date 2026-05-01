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

interface CompactDTRSummaryProps {
  userId: string;
  period?: 'week' | 'month';
}

/**
 * Compact DTR Summary - 4 key metrics only
 * 
 * Minimal design for secondary reference:
 * - Total Hours vs Required
 * - Overtime
 * - Undertime
 * - Late Count
 */
export function CompactDTRSummary({
  userId,
  period = 'week',
}: CompactDTRSummaryProps) {
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
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-slate-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (error || !summary) {
    return null;
  }

  const hoursStatus =
    summary.totalHours >= summary.requiredHours
      ? 'text-green-600'
      : 'text-red-600';

  const periodLabel = period === 'week' ? 'Week' : 'Month';

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-slate-600">{periodLabel} Summary</p>
      <div className="grid grid-cols-2 gap-3">
        {/* Total Hours */}
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
          <div className="text-xs text-slate-600 mb-1">Total Hours</div>
          <div className={`text-lg font-bold ${hoursStatus}`}>
            {summary.totalHours.toFixed(1)}h
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            / {summary.requiredHours.toFixed(1)}h required
          </div>
        </div>

        {/* Overtime */}
        <div className="bg-green-50 rounded-lg p-3 border border-green-100">
          <div className="text-xs text-slate-600 mb-1">Overtime</div>
          <div className="text-lg font-bold text-green-700">
            +{summary.overtimeHours.toFixed(1)}h
          </div>
          <div className="text-xs text-slate-500 mt-0.5">bonus</div>
        </div>

        {/* Undertime */}
        <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
          <div className="text-xs text-slate-600 mb-1">Undertime</div>
          <div className="text-lg font-bold text-orange-700">
            -{summary.undertimeHours.toFixed(1)}h
          </div>
          <div className="text-xs text-slate-500 mt-0.5">deficit</div>
        </div>

        {/* Late Count */}
        <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-100">
          <div className="text-xs text-slate-600 mb-1">Late Count</div>
          <div className="text-lg font-bold text-yellow-700">
            {summary.lateCount}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {summary.lateCount === 1 ? 'entry' : 'entries'}
          </div>
        </div>
      </div>
    </div>
  );
}
