import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { getDashboardRouteForUser } from '../../lib/roleRoutes';

type SidebarItem = {
  label: string;
  href: string;
  visible: boolean;
};

function isActivePath(href: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.location.pathname === href;
}

export default function Sidebar() {
  const {
    user,
    getUserFullName,
    canAccessUserDirectory,
    canManageOwnDepartment,
    isIntern,
    logout,
  } = useAuthStore((state) => ({
    user: state.user,
    getUserFullName: state.getUserFullName,
    canAccessUserDirectory: state.canAccessUserDirectory,
    canManageOwnDepartment: state.canManageOwnDepartment,
    isIntern: state.isIntern,
    logout: state.logout,
  }));

  if (!user) {
    return null;
  }

  const dashboardPath = getDashboardRouteForUser(user);

  const items: SidebarItem[] = [
    {
      label: 'Dashboard',
      href: dashboardPath,
      visible: true,
    },
    {
      label: 'User Management',
      href: '/superadmin',
      visible: canAccessUserDirectory(),
    },
    {
      label: 'Records',
      href: '/dtr',
      visible: true,
    },
    {
      label: 'Tasks',
      href: '/tasks',
      visible: true,
    },
    {
      label: 'Profile',
      href: '/profile',
      visible: true,
    },
    {
      label: 'Internship',
      href: '/profile',
      visible: isIntern() || canManageOwnDepartment(),
    },
  ].filter((item) => item.visible);

  return (
    <div className="flex h-full flex-col justify-between p-4">
      <div className="space-y-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">TeamCA</p>
          <p className="text-xs text-slate-500">{getUserFullName()}</p>
        </div>

        <nav className="space-y-1">
          {items.map((item) => {
            const active = isActivePath(item.href);
            return (
              <a
                key={`${item.label}-${item.href}`}
                href={item.href}
                className={`block rounded-md px-3 py-2 text-sm transition ${
                  active
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>
      </div>

      <button
        type="button"
        onClick={() => {
          logout();
          window.location.replace('/login');
        }}
        className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
      >
        Logout
      </button>
    </div>
  );
}