import Button from '../../../components/ui/Button';
import type { Task, TaskFeedback, TaskStatus } from '../../../types/task';
import type { StatusActions } from '../domain/taskPolicy';

type AssignableUser = {
  id: string;
  display: string;
};

type TaskCardProps = {
  task: Task;
  statusActions: StatusActions;
  statusUpdating: boolean;
  historyLoading: boolean;
  workLinksLoading: boolean;
  workLinksCount: number;
  assigneeDisplayNames: string[];
  onOpenHistory: () => void;
  onAdvance: (nextStatus: TaskStatus) => void;
  onRevert: (prevStatus: TaskStatus) => void;
  onOpenLinks: () => void;
  canAssign: boolean;
  availableUsers: AssignableUser[];
  selectedAssignees: string[];
  onToggleAssignee: (userId: string) => void;
  onAssignUsers: () => void;
  assignSubmitting: boolean;
  isInternAssigner: boolean;
  currentUserId: string;
  feedbackOpen: boolean;
  feedbackLoading: boolean;
  feedbackSubmitting: boolean;
  feedbackItems: TaskFeedback[];
  feedbackDraft: string;
  canSubmitFeedback: boolean;
  onToggleFeedback: () => void;
  onFeedbackDraftChange: (value: string) => void;
  onSubmitFeedback: () => void;
};

const STATUS_STYLES: Record<TaskStatus, string> = {
  'Not Started': 'bg-gray-100 text-gray-600',
  'In Progress': 'bg-blue-100 text-blue-700',
  'Under Review': 'bg-yellow-100 text-yellow-700',
  'Completed': 'bg-green-100 text-green-700',
};

const PRIORITY_STYLES = {
  Low: 'bg-gray-100 text-gray-500',
  Medium: 'bg-orange-100 text-orange-700',
  High: 'bg-red-100 text-red-700',
} as const;

const formatDeadlineLabel = (deadlineISO: string | Date) => {
  const deadline = new Date(deadlineISO);
  const now = new Date();
  const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { text: 'Overdue', urgent: true };
  if (diffDays === 0) return { text: 'Due today', urgent: true };
  if (diffDays === 1) return { text: 'Due tomorrow', urgent: false };
  return { text: `Due in ${diffDays}d`, urgent: false };
};

export default function TaskCard({
  task,
  statusActions,
  statusUpdating,
  historyLoading,
  workLinksLoading,
  workLinksCount,
  assigneeDisplayNames,
  onOpenHistory,
  onAdvance,
  onRevert,
  onOpenLinks,
  canAssign,
  availableUsers,
  selectedAssignees,
  onToggleAssignee,
  onAssignUsers,
  assignSubmitting,
  isInternAssigner,
  currentUserId,
  feedbackOpen,
  feedbackLoading,
  feedbackSubmitting,
  feedbackItems,
  feedbackDraft,
  canSubmitFeedback,
  onToggleFeedback,
  onFeedbackDraftChange,
  onSubmitFeedback,
}: TaskCardProps) {
  const deadlineInfo = formatDeadlineLabel(task.deadline);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="line-clamp-2 text-sm font-semibold leading-5 text-slate-900">{task.title}</p>
          <div className="flex flex-shrink-0 items-center gap-1.5">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              loading={historyLoading}
              title="Toggle timeline"
              aria-label="Toggle timeline"
              onClick={onOpenHistory}
            >
              History
            </Button>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLES[task.priority]}`}>
              {task.priority}
            </span>
            <span className={`text-xs ${deadlineInfo.urgent ? 'font-medium text-red-600' : 'text-slate-400'}`}>
              {deadlineInfo.text}
            </span>
          </div>
        </div>

        <p className="mt-1 line-clamp-2 text-xs text-slate-500">{task.description || 'No description.'}</p>

        <div className="mt-2 flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[task.status]}`}>
            {task.status}
          </span>
          <span className="text-xs text-slate-400">Created {new Date(task.created_at).toLocaleDateString()}</span>
        </div>

        <div className="mt-2 flex flex-wrap gap-1">
          {assigneeDisplayNames.length === 0 ? (
            <span className="text-xs text-slate-400">No assignees yet</span>
          ) : (
            assigneeDisplayNames.map((name, index) => (
              <span key={`${String(task.task_id)}-assignee-${index}`} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                {name}
              </span>
            ))
          )}
        </div>

        {(statusActions.advance || statusActions.revert) && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {statusActions.advance && (
              <Button
                type="button"
                size="md"
                variant="primary"
                loading={statusUpdating}
                onClick={() => onAdvance(statusActions.advance as TaskStatus)}
              >
                Move to {statusActions.advance}
              </Button>
            )}
            {statusActions.revert && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                loading={statusUpdating}
                onClick={() => onRevert(statusActions.revert as TaskStatus)}
              >
                Revert to {statusActions.revert}
              </Button>
            )}
          </div>
        )}

        <div className="mt-3 flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            loading={workLinksLoading}
            onClick={onOpenLinks}
          >
            Links
          </Button>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
            {workLinksCount} attached
          </span>
        </div>

        {canAssign && statusActions.canEdit && availableUsers.length > 0 && (
          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-700">Assign people</p>
            <div className="mt-2 max-h-36 space-y-1 overflow-y-auto rounded-md border border-slate-200 bg-transparent p-2">
              {availableUsers.map((item) => {
                const selfLocked = isInternAssigner && item.id === currentUserId;
                const checked = selfLocked || selectedAssignees.includes(item.id);
                return (
                  <label key={`${String(task.task_id)}-${item.id}`} className="flex items-center gap-2 text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={selfLocked}
                      onChange={() => {
                        if (selfLocked) return;
                        onToggleAssignee(item.id);
                      }}
                    />
                    <span>{item.display}</span>
                  </label>
                );
              })}
            </div>
            <div className="mt-2 flex justify-end">
              <Button type="button" size="sm" variant="outline" loading={assignSubmitting} onClick={onAssignUsers}>
                Add Assignees
              </Button>
            </div>
            {isInternAssigner && <p className="mt-1 text-[11px] text-slate-500">Intern assignments always include you.</p>}
          </div>
        )}

        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-slate-700">Supervisor Feedback</p>
            <Button type="button" size="sm" variant="outline" onClick={onToggleFeedback} loading={feedbackLoading}>
              {feedbackOpen ? 'Hide' : 'View'} Feedback
            </Button>
          </div>

          {feedbackOpen && (
            <div className="mt-2 space-y-2">
              {feedbackLoading ? (
                <p className="text-xs text-slate-500">Loading feedback...</p>
              ) : feedbackItems.length === 0 ? (
                <p className="text-xs text-slate-500">No feedback yet.</p>
              ) : (
                <div className="space-y-2">
                  {feedbackItems.map((feedback) => (
                    <div key={feedback.feedback_id} className="rounded-md border border-slate-200 bg-slate-100 p-2">
                      <p className="text-xs text-slate-700">{feedback.comments}</p>
                      <p className="mt-1 text-[11px] text-slate-500">{new Date(feedback.created_at).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}

              {canSubmitFeedback && (
                <div className="space-y-2">
                  <textarea
                    value={feedbackDraft}
                    onChange={(e) => onFeedbackDraftChange(e.target.value)}
                    rows={3}
                    placeholder="Write feedback for this task"
                    className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs text-slate-700"
                  />
                  <div className="flex justify-end">
                    <Button type="button" size="sm" variant="outline" loading={feedbackSubmitting} onClick={onSubmitFeedback}>
                      Submit Feedback
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
