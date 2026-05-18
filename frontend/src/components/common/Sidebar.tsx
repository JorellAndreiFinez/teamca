import React from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import NotificationBell from './NotificationBell';
import UserIdenticon from './UserIdenticon';
import { userService } from '../../services/userService';
import { config } from '../../config/env';
import type { NotificationItem } from '../../types/notification';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

function HomeIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function TaskIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function LogsIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  );
}

const isUserNotificationEvent = (eventType?: string): boolean => {
  return eventType === 'user_profile_updated'
    || eventType === 'user_role_changed'
    || eventType === 'user_activation_changed'
    || eventType === 'user_deleted';
};

export default function Sidebar() {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);
  const canManageUsers = useAuthStore((state) => state.canManageUsers);
  const canWhitelistEmails = useAuthStore((state) => state.canWhitelistEmails);
  const getUserFullName = useAuthStore((state) => state.getUserFullName);
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);

  const [mounted, setMounted] = React.useState(false);
  const [shouldAnimate, setShouldAnimate] = React.useState(false);
  const hasMounted = React.useRef(false);
  React.useEffect(() => { setMounted(true); }, []);

  React.useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }

    setShouldAnimate(true);
    const timeout = window.setTimeout(() => setShouldAnimate(false), 520);
    return () => window.clearTimeout(timeout);
  }, [sidebarOpen]);

  const currentUserId = React.useMemo(
    () => user?.user_id || user?._id,
    [user],
  );

  const refreshCurrentUser = React.useCallback(async () => {
    if (!currentUserId) {
      return;
    }

    try {
      const profile = await userService.getProfile(String(currentUserId));
      setUser(profile);
    } catch {
      // Keep existing UI state when a background sync fails.
    }
  }, [currentUserId, setUser]);

  const socket = React.useMemo<Socket | null>(() => {
    if (!token) {
      return null;
    }

    return io(config.backendUrl, {
      transports: ['websocket'],
      auth: { token },
      autoConnect: true,
    });
  }, [token]);

  React.useEffect(() => {
    if (!mounted || !token || !currentUserId) {
      return;
    }

    void refreshCurrentUser();
  }, [mounted, token, currentUserId, refreshCurrentUser]);

  React.useEffect(() => {
    if (!socket || !currentUserId) {
      return;
    }

    const onNotificationReceived = (payload: NotificationItem) => {
      if (!isUserNotificationEvent(payload?.event_type)) {
        return;
      }

      const notificationUserId =
        (typeof payload?.metadata?.user_id === 'string' && payload.metadata.user_id)
        || (typeof payload?.entity_id === 'string' && payload.entity_id)
        || null;

      if (!notificationUserId || String(notificationUserId) !== String(currentUserId)) {
        return;
      }

      if (payload.event_type === 'user_deleted') {
        logout();
        window.location.replace('/login');
        return;
      }

      void refreshCurrentUser();
    };

    socket.on('notification:received', onNotificationReceived);

    return () => {
      socket.off('notification:received', onNotificationReceived);
      socket.disconnect();
    };
  }, [currentUserId, logout, refreshCurrentUser, socket]);

  const currentPath = mounted && typeof window !== 'undefined' ? window.location.pathname : '';

  const baseNavItems: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: <HomeIcon /> },
    { label: 'DTR', href: '/dtr', icon: <ClockIcon /> },
    { label: 'Leave', href: '/leave', icon: <DocumentIcon /> },
    { label: 'Tasks', href: '/tasks', icon: <TaskIcon /> },
    { label: 'Profile', href: '/profile', icon: <ProfileIcon /> },
  ];

  const adminNavItems: NavItem[] = mounted && canManageUsers()
    ? [
        { label: 'User Directory', href: '/users', icon: <UsersIcon /> },
        { label: 'Departments', href: '/departments', icon: <FolderIcon /> },
      ]
    : [];

  const superadminNavItems: NavItem[] = mounted && canWhitelistEmails()
    ? [
        { label: 'DTR Reports', href: '/reports/dtr', icon: <ChartIcon /> },
        { label: 'Task Analytics', href: '/reports/tasks', icon: <ChartIcon /> },
        { label: 'Activity Logs', href: '/activity-logs', icon: <LogsIcon /> },
      ]
    : [];

  const navItems = [...baseNavItems, ...adminNavItems, ...superadminNavItems];

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  // Before mount, use placeholder values to match server render
  const fullName = mounted && user ? getUserFullName() : '';
  const identiconValue = mounted && user
    ? String(user.user_id || user._id || user.email || getUserFullName() || 'user')
    : 'user';
  const roleLabel = mounted && user
    ? user.global_role === 'Superadmin'
      ? 'Super Admin'
      : user.global_role === 'Admin'
      ? 'Admin'
      : user.departments?.[0]?.department_role || 'Intern'
    : '';

  if (!sidebarOpen) {
    return (
      <div className="fixed top-0 left-0 z-30 flex h-full w-16 flex-col border-r border-slate-800/70 bg-slate-950 shadow-2xl shadow-slate-950/40 transition-all duration-300 ease-in-out">
        <div className="flex h-16 items-center justify-center border-b border-slate-800/70">
          <button onClick={toggleSidebar} className="text-slate-400 transition-colors hover:text-white">
            <MenuIcon />
          </button>
        </div>
        <div className="flex items-center justify-center border-b border-slate-800/70 py-2">
          <NotificationBell compact />
        </div>
        <nav className="flex-1 py-4">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              title={item.label}
              className={`relative mx-2 mb-1 flex h-12 items-center justify-center rounded-xl transition-colors
                ${currentPath === item.href
                  ? 'bg-white/12 text-white shadow-sm shadow-slate-950/20'
                  : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}
            >
              {currentPath === item.href ? (
                <span className="absolute left-1 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-blue-400" />
              ) : null}
              {item.icon}
            </a>
          ))}
        </nav>
        <div className="border-t border-slate-800/70 p-2">
          <button
            onClick={handleLogout}
            title="Logout"
            className="flex h-10 w-full items-center justify-center rounded-xl text-red-100 transition-colors hover:bg-red-900/70 hover:text-red-200"
          >
            <LogoutIcon />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-0 left-0 z-30 flex h-full w-64 flex-col border-r border-slate-800/70 bg-slate-950 shadow-2xl shadow-slate-950/40 transition-all duration-300 ease-in-out">
      {/* Header */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-800/70 px-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-slate-900 shadow-lg shadow-blue-900/30">
          <span className="text-sm font-semibold text-white">TC</span>
        </div>
        <div className={`flex-1 ${shouldAnimate ? 'opacity-0 animate-fade-in' : ''}`}>
          <p className="text-sm font-semibold text-white">TeamCA</p>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">Intern Hub</p>
        </div>
        <NotificationBell />
        <button onClick={toggleSidebar} className="text-slate-400 transition-colors hover:text-white">
          <MenuIcon />
        </button>
      </div>

      {/* User info */}
      <div
        className={`border-b border-slate-800/70 px-4 py-3 ${shouldAnimate ? 'opacity-0 animate-fade-in' : ''}`}
        style={shouldAnimate ? { animationDelay: '60ms' } : undefined}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 shadow-inner">
            <UserIdenticon
              value={identiconValue}
              size={36}
              className="h-9 w-9"
              title="User avatar"
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{fullName}</p>
            <p className="text-xs text-slate-400">{roleLabel}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {/* core items */}
        {baseNavItems.map((item, idx) => (
          <a
            key={item.href}
            href={item.href}
            className={`relative mx-2 mb-0.5 flex items-center gap-3 rounded-xl px-4 py-2.5 transition-colors ${shouldAnimate ? 'opacity-0 animate-fade-in' : ''}
              ${currentPath === item.href
                ? 'bg-white/12 text-white shadow-sm shadow-slate-950/20'
                : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}
            style={shouldAnimate ? { animationDelay: `${100 + idx * 40}ms` } : undefined}
          >
            {currentPath === item.href ? (
              <span className="absolute left-2 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-blue-400" />
            ) : null}
            {item.icon}
            <span className="text-sm font-medium">{item.label}</span>
          </a>
        ))}

        {/* superadmin section */}
        {(adminNavItems.length > 0 || superadminNavItems.length > 0) && (
          <>
            <div
              className={`mb-1 mt-2 px-4 py-3 ${shouldAnimate ? 'opacity-0 animate-fade-in' : ''}`}
              style={shouldAnimate ? { animationDelay: '320ms' } : undefined}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">Administration</p>
            </div>
            {adminNavItems.map((item, idx) => (
              <a
                key={item.href}
                href={item.href}
                className={`relative mx-2 mb-0.5 flex items-center gap-3 rounded-xl px-4 py-2.5 transition-colors ${shouldAnimate ? 'opacity-0 animate-fade-in' : ''}
                  ${currentPath === item.href
                    ? 'bg-white/12 text-white shadow-sm shadow-slate-950/20'
                    : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}
                style={shouldAnimate ? { animationDelay: `${360 + idx * 40}ms` } : undefined}
              >
                {currentPath === item.href ? (
                  <span className="absolute left-2 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-blue-400" />
                ) : null}
                {item.icon}
                <span className="text-sm font-medium">{item.label}</span>
              </a>
            ))}
            {superadminNavItems.map((item, idx) => (
              <a
                key={item.href}
                href={item.href}
                className={`relative mx-2 mb-0.5 flex items-center gap-3 rounded-xl px-4 py-2.5 transition-colors ${shouldAnimate ? 'opacity-0 animate-fade-in' : ''}
                  ${currentPath === item.href
                    ? 'bg-white/12 text-white shadow-sm shadow-slate-950/20'
                    : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}
                style={shouldAnimate ? { animationDelay: `${400 + idx * 40}ms` } : undefined}
              >
                {currentPath === item.href ? (
                  <span className="absolute left-2 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-blue-400" />
                ) : null}
                {item.icon}
                <span className="text-sm font-medium">{item.label}</span>
              </a>
            ))}
          </>
        )}
      </nav>

      {/* Logout */}
      <div
        className={`border-t border-slate-800/70 p-3 ${shouldAnimate ? 'opacity-0 animate-fade-in' : ''}`}
        style={shouldAnimate ? { animationDelay: '500ms' } : undefined}
      >
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-red-100 transition-colors hover:bg-red-900/60 hover:text-red-200"
        >
          <LogoutIcon />
          <span className="text-sm font-medium">Log Out</span>
        </button>
      </div>
    </div>
  );
}