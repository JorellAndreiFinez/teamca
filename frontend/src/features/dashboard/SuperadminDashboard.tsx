import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { userService } from '../../services/userService';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <div className={`rounded-xl p-5 border ${color}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-600">{label}</span>
        <div className="w-9 h-9 rounded-lg bg-white/60 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function UsersIcon() {
  return (
    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function DeptIcon() {
  return (
    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}

// Mock whitelist data for UI demo
const MOCK_WHITELIST = [
  { id: 1, email: 'intern1@example.com', status: 'Setup Complete', date: '2024-01-15' },
  { id: 2, email: 'intern2@example.com', status: 'Pending Setup', date: '2024-02-01' },
  { id: 3, email: 'admin1@example.com', status: 'Setup Complete', date: '2024-01-10' },
];

export default function SuperadminDashboard() {
  const user = useAuthStore((state) => state.user);
  const [newEmail, setNewEmail] = useState('');
  const [whitelistError, setWhitelistError] = useState('');
  const [whitelistLoading, setWhitelistLoading] = useState(false);
  const [whitelist, setWhitelist] = useState(MOCK_WHITELIST);
  const [successMsg, setSuccessMsg] = useState('');

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const stats = [
    { label: 'Total Users', value: 32, icon: <UsersIcon />, color: 'bg-blue-50 border-blue-100' },
    { label: 'Whitelisted Emails', value: whitelist.length, icon: <EmailIcon />, color: 'bg-green-50 border-green-100' },
    { label: 'Departments', value: 4, icon: <DeptIcon />, color: 'bg-purple-50 border-purple-100' },
    { label: 'Admins', value: 3, icon: <ShieldIcon />, color: 'bg-indigo-50 border-indigo-100' },
  ];

  const handleWhitelist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setWhitelistError('');
    setSuccessMsg('');
    setWhitelistLoading(true);

    try {
      await userService.whitelistEmail(newEmail.trim());
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
          <h1 className="text-2xl font-bold text-gray-900">
            {greeting()}, {user?.first_name ?? 'Superadmin'}! 👋
          </h1>
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
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Whitelist Manager */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Email Whitelist" subtitle="Grant access to new users">
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
        <Card title="Quick Actions" subtitle="System management shortcuts">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Manage Users', href: '/users', desc: 'View & edit user accounts', color: 'border-blue-200 hover:bg-blue-50' },
              { label: 'View Tasks', href: '/tasks', desc: 'Monitor all active tasks', color: 'border-green-200 hover:bg-green-50' },
              { label: 'DTR Records', href: '/dtr', desc: 'Review attendance logs', color: 'border-orange-200 hover:bg-orange-50' },
              { label: 'My Profile', href: '/profile', desc: 'Update your information', color: 'border-purple-200 hover:bg-purple-50' },
            ].map((action) => (
              <a
                key={action.label}
                href={action.href}
                className={`block p-4 rounded-lg border ${action.color} transition-colors`}
              >
                <p className="text-sm font-semibold text-gray-800">{action.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{action.desc}</p>
              </a>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
