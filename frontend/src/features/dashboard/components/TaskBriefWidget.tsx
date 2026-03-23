import React from 'react';
import type { Task } from '../../../types/task';

interface TaskBriefWidgetProps {
  tasks?: Task[];
}

// Mock tasks for demo when no real data
const MOCK_TASKS: Task[] = [
  {
    task_id: 1,
    title: 'Update Project Documentation',
    description: 'Review and update the README and API docs',
    created_by: 'supervisor-1',
    status: 'In Progress',
    priority: 'High',
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    task_id: 2,
    title: 'Complete UI Wireframes',
    description: 'Create wireframes for the dashboard redesign',
    created_by: 'supervisor-1',
    status: 'Not Started',
    priority: 'Medium',
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    task_id: 3,
    title: 'Fix Navigation Bug',
    description: 'Resolve the broken link on the reports page',
    created_by: 'supervisor-2',
    status: 'Under Review',
    priority: 'High',
    deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    task_id: 4,
    title: 'Research New Framework Options',
    description: 'Evaluate alternative frontend frameworks for Q3',
    created_by: 'supervisor-1',
    status: 'Not Started',
    priority: 'Low',
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
];

const STATUS_STYLES: Record<string, string> = {
  'Not Started': 'bg-gray-100 text-gray-600',
  'In Progress': 'bg-blue-100 text-blue-700',
  'Under Review': 'bg-yellow-100 text-yellow-700',
  'Completed': 'bg-green-100 text-green-700',
};

const PRIORITY_STYLES: Record<string, string> = {
  Low: 'bg-gray-100 text-gray-500',
  Medium: 'bg-orange-100 text-orange-700',
  High: 'bg-red-100 text-red-700',
};

function formatDeadline(date: Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Overdue';
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Due tomorrow';
  return `Due in ${diffDays} days`;
}

export default function TaskBriefWidget({ tasks }: TaskBriefWidgetProps) {
  const displayTasks = tasks ?? MOCK_TASKS;
  const activeTasks = displayTasks
    .filter((t) => t.status !== 'Completed')
    .slice(0, 4);

  if (activeTasks.length === 0) {
    return (
      <div className="text-center py-6 text-gray-400">
        <p className="text-sm">No active tasks</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activeTasks.map((task) => {
        const deadlineText = formatDeadline(task.deadline);
        const isOverdue = deadlineText === 'Overdue';

        return (
          <div
            key={task.task_id}
            className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{task.title}</p>
              <p className="text-xs text-gray-500 mt-0.5 truncate">{task.description}</p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[task.status]}`}>
                  {task.status}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_STYLES[task.priority]}`}>
                  {task.priority}
                </span>
                <span className={`text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                  {deadlineText}
                </span>
              </div>
            </div>
          </div>
        );
      })}

      {displayTasks.length > 4 && (
        <a
          href="/tasks"
          className="block text-center text-xs text-blue-600 hover:underline pt-1"
        >
          View all {displayTasks.length} tasks →
        </a>
      )}
    </div>
  );
}
