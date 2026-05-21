import Notification from "../models/Notification";
import Task from "../models/Task";
import TaskAssignment from "../models/TaskAssignment";
import User from "../models/User";
import { createNotificationsForRecipients } from "./notificationService";
import { emitUsersNotification } from "../socket/io";

// ── Date helpers ──────────────────────────────────────────────────────────────

export const getStartOfDayTimestamp = (value: Date): number =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();

export const formatDateKey = (value: Date): string => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// ── Deadline state ─────────────────────────────────────────────────────────────

// returns the deadline urgency state for a task; completed tasks always return 'none'
export const getDeadlineState = (
  deadline: Date | string | undefined | null,
  status: string,
): "overdue" | "due_today" | "upcoming" | "none" => {
  if (!deadline || status === "Completed") {
    return "none";
  }

  const deadlineDate = new Date(deadline);
  if (Number.isNaN(deadlineDate.getTime())) {
    return "none";
  }

  const today = new Date();
  const deadlineDay = getStartOfDayTimestamp(deadlineDate);
  const todayDay = getStartOfDayTimestamp(today);

  if (deadlineDay < todayDay) {
    return "overdue";
  }

  if (deadlineDay === todayDay) {
    return "due_today";
  }

  return "upcoming";
};

// ── Participant helpers (mirrors what taskController uses) ────────────────────

const getTaskParticipantIds = async (taskId: string): Promise<string[]> => {
  const [task, assignments] = await Promise.all([
    Task.findById(taskId).select("created_by").lean(),
    TaskAssignment.find({ task_id: taskId }).select("assigned_to").lean(),
  ]);

  if (!task) {
    return [];
  }

  const ids = [
    String(task.created_by),
    ...assignments.map((item) => String(item.assigned_to)),
  ];

  return [...new Set(ids)];
};

const getDepartmentReviewerIdsForTask = async (
  taskId: string,
): Promise<string[]> => {
  const participantIds = await getTaskParticipantIds(taskId);
  if (participantIds.length === 0) {
    return [];
  }

  const participantUsers = await User.find({ _id: { $in: participantIds } })
    .select("departments")
    .lean();

  const departmentIds = [
    ...new Set(
      participantUsers.flatMap((user) =>
        (user.departments ?? []).map((department) =>
          String(department.department_id),
        ),
      ),
    ),
  ];

  if (departmentIds.length === 0) {
    return [];
  }

  const reviewers = await User.find({
    is_active: true,
    departments: {
      $elemMatch: {
        department_id: { $in: departmentIds },
        department_role: { $in: ["Head", "Supervisor"] },
      },
    },
  })
    .select("_id")
    .lean();

  return [...new Set(reviewers.map((item) => String(item._id)))];
};

// ── Core notification emitter ─────────────────────────────────────────────────

export type DeadlineNotificationTask = {
  task_id: string | number;
  title: string;
  status: string;
  deadline?: string | Date;
};

// emits task_due_today or task_overdue notifications for a single task
// idempotent — uses an alert_key in notification metadata to avoid duplicates
export const emitDeadlineNotificationsForTask = async (
  task: DeadlineNotificationTask,
  actorId?: string,
  actorFirstName?: string,
): Promise<void> => {
  if (!task.deadline || task.status === "Completed") {
    return;
  }

  const deadlineDate = new Date(task.deadline);
  if (Number.isNaN(deadlineDate.getTime())) {
    return;
  }

  const taskId = String(task.task_id);
  const today = new Date();
  const deadlineDay = getStartOfDayTimestamp(deadlineDate);
  const todayDay = getStartOfDayTimestamp(today);

  const isDueToday = deadlineDay === todayDay;
  const isOverdue = deadlineDay < todayDay;

  if (!isDueToday && !isOverdue) {
    return;
  }

  const recipientIds = [
    ...new Set([
      ...(await getTaskParticipantIds(taskId)),
      ...(await getDepartmentReviewerIdsForTask(taskId)),
    ]),
  ];

  if (recipientIds.length === 0) {
    return;
  }

  if (isDueToday) {
    const alertKey = `task_due_today:${taskId}:${formatDateKey(today)}`;
    const alreadyNotified = await Notification.exists({
      event_type: "task_due_today",
      "metadata.alert_key": alertKey,
    });

    if (!alreadyNotified) {
      const notifications = await createNotificationsForRecipients(
        recipientIds,
        {
          actorId,
          eventType: "task_due_today",
          title: "Task due today",
          message: `Make sure to submit your work on "${task.title}" for reviewing.`,
          entityType: "task",
          entityId: taskId,
          metadata: {
            task_id: taskId,
            task_title: task.title,
            task_status: task.status,
            deadline: deadlineDate,
            actor_first_name: actorFirstName,
            alert_key: alertKey,
          },
        },
      );

      for (const notification of notifications) {
        emitUsersNotification([notification.recipient_id], notification);
      }
    }
  }

  if (isOverdue) {
    const alertKey = `task_overdue:${taskId}`;
    const alreadyNotified = await Notification.exists({
      event_type: "task_overdue",
      "metadata.alert_key": alertKey,
    });

    if (!alreadyNotified) {
      const notifications = await createNotificationsForRecipients(
        recipientIds,
        {
          actorId,
          eventType: "task_overdue",
          title: "Task overdue",
          message: `Please accomplish "${task.title}" at your earliest convenience.`,
          entityType: "task",
          entityId: taskId,
          metadata: {
            task_id: taskId,
            task_title: task.title,
            task_status: task.status,
            deadline: deadlineDate,
            actor_first_name: actorFirstName,
            alert_key: alertKey,
          },
        },
      );

      for (const notification of notifications) {
        emitUsersNotification([notification.recipient_id], notification);
      }
    }
  }
};

// ── Nightly sweep ─────────────────────────────────────────────────────────────

// queries all non-completed tasks with a deadline <= end of today and emits
// deadline notifications for each; called by the scheduler once per day
export const runDeadlineSweep = async (): Promise<{
  processed: number;
  notified: number;
}> => {
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const tasks = await Task.find({
    status: { $ne: "Completed" },
    deadline: { $lte: endOfToday },
  })
    .select("_id title status deadline")
    .lean();

  let notified = 0;

  for (const task of tasks) {
    const taskId = String(task._id);
    const previousCount = await Notification.countDocuments({
      $or: [
        {
          event_type: "task_due_today",
          "metadata.task_id": taskId,
        },
        {
          event_type: "task_overdue",
          "metadata.task_id": taskId,
        },
      ],
    });

    await emitDeadlineNotificationsForTask({
      task_id: taskId,
      title: task.title,
      status: task.status,
      deadline: task.deadline,
    });

    const newCount = await Notification.countDocuments({
      $or: [
        {
          event_type: "task_due_today",
          "metadata.task_id": taskId,
        },
        {
          event_type: "task_overdue",
          "metadata.task_id": taskId,
        },
      ],
    });

    if (newCount > previousCount) {
      notified += 1;
    }
  }

  return { processed: tasks.length, notified };
};
