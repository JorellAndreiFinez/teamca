import type { TaskListItem, TaskPriority, TaskStatus } from '../../../types/task';
import { formatTaskDeadlineLabel, isOverdueDeadline } from '../../../utils/dateUtils';

const STATUS_STYLES: Record<TaskStatus, string> = {
  'Not Started': 'border-slate-200/70 bg-slate-50 text-slate-700',
  'In Progress': 'border-sky-200/70 bg-sky-50 text-sky-700',
  'Under Review': 'border-amber-200/70 bg-amber-50 text-amber-700',
  'Completed': 'border-emerald-200/70 bg-emerald-50 text-emerald-700',
};

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  Low: 'border-slate-200/70 bg-slate-50 text-slate-700',
  Medium: 'border-amber-200/70 bg-amber-50 text-amber-700',
  High: 'border-rose-200/70 bg-rose-50 text-rose-700',
};

type TaskRowProps = {
  task: TaskListItem;
  onClick: () => void;
  selectionMode: boolean;
  selected: boolean;
  canSelect: boolean;
  onToggleSelect: () => void;
};

const formatDate = (value?: string | Date) => {
  if (!value) {
    return 'No due';
  }

  return new Date(value).toLocaleDateString();
};


const formatAssignees = (task: TaskListItem) => {
  if (!task.assigned_users.length) {
    return 'Unassigned';
  }

  return task.assigned_users
    .slice(0, 2)
    .map((user) => `${user.first_name} ${user.last_name}`.trim() || user.email)
    .join(', ');
};

export default function TaskRow({ task, onClick, selectionMode, selected, canSelect, onToggleSelect }: TaskRowProps) {
  const isCompleted = task.status === 'Completed';
  const isOverdue = task.is_overdue ?? isOverdueDeadline(task.deadline, task.status);
  const completionDeadlineLabel = !task.deadline
    ? 'Completed'
    : isOverdue
      ? 'Completed late'
      : 'Completed on-time';
  const rowClassName = isCompleted
    ? 'bg-slate-50 text-slate-600 hover:bg-slate-100/70'
    : 'hover:bg-slate-50';
  const nonDeletableClassName = selectionMode && !canSelect ? 'bg-amber-50/80' : '';
  const rowCursorClassName = selectionMode && !canSelect ? 'cursor-not-allowed' : 'cursor-pointer';

  return (
    <tr
      className={`transition-colors ${rowCursorClassName} border-b border-slate-200 ${rowClassName} ${nonDeletableClassName}`}
      onClick={selectionMode ? (canSelect ? onToggleSelect : undefined) : onClick}
    >
      {selectionMode ? (
        <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
          <input
            type="checkbox"
            checked={selected}
            disabled={!canSelect}
            onChange={onToggleSelect}
            className="h-4 w-4 rounded border-slate-300 text-rose-600 disabled:cursor-not-allowed"
            title={canSelect ? 'Selectable for deletion' : 'Not deletable: completed tasks require superadmin; otherwise only creator or admin can delete'}
          />
        </td>
      ) : null}
      <td className="whitespace-nowrap px-4 py-3">
        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[task.status]}`}>
          {task.status}
        </span>
      </td>
      <td className={`px-4 py-3 text-sm font-medium ${isCompleted ? 'text-slate-700' : 'text-slate-900'}`}>
        <div className="flex items-center gap-2">
          <span>{task.title}</span>
          {selectionMode && !canSelect ? (
            <span className="rounded-full border border-amber-200/70 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700">
              Not deletable
            </span>
          ) : null}
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">{formatAssignees(task)}</td>
      <td className="whitespace-nowrap px-4 py-3">
        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${PRIORITY_STYLES[task.priority]}`}>
          {task.priority}
        </span>
      </td>
      <td
        className={`whitespace-nowrap px-4 py-3 text-sm tabular-nums ${isCompleted ? (isOverdue ? 'text-rose-600' : 'text-emerald-700') : (isOverdue ? 'text-rose-600' : 'text-slate-600')}`}
        title={formatDate(task.deadline)}
      >
        {isCompleted ? completionDeadlineLabel : formatTaskDeadlineLabel(task.deadline)}
      </td>
      <td className="w-20 whitespace-nowrap px-4 py-3 text-center text-sm text-slate-600">{task.comments_count}</td>
    </tr>
  );
}
