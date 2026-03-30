import { useEffect, useState } from 'react';
import Modal from '../../../components/ui/Modal';
import type { TaskComment, TaskDetail, TaskFeedback, TaskStatus, TaskWorkLink } from '../../../types/task';
import TaskActions from './TaskActions';
import TaskComments from './TaskComments';
import TaskDetails from './TaskDetails';
import TaskFeedbacks from './TaskFeedbacks';
import TaskLinks from './TaskLinks';
import TaskTimeline from './TaskTimeline';

type TaskModalProps = {
  open: boolean;
  task: TaskDetail | null;
  isLoading: boolean;
  statusUpdating: boolean;
  commentsSubmitting: boolean;
  feedbackSubmitting: boolean;
  linksSubmitting: boolean;
  linkDeletingId: string | null;
  copiedLinkId: string | null;
  commentDraft: string;
  feedbackDraft: string;
  linkDraft: { url: string; label: string };
  onClose: () => void;
  onCommentDraftChange: (value: string) => void;
  onFeedbackDraftChange: (value: string) => void;
  onLinkDraftChange: (draft: { url: string; label: string }) => void;
  onUpdateStatus: (nextStatus: TaskStatus) => void;
  onAddComment: () => void;
  onAddFeedback: () => void;
  onAddLink: () => void;
  onDeleteLink: (workLinkId: string) => void;
  onCopyLink: (workLinkId: string, url: string) => void;
  comments: TaskComment[];
  feedbackItems: TaskFeedback[];
  links: TaskWorkLink[];
  currentUserId: string;
  canSubmitFeedback: boolean;
  canAddLinks: boolean;
  canDeleteAnyLink: boolean;
  canDeleteOwnLink: boolean;
};

export default function TaskModal({
  open,
  task,
  isLoading,
  statusUpdating,
  commentsSubmitting,
  feedbackSubmitting,
  linksSubmitting,
  linkDeletingId,
  copiedLinkId,
  commentDraft,
  feedbackDraft,
  linkDraft,
  onClose,
  onCommentDraftChange,
  onFeedbackDraftChange,
  onLinkDraftChange,
  onUpdateStatus,
  onAddComment,
  onAddFeedback,
  onAddLink,
  onDeleteLink,
  onCopyLink,
  comments,
  feedbackItems,
  links,
  currentUserId,
  canSubmitFeedback,
  canAddLinks,
  canDeleteAnyLink,
  canDeleteOwnLink,
}: TaskModalProps) {
  const [displayTask, setDisplayTask] = useState<TaskDetail | null>(task);

  useEffect(() => {
    if (task) {
      setDisplayTask(task);
    }
  }, [task]);

  return (
    <Modal open={open} onClose={onClose} title={displayTask?.title} className="max-w-5xl">
      {isLoading ? (
        <div className="flex min-h-56 items-center justify-center">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-6 py-5">
            <svg className="h-6 w-6 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" className="opacity-25" />
              <path
                d="M21 12a9 9 0 0 0-9-9"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="opacity-90"
              />
            </svg>
          </div>
        </div>
      ) : !displayTask ? null : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr,1fr]">
          <div className="space-y-4">
            <TaskDetails task={displayTask} />
            <TaskActions task={displayTask} statusUpdating={statusUpdating} onUpdateStatus={onUpdateStatus} />
            <TaskLinks
              currentUserId={currentUserId}
              links={links}
              linkDraft={linkDraft}
              submitting={linksSubmitting}
              deletingId={linkDeletingId}
              copiedId={copiedLinkId}
              canAdd={canAddLinks}
              canDeleteAny={canDeleteAnyLink}
              canDeleteOwn={canDeleteOwnLink}
              onDraftChange={onLinkDraftChange}
              onAdd={onAddLink}
              onDelete={onDeleteLink}
              onCopy={onCopyLink}
            />
            <TaskFeedbacks
              feedbackItems={feedbackItems}
              draft={feedbackDraft}
              submitting={feedbackSubmitting}
              canSubmit={canSubmitFeedback}
              onDraftChange={onFeedbackDraftChange}
              onSubmit={onAddFeedback}
            />
          </div>
          <div className="space-y-4">
            <TaskTimeline history={displayTask.history} />
            <TaskComments
              comments={comments}
              draft={commentDraft}
              submitting={commentsSubmitting}
              onDraftChange={onCommentDraftChange}
              onSubmit={onAddComment}
            />
          </div>
        </div>
      )}
    </Modal>
  );
}
