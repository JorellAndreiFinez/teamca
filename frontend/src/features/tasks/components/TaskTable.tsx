import type { TaskListItem } from '../../../types/task';
import TaskRow from './TaskRow';

type TaskTableProps = {
  tasks: TaskListItem[];
  isLoading: boolean;
  onRowClick: (taskId: string) => void;
  selectionMode: boolean;
  selectedTaskIds: string[];
  canSelectTask: (task: TaskListItem) => boolean;
  onToggleTaskSelection: (taskId: string) => void;
};

export default function TaskTable({
  tasks,
  isLoading,
  onRowClick,
  selectionMode,
  selectedTaskIds,
  canSelectTask,
  onToggleTaskSelection,
}: TaskTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
        Loading tasks...
      </div>
    );
  }

  if (!tasks.length) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
        No tasks found for the selected filters.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <table className="min-w-full text-left">
        <thead className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
          <tr>
            {selectionMode ? <th className="w-12 px-4 py-3" aria-label="Select" /> : null}
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Task Title</th>
            <th className="px-4 py-3">Assigned Users</th>
            <th className="px-4 py-3">Priority</th>
            <th className="px-4 py-3">Deadline</th>
            <th className="w-20 px-4 py-3 text-center">Comments</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {tasks.map((task) => (
            <TaskRow
              key={task.task_id}
              task={task}
              onClick={() => onRowClick(String(task.task_id))}
              selectionMode={selectionMode}
              selected={selectedTaskIds.includes(String(task.task_id))}
              canSelect={canSelectTask(task)}
              onToggleSelect={() => onToggleTaskSelection(String(task.task_id))}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
