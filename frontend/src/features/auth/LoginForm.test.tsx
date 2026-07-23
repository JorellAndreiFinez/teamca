/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import LoginForm from './LoginForm';
import { authService } from '../../services/authService';

// --- MOCK EXTERNAL DEPENDENCIES ---

vi.mock('../../services/authService', () => ({
  authService: {
    checkEmail: vi.fn(),
    login: vi.fn(),
  },
}));

const mockLogin = vi.fn();
vi.mock('../../store/authStore', () => ({
  useAuthStore: vi.fn(() => mockLogin),
}));

vi.mock('../../lib/roleRoutes', () => ({
  getDashboardRouteForUser: vi.fn(() => '/mock-dashboard'),
}));

const mockReplace = vi.fn();
Object.defineProperty(window, 'location', {
  value: { replace: mockReplace },
  writable: true,
});

describe('LoginForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // FIX: Unmount and clean up JSDOM after every test to prevent DOM leaks
  afterEach(() => {
    cleanup();
  });

  it('renders the initial email step correctly', () => {
    render(<LoginForm />);
    
    expect(screen.getByText('Welcome to TeamCA')).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
  });

  it('shows an error if the email is not registered/whitelisted', async () => {
    vi.mocked(authService.checkEmail).mockResolvedValueOnce({ exists: false, needsSetup: false });

    render(<LoginForm />);
    
    const emailInput = screen.getByLabelText('Email address');
    fireEvent.change(emailInput, { target: { value: 'unknown@example.com' } });
    
    const submitButton = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/not registered or whitelisted/i)).toBeInTheDocument();
    });
  });

  it('advances to the password step if the email exists', async () => {
    vi.mocked(authService.checkEmail).mockResolvedValueOnce({ exists: true, needsSetup: false });

    render(<LoginForm />);
    
    const emailInput = screen.getByLabelText('Email address');
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByText('user@example.com')).toBeInTheDocument();
    });
  });

  it('advances to the setup form if the user needs setup', async () => {
    vi.mocked(authService.checkEmail).mockResolvedValueOnce({ exists: true, needsSetup: true });

    render(<LoginForm />);
    
    const emailInput = screen.getByLabelText('Email address');
    fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(screen.queryByLabelText('Password')).not.toBeInTheDocument();
    });
  });

  it('successfully logs in and redirects', async () => {
    vi.mocked(authService.checkEmail).mockResolvedValueOnce({ exists: true, needsSetup: false });
    
    const mockUser = { _id: '123', email: 'user@example.com', global_role: 'Standard_User' };
    vi.mocked(authService.login).mockResolvedValueOnce({
      token: 'mock-jwt-token',
      user: mockUser as any
    });

    render(<LoginForm />);
    
    // Step 1: Submit Email
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    // Wait for Password Step
    await waitFor(() => {
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
    });

    // Step 2: Submit Password
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({ email: 'user@example.com', password: 'password123' });
      expect(mockLogin).toHaveBeenCalledWith('mock-jwt-token', expect.objectContaining({ user_id: '123' }));
      expect(mockReplace).toHaveBeenCalledWith('/mock-dashboard');
    });
  });

});