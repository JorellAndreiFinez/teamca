import React from 'react';
import type { DailyTimeRecord } from '../../../types/dtr';

interface DTRAnalyticsWidgetProps {
  records?: DailyTimeRecord[];
  requiredHours?: number;
  renderedHours?: number;
}

export default function DTRAnalyticsWidget({
  records,
  requiredHours = 480,
  renderedHours,
}: DTRAnalyticsWidgetProps) {
  // Calculate stats from records or use mock values
  const totalRendered = renderedHours ??
    (records ? records.reduce((sum, r) => sum + (r.hours_rendered || 0), 0) : 312);

  const remaining = Math.max(0, requiredHours - totalRendered);
  const percentage = Math.min(100, Math.round((totalRendered / requiredHours) * 100));

  // Stats from records or mock
  const presentDays = records
    ? records.filter((r) => r.status === 'Present').length
    : 39;
  const absentDays = records
    ? records.filter((r) => r.status === 'Absent').length
    : 3;
  const leaveDays = records
    ? records.filter((r) => r.status === 'Leave').length
    : 2;

  const totalWorkDays = presentDays + absentDays + leaveDays;
  const attendanceRate = totalWorkDays > 0
    ? Math.round((presentDays / totalWorkDays) * 100)
    : 0;

  const stats = [
    { label: 'Hours Rendered', value: `${totalRendered}h`, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Hours Remaining', value: `${remaining}h`, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Days Present', value: presentDays, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Attendance Rate', value: `${attendanceRate}%`, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">Internship Progress</span>
          <span className="text-sm font-semibold text-gray-800">{percentage}%</span>
        </div>
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-400">{totalRendered}h rendered</span>
          <span className="text-xs text-gray-400">{requiredHours}h required</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label} className={`${s.bg} rounded-lg px-3 py-3`}>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Today's info */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          <span className="font-medium text-gray-700">Today: </span>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
          Present
        </span>
      </div>
    </div>
  );
}
