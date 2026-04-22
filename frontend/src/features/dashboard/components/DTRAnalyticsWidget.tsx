// frontend/src/features/dashboard/components/DTRAnalyticsWidget.tsx

import type { DailyTimeRecord } from "../../../types/dtr";

interface DTRAnalyticsWidgetProps {
  records?: DailyTimeRecord[];
  requiredHours: number;
  renderedHours?: number;
  workingHours?: {
    start?: string;
    end?: string;
  };
}

export default function DTRAnalyticsWidget({
  records,
  requiredHours,
  renderedHours,
  workingHours,
}: DTRAnalyticsWidgetProps) {
  const totalRenderedMs = renderedHours
    ? renderedHours * 60 * 60 * 1000 // if passed as hours, convert to ms
    : records
      ? records.reduce((sum, r) => {
          const dailyMs =
            r.clocks?.reduce((acc, c) => {
              if (!c.timeIn || !c.timeOut) return acc;

              const diffMs =
                new Date(c.timeOut).getTime() - new Date(c.timeIn).getTime();
              return acc + diffMs;
            }, 0) || 0;

          return sum + dailyMs;
        }, 0)
      : 0;

  const isWithinWorkingHours = (timeIn: string, start: string, end: string) => {
    const inDate = new Date(timeIn);

    const [startH, startM] = start.split(":").map(Number);
    const [endH, endM] = end.split(":").map(Number);

    const startDate = new Date(inDate);
    startDate.setHours(startH, startM, 0, 0);

    const endDate = new Date(inDate);
    endDate.setHours(endH, endM, 0, 0);

    return inDate >= startDate && inDate <= endDate;
  };

  // Convert total milliseconds → total minutes
  const totalMinutes = Math.floor(totalRenderedMs / (1000 * 60));

  // Rendered hours and minutes
  const renderedHoursPart = Math.floor(totalMinutes / 60);
  const renderedMinutesPart = totalMinutes % 60;

  // Remaining hours and minutes
  const requiredMinutes = requiredHours * 60;
  const remainingMinutes = Math.max(0, requiredMinutes - totalMinutes);
  const remainingHoursPart = Math.floor(remainingMinutes / 60);
  const remainingMinutesPart = remainingMinutes % 60;

  // Internship progress %
  const percentage =
    requiredHours > 0
      ? Math.min(100, Math.round((totalMinutes / requiredMinutes) * 100))
      : 0;

  const isValidClockInTime = (
    timeIn: string,
    start: string,
    graceMinutes = 30,
  ) => {
    const inDate = new Date(timeIn);

    const [startH, startM] = start.split(":").map(Number);

    const startDate = new Date(inDate);
    startDate.setHours(startH, startM, 0, 0);

    const graceStart = new Date(startDate);
    graceStart.setMinutes(graceStart.getMinutes() - graceMinutes);

    const graceEnd = new Date(startDate);
    graceEnd.setMinutes(graceEnd.getMinutes() + graceMinutes);

    return inDate >= graceStart && inDate <= graceEnd;
  };

  const presentDays = records
    ? records.filter((r) => {
        if (!r.clocks || r.clocks.length === 0) return false;

        return r.clocks.some((c) => {
          if (!c.timeIn || !c.timeOut) return false;

          const diff =
            new Date(c.timeOut).getTime() - new Date(c.timeIn).getTime();

          if (diff <= 0) return false;

          if (!workingHours?.start || !workingHours?.end) return true;

          return isValidClockInTime(c.timeIn, workingHours.start, 30);
        });
      }).length
    : 0;

  const absentDays = 0; // adjust if backend supports it
  const leaveDays = 0; // adjust if backend supports it

  const totalWorkDays = presentDays + absentDays + leaveDays;
  const attendanceRate =
    totalWorkDays > 0 ? Math.round((presentDays / totalWorkDays) * 100) : 0;

  // Stats for dashboard
  const stats = [
    {
      label: "Hours Rendered",
      value: `${renderedHoursPart}h ${renderedMinutesPart}m`,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Hours Remaining",
      value: `${remainingHoursPart}h ${remainingMinutesPart}m`,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      label: "Days Present",
      value: presentDays,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Attendance Rate",
      value: `${attendanceRate}%`,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">Internship Progress</span>
          <span className="text-sm font-semibold text-gray-800">
            {percentage}%
          </span>
        </div>

        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-400">
            {renderedHoursPart}h {renderedMinutesPart}m rendered
          </span>
          <span className="text-xs text-gray-400">
            {requiredHours}h required
          </span>
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
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </div>

        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
          Active
        </span>
      </div>
    </div>
  );
}
