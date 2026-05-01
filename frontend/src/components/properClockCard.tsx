import React from 'react';
import Button from './ui/Button';

interface ProperClockCardProps {
  clockedIn: boolean;
  isOnBreak?: boolean;
  clockInTime?: Date | null;
  onClockIn: () => void;
  onClockOut: () => void;
    onStartBreak?: () => void;
  onEndBreak?: () => void;
  breakLoading?: boolean;
  compact?: boolean; // for DTRPage side display
}

/**
 * ProperClockCard - Status indicator with conditional controls
 * 
 * Colors:
 * - Gray: Clocked out (idle)
 * - Green: Clocked in (active)
 * - Yellow: On break (paused)
 * 
 * Shows current time, date with day, and appropriate action buttons
 */
export default function ProperClockCard({
  clockedIn,
  isOnBreak = false,
  clockInTime,
  onClockIn,
  onClockOut,
  onStartBreak,
  onEndBreak,
  breakLoading = false,
  compact = false,
}: ProperClockCardProps) {
  const [currentTime, setCurrentTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getStatusColor = () => {
    if (isOnBreak) return 'from-yellow-50 to-amber-50 border-yellow-300';
    if (clockedIn) return 'from-green-50 to-emerald-50 border-green-300';
    return 'from-slate-50 to-slate-100 border-slate-200';
  };

  const getStatusBadgeColor = () => {
    if (isOnBreak) return 'bg-yellow-500 text-white';
    if (clockedIn) return 'bg-green-500 text-white';
    return 'bg-slate-400 text-white';
  };

  const getStatusText = () => {
    if (isOnBreak) return 'On Break';
    if (clockedIn) return 'Clocked In';
    return 'Clocked Out';
  };

  const formatDate = (date: Date) => {
    const dateStr = date.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
    });
    const day = date.toLocaleDateString('en-US', { weekday: 'long' });
    return { dateStr, day };
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const { dateStr, day } = formatDate(currentTime);

  if (compact) {
    // Compact version for DTRPage side panel
    return (
      <div
        className={`rounded-lg p-4 transition-all duration-300 border-2 bg-gradient-to-br ${getStatusColor()}`}
      >
        <div className="space-y-3">
          {/* Date with day */}
          <div>
            <p className="font-medium text-slate-900">{dateStr}</p>
            <p className="text-xs text-slate-600 mt-0.5">{day}</p>
          </div>

          {/* Time - Monospace */}
          <div>
            <p className="font-mono text-sm text-slate-700">{formatTime(currentTime)}</p>
          </div>

          {/* Status Badge */}
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor()}`}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                clockedIn && !isOnBreak ? 'animate-pulse' : ''
              } bg-current`}
            />
            {getStatusText()}
          </div>

          {/* Action Button */}
          <button
            onClick={clockedIn ? onClockOut : onClockIn}
            className={`w-full py-1.5 rounded-lg text-xs font-semibold transition-all ${
              clockedIn
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {clockedIn ? 'Clock Out' : 'Clock In'}
          </button>

          {/* Take Break - only visible when clocked in */}
          {clockedIn && !isOnBreak && onStartBreak && (
            <button
              onClick={onStartBreak}
              disabled={breakLoading}
              className="w-full py-1.5 rounded-lg text-xs font-semibold bg-yellow-100 hover:bg-yellow-200 text-yellow-900 transition-all disabled:opacity-50"
            >
              {breakLoading ? 'Starting...' : 'Take Break'}
            </button>
          )}

          {/* Resume Work - only visible on break */}
          {isOnBreak && onEndBreak && (
            <button
              onClick={onEndBreak}
              disabled={breakLoading}
              className="w-full py-1.5 rounded-lg text-xs font-semibold bg-green-100 hover:bg-green-200 text-green-900 transition-all disabled:opacity-50"
            >
              {breakLoading ? 'Resuming...' : 'Resume Work'}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Full version for Dashboard
  return (
    <div
      className={`rounded-xl p-6 transition-all duration-300 border-2 bg-gradient-to-br ${getStatusColor()}`}
    >
      <div className="space-y-5">
        {/* Header with Date and Status Badge */}
        <div className="flex items-start justify-between">
          <div>
            <p className="font-medium text-slate-900">{dateStr}</p>
            <p className="text-xs text-slate-600 mt-0.5">{day}</p>
          </div>

          <div
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold ${getStatusBadgeColor()}`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                clockedIn && !isOnBreak ? 'animate-pulse' : ''
              } bg-current`}
            />
            {getStatusText()}
          </div>
        </div>

        {/* Time - Monospace */}
        <div>
          <p className="font-mono text-2xl text-slate-700">
            {formatTime(currentTime)}
          </p>
        </div>

        {/* Elapsed Time (when clocked in) */}
        {clockedIn && clockInTime && (
          <div className="bg-white/60 rounded-lg p-3 space-y-1">
            <p className="text-xs text-slate-600">
              Clocked in at{' '}
              <span className="font-mono font-semibold">
                {new Date(clockInTime).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                })}
              </span>
            </p>
            {(() => {
              const elapsed = Math.floor(
                (currentTime.getTime() - new Date(clockInTime).getTime()) / 1000
              );
              const hours = Math.floor(elapsed / 3600);
              const minutes = Math.floor((elapsed % 3600) / 60);
              return (
                <p className="text-sm font-semibold text-slate-800">
                  {hours}h {minutes}m elapsed
                </p>
              );
            })()}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          {!clockedIn ? (
            <Button
              onClick={onClockIn}
              variant="primary"
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Clock In
            </Button>
          ) : (
            <>
              <Button
                onClick={onClockOut}
                variant="danger"
                className="w-full bg-red-600 hover:bg-red-700"
              >
                Clock Out
              </Button>

              {!isOnBreak && onStartBreak && (
                <Button
                  onClick={onStartBreak}
                  disabled={breakLoading}
                  className="w-full bg-yellow-100 hover:bg-yellow-200 text-yellow-900 border-yellow-300 disabled:opacity-50"
                >
                  {breakLoading ? 'Starting...' : 'Take Break'}
                </Button>
              )}

              {isOnBreak && onEndBreak && (
                <Button
                  onClick={onEndBreak}
                  disabled={breakLoading}
                  className="w-full bg-green-100 hover:bg-green-200 text-green-900 border-green-300 disabled:opacity-50"
                >
                  {breakLoading ? 'Resuming...' : 'Resume Work'}
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
