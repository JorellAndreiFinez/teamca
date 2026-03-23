import type { Request, Response } from "express";
import { z } from "zod";
import { assignTask, createTaskWithAssignment, listAccessibleTasks } from "../services/taskService";

const createTaskSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters.").max(120, "Title must be 120 characters or fewer."),
  description: z.string().trim().max(1000, "Description must be 1000 characters or fewer.").optional(),
  priority: z.enum(["Low", "Medium", "High"]).optional(),
  deadline: z.coerce.date(),
  assigned_to: z.string().trim().optional(),
});

const assignTaskSchema = z.object({
  assigned_to: z.string().trim().min(1, "assigned_to is required."),
});

export const createTaskHandler = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const payload = createTaskSchema.parse(req.body);
    const created = await createTaskWithAssignment(req.user, payload);

    return res.status(201).json(created);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid request body.", issues: error.issues });
    }

    if (error instanceof Error) {
      if (error.message.includes("Department managers") || error.message.includes("Standard users")) {
        return res.status(403).json({ message: error.message });
      }

      if (error.message.includes("inactive") || error.message.includes("does not exist")) {
        return res.status(404).json({ message: error.message });
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
    const assignment = await assignTask(req.user, {
      taskId,
      assignedToUserId: payload.assigned_to,
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

      if (error.message.includes("Department managers") || error.message.includes("Standard users")) {
        return res.status(403).json({ message: error.message });
      }

      if (error.message.includes("inactive") || error.message.includes("does not exist")) {
        return res.status(404).json({ message: error.message });
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

export default {
  createTaskHandler,
  assignTaskHandler,
  listTasksHandler,
};
