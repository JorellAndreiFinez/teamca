import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { dtrService } from '../../services/dtrService';
import type { DailyTimeRecord } from '../../types/dtr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import DtrAnalyticsWidget from '../../components/widgets/DtrAnalyticsWidget';

export default function DtrPageContent() {
  const { user, isIntern, canManageOwnDepartment, canViewAllDepartments } = useAuthStore((state) => ({
    user: state.user,
    isIntern: state.isIntern,
    canManageOwnDepartment: state.canManageOwnDepartment,
    canViewAllDepartments: state.canViewAllDepartments,
  }));

  const [records, setRecords] = useState<DailyTimeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      return;
    }

    const loadRecords = async () => {
      setIsLoading(true);
      try {
        const data = await dtrService.getDTRRecords(user.user_id);
        setRecords(data);
      } catch {
        setRecords([]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadRecords();
  }, [user]);

  const recentRecords = useMemo(() => records.slice(0, 10), [records]);

  return (
    <div className="space-y-4 p-4">
      <section>
        <h1 className="text-2xl font-semibold text-slate-900">Records</h1>
        <p className="text-sm text-slate-500">Daily time record and attendance overview</p>
      </section>

      <DtrAnalyticsWidget records={records} isLoading={isLoading} />

      {!isIntern() && (canManageOwnDepartment() || canViewAllDepartments()) ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Team DTR Scope</CardTitle>
            <CardDescription>
              Team and company-level attendance endpoints can be integrated here once DTR summary APIs are finalized.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Records</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? <p className="text-sm text-slate-500">Loading records...</p> : null}

          {!isLoading && recentRecords.length === 0 ? (
            <p className="text-sm text-slate-500">No DTR records available yet.</p>
          ) : null}

          {!isLoading && recentRecords.length > 0 ? (
            <ul className="space-y-2">
              {recentRecords.map((record) => (
                <li key={record.dtr_id} className="rounded-md border border-slate-200 p-3">
                  <p className="text-sm font-medium text-slate-900">
                    {new Date(record.date).toLocaleDateString()} • {record.status}
                  </p>
                  <p className="text-xs text-slate-500">Hours rendered: {record.hours_rendered ?? 0}</p>
                </li>
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}