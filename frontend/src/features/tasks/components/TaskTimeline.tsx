import { useEffect, useMemo, useState } from 'react';
import Button from '../../../components/ui/Button';
import type { TaskStatusHistory } from '../../../types/task';

type TaskTimelineProps = {
  history: TaskStatusHistory[];
};

const PAGE_SIZE = 4;
const TIMELINE_ROW_HEIGHT_CLASS = 'h-20';

const TIMELINE_DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

const TIMELINE_TIME_FORMATTER = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
});

const formatTimelineDate = (value: string | Date) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return `${TIMELINE_DATE_FORMATTER.format(date)} (${TIMELINE_TIME_FORMATTER.format(date)})`;
};

const getUpdaterName = (item: TaskStatusHistory) => {
  if (!item.updated_by_user) {
    return 'Unknown user';
  }

  return `${item.updated_by_user.first_name} ${item.updated_by_user.last_name}`.trim() || item.updated_by_user.email;
};

export default function TaskTimeline({ history }: TaskTimelineProps) {
  const chronological = useMemo(() => [...history].reverse(), [history]);
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(chronological.length / PAGE_SIZE));
  const pageStart = (page - 1) * PAGE_SIZE;
  const pageEnd = pageStart + PAGE_SIZE;
  const visibleItems = chronological.slice(pageStart, pageEnd);
  const emptyRows = Math.max(0, PAGE_SIZE - visibleItems.length);

  useEffect(() => {
    setPage(1);
  }, [history]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-slate-900">Task Timeline</h4>
        {chronological.length > 0 ? (
          <p className="text-[11px] text-slate-500">
            Showing {pageStart + 1}-{Math.min(pageEnd, chronological.length)} of {chronological.length}
          </p>
        ) : null}
      </div>

      {!chronological.length ? (
        <p className="text-sm text-slate-500">No status history yet.</p>
      ) : (
        <div className="space-y-3">
          <div key={`timeline-page-${page}`} className="timeline-page divide-y divide-slate-100 rounded-md border border-slate-200">
            {visibleItems.map((item) => (
              <div key={item.history_id} className={`p-3 ${TIMELINE_ROW_HEIGHT_CLASS}`}>
                <p className="text-xs font-medium text-slate-700">
                  {item.previous_status} -&gt; {item.new_status}
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  {getUpdaterName(item)} {' • '} {formatTimelineDate(item.timestamp)}
                </p>
                {item.update_notes ? (
                  <p className="mt-1 overflow-hidden text-ellipsis whitespace-nowrap text-[11px] text-slate-600">
                    {item.update_notes}
                  </p>
                ) : null}
              </div>
            ))}

            {Array.from({ length: emptyRows }).map((_, index) => (
              <div key={`timeline-empty-${index}`} className={`bg-white/60 ${TIMELINE_ROW_HEIGHT_CLASS}`} />
            ))}
          </div>

          {totalPages > 1 ? (
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                Prev
              </Button>
              <span className="text-[11px] text-slate-600">
                {page} / {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              >
                Next
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
