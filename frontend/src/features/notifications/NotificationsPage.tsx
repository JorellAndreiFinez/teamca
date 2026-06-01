import { useEffect } from 'react';
import { useNotificationStore } from '../../store/notificationStore';
import { formatNotificationTimestamp } from '../../utils/dateUtils';
import { ActivityListItemSkeleton } from '../../components/ui/Skeleton';

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

// Returns an inline SVG icon element appropriate for each notification event type.
const getNotificationIcon = (eventType: string) => {
  // Task deadline alerts
  if (eventType === 'task_overdue') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    );
  }

  if (eventType === 'task_due_today') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
      </svg>
    );
  }

  // Task deleted
  if (eventType === 'task_deleted') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    );
  }

  // Task details updated
  if (eventType === 'task_details_updated') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
      </svg>
    );
  }

  // Status change / moved back / completed / under review
  if (
    eventType === 'task_status_completed'
  ) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    );
  }

  if (eventType === 'task_status_under_review') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path d="M9 9a2 2 0 114 0 2 2 0 01-4 0z" />
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a4 4 0 00-3.446 6.032l-2.261 2.26a1 1 0 101.414 1.415l2.261-2.261A4 4 0 1011 5z" clipRule="evenodd" />
      </svg>
    );
  }

  if (eventType === 'task_moved_back' || eventType === 'task_status_changed') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
      </svg>
    );
  }

  // Default: bell icon
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
    </svg>
  );
};

// Returns tailwind classes for the icon container background / text color per event type.
const getNotificationIconStyle = (eventType: string, isRead: boolean): string => {
  if (!isRead) {
    if (eventType === 'task_overdue') return 'bg-rose-100 text-rose-600';
    if (eventType === 'task_due_today') return 'bg-amber-100 text-amber-600';
    if (eventType === 'task_deleted') return 'bg-red-100 text-red-500';
    if (eventType === 'task_status_completed') return 'bg-green-100 text-green-600';
    if (eventType === 'task_status_under_review') return 'bg-amber-100 text-amber-600';
    if (eventType === 'task_details_updated') return 'bg-violet-100 text-violet-600';
    if (eventType === 'task_moved_back' || eventType === 'task_status_changed') return 'bg-blue-100 text-blue-600';
    return 'bg-blue-100 text-blue-600';
  }

  if (eventType === 'task_overdue') return 'bg-rose-50 text-rose-400';
  if (eventType === 'task_due_today') return 'bg-amber-50 text-amber-400';
  if (eventType === 'task_deleted') return 'bg-slate-100 text-slate-400';
  if (eventType === 'task_status_completed') return 'bg-green-50 text-green-400';
  if (eventType === 'task_status_under_review') return 'bg-amber-50 text-amber-400';
  if (eventType === 'task_details_updated') return 'bg-violet-50 text-violet-400';
  if (eventType === 'task_moved_back' || eventType === 'task_status_changed') return 'bg-slate-100 text-slate-400';
  return 'bg-slate-100 text-slate-400';
};

// Returns the label for a quick action button, or null if no action applies.
const getQuickActionLabel = (item: { entity_type?: string; event_type: string }): string | null => {
  if (item.entity_type === 'task') {
    if (item.event_type === 'task_deleted') return null;
    return 'View Task';
  }

  if (item.entity_type === 'user') return 'View User';

  return null;
};

// Groups items into Today / Yesterday / Earlier buckets based on created_at.
type DateGroup = 'Today' | 'Yesterday' | 'Earlier';

const getDateGroup = (createdAt: Date | string): DateGroup => {
  const now = new Date();
  const date = new Date(createdAt);

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  if (date >= todayStart) return 'Today';
  if (date >= yesterdayStart) return 'Yesterday';
  return 'Earlier';
};

const groupNotificationsByDate = <T extends { created_at: Date | string }>(
  items: T[],
): { group: DateGroup; items: T[] }[] => {
  const groups: Record<DateGroup, T[]> = { Today: [], Yesterday: [], Earlier: [] };

  for (const item of items) {
    groups[getDateGroup(item.created_at)].push(item);
  }

  return (['Today', 'Yesterday', 'Earlier'] as DateGroup[])
    .filter((g) => groups[g].length > 0)
    .map((g) => ({ group: g, items: groups[g] }));
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

  const handleQuickAction = async (
    event: React.MouseEvent<HTMLButtonElement>,
    notificationId: string,
    href: string,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    await markAsRead(notificationId);
    window.location.assign(href);
  };

  const groupedItems = groupNotificationsByDate(items);

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

      <section className="rounded-xl p-3">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <ActivityListItemSkeleton key={index} />
            ))}
          </div>
        ) : null}

        {!loading && items.length === 0 ? (
          <p className="p-3 text-sm text-slate-500">No notifications yet.</p>
        ) : null}

        {!loading ? (
          <div className="space-y-5">
            {groupedItems.map(({ group, items: groupItems }) => (
              <div key={group}>
                {/* Date group label */}
                <div className="mb-2 flex items-center gap-2 px-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {group}
                  </span>
                  <div className="h-px flex-1 bg-slate-100" />
                </div>

                <div className="space-y-2">
                  {groupItems.map((item) => {
                    const href = getNotificationHref(item);
                    const quickActionLabel = getQuickActionLabel(item);
                    const iconStyle = getNotificationIconStyle(item.event_type, item.is_read);

                    return (
                      <a
                        key={item.notification_id}
                        href={href}
                        onClick={(event) => void handleNotificationClick(event, item.notification_id, href)}
                        className={`group flex gap-3 rounded-lg border px-3 py-3 transition-colors sm:px-4 ${
                          item.is_read
                            ? 'border-slate-200 bg-white hover:bg-slate-50'
                            : 'border-blue-100 bg-blue-50/70 hover:bg-blue-50'
                        }`}
                      >
                        {/* Event type icon */}
                        <div className="mt-0.5 shrink-0">
                          <span className={`flex h-7 w-7 items-center justify-center rounded-full ${iconStyle}`}>
                            {getNotificationIcon(item.event_type)}
                          </span>
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm leading-snug ${item.is_read ? 'font-medium text-slate-800' : 'font-semibold text-slate-900'}`}>
                              {item.title}
                            </p>
                            <div className="flex shrink-0 items-center gap-2">
                              <p className="hidden text-xs text-slate-400 sm:block">
                                {formatNotificationTimestamp(item.created_at)}
                              </p>
                              {!item.is_read ? (
                                <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                              ) : null}
                            </div>
                          </div>

                          {renderNotificationDetail(item)}

                          {/* Footer row: timestamp (mobile) + quick action */}
                          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs text-slate-400 sm:hidden">
                              {formatNotificationTimestamp(item.created_at)}
                            </p>
                            {quickActionLabel ? (
                              <button
                                type="button"
                                onClick={(event) => void handleQuickAction(event, item.notification_id, href)}
                                className="ml-auto rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 opacity-0 transition-opacity hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 group-hover:opacity-100 focus:opacity-100"
                              >
                                {quickActionLabel} →
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
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