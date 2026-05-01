interface BreakButtonProps {
  isOnBreak: boolean;
  breakDuration?: number; // in minutes
  onStartBreak?: () => void;
  onEndBreak?: () => void;
  loading?: boolean;
}

/**
 * Break Button Component
 * 
 * Minimal, refined UI for take-a-break / resume-work functionality.
 * Follows elite-frontend-design principles: data-forward, intentional hierarchy.
 * 
 * States:
 * - Not on break: "Take a Break" button
 * - On break: "Resume Work" button + elapsed break time display
 */
export function BreakButton({
  isOnBreak,
  breakDuration = 0,
  onStartBreak,
  onEndBreak,
  loading = false,
}: BreakButtonProps) {
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const handleStartBreak = () => {
    if (onStartBreak) {
      onStartBreak();
    }
  };

  if (isOnBreak) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-700">On Break</div>
          <div className="text-sm text-gray-500">{formatDuration(breakDuration)}</div>
        </div>
        <button
          onClick={onEndBreak}
          disabled={loading}
          className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded hover:bg-amber-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Resuming...' : 'Resume Work'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleStartBreak}
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Starting...' : 'Take a Break'}
      </button>
    </div>
  );
}
