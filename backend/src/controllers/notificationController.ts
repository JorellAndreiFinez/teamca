import type { Request, Response } from "express";
import { z } from "zod";
import {
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../services/notificationService";

const listNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  unread_only: z.coerce.boolean().optional(),
});

export const listNotificationsHandler = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const query = listNotificationsQuerySchema.parse(req.query);
    const payload = await listNotifications(String(req.user.user_id), {
      page: query.page,
      limit: query.limit,
      unreadOnly: query.unread_only,
    });

    return res.status(200).json(payload);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid query params.", issues: error.issues });
    }

    return res.status(500).json({ message: "Failed to load notifications." });
  }
};

export const markNotificationAsReadHandler = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const rawNotificationId = req.params.notificationId;
    const notificationId = Array.isArray(rawNotificationId) ? rawNotificationId[0] : rawNotificationId;

    if (!notificationId) {
      return res.status(400).json({ message: "notificationId is required." });
    }

    const updated = await markNotificationAsRead(String(req.user.user_id), notificationId);
    return res.status(200).json(updated);
  } catch (error) {
    if (error instanceof Error && error.message === "Notification not found.") {
      return res.status(404).json({ message: error.message });
    }

    return res.status(500).json({ message: "Failed to update notification." });
  }
};

export const markAllNotificationsAsReadHandler = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const result = await markAllNotificationsAsRead(String(req.user.user_id));
    return res.status(200).json(result);
  } catch {
    return res.status(500).json({ message: "Failed to update notifications." });
  }
};
