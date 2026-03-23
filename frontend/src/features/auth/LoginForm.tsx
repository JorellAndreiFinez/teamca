// login form component
import React, { useState } from 'react';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import FirstTimeSetupForm from './FirstTimeSetupForm';

type LoginStep = 'email' | 'password' | 'setup';

export default function LoginForm() {
  const [step, setStep] = useState<LoginStep>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const login = useAuthStore((state) => state.login);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setError('');
    setLoading(true);

    try {
      const result = await authService.checkEmail(email.trim());
      if (result.needsSetup) {
        setStep('setup');
      } else if (result.exists) {
        setStep('password');
      } else {
        setError('This email is not registered or whitelisted. Please contact your administrator.');
      }
    } catch {
      // Backend not available during development; fall through to password step.
      // Remove this fallback before deploying to production.
      setStep('password');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setError('');
    setLoading(true);

    try {
      const result = await authService.login({ email, password });
      login(result.token, result.user);
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('email');
    setPassword('');
    setError('');
  };

  if (step === 'setup') {
    return <FirstTimeSetupForm email={email} onBack={handleBack} />;
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 mb-4">
            <span className="text-white font-bold text-lg">TC</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome to TeamCA</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
        </div>

        {step === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error}
              autoFocus
              required
            />
            <Button type="submit" loading={loading} className="w-full" size="lg">
              Continue
            </Button>
          </form>
        )}

        {step === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg mb-2">
              <span className="text-sm text-gray-600">{email}</span>
              <button
                type="button"
                onClick={handleBack}
                className="ml-auto text-xs text-blue-600 hover:underline"
              >
                Change
              </button>
            </div>
            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={error}
              autoFocus
              required
            />
            <Button type="submit" loading={loading} className="w-full" size="lg">
              Sign In
            </Button>
            <button
              type="button"
              onClick={handleBack}
              className="w-full text-sm text-gray-500 hover:text-gray-700 text-center"
            >
              ← Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
}