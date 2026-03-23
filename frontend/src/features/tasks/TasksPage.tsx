import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import type { Task, TaskStatus, TaskPriority } from '../../types/task';

const MOCK_TASKS: Task[] = [
  {
    task_id: 1,
    title: 'Update Project Documentation',
    description: 'Review and update the README and API docs',
    created_by: 'supervisor-1',
    status: 'In Progress',
    priority: 'High',
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    task_id: 2,
    title: 'Complete UI Wireframes',
    description: 'Create wireframes for the dashboard redesign',
    created_by: 'supervisor-1',
    status: 'Not Started',
    priority: 'Medium',
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    task_id: 3,
    title: 'Fix Navigation Bug',
    description: 'Resolve the broken link on the reports page',
    created_by: 'supervisor-2',
    status: 'Under Review',
    priority: 'High',
    deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    task_id: 4,
    title: 'Research New Framework Options',
    description: 'Evaluate alternative frontend frameworks for Q3',
    created_by: 'supervisor-1',
    status: 'Not Started',
    priority: 'Low',
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    task_id: 5,
    title: 'Write Unit Tests',
    description: 'Add unit tests for the authentication module',
    created_by: 'supervisor-2',
    status: 'Completed',
    priority: 'Medium',
    deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
  },
];

const STATUS_STYLES: Record<string, string> = {
  'Not Started': 'bg-gray-100 text-gray-600',
  'In Progress': 'bg-blue-100 text-blue-700',
  'Under Review': 'bg-yellow-100 text-yellow-700',
  'Completed': 'bg-green-100 text-green-700',
};

const PRIORITY_STYLES: Record<string, string> = {
  Low: 'bg-gray-100 text-gray-500',
  Medium: 'bg-orange-100 text-orange-700',
  High: 'bg-red-100 text-red-700',
};

const ALL_STATUSES: TaskStatus[] = ['Not Started', 'In Progress', 'Under Review', 'Completed'];

export default function TasksPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const canManageUsers = useAuthStore((state) => state.canManageUsers);
  const [filter, setFilter] = useState<TaskStatus | 'All'>('All');
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [mounted, setMounted] = useState(false);
  React.useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  if (!isAuthenticated) {
    window.location.replace('/login');
    return null;
  }

  const isManager = canManageUsers();

  const filtered = filter === 'All' ? tasks : tasks.filter((t) => t.status === filter);

  const statusCounts = ALL_STATUSES.reduce((acc, s) => {
    acc[s] = tasks.filter((t) => t.status === s).length;
    return acc;
  }, {} as Record<TaskStatus, number>);

  const handleUpdateStatus = (taskId: number, newStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.task_id === taskId ? { ...t, status: newStatus } : t))
    );
  };

  const formatDeadline = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { text: 'Overdue', urgent: true };
    if (diffDays === 0) return { text: 'Due today', urgent: true };
    if (diffDays === 1) return { text: 'Due tomorrow', urgent: false };
    return { text: `Due in ${diffDays}d`, urgent: false };
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your assigned tasks</p>
        </div>
        {isManager && (
          <Button variant="primary" size="sm">
            + New Task
          </Button>
        )}
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {ALL_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`p-3 rounded-xl border text-left transition-colors ${
              filter === s ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}
          >
            <p className="text-xl font-bold text-gray-900">{statusCounts[s]}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s}</p>
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {(['All', ...ALL_STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === s
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s} {s !== 'All' && `(${statusCounts[s]})`}
          </button>
        ))}
      </div>

      {/* Task list */}
      <Card>
        {filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">No tasks in this category</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((task) => {
              const dl = formatDeadline(task.deadline);
              return (
                <div
                  key={task.task_id}
                  className="flex items-start gap-4 p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-800">{task.title}</p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_STYLES[task.priority]}`}>
                          {task.priority}
                        </span>
                        <span className={`text-xs ${dl.urgent ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                          {dl.text}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{task.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[task.status]}`}>
                        {task.status}
                      </span>
                      {isManager && (
                        <select
                          value={task.status}
                          onChange={(e) => handleUpdateStatus(task.task_id, e.target.value as TaskStatus)}
                          className="text-xs border border-gray-200 rounded px-2 py-0.5 text-gray-600 focus:outline-none"
                        >
                          {ALL_STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
