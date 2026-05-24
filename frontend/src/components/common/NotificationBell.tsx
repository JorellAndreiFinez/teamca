import React, { useEffect, useMemo, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { config } from '../../config/env';
import { useNotificationStore } from '../../store/notificationStore';
import type { NotificationItem } from '../../types/notification';
import { formatNotificationTimestamp } from '../../utils/dateUtils';

type NotificationBellProps = {
  compact?: boolean;
};

const getToken = (): string | null => {
  try {
    const stored = localStorage.getItem('auth-storage');
    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored);
    return parsed?.state?.token || null;
  } catch {
    return null;
  }
};

const getNotificationHref = (item: NotificationItem): string => {
  const taskId = typeof item.metadata?.task_id === 'string' ? item.metadata.task_id : undefined;

  if (item.entity_type === 'task') {
    return taskId ? `/tasks?taskId=${encodeURIComponent(taskId)}` : '/tasks';
  }

  if (item.entity_type === 'user') {
    return '/users';
  }

  return '/notifications';
};

const getTaskTitle = (item: NotificationItem): string | null => {
  const title = item.metadata?.task_title;
  return typeof title === 'string' && title.trim().length > 0 ? title.trim() : null;
};

const getTaskStatus = (item: NotificationItem): string | null => {
  const status = item.metadata?.task_status;
  return typeof status === 'string' && status.trim().length > 0 ? status.trim() : null;
};

const getMetadataString = (item: NotificationItem, key: string): string | null => {
  const value = item.metadata?.[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
};

const getChangedFields = (item: NotificationItem): string[] => {
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

const renderNotificationDetail = (item: NotificationItem) => {
  const taskTitle = getTaskTitle(item);
  const taskStatus = getTaskStatus(item);
  const actorFirstName = getMetadataString(item, 'actor_first_name') || 'Someone';
  const previousStatus = getMetadataString(item, 'previous_status');
  const newStatus = getMetadataString(item, 'new_status') || taskStatus;
  const changedFields = getChangedFields(item);

  if (item.event_type === 'task_details_updated' && taskTitle) {
    return (
      <p className="mt-1 flex flex-wrap items-center gap-x-1 gap-y-1 text-xs text-slate-600">
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
      <p className="mt-1 flex flex-wrap items-center gap-x-1 gap-y-1 text-xs text-slate-600">
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
      <p className="mt-1 flex flex-wrap items-center gap-x-1 gap-y-1 text-xs text-slate-600">
        <span>Make sure to submit your work on</span>
        <span className="font-semibold text-slate-800">"{taskTitle}"</span>
        <span>for reviewing.</span>
      </p>
    );
  }

  if (item.event_type === 'task_overdue' && taskTitle) {
    return (
      <p className="mt-1 flex flex-wrap items-center gap-x-1 gap-y-1 text-xs text-slate-600">
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
      <p className="mt-1 flex flex-wrap items-center gap-x-1 gap-y-1 text-xs text-slate-600">
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
    return <p className="mt-1 text-xs text-slate-600">{item.message}</p>;
  }

  return (
    <p className="mt-1 flex flex-wrap items-center gap-x-1 gap-y-1 text-xs text-slate-600">
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

export default function NotificationBell({ compact = false }: NotificationBellProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const items = useNotificationStore((state) => state.items);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const hasDeadlineAlert = useNotificationStore((state) => state.hasDeadlineAlert);
  const loading = useNotificationStore((state) => state.loading);
  const isOpen = useNotificationStore((state) => state.isOpen);
  const toggleOpen = useNotificationStore((state) => state.toggleOpen);
  const setOpen = useNotificationStore((state) => state.setOpen);
  const fetchLatest = useNotificationStore((state) => state.fetchLatest);
  const prependNotification = useNotificationStore((state) => state.prependNotification);
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);

  const socket = useMemo<Socket | null>(() => {
    const token = getToken();
    if (!token) {
      return null;
    }

    return io(config.backendUrl, {
      transports: ['websocket'],
      auth: { token },
      autoConnect: true,
    });
  }, []);

  useEffect(() => {
    void fetchLatest();
  }, [fetchLatest]);

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handler = (payload: NotificationItem) => {
      prependNotification(payload);
    };

    socket.on('notification:received', handler);

    return () => {
      socket.off('notification:received', handler);
      socket.disconnect();
    };
  }, [prependNotification, socket]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current) {
        return;
      }

      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [setOpen]);

  const dropdownClass = compact
    ? 'absolute left-full top-0 z-50 ml-4 w-80 rounded-xl border border-slate-200 bg-white shadow-xl'
    : 'absolute left-full top-0 z-50 ml-4 w-80 rounded-xl border border-slate-200 bg-white shadow-xl';

  const visibleItems = useMemo(() => {
    const unread = items.filter((item) => !item.is_read);
    const latestRead = items.filter((item) => item.is_read).slice(0, 3);
    return [...unread, ...latestRead];
  }, [items]);

  const handleNotificationClick = async (
    event: React.MouseEvent<HTMLAnchorElement>,
    item: NotificationItem,
  ) => {
    const href = getNotificationHref(item);
    event.preventDefault();
    await markAsRead(item.notification_id);
    setOpen(false);
    window.location.assign(href);
  };

  return (
    <div ref={rootRef} className={compact ? 'relative' : 'relative'}>
      <button
        type="button"
        onClick={toggleOpen}
        className={compact
          ? 'relative flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-white'
          : 'relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-slate-800 hover:text-white'}
        aria-label="Notifications"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0a3 3 0 1 1-6 0m6 0H9" />
        </svg>
        {hasDeadlineAlert ? (
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-amber-400" aria-label="Deadline alert" />
        ) : unreadCount > 0 ? (
          <span className="absolute right-1 top-1 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className={dropdownClass} style={{ maxHeight: 'calc(100vh - 2rem)' }}>
          <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
            <p className="text-sm font-semibold text-slate-900">Notifications</p>
            <button
              type="button"
              onClick={() => void markAllAsRead()}
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              Mark all read
            </button>
          </div>

          <div className="overflow-y-auto p-2" style={{ maxHeight: 'calc(100vh - 9.5rem)' }}>
            {loading ? <p className="px-2 py-3 text-sm text-slate-500">Loading...</p> : null}

            {!loading && visibleItems.length === 0 ? <p className="px-2 py-3 text-sm text-slate-500">No notifications yet.</p> : null}

            {!loading
              ? visibleItems.map((item) => (
                  <a
                    key={item.notification_id}
                    href={getNotificationHref(item)}
                    onClick={(event) => void handleNotificationClick(event, item)}
                    className={`mb-1 block rounded-lg border px-3 py-2 transition-colors ${
                      item.is_read
                        ? 'border-transparent bg-white hover:bg-slate-50'
                        : 'border-blue-100 bg-blue-50/70 hover:bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm ${item.is_read ? 'font-medium text-slate-800' : 'font-semibold text-slate-900'}`}>
                        {item.title}
                      </p>
                      {!item.is_read ? <span className="mt-1 h-2 w-2 rounded-full bg-blue-500" /> : null}
                    </div>
                    {renderNotificationDetail(item)}
                    <p className="mt-1 text-[11px] text-slate-400">{formatNotificationTimestamp(item.created_at)}</p>
                  </a>
                ))
              : null}
          </div>

          <div className="border-t border-slate-200 px-3 py-2">
            <a href="/notifications" className="text-xs font-medium text-blue-600 hover:text-blue-700">
              View all notifications
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}
