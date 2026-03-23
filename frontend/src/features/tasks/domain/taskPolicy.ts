import type { Task, TaskStatus } from '../../../types/task';

export type StatusActions = { canEdit: boolean; advance?: TaskStatus; revert?: TaskStatus };

type TaskPolicyContext = {
  currentUserId: string;
  isGlobalManager: boolean;
  isDepartmentManager: boolean;
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

const STANDARD_ADVANCE: Partial<Record<TaskStatus, TaskStatus>> = {
  'Not Started': 'In Progress',
  'In Progress': 'Under Review',
};

const STANDARD_REVERT: Partial<Record<TaskStatus, TaskStatus>> = {
  'In Progress': 'Not Started',
};

export const getTaskStatusActions = (task: Task, context: TaskPolicyContext): StatusActions => {
  const { currentUserId, isGlobalManager, isDepartmentManager } = context;
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
    advance: STANDARD_ADVANCE[task.status],
    revert: STANDARD_REVERT[task.status],
  };
};

export const canEditWorkLinks = (task: Task, statusActions: StatusActions): boolean => {
  return statusActions.canEdit && task.status !== 'Under Review' && task.status !== 'Completed';
};
