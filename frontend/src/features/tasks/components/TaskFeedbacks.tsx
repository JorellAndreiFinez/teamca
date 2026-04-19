import Button from '../../../components/ui/Button';
import type { TaskFeedback } from '../../../types/task';

type TaskFeedbacksProps = {
  feedbackItems: TaskFeedback[];
  draft: string;
  submitting: boolean;
  canSubmit: boolean;
  onDraftChange: (value: string) => void;
  onSubmit: () => void;
};

const FEEDBACK_DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

const FEEDBACK_TIME_FORMATTER = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
});

const formatFeedbackDate = (value: string | Date) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return `${FEEDBACK_DATE_FORMATTER.format(date)} (${FEEDBACK_TIME_FORMATTER.format(date)})`;
};

export default function TaskFeedbacks({
  feedbackItems,
  draft,
  submitting,
  canSubmit,
  onDraftChange,
  onSubmit,
}: TaskFeedbacksProps) {
  return (
    <section className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/40 p-4">
      <h4 className="text-sm font-semibold text-amber-900">Review Feedback</h4>

      <div className="space-y-2 rounded-md border border-amber-200 bg-white p-2">
        {!feedbackItems.length ? (
          <p className="text-sm text-amber-700">No review feedback yet.</p>
        ) : (
          feedbackItems.map((feedback) => (
            <div key={feedback.feedback_id} className="rounded-md border border-amber-100 bg-amber-50 p-2">
              <p className="text-xs font-medium text-amber-800">
                Reviewer
                {' • '}
                {formatFeedbackDate(feedback.created_at)}
              </p>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm text-amber-900">{feedback.comments}</p>
            </div>
          ))
        )}
      </div>

      {canSubmit ? (
        <div className="space-y-2">
          <textarea
            rows={4}
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            placeholder="Provide formal review feedback..."
            className="h-32 w-full resize-none rounded-md border border-amber-300 bg-white px-3 py-2 text-sm text-slate-900"
          />
          <Button type="button" size="sm" loading={submitting} onClick={onSubmit}>
            Submit feedback
          </Button>
        </div>
      ) : (
        <p className="text-xs text-amber-700">Only Heads and above can submit feedback.</p>
      )}
    </section>
  );
}