import { useEffect } from 'react';
import { useNotificationStore } from '../../store/notificationStore';
import { formatNotificationTimestamp } from '../../utils/dateUtils';

const resolveNotificationLink = (entityType?: string): string => {
  if (entityType === 'task') {
    return '/tasks';
  }

  if (entityType === 'user') {
    return '/users';
  }

  return '/dashboard';
};

const getNotificationHref = (item: { entity_type?: string; metadata?: Record<string, unknown> }): string => {
  const taskId = typeof item.metadata?.task_id === 'string' ? item.metadata.task_id : undefined;
  if (item.entity_type === 'task') {
    return taskId ? `/tasks?taskId=${encodeURIComponent(taskId)}` : '/tasks';
  }

  return resolveNotificationLink(item.entity_type);
};

const getTaskTitle = (item: { metadata?: Record<string, unknown> }): string | null => {
  const title = item.metadata?.task_title;
  return typeof title === 'string' && title.trim().length > 0 ? title.trim() : null;
};

const getTaskStatus = (item: { metadata?: Record<string, unknown> }): string | null => {
  const status = item.metadata?.task_status;
  return typeof status === 'string' && status.trim().length > 0 ? status.trim() : null;
};

const getMetadataString = (item: { metadata?: Record<string, unknown> }, key: string): string | null => {
  const value = item.metadata?.[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
};

const getChangedFields = (item: { metadata?: Record<string, unknown> }): string[] => {
  const value = item.metadata?.changed_fields;
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((field): field is string => typeof field === 'string' && field.trim().length > 0)
    .map((field) => field.replace(/_/g, ' ').trim());
};

const getStatusBadgeClass = (status: string) => {
  if (status === 'Completed') {
    return 'border-green-200 bg-green-50 text-green-700';
  }

  if (status === 'Under Review') {
    return 'border-amber-200 bg-amber-50 text-amber-700';
  }

  if (status === 'In Progress') {
    return 'border-blue-200 bg-blue-50 text-blue-700';
  }

  return 'border-slate-200 bg-slate-50 text-slate-700';
};

const getDeadlineBadgeClass = (type: 'due_today' | 'overdue') => {
  if (type === 'overdue') {
    return 'border-rose-200 bg-rose-50 text-rose-700';
  }

  return 'border-amber-200 bg-amber-50 text-amber-700';
};

const renderNotificationDetail = (item: {
  message: string;
  event_type: string;
  metadata?: Record<string, unknown>;
}) => {
  const taskTitle = getTaskTitle(item);
  const taskStatus = getTaskStatus(item);
  const actorFirstName = getMetadataString(item, 'actor_first_name') || 'Someone';
  const previousStatus = getMetadataString(item, 'previous_status');
  const newStatus = getMetadataString(item, 'new_status') || taskStatus;
  const changedFields = getChangedFields(item);

  if (item.event_type === 'task_details_updated' && taskTitle) {
    return (
      <p className="mt-1 flex flex-wrap items-center gap-x-1 gap-y-1 text-sm text-slate-600">
        <span>{actorFirstName}</span>
        <span>updated</span>
        {changedFields.length > 0
          ? changedFields.map((field) => (
              <span key={`field-${field}`} className="rounded-full border border-violet-200 bg-violet-50 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700">
                {field}
              </span>
            ))
          : <span>task details</span>}
        <span>for</span>
        <span className="font-semibold text-slate-800">"{taskTitle}"</span>
        <span>.</span>
      </p>
    );
  }

  if (item.event_type === 'task_deleted' && taskTitle) {
    return (
      <p className="mt-1 flex flex-wrap items-center gap-x-1 gap-y-1 text-sm text-slate-600">
        <span>{actorFirstName}</span>
        <span>deleted</span>
        <span className="font-semibold text-slate-800">"{taskTitle}"</span>
        {taskStatus ? (
          <>
            <span>with status</span>
            <span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${getStatusBadgeClass(taskStatus)}`}>
              {taskStatus}
            </span>
          </>
        ) : null}
        <span>.</span>
      </p>
    );
  }

  if (item.event_type === 'task_due_today' && taskTitle) {
    return (
      <p className="mt-1 flex flex-wrap items-center gap-x-1 gap-y-1 text-sm text-slate-600">
        <span>Make sure to submit your work on</span>
        <span className="font-semibold text-slate-800">"{taskTitle}"</span>
        <span>for reviewing.</span>
      </p>
    );
  }

  if (item.event_type === 'task_overdue' && taskTitle) {
    return (
      <p className="mt-1 flex flex-wrap items-center gap-x-1 gap-y-1 text-sm text-slate-600">
        <span>Please accomplish</span>
        <span className="font-semibold text-slate-800">"{taskTitle}"</span>
        <span>at your earliest convenience.</span>
      </p>
    );
  }

  const isStatusEvent = item.event_type === 'task_moved_back'
    || item.event_type === 'task_status_changed'
    || item.event_type === 'task_status_under_review'
    || item.event_type === 'task_status_completed';

  if (isStatusEvent && taskTitle && newStatus) {
    return (
      <p className="mt-1 flex flex-wrap items-center gap-x-1 gap-y-1 text-sm text-slate-600">
        <span>{actorFirstName}</span>
        {item.event_type === 'task_moved_back' && previousStatus ? <span>moved</span> : <span>changed status of</span>}
        <span className="font-semibold text-slate-800">"{taskTitle}"</span>
        {item.event_type === 'task_moved_back' && previousStatus ? (
          <>
            <span>back from</span>
            <span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${getStatusBadgeClass(previousStatus)}`}>
              {previousStatus}
            </span>
            <span>to</span>
          </>
        ) : (
          <span>to</span>
        )}
        <span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${getStatusBadgeClass(newStatus)}`}>
          {newStatus}
        </span>
        <span>.</span>
      </p>
    );
  }

  if (!taskTitle && !taskStatus) {
    return <p className="mt-1 text-sm text-slate-600">{item.message}</p>;
  }

  return (
    <p className="mt-1 flex flex-wrap items-center gap-x-1 gap-y-1 text-sm text-slate-600">
      {taskTitle ? <span className="font-semibold text-slate-800">"{taskTitle}"</span> : null}
      {taskStatus ? (
        <span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${getStatusBadgeClass(taskStatus)}`}>
          {taskStatus}
        </span>
      ) : null}
      <span>{item.message}</span>
    </p>
  );
};

export default function NotificationsPage() {
  const pageSize = 8;
  const items = useNotificationStore((state) => state.items);
  const loading = useNotificationStore((state) => state.loading);
  const page = useNotificationStore((state) => state.page);
  const totalPages = useNotificationStore((state) => state.totalPages);
  const fetchPage = useNotificationStore((state) => state.fetchPage);
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);

  useEffect(() => {
    void fetchPage(1, pageSize);
  }, [fetchPage, pageSize]);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (items.some((item) => !item.is_read)) {
      void markAllAsRead();
    }
  }, [items, loading, markAllAsRead]);

  const handleNotificationClick = async (
    event: React.MouseEvent<HTMLAnchorElement>,
    notificationId: string,
    href: string,
  ) => {
    event.preventDefault();
    await markAsRead(notificationId);
    window.location.assign(href);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Notifications</h1>
          <p className="mt-1 text-sm text-slate-500">See recent activity updates.</p>
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
                href={getNotificationHref(item)}
                onClick={(event) => void handleNotificationClick(event, item.notification_id, getNotificationHref(item))}
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
                {renderNotificationDetail(item)}
                <p className="mt-1 text-xs text-slate-400">{formatNotificationTimestamp(item.created_at)}</p>
              </a>
            ))}
          </div>
        ) : null}
      </section>

      <div className="flex items-center justify-between">
        <button
          type="button"
          disabled={page <= 1 || loading}
          onClick={() => void fetchPage(Math.max(1, page - 1), pageSize)}
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
          onClick={() => void fetchPage(Math.min(totalPages, page + 1), pageSize)}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
