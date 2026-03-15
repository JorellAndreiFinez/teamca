<<<<<<< HEAD
import { type FormEvent, useEffect, useState } from 'react';
import type { DepartmentRole, GlobalRole, User } from '../../types/user';
import { authService } from '../../services/authService';
import { departmentService } from '../../services/departmentService';
import { useAuthStore } from '../../store/authStore';
import { getDashboardRouteForUser } from '../../lib/roleRoutes';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import type { Department } from '../../types/user';

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

type CompleteSetupResponse = {
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

export default function FirstTimeSetupForm() {
  const login = useAuthStore((state) => state.login);

=======
// account setup for init login
import React, { useState } from 'react';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

interface FirstTimeSetupFormProps {
  email: string;
  onBack: () => void;
}

export default function FirstTimeSetupForm({ email, onBack }: FirstTimeSetupFormProps) {
>>>>>>> f0d231d (feat: implement dashboard with role-based views, sidebar, DTR/tasks/profile pages, and backend mock API)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    password: '',
    confirmPassword: '',
<<<<<<< HEAD
    department_id: '',
    school_university: '',
    required_hours: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [departmentLoadError, setDepartmentLoadError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasDepartmentOptions = departments.length > 0;
=======
    department_id: 1,
    school_university: '',
    required_hours: 480,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const login = useAuthStore((state) => state.login);

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.first_name.trim()) errs.first_name = 'First name is required';
    if (!formData.last_name.trim()) errs.last_name = 'Last name is required';
    if (formData.password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (!formData.school_university.trim()) errs.school_university = 'School/University is required';
    if (formData.required_hours < 1) errs.required_hours = 'Required hours must be at least 1';
    return errs;
  };
>>>>>>> f0d231d (feat: implement dashboard with role-based views, sidebar, DTR/tasks/profile pages, and backend mock API)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const email = params.get('email');
    if (!email) return;

    setFormData((previous) => ({
      ...previous,
      email,
    }));
  }, []);

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        setDepartmentLoadError(null);
        const data = await departmentService.getAllDepartments();
        setDepartments(data);
      } catch {
        setDepartments([]);
        setDepartmentLoadError('Unable to load departments right now. Please try again later.');
      }
    };

    void loadDepartments();
  }, []);

  const setField = (field: keyof typeof formData, value: string) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
<<<<<<< HEAD

    if (!formData.email.trim() || !formData.first_name.trim() || !formData.last_name.trim() || !formData.password) {
      setError('Email, first name, last name, and password are required.');
      return;
    }

    if (!hasDepartmentOptions) {
      setError('Department list is unavailable right now. Please try again later.');
      return;
    }

    if (!formData.department_id) {
      setError('Please select a department.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const parsedRequiredHours = Number(formData.required_hours);
    if (!formData.school_university.trim()) {
      setError('School / University is required.');
      return;
    }

    if (!formData.required_hours.trim() || !Number.isFinite(parsedRequiredHours) || parsedRequiredHours <= 0) {
      setError('Required Hours must be a valid number greater than 0.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const response = (await authService.completeSetup({
        email: formData.email.trim().toLowerCase(),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        password: formData.password,
        department_id: formData.department_id.trim(),
        school_university: formData.school_university.trim(),
        required_hours: parsedRequiredHours,
      })) as CompleteSetupResponse;

      const user = normalizeAuthUser(response.user);
      login(response.token, user);
      window.location.replace(getDashboardRouteForUser(user));
    } catch {
      setError('Unable to complete setup. Make sure this email is whitelisted and not yet activated.');
    } finally {
      setIsSubmitting(false);
=======
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setServerError('');
    setLoading(true);

    try {
      const result = await authService.completeSetup({
        email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        password: formData.password,
        department_id: Number(formData.department_id),
        school_university: formData.school_university,
        required_hours: Number(formData.required_hours),
      });
      login(result.token, result.user);
      window.location.href = '/dashboard';
    } catch (err: any) {
      setServerError(err?.response?.data?.message || 'Setup failed. Please try again.');
    } finally {
      setLoading(false);
>>>>>>> f0d231d (feat: implement dashboard with role-based views, sidebar, DTR/tasks/profile pages, and backend mock API)
    }
  };

  return (
<<<<<<< HEAD
    <Card className="mx-auto w-full max-w-lg">
      <CardHeader>
        <CardTitle>Complete Account Setup</CardTitle>
        <CardDescription>Finish your account details to activate your access.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="setup-email" className="text-sm font-medium text-slate-700">
              Email
            </label>
            <Input
              id="setup-email"
              type="email"
              value={formData.email}
              onChange={(event) => setField('email', event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="first-name" className="text-sm font-medium text-slate-700">
                First Name
              </label>
              <Input
                id="first-name"
                value={formData.first_name}
                onChange={(event) => setField('first_name', event.target.value)}
                placeholder="First name"
                required
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="last-name" className="text-sm font-medium text-slate-700">
                Last Name
              </label>
              <Input
                id="last-name"
                value={formData.last_name}
                onChange={(event) => setField('last_name', event.target.value)}
                placeholder="Last name"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="setup-password" className="text-sm font-medium text-slate-700">
                Password
              </label>
              <Input
                id="setup-password"
                type="password"
                value={formData.password}
                onChange={(event) => setField('password', event.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="confirm-password" className="text-sm font-medium text-slate-700">
                Confirm Password
              </label>
              <Input
                id="confirm-password"
                type="password"
                value={formData.confirmPassword}
                onChange={(event) => setField('confirmPassword', event.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              {hasDepartmentOptions ? (
                <>
                  <label htmlFor="department-id" className="text-sm font-medium text-slate-700">
                    Department
                  </label>
                  <select
                    id="department-id"
                    value={formData.department_id}
                    onChange={(event) => setField('department_id', event.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
                    required
                  >
                    <option value="" disabled>Select department</option>
                    {departments.map((department) => {
                      const optionValue = String(department._id ?? department.department_id ?? '');
                      if (!optionValue) return null;

                      return (
                        <option key={optionValue} value={optionValue}>
                          {department.department_name}
                        </option>
                      );
                    })}
                  </select>
                </>
              ) : (
                <p className="text-sm text-slate-500">No departments available yet.</p>
              )}
              {departmentLoadError ? <p className="text-xs text-amber-600">{departmentLoadError}</p> : null}
            </div>
            <div className="space-y-1">
              <label htmlFor="required-hours" className="text-sm font-medium text-slate-700">
                Required Hours
              </label>
              <Input
                id="required-hours"
                type="number"
                value={formData.required_hours}
                onChange={(event) => setField('required_hours', event.target.value)}
                placeholder="e.g. 600"
                min={1}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="school" className="text-sm font-medium text-slate-700">
              School / University
            </label>
            <Input
              id="school"
              value={formData.school_university}
              onChange={(event) => setField('school_university', event.target.value)}
              placeholder="School or university"
              required
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Completing setup...' : 'Complete Setup'}
          </Button>
        </form>
      </CardContent>
    </Card>
=======
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 mb-4">
            <span className="text-white font-bold text-lg">TC</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Complete Your Setup</h1>
          <p className="text-sm text-gray-500 mt-1">{email}</p>
        </div>

        {serverError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              value={formData.first_name}
              onChange={(e) => handleChange('first_name', e.target.value)}
              error={errors.first_name}
              placeholder="Juan"
            />
            <Input
              label="Last Name"
              value={formData.last_name}
              onChange={(e) => handleChange('last_name', e.target.value)}
              error={errors.last_name}
              placeholder="Dela Cruz"
            />
          </div>

          <Input
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            error={errors.password}
            placeholder="Min. 8 characters"
          />
          <Input
            label="Confirm Password"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => handleChange('confirmPassword', e.target.value)}
            error={errors.confirmPassword}
            placeholder="Re-enter password"
          />

          <Input
            label="School / University"
            value={formData.school_university}
            onChange={(e) => handleChange('school_university', e.target.value)}
            error={errors.school_university}
            placeholder="e.g. University of the Philippines"
          />

          <Input
            label="Required Internship Hours"
            type="number"
            value={String(formData.required_hours)}
            onChange={(e) => handleChange('required_hours', Number(e.target.value))}
            error={errors.required_hours}
            min={1}
            placeholder="e.g. 480"
          />

          <Button type="submit" loading={loading} className="w-full" size="lg">
            Complete Setup
          </Button>
          <button
            type="button"
            onClick={onBack}
            className="w-full text-sm text-gray-500 hover:text-gray-700 text-center"
          >
            ← Back
          </button>
        </form>
      </div>
    </div>
>>>>>>> f0d231d (feat: implement dashboard with role-based views, sidebar, DTR/tasks/profile pages, and backend mock API)
  );
}