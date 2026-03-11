import React, { useEffect, useMemo, useState } from 'react';
import { userService } from '../../services/userService';
import { useAuthStore } from '../../store/authStore';
import type { User } from '../../types/user';

const getDepartmentRoleLabel = (user: User): string => {
  const userRecord = user as User & {
    departments?: Array<{ department_role?: string }>;
  };

  if (user.department_role) {
    return user.department_role;
  }

  if (userRecord.departments && userRecord.departments.length > 0) {
    return userRecord.departments
      .map((department) => department.department_role)
      .filter(Boolean)
      .join(', ');
  }

  return 'Not assigned';
};

export default function UserDirectory() {
  const canAccessUserDirectory = useAuthStore((state) => state.canAccessUserDirectory);
  const canManageUsers = useAuthStore((state) => state.canManageUsers);
  const canWhitelistEmails = useAuthStore((state) => state.canWhitelistEmails);

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [isWhitelisting, setIsWhitelisting] = useState(false);

  const allowedToView = useMemo(() => canAccessUserDirectory(), [canAccessUserDirectory]);

  const loadUsers = async () => {
    if (!allowedToView) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await userService.getAllUsers();
      setUsers(data);
    } catch {
      setError('Failed to load users. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, [allowedToView]);

  const handleWhitelist = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newEmail.trim() || !canWhitelistEmails()) {
      return;
    }

    try {
      setIsWhitelisting(true);
      setError(null);
      await userService.whitelistEmail(newEmail.trim().toLowerCase());
      setNewEmail('');
      await loadUsers();
    } catch {
      setError('Failed to whitelist email. Please check input and try again.');
    } finally {
      setIsWhitelisting(false);
    }
  };

  if (!allowedToView) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-900">User Directory</h2>
        <p className="mt-2 text-sm text-slate-600">You do not have permission to access this page.</p>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">User Directory</h2>
        <button
          type="button"
          onClick={() => void loadUsers()}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Refresh
        </button>
      </div>

      {canWhitelistEmails() && (
        <form onSubmit={handleWhitelist} className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="email"
            value={newEmail}
            onChange={(event) => setNewEmail(event.target.value)}
            placeholder="intern@example.com"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isWhitelisting}
            className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isWhitelisting ? 'Whitelisting...' : 'Whitelist Email'}
          </button>
        </form>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {isLoading ? (
        <p className="text-sm text-slate-600">Loading users...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-2 py-3">Name</th>
                <th className="px-2 py-3">Email</th>
                <th className="px-2 py-3">Global Role</th>
                <th className="px-2 py-3">Department Role</th>
                <th className="px-2 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.user_id} className="border-b border-slate-100 text-sm text-slate-700">
                  <td className="px-2 py-3">{`${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || 'Pending setup'}</td>
                  <td className="px-2 py-3">{user.email}</td>
                  <td className="px-2 py-3">{user.global_role ?? 'Pending setup'}</td>
                  <td className="px-2 py-3">{getDepartmentRoleLabel(user)}</td>
                  <td className="px-2 py-3">{user.is_active ? 'Active' : 'Whitelisted'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!canManageUsers() && (
        <p className="text-xs text-slate-500">You can view users, but account management actions are restricted.</p>
      )}
    </section>
  );
}