import { useCallback, useEffect, useState } from 'react';

import { taskService } from '../../../services/taskService';
import { userService } from '../../../services/userService';
import type { Task } from '../../../types/task';
import type { User } from '../../../types/user';

type RawUser = User & { _id?: string };

type UseTasksDataArgs = {
  mounted: boolean;
  isAuthenticated: boolean;
  canAssign: boolean;
  isGlobalManager: boolean;
  isDepartmentManager: boolean;
  isInternAssigner: boolean;
  currentDepartmentId: string;
  currentUserId: string;
  onError: (message: string) => void;
};

const TASKS_POLL_INTERVAL_MS = 15000;

const getUserId = (user: RawUser | null | undefined): string => {
  if (!user) return '';
  return user.user_id || user._id || '';
};

const hasSetupName = (user: RawUser): boolean => {
  return Boolean(user.first_name?.trim() && user.last_name?.trim());
};

export const useTasksData = ({
  mounted,
  isAuthenticated,
  canAssign,
  isGlobalManager,
  isDepartmentManager,
  isInternAssigner,
  currentDepartmentId,
  currentUserId,
  onError,
}: UseTasksDataArgs) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<RawUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const loadTasksData = useCallback(
    async (options?: { showLoader?: boolean; silent?: boolean }) => {
      const showLoader = options?.showLoader ?? false;
      const silent = options?.silent ?? false;

      if (showLoader) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      if (!silent) {
        onError('');
      }

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
        setLastSyncedAt(new Date());
      } catch (error: any) {
        if (!silent) {
          onError(error?.response?.data?.message || 'Failed to load tasks.');
        }
      } finally {
        if (showLoader) {
          setIsLoading(false);
        } else {
          setIsRefreshing(false);
        }
      }
    },
    [canAssign, currentDepartmentId, currentUserId, isDepartmentManager, isGlobalManager, isInternAssigner, onError],
  );

  useEffect(() => {
    if (!mounted || !isAuthenticated) return;
    void loadTasksData({ showLoader: true });
  }, [mounted, isAuthenticated, loadTasksData]);

  useEffect(() => {
    if (!mounted || !isAuthenticated) return;

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void loadTasksData({ silent: true });
      }
    }, TASKS_POLL_INTERVAL_MS);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void loadTasksData({ silent: true });
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [mounted, isAuthenticated, loadTasksData]);

  return {
    tasks,
    users,
    isLoading,
    isRefreshing,
    lastSyncedAt,
    loadTasksData,
  };
};
