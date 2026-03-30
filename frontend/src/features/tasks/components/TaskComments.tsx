import Button from '../../../components/ui/Button';
import type { TaskComment } from '../../../types/task';

type TaskCommentsProps = {
  comments: TaskComment[];
  draft: string;
  submitting: boolean;
  onDraftChange: (value: string) => void;
  onSubmit: () => void;
};

const COMMENT_DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

const COMMENT_TIME_FORMATTER = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
});

const formatCommentDate = (value: string | Date) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return `${COMMENT_DATE_FORMATTER.format(date)} (${COMMENT_TIME_FORMATTER.format(date)})`;
};

export default function TaskComments({ comments, draft, submitting, onDraftChange, onSubmit }: TaskCommentsProps) {
  return (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <h4 className="text-sm font-semibold text-slate-900">Comments</h4>

      <div className="space-y-2 rounded-md border border-slate-200 p-2">
        {!comments.length ? (
          <p className="text-sm text-slate-500">No comments yet.</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.comment_id} className="rounded-md bg-slate-50 p-2">
              <p className="text-xs text-slate-500">
                {comment.user
                  ? `${comment.user.first_name} ${comment.user.last_name}`.trim() || comment.user.email
                  : 'Unknown user'}
                {' • '}
                {formatCommentDate(comment.created_at)}
              </p>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-700">{comment.message}</p>
            </div>
          ))
        )}
      </div>

      <div className="space-y-2">
        <textarea
          rows={4}
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          placeholder="Write a comment..."
          className="h-32 w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
        />
        <Button type="button" size="sm" loading={submitting} onClick={onSubmit}>
          Send comment
        </Button>
      </div>
    </section>
  );
}
