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
      ? 'text-emerald-700'
      : 'text-rose-700';

  const periodLabel = period === 'week' ? 'Week' : 'Month';

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{periodLabel} Summary</p>
      <div className="grid grid-cols-2 gap-3">
        {/* Total Hours */}
        <div className="rounded-2xl border border-blue-200/70 bg-blue-50/80 p-3 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Total Hours</div>
          <div className={`mt-1.5 text-lg font-bold tabular-nums ${hoursStatus}`}>
            {summary.totalHours.toFixed(1)}h
          </div>
          <div className="mt-0.5 text-xs text-slate-500">
            / {summary.requiredHours.toFixed(1)}h required
          </div>
        </div>

        {/* Overtime */}
        <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/80 p-3 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Overtime</div>
          <div className="mt-1.5 text-lg font-bold tabular-nums text-emerald-700">
            +{summary.overtimeHours.toFixed(1)}h
          </div>
          <div className="mt-0.5 text-xs text-slate-500">bonus</div>
        </div>

        {/* Undertime */}
        <div className="rounded-2xl border border-amber-200/70 bg-amber-50/80 p-3 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Undertime</div>
          <div className="mt-1.5 text-lg font-bold tabular-nums text-amber-700">
            -{summary.undertimeHours.toFixed(1)}h
          </div>
          <div className="mt-0.5 text-xs text-slate-500">deficit</div>
        </div>

        {/* Late Count */}
        <div className="rounded-2xl border border-violet-200/70 bg-violet-50/80 p-3 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Late Count</div>
          <div className="mt-1.5 text-lg font-bold tabular-nums text-violet-700">
            {summary.lateCount}
          </div>
          <div className="mt-0.5 text-xs text-slate-500">
            {summary.lateCount === 1 ? 'entry' : 'entries'}
          </div>
        </div>
      </div>
    </div>
  );
}
