import type { Request, Response } from "express";
import { z } from "zod";
import Notification from "../models/Notification.js";
import {
  addTaskComment,
  addTaskFeedback,
  addTaskWorkLink,
  assignTask,
  createTaskWithAssignment,
  deleteTasks,
  deleteTaskWorkLink,
  getTaskDetail,
  listAccessibleTasks,
  listAccessibleTasksPaginated,
  listTaskComments,
  listTaskFeedback,
  listTaskStatusHistory,
  listTaskWorkLinks,
  updateTaskDetails,
  updateTaskStatus,
} from "../services/taskService.js";
import Task from "../models/Task.js";
import TaskAssignment from "../models/TaskAssignment.js";
import User from "../models/User.js";
import { createNotificationsForRecipients } from "../services/notificationService.js";
import {
  emitTaskCommentCreated,
  emitTaskStatusUpdated,
  emitUsersNotification,
} from "../socket/io.js";

const createTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters.")
    .max(120, "Title must be 120 characters or fewer."),
  description: z
    .string()
    .trim()
    .max(1000, "Description must be 1000 characters or fewer.")
    .optional(),
  priority: z.enum(["Low", "Medium", "High"]).optional(),
  deadline: z.coerce
    .date()
    .optional()
    .refine((value) => {
      if (!value) {
        return true;
      }

      const today = new Date();
      const startOfToday = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      ).getTime();
      const startOfDeadline = new Date(
        value.getFullYear(),
        value.getMonth(),
        value.getDate(),
      ).getTime();
      return startOfDeadline >= startOfToday;
    }, "deadline cannot be in the past."),
  assigned_to: z
    .union([z.string().trim().min(1), z.array(z.string().trim().min(1)).min(1)])
    .optional(),
});

const assignTaskSchema = z.object({
  assigned_to: z.union([
    z.string().trim().min(1),
    z.array(z.string().trim().min(1)).min(1),
  ]),
});

const updateTaskStatusSchema = z.object({
  status: z.enum(["Not Started", "In Progress", "Under Review", "Completed"]),
  update_notes: z
    .string()
    .trim()
    .max(500, "update_notes must be 500 characters or fewer.")
    .optional(),
});

const addTaskFeedbackSchema = z.object({
  comments: z
    .string()
    .trim()
    .min(3, "comments must be at least 3 characters.")
    .max(2000, "comments must be 2000 characters or fewer."),
});

const addTaskCommentSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "message is required.")
    .max(2000, "message must be 2000 characters or fewer."),
});

const updateTaskDetailsSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Title is required.")
      .max(120, "Title must be 120 characters or fewer.")
      .optional(),
    description: z
      .string()
      .trim()
      .max(1000, "Description must be 1000 characters or fewer.")
      .optional(),
    deadline: z.union([z.coerce.date(), z.null()]).optional(),
  })
  .refine(
    (value) =>
      value.title !== undefined ||
      value.description !== undefined ||
      value.deadline !== undefined,
    { message: "At least one field must be provided." },
  );

const deleteTasksSchema = z.object({
  task_ids: z
    .array(z.string().trim().min(1))
    .min(1, "Select at least one task."),
});

const addTaskWorkLinkSchema = z.object({
  url: z.string().trim().url("url must be a valid URL."),
  label: z
    .string()
    .trim()
    .max(120, "label must be 120 characters or fewer.")
    .optional(),
});

const listTasksQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z
    .enum(["Not Started", "In Progress", "Under Review", "Completed"])
    .optional(),
  priority: z.enum(["Low", "Medium", "High"]).optional(),
  search: z.string().trim().max(200).optional(),
  created_date: z.enum(["all", "today", "7d", "30d"]).default("all"),
  sort_by: z
    .enum([
      "created_desc",
      "created_asc",
      "priority_desc",
      "priority_asc",
      "deadline_asc",
      "deadline_desc",
      "title_asc",
    ])
    .default("created_desc"),
});

const parseTaskId = (req: Request, res: Response): string | null => {
  const rawTaskId = req.params.taskId;
  const taskId = Array.isArray(rawTaskId) ? rawTaskId[0] : rawTaskId;
  if (!taskId) {
    res.status(400).json({ message: "taskId is required." });
    return null;
  }

  return taskId;
};

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

const getTaskAssigneeIds = async (taskId: string): Promise<string[]> => {
  const assignments = await TaskAssignment.find({ task_id: taskId })
    .select("assigned_to")
    .lean();
  return [...new Set(assignments.map((item) => String(item.assigned_to)))];
};

const getTaskDeleteContexts = async (taskIds: string[]) => {
  const normalizedTaskIds = [
    ...new Set(
      taskIds
        .map((taskId) => taskId.trim())
        .filter((taskId) => taskId.length > 0),
    ),
  ];
  if (normalizedTaskIds.length === 0) {
    return [] as Array<{
      task_id: string;
      title: string;
      status: string;
      recipient_ids: string[];
    }>;
  }

  const [tasks, assignments] = await Promise.all([
    Task.find({ _id: { $in: normalizedTaskIds } })
      .select("_id title status created_by")
      .lean(),
    TaskAssignment.find({ task_id: { $in: normalizedTaskIds } })
      .select("task_id assigned_to")
      .lean(),
  ]);

  return tasks.map((task) => {
    const taskId = String(task._id);
    const assigneeIds = assignments
      .filter((assignment) => String(assignment.task_id) === taskId)
      .map((assignment) => String(assignment.assigned_to));

    const recipientIds = [
      ...new Set([String(task.created_by), ...assigneeIds]),
    ];

    return {
      task_id: taskId,
      title: task.title,
      status: task.status,
      recipient_ids: recipientIds,
    };
  });
};

const getUserFirstNameById = async (userId: string): Promise<string> => {
  const user = await User.findById(userId).select("first_name").lean();
  const firstName = user?.first_name?.trim();
  return firstName && firstName.length > 0 ? firstName : "Someone";
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

type DeadlineNotificationTask = {
  task_id: string | number;
  title: string;
  status: string;
  deadline?: string | Date;
};

const getStartOfDayTimestamp = (value: Date): number =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();

const formatDateKey = (value: Date): string => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const emitDeadlineNotificationsForTask = async (
  task: DeadlineNotificationTask,
  actorId?: string,
  actorFirstName?: string,
) => {
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

export const createTaskHandler = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const payload = createTaskSchema.parse(req.body);
    const normalizedAssignees = Array.isArray(payload.assigned_to)
      ? payload.assigned_to
      : payload.assigned_to
        ? [payload.assigned_to]
        : undefined;

    const normalizedPayload = {
      ...payload,
      assigned_to: normalizedAssignees,
    };

    const created = await createTaskWithAssignment(req.user, normalizedPayload);

    const actorId = String(req.user.user_id);
    const actorFirstName = await getUserFirstNameById(actorId);
    await emitDeadlineNotificationsForTask(
      created.task,
      actorId,
      actorFirstName,
    );

    return res.status(201).json(created);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: "Invalid request body.", issues: error.issues });
    }

    if (error instanceof Error) {
      if (
        error.message.includes("Department managers") ||
        error.message.includes("Standard users") ||
        error.message.includes("Interns")
      ) {
        return res.status(403).json({ message: error.message });
      }

      if (
        error.message.includes("inactive") ||
        error.message.includes("does not exist")
      ) {
        return res.status(404).json({ message: error.message });
      }

      if (error.message.includes("At least one assignee")) {
        return res.status(400).json({ message: error.message });
      }

      if (error.message.includes("must include your own user")) {
        return res.status(400).json({ message: error.message });
      }
    }

    return res.status(500).json({ message: "Failed to create task." });
  }
};

export const assignTaskHandler = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const taskId = parseTaskId(req, res);
    if (!taskId) {
      return;
    }

    const payload = assignTaskSchema.parse(req.body);
    const assignees = Array.isArray(payload.assigned_to)
      ? payload.assigned_to
      : [payload.assigned_to];

    const [task, previousAssignments] = await Promise.all([
      Task.findById(taskId).select("title status").lean(),
      TaskAssignment.find({ task_id: taskId }).select("assigned_to").lean(),
    ]);

    if (!task) {
      return res.status(404).json({ message: "Task not found." });
    }

    const previousAssigneeIds = [
      ...new Set(previousAssignments.map((item) => String(item.assigned_to))),
    ];

    const assignment = await assignTask(req.user, {
      taskId,
      assignedToUserIds: assignees,
    });

    const currentAssigneeIds = [
      ...new Set(assignment.map((item) => item.assigned_to)),
    ];
    const addedAssigneeIds = currentAssigneeIds.filter(
      (id) => !previousAssigneeIds.includes(id),
    );
    const removedAssigneeIds = previousAssigneeIds.filter(
      (id) => !currentAssigneeIds.includes(id),
    );
    const actorId = String(req.user.user_id);

    if (addedAssigneeIds.length > 0) {
      const notifications = await createNotificationsForRecipients(
        addedAssigneeIds,
        {
          actorId,
          eventType: "task_assignment_added",
          title: "You were assigned a task",
          message: `You were added to "${task.title}".`,
          entityType: "task",
          entityId: taskId,
          metadata: {
            task_id: taskId,
            assignment_change: "added",
            task_title: task.title,
            task_status: task.status,
          },
        },
      );

      for (const notification of notifications) {
        emitUsersNotification([notification.recipient_id], notification);
      }
    }

    if (removedAssigneeIds.length > 0) {
      const removedNotifications = await createNotificationsForRecipients(
        removedAssigneeIds,
        {
          actorId,
          eventType: "task_assignment_removed",
          title: "You were unassigned from a task",
          message: `You were removed from "${task.title}".`,
          entityType: "task",
          entityId: taskId,
          metadata: {
            task_id: taskId,
            assignment_change: "removed",
            task_title: task.title,
            task_status: task.status,
          },
        },
      );

      for (const notification of removedNotifications) {
        emitUsersNotification([notification.recipient_id], notification);
      }

      const remainingNotifications = await createNotificationsForRecipients(
        currentAssigneeIds,
        {
          actorId,
          eventType: "task_reassigned",
          title: "Task assignees were updated",
          message: `Assignees were updated for "${task.title}".`,
          entityType: "task",
          entityId: taskId,
          metadata: {
            task_id: taskId,
            assignment_change: "reassigned",
            removed_count: removedAssigneeIds.length,
            task_title: task.title,
            task_status: task.status,
          },
        },
      );

      for (const notification of remainingNotifications) {
        emitUsersNotification([notification.recipient_id], notification);
      }
    }

    return res.status(200).json(assignment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: "Invalid request body.", issues: error.issues });
    }

    if (error instanceof Error) {
      if (error.message === "Task not found.") {
        return res.status(404).json({ message: error.message });
      }

      if (
        error.message.includes("Department managers") ||
        error.message.includes("Standard users") ||
        error.message.includes("Interns")
      ) {
        return res.status(403).json({ message: error.message });
      }

      if (
        error.message.includes("inactive") ||
        error.message.includes("does not exist")
      ) {
        return res.status(404).json({ message: error.message });
      }

      if (error.message.includes("At least one assignee")) {
        return res.status(400).json({ message: error.message });
      }

      if (error.message.includes("must include your own user")) {
        return res.status(400).json({ message: error.message });
      }
    }

    return res.status(500).json({ message: "Failed to assign task." });
  }
};

export const listTasksHandler = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const query = listTasksQuerySchema.parse(req.query);

    if (req.query.paginate === "false") {
      const tasks = await listAccessibleTasks(req.user);
      for (const task of tasks) {
        await emitDeadlineNotificationsForTask(task);
      }
      return res.status(200).json(tasks);
    }

    const payload = await listAccessibleTasksPaginated(req.user, {
      page: query.page,
      limit: query.limit,
      status: query.status,
      priority: query.priority,
      search: query.search,
      createdDate: query.created_date,
      sortBy: query.sort_by,
    });

    for (const task of payload.items) {
      await emitDeadlineNotificationsForTask(task);
    }

    return res.status(200).json(payload);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: "Invalid query params.", issues: error.issues });
    }

    return res.status(500).json({ message: "Failed to list tasks." });
  }
};

export const getTaskDetailHandler = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const taskId = parseTaskId(req, res);
    if (!taskId) {
      return;
    }

    const task = await getTaskDetail(req.user, taskId);
    return res.status(200).json(task);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Task not found.") {
        return res.status(404).json({ message: error.message });
      }

      if (error.message.includes("do not have permission")) {
        return res.status(403).json({ message: error.message });
      }
    }

    return res.status(500).json({ message: "Failed to fetch task details." });
  }
};

export const updateTaskStatusHandler = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const taskId = parseTaskId(req, res);
    if (!taskId) {
      return;
    }

    const payload = updateTaskStatusSchema.parse(req.body);
    const updated = await updateTaskStatus(req.user, {
      taskId,
      newStatus: payload.status,
      updateNotes: payload.update_notes,
    });

    emitTaskStatusUpdated(taskId, {
      task_id: taskId,
      task: updated.task,
      history: updated.history,
    });

    const actorId = String(req.user.user_id);
    const actorFirstName = await getUserFirstNameById(actorId);
    const assigneeIds = await getTaskAssigneeIds(taskId);
    const statusNotifications = await createNotificationsForRecipients(
      assigneeIds,
      {
        actorId,
        eventType: "task_status_changed",
        title: "Task status updated",
        message: `${actorFirstName} changed status of "${updated.task.title}" to ${payload.status}.`,
        entityType: "task",
        entityId: taskId,
        metadata: {
          task_id: taskId,
          previous_status: updated.history.previous_status,
          new_status: payload.status,
          actor_first_name: actorFirstName,
          task_title: updated.task.title,
          task_status: payload.status,
        },
      },
    );

    for (const notification of statusNotifications) {
      emitUsersNotification([notification.recipient_id], notification);
    }

    if (
      updated.history.previous_status === "Under Review" &&
      payload.status === "In Progress"
    ) {
      const reviewerIds = await getDepartmentReviewerIdsForTask(taskId);
      const movedBackRecipients = [
        ...new Set([...assigneeIds, ...reviewerIds]),
      ];

      const movedBackNotifications = await createNotificationsForRecipients(
        movedBackRecipients,
        {
          actorId,
          eventType: "task_moved_back",
          title: "Task was sent back",
          message: `${actorFirstName} moved "${updated.task.title}" back from Under Review to In Progress.`,
          entityType: "task",
          entityId: taskId,
          metadata: {
            task_id: taskId,
            previous_status: updated.history.previous_status,
            new_status: payload.status,
            actor_first_name: actorFirstName,
            task_title: updated.task.title,
            task_status: payload.status,
          },
        },
      );

      for (const notification of movedBackNotifications) {
        emitUsersNotification([notification.recipient_id], notification);
      }
    }

    if (payload.status === "Under Review" || payload.status === "Completed") {
      const participantIds = await getTaskParticipantIds(taskId);
      const reviewerIds = await getDepartmentReviewerIdsForTask(taskId);
      const recipientIds = [...new Set([...participantIds, ...reviewerIds])];

      const eventType =
        payload.status === "Under Review"
          ? "task_status_under_review"
          : "task_status_completed";

      const notifications = await createNotificationsForRecipients(
        recipientIds,
        {
          actorId,
          eventType,
          title:
            payload.status === "Under Review"
              ? "Task sent for review"
              : "Task completed",
          message: `${actorFirstName} changed status of "${updated.task.title}" to ${payload.status}.`,
          entityType: "task",
          entityId: taskId,
          metadata: {
            task_id: taskId,
            new_status: payload.status,
            actor_first_name: actorFirstName,
            task_title: updated.task.title,
            task_status: payload.status,
          },
        },
      );

      for (const notification of notifications) {
        emitUsersNotification([notification.recipient_id], notification);
      }
    }

    return res.status(200).json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: "Invalid request body.", issues: error.issues });
    }

    if (error instanceof Error) {
      if (error.message === "Task not found.") {
        return res.status(404).json({ message: error.message });
      }

      if (
        error.message.includes("Invalid status transition") ||
        error.message.includes("already in the requested status") ||
        error.message.includes("are locked") ||
        error.message.includes("Attach at least one work link")
      ) {
        return res.status(400).json({ message: error.message });
      }

      if (error.message.includes("do not have permission")) {
        return res.status(403).json({ message: error.message });
      }
    }

    return res.status(500).json({ message: "Failed to update task status." });
  }
};

export const updateTaskDetailsHandler = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const taskId = parseTaskId(req, res);
    if (!taskId) {
      return;
    }

    const payload = updateTaskDetailsSchema.parse(req.body);
    if (payload.deadline && payload.deadline.getTime() < Date.now()) {
      return res
        .status(400)
        .json({ message: "Deadline cannot be in the past." });
    }

    const existingTask = await Task.findById(taskId)
      .select("title description deadline")
      .lean();

    if (!existingTask) {
      return res.status(404).json({ message: "Task not found." });
    }

    const updatedTask = await updateTaskDetails(req.user, {
      taskId,
      title: payload.title,
      description: payload.description,
      deadline: payload.deadline,
    });

    const actorId = String(req.user.user_id);
    const actorFirstName = await getUserFirstNameById(actorId);
    await emitDeadlineNotificationsForTask(
      updatedTask,
      actorId,
      actorFirstName,
    );

    const changedFields: string[] = [];
    if (existingTask.title !== updatedTask.title) {
      changedFields.push("title");
    }

    const previousDescription = (existingTask.description || "").trim();
    const nextDescription = (updatedTask.description || "").trim();
    if (previousDescription !== nextDescription) {
      changedFields.push("description");
    }

    const previousDeadline = existingTask.deadline
      ? new Date(existingTask.deadline).getTime()
      : null;
    const nextDeadline = updatedTask.deadline
      ? new Date(updatedTask.deadline).getTime()
      : null;
    if (previousDeadline !== nextDeadline) {
      changedFields.push("deadline");
    }

    if (changedFields.length > 0) {
      const [participantIds, reviewerIds] = await Promise.all([
        getTaskParticipantIds(taskId),
        getDepartmentReviewerIdsForTask(taskId),
      ]);

      const notifications = await createNotificationsForRecipients(
        [...new Set([...participantIds, ...reviewerIds])],
        {
          actorId,
          eventType: "task_details_updated",
          title: "Task details updated",
          message: `${actorFirstName} updated ${changedFields.join(", ")} for "${updatedTask.title}".`,
          entityType: "task",
          entityId: taskId,
          metadata: {
            task_id: taskId,
            task_title: updatedTask.title,
            changed_fields: changedFields,
            actor_first_name: actorFirstName,
          },
        },
      );

      for (const notification of notifications) {
        emitUsersNotification([notification.recipient_id], notification);
      }
    }

    return res.status(200).json(updatedTask);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: "Invalid request body.", issues: error.issues });
    }

    if (error instanceof Error) {
      if (error.message === "Task not found.") {
        return res.status(404).json({ message: error.message });
      }

      if (error.message.includes("do not have permission")) {
        return res.status(403).json({ message: error.message });
      }
    }

    return res.status(500).json({ message: "Failed to update task details." });
  }
};

export const deleteTasksHandler = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const payload = deleteTasksSchema.parse(req.body);
    const contexts = await getTaskDeleteContexts(payload.task_ids);

    const result = await deleteTasks(req.user, {
      taskIds: payload.task_ids,
    });

    const actorId = String(req.user.user_id);
    const actorFirstName = await getUserFirstNameById(actorId);

    for (const deletedTaskId of result.deleted_task_ids) {
      const context = contexts.find((item) => item.task_id === deletedTaskId);
      if (!context) {
        continue;
      }

      const notifications = await createNotificationsForRecipients(
        context.recipient_ids,
        {
          actorId,
          eventType: "task_deleted",
          title: "Task deleted",
          message: `${actorFirstName} deleted "${context.title}".`,
          entityType: "task",
          entityId: deletedTaskId,
          metadata: {
            task_id: deletedTaskId,
            task_title: context.title,
            task_status: context.status,
            actor_first_name: actorFirstName,
          },
        },
      );

      for (const notification of notifications) {
        emitUsersNotification([notification.recipient_id], notification);
      }
    }

    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: "Invalid request body.", issues: error.issues });
    }

    if (error instanceof Error) {
      if (error.message === "Task not found.") {
        return res.status(404).json({ message: error.message });
      }

      if (error.message.includes("do not have permission")) {
        return res.status(403).json({ message: error.message });
      }
    }

    return res.status(500).json({ message: "Failed to delete tasks." });
  }
};

export const addTaskFeedbackHandler = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const taskId = parseTaskId(req, res);
    if (!taskId) {
      return;
    }

    const payload = addTaskFeedbackSchema.parse(req.body);
    const feedback = await addTaskFeedback(req.user, {
      taskId,
      comments: payload.comments,
    });

    const [task, assigneeIds] = await Promise.all([
      Task.findById(taskId).select("title created_by").lean(),
      getTaskAssigneeIds(taskId),
    ]);

    if (task) {
      const recipientIds = [...assigneeIds];
      const creatorId = String(task.created_by);
      if (!recipientIds.includes(creatorId)) {
        recipientIds.push(creatorId);
      }

      const notifications = await createNotificationsForRecipients(
        recipientIds,
        {
          actorId: String(req.user.user_id),
          eventType: "task_feedback_added",
          title: "New task feedback",
          message: `Kindly check the feedback sent to ${task.title}.`,
          entityType: "task",
          entityId: taskId,
          metadata: {
            task_id: taskId,
            feedback_id: feedback.feedback_id,
          },
        },
      );

      for (const notification of notifications) {
        emitUsersNotification([notification.recipient_id], notification);
      }
    }

    return res.status(201).json(feedback);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: "Invalid request body.", issues: error.issues });
    }

    if (error instanceof Error) {
      if (error.message === "Task not found.") {
        return res.status(404).json({ message: error.message });
      }

      if (
        error.message.includes("Only supervisors") ||
        error.message.includes("do not have permission")
      ) {
        return res.status(403).json({ message: error.message });
      }
    }

    return res.status(500).json({ message: "Failed to submit task feedback." });
  }
};

export const listTaskFeedbackHandler = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const taskId = parseTaskId(req, res);
    if (!taskId) {
      return;
    }

    const feedback = await listTaskFeedback(req.user, taskId);
    return res.status(200).json(feedback);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Task not found.") {
        return res.status(404).json({ message: error.message });
      }

      if (error.message.includes("do not have permission")) {
        return res.status(403).json({ message: error.message });
      }
    }

    return res.status(500).json({ message: "Failed to load task feedback." });
  }
};

export const listTaskStatusHistoryHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const taskId = parseTaskId(req, res);
    if (!taskId) {
      return;
    }

    const history = await listTaskStatusHistory(req.user, taskId);
    return res.status(200).json(history);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Task not found.") {
        return res.status(404).json({ message: error.message });
      }

      if (error.message.includes("do not have permission")) {
        return res.status(403).json({ message: error.message });
      }
    }

    return res
      .status(500)
      .json({ message: "Failed to load task status history." });
  }
};

export const addTaskWorkLinkHandler = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const taskId = parseTaskId(req, res);
    if (!taskId) {
      return;
    }

    const payload = addTaskWorkLinkSchema.parse(req.body);
    const workLink = await addTaskWorkLink(req.user, {
      taskId,
      url: payload.url,
      label: payload.label,
    });

    return res.status(201).json(workLink);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: "Invalid request body.", issues: error.issues });
    }

    if (error instanceof Error) {
      if (error.message === "Task not found.") {
        return res.status(404).json({ message: error.message });
      }

      if (error.message.includes("before the task enters review")) {
        return res.status(400).json({ message: error.message });
      }

      if (error.message.includes("do not have permission")) {
        return res.status(403).json({ message: error.message });
      }
    }

    return res.status(500).json({ message: "Failed to add task work link." });
  }
};

export const listTaskWorkLinksHandler = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const taskId = parseTaskId(req, res);
    if (!taskId) {
      return;
    }

    const workLinks = await listTaskWorkLinks(req.user, taskId);
    return res.status(200).json(workLinks);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Task not found.") {
        return res.status(404).json({ message: error.message });
      }

      if (error.message.includes("do not have permission")) {
        return res.status(403).json({ message: error.message });
      }
    }

    return res.status(500).json({ message: "Failed to load task work links." });
  }
};

export const deleteTaskWorkLinkHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const taskId = parseTaskId(req, res);
    if (!taskId) {
      return;
    }

    const rawWorkLinkId = req.params.workLinkId;
    const workLinkId = Array.isArray(rawWorkLinkId)
      ? rawWorkLinkId[0]
      : rawWorkLinkId;
    if (!workLinkId) {
      return res.status(400).json({ message: "workLinkId is required." });
    }

    const removed = await deleteTaskWorkLink(req.user, { taskId, workLinkId });
    return res.status(200).json(removed);
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message === "Task not found." ||
        error.message === "Work link not found."
      ) {
        return res.status(404).json({ message: error.message });
      }

      if (
        error.message.includes("before the task enters review") ||
        error.message.includes("only remove your own work links")
      ) {
        return res.status(400).json({ message: error.message });
      }

      if (error.message.includes("do not have permission")) {
        return res.status(403).json({ message: error.message });
      }
    }

    return res
      .status(500)
      .json({ message: "Failed to remove task work link." });
  }
};

export const listTaskCommentsHandler = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const taskId = parseTaskId(req, res);
    if (!taskId) {
      return;
    }

    const comments = await listTaskComments(req.user, taskId);
    return res.status(200).json(comments);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Task not found.") {
        return res.status(404).json({ message: error.message });
      }

      if (error.message.includes("do not have permission")) {
        return res.status(403).json({ message: error.message });
      }
    }

    return res.status(500).json({ message: "Failed to load task comments." });
  }
};

export const addTaskCommentHandler = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const taskId = parseTaskId(req, res);
    if (!taskId) {
      return;
    }

    const payload = addTaskCommentSchema.parse(req.body);
    const comment = await addTaskComment(req.user, {
      taskId,
      message: payload.message,
    });

    emitTaskCommentCreated(taskId, {
      task_id: taskId,
      comment,
    });

    const [task, assigneeIds] = await Promise.all([
      Task.findById(taskId).select("title").lean(),
      getTaskAssigneeIds(taskId),
    ]);

    const taskTitle = task?.title || `task ${taskId}`;
    const notifications = await createNotificationsForRecipients(assigneeIds, {
      actorId: String(req.user.user_id),
      eventType: "task_comment_created",
      title: "New task comment",
      message: `${comment.user?.first_name || "A user"} commented on ${taskTitle}.`,
      entityType: "task",
      entityId: taskId,
      metadata: {
        task_id: taskId,
        comment_id: comment.comment_id,
      },
    });

    for (const notification of notifications) {
      emitUsersNotification([notification.recipient_id], notification);
    }

    return res.status(201).json(comment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: "Invalid request body.", issues: error.issues });
    }

    if (error instanceof Error) {
      if (error.message === "Task not found.") {
        return res.status(404).json({ message: error.message });
      }

      if (error.message.includes("do not have permission")) {
        return res.status(403).json({ message: error.message });
      }
    }

    return res.status(500).json({ message: "Failed to add task comment." });
  }
};

export default {
  createTaskHandler,
  assignTaskHandler,
  listTasksHandler,
  getTaskDetailHandler,
  updateTaskStatusHandler,
  updateTaskDetailsHandler,
  deleteTasksHandler,
  addTaskFeedbackHandler,
  listTaskFeedbackHandler,
  listTaskStatusHistoryHandler,
  addTaskWorkLinkHandler,
  listTaskWorkLinksHandler,
  deleteTaskWorkLinkHandler,
  listTaskCommentsHandler,
  addTaskCommentHandler,
};
