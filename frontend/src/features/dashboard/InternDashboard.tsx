import React from 'react';
import { useAuthStore } from '../../store/authStore';
import Card from '../../components/ui/Card';
import DTRAnalyticsWidget from './components/DTRAnalyticsWidget';
import TaskBriefWidget from './components/TaskBriefWidget';
import CalendarWidget from './components/CalendarWidget';
import ProperClockCard from '../../components/properClockCard';
import { useDtrStore } from '../../store/dtrStore';
import { useDtrSocket } from '../../features/dtr/hooks/useDtrSocket';
import Button from '../../components/ui/Button';

export default function InternDashboard() {
  const user = useAuthStore((state) => state.user);
  const clockedIn = useDtrStore((state) => state.clockedIn);
  const isOnBreak = useDtrStore((state) => state.isOnBreak);
  const refreshRecords = useDtrStore((state) => state.refreshRecords);
  const clockIn = useDtrStore((state) => state.clockIn);
  const clockOut = useDtrStore((state) => state.clockOut);
  const startBreak = useDtrStore((state) => state.startBreak);
  const endBreak = useDtrStore((state) => state.endBreak);
  const [dtrActionError, setDtrActionError] = React.useState<string | null>(null);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  React.useEffect(() => {
    const loadDtr = async () => {
      try {
        await refreshRecords();
      } catch {}
    };

    loadDtr();
  }, [refreshRecords]);

  // Memoize socket callback to prevent recreation on every render
  const handleDtrSocketUpdate = React.useCallback(
    async (payload: any) => {
      try {
        await refreshRecords();
      } catch (err) {}
    },
    [refreshRecords],
  );

  // subscribe to DTR socket so dashboard updates live
  useDtrSocket(handleDtrSocketUpdate);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {greeting()}, {user?.first_name ?? 'Intern'}! 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.location.href = '/dtr'}
          >
            View DTR
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => window.location.href = '/tasks'}
          >
            My Tasks
          </Button>
        </div>
      </div>
      {dtrActionError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {dtrActionError}
        </div>
      )}

      {/* Clock Card - Prominent */}
      <div className="mb-6">
        <ProperClockCard
          clockedIn={clockedIn}
          isOnBreak={isOnBreak}
          onClockIn={async () => {
            try {
                setDtrActionError(null);
              await clockIn();
              } catch (err: any) {
                setDtrActionError(err?.response?.data?.message || 'Failed to clock in');
              }
          }}
          onClockOut={async () => {
            try {
              // simple prompt for remarks — in-app modal could be implemented later
              const remarks = window.prompt('Enter clock-out remarks:') || '';
              if (!remarks.trim()) {
                alert('Remarks are required to clock out.');
                return;
              }
                setDtrActionError(null);
              await clockOut(remarks);
              } catch (err: any) {
                setDtrActionError(err?.response?.data?.message || 'Failed to clock out');
              }
          }}
          onStartBreak={async () => {
            try {
                setDtrActionError(null);
              await startBreak();
              } catch (err: any) {
                setDtrActionError(err?.response?.data?.message || 'Failed to start break');
              }
          }}
          onEndBreak={async () => {
            try {
                setDtrActionError(null);
              await endBreak();
              } catch (err: any) {
                setDtrActionError(err?.response?.data?.message || 'Failed to end break');
              }
          }}
        />
      </div>

      

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="DTR Analytics">
            <DTRAnalyticsWidget requiredHours={8} />
          </Card>

          <Card title="Task Brief">
            <TaskBriefWidget />
          </Card>
        </div>

        <Card title="Calendar">
          <CalendarWidget />
        </Card>
      </div>
    </div>
  );
}
