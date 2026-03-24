import Button from '../../../components/ui/Button';
import type { TaskDetail, TaskStatus } from '../../../types/task';
import { useAuthStore } from '../../../store/authStore';

type TaskActionsProps = {
  task: TaskDetail;
  statusUpdating: boolean;
  onUpdateStatus: (nextStatus: TaskStatus) => void;
};

const NEXT_BY_STATUS: Partial<Record<TaskStatus, TaskStatus>> = {
  'Not Started': 'In Progress',
  'In Progress': 'Under Review',
  'Under Review': 'Completed',
};

const REVERT_BY_STATUS: Partial<Record<TaskStatus, TaskStatus>> = {
  'In Progress': 'Not Started',
  'Under Review': 'In Progress',
};

const TARGET_STATUS_BUTTON_CLASS: Record<TaskStatus, string> = {
  'Not Started': 'border-slate-600 bg-slate-700 text-white hover:bg-slate-800 focus:ring-slate-500',
  'In Progress': 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
  'Under Review': 'border-orange-500 bg-orange-500 text-white hover:bg-orange-600 focus:ring-orange-500',
  Completed: 'border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500',
};

const ArrowRightIcon = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7">
    <path d="M2.5 8h9" />
    <path d="m8.5 4.5 3.5 3.5-3.5 3.5" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7">
    <path d="M13.5 8h-9" />
    <path d="m7.5 4.5-3.5 3.5 3.5 3.5" />
  </svg>
);

export default function TaskActions({ task, statusUpdating, onUpdateStatus }: TaskActionsProps) {
  const isGlobalManager = useAuthStore((state) => state.canManageUsers());
  const isDepartmentManager = useAuthStore((state) => state.canManageOwnDepartment());

  const nextStatus = NEXT_BY_STATUS[task.status];
  const revertStatus = REVERT_BY_STATUS[task.status];
  const canComplete = isGlobalManager || isDepartmentManager;
  const canForward = !!nextStatus && (task.status !== 'Under Review' || canComplete);
  const canRevert = !!revertStatus && (task.status !== 'Under Review' || canComplete);

  const handleStatusChange = (target: TaskStatus) => {
    if (target === 'Under Review') {
      const confirmed = window.confirm(
        'Send this task for review? After this, edits are locked until a Head/Supervisor reverts it back to In Progress.'
      );

      if (!confirmed) {
        return;
      }
    }

    onUpdateStatus(target);
  };

  if (!canForward && !canRevert) {
    return null;
  }

  return (
    <section className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
      <h4 className="text-sm font-semibold text-slate-900">Status Actions</h4>
      <div className="flex flex-wrap items-center gap-2">
        {canForward && nextStatus ? (
          <Button
            type="button"
            size="sm"
            loading={statusUpdating}
            className={TARGET_STATUS_BUTTON_CLASS[nextStatus]}
            onClick={() => handleStatusChange(nextStatus)}
          >
            <span>{nextStatus}</span>
            <ArrowRightIcon />
          </Button>
        ) : null}

        {canRevert && revertStatus ? (
          <Button
            type="button"
            size="sm"
            loading={statusUpdating}
            className={TARGET_STATUS_BUTTON_CLASS[revertStatus]}
            onClick={() => onUpdateStatus(revertStatus)}
          >
            <ArrowLeftIcon />
            <span>Revert to {revertStatus}</span>
          </Button>
        ) : null}
      </div>
    </section>
  );
}
