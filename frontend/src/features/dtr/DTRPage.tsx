import React, { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { CompactDTRSummary } from "../../components/compactDTRSummary";
import DTRHistoryTable from "./DTRHistoryTable";
import DTRRecordDetailModal from "./DTRRecordDetailModal";
import { useDtrStore } from "../../store/dtrStore";
import { dtrService } from "../../services/dtrService";
import type { DailyTimeRecord } from "../../types/dtr";
import { ReminderSettings } from "../../components/ReminderSettings";
import { ExportOptions } from "../../components/ExportOptions";
import { TimeAdjustmentForm } from "../../components/TimeAdjustmentForm";
import { TimeAdjustmentReview } from "../../components/TimeAdjustmentReview";
import {
  ClockCardSkeleton,
  ProgressBarSkeleton,
  TableHeaderSkeleton,
  TableRowSkeleton,
  WidgetSkeleton,
} from "../../components/ui/Skeleton";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { useDtrSocket } from "./hooks/useDtrSocket";

export default function DTRPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const records = useDtrStore((state) => state.records);
  const clockedIn = useDtrStore((state) => state.clockedIn);
  const isOnBreak = useDtrStore((state) => state.isOnBreak);
  const refreshRecords = useDtrStore((state) => state.refreshRecords);
  const clockIn = useDtrStore((state) => state.clockIn);
  const clockOut = useDtrStore((state) => state.clockOut);
  const startBreak = useDtrStore((state) => state.startBreak);
  const endBreak = useDtrStore((state) => state.endBreak);

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [adjustmentDate, setAdjustmentDate] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Break state
  const [breakDuration, setBreakDuration] = useState(0);
  const [breakLoading, setBreakLoading] = useState(false);
  const [breakStartTime, setBreakStartTime] = useState<Date | null>(null);

  // History state
  const [historyRecords, setHistoryRecords] = useState<DailyTimeRecord[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLimit, setHistoryLimit] = useState(10);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Detail modal state
  const [selectedRecord, setSelectedRecord] = useState<DailyTimeRecord | null>(null);
  const [historyFilters, setHistoryFilters] = useState({
    status: 'all',
    sort_by: 'date_desc',
  });

  const activeClock = React.useMemo(() => {
    if (!records.length) return undefined;

    // Only check the most recent (today's) DTR record for open clocks
    // This prevents picking up stale unclosed entries from past days
    const today = records.sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];

    return today?.clocks?.find((c) => c.timeIn && !c.timeOut);
  }, [records]);

  const clockInTime = activeClock?.timeIn ? new Date(activeClock.timeIn) : null;
  const isClockedIn = Boolean(activeClock);
  const isBreakActive = isClockedIn && isOnBreak;

  const formatMinutes = (minutes: number) => {
    if (!Number.isFinite(minutes) || minutes <= 0) return "0h 0m";
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  const totalMinutesWorked = clockInTime
    ? Math.max(
      0,
      Math.floor((Date.now() - clockInTime.getTime()) / 60000) -
      (isBreakActive ? breakDuration : 0),
    )
    : 0;

  const syncBreakTimer = React.useCallback(() => {
    const activeBreak = activeClock?.breaks?.[activeClock.breaks.length - 1];
    if (activeBreak?.breakStart && !activeBreak.breakEnd) {
      setBreakStartTime(new Date(activeBreak.breakStart));
      setBreakDuration(
        Math.floor((Date.now() - new Date(activeBreak.breakStart).getTime()) / 60000),
      );
      return;
    }

    setBreakStartTime(null);
    setBreakDuration(0);
  }, [activeClock]);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    const fetchDTR = async () => {
      try {
        await refreshRecords();
      } catch (err) {
        // Handle error
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchDTR();
    }
  }, [isAuthenticated]);

  React.useEffect(() => {
    syncBreakTimer();
  }, [syncBreakTimer]);

  const fetchHistory = React.useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }

    try {
      setHistoryLoading(true);
      const result = await dtrService.getHistory(historyPage, historyLimit, historyFilters);
      setHistoryRecords(result.items);
      setHistoryTotal(result.total);
      setHistoryTotalPages(result.total_pages);
    } catch (err) {
      // Handle error
    } finally {
      setHistoryLoading(false);
    }
  }, [isAuthenticated, historyPage, historyLimit, historyFilters]);

  // Memoize socket callback to prevent recreation on every render
  const handleDtrSocketUpdate = React.useCallback(
    async (payload: any) => {
      try {
        await refreshRecords();
        await fetchHistory();
      } catch (err) { }
    },
    [refreshRecords, fetchHistory],
  );

  // subscribe to DTR socket updates so UI reflects global state changes
  useDtrSocket(handleDtrSocketUpdate);

  // Fetch history when page/limit/filters change
  React.useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Update break duration every second when on break
  React.useEffect(() => {
    if (!clockedIn || !breakStartTime) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - breakStartTime.getTime()) / 60000);
      setBreakDuration(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [clockedIn, breakStartTime]);

  if (!mounted) return null;

  if (!isAuthenticated) {
    window.location.replace("/login");
    return null;
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
          <div className="flex-1 space-y-2">
            <div className="h-8 w-72 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-96 animate-pulse rounded bg-slate-200" />
            <div className="h-10 w-64 animate-pulse rounded-xl bg-slate-200" />
          </div>
          <div className="w-full flex-shrink-0 lg:w-80">
            <ClockCardSkeleton />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <WidgetSkeleton lines={4} />
          <WidgetSkeleton lines={4} />
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="space-y-2">
            <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
            <ProgressBarSkeleton />
          </div>
          <TableHeaderSkeleton columnCount={6} />
          {Array.from({ length: 6 }).map((_, index) => (
            <TableRowSkeleton key={index} columnCount={6} />
          ))}
        </div>
      </div>
    );
  }

  /**
   * CLOCK IN
   */
  const handleClockIn = async () => {
    try {
      setActionError(null);
      await clockIn();
      window.location.reload();
    } catch (err) {
      const message = (err as any)?.response?.data?.message || "Failed to clock in";
      setActionError(message);
    }
  };

  /**
   * OPEN MODAL
   */
  const handleOpenClockOut = () => {
    setOpen(true);
  };

  /**
   * SUBMIT CLOCK OUT
   */
  const handleSubmitClockOut = async () => {
    const trimmedRemarks = remarks.trim();
    if (!trimmedRemarks) {
      alert("Remarks are required");
      return;
    }

    try {
      setSubmitting(true);
      setActionError(null);

      await clockOut(trimmedRemarks);

      // reset
      setRemarks("");
      setOpen(false);
      window.location.reload();
    } catch (err) {
      const message = (err as any)?.response?.data?.message || "Failed to clock out";
      setActionError(message);
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * START BREAK
   */
  const handleStartBreak = async () => {
    try {
      setBreakLoading(true);
      setActionError(null);
      await startBreak();
    } catch (err) {
      const message = (err as any)?.response?.data?.message || "Failed to start break";
      setActionError(message);
    } finally {
      setBreakLoading(false);
    }
  };

  /**
   * END BREAK
   */
  const handleEndBreak = async () => {
    try {
      setBreakLoading(true);
      setActionError(null);
      await endBreak();
    } catch (err) {
      const message = (err as any)?.response?.data?.message || "Failed to end break";
      setActionError(message);
    } finally {
      setBreakLoading(false);
    }
  };

  /**
   * HISTORY HANDLERS
   */
  const handleHistoryPageChange = (newPage: number) => {
    setHistoryPage(newPage);
  };

  const handleHistoryFilterChange = (filters: any) => {
    setHistoryFilters((prev) => ({ ...prev, ...filters }));
    setHistoryPage(1); // Reset to first page when filtering
  };

  const handleHistorySortChange = (sortBy: string) => {
    setHistoryFilters((prev) => ({ ...prev, sort_by: sortBy }));
    setHistoryPage(1);
  };

  const handleHistoryRowClick = (record: DailyTimeRecord) => {
    setSelectedRecord(record);
  };

  const handleHistoryEditClick = (record: DailyTimeRecord) => {
    const dateValue = record?.date ? new Date(record.date).toISOString().split("T")[0] : "";
    setAdjustmentDate(dateValue || null);
    setShowAdjustmentModal(true);
  };

  const handleDownloadHistory = () => {
    setShowExportModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* HEADER with Compact Clock */}
      <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-slate-900">Daily Time Record</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track your attendance, hours, and view full history
          </p>
          {actionError && (
            <div className="mt-3 rounded-xl border border-red-200/80 bg-red-50 px-3 py-2 text-sm text-red-700">
              {actionError}
            </div>
          )}
        </div>

        {/* Simplified DTR Card on Right */}
        <div className="w-full lg:w-80 flex-shrink-0">
          <Card className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Hours Worked
                </p>
                <p className="mt-1.5 text-2xl font-bold text-slate-900 tabular-nums">
                  {formatMinutes(totalMinutesWorked)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Status</p>
                <p className="mt-1.5 text-sm font-semibold text-slate-700">
                  {isBreakActive
                    ? "On Break"
                    : isClockedIn
                      ? "Clocked In"
                      : "Not Clocked In"}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {!isClockedIn ? (
                <Button
                  onClick={handleClockIn}
                  className="w-full"
                >
                  Clock In
                </Button>
              ) : (
                <Button
                  onClick={handleOpenClockOut}
                  variant="danger"
                  className="w-full"
                >
                  Clock Out
                </Button>
              )}

              {isClockedIn && (
                <Button
                  onClick={() => {
                    if (isBreakActive) {
                      handleEndBreak();
                    } else {
                      handleStartBreak();
                    }
                  }}
                  variant="secondary"
                  className="w-full"
                  disabled={breakLoading}
                >
                  {isBreakActive ? "End Break" : "Take Break"}
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* COMPACT SUMMARIES - 2 columns, secondary reference */}
      {user?.user_id && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-4">
            <CompactDTRSummary userId={user.user_id} period="week" />
          </Card>
          <Card className="p-4">
            <CompactDTRSummary userId={user.user_id} period="month" />
          </Card>
        </div>
      )}

      {/* ATTENDANCE HISTORY */}
      <Card className="p-0 overflow-hidden bg-transparent">
        <DTRHistoryTable
          records={historyRecords}
          page={historyPage}
          limit={historyLimit}
          total={historyTotal}
          total_pages={historyTotalPages}
          isLoading={historyLoading}
          onPageChange={handleHistoryPageChange}
          onRowClick={handleHistoryRowClick}
          onEditClick={handleHistoryEditClick}
          onFilterChange={handleHistoryFilterChange}
          onSortChange={handleHistorySortChange}
          onDownload={handleDownloadHistory}
          onRemind={() => setShowReminderModal(true)}
        />
      </Card>

      {/* 🔥 CLOCK OUT MODAL */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Clock Out</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Please describe what you accomplished today.
            </p>

            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Finished dashboard UI, fixed bugs..."
              className="w-full border rounded-md p-2 text-sm min-h-[120px]"
              maxLength={300}
            />

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>

              <Button
                onClick={handleSubmitClockOut}
                disabled={!remarks.trim() || submitting}
                variant="danger"
              >
                {submitting ? "Submitting..." : "Submit & Clock Out"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* REMINDER SETTINGS MODAL */}
      <Dialog open={showReminderModal} onOpenChange={setShowReminderModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>DTR Reminders</DialogTitle>
          </DialogHeader>
          <ReminderSettings />
        </DialogContent>
      </Dialog>

      {/* EXPORT MODAL */}
      <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Reports & Export</DialogTitle>
          </DialogHeader>
          <ExportOptions />
        </DialogContent>
      </Dialog>

      {/* TIME ADJUSTMENT MODAL */}
      <Dialog open={showAdjustmentModal} onOpenChange={setShowAdjustmentModal}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Time Adjustment Request</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TimeAdjustmentForm
              initialDate={adjustmentDate || undefined}
              onSubmitSuccess={() => setShowAdjustmentModal(false)}
            />
            {(user?.global_role === "Admin" || user?.global_role === "Superadmin" ||
              user?.departments?.some((d) => d.department_role === "Head")) ? (
              <TimeAdjustmentReview />
            ) : (
              <Card className="p-6">
                <h2 className="text-lg font-bold mb-4">My Requests</h2>
                <p className="text-gray-500">
                  View your submitted adjustment requests and their approval status here.
                </p>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
      {/* DTR RECORD DETAIL MODAL */}
      <DTRRecordDetailModal
        record={selectedRecord}
        open={Boolean(selectedRecord)}
        onClose={() => setSelectedRecord(null)}
      />
    </div>
  );
}
