/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import InternDashboard from './InternDashboard';

// --- MOCK STORES ---
const mockUser = { _id: 'user-1', name: 'Intern Juan', working_hours: { start: '09:00', end: '18:00' }, working_days: ['Monday', 'Tuesday'] };
vi.mock('../../store/authStore', () => ({
  useAuthStore: vi.fn((selector: any) => selector({ user: mockUser })),
}));

let mockDtrState: any = {};
vi.mock('../../store/dtrStore', () => ({
  useDtrStore: vi.fn((selector: any) => selector(mockDtrState)),
}));

// --- MOCK SERVICES & HOOKS ---
const mockGetInternProfile = vi.fn();
vi.mock('../../services/internProfileService', () => ({
  internProfileService: { getInternProfileByUserId: () => mockGetInternProfile() },
}));

const mockGetProductivity = vi.fn();
vi.mock('../../services/productivityService', () => ({
  productivityService: { getMine: () => mockGetProductivity() },
}));

vi.mock('../../features/dtr/hooks/useDtrSocket', () => ({ useDtrSocket: vi.fn() }));
vi.mock('../../hooks/useTaskListSocket', () => ({ useTaskListSocket: vi.fn() }));

// --- MOCK CHILD COMPONENTS (To isolate Dashboard logic) ---
vi.mock('../../components/widgets/InternProductivityHero', () => ({ default: () => <div data-testid="mock-hero" /> }));
vi.mock('../../components/properClockCard', () => ({
  default: ({ onClockIn, onClockOut, onStartBreak, onEndBreak }: any) => (
    <div data-testid="mock-clock-card">
      <button onClick={onClockIn}>Clock In</button>
      <button onClick={onClockOut}>Clock Out</button>
      <button onClick={onStartBreak}>Start Break</button>
      <button onClick={onEndBreak}>End Break</button>
    </div>
  )
}));
vi.mock('../../components/widgets/ClockHistoryCard', () => ({ default: () => <div data-testid="mock-clock-history" /> }));
vi.mock('./components/TaskBriefWidget', () => ({ default: () => <div data-testid="mock-task-brief" /> }));
vi.mock('../../components/widgets/RecentCompletionsCard', () => ({ default: () => <div data-testid="mock-recent-completions" /> }));
vi.mock('./components/CalendarWidget', () => ({ default: () => <div data-testid="mock-calendar" /> }));
vi.mock('./components/DTRAnalyticsWidget', () => ({ default: () => <div data-testid="mock-dtr-analytics" /> }));

describe('InternDashboard Integration', () => {
  const mockClockIn = vi.fn();
  const mockClockOut = vi.fn();
  const mockStartBreak = vi.fn();
  const mockEndBreak = vi.fn();
  const mockRefreshRecords = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset DTR store state before each test
    mockDtrState = {
      records: [],
      clockedIn: false,
      isOnBreak: false,
      refreshRecords: mockRefreshRecords,
      clockIn: mockClockIn,
      clockOut: mockClockOut,
      startBreak: mockStartBreak,
      endBreak: mockEndBreak,
    };

    // Default API Mocks
    mockGetProductivity.mockResolvedValue({ tasksCompleted: 5 });
    mockGetInternProfile.mockResolvedValue({ required_hours: 480, rendered_hours_total: 100 });

    // Mock window reload
    Object.defineProperty(window, 'location', {
      value: { reload: vi.fn() },
      writable: true,
    });
  });

  it('renders loading skeletons initially, then loads widgets', async () => {
    render(<InternDashboard />);
    
    // Check for hero and clock card (always render immediately)
    expect(screen.getByTestId('mock-hero')).toBeInTheDocument();
    expect(screen.getByTestId('mock-clock-card')).toBeInTheDocument();
    
    // Wait for the simulated network/timeout delay to finish
    await waitFor(() => {
      expect(screen.getByTestId('mock-task-brief')).toBeInTheDocument();
      expect(screen.getByTestId('mock-calendar')).toBeInTheDocument();
      expect(screen.getByTestId('mock-dtr-analytics')).toBeInTheDocument();
    }, { timeout: 1000 });
    
    // Ensure initial API calls were made
    expect(mockRefreshRecords).toHaveBeenCalled();
    expect(mockGetProductivity).toHaveBeenCalled();
    expect(mockGetInternProfile).toHaveBeenCalled();
  });

  it('handles clock in successfully', async () => {
    render(<InternDashboard />);
    
    fireEvent.click(screen.getByText('Clock In'));
    
    await waitFor(() => {
      expect(mockClockIn).toHaveBeenCalledTimes(1);
      expect(window.location.reload).toHaveBeenCalled();
    });
  });

  it('opens clock out modal and requires remarks before submitting', async () => {
    render(<InternDashboard />);
    
    // Specifically target the button so it doesn't conflict with the modal header
    fireEvent.click(screen.getByRole('button', { name: 'Clock Out' }));
    
    await waitFor(() => {
      // Look specifically for the heading inside the modal
      expect(screen.getByRole('heading', { name: 'Clock Out' })).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole('button', { name: /submit & clock out/i });
    
    // Button should be disabled initially (no remarks)
    expect(submitBtn).toBeDisabled();

    // Type remarks
    const textarea = screen.getByPlaceholderText(/e.g. Finished assigned tasks/i);
    fireEvent.change(textarea, { target: { value: 'Finished the testing suite' } });

    // Button should now be enabled
    expect(submitBtn).not.toBeDisabled();
    
    // Submit
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockClockOut).toHaveBeenCalledWith('Finished the testing suite');
      expect(window.location.reload).toHaveBeenCalled();
    });
  });

  it('handles clock out API errors gracefully', async () => {
    mockClockOut.mockRejectedValueOnce({ response: { data: { message: 'Server unavailable' } } });
    render(<InternDashboard />);
    
    // Specifically target the button
    fireEvent.click(screen.getByRole('button', { name: 'Clock Out' }));
    
    await waitFor(() => {
      const textarea = screen.getByPlaceholderText(/e.g. Finished assigned tasks/i);
      fireEvent.change(textarea, { target: { value: 'Trying to leave' } });
    });

    fireEvent.click(screen.getByRole('button', { name: /submit & clock out/i }));

    await waitFor(() => {
      expect(screen.getByText('Server unavailable')).toBeInTheDocument();
    });
  });
});