// frontend\src\features\dashboard\AdminDashboard.tsx

import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "../../store/authStore";
import Card from "../../components/ui/Card";
import TaskBriefWidget from "./components/TaskBriefWidget";
import DashboardStatCard from "./components/DashboardStatCard";
import Button from "../../components/ui/Button";
import { taskService } from "../../services/taskService";
import type { Task } from "../../types/task";

function UsersIcon() {
  return (
    <svg
      className="w-5 h-5 text-slate-700"
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
      className="w-5 h-5 text-slate-700"
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
      className="w-5 h-5 text-slate-700"
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
      className="w-5 h-5 text-slate-700"
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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskLoading, setTaskLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadTasks = async () => {
      setTaskLoading(true);
      try {
        const data = await taskService.getTasks();
        if (!cancelled) {
          setTasks(data);
        }
      } catch {
        if (!cancelled) {
          setTasks([]);
        }
      } finally {
        if (!cancelled) {
          setTaskLoading(false);
        }
      }
    };

    void loadTasks();

    return () => {
      cancelled = true;
    };
  }, []);

  const activeTaskCount = useMemo(
    () => tasks.filter((task) => task.status !== "Completed").length,
    [tasks],
  );

  const stats = [
    {
      label: "Total Interns",
      value: 24,
      icon: <UsersIcon />,
      tone: "slate" as const,
      hint: "+3 this month",
    },
    {
      label: "Active Tasks",
      value: taskLoading ? "..." : activeTaskCount,
      icon: <TaskIcon />,
      tone: "slate" as const,
      hint: taskLoading ? "Syncing tasks" : `${tasks.length} total tasks`,
    },
    {
      label: "Avg. Hours Rendered",
      value: "312h",
      icon: <ClockIcon />,
      tone: "slate" as const,
      hint: "65% of required",
    },
    {
      label: "Departments",
      value: 4,
      icon: <DeptIcon />,
      tone: "slate" as const,
      hint: "All active",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Overview</h1>
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
          <DashboardStatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task overview */}
        <Card title="Task Brief">
          <TaskBriefWidget tasks={tasks} isLoading={taskLoading} />
        </Card>

        {/* Attendance overview */}
        <Card title="Attendance Overview">
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
