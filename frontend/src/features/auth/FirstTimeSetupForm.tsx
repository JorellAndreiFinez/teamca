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
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    password: '',
    confirmPassword: '',
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
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setServerError(message || 'Setup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
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
  );
}