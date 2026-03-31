import type { TaskListItem, TaskPriority, TaskStatus } from '../../../types/task';
import { formatTaskDeadlineLabel } from '../../../utils/dateUtils';

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

const isOverdueDeadline = (value?: string | Date): boolean => {
  if (!value) {
    return false;
  }

  const deadline = new Date(value);
  if (Number.isNaN(deadline.getTime())) {
    return false;
  }

  const now = new Date();
  const deadlineDay = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate()).getTime();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return deadlineDay < today;
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
  const isOverdue = isOverdueDeadline(task.deadline);
  const completionDeadlineLabel = !task.deadline
    ? 'Completed'
    : isOverdue
      ? 'Completed late'
      : 'Completed on-time';
  const rowClassName = isCompleted
    ? 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
    : 'hover:bg-slate-50';
  const nonDeletableClassName = selectionMode && !canSelect ? 'bg-amber-50/60' : '';
  const rowCursorClassName = selectionMode && !canSelect ? 'cursor-not-allowed' : 'cursor-pointer';

  return (
    <tr
      className={`${rowCursorClassName} border-b border-slate-100 ${rowClassName} ${nonDeletableClassName}`}
      onClick={selectionMode ? (canSelect ? onToggleSelect : undefined) : onClick}
    >
      {selectionMode ? (
        <td className="px-3 py-3" onClick={(event) => event.stopPropagation()}>
          <input
            type="checkbox"
            checked={selected}
            disabled={!canSelect}
            onChange={onToggleSelect}
            className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-200 disabled:cursor-not-allowed"
            title={canSelect ? 'Selectable for deletion' : 'Not deletable: completed tasks require superadmin; otherwise only creator or admin can delete'}
          />
        </td>
      ) : null}
      <td className="whitespace-nowrap px-3 py-3">
        <span className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_STYLES[task.status]}`}>
          {task.status}
        </span>
      </td>
      <td className={`px-3 py-3 text-sm font-medium ${isCompleted ? 'text-slate-700' : 'text-slate-900'}`}>
        <div className="flex items-center gap-2">
          <span>{task.title}</span>
          {selectionMode && !canSelect ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
              Not deletable
            </span>
          ) : null}
        </div>
      </td>
      <td className="px-3 py-3 text-sm text-slate-600">{formatAssignees(task)}</td>
      <td className="whitespace-nowrap px-3 py-3">
        <span className={`rounded-full px-2 py-1 text-xs font-medium ${PRIORITY_STYLES[task.priority]}`}>
          {task.priority}
        </span>
      </td>
      <td
        className={`whitespace-nowrap px-3 py-3 text-sm ${isCompleted ? (isOverdue ? 'text-rose-600' : 'text-emerald-700') : (isOverdue ? 'text-rose-600' : 'text-slate-600')}`}
        title={formatDate(task.deadline)}
      >
        {isCompleted ? completionDeadlineLabel : formatTaskDeadlineLabel(task.deadline)}
      </td>
      <td className="w-20 whitespace-nowrap py-3 pl-3 pr-6 text-center text-sm text-slate-600">{task.comments_count}</td>
    </tr>
  );
}
