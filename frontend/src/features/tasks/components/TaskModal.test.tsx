/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TaskModal from './TaskModal';

// --- MOCK SUB-COMPONENTS ---
// We mock the children so we can test the Modal's orchestration logic 
// without worrying about the internal requirements of every sub-widget.

vi.mock('../../../components/ui/Modal', () => ({
  default: ({ children, title, headerAction, open }: any) => open ? (
    <div data-testid="mock-modal">
      <h1>{title}</h1>
      <div data-testid="modal-header-action">{headerAction}</div>
      <div>{children}</div>
    </div>
  ) : null
}));

vi.mock('./TaskActions', () => ({ default: () => <div data-testid="mock-task-actions" /> }));
vi.mock('./TaskComments', () => ({ default: () => <div data-testid="mock-task-comments" /> }));
vi.mock('./TaskDetails', () => ({ default: () => <div data-testid="mock-task-details" /> }));
vi.mock('./TaskFeedbacks', () => ({ default: () => <div data-testid="mock-task-feedbacks" /> }));
vi.mock('./TaskLinks', () => ({ default: () => <div data-testid="mock-task-links" /> }));
vi.mock('./TaskTimeline', () => ({ default: () => <div data-testid="mock-task-timeline" /> }));
vi.mock('../../../components/ui/Skeleton', () => ({ 
  WidgetSkeleton: () => <div data-testid="mock-skeleton" /> 
}));

describe('TaskModal Component', () => {
  const mockOnEditTaskDetails = vi.fn();
  const mockOnClose = vi.fn();

  // A helper object containing all the required props so we don't have to rewrite them
  const defaultProps: any = {
    open: true,
    task: { id: 'task-1', title: 'Compile Final Report', history: [] },
    isLoading: false,
    statusUpdating: false,
    commentsSubmitting: false,
    feedbackSubmitting: false,
    linksSubmitting: false,
    linkDeletingId: null,
    copiedLinkId: null,
    linkReviewingId: null,
    commentDraft: '',
    feedbackDraft: '',
    linkDraft: { url: '', label: '' },
    onClose: mockOnClose,
    onCommentDraftChange: vi.fn(),
    onFeedbackDraftChange: vi.fn(),
    onLinkDraftChange: vi.fn(),
    onUpdateStatus: vi.fn(),
    onAddComment: vi.fn(),
    onAddFeedback: vi.fn(),
    onAddLink: vi.fn(),
    onDeleteLink: vi.fn(),
    onCopyLink: vi.fn(),
    onReviewLink: vi.fn(),
    comments: [],
    feedbackItems: [],
    links: [],
    currentUserId: 'user-1',
    canSubmitFeedback: true,
    canAddLinks: true,
    canDeleteAnyLink: false,
    canDeleteOwnLink: true,
    canReviewLinks: false,
    canEditTaskDetails: false, // Defaulting to false for base tests
    onEditTaskDetails: mockOnEditTaskDetails,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when open is false', () => {
    render(<TaskModal {...defaultProps} open={false} />);
    expect(screen.queryByTestId('mock-modal')).not.toBeInTheDocument();
  });

  it('renders the loading skeletons when isLoading is true', () => {
    render(<TaskModal {...defaultProps} isLoading={true} />);
    
    // Skeletons should be visible
    const skeletons = screen.getAllByTestId('mock-skeleton');
    expect(skeletons.length).toBeGreaterThan(0);

    // Sub-components should NOT be visible
    expect(screen.queryByTestId('mock-task-details')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mock-task-timeline')).not.toBeInTheDocument();
  });

  it('renders all sub-components when loaded', () => {
    render(<TaskModal {...defaultProps} />);
    
    // Verify the title was passed to the modal
    expect(screen.getByText('Compile Final Report')).toBeInTheDocument();

    // Verify all widgets are orchestrated properly
    expect(screen.getByTestId('mock-task-details')).toBeInTheDocument();
    expect(screen.getByTestId('mock-task-actions')).toBeInTheDocument();
    expect(screen.getByTestId('mock-task-links')).toBeInTheDocument();
    expect(screen.getByTestId('mock-task-feedbacks')).toBeInTheDocument();
    expect(screen.getByTestId('mock-task-timeline')).toBeInTheDocument();
    expect(screen.getByTestId('mock-task-comments')).toBeInTheDocument();

    // Skeletons should NOT be visible
    expect(screen.queryByTestId('mock-skeleton')).not.toBeInTheDocument();
  });

  it('does not render the Edit Details button if canEditTaskDetails is false', () => {
    render(<TaskModal {...defaultProps} canEditTaskDetails={false} />);
    expect(screen.queryByRole('button', { name: /edit details/i })).not.toBeInTheDocument();
  });

  it('renders the Edit Details button and fires callback if canEditTaskDetails is true', () => {
    render(<TaskModal {...defaultProps} canEditTaskDetails={true} />);
    
    const editButton = screen.getByRole('button', { name: /edit details/i });
    expect(editButton).toBeInTheDocument();

    fireEvent.click(editButton);
    expect(mockOnEditTaskDetails).toHaveBeenCalledTimes(1);
  });
});