import type { DailyTimeRecord } from '../../types/dtr';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

type DtrAnalyticsWidgetProps = {
  records: DailyTimeRecord[];
  isLoading?: boolean;
};

export default function DtrAnalyticsWidget({ records, isLoading = false }: DtrAnalyticsWidgetProps) {
  const totalHours = records.reduce((sum, record) => sum + (record.hours_rendered ?? 0), 0);
  const presentDays = records.filter((record) => record.status === 'Present').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">DTR Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? <p className="text-sm text-slate-500">Loading DTR analytics...</p> : null}

        {!isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-slate-200 p-3">
              <p className="text-xs text-slate-500">Total Hours Rendered</p>
              <p className="text-xl font-semibold text-slate-900">{totalHours.toFixed(1)}</p>
            </div>
            <div className="rounded-md border border-slate-200 p-3">
              <p className="text-xs text-slate-500">Present Days</p>
              <p className="text-xl font-semibold text-slate-900">{presentDays}</p>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}