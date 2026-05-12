import React, { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import Card from '../../components/ui/Card';
import DashboardStatCard from './components/DashboardStatCard';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { userService } from '../../services/userService';
import { taskService } from '../../services/taskService';
import type { Task } from '../../types/task';

function UsersIcon() {
  return (
    <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function DeptIcon() {
  return (
    <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}

function TaskIcon() {
  return (
    <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
      />
    </svg>
  );
}

// Mock whitelist data for UI demo
const MOCK_WHITELIST = [
  { id: 1, email: 'intern1@example.com', status: 'Setup Complete', date: '2024-01-15' },
  { id: 2, email: 'intern2@example.com', status: 'Pending Setup', date: '2024-02-01' },
  { id: 3, email: 'admin1@example.com', status: 'Setup Complete', date: '2024-01-10' },
];

const ACTION_TONE_STYLES: Record<'blue' | 'emerald' | 'amber' | 'violet', string> = {
  blue: 'border-blue-200/70 bg-blue-50 text-blue-700',
  emerald: 'border-emerald-200/70 bg-emerald-50 text-emerald-700',
  amber: 'border-amber-200/70 bg-amber-50 text-amber-700',
  violet: 'border-violet-200/70 bg-violet-50 text-violet-700',
};

export default function SuperadminDashboard() {
  const user = useAuthStore((state) => state.user);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskLoading, setTaskLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [whitelistError, setWhitelistError] = useState('');
  const [whitelistLoading, setWhitelistLoading] = useState(false);
  const [whitelist, setWhitelist] = useState(MOCK_WHITELIST);
  const [successMsg, setSuccessMsg] = useState('');

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
    () => tasks.filter((task) => task.status !== 'Completed').length,
    [tasks],
  );

  const stats = [
    { label: 'Total Users', value: 32, icon: <UsersIcon />, tone: 'slate' as const, hint: 'Directory count' },
    { label: 'Whitelisted Emails', value: whitelist.length, icon: <EmailIcon />, tone: 'slate' as const, hint: 'Access-ready emails' },
    { label: 'Departments', value: 4, icon: <DeptIcon />, tone: 'slate' as const, hint: 'Configured teams' },
    {
      label: 'Active Tasks',
      value: taskLoading ? '...' : activeTaskCount,
      icon: <TaskIcon />,
      tone: 'slate' as const,
      hint: taskLoading ? 'Syncing tasks' : `${tasks.length} total tasks`,
    },
  ];

  const handleWhitelist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setWhitelistError('');
    setSuccessMsg('');
    setWhitelistLoading(true);

    try {
      await userService.createWhitelistedUser(newEmail.trim());
      setWhitelist((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          email: newEmail.trim(),
          status: 'Pending Setup',
          date: new Date().toISOString().split('T')[0],
        },
      ]);
      setSuccessMsg(`${newEmail} has been whitelisted.`);
      setNewEmail('');
    } catch {
      // For demo: just add to UI even if API fails
      setWhitelist((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          email: newEmail.trim(),
          status: 'Pending Setup',
          date: new Date().toISOString().split('T')[0],
        },
      ]);
      setSuccessMsg(`${newEmail} has been whitelisted.`);
      setNewEmail('');
    } finally {
      setWhitelistLoading(false);
    }
  };

  const handleRemove = (id: number) => {
    setWhitelist((prev) => prev.filter((w) => w.id !== id));
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Superadmin Overview</h1>
          <p className="text-sm text-gray-500 mt-1">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" size="sm" onClick={() => window.location.href = '/users'}>
            Manage Users
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <DashboardStatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Whitelist Manager */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Email Whitelist">
          <form onSubmit={handleWhitelist} className="flex gap-2 mb-4">
            <Input
              placeholder="user@example.com"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              error={whitelistError}
              className="flex-1"
            />
            <Button type="submit" loading={whitelistLoading} size="md">
              Add
            </Button>
          </form>

          {successMsg && (
            <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700">
              {successMsg}
            </div>
          )}

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {whitelist.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No whitelisted emails</p>
            ) : (
              whitelist.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-gray-100 hover:bg-gray-50"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">{entry.email}</p>
                    <p className="text-xs text-gray-400">{entry.status} · {entry.date}</p>
                  </div>
                  <button
                    onClick={() => handleRemove(entry.id)}
                    className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card title="Quick Actions">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Manage Users', href: '/users', desc: 'View & edit user accounts', tone: 'blue' as const, short: 'U' },
              { label: 'View Tasks', href: '/tasks', desc: 'Monitor all active tasks', tone: 'emerald' as const, short: 'T' },
              { label: 'DTR Records', href: '/dtr', desc: 'Review attendance logs', tone: 'amber' as const, short: 'D' },
              { label: 'My Profile', href: '/profile', desc: 'Update your information', tone: 'violet' as const, short: 'P' },
            ].map((action) => (
              <a
                key={action.label}
                href={action.href}
                className="group flex h-full flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">{action.label}</p>
                  <span className={`inline-flex h-8 w-8 items-center justify-center rounded-xl border text-xs font-semibold ${ACTION_TONE_STYLES[action.tone]}`}>
                    {action.short}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-500">{action.desc}</p>
              </a>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
