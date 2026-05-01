import React, { useState } from 'react';
import type { DailyTimeRecord } from '../../../types/dtr';

interface CalendarWidgetProps {
  records?: DailyTimeRecord[];
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Mock attendance data for demo
function getMockStatus(date: Date): 'present' | 'absent' | 'leave' | 'holiday' | null {
  const day = date.getDay();
  // Weekends have no status
  if (day === 0 || day === 6) return null;
  // Future dates have no status
  if (date > new Date()) return null;
  const d = date.getDate();
  if (d % 11 === 0) return 'leave';
  if (d % 7 === 0) return 'absent';
  return 'present';
}

export default function CalendarWidget({ records }: CalendarWidgetProps) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const statusColor: Record<string, string> = {
    present: 'bg-green-100 text-green-700 font-semibold',
    absent: 'bg-red-100 text-red-600',
    leave: 'bg-yellow-100 text-yellow-700',
    holiday: 'bg-blue-100 text-blue-700',
  };

  // Build a map from date string to record
  const recordMap: Record<string, DailyTimeRecord> = {};
  if (records) {
    for (const r of records) {
      const key = new Date(r.date).toDateString();
      recordMap[key] = r;
    }
  }

  const cells: React.ReactNode[] = [];

  // Leading empty cells
  for (let i = 0; i < firstDay; i++) {
    cells.push(<div key={`empty-${i}`} />);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const isToday = date.toDateString() === today.toDateString();
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;

    // Use real record if available, otherwise mock
    let status: string | null = null;
    const record = recordMap[date.toDateString()];
    if (record) {
      status = record.status?.toLowerCase() || null;
    } else {
      status = getMockStatus(date);
    }

    cells.push(
      <div
        key={d}
        className={`relative flex items-center justify-center h-9 w-9 mx-auto rounded-full text-sm
          ${isToday ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
          ${isWeekend ? 'text-gray-400' : 'text-gray-700'}
          ${status ? statusColor[status] : ''}
        `}
        title={status ? status.charAt(0).toUpperCase() + status.slice(1) : undefined}
      >
        {d}
      </div>
    );
  }

  // Count stats
  let presentCount = 0, absentCount = 0, leaveCount = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const record = recordMap[date.toDateString()];
    const status = record ? (record.status?.toLowerCase() || null) : getMockStatus(date);
    if (status === 'present') presentCount++;
    else if (status === 'absent') absentCount++;
    else if (status === 'leave') leaveCount++;
  }



  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-gray-800">
          {MONTH_NAMES[month]} {year}
        </span>
        <button
          onClick={nextMonth}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {DAYS_OF_WEEK.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-green-400 inline-block" />
          <span className="text-xs text-gray-500">Present ({presentCount})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-400 inline-block" />
          <span className="text-xs text-gray-500">Absent ({absentCount})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block" />
          <span className="text-xs text-gray-500">Leave ({leaveCount})</span>
        </div>
      </div>
    </div>
  );
}
