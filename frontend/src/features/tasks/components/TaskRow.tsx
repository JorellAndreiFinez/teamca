import type { TaskListItem, TaskPriority, TaskStatus } from '../../../types/task';

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
};

const formatDate = (value: string | Date) => {
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

export default function TaskRow({ task, onClick }: TaskRowProps) {
  return (
    <tr className="cursor-pointer border-b border-slate-100 hover:bg-slate-50" onClick={onClick}>
      <td className="whitespace-nowrap px-3 py-3">
        <span className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_STYLES[task.status]}`}>
          {task.status}
        </span>
      </td>
      <td className="px-3 py-3 text-sm font-medium text-slate-900">{task.title}</td>
      <td className="px-3 py-3 text-sm text-slate-600">{formatAssignees(task)}</td>
      <td className="whitespace-nowrap px-3 py-3">
        <span className={`rounded-full px-2 py-1 text-xs font-medium ${PRIORITY_STYLES[task.priority]}`}>
          {task.priority}
        </span>
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-sm text-slate-600">{formatDate(task.deadline)}</td>
      <td className="whitespace-nowrap px-3 py-3 text-sm text-slate-600">{task.links_count}</td>
    </tr>
  );
}
