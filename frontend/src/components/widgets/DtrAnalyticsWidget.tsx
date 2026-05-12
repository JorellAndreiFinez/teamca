import type { DailyTimeRecord } from "../../types/dtr";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { ProgressBarSkeleton } from "../ui/Skeleton";

type DtrAnalyticsWidgetProps = {
  records: DailyTimeRecord[];
  isLoading?: boolean;
};

export default function DtrAnalyticsWidget({
  records,
  isLoading = false,
}: DtrAnalyticsWidgetProps) {
  const totalHours = records.reduce(
    (sum, record) => sum + (record.totalHours ?? 0),
    0,
  );
  const presentDays = records.filter(
    (record) => record.attendanceStatus === "present" || record.status === "approved",
  ).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">DTR Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <ProgressBarSkeleton />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="h-20 animate-pulse rounded-md border border-slate-200 bg-slate-100" />
              <div className="h-20 animate-pulse rounded-md border border-slate-200 bg-slate-100" />
            </div>
          </div>
        ) : null}

        {!isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-slate-200 p-3">
              <p className="text-xs text-slate-500">Total Hours Rendered</p>
              <p className="text-xl font-semibold text-slate-900">
                {totalHours.toFixed(1)}
              </p>
            </div>
            <div className="rounded-md border border-slate-200 p-3">
              <p className="text-xs text-slate-500">Present Days</p>
              <p className="text-xl font-semibold text-slate-900">
                {presentDays}
              </p>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
