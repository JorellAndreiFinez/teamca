import { useEffect, useMemo, useState } from 'react';
import { taskService } from '../../../services/taskService';
import type { Task, TaskStatus } from '../../../types/task';

interface TaskBriefWidgetProps {
  tasks?: Task[];
  isLoading?: boolean;
}

const STATUS_ORDER: TaskStatus[] = ['Not Started', 'In Progress', 'Under Review', 'Completed'];

const STATUS_STYLES: Record<TaskStatus, string> = {
  'Not Started': 'border-slate-200 text-slate-700',
  'In Progress': 'border-blue-200 text-blue-700',
  'Under Review': 'border-amber-200 text-amber-700',
  Completed: 'border-emerald-200 text-emerald-700',
};

export default function TaskBriefWidget({ tasks, isLoading: externalLoading = false }: TaskBriefWidgetProps) {
  const [fetchedTasks, setFetchedTasks] = useState<Task[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (tasks) {
      return;
    }

    let cancelled = false;

    const loadTasks = async () => {
      setIsFetching(true);
      try {
        const data = await taskService.getTasks();
        if (!cancelled) {
          setFetchedTasks(data);
        }
      } catch {
        if (!cancelled) {
          setFetchedTasks([]);
        }
      } finally {
        if (!cancelled) {
          setIsFetching(false);
        }
      }
    };

    void loadTasks();

    return () => {
      cancelled = true;
    };
  }, [tasks]);

  const isLoading = externalLoading || (tasks ? false : isFetching);
  const displayTasks = tasks ?? fetchedTasks;

  const statusCounts = useMemo(() => {
    return displayTasks.reduce<Record<TaskStatus, number>>(
      (acc, task) => {
        acc[task.status] += 1;
        return acc;
      },
      {
        'Not Started': 0,
        'In Progress': 0,
        'Under Review': 0,
        Completed: 0,
      },
    );
  }, [displayTasks]);

  const hasAnyTasks = displayTasks.length > 0;

  if (isLoading) {
    return (
      <div className="py-6 text-center text-gray-400">
        <p className="text-sm">Loading task summary...</p>
      </div>
    );
  }

  if (!hasAnyTasks) {
    return (
      <div className="space-y-3 py-4">
        <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-5 text-center">
          <p className="text-sm text-gray-500">No tasks available yet.</p>
        </div>
        <a
          href="/tasks"
          className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
        >
          View All Tasks
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {STATUS_ORDER.map((status) => (
          <div
            key={status}
            className={`rounded-lg border bg-white p-3 shadow-sm transition-shadow hover:shadow ${STATUS_STYLES[status]}`}
          >
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{status}</p>
            <div className="mt-2">
              <p className="text-2xl font-bold leading-none">{statusCounts[status]}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
        <p className="text-xs text-gray-600">
          Total tasks <span className="font-semibold text-gray-800">{displayTasks.length}</span>
        </p>
        <a
          href="/tasks"
          className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
        >
          View All
        </a>
      </div>
    </div>
  );
}
