import { useEffect } from 'react';
import { useNotificationStore } from '../../store/notificationStore';

const DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

const formatDate = (value: string | Date) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return DATE_FORMATTER.format(date);
};

const resolveNotificationLink = (entityType?: string): string => {
  if (entityType === 'task') {
    return '/tasks';
  }

  if (entityType === 'user') {
    return '/users';
  }

  return '/dashboard';
};

export default function NotificationsPage() {
  const items = useNotificationStore((state) => state.items);
  const loading = useNotificationStore((state) => state.loading);
  const page = useNotificationStore((state) => state.page);
  const totalPages = useNotificationStore((state) => state.totalPages);
  const fetchPage = useNotificationStore((state) => state.fetchPage);
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);

  useEffect(() => {
    void fetchPage(1, 30);
  }, [fetchPage]);

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Notifications</h1>
          <p className="mt-1 text-sm text-slate-500">Recent activity updates</p>
        </div>

        <button
          type="button"
          onClick={() => void markAllAsRead()}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Mark all as read
        </button>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-3">
        {loading ? <p className="p-3 text-sm text-slate-500">Loading notifications...</p> : null}

        {!loading && items.length === 0 ? <p className="p-3 text-sm text-slate-500">No notifications yet.</p> : null}

        {!loading ? (
          <div className="space-y-2">
            {items.map((item) => (
              <a
                key={item.notification_id}
                href={resolveNotificationLink(item.entity_type)}
                onClick={() => void markAsRead(item.notification_id)}
                className={`block rounded-lg border px-3 py-3 transition-colors ${
                  item.is_read ? 'border-slate-200 bg-white hover:bg-slate-50' : 'border-blue-100 bg-blue-50/70 hover:bg-blue-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-sm ${item.is_read ? 'font-medium text-slate-800' : 'font-semibold text-slate-900'}`}>
                    {item.title}
                  </p>
                  {!item.is_read ? <span className="h-2 w-2 rounded-full bg-blue-500" /> : null}
                </div>
                <p className="mt-1 text-sm text-slate-600">{item.message}</p>
                <p className="mt-1 text-xs text-slate-400">{formatDate(item.created_at)}</p>
              </a>
            ))}
          </div>
        ) : null}
      </section>

      <div className="flex items-center justify-between">
        <button
          type="button"
          disabled={page <= 1 || loading}
          onClick={() => void fetchPage(Math.max(1, page - 1), 30)}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>
        <p className="text-sm text-slate-500">
          Page {page} of {totalPages}
        </p>
        <button
          type="button"
          disabled={page >= totalPages || loading}
          onClick={() => void fetchPage(Math.min(totalPages, page + 1), 30)}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
