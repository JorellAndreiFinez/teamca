import React from 'react';

type IBreak = {
  breakStart: Date | string;
  breakEnd?: Date | string;
  duration?: number; // in minutes
  type: 'lunch' | 'rest' | 'other';
};

type DTRHoursBarProps = {
  timeIn: Date | string;
  timeOut: Date | string;
  breaks?: IBreak[];
  className?: string;
};

/**
 * DTRHoursBar - Displays a proportional horizontal bar showing work hours and break periods
 * 
 * Visual example:
 * 8:15 in → 12:00-13:00 lunch → 17:45 out = 9.5h work with 1h break
 * 
 * Bar layout: [Work section] [Break section] [Work section]
 * Where break is positioned proportionally in the timeline
 */
export default function DTRHoursBar({
  timeIn,
  timeOut,
  breaks = [],
  className = '',
}: DTRHoursBarProps) {
  const [activeTooltip, setActiveTooltip] = React.useState<{
    label: string;
    leftPx: number;
  } | null>(null);
  const barRef = React.useRef<HTMLDivElement | null>(null);
  // Convert to Date if strings
  const timeInDate = typeof timeIn === 'string' ? new Date(timeIn) : timeIn;
  const timeOutDate = typeof timeOut === 'string' ? new Date(timeOut) : timeOut;

  // Calculate total duration in minutes
  const totalMinutes = (timeOutDate.getTime() - timeInDate.getTime()) / 60000;

  // If no time-out yet, don't render
  if (totalMinutes <= 0) {
    return (
      <div className={`h-8 rounded-lg bg-slate-100 ${className}`}>
        <span className="text-xs text-slate-500 px-2 py-1.5 inline-block">Still working...</span>
      </div>
    );
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDuration = (minutes: number) => {
    if (minutes <= 0) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours === 0) return `${mins}m`;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const normalizedBreaks = breaks
    .map((br) => {
      const breakStartDate = typeof br.breakStart === 'string' ? new Date(br.breakStart) : br.breakStart;
      const breakEndDate = br.breakEnd
        ? typeof br.breakEnd === 'string'
          ? new Date(br.breakEnd)
          : br.breakEnd
        : null;
      if (!breakEndDate) return null;
      return {
        start: breakStartDate,
        end: breakEndDate,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a!.start.getTime() - b!.start.getTime()) as Array<{ start: Date; end: Date }>;

  const segments: Array<{
    type: 'work' | 'break';
    start: Date;
    end: Date;
    offsetPercent: number;
    widthPercent: number;
    minutes: number;
  }> = [];

  let cursor = timeInDate;
  normalizedBreaks.forEach((br) => {
    if (br.start > cursor) {
      const minutes = (br.start.getTime() - cursor.getTime()) / 60000;
      segments.push({
        type: 'work',
        start: cursor,
        end: br.start,
        offsetPercent: ((cursor.getTime() - timeInDate.getTime()) / 60000 / totalMinutes) * 100,
        widthPercent: (minutes / totalMinutes) * 100,
        minutes,
      });
    }

    const breakMinutes = (br.end.getTime() - br.start.getTime()) / 60000;
    segments.push({
      type: 'break',
      start: br.start,
      end: br.end,
      offsetPercent: ((br.start.getTime() - timeInDate.getTime()) / 60000 / totalMinutes) * 100,
      widthPercent: (breakMinutes / totalMinutes) * 100,
      minutes: breakMinutes,
    });

    cursor = br.end;
  });

  if (cursor < timeOutDate) {
    const minutes = (timeOutDate.getTime() - cursor.getTime()) / 60000;
    segments.push({
      type: 'work',
      start: cursor,
      end: timeOutDate,
      offsetPercent: ((cursor.getTime() - timeInDate.getTime()) / 60000 / totalMinutes) * 100,
      widthPercent: (minutes / totalMinutes) * 100,
      minutes,
    });
  }

  const totalWorkMinutes = Math.round(
    segments.filter((s) => s.type === 'work').reduce((sum, s) => sum + s.minutes, 0),
  );
  const totalBreakMinutes = Math.round(
    segments.filter((s) => s.type === 'break').reduce((sum, s) => sum + s.minutes, 0),
  );

  // Convert minutes to hours and minutes for display
  const workTotalLabel = formatDuration(totalWorkMinutes);
  const breakTotalLabel = formatDuration(totalBreakMinutes);

  const updateTooltip = (event: React.MouseEvent<HTMLDivElement>, label: string) => {
    const rect = barRef.current?.getBoundingClientRect();
    if (!rect) return;
    const rawLeft = event.clientX - rect.left;
    const clampedLeft = Math.max(12, Math.min(rect.width - 12, rawLeft));
    setActiveTooltip({ label, leftPx: clampedLeft });
  };

  return (
    <div className={className}>
      {/* Bar container */}
      <div className="relative" onMouseLeave={() => setActiveTooltip(null)}>
        <div
          ref={barRef}
          className="relative h-8 bg-slate-100 rounded-lg overflow-hidden border border-slate-200"
        >
          {segments.map((segment, idx) => {
            const rangeLabel = `${formatTime(segment.start)} to ${formatTime(segment.end)} (${formatDuration(segment.minutes)})`;
            return (
              <div
                key={`${segment.type}-${idx}`}
                className={
                  segment.type === 'work'
                    ? 'absolute h-full bg-blue-500'
                    : 'absolute h-full bg-amber-300 opacity-60'
                }
                style={{
                  left: `${segment.offsetPercent}%`,
                  width: `${segment.widthPercent}%`,
                  backgroundImage:
                    segment.type === 'break'
                      ? 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(0,0,0,0.1) 8px, rgba(0,0,0,0.1) 16px)'
                      : undefined,
                }}
                onMouseEnter={(event) => updateTooltip(event, rangeLabel)}
                onMouseMove={(event) => updateTooltip(event, rangeLabel)}
              />
            );
          })}
        </div>

        {activeTooltip && (
          <div
            className="pointer-events-none absolute -top-10 z-10 rounded-lg border border-slate-800/40 bg-slate-900/95 px-3 py-1.5 text-xs text-white shadow-xl backdrop-blur"
            style={{ left: `${activeTooltip.leftPx}px`, transform: 'translateX(-50%)' }}
          >
            {activeTooltip.label}
          </div>
        )}
      </div>

      {/* Info text */}
      <p className="text-xs text-slate-600 mt-2">
        Work: {workTotalLabel} · Break: {breakTotalLabel}
      </p>
    </div>
  );
}
