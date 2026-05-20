import { Request, Response } from "express";
import { z, ZodError } from "zod";
import { reminderService } from "../services/reminderService";
import { IUser } from "../models/User";

// Zod validation schema
const updateReminderSchema = z.object({
  enableClockInReminder: z.boolean().optional(),
  clockInReminderTime: z.string().optional(),
  enableClockOutReminder: z.boolean().optional(),
  clockOutReminderMinutes: z.number().optional(),
  notificationMethod: z.enum(["push", "email", "both"]).optional(),
  timezone: z.string().optional(),
});

export const reminderController = {
  async getReminder(req: Request, res: Response) {
    try {
      const user = (req as any).user as IUser;
      const userId = (req as any).user?.user_id || (user as any)?._id;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const reminder = await reminderService.getOrCreateReminder(String(userId));

      res.status(200).json({ success: true, data: reminder });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || "Server error" });
    }
  },

  async updateReminder(req: Request, res: Response) {
    try {
      const user = (req as any).user as IUser;
      const userId = (req as any).user?.user_id || (user as any)?._id;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      const validated = updateReminderSchema.parse(req.body);

      const reminder = await reminderService.updateReminderSettings(
        String(userId),
        validated,
      );

      res.status(200).json({ success: true, data: reminder });
    } catch (error: any) {
      if (error instanceof ZodError) {
        res.status(400).json({ success: false, message: "Validation error" });
      } else {
        res
          .status(500)
          .json({ success: false, message: error.message || "Server error" });
      }
    }
  },

  async resetReminder(req: Request, res: Response) {
    try {
      const user = (req as any).user as IUser;
      const userId = (req as any).user?.user_id || (user as any)?._id;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const reminder = await reminderService.updateReminderSettings(
        String(userId),
        {
          enableClockInReminder: true,
          clockInReminderTime: "08:00",
          enableClockOutReminder: true,
          clockOutReminderMinutes: 15,
          notificationMethod: "both",
          timezone: "Asia/Manila",
        },
      );

      res.status(200).json({ success: true, data: reminder });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || "Server error" });
    }
  },
};

export default reminderController;
