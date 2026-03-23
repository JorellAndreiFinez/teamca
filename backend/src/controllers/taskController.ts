import type { Request, Response } from "express";
import { z } from "zod";
import {
  addTaskWorkLink,
  addTaskFeedback,
  assignTask,
  createTaskWithAssignment,
  deleteTaskWorkLink,
  listAccessibleTasks,
  listTaskWorkLinks,
  listTaskStatusHistory,
  listTaskFeedback,
  updateTaskStatus,
} from "../services/taskService";

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

const addTaskWorkLinkSchema = z.object({
  url: z.string().trim().url("url must be a valid URL."),
  label: z.string().trim().max(120, "label must be 120 characters or fewer.").optional(),
});

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

    const rawTaskId = req.params.taskId;
    const taskId = Array.isArray(rawTaskId) ? rawTaskId[0] : rawTaskId;
    if (!taskId) {
      return res.status(400).json({ message: "taskId is required." });
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

    const tasks = await listAccessibleTasks(req.user);
    return res.status(200).json(tasks);
  } catch {
    return res.status(500).json({ message: "Failed to list tasks." });
  }
};

export const updateTaskStatusHandler = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const rawTaskId = req.params.taskId;
    const taskId = Array.isArray(rawTaskId) ? rawTaskId[0] : rawTaskId;
    if (!taskId) {
      return res.status(400).json({ message: "taskId is required." });
    }

    const payload = updateTaskStatusSchema.parse(req.body);
    const updated = await updateTaskStatus(req.user, {
      taskId,
      newStatus: payload.status,
      updateNotes: payload.update_notes,
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

    const rawTaskId = req.params.taskId;
    const taskId = Array.isArray(rawTaskId) ? rawTaskId[0] : rawTaskId;
    if (!taskId) {
      return res.status(400).json({ message: "taskId is required." });
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

    const rawTaskId = req.params.taskId;
    const taskId = Array.isArray(rawTaskId) ? rawTaskId[0] : rawTaskId;
    if (!taskId) {
      return res.status(400).json({ message: "taskId is required." });
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

    const rawTaskId = req.params.taskId;
    const taskId = Array.isArray(rawTaskId) ? rawTaskId[0] : rawTaskId;
    if (!taskId) {
      return res.status(400).json({ message: "taskId is required." });
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

    const rawTaskId = req.params.taskId;
    const taskId = Array.isArray(rawTaskId) ? rawTaskId[0] : rawTaskId;
    if (!taskId) {
      return res.status(400).json({ message: "taskId is required." });
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

    const rawTaskId = req.params.taskId;
    const taskId = Array.isArray(rawTaskId) ? rawTaskId[0] : rawTaskId;
    if (!taskId) {
      return res.status(400).json({ message: "taskId is required." });
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

    const rawTaskId = req.params.taskId;
    const taskId = Array.isArray(rawTaskId) ? rawTaskId[0] : rawTaskId;
    if (!taskId) {
      return res.status(400).json({ message: "taskId is required." });
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

export default {
  createTaskHandler,
  assignTaskHandler,
  listTasksHandler,
  updateTaskStatusHandler,
  addTaskFeedbackHandler,
  listTaskFeedbackHandler,
  listTaskStatusHistoryHandler,
  addTaskWorkLinkHandler,
  listTaskWorkLinksHandler,
  deleteTaskWorkLinkHandler,
};
