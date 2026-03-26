// frontend\src\features\dashboard\AdminDashboard.tsx

import React from "react";
import { useAuthStore } from "../../store/authStore";
import Card from "../../components/ui/Card";
import TaskBriefWidget from "./components/TaskBriefWidget";
import Button from "../../components/ui/Button";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  change?: string;
}

function StatCard({ label, value, icon, color, change }: StatCardProps) {
  return (
    <div className={`rounded-xl p-5 border ${color}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-600">{label}</span>
        <div className="w-9 h-9 rounded-lg bg-white/60 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {change && <p className="text-xs text-gray-500 mt-1">{change}</p>}
    </div>
  );
}

function UsersIcon() {
  return (
    <svg
      className="w-5 h-5 text-blue-600"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}

function TaskIcon() {
  return (
    <svg
      className="w-5 h-5 text-green-600"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      className="w-5 h-5 text-orange-600"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function DeptIcon() {
  return (
    <svg
      className="w-5 h-5 text-purple-600"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
      />
    </svg>
  );
}

export default function AdminDashboard() {
  const user = useAuthStore((state) => state.user);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const stats = [
    {
      label: "Total Interns",
      value: 24,
      icon: <UsersIcon />,
      color: "bg-blue-50 border-blue-100",
      change: "+3 this month",
    },
    {
      label: "Active Tasks",
      value: 18,
      icon: <TaskIcon />,
      color: "bg-green-50 border-green-100",
      change: "5 due this week",
    },
    {
      label: "Avg. Hours Rendered",
      value: "312h",
      icon: <ClockIcon />,
      color: "bg-orange-50 border-orange-100",
      change: "65% of required",
    },
    {
      label: "Departments",
      value: 4,
      icon: <DeptIcon />,
      color: "bg-purple-50 border-purple-100",
      change: "All active",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {greeting()}, {user?.first_name ?? "Admin"}! 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => (window.location.href = "/users")}
          >
            Manage Users
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => (window.location.href = "/tasks")}
          >
            Manage Tasks
          </Button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task overview */}
        <Card title="Recent Tasks" subtitle="Tasks requiring attention">
          <TaskBriefWidget />
        </Card>

        {/* Attendance overview */}
        <Card
          title="Attendance Overview"
          subtitle="Department attendance this week"
        >
          <div className="space-y-3">
            {[
              { dept: "Engineering", present: 8, total: 10 },
              { dept: "Design", present: 5, total: 6 },
              { dept: "Marketing", present: 4, total: 5 },
              { dept: "Operations", present: 3, total: 3 },
            ].map((d) => (
              <div key={d.dept}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{d.dept}</span>
                  <span className="text-gray-500">
                    {d.present}/{d.total} present
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${(d.present / d.total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
