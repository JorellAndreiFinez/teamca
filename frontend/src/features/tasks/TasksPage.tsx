import React, { useEffect, useMemo, useState } from 'react';

import { useAuthStore } from '../../store/authStore';
import { taskService } from '../../services/taskService';
import { userService } from '../../services/userService';
import type { CreateTaskPayload, Task, TaskFeedback, TaskPriority, TaskStatus, TaskStatusHistory, TaskWorkLink } from '../../types/task';
import type { User } from '../../types/user';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import TaskCard from './components/TaskCard';
import TimelineModal from './components/TimelineModal';
import WorkLinksModal from './components/WorkLinksModal';

const ALL_STATUSES: TaskStatus[] = ['Not Started', 'In Progress', 'Under Review', 'Completed'];
const ALL_PRIORITIES: TaskPriority[] = ['Low', 'Medium', 'High'];
const TASKS_PER_PAGE = 10;

type StatusActions = { canEdit: boolean; advance?: TaskStatus; revert?: TaskStatus };
type PendingWorkLinkDeletion = {
  taskId: string;
  workLinkId: string;
  label: string;
};

type RawUser = User & { _id?: string };

const getUserId = (user: RawUser | null | undefined): string => {
  if (!user) return '';
  return user.user_id || user._id || '';
};

const getUserDisplay = (user: RawUser): string => {
  return `${user.first_name} ${user.last_name}`.trim() || user.email;
};

const toggleSelection = (selected: string[], userId: string): string[] => {
  if (selected.includes(userId)) {
    return selected.filter((id) => id !== userId);
  }

  return [...selected, userId];
};

const hasSetupName = (user: RawUser): boolean => {
  return Boolean(user.first_name?.trim() && user.last_name?.trim());
};

const MANAGER_ADVANCE: Partial<Record<TaskStatus, TaskStatus>> = {
  'Not Started': 'In Progress',
  'In Progress': 'Under Review',
  'Under Review': 'Completed',
};

const MANAGER_REVERT: Partial<Record<TaskStatus, TaskStatus>> = {
  'In Progress': 'Not Started',
  'Under Review': 'In Progress',
};

const INTERN_ADVANCE: Partial<Record<TaskStatus, TaskStatus>> = {
  'Not Started': 'In Progress',
  'In Progress': 'Under Review',
};

const INTERN_REVERT: Partial<Record<TaskStatus, TaskStatus>> = {
  'In Progress': 'Not Started',
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
  const [statusUpdatingTaskId, setStatusUpdatingTaskId] = useState<string | null>(null);
  const [feedbackByTaskId, setFeedbackByTaskId] = useState<Record<string, TaskFeedback[]>>({});
  const [feedbackOpenByTaskId, setFeedbackOpenByTaskId] = useState<Record<string, boolean>>({});
  const [feedbackDraftByTaskId, setFeedbackDraftByTaskId] = useState<Record<string, string>>({});
  const [feedbackLoadingTaskId, setFeedbackLoadingTaskId] = useState<string | null>(null);
  const [feedbackSubmittingTaskId, setFeedbackSubmittingTaskId] = useState<string | null>(null);
  const [workLinksByTaskId, setWorkLinksByTaskId] = useState<Record<string, TaskWorkLink[]>>({});
  const [workLinksLoadingTaskId, setWorkLinksLoadingTaskId] = useState<string | null>(null);
  const [workLinksSubmittingTaskId, setWorkLinksSubmittingTaskId] = useState<string | null>(null);
  const [workLinksDeletingId, setWorkLinksDeletingId] = useState<string | null>(null);
  const [pendingWorkLinkDeletion, setPendingWorkLinkDeletion] = useState<PendingWorkLinkDeletion | null>(null);
  const [workLinkDraftByTaskId, setWorkLinkDraftByTaskId] = useState<Record<string, { url: string; label: string }>>({});
  const [workLinksModalTaskId, setWorkLinksModalTaskId] = useState<string | null>(null);
  const [copiedWorkLinkId, setCopiedWorkLinkId] = useState<string | null>(null);
  const [historyByTaskId, setHistoryByTaskId] = useState<Record<string, TaskStatusHistory[]>>({});
  const [historyLoadingTaskId, setHistoryLoadingTaskId] = useState<string | null>(null);
  const [timelineModalTaskId, setTimelineModalTaskId] = useState<string | null>(null);
  const [assignDraftByTaskId, setAssignDraftByTaskId] = useState<Record<string, string[]>>({});
  const [assignSubmittingTaskId, setAssignSubmittingTaskId] = useState<string | null>(null);
  const [serverError, setServerError] = useState('');
  const [filter, setFilter] = useState<TaskStatus | 'All'>('All');
  const [currentPage, setCurrentPage] = useState(1);

  const currentUserId = getUserId(user);
  const isGlobalManager = canManageUsers();
  const isDepartmentManager = canManageOwnDepartment() && !isGlobalManager;
  const isInternAssigner = user?.global_role === 'Standard_User' && user?.department_role === 'Intern';
  const canAssign = isGlobalManager || isDepartmentManager || isInternAssigner;
  const currentDepartmentId = user?.department_id ? String(user.department_id) : '';

  const [createForm, setCreateForm] = useState<CreateTaskPayload>({
    title: '',
    description: '',
    priority: 'Medium',
    deadline: '',
    assigned_to: currentUserId ? [currentUserId] : [],
  });
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

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
          if (!item.is_active || !hasSetupName(item)) {
            return false;
          }

          if (isGlobalManager) {
            return true;
          }

          if (isDepartmentManager || isInternAssigner) {
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
  }, [mounted, isAuthenticated, canAssign, isGlobalManager, isDepartmentManager, isInternAssigner, currentDepartmentId, currentUserId]);

  useEffect(() => {
    const fallbackId = users[0]?._id || users[0]?.user_id || currentUserId;
    setCreateForm((prev) => ({
      ...prev,
      assigned_to:
        canAssign
          ? (prev.assigned_to && prev.assigned_to.length > 0
            ? prev.assigned_to
            : (fallbackId ? [fallbackId] : []))
          : (currentUserId ? [currentUserId] : []),
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

  const filteredTasks = filter === 'All' ? tasks : tasks.filter((task) => task.status === filter);
  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / TASKS_PER_PAGE));
  const pagedTasks = filteredTasks.slice((currentPage - 1) * TASKS_PER_PAGE, currentPage * TASKS_PER_PAGE);
  const visiblePageNumbers = useMemo(() => {
    const windowSize = 5;
    if (totalPages <= windowSize) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const halfWindow = Math.floor(windowSize / 2);
    let start = Math.max(1, currentPage - halfWindow);
    let end = Math.min(totalPages, start + windowSize - 1);

    if (end - start + 1 < windowSize) {
      start = Math.max(1, end - windowSize + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [currentPage, totalPages]);
  const timelineTask = timelineModalTaskId
    ? tasks.find((task) => String(task.task_id) === timelineModalTaskId) || null
    : null;
  const workLinksTask = workLinksModalTaskId
    ? tasks.find((task) => String(task.task_id) === workLinksModalTaskId) || null
    : null;

  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  if (!mounted) return null;

  if (!isAuthenticated) {
    window.location.replace('/login');
    return null;
  }

  const validateCreateForm = () => {
    const errors: Record<string, string> = {};

    if (!createForm.title.trim()) {
      errors.title = 'Title is required.';
    }

    if (!scheduleDate) {
      errors.deadline_date = 'Schedule date is required.';
    }

    if (!scheduleTime) {
      errors.deadline_time = 'Schedule time is required.';
    }

    if (!createForm.assigned_to || createForm.assigned_to.length === 0) {
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
      const composedDeadline = new Date(`${scheduleDate}T${scheduleTime}`);
      if (Number.isNaN(composedDeadline.getTime())) {
        setCreateErrors((prev) => ({ ...prev, deadline_date: 'Invalid schedule date/time.' }));
        setIsSubmitting(false);
        return;
      }

      const payload: CreateTaskPayload = {
        ...createForm,
        title: createForm.title.trim(),
        description: createForm.description?.trim() || undefined,
        deadline: composedDeadline.toISOString(),
        assigned_to:
          createForm.assigned_to && createForm.assigned_to.length > 0
            ? createForm.assigned_to
            : (currentUserId ? [currentUserId] : []),
      };

      if (isInternAssigner && currentUserId && !(payload.assigned_to || []).includes(currentUserId)) {
        payload.assigned_to = [...(payload.assigned_to || []), currentUserId];
      }

      await taskService.createTask(payload);

      const updated = await taskService.getTasks();
      setTasks(updated);

      setCreateForm({
        title: '',
        description: '',
        priority: 'Medium',
        deadline: '',
        assigned_to: currentUserId ? [currentUserId] : [],
      });
      setScheduleDate('');
      setScheduleTime('');
      setCreateErrors({});
      setIsCreateModalOpen(false);
    } catch (error: any) {
      setServerError(error?.response?.data?.message || 'Failed to create task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTaskStatusActions = (task: Task): StatusActions => {
    const isManager = isGlobalManager || isDepartmentManager;
    const taskAssignees = task.assignees ?? [];
    const isOwnTask = String(task.created_by) === currentUserId || taskAssignees.includes(currentUserId);

    if (!isManager && !isOwnTask) {
      return { canEdit: false };
    }

    if (task.status === 'Completed') {
      return { canEdit: false };
    }

    if (isManager) {
      return {
        canEdit: true,
        advance: MANAGER_ADVANCE[task.status],
        revert: MANAGER_REVERT[task.status],
      };
    }

    return {
      canEdit: true,
      advance: INTERN_ADVANCE[task.status],
      revert: INTERN_REVERT[task.status],
    };
  };

  const canEditWorkLinks = (task: Task, statusActions: StatusActions) => {
    return statusActions.canEdit && task.status !== 'Under Review' && task.status !== 'Completed';
  };

  const loadTaskFeedback = async (taskId: string) => {
    setFeedbackLoadingTaskId(taskId);
    try {
      const feedback = await taskService.getTaskFeedback(taskId);
      setFeedbackByTaskId((prev) => ({ ...prev, [taskId]: feedback }));
    } catch (error: any) {
      setServerError(error?.response?.data?.message || 'Failed to load task feedback.');
    } finally {
      setFeedbackLoadingTaskId(null);
    }
  };

  const loadTaskWorkLinks = async (taskId: string) => {
    setWorkLinksLoadingTaskId(taskId);
    try {
      const links = await taskService.getTaskWorkLinks(taskId);
      setWorkLinksByTaskId((prev) => ({ ...prev, [taskId]: links }));
    } catch (error: any) {
      setServerError(error?.response?.data?.message || 'Failed to load task work links.');
    } finally {
      setWorkLinksLoadingTaskId(null);
    }
  };

  const openTaskWorkLinksModal = async (taskId: string) => {
    setWorkLinksModalTaskId(taskId);
    if (!workLinksByTaskId[taskId]) {
      await loadTaskWorkLinks(taskId);
    }
  };

  const openTaskTimelineModal = async (taskId: string) => {
    setTimelineModalTaskId(taskId);
    if (!historyByTaskId[taskId]) {
      await loadTaskStatusHistory(taskId);
    }
  };

  const handleAddTaskWorkLink = async (taskId: string) => {
    const draft = workLinkDraftByTaskId[taskId] || { url: '', label: '' };
    const url = draft.url.trim();
    const label = draft.label.trim();

    if (!url) {
      setServerError('Work link URL is required.');
      return;
    }

    setWorkLinksSubmittingTaskId(taskId);
    setServerError('');

    try {
      await taskService.addTaskWorkLink(taskId, {
        url,
        label: label || undefined,
      });

      const links = await taskService.getTaskWorkLinks(taskId);
      setWorkLinksByTaskId((prev) => ({ ...prev, [taskId]: links }));
      setWorkLinkDraftByTaskId((prev) => ({
        ...prev,
        [taskId]: { url: '', label: '' },
      }));
    } catch (error: any) {
      setServerError(error?.response?.data?.message || 'Failed to attach work link.');
    } finally {
      setWorkLinksSubmittingTaskId(null);
    }
  };

  const handleCopyWorkLink = async (workLinkId: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);

      setCopiedWorkLinkId(workLinkId);
      window.setTimeout(() => {
        setCopiedWorkLinkId((prev) => (prev === workLinkId ? null : prev));
      }, 1400);
    } catch {
      setServerError('Copy failed. Please copy the URL manually.');
    }
  };

  const requestDeleteTaskWorkLink = (taskId: string, link: TaskWorkLink) => {
    setPendingWorkLinkDeletion({
      taskId,
      workLinkId: link.work_link_id,
      label: link.label?.trim() || link.url,
    });
  };

  const confirmDeleteTaskWorkLink = async () => {
    if (!pendingWorkLinkDeletion) {
      return;
    }

    const { taskId, workLinkId } = pendingWorkLinkDeletion;
    setPendingWorkLinkDeletion(null);
    await handleDeleteTaskWorkLink(taskId, workLinkId);
  };

  const handleDeleteTaskWorkLink = async (taskId: string, workLinkId: string) => {
    setWorkLinksDeletingId(workLinkId);
    setServerError('');

    try {
      await taskService.deleteTaskWorkLink(taskId, workLinkId);

      setWorkLinksByTaskId((prev) => ({
        ...prev,
        [taskId]: (prev[taskId] || []).filter((item) => item.work_link_id !== workLinkId),
      }));

      if (copiedWorkLinkId === workLinkId) {
        setCopiedWorkLinkId(null);
      }
    } catch (error: any) {
      setServerError(error?.response?.data?.message || 'Failed to remove task work link.');
    } finally {
      setWorkLinksDeletingId(null);
    }
  };

  const toggleTaskFeedback = async (taskId: string) => {
    const isOpen = !!feedbackOpenByTaskId[taskId];
    const nextOpen = !isOpen;

    setFeedbackOpenByTaskId((prev) => ({
      ...prev,
      [taskId]: nextOpen,
    }));

    if (nextOpen && !feedbackByTaskId[taskId]) {
      await loadTaskFeedback(taskId);
    }
  };

  const handleAddTaskFeedback = async (taskId: string) => {
    const comments = (feedbackDraftByTaskId[taskId] || '').trim();
    if (comments.length < 3) {
      setServerError('Feedback must be at least 3 characters.');
      return;
    }

    setFeedbackSubmittingTaskId(taskId);
    setServerError('');

    try {
      await taskService.addTaskFeedback(taskId, { comments });
      const updatedFeedback = await taskService.getTaskFeedback(taskId);

      setFeedbackByTaskId((prev) => ({ ...prev, [taskId]: updatedFeedback }));
      setFeedbackDraftByTaskId((prev) => ({ ...prev, [taskId]: '' }));
      setFeedbackOpenByTaskId((prev) => ({ ...prev, [taskId]: true }));
    } catch (error: any) {
      setServerError(error?.response?.data?.message || 'Failed to submit task feedback.');
    } finally {
      setFeedbackSubmittingTaskId(null);
    }
  };

  const loadTaskStatusHistory = async (taskId: string) => {
    setHistoryLoadingTaskId(taskId);
    try {
      const history = await taskService.getTaskStatusHistory(taskId);
      setHistoryByTaskId((prev) => ({ ...prev, [taskId]: history }));
    } catch (error: any) {
      setServerError(error?.response?.data?.message || 'Failed to load task status history.');
    } finally {
      setHistoryLoadingTaskId(null);
    }
  };

  const handleAssignUsersToTask = async (taskId: string) => {
    const selectedAssignees = assignDraftByTaskId[taskId] || [];
    if (selectedAssignees.length === 0) {
      setServerError('Select at least one assignee to add.');
      return;
    }

    setAssignSubmittingTaskId(taskId);
    setServerError('');

    try {
      const payload = [...selectedAssignees];
      if (isInternAssigner && currentUserId && !payload.includes(currentUserId)) {
        payload.push(currentUserId);
      }

      await taskService.assignTask(taskId, payload);
      const updated = await taskService.getTasks();
      setTasks(updated);
      setAssignDraftByTaskId((prev) => ({ ...prev, [taskId]: [] }));
    } catch (error: any) {
      setServerError(error?.response?.data?.message || 'Failed to assign users to task.');
    } finally {
      setAssignSubmittingTaskId(null);
    }
  };

  const handleUpdateTaskStatus = async (task: Task, nextStatus: TaskStatus) => {
    const taskId = String(task.task_id);
    if (nextStatus === task.status) {
      return;
    }

    setStatusUpdatingTaskId(taskId);
    setServerError('');

    try {
      await taskService.updateTaskStatus(taskId, {
        status: nextStatus,
      });

      const updated = await taskService.getTasks();
      setTasks(updated);

      if (timelineModalTaskId === taskId) {
        await loadTaskStatusHistory(taskId);
      }
    } catch (error: any) {
      setServerError(error?.response?.data?.message || 'Failed to update task status.');
    } finally {
      setStatusUpdatingTaskId(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Tasks</h1>
          <p className="mt-1 text-sm text-slate-500">
            {isGlobalManager
              ? 'Create and assign tasks across all departments.'
              : 'Create and assign tasks for your current department.'}
          </p>
        </div>
        <Button variant="primary" size="md" onClick={() => setIsCreateModalOpen(true)}>
          + New Task
        </Button>
      </div>

      {serverError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ALL_STATUSES.map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`rounded-xl border p-3 text-left transition-colors ${
              filter === status ? 'border-blue-300 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white/80 hover:bg-white'
            }`}
          >
            <p className="text-lg font-semibold text-slate-900">{statusCounts[status]}</p>
            <p className="mt-0.5 text-xs text-slate-500">{status}</p>
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(['All', ...ALL_STATUSES] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === status ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100'
            }`}
          >
            {status} {status !== 'All' && `(${statusCounts[status]})`}
          </button>
        ))}
      </div>

      <div className="bg-transparent p-0 shadow-none">
        {isLoading ? (
          <p className="text-center text-gray-400 py-8 text-sm">Loading tasks...</p>
        ) : filteredTasks.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">No tasks in this category</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {pagedTasks.map((task) => {
              const statusActions = getTaskStatusActions(task);
              const taskId = String(task.task_id);
              const selectedAssignees = assignDraftByTaskId[taskId] || [];
              const feedbackItems = feedbackByTaskId[taskId] || [];
              const assigneeDisplayNames = (task.assignees || []).map((assigneeId) => {
                const found = users.find((item) => getUserId(item) === assigneeId);
                return found ? getUserDisplay(found) : 'Team member';
              });

              return (
                <TaskCard
                  key={task.task_id}
                  task={task}
                  statusActions={statusActions}
                  statusUpdating={statusUpdatingTaskId === taskId}
                  historyLoading={historyLoadingTaskId === taskId}
                  workLinksLoading={workLinksLoadingTaskId === taskId}
                  workLinksCount={(workLinksByTaskId[taskId] || []).length}
                  assigneeDisplayNames={assigneeDisplayNames}
                  onOpenHistory={() => void openTaskTimelineModal(taskId)}
                  onAdvance={(nextStatus) => void handleUpdateTaskStatus(task, nextStatus)}
                  onRevert={(previousStatus) => void handleUpdateTaskStatus(task, previousStatus)}
                  onOpenLinks={() => void openTaskWorkLinksModal(taskId)}
                  canAssign={canAssign && users.length > 0}
                  availableUsers={users
                    .map((item) => {
                      const itemId = getUserId(item);
                      return itemId ? { id: itemId, display: getUserDisplay(item) } : null;
                    })
                    .filter((item): item is { id: string; display: string } => !!item)}
                  selectedAssignees={selectedAssignees}
                  onToggleAssignee={(userId) => {
                    setAssignDraftByTaskId((prev) => ({
                      ...prev,
                      [taskId]: toggleSelection(prev[taskId] || [], userId),
                    }));
                  }}
                  onAssignUsers={() => void handleAssignUsersToTask(taskId)}
                  assignSubmitting={assignSubmittingTaskId === taskId}
                  isInternAssigner={isInternAssigner}
                  currentUserId={currentUserId}
                  feedbackOpen={!!feedbackOpenByTaskId[taskId]}
                  feedbackLoading={feedbackLoadingTaskId === taskId}
                  feedbackSubmitting={feedbackSubmittingTaskId === taskId}
                  feedbackItems={feedbackItems}
                  feedbackDraft={feedbackDraftByTaskId[taskId] || ''}
                  canSubmitFeedback={isGlobalManager || isDepartmentManager}
                  onToggleFeedback={() => void toggleTaskFeedback(taskId)}
                  onFeedbackDraftChange={(value) => {
                    setFeedbackDraftByTaskId((prev) => ({ ...prev, [taskId]: value }));
                  }}
                  onSubmitFeedback={() => void handleAddTaskFeedback(taskId)}
                />
              );
            })}
          </div>
        )}

        {!isLoading && filteredTasks.length > TASKS_PER_PAGE && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3">
            <p className="text-xs text-gray-500">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                title="First page"
              >
                First
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Back
              </Button>
              {visiblePageNumbers.map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setCurrentPage(pageNumber)}
                  className={`min-w-8 rounded-md border px-2 py-1 text-xs font-medium transition-colors ${
                    currentPage === pageNumber
                      ? 'border-blue-500 bg-blue-600 text-white'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {pageNumber}
                </button>
              ))}
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                title="Last page"
              >
                Last
              </Button>
            </div>
          </div>
        )}
      </div>

      <WorkLinksModal
        open={!!workLinksModalTaskId}
        task={workLinksTask}
        links={workLinksModalTaskId ? (workLinksByTaskId[workLinksModalTaskId] || []) : []}
        loading={!!workLinksModalTaskId && workLinksLoadingTaskId === workLinksModalTaskId}
        canEdit={!!workLinksTask && canEditWorkLinks(workLinksTask, getTaskStatusActions(workLinksTask))}
        draft={workLinksTask ? (workLinkDraftByTaskId[String(workLinksTask.task_id)] || { url: '', label: '' }) : { url: '', label: '' }}
        submitting={!!workLinksTask && workLinksSubmittingTaskId === String(workLinksTask.task_id)}
        deletingId={workLinksDeletingId}
        copiedId={copiedWorkLinkId}
        onClose={() => setWorkLinksModalTaskId(null)}
        onCopy={(workLinkId, url) => void handleCopyWorkLink(workLinkId, url)}
        onRequestDelete={requestDeleteTaskWorkLink}
        onDraftChange={(draft) => {
          if (!workLinksTask) return;
          setWorkLinkDraftByTaskId((prev) => ({
            ...prev,
            [String(workLinksTask.task_id)]: draft,
          }));
        }}
        onSubmitLink={(taskId) => void handleAddTaskWorkLink(taskId)}
      />

      <Modal
        open={!!pendingWorkLinkDeletion}
        onClose={() => setPendingWorkLinkDeletion(null)}
        title="Confirm Link Removal"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Remove this work link from the task?
          </p>
          <p className="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700 break-all">
            {pendingWorkLinkDeletion?.label}
          </p>
          <p className="text-xs text-gray-500">
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setPendingWorkLinkDeletion(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={!!pendingWorkLinkDeletion && workLinksDeletingId === pendingWorkLinkDeletion.workLinkId}
              onClick={() => void confirmDeleteTaskWorkLink()}
            >
              Remove Link
            </Button>
          </div>
        </div>
      </Modal>

      <TimelineModal
        open={!!timelineModalTaskId}
        task={timelineTask}
        history={timelineModalTaskId ? (historyByTaskId[timelineModalTaskId] || []) : []}
        loading={!!timelineModalTaskId && historyLoadingTaskId === timelineModalTaskId}
        onClose={() => setTimelineModalTaskId(null)}
      />

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

          <div className="grid grid-cols-3 gap-3">
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
              label="Schedule Date"
              type="date"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              error={createErrors.deadline_date}
            />

            <Input
              label="Schedule Time"
              type="time"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
              error={createErrors.deadline_time}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700" htmlFor="assignee">Assignee</label>
            {canAssign ? (
              <div className={`rounded-md border px-3 py-2 ${createErrors.assigned_to ? 'border-red-400' : 'border-gray-300'}`}>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {users.map((item) => {
                    const itemId = getUserId(item);
                    if (!itemId) return null;

                    const selfLocked = isInternAssigner && itemId === currentUserId;
                    const checked = selfLocked || (createForm.assigned_to || []).includes(itemId);
                    return (
                      <label key={itemId} className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={selfLocked}
                          onChange={() => {
                            if (selfLocked) return;
                            setCreateForm((prev) => ({
                              ...prev,
                              assigned_to: toggleSelection(prev.assigned_to || [], itemId),
                            }));
                          }}
                        />
                        <span>{getUserDisplay(item)}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ) : (
              <Input label="Assigned to" value={getUserDisplay(user as RawUser)} disabled />
            )}
            {createErrors.assigned_to && <p className="text-xs text-red-600">{createErrors.assigned_to}</p>}
            {canAssign && <p className="text-[11px] text-gray-500">Choose one or more people.</p>}
            {isInternAssigner && <p className="text-[11px] text-blue-600">Intern assignments always include you.</p>}
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
