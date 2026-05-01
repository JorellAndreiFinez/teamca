import React, { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { CompactDTRSummary } from "../../components/compactDTRSummary";
import DTRHistoryTable from "./DTRHistoryTable";
import { useDtrStore } from "../../store/dtrStore";
import { dtrService } from "../../services/dtrService";
import type { DailyTimeRecord } from "../../types/dtr";
import { ReminderSettings } from "../../components/ReminderSettings";
import { ExportOptions } from "../../components/ExportOptions";
import { TimeAdjustmentForm } from "../../components/TimeAdjustmentForm";
import { TimeAdjustmentReview } from "../../components/TimeAdjustmentReview";

import {
  Dialog,
  DialogContent,
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
  const [historyFilters, setHistoryFilters] = useState({
    status: 'all',
    sort_by: 'date_desc',
  });

  const TIMEZONE_OFFSET = 8 * 60 * 60 * 1000; // PH (UTC+8)
  const toPHDateKey = (date: Date) => {
    return new Date(date.getTime() + TIMEZONE_OFFSET).toISOString().split("T")[0];
  };

  const activeClock = React.useMemo(() => {
    const todayKey = toPHDateKey(new Date());
    const todayRecord = records.find((record) => {
      const recordDate = new Date(record.date as any);
      return toPHDateKey(recordDate) === todayKey;
    });

    return todayRecord?.clocks?.find((c) => c.timeIn && !c.timeOut);
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
      } catch (err) {}
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

  /**
   * CLOCK IN
   */
  const handleClockIn = async () => {
    try {
      setActionError(null);
      await clockIn();
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
    // TODO: Open details modal/drawer
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
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-slate-900">Daily Time Record</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track your attendance, hours, and view full history
          </p>
          {actionError && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {actionError}
            </div>
          )}
        </div>
        
        {/* Simplified DTR Card on Right */}
        <div className="w-72 flex-shrink-0">
          <Card className="p-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Hours Worked
                </p>
                <p className="text-2xl font-semibold text-slate-900">
                  {formatMinutes(totalMinutesWorked)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Status</p>
                <p className="text-sm font-medium text-slate-700">
                  {isBreakActive
                    ? "On Break"
                    : isClockedIn
                      ? "Clocked In"
                      : "Not Clocked In"}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {!isClockedIn ? (
                <Button
                  onClick={handleClockIn}
                  className="w-full bg-blue-600 text-white hover:bg-blue-700"
                >
                  Clock In
                </Button>
              ) : (
                <Button
                  onClick={handleOpenClockOut}
                  className="w-full bg-red-600 text-white hover:bg-red-700"
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
                  className="w-full bg-amber-500 text-white hover:bg-amber-600"
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
    </div>
  );
}
