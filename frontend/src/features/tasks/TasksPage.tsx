import { useCallback, useEffect, useMemo, useState } from 'react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { taskService } from '../../services/taskService';
import { userService } from '../../services/userService';
import { useAuthStore } from '../../store/authStore';
import type {
  CreateTaskPayload,
  PaginatedTaskListResponse,
  TaskComment,
  TaskDetail,
  TaskFeedback,
  TaskPriority,
  TaskStatus,
  TaskWorkLink,
} from '../../types/task';
import type { User } from '../../types/user';
import TaskFilters from './components/TaskFilters';
import TaskModal from './components/TaskModal';
import TaskPagination from './components/TaskPagination';
import TaskTable from './components/TaskTable';
import { useTaskSocket } from './hooks/useTaskSocket';

type CreatedDateFilter = 'all' | 'today' | '7d' | '30d';
type SortBy = 'created_desc' | 'created_asc' | 'priority_desc' | 'priority_asc' | 'deadline_asc' | 'deadline_desc' | 'title_asc';

const DEFAULT_LIST: PaginatedTaskListResponse = {
  items: [],
  total: 0,
  page: 1,
  limit: 10,
  total_pages: 1,
};

const getUserIdentifier = (user: User): string => String(user.user_id || (user as any)._id || '').trim();

const getTodayInputDate = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function TasksPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const currentUser = useAuthStore((state) => state.user);
  const currentUserId = useAuthStore((state) => state.user?.user_id || '');
  const resolvedCurrentUserId = currentUserId || String((currentUser as any)?._id || '');

  const [mounted, setMounted] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'All'>('All');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'All'>('All');
  const [createdDateFilter, setCreatedDateFilter] = useState<CreatedDateFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('created_desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [taskList, setTaskList] = useState<PaginatedTaskListResponse>(DEFAULT_LIST);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [createError, setCreateError] = useState('');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [noDueDateTime, setNoDueDateTime] = useState(false);
  const [createForm, setCreateForm] = useState<{
    title: string;
    description: string;
    priority: TaskPriority;
    dueDate: string;
    dueTime: string;
  }>({
    title: '',
    description: '',
    priority: 'Medium',
    dueDate: '',
    dueTime: '',
  });

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskDetail, setTaskDetail] = useState<TaskDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [statusUpdating, setStatusUpdating] = useState(false);
  const [commentDraft, setCommentDraft] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [feedbackDraft, setFeedbackDraft] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [taskFeedbacks, setTaskFeedbacks] = useState<TaskFeedback[]>([]);

  const [linkDraft, setLinkDraft] = useState({ url: '', label: '' });
  const [linkSubmitting, setLinkSubmitting] = useState(false);
  const [linkDeletingId, setLinkDeletingId] = useState<string | null>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [modalToasts, setModalToasts] = useState<Array<{ id: string; message: string; exiting: boolean }>>([]);

  const pushModalToast = useCallback((message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setModalToasts((prev) => [...prev, { id, message, exiting: false }]);

    window.setTimeout(() => {
      setModalToasts((prev) => prev.map((item) => (item.id === id ? { ...item, exiting: true } : item)));
    }, 1800);

    window.setTimeout(() => {
      setModalToasts((prev) => prev.filter((item) => item.id !== id));
    }, 2100);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isSuperadmin = currentUser?.global_role === 'Superadmin';
  const isAdmin = currentUser?.global_role === 'Admin';
  const isStandardUser = currentUser?.global_role === 'Standard_User';
  const currentDepartmentRole = currentUser?.departments?.[0]?.department_role;
  const isHeadOrSupervisor = currentDepartmentRole === 'Head' || currentDepartmentRole === 'Supervisor';
  const isIntern = currentDepartmentRole === 'Intern';
  const canSubmitFeedback = isSuperadmin || isAdmin || isHeadOrSupervisor;
  const isSelfOnlyAssignee = isStandardUser;

  const assignableUsers = useMemo(() => {
    if (!currentUser) {
      return [] as User[];
    }

    const activeUsers = allUsers.filter((user) => user.is_active);
    let scopedUsers: User[];

    if (isSelfOnlyAssignee) {
      scopedUsers = activeUsers.filter((user) => getUserIdentifier(user) === resolvedCurrentUserId);
    } else if (isSuperadmin || isAdmin) {
      scopedUsers = activeUsers;
    } else if (isHeadOrSupervisor || isIntern) {
      const departmentId = currentUser.departments?.[0]?.department_id;
      scopedUsers = activeUsers.filter(
        (user) =>
          typeof departmentId !== 'undefined' &&
          departmentId !== null &&
          (user.departments ?? []).some((department) => String(department.department_id) === String(departmentId))
      );
    } else {
      scopedUsers = activeUsers.filter((user) => getUserIdentifier(user) === currentUserId);
    }

    if (!scopedUsers.some((user) => getUserIdentifier(user) === resolvedCurrentUserId) && resolvedCurrentUserId) {
      scopedUsers = [...scopedUsers, currentUser];
    }

    const seen = new Set<string>();
    const uniqueUsers = scopedUsers.filter((user) => {
      const id = getUserIdentifier(user) || user.email;
      if (!id || seen.has(id)) {
        return false;
      }
      seen.add(id);
      return true;
    });

    return [...uniqueUsers].sort((a, b) => {
      const aName = `${a.first_name} ${a.last_name}`.trim() || a.email;
      const bName = `${b.first_name} ${b.last_name}`.trim() || b.email;
      return aName.localeCompare(bName);
    });
  }, [allUsers, currentUser, isAdmin, isHeadOrSupervisor, isIntern, isSelfOnlyAssignee, isSuperadmin, resolvedCurrentUserId]);

  const assignmentHint = isSelfOnlyAssignee
    ? 'Automatically assigned to your account.'
    : isSuperadmin || isAdmin
    ? 'You can assign any active user.'
    : isHeadOrSupervisor
      ? 'You can assign users in your department.'
      : isIntern
        ? 'You can assign users in your department and your account will always be included.'
        : 'You can only assign tasks to your own account.';

  const orderedTasks = useMemo(() => {
    const unfinished = taskList.items.filter((task) => task.status !== 'Completed');
    const completed = taskList.items.filter((task) => task.status === 'Completed');
    return [...unfinished, ...completed];
  }, [taskList.items]);

  const loadTasks = useCallback(async (options?: { refresh?: boolean }) => {
    if (!options?.refresh) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    setServerError('');

    try {
      const payload = await taskService.getTaskList({
        page,
        limit,
        search: search.trim() || undefined,
        status: statusFilter === 'All' ? undefined : statusFilter,
        priority: priorityFilter === 'All' ? undefined : priorityFilter,
        created_date: createdDateFilter,
        sort_by: sortBy,
      });

      setTaskList(payload);
      if (payload.page !== page) {
        setPage(payload.page);
      }
    } catch (error: any) {
      setServerError(error?.response?.data?.message || 'Failed to load tasks.');
      setTaskList(DEFAULT_LIST);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [createdDateFilter, limit, page, priorityFilter, search, sortBy, statusFilter]);

  const loadTaskDetail = useCallback(async (taskId: string) => {
    setDetailLoading(true);
    setServerError('');

    try {
      const [detail, feedbackItems] = await Promise.all([
        taskService.getTaskDetail(taskId),
        taskService.getTaskFeedback(taskId),
      ]);
      setTaskDetail(detail);
      setTaskFeedbacks(feedbackItems);
    } catch (error: any) {
      setServerError(error?.response?.data?.message || 'Failed to load task details.');
      setTaskDetail(null);
      setTaskFeedbacks([]);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!mounted || !isAuthenticated) {
      return;
    }

    void loadTasks();
  }, [isAuthenticated, loadTasks, mounted]);

  useEffect(() => {
    if (!mounted || !isAuthenticated) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const taskId = params.get('taskId');
    if (taskId && taskId.trim().length > 0) {
      setSelectedTaskId(taskId.trim());
    }
  }, [isAuthenticated, mounted]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, priorityFilter, createdDateFilter, sortBy, limit]);

  useEffect(() => {
    if (!selectedTaskId) {
      setTaskDetail(null);
      setTaskFeedbacks([]);
      return;
    }

    void loadTaskDetail(selectedTaskId);
  }, [loadTaskDetail, selectedTaskId]);

  useEffect(() => {
    if (!isCreateModalOpen || !isAuthenticated) {
      return;
    }

    setUsersLoading(true);
    void userService
      .getAllUsers()
      .then((users) => setAllUsers(users))
      .catch(() => setCreateError('Failed to load assignable users.'))
      .finally(() => setUsersLoading(false));
  }, [isAuthenticated, isCreateModalOpen]);

  useEffect(() => {
    if (!isCreateModalOpen || !resolvedCurrentUserId) {
      return;
    }

    if (isSelfOnlyAssignee) {
      setAssigneeIds([resolvedCurrentUserId]);
      return;
    }

    setAssigneeIds((prev) => {
      if (prev.length > 0) {
        return prev;
      }

      return [resolvedCurrentUserId];
    });
  }, [isCreateModalOpen, isSelfOnlyAssignee, resolvedCurrentUserId]);

  useEffect(() => {
    setAssigneeIds((prev) => {
      const scoped = prev.filter((id) => assignableUsers.some((user) => getUserIdentifier(user) === id));

      const canSelectSelf = !!resolvedCurrentUserId && assignableUsers.some((user) => getUserIdentifier(user) === resolvedCurrentUserId);
      if (scoped.length === 0 && canSelectSelf) {
        return [resolvedCurrentUserId];
      }

      if (isIntern && resolvedCurrentUserId && !scoped.includes(resolvedCurrentUserId)) {
        return [...scoped, resolvedCurrentUserId];
      }

      return scoped;
    });
  }, [assignableUsers, isIntern, resolvedCurrentUserId]);

  const handleSocketComment = useCallback((payload: any) => {
    const taskId = payload?.task_id;
    const comment = payload?.comment as TaskComment | undefined;

    if (!taskId || !comment || String(taskId) !== selectedTaskId) {
      return;
    }

    setTaskDetail((prev) => {
      if (!prev) {
        return prev;
      }

      if (prev.comments.some((item) => item.comment_id === comment.comment_id)) {
        return prev;
      }

      return {
        ...prev,
        comments: [...prev.comments, comment],
      };
    });

    pushModalToast('New comment received');
  }, [pushModalToast, selectedTaskId]);

  const handleSocketStatus = useCallback((payload: any) => {
    const taskId = payload?.task_id;
    const nextTask = payload?.task;
    const history = payload?.history;

    if (!taskId || String(taskId) !== selectedTaskId || !nextTask || !history) {
      return;
    }

    setTaskDetail((prev) => {
      if (!prev) {
        return prev;
      }

      return {
        ...prev,
        status: nextTask.status,
        history: [history, ...prev.history],
      };
    });

    pushModalToast(`Status updated to ${nextTask.status}`);

    void loadTasks({ refresh: true });
  }, [loadTasks, pushModalToast, selectedTaskId]);

  useTaskSocket({
    taskId: selectedTaskId,
    onCommentCreated: handleSocketComment,
    onStatusUpdated: handleSocketStatus,
  });

  if (!mounted) {
    return null;
  }

  if (!isAuthenticated) {
    window.location.replace('/login');
    return null;
  }

  const canAddLinks = !!taskDetail?.link_permissions.can_add_links;
  const canDeleteAnyLink = !!taskDetail?.link_permissions.can_delete_any_link;
  const canDeleteOwnLink = !!taskDetail?.link_permissions.can_delete_own_links;

  const handleUpdateStatus = async (nextStatus: TaskStatus) => {
    if (!taskDetail) {
      return;
    }

    setStatusUpdating(true);
    setServerError('');

    try {
      const response = await taskService.updateTaskStatus(String(taskDetail.task_id), {
        status: nextStatus,
      });

      setTaskDetail((prev) => {
        if (!prev) {
          return prev;
        }

        return {
          ...prev,
          status: response.task.status,
          history: [response.history, ...prev.history],
        };
      });

      await loadTasks({ refresh: true });
    } catch (error: any) {
      setServerError(error?.response?.data?.message || 'Failed to update task status.');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleAddComment = async () => {
    if (!taskDetail) {
      return;
    }

    const message = commentDraft.trim();
    if (!message) {
      setServerError('Comment message is required.');
      return;
    }

    setCommentSubmitting(true);
    setServerError('');

    try {
      const created = await taskService.addTaskComment(String(taskDetail.task_id), { message });
      setCommentDraft('');
      pushModalToast('Comment posted');

      setTaskDetail((prev) => {
        if (!prev) {
          return prev;
        }

        if (prev.comments.some((item) => item.comment_id === created.comment_id)) {
          return prev;
        }

        return {
          ...prev,
          comments: [...prev.comments, created],
        };
      });
    } catch (error: any) {
      setServerError(error?.response?.data?.message || 'Failed to add comment.');
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleAddFeedback = async () => {
    if (!taskDetail) {
      return;
    }

    if (!canSubmitFeedback) {
      setServerError('You do not have permission to submit feedback.');
      return;
    }

    const comments = feedbackDraft.trim();
    if (!comments) {
      setServerError('Feedback message is required.');
      return;
    }

    setFeedbackSubmitting(true);
    setServerError('');

    try {
      const created = await taskService.addTaskFeedback(String(taskDetail.task_id), { comments });
      setFeedbackDraft('');
      pushModalToast('Feedback submitted');
      setTaskFeedbacks((prev) => [created, ...prev]);
    } catch (error: any) {
      setServerError(error?.response?.data?.message || 'Failed to submit feedback.');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const handleAddLink = async () => {
    if (!taskDetail) {
      return;
    }

    const url = linkDraft.url.trim();
    if (!url) {
      setServerError('Link URL is required.');
      return;
    }

    if (!canAddLinks) {
      setServerError('You do not have permission to add links on this task.');
      return;
    }

    setLinkSubmitting(true);
    setServerError('');

    try {
      await taskService.addTaskWorkLink(String(taskDetail.task_id), {
        url,
        label: linkDraft.label.trim() || undefined,
      });

      const links = await taskService.getTaskWorkLinks(String(taskDetail.task_id));
      setTaskDetail((prev) => {
        if (!prev) {
          return prev;
        }

        return {
          ...prev,
          links,
          links_count: links.length,
        };
      });

      setLinkDraft({ url: '', label: '' });
      pushModalToast('Work link added');
      await loadTasks({ refresh: true });
    } catch (error: any) {
      setServerError(error?.response?.data?.message || 'Failed to add link.');
    } finally {
      setLinkSubmitting(false);
    }
  };

  const handleDeleteLink = async (workLinkId: string) => {
    if (!taskDetail) {
      return;
    }

    const link = taskDetail.links.find((item) => item.work_link_id === workLinkId);
    if (!link) {
      return;
    }

    const canDelete = canDeleteAnyLink || (canDeleteOwnLink && link.submitted_by === currentUserId);
    if (!canDelete) {
      setServerError('You do not have permission to delete this link.');
      return;
    }

    setLinkDeletingId(workLinkId);
    setServerError('');

    try {
      await taskService.deleteTaskWorkLink(String(taskDetail.task_id), workLinkId);
      const links = await taskService.getTaskWorkLinks(String(taskDetail.task_id));

      setTaskDetail((prev) => {
        if (!prev) {
          return prev;
        }

        return {
          ...prev,
          links,
          links_count: links.length,
        };
      });

      pushModalToast('Work link deleted');
      await loadTasks({ refresh: true });
    } catch (error: any) {
      setServerError(error?.response?.data?.message || 'Failed to delete link.');
    } finally {
      setLinkDeletingId(null);
    }
  };

  const handleCopyLink = async (workLinkId: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLinkId(workLinkId);
      pushModalToast('Link copied');
      window.setTimeout(() => {
        setCopiedLinkId((prev) => (prev === workLinkId ? null : prev));
      }, 1200);
    } catch {
      setServerError('Copy failed.');
    }
  };

  const handleCreateTask = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreateError('');

    if (!createForm.title.trim()) {
      setCreateError('Task title is required.');
      return;
    }

    let deadlineIso: string | undefined;
    if (!noDueDateTime) {
      if (!createForm.dueDate || !createForm.dueTime) {
        setCreateError('Set both due date and due time, or check No due date and time.');
        return;
      }

      const todayDate = getTodayInputDate();
      if (createForm.dueDate < todayDate) {
        setCreateError('Deadline cannot be in the past.');
        return;
      }

      const deadline = new Date(`${createForm.dueDate}T${createForm.dueTime}`);
      if (Number.isNaN(deadline.getTime())) {
        setCreateError('Invalid deadline value.');
        return;
      }

      deadlineIso = deadline.toISOString();
    }

    const selectedAssignees = [...new Set(assigneeIds)];
    if (isSelfOnlyAssignee && resolvedCurrentUserId) {
      selectedAssignees.length = 0;
      selectedAssignees.push(resolvedCurrentUserId);
    }

    if (isIntern && resolvedCurrentUserId && !selectedAssignees.includes(resolvedCurrentUserId)) {
      selectedAssignees.push(resolvedCurrentUserId);
    }

    if (!selectedAssignees.length) {
      setCreateError('Please select at least one assignee.');
      return;
    }

    setIsCreatingTask(true);

    try {
      const payload: CreateTaskPayload = {
        title: createForm.title.trim(),
        description: createForm.description.trim() || undefined,
        priority: createForm.priority,
        deadline: deadlineIso,
        assigned_to: selectedAssignees,
      };

      await taskService.createTask(payload);

      setCreateForm({
        title: '',
        description: '',
        priority: 'Medium',
        dueDate: '',
        dueTime: '',
      });
      setNoDueDateTime(false);
      setAssigneeIds(resolvedCurrentUserId ? [resolvedCurrentUserId] : []);
      setIsCreateModalOpen(false);
      pushModalToast('Task created');
      await loadTasks({ refresh: true });
    } catch (error: any) {
      setCreateError(error?.response?.data?.message || 'Failed to create task.');
    } finally {
      setIsCreatingTask(false);
    }
  };

  const modalComments = taskDetail?.comments || [];
  const modalLinks: TaskWorkLink[] = taskDetail?.links || [];
  const totalPages = Math.max(1, taskList.total_pages || 1);

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Tasks</h1>
          <p className="mt-1 text-sm text-slate-500">Create and view all your tasks in one place. Select a task for a detailed view.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            loading={isRefreshing}
            onClick={() => void loadTasks({ refresh: true })}
            aria-label="Refresh tasks"
            title="Refresh tasks"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 11a8 8 0 0 0-13.66-5.66M4 5v5h5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 13a8 8 0 0 0 13.66 5.66M20 19v-5h-5" />
            </svg>
          </Button>
          <Button type="button" size="sm" onClick={() => setIsCreateModalOpen(true)}>
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
            </svg>
            Add Task
          </Button>
        </div>
      </div>

      {serverError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{serverError}</div>
      ) : null}

      <TaskFilters
        search={search}
        status={statusFilter}
        priority={priorityFilter}
        createdDate={createdDateFilter}
        sortBy={sortBy}
        limit={limit}
        onSearchChange={setSearch}
        onStatusChange={setStatusFilter}
        onPriorityChange={setPriorityFilter}
        onCreatedDateChange={setCreatedDateFilter}
        onSortByChange={setSortBy}
        onLimitChange={setLimit}
      />

      <TaskTable tasks={orderedTasks} isLoading={isLoading} onRowClick={setSelectedTaskId} />

      <TaskPagination
        page={page}
        totalPages={totalPages}
        total={taskList.total}
        limit={limit}
        onPageChange={setPage}
      />

      <TaskModal
        open={!!selectedTaskId}
        task={taskDetail}
        isLoading={detailLoading}
        statusUpdating={statusUpdating}
        commentsSubmitting={commentSubmitting}
        feedbackSubmitting={feedbackSubmitting}
        linksSubmitting={linkSubmitting}
        linkDeletingId={linkDeletingId}
        copiedLinkId={copiedLinkId}
        commentDraft={commentDraft}
        feedbackDraft={feedbackDraft}
        linkDraft={linkDraft}
        onClose={() => {
          setSelectedTaskId(null);
          const url = new URL(window.location.href);
          if (url.searchParams.has('taskId')) {
            url.searchParams.delete('taskId');
            window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
          }
          setCommentDraft('');
          setFeedbackDraft('');
          setLinkDraft({ url: '', label: '' });
          setModalToasts([]);
        }}
        onCommentDraftChange={setCommentDraft}
        onFeedbackDraftChange={setFeedbackDraft}
        onLinkDraftChange={setLinkDraft}
        onUpdateStatus={(nextStatus) => void handleUpdateStatus(nextStatus)}
        onAddComment={() => void handleAddComment()}
        onAddFeedback={() => void handleAddFeedback()}
        onAddLink={() => void handleAddLink()}
        onDeleteLink={(workLinkId) => void handleDeleteLink(workLinkId)}
        onCopyLink={(workLinkId, url) => void handleCopyLink(workLinkId, url)}
        comments={modalComments}
        feedbackItems={taskFeedbacks}
        links={modalLinks}
        currentUserId={currentUserId}
        canSubmitFeedback={canSubmitFeedback}
        canAddLinks={canAddLinks}
        canDeleteAnyLink={canDeleteAnyLink}
        canDeleteOwnLink={canDeleteOwnLink}
      />

      <Modal open={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create Task" className="max-w-xl">
        <form className="space-y-3" onSubmit={handleCreateTask}>
          <Input
            label="Title"
            value={createForm.title}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="Enter task title"
          />

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-700">Description</span>
            <textarea
              rows={3}
              value={createForm.description}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, description: event.target.value }))}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
              placeholder="Optional details"
            />
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-slate-700">Priority</span>
              <select
                className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
                value={createForm.priority}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, priority: event.target.value as TaskPriority }))}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </label>

            <Input
              label="Due Date"
              type="date"
              value={createForm.dueDate}
              min={getTodayInputDate()}
              disabled={noDueDateTime}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, dueDate: event.target.value }))}
            />

            <Input
              label="Due Time"
              type="time"
              value={createForm.dueTime}
              disabled={noDueDateTime}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, dueTime: event.target.value }))}
            />
          </div>

          <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={noDueDateTime}
              onChange={(event) => {
                const checked = event.target.checked;
                setNoDueDateTime(checked);
                setCreateError('');
                if (checked) {
                  setCreateForm((prev) => ({ ...prev, dueDate: '', dueTime: '' }));
                }
              }}
            />
            <span>No deadline?</span>
          </label>

          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-700">Assign To</p>
            <p className="text-xs text-slate-500">{assignmentHint}</p>

            <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-slate-200 p-2">
              {usersLoading ? (
                <p className="text-xs text-slate-500">Loading users...</p>
              ) : isSelfOnlyAssignee ? (
                <div className="rounded bg-slate-50 px-2 py-2 text-sm text-slate-700">
                  {currentUser ? `${currentUser.first_name} ${currentUser.last_name}`.trim() || currentUser.email : 'Your account'}
                </div>
              ) : assignableUsers.length ? (
                assignableUsers.map((user) => {
                  const userIdentifier = getUserIdentifier(user);
                  const userName = `${user.first_name} ${user.last_name}`.trim() || user.email;
                  const checked = assigneeIds.includes(userIdentifier);
                  const lockToSelf = isSelfOnlyAssignee && userIdentifier !== currentUserId;
                  const lockInternSelf = isIntern && userIdentifier === currentUserId;

                  return (
                    <label key={userIdentifier || user.email} className="flex items-center justify-between gap-2 rounded px-2 py-1 text-sm text-slate-700 hover:bg-slate-50">
                      <span className="min-w-0 truncate">{userName}</span>
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={checked}
                        disabled={lockToSelf || lockInternSelf}
                        onChange={(event) => {
                          const nextChecked = event.target.checked;
                          setAssigneeIds((prev) => {
                            if (nextChecked) {
                              return [...new Set([...prev, userIdentifier])];
                            }

                            return prev.filter((id) => id !== userIdentifier);
                          });
                        }}
                      />
                    </label>
                  );
                })
              ) : (
                <p className="text-xs text-slate-500">No users available for your role scope.</p>
              )}
            </div>
          </div>

          {createError ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{createError}</div>
          ) : null}

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={isCreatingTask}>
              Create
            </Button>
          </div>
        </form>
      </Modal>

      {modalToasts.length > 0 ? (
        <div className="pointer-events-none fixed bottom-4 right-4 z-[70] space-y-2">
          {modalToasts.map((toast) => (
            <div
              key={toast.id}
              className={`${toast.exiting ? 'task-toast-out' : 'task-toast'} w-[min(22rem,calc(100vw-2rem))] rounded-lg border border-sky-200 bg-white/95 px-3.5 py-2.5 text-sm text-slate-800 shadow-lg backdrop-blur`}
            >
              {toast.message}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
