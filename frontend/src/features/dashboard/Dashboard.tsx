// frontend\src\features\dashboard\Dashboard.tsx

import { useEffect, useState } from "react";
import { useAuthStore } from "../../store/authStore";
import InternDashboard from "./InternDashboard";
import AdminDashboard from "./AdminDashboard";
import SuperadminDashboard from "./SuperadminDashboard";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const isSuperadmin = useAuthStore((state) => state.isSuperadmin);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Derived role (no crash)
  const isAdmin = user?.global_role === "Admin";

  // keep spinner up until verification
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (isSuperadmin()) {
    return <SuperadminDashboard />;
  }

  if (isAdmin) {
    return <AdminDashboard />;
  }

  return <InternDashboard />;
}
