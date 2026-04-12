
import React, { useState } from 'react';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

interface FirstTimeSetupFormProps {
  email: string;
  onBack?: () => void;
}

export default function FirstTimeSetupForm({ email, onBack }: FirstTimeSetupFormProps) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    password: '',
    confirmPassword: '',
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
    if (formData.first_name.trim().length < 2) errs.first_name = 'First name must be at least 2 characters';
    if (!formData.last_name.trim()) errs.last_name = 'Last name is required';
    if (formData.last_name.trim().length < 2) errs.last_name = 'Last name must be at least 2 characters';
    
    if (formData.password.length < 8) {
      errs.password = 'Password must be at least 8 characters';
    } else if (!/[A-Z]/.test(formData.password)) {
      errs.password = 'Password must contain at least one uppercase letter';
    } else if (!/[a-z]/.test(formData.password)) {
      errs.password = 'Password must contain at least one lowercase letter';
    } else if (!/[0-9]/.test(formData.password)) {
      errs.password = 'Password must contain at least one number';
    }
    
    if (formData.password !== formData.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (!formData.school_university.trim()) errs.school_university = 'School/University is required';
    if (formData.required_hours < 1) errs.required_hours = 'Required hours must be at least 1';
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
        school_university: formData.school_university,
        required_hours: Number(formData.required_hours),
      });
      login(result.token, result.user);
      window.location.href = '/dashboard';
    } catch (err: any) {
      setServerError(err?.response?.data?.message || 'Setup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center px-4 py-8 md:py-0">
      <div className="w-full max-w-4xl bg-white rounded-2xl p-6 md:p-12 max-h-[calc(100vh-2rem)] overflow-y-auto">
        <div className="text-center mb-8">
          <img
            src="/teamlogo.png"
            alt="TeamCA Logo"
            className="h-14 w-14 mx-auto mb-4 object-contain"
          />
          <h1 className="text-3xl font-bold text-gray-900">Complete Your Setup</h1>
          <p className="text-sm text-gray-500 mt-2">{email}</p>
        </div>

        {serverError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <div className="space-y-4 border-t pt-6">
            <h3 className="text-sm font-semibold text-gray-700">Account Credentials</h3>
            <Input
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              error={errors.password}
              placeholder="8+ chars (uppercase, lowercase, number)"
            />
            <Input
              label="Confirm Password"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              error={errors.confirmPassword}
              placeholder="Re-enter password"
            />
          </div>

          <div className="space-y-4 border-t pt-6">
            <h3 className="text-sm font-semibold text-gray-700">Academic Information</h3>
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
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <Button type="submit" loading={loading} className="w-full" size="lg">
              Complete Setup
            </Button>
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="w-full text-sm text-gray-500 hover:text-gray-700 text-center py-2 transition"
              >
                ← Back
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}