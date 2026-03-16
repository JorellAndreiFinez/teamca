import { type FormEvent, useState } from 'react';
import type { AxiosError } from 'axios';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import { getDashboardRouteForUser } from '../../lib/roleRoutes';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import type { DepartmentRole, GlobalRole, User } from '../../types/user';

type ApiAuthUser = {
  _id?: string;
  user_id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  global_role?: GlobalRole;
  department_role?: DepartmentRole;
  department_id?: number | string;
  is_active?: boolean;
  departments?: Array<{
    department_id?: number | string;
    department_role?: DepartmentRole;
  }>;
};

type LoginResponse = {
  token: string;
  user: ApiAuthUser;
};

const toNumberOrUndefined = (value?: number | string): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
};

const normalizeAuthUser = (apiUser: ApiAuthUser): User => {
  const fallbackDepartment = apiUser.departments?.[0];

  return {
    user_id: apiUser.user_id ?? apiUser._id ?? '',
    first_name: apiUser.first_name ?? '',
    last_name: apiUser.last_name ?? '',
    email: apiUser.email ?? '',
    global_role: apiUser.global_role ?? 'Standard_User',
    department_role: apiUser.department_role ?? fallbackDepartment?.department_role ?? 'Intern',
    department_id:
      toNumberOrUndefined(apiUser.department_id) ??
      toNumberOrUndefined(fallbackDepartment?.department_id),
    is_active: apiUser.is_active ?? true,
  };
};

export default function LoginForm() {
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [setupModalEmail, setSetupModalEmail] = useState<string | null>(null);
  const [lastCheckedEmail, setLastCheckedEmail] = useState('');
  const [dismissedSetupEmail, setDismissedSetupEmail] = useState<string | null>(null);

  const handleEmailBlur = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || normalizedEmail === lastCheckedEmail) {
      return;
    }

    try {
      const result = await authService.checkEmail(normalizedEmail);
      if (result.exists && result.needsSetup && dismissedSetupEmail !== normalizedEmail) {
        setSetupModalEmail(normalizedEmail);
      }
    } catch {
      // fail silently for email checks on blur
    } finally {
      setLastCheckedEmail(normalizedEmail);
    }
  };

  const redirectToSetup = (targetEmail: string) => {
    const encodedEmail = encodeURIComponent(targetEmail);
    window.location.replace(`/setup?email=${encodedEmail}`);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const normalizedEmail = email.trim().toLowerCase();
      const emailStatus = await authService.checkEmail(normalizedEmail);
      if (emailStatus.exists && emailStatus.needsSetup) {
        setSetupModalEmail(normalizedEmail);
        return;
      }

      const response = (await authService.login({
        email: normalizedEmail,
        password,
      })) as LoginResponse;

      const user = normalizeAuthUser(response.user);
      login(response.token, user);

      window.location.replace(getDashboardRouteForUser(user));
    } catch (error) {
      const apiError = error as AxiosError<{ message?: string }>;
      const message = apiError.response?.data?.message;

      if (message === 'Account setup is incomplete.') {
        setSetupModalEmail(email.trim().toLowerCase());
        return;
      }

      setError('Unable to login. Check your credentials or complete first-time setup.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Sign in to access your dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="email" className="text-sm font-medium text-slate-700">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                onBlur={() => {
                  void handleEmailBlur();
                }}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="text-sm font-medium text-slate-700">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Modal open={Boolean(setupModalEmail)} onClose={() => setSetupModalEmail(null)} title="Setup Required">
        <p className="text-sm text-slate-700">
          This email is whitelisted but the account setup is not complete yet. Please complete the initial setup first.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (setupModalEmail) {
                setDismissedSetupEmail(setupModalEmail);
              }
              setSetupModalEmail(null);
            }}
          >
            Not now
          </Button>
          <Button
            type="button"
            onClick={() => {
              if (!setupModalEmail) return;
              redirectToSetup(setupModalEmail);
            }}
          >
            Go to Setup
          </Button>
        </div>
      </Modal>
    </>
  );
}