import React, { useEffect, useMemo, useState } from 'react';

import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { useAuthStore } from '../../store/authStore';
import { taskService } from '../../services/taskService';
import { userService } from '../../services/userService';
import type { CreateTaskPayload, Task, TaskPriority, TaskStatus } from '../../types/task';
import type { User } from '../../types/user';

const STATUS_STYLES: Record<TaskStatus, string> = {
  'Not Started': 'bg-gray-100 text-gray-600',
  'In Progress': 'bg-blue-100 text-blue-700',
  'Under Review': 'bg-yellow-100 text-yellow-700',
  'Completed': 'bg-green-100 text-green-700',
};

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  Low: 'bg-gray-100 text-gray-500',
  Medium: 'bg-orange-100 text-orange-700',
  High: 'bg-red-100 text-red-700',
};

const ALL_STATUSES: TaskStatus[] = ['Not Started', 'In Progress', 'Under Review', 'Completed'];
const ALL_PRIORITIES: TaskPriority[] = ['Low', 'Medium', 'High'];

type RawUser = User & { _id?: string };

const getUserId = (user: RawUser | null | undefined): string => {
  if (!user) return '';
  return user.user_id || user._id || '';
};

const getUserDisplay = (user: RawUser): string => {
  return `${user.first_name} ${user.last_name}`.trim() || user.email;
};

const formatDeadlineLabel = (deadlineISO: string | Date) => {
  const deadline = new Date(deadlineISO);
  const now = new Date();
  const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { text: 'Overdue', urgent: true };
  if (diffDays === 0) return { text: 'Due today', urgent: true };
  if (diffDays === 1) return { text: 'Due tomorrow', urgent: false };
  return { text: `Due in ${diffDays}d`, urgent: false };
};

export default function TasksPage() {
  const user = useAuthStore((state) => state.user as RawUser | null);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const canManageUsers = useAuthStore((state) => state.canManageUsers);
  const canManageOwnDepartment = useAuthStore((state) => state.canManageOwnDepartment);

  const [mounted, setMounted] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<RawUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [serverError, setServerError] = useState('');
  const [filter, setFilter] = useState<TaskStatus | 'All'>('All');

  const currentUserId = getUserId(user);
  const isGlobalManager = canManageUsers();
  const isDepartmentManager = canManageOwnDepartment() && !isGlobalManager;
  const canAssign = isGlobalManager || isDepartmentManager;
  const currentDepartmentId = user?.department_id ? String(user.department_id) : '';

  const [createForm, setCreateForm] = useState<CreateTaskPayload>({
    title: '',
    description: '',
    priority: 'Medium',
    deadline: '',
    assigned_to: currentUserId,
  });

  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !isAuthenticated) return;

    const loadData = async () => {
      setIsLoading(true);
      setServerError('');

      try {
        const [taskItems, allUsers] = await Promise.all([
          taskService.getTasks(),
          canAssign ? userService.getAllUsers() : Promise.resolve([]),
        ]);

        const scopedUsers = (allUsers as RawUser[]).filter((item) => {
          if (!canAssign) {
            return getUserId(item) === currentUserId;
          }

          if (isGlobalManager) {
            return true;
          }

          if (isDepartmentManager) {
            return (
              !!currentDepartmentId &&
              !!item.department_id &&
              String(item.department_id) === currentDepartmentId
            );
          }

          return getUserId(item) === currentUserId;
        });

        setTasks(taskItems);
        setUsers(scopedUsers);
      } catch (error: any) {
        setServerError(error?.response?.data?.message || 'Failed to load tasks.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, [mounted, isAuthenticated, canAssign, isGlobalManager, isDepartmentManager, currentDepartmentId, currentUserId]);

  useEffect(() => {
    setCreateForm((prev) => ({
      ...prev,
      assigned_to: canAssign ? prev.assigned_to || users[0]?._id || users[0]?.user_id || currentUserId : currentUserId,
    }));
  }, [canAssign, currentUserId, users]);

  const statusCounts = useMemo(
    () =>
      ALL_STATUSES.reduce((acc, status) => {
        acc[status] = tasks.filter((task) => task.status === status).length;
        return acc;
      }, {} as Record<TaskStatus, number>),
    [tasks],
  );

  if (!mounted) return null;

  if (!isAuthenticated) {
    window.location.replace('/login');
    return null;
  }

  const filteredTasks = filter === 'All' ? tasks : tasks.filter((task) => task.status === filter);

  const validateCreateForm = () => {
    const errors: Record<string, string> = {};

    if (!createForm.title.trim()) {
      errors.title = 'Title is required.';
    }

    if (!createForm.deadline) {
      errors.deadline = 'Deadline is required.';
    }

    if (!createForm.assigned_to) {
      errors.assigned_to = 'Assignee is required.';
    }

    return errors;
  };

  const handleCreateTask = async (event: React.FormEvent) => {
    event.preventDefault();

    const errors = validateCreateForm();
    setCreateErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setServerError('');

    try {
      const payload: CreateTaskPayload = {
        ...createForm,
        title: createForm.title.trim(),
        description: createForm.description?.trim() || undefined,
        assigned_to: createForm.assigned_to || currentUserId,
      };

      await taskService.createTask(payload);

      const updated = await taskService.getTasks();
      setTasks(updated);

      setCreateForm({
        title: '',
        description: '',
        priority: 'Medium',
        deadline: '',
        assigned_to: canAssign ? currentUserId : currentUserId,
      });
      setCreateErrors({});
      setIsCreateModalOpen(false);
    } catch (error: any) {
      setServerError(error?.response?.data?.message || 'Failed to create task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isGlobalManager
              ? 'Create and assign tasks across all departments.'
              : 'Create and assign tasks for your current department.'}
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsCreateModalOpen(true)}>
          + New Task
        </Button>
      </div>

      {serverError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {ALL_STATUSES.map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`p-3 rounded-xl border text-left transition-colors ${
              filter === status ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}
          >
            <p className="text-xl font-bold text-gray-900">{statusCounts[status]}</p>
            <p className="text-xs text-gray-500 mt-0.5">{status}</p>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {(['All', ...ALL_STATUSES] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === status ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {status} {status !== 'All' && `(${statusCounts[status]})`}
          </button>
        ))}
      </div>

      <Card>
        {isLoading ? (
          <p className="text-center text-gray-400 py-8 text-sm">Loading tasks...</p>
        ) : filteredTasks.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">No tasks in this category</p>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => {
              const deadlineInfo = formatDeadlineLabel(task.deadline);
              return (
                <div
                  key={task.task_id}
                  className="flex items-start gap-4 p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-800">{task.title}</p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_STYLES[task.priority]}`}>
                          {task.priority}
                        </span>
                        <span className={`text-xs ${deadlineInfo.urgent ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                          {deadlineInfo.text}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{task.description || 'No description.'}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[task.status]}`}>
                        {task.status}
                      </span>
                      <span className="text-xs text-gray-400">Created: {new Date(task.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Modal open={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create Task">
        <form onSubmit={handleCreateTask} className="space-y-3">
          <Input
            label="Title"
            value={createForm.title}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, title: e.target.value }))}
            error={createErrors.title}
            placeholder="Enter task title"
          />

          <Input
            label="Description"
            value={createForm.description}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Optional description"
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700" htmlFor="priority">Priority</label>
              <select
                id="priority"
                value={createForm.priority}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, priority: e.target.value as TaskPriority }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
              >
                {ALL_PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>{priority}</option>
                ))}
              </select>
            </div>

            <Input
              label="Deadline"
              type="datetime-local"
              value={createForm.deadline}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, deadline: e.target.value }))}
              error={createErrors.deadline}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700" htmlFor="assignee">Assignee</label>
            {canAssign ? (
              <select
                id="assignee"
                value={createForm.assigned_to || ''}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, assigned_to: e.target.value }))}
                className={`w-full rounded-md border px-3 py-2 text-sm text-gray-900 ${
                  createErrors.assigned_to ? 'border-red-400' : 'border-gray-300'
                }`}
              >
                <option value="">Select assignee</option>
                {users.map((item) => {
                  const itemId = getUserId(item);
                  if (!itemId) return null;
                  return (
                    <option key={itemId} value={itemId}>
                      {getUserDisplay(item)}
                    </option>
                  );
                })}
              </select>
            ) : (
              <Input label="Assigned to" value={getUserDisplay(user as RawUser)} disabled />
            )}
            {createErrors.assigned_to && <p className="text-xs text-red-600">{createErrors.assigned_to}</p>}
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Create Task
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
