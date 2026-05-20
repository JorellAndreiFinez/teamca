import DTRReminder from "../models/DTRReminder";

export const reminderService = {
  async getOrCreateReminder(userId: string) {
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
    const reminder = await DTRReminder.findOneAndUpdate(
      { userId },
      updates,
      { new: true, upsert: true },
    );
    
    return reminder;
  },

  async getReminder(userId: string) {
    const reminder = await DTRReminder.findOne({ userId });
    return reminder;
  },

  async markClockInReminderSent(userId: string) {
    await DTRReminder.findOneAndUpdate(
      { userId },
      { lastClockInReminderSent: new Date() },
      { new: true, upsert: true },
    );
  },

  async markClockOutReminderSent(userId: string) {
    await DTRReminder.findOneAndUpdate(
      { userId },
      { lastClockOutReminderSent: new Date() },
      { new: true, upsert: true },
    );
  },

  async getRemindersToFire() {
    // Get all enabled reminders
    const reminders = await DTRReminder.find({
      $or: [
        { enableClockInReminder: true },
        { enableClockOutReminder: true },
      ],
    }).populate("userId");
    
    return reminders;
  },
};
