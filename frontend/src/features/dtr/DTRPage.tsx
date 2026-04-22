import React, { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import CalendarWidget from "../dashboard/components/CalendarWidget";
import DTRAnalyticsWidget from "../dashboard/components/DTRAnalyticsWidget";
import { dtrService } from "../../services/dtrService";
import type { DailyTimeRecord } from "../../types/dtr";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";

export default function DTRPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  const [mounted, setMounted] = useState(false);
  const [records, setRecords] = useState<DailyTimeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const activeClock = records
    .flatMap((r) => r.clocks)
    .find((c) => c.timeIn && !c.timeOut);

  const clockedIn = !!activeClock;
  const clockInTime = activeClock?.timeIn ? new Date(activeClock.timeIn) : null;

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    const fetchDTR = async () => {
      try {
        const data = await dtrService.getDTRRecords();
        setRecords(data);
      } catch (err) {
        console.error("Failed to fetch DTR:", err);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchDTR();
    }
  }, [isAuthenticated]);

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
      await dtrService.clockIn();

      const updated = await dtrService.getDTRRecords();
      setRecords(updated);
    } catch (err) {
      console.error("Clock-in failed:", err);
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
    if (!remarks.trim()) {
      alert("Remarks are required");
      return;
    }

    try {
      setSubmitting(true);

      await dtrService.clockOut(remarks); // ✅ PASS REMARKS

      const updated = await dtrService.getDTRRecords();
      setRecords(updated);

      // reset
      setRemarks("");
      setOpen(false);
    } catch (err) {
      console.error("Clock-out failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Daily Time Record</h1>
        <p className="text-sm text-gray-500 mt-1">
          Track your daily attendance and rendered hours
        </p>
      </div>

      {/* CLOCK CARD */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-700">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>

            <p className="text-2xl font-bold text-gray-900 mt-1">
              {new Date().toLocaleTimeString()}
            </p>

            {clockedIn && clockInTime && (
              <p className="text-sm text-green-600 mt-1">
                Clocked in since {clockInTime.toLocaleTimeString()}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                clockedIn
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {clockedIn ? "● Active" : "○ Not clocked in"}
            </div>

            {!clockedIn ? (
              <Button onClick={handleClockIn} variant="primary">
                Clock In
              </Button>
            ) : (
              <Button onClick={handleOpenClockOut} variant="danger">
                Clock Out
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Attendance Calendar" className="lg:col-span-1">
          <CalendarWidget />
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card title="Hours Summary" subtitle="Your internship hours progress">
            {loading ? (
              <p className="text-sm text-gray-500">Loading DTR...</p>
            ) : (
              <DTRAnalyticsWidget
                records={records}
                requiredHours={user?.required_hours || 0}
                workingHours={user?.working_hours}
              />
            )}
          </Card>
        </div>
      </div>

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
    </div>
  );
}
