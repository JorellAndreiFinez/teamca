/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LeaveRequestForm from './LeaveRequestForm';

describe('LeaveRequestForm Component', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all form fields correctly', () => {
    render(<LeaveRequestForm onSubmit={mockOnSubmit} />);
    
    expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/duration/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/reason/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit leave request/i })).toBeInTheDocument();
  });

  it('displays an error if the end date is before the start date', async () => {
    render(<LeaveRequestForm onSubmit={mockOnSubmit} />);
    
    // Fill out the form with an invalid date range
    fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: '2026-08-20' } });
    fireEvent.change(screen.getByLabelText(/end date/i), { target: { value: '2026-08-15' } });
    fireEvent.change(screen.getByLabelText(/duration/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/reason/i), { target: { value: 'Vacation' } });
    
    fireEvent.click(screen.getByRole('button', { name: /submit leave request/i }));
    
    await waitFor(() => {
      expect(screen.getByText('End date must be after start date')).toBeInTheDocument();
      // Ensure the submit function was NOT called
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  it('successfully submits the form, shows a success message, and clears inputs', async () => {
    // Resolve the mock to simulate a successful API call
    mockOnSubmit.mockResolvedValueOnce(undefined);

    render(<LeaveRequestForm onSubmit={mockOnSubmit} />);
    
    const startDateInput = screen.getByLabelText(/start date/i);
    const endDateInput = screen.getByLabelText(/end date/i);
    const durationInput = screen.getByLabelText(/duration/i);
    const reasonInput = screen.getByLabelText(/reason/i);

    // Fill out the form perfectly
    fireEvent.change(startDateInput, { target: { value: '2026-08-10' } });
    fireEvent.change(endDateInput, { target: { value: '2026-08-12' } });
    fireEvent.change(durationInput, { target: { value: '3' } });
    fireEvent.change(reasonInput, { target: { value: 'Family trip' } });
    
    fireEvent.click(screen.getByRole('button', { name: /submit leave request/i }));

    // Verify the mock was called with the correct payload
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        startDate: '2026-08-10',
        endDate: '2026-08-12',
        duration: 3, // Ensure it parses as a number, not a string
        reason: 'Family trip',
      });
    });

    // Verify the success message appears
    expect(screen.getByText('Leave request submitted successfully!')).toBeInTheDocument();

    // Verify the form is reset to its initial state
    expect(startDateInput).toHaveValue('');
    expect(endDateInput).toHaveValue('');
    expect(durationInput).toHaveValue('1');
    expect(reasonInput).toHaveValue('');
  });

  it('displays an error message if submission fails', async () => {
    // Reject the mock to simulate an API failure
    mockOnSubmit.mockRejectedValueOnce(new Error('Network Error'));

    render(<LeaveRequestForm onSubmit={mockOnSubmit} />);
    
    fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: '2026-08-10' } });
    fireEvent.change(screen.getByLabelText(/end date/i), { target: { value: '2026-08-12' } });
    fireEvent.change(screen.getByLabelText(/reason/i), { target: { value: 'Family trip' } });
    
    fireEvent.click(screen.getByRole('button', { name: /submit leave request/i }));

    await waitFor(() => {
      expect(screen.getByText('Network Error')).toBeInTheDocument();
    });
  });

  it('disables the button and shows loading state when loading prop is true', () => {
    render(<LeaveRequestForm onSubmit={mockOnSubmit} loading={true} />);
    
    const submitButton = screen.getByRole('button', { name: /submitting/i });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });
});