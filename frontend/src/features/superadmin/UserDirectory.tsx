import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { userService } from '../../services/userService';
import { useAuthStore } from '../../store/authStore';
import type { User } from '../../types/user';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';

const getDepartmentRoleLabel = (user: User): string => {
  const userRecord = user as User & {
    departments?: Array<{ department_role?: string }>;
  };

  const toPosition = (role?: string) => {
    if (!role) return undefined;
    if (role === 'Intern') return 'Member';
    return role;
  };

  if (user.department_role) {
    return toPosition(user.department_role) ?? 'Not assigned';
  }

  if (userRecord.departments && userRecord.departments.length > 0) {
    return userRecord.departments
      .map((department) => toPosition(department.department_role))
      .filter(Boolean)
      .join(', ') || 'Not assigned';
  }

  return 'Not assigned';
};

const getAccessLevelLabel = (user: User): string => {
  if (user.global_role === 'Superadmin') {
    return 'Full Access';
  }

  if (user.global_role === 'Admin') {
    return 'Management Access';
  }

  if (user.global_role === 'Standard_User') {
    return 'Standard Access';
  }

  return 'Pending setup';
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

  const handleWhitelist = async (event: FormEvent) => {
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
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">User Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">You do not have permission to access this page.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="space-y-4">
      <CardHeader className="pb-0">
      <div className="flex items-center justify-between">
        <CardTitle className="text-xl">User Directory</CardTitle>
        <Button type="button" variant="outline" onClick={() => void loadUsers()}>
          Refresh
        </Button>
      </div>
      </CardHeader>
      <CardContent className="space-y-4">

      {canWhitelistEmails() && (
        <form onSubmit={handleWhitelist} className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            type="email"
            value={newEmail}
            onChange={(event) => setNewEmail(event.target.value)}
            placeholder="intern@example.com"
            className="w-full"
          />
          <Button type="submit" disabled={isWhitelisting}>
            {isWhitelisting ? 'Whitelisting...' : 'Whitelist Email'}
          </Button>
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
                <th className="px-2 py-3">Access</th>
                <th className="px-2 py-3">Position</th>
                <th className="px-2 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.user_id} className="border-b border-slate-100 text-sm text-slate-700">
                  <td className="px-2 py-3">{`${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || 'Pending setup'}</td>
                  <td className="px-2 py-3">{user.email}</td>
                  <td className="px-2 py-3">{getAccessLevelLabel(user)}</td>
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
      </CardContent>
    </Card>
  );
}