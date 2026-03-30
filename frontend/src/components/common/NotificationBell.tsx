import React, { useEffect, useMemo, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { config } from '../../config/env';
import { useNotificationStore } from '../../store/notificationStore';
import type { NotificationItem } from '../../types/notification';

type NotificationBellProps = {
  compact?: boolean;
};

const DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

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

const formatDate = (value: string | Date) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return DATE_FORMATTER.format(date);
};

const getNotificationHref = (item: NotificationItem): string => {
  if (item.entity_type === 'task') {
    return '/tasks';
  }

  if (item.entity_type === 'user') {
    return '/users';
  }

  return '/notifications';
};

export default function NotificationBell({ compact = false }: NotificationBellProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const items = useNotificationStore((state) => state.items);
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
                    onClick={() => void markAsRead(item.notification_id)}
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
                    <p className="mt-1 text-xs text-slate-600">{item.message}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{formatDate(item.created_at)}</p>
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
