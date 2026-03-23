import React from 'react';
import { useAuthStore } from '../../store/authStore';
import InternDashboard from './InternDashboard';
import AdminDashboard from './AdminDashboard';
import SuperadminDashboard from './SuperadminDashboard';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function Dashboard() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const isSuperadmin = useAuthStore((state) => state.isSuperadmin);
  const isAdmin = useAuthStore((state) => state.isAdmin);

  // Show spinner while Zustand store hydrates from localStorage
  if (typeof window === 'undefined') {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated || !user) {
    // DashboardLayout inline script handles the actual redirect;
    // show loading while that redirect processes
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (isSuperadmin()) {
    return <SuperadminDashboard />;
  }

  if (isAdmin()) {
    return <AdminDashboard />;
  }

  return <InternDashboard />;
}
