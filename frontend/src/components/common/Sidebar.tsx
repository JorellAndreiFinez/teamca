import React from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import NotificationBell from './NotificationBell';
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
  React.useEffect(() => { setMounted(true); }, []);

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
  const fullName = mounted ? getUserFullName() : '';
  const initials = mounted && user ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.trim() || 'U' : 'U';
  const roleLabel = mounted
    ? user?.global_role === 'Superadmin'
      ? 'Super Admin'
      : user?.global_role === 'Admin'
      ? 'Admin'
      : user?.departments?.[0]?.department_role || 'Intern'
    : '';

  if (!sidebarOpen) {
    return (
      <div className="fixed top-0 left-0 h-full z-30 flex flex-col bg-slate-900 w-16 shadow-xl transition-all duration-300 ease-in-out">
        <div className="flex items-center justify-center h-16 border-b border-slate-700">
          <button onClick={toggleSidebar} className="text-slate-400 hover:text-white transition-colors">
            <MenuIcon />
          </button>
        </div>
        <div className="flex items-center justify-center border-b border-slate-700 py-2">
          <NotificationBell compact />
        </div>
        <nav className="flex-1 py-4">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              title={item.label}
              className={`flex items-center justify-center h-12 mx-2 rounded-lg transition-colors mb-1
                ${currentPath === item.href
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              {item.icon}
            </a>
          ))}
        </nav>
        <div className="p-2 border-t border-slate-700">
          <button
            onClick={handleLogout}
            title="Logout"
            className="flex items-center justify-center w-full h-10 rounded-lg text-slate-400 hover:bg-red-900 hover:text-red-300 transition-colors"
          >
            <LogoutIcon />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-0 left-0 h-full z-30 flex flex-col bg-slate-900 w-64 shadow-xl transition-all duration-300 ease-in-out">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-700">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 flex-shrink-0">
          <span className="text-white font-bold text-sm">TC</span>
        </div>
        <span className="text-white font-semibold text-lg flex-1 opacity-0 animate-fade-in">TeamCA</span>
        <NotificationBell />
        <button onClick={toggleSidebar} className="text-slate-400 hover:text-white transition-colors">
            <MenuIcon />
          </button>
        </div>

      {/* User info */}
      <div className="px-4 py-3 border-b border-slate-700 opacity-0 animate-fade-in" style={{ animationDelay: '60ms' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-semibold">
              {initials}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{fullName}</p>
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
            className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-colors mb-0.5 opacity-0 animate-fade-in
              ${currentPath === item.href
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            style={{ animationDelay: `${100 + idx * 40}ms` }}
          >
            {item.icon}
            <span className="text-sm font-medium">{item.label}</span>
          </a>
        ))}

        {/* superadmin section */}
        {(adminNavItems.length > 0 || superadminNavItems.length > 0) && (
          <>
            <div className="px-4 py-3 mt-2 mb-1 opacity-0 animate-fade-in" style={{ animationDelay: '320ms' }}>
              <p className="text-xs uppercase tracking-wide font-semibold text-slate-500">superadmin</p>
            </div>
            {adminNavItems.map((item, idx) => (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-colors mb-0.5 opacity-0 animate-fade-in
                  ${currentPath === item.href
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                style={{ animationDelay: `${360 + idx * 40}ms` }}
              >
                {item.icon}
                <span className="text-sm font-medium">{item.label}</span>
              </a>
            ))}
            {superadminNavItems.map((item, idx) => (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-colors mb-0.5 opacity-0 animate-fade-in
                  ${currentPath === item.href
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                style={{ animationDelay: `${400 + idx * 40}ms` }}
              >
                {item.icon}
                <span className="text-sm font-medium">{item.label}</span>
              </a>
            ))}
          </>
        )}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-slate-700 opacity-0 animate-fade-in" style={{ animationDelay: '500ms' }}>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-slate-400 hover:bg-red-900/50 hover:text-red-300 transition-colors"
        >
          <LogoutIcon />
          <span className="text-sm font-medium">Log Out</span>
        </button>
      </div>
    </div>
  );
}