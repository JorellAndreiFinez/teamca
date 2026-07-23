/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FirstTimeSetupForm from './FirstTimeSetupForm';
import { authService } from '../../services/authService';
import { departmentService } from '../../services/departmentService';

// --- MOCK EXTERNAL DEPENDENCIES ---

vi.mock('../../services/authService', () => ({
  authService: {
    completeSetup: vi.fn(),
  },
}));

vi.mock('../../services/departmentService', () => ({
  departmentService: {
    getAllDepartments: vi.fn(),
  },
}));

const mockLogin = vi.fn();
vi.mock('../../store/authStore', () => ({
  useAuthStore: vi.fn(() => mockLogin),
}));

describe('FirstTimeSetupForm Component', () => {
  const mockEmail = 'newintern@example.com';

beforeEach(() => {
    vi.clearAllMocks();

    // Mock successful department fetch with proper string types for createdAt/updatedAt
    vi.mocked(departmentService.getAllDepartments).mockResolvedValue([
      { 
        _id: 'dept1', 
        department_name: 'Engineering', 
        description: '', 
        createdAt: new Date().toISOString(), 
        updatedAt: new Date().toISOString() 
      },
      { 
        _id: 'dept2', 
        department_name: 'Design', 
        description: '', 
        createdAt: new Date().toISOString(), 
        updatedAt: new Date().toISOString() 
      },
    ]);

    // Mock window.location.href for redirection testing
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    });
  });

  it('renders correctly and loads departments', async () => {
    render(<FirstTimeSetupForm email={mockEmail} />);
    
    expect(screen.getByText('Complete Your Setup')).toBeInTheDocument();
    expect(screen.getByText(mockEmail)).toBeInTheDocument();
    
    // Wait for the async department fetch to complete
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Engineering' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Design' })).toBeInTheDocument();
    });
  });

  it('shows validation errors for empty or invalid fields', async () => {
    render(<FirstTimeSetupForm email={mockEmail} />);
    
    // Attempt to submit immediately without filling anything out
    fireEvent.click(screen.getByRole('button', { name: /complete setup/i }));
    
    await waitFor(() => {
      expect(screen.getByText('First name is required')).toBeInTheDocument();
      expect(screen.getByText('Last name is required')).toBeInTheDocument();
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
      expect(screen.getByText('Department is required')).toBeInTheDocument();
      expect(screen.getByText('School/University is required')).toBeInTheDocument();
    });
  });

  it('enforces password complexity rules', async () => {
    render(<FirstTimeSetupForm email={mockEmail} />);
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /complete setup/i });

    // Test missing uppercase
    fireEvent.change(passwordInput, { target: { value: 'nouppercase123' } });
    fireEvent.click(submitButton);
    await waitFor(() => expect(screen.getByText('Password must contain at least one uppercase letter')).toBeInTheDocument());

    // Test missing number
    fireEvent.change(passwordInput, { target: { value: 'NoNumbersHere' } });
    fireEvent.click(submitButton);
    await waitFor(() => expect(screen.getByText('Password must contain at least one number')).toBeInTheDocument());
  });

  it('shows an error if passwords do not match', async () => {
    render(<FirstTimeSetupForm email={mockEmail} />);
    
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'ValidPass123' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'Mismatch456' } });
    
    fireEvent.click(screen.getByRole('button', { name: /complete setup/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('calls the onBack prop when the back button is clicked', () => {
    const mockOnBack = vi.fn();
    render(<FirstTimeSetupForm email={mockEmail} onBack={mockOnBack} />);
    
    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('successfully submits the form and redirects', async () => {
    // Mock the successful setup response
    vi.mocked(authService.completeSetup).mockResolvedValueOnce({
      token: 'mock-setup-token',
      user: { _id: '789', email: mockEmail } as any
    });

    render(<FirstTimeSetupForm email={mockEmail} />);
    
    // Wait for the dropdown to populate so we can select an option
    await waitFor(() => expect(screen.getByRole('option', { name: 'Engineering' })).toBeInTheDocument());

    // Fill out the entire form perfectly
    fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'Maria' } });
    fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'Clara' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'StrongPass123' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'StrongPass123' } });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'dept1' } });
    fireEvent.change(screen.getByLabelText('School / University'), { target: { value: 'UP Diliman' } });
    fireEvent.change(screen.getByLabelText('Required Internship Hours'), { target: { value: '600' } });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /complete setup/i }));

    // Verify all the correct API and side-effect calls occurred
    await waitFor(() => {
      expect(authService.completeSetup).toHaveBeenCalledWith({
        email: mockEmail,
        first_name: 'Maria',
        last_name: 'Clara',
        password: 'StrongPass123',
        department_id: 'dept1',
        school_university: 'UP Diliman',
        required_hours: 600
      });
      expect(mockLogin).toHaveBeenCalledWith('mock-setup-token', expect.objectContaining({ _id: '789' }));
      expect(window.location.href).toBe('/dashboard');
    });
  });

});