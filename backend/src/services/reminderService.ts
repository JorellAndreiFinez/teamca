import DTRReminder from "../models/DTRReminder";

export const reminderService = {
  async getOrCreateReminder(userId: string) {
    try {
      let reminder = await DTRReminder.findOne({ userId });
      
      if (!reminder) {
        reminder = await DTRReminder.create({
          userId,
          enableClockInReminder: true,
          clockInReminderTime: "08:00",
          enableClockOutReminder: true,
          clockOutReminderMinutes: 15,
          notificationMethod: "both",
          timezone: "Asia/Manila",
        });
      }
      
      return reminder;
    } catch (error) {
      throw error;
    }
  },

  async updateReminderSettings(
    userId: string,
    updates: Partial<{
      enableClockInReminder: boolean;
      clockInReminderTime: string;
      enableClockOutReminder: boolean;
      clockOutReminderMinutes: number;
      notificationMethod: "push" | "email" | "both";
      timezone: string;
    }>,
  ) {
    try {
      const reminder = await DTRReminder.findOneAndUpdate(
        { userId },
        updates,
        { new: true, upsert: true },
      );
      
      return reminder;
    } catch (error) {
      throw error;
    }
  },

  async getReminder(userId: string) {
    try {
      const reminder = await DTRReminder.findOne({ userId });
      return reminder;
    } catch (error) {
      throw error;
    }
  },

  async markClockInReminderSent(userId: string) {
    try {
      await DTRReminder.findOneAndUpdate(
        { userId },
        { lastClockInReminderSent: new Date() },
        { new: true, upsert: true },
      );
    } catch (error) {
      throw error;
    }
  },

  async markClockOutReminderSent(userId: string) {
    try {
      await DTRReminder.findOneAndUpdate(
        { userId },
        { lastClockOutReminderSent: new Date() },
        { new: true, upsert: true },
      );
    } catch (error) {
      throw error;
    }
  },

  async getRemindersToFire() {
    try {
      // Get all enabled reminders
      const reminders = await DTRReminder.find({
        $or: [
          { enableClockInReminder: true },
          { enableClockOutReminder: true },
        ],
      }).populate("userId");
      
      return reminders;
    } catch (error) {
      throw error;
    }
  },
};
