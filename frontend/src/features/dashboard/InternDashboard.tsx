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
  DialogDescription, // ADDED: Imported DialogDescription to fix Radix UI accessibility warnings
} from '../../components/ui/Dialog';
import { WidgetSkeleton, CalendarSkeleton } from '../../components/ui/Skeleton';
import { internProfileService } from '../../services/internProfileService';
import type { InternProfile } from '../../types/user';
import InternProductivityHero from '../../components/widgets/InternProductivityHero';
import RecentCompletionsCard from '../../components/widgets/RecentCompletionsCard';
import ClockHistoryCard from '../../components/widgets/ClockHistoryCard';
import { productivityService } from '../../services/productivityService';
import type { ProductivitySummary } from '../../types/productivity';
import { useTaskListSocket } from '../../hooks/useTaskListSocket';

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
  const [productivity, setProductivity] = React.useState<ProductivitySummary | null>(null);
  const [productivityLoading, setProductivityLoading] = React.useState(true);

  // Active session's clock-in timestamp — used by the hero for context-aware
  // messaging (e.g. "you've been clocked in for 3h, consider a break").
  const currentClockInTime = React.useMemo<Date | null>(() => {
    if (!dtrRecords.length) return null;
    const latest = [...dtrRecords].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    )[0];
    const openClock = latest?.clocks?.find((c) => c.timeIn && !c.timeOut);
    return openClock?.timeIn ? new Date(openClock.timeIn) : null;
  }, [dtrRecords]);

  const refreshProductivity = React.useCallback(() => {
    setProductivityLoading(true);
    productivityService
      .getMine()
      .then((data) => setProductivity(data))
      .catch(() => setProductivity(null))
      .finally(() => setProductivityLoading(false));
  }, []);

  React.useEffect(() => {
    refreshProductivity();
  }, [refreshProductivity]);

  useTaskListSocket(refreshProductivity);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoadingWidgets(false), 600);
    return () => clearTimeout(timer);
  }, []);

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
        refreshProductivity();
      } catch {}
    },
    [refreshRecords, refreshProductivity],
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
    <div className="max-w-7xl mx-auto space-y-6">
      {/* 1. GLANCE — hero: greeting + weekly progress ring + 3 KPIs */}
      <InternProductivityHero
        summary={productivity}
        isLoading={productivityLoading}
        clockedIn={clockedIn}
        isOnBreak={isOnBreak}
        clockInTime={currentClockInTime}
        workingHours={user?.working_hours}
        workingDays={user?.working_days}
      />

      {dtrActionError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {dtrActionError}
        </div>
      )}

      {/* 2. ACT — clock card (primary daily action) */}
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

      {/* 3. Recent clock sessions */}
      <ClockHistoryCard
        records={dtrRecords}
        isLoading={isLoadingWidgets}
      />

      {/* 4. DRILL — task context (left) + time context (right) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Task brief" subtitle="What you're working on">
            {isLoadingWidgets ? <WidgetSkeleton lines={4} /> : <TaskBriefWidget />}
          </Card>
          <RecentCompletionsCard
            summary={productivity}
            isLoading={productivityLoading}
          />
        </div>

        <div className="space-y-6">
          <Card title="Calendar">
            {isLoadingWidgets ? <CalendarSkeleton /> : <CalendarWidget />}
          </Card>
          <Card title="DTR analytics" subtitle="Hours over time">
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
        </div>
      </div>

      <Dialog open={clockOutModalOpen} onOpenChange={setClockOutModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Clock Out</DialogTitle>
            {/* FIXED: Replaced standard <p> tag with <DialogDescription> to fulfill Radix UI aria-describedby accessibility requirements */}
            <DialogDescription className="text-sm text-gray-600">
              Please describe what you accomplished today.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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