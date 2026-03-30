import type { TaskDetail, TaskPriority, TaskStatus } from '../../../types/task';

const STATUS_STYLES: Record<TaskStatus, string> = {
  'Not Started': 'bg-slate-100 text-slate-700',
  'In Progress': 'bg-sky-100 text-sky-700',
  'Under Review': 'bg-amber-100 text-amber-700',
  'Completed': 'bg-emerald-100 text-emerald-700',
};

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  Low: 'bg-slate-100 text-slate-700',
  Medium: 'bg-orange-100 text-orange-700',
  High: 'bg-rose-100 text-rose-700',
};

type TaskDetailsProps = {
  task: TaskDetail;
};

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

const TIME_ONLY_FORMATTER = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
});

const formatDateTime = (value?: string | Date) => {
  if (!value) {
    return 'No due';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'No due';
  }

  return `${DATE_TIME_FORMATTER.format(date)} (${TIME_ONLY_FORMATTER.format(date)})`;
};

const formatUserName = (user: TaskDetail['assigned_users'][number] | null | undefined) => {
  if (!user) {
    return 'Unknown user';
  }

  return `${user.first_name} ${user.last_name}`.trim() || user.email || 'Unknown user';
};

export default function TaskDetails({ task }: TaskDetailsProps) {
  const historyByLatest = [...task.history].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const approvedByEntry = historyByLatest.find(
    (item) => item.previous_status === 'Under Review' && item.new_status === 'Completed'
  );

  return (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <h4 className="text-sm font-semibold text-slate-900">Task Information</h4>
      <p className="text-sm text-slate-600">{task.description || 'No description.'}</p>
      <div className="flex flex-wrap gap-2">
        <span className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_STYLES[task.status]}`}>{task.status}</span>
        <span className={`rounded-full px-2 py-1 text-xs font-medium ${PRIORITY_STYLES[task.priority]}`}>{task.priority}</span>
      </div>

      <div className="grid grid-cols-1 gap-2 text-sm text-slate-600 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Deadline</p>
          <p>{formatDateTime(task.deadline)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Created</p>
          <p>{formatDateTime(task.created_at)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 text-sm text-slate-600 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Assigned Users</p>
          <p className="text-sm text-slate-700">
            {task.assigned_users.length
              ? task.assigned_users.map((user) => `${user.first_name} ${user.last_name}`.trim() || user.email).join(', ')
              : 'Unassigned'}
          </p>
        </div>
        {task.status === 'Completed' && approvedByEntry ? (
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Approved By</p>
            <p className="text-sm text-slate-700">{formatUserName(approvedByEntry.updated_by_user || null)}</p>
          </div>
        ) : null}
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400">Involved Departments</p>
        <p className="text-sm text-slate-700">
          {task.involved_departments.length
            ? task.involved_departments.map((department) => department.department_name).join(', ')
            : 'No departments found'}
        </p>
      </div>
    </section>
  );
}
