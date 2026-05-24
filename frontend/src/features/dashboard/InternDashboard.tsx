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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/Dialog';
import { WidgetSkeleton, CalendarSkeleton } from '../../components/ui/Skeleton';
import { internProfileService } from '../../services/internProfileService';
import type { InternProfile } from '../../types/user';

export default function InternDashboard() {
  const user = useAuthStore((state) => state.user);
  const userId = user?._id || user?.user_id;
  const dtrRecords = useDtrStore((state) => state.records);
  const clockedIn = useDtrStore((state) => state.clockedIn);
  const isOnBreak = useDtrStore((state) => state.isOnBreak);
  const refreshRecords = useDtrStore((state) => state.refreshRecords);
  const clockIn = useDtrStore((state) => state.clockIn);
  const clockOut = useDtrStore((state) => state.clockOut);
  const startBreak = useDtrStore((state) => state.startBreak);
  const endBreak = useDtrStore((state) => state.endBreak);
  const [dtrActionError, setDtrActionError] = React.useState<string | null>(null);
  const [isLoadingWidgets, setIsLoadingWidgets] = React.useState(true);
  const [internProfile, setInternProfile] = React.useState<InternProfile | null>(null);
  const [isLoadingInternProfile, setIsLoadingInternProfile] = React.useState(true);
  const [clockOutModalOpen, setClockOutModalOpen] = React.useState(false);
  const [clockOutRemarks, setClockOutRemarks] = React.useState('');
  const [clockOutSubmitting, setClockOutSubmitting] = React.useState(false);
  const [clockOutError, setClockOutError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoadingWidgets(false), 600);
    return () => clearTimeout(timer);
  }, []);

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

  React.useEffect(() => {
    let cancelled = false;

    const loadInternProfile = async () => {
      if (!userId) {
        setInternProfile(null);
        setIsLoadingInternProfile(false);
        return;
      }

      setIsLoadingInternProfile(true);

      try {
        const profile = await internProfileService.getInternProfileByUserId(userId);
        if (!cancelled) {
          setInternProfile(profile);
        }
      } catch {
        if (!cancelled) {
          setInternProfile(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingInternProfile(false);
        }
      }
    };

    void loadInternProfile();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Memoize socket callback to prevent recreation on every render
  const handleDtrSocketUpdate = React.useCallback(
    async () => {
      try {
        await refreshRecords();
      } catch {}
    },
    [refreshRecords],
  );

  // subscribe to DTR socket so dashboard updates live
  useDtrSocket(handleDtrSocketUpdate);

  const openClockOutModal = () => {
    setClockOutRemarks('');
    setClockOutError(null);
    setClockOutModalOpen(true);
  };

  const handleSubmitClockOut = async () => {
    const remarks = clockOutRemarks.trim();

    if (!remarks) {
      setClockOutError('Remarks are required to clock out.');
      return;
    }

    try {
      setClockOutSubmitting(true);
      setDtrActionError(null);
      setClockOutError(null);
      await clockOut(remarks);
      setClockOutRemarks('');
      setClockOutModalOpen(false);
      window.location.reload();
    } catch (err: any) {
      setClockOutError(err?.response?.data?.message || 'Failed to clock out');
    } finally {
      setClockOutSubmitting(false);
    }
  };

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
              window.location.reload();
              } catch (err: any) {
                setDtrActionError(err?.response?.data?.message || 'Failed to clock in');
              }
          }}
          onClockOut={openClockOutModal}
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
            {isLoadingWidgets || isLoadingInternProfile ? (
              <WidgetSkeleton lines={5} />
            ) : (
              <DTRAnalyticsWidget
                records={dtrRecords}
                requiredHours={internProfile?.required_hours ?? 0}
                renderedHours={internProfile?.rendered_hours_total}
                workingHours={user?.working_hours}
              />
            )}
          </Card>

          <Card title="Task Brief">
            {isLoadingWidgets ? <WidgetSkeleton lines={4} /> : <TaskBriefWidget />}
          </Card>
        </div>

        <Card title="Calendar">
          {isLoadingWidgets ? <CalendarSkeleton /> : <CalendarWidget />}
        </Card>
      </div>

      <Dialog open={clockOutModalOpen} onOpenChange={setClockOutModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Clock Out</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Please describe what you accomplished today.
            </p>
            {clockOutError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {clockOutError}
              </div>
            )}
            <textarea
              value={clockOutRemarks}
              onChange={(event) => {
                setClockOutRemarks(event.target.value);
                if (clockOutError) setClockOutError(null);
              }}
              placeholder="e.g. Finished assigned tasks, fixed bugs, attended team sync..."
              className="min-h-[120px] w-full resize-none rounded-md border border-slate-300 p-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              maxLength={300}
              disabled={clockOutSubmitting}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setClockOutModalOpen(false)}
                disabled={clockOutSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={handleSubmitClockOut}
                loading={clockOutSubmitting}
                disabled={!clockOutRemarks.trim()}
              >
                Submit & Clock Out
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
