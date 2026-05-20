import React from 'react';
import Button from './ui/Button';

interface EnhancedClockCardProps {
  clockedIn: boolean;
  clockInTime?: Date | null;
  onClockIn: () => void;
  onClockOut: () => void;
}

/**
 * Enhanced Clock Card - Visual color representation of status
 * 
 * Design: Color-coded status with large time display
 * - Idle state: slate gray
 * - Active state: vibrant green with animation
 * - Status badge with icon
 */
export default function EnhancedClockCard({
  clockedIn,
  clockInTime,
  onClockIn,
  onClockOut,
}: EnhancedClockCardProps) {
  const [currentTime, setCurrentTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const elapsedTime = clockInTime
    ? Math.floor((currentTime.getTime() - new Date(clockInTime).getTime()) / 1000)
    : 0;

  const hours = Math.floor(elapsedTime / 3600);
  const minutes = Math.floor((elapsedTime % 3600) / 60);
  const seconds = elapsedTime % 60;

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div
      className={`rounded-xl p-6 transition-all duration-300 ${
        clockedIn
          ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300'
          : 'bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-200'
      }`}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">
              {formatDate(new Date())}
            </p>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              {formatTime(currentTime)}
            </p>
          </div>

          {/* Status Badge */}
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-full font-medium text-sm transition-all ${
              clockedIn
                ? 'bg-green-500 text-white shadow-lg'
                : 'bg-slate-300 text-slate-700'
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                clockedIn ? 'bg-white animate-pulse' : 'bg-slate-600'
              }`}
            />
            {clockedIn ? 'Active' : 'Not Clocked In'}
          </div>
        </div>

        {/* Elapsed Time Display (when clocked in) */}
        {clockedIn && clockInTime && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-600">Recent Status</p>
            <div className="bg-white/60 rounded-lg p-3">
              <p className="text-xs text-slate-600">
                Clocked in at{' '}
                <span className="font-bold text-green-700">
                  {formatTime(new Date(clockInTime))}
                </span>
              </p>
              <p className="text-sm font-bold text-green-700 mt-2">
                {hours}h {minutes}m {seconds}s elapsed
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          {!clockedIn ? (
            <Button
              onClick={onClockIn}
              variant="primary"
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5z" />
                </svg>
                Clock In
              </span>
            </Button>
          ) : (
            <Button
              onClick={onClockOut}
              variant="danger"
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5z" />
                </svg>
                Clock Out
              </span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
