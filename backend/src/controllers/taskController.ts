import type { Request, Response } from "express";
import { z } from "zod";
import {
  addTaskComment,
  addTaskFeedback,
  addTaskWorkLink,
  assignTask,
  createTaskWithAssignment,
  deleteTaskWorkLink,
  getTaskDetail,
  listAccessibleTasks,
  listAccessibleTasksPaginated,
  listTaskComments,
  listTaskFeedback,
  listTaskStatusHistory,
  listTaskWorkLinks,
  updateTaskStatus,
} from "../services/taskService";
import { emitTaskCommentCreated, emitTaskStatusUpdated } from "../socket/io";

const createTaskSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters.").max(120, "Title must be 120 characters or fewer."),
  description: z.string().trim().max(1000, "Description must be 1000 characters or fewer.").optional(),
  priority: z.enum(["Low", "Medium", "High"]).optional(),
  deadline: z.coerce.date(),
  assigned_to: z.union([
    z.string().trim().min(1),
    z.array(z.string().trim().min(1)).min(1),
  ]).optional(),
});

const assignTaskSchema = z.object({
  assigned_to: z.union([
    z.string().trim().min(1),
    z.array(z.string().trim().min(1)).min(1),
  ]),
});

const updateTaskStatusSchema = z.object({
  status: z.enum(["Not Started", "In Progress", "Under Review", "Completed"]),
  update_notes: z.string().trim().max(500, "update_notes must be 500 characters or fewer.").optional(),
});

const addTaskFeedbackSchema = z.object({
  comments: z.string().trim().min(3, "comments must be at least 3 characters.").max(2000, "comments must be 2000 characters or fewer."),
});

const addTaskCommentSchema = z.object({
  message: z.string().trim().min(1, "message is required.").max(2000, "message must be 2000 characters or fewer."),
});

const addTaskWorkLinkSchema = z.object({
  url: z.string().trim().url("url must be a valid URL."),
  label: z.string().trim().max(120, "label must be 120 characters or fewer.").optional(),
});

const listTasksQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(["Not Started", "In Progress", "Under Review", "Completed"]).optional(),
  priority: z.enum(["Low", "Medium", "High"]).optional(),
  search: z.string().trim().max(200).optional(),
  created_date: z.enum(["all", "today", "7d", "30d"]).default("all"),
  sort_by: z.enum(["created_desc", "created_asc", "priority_desc", "priority_asc", "deadline_asc", "deadline_desc", "title_asc"]).default("created_desc"),
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

    return res.status(201).json(created);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid request body.", issues: error.issues });
    }

    if (error instanceof Error) {
      if (
        error.message.includes("Department managers") ||
        error.message.includes("Standard users") ||
        error.message.includes("Interns")
      ) {
        return res.status(403).json({ message: error.message });
      }

      if (error.message.includes("inactive") || error.message.includes("does not exist")) {
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

    const assignment = await assignTask(req.user, {
      taskId,
      assignedToUserIds: assignees,
    });

    return res.status(200).json(assignment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid request body.", issues: error.issues });
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

      if (error.message.includes("inactive") || error.message.includes("does not exist")) {
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

    return res.status(200).json(payload);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid query params.", issues: error.issues });
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

    return res.status(200).json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid request body.", issues: error.issues });
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

    return res.status(201).json(feedback);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid request body.", issues: error.issues });
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

export const listTaskStatusHistoryHandler = async (req: Request, res: Response) => {
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

    return res.status(500).json({ message: "Failed to load task status history." });
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
      return res.status(400).json({ message: "Invalid request body.", issues: error.issues });
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

export const deleteTaskWorkLinkHandler = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const taskId = parseTaskId(req, res);
    if (!taskId) {
      return;
    }

    const rawWorkLinkId = req.params.workLinkId;
    const workLinkId = Array.isArray(rawWorkLinkId) ? rawWorkLinkId[0] : rawWorkLinkId;
    if (!workLinkId) {
      return res.status(400).json({ message: "workLinkId is required." });
    }

    const removed = await deleteTaskWorkLink(req.user, { taskId, workLinkId });
    return res.status(200).json(removed);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Task not found." || error.message === "Work link not found.") {
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

    return res.status(500).json({ message: "Failed to remove task work link." });
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

    return res.status(201).json(comment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid request body.", issues: error.issues });
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
  addTaskFeedbackHandler,
  listTaskFeedbackHandler,
  listTaskStatusHistoryHandler,
  addTaskWorkLinkHandler,
  listTaskWorkLinksHandler,
  deleteTaskWorkLinkHandler,
  listTaskCommentsHandler,
  addTaskCommentHandler,
};
