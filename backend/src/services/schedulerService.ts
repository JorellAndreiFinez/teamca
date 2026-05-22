import cron from "node-cron";
import DTRReminder from "../models/DTRReminder.js";
import DTR from "../models/DTR.js";
import { createNotification } from "./notificationService.js";
import { emitUserNotification } from "../socket/io.js";

const SHIFT_HOURS = 8;
const PH_OFFSET_MS = 8 * 60 * 60 * 1000;

const toPHTime = (date: Date) => new Date(date.getTime() + PH_OFFSET_MS);

const getTodayPH = () => {
  const d = toPHTime(new Date());
  d.setHours(0, 0, 0, 0);
  return d;
};

const toLocalHHMM = (date: Date, timezone: string) =>
  date.toLocaleTimeString("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

const isSameLocalDay = (date: Date, timezone: string) => {
  const now = new Date();
  return (
    date.toLocaleDateString("en-CA", { timeZone: timezone }) ===
    now.toLocaleDateString("en-CA", { timeZone: timezone })
  );
};

const runClockInReminders = async () => {
  const now = new Date();
  const todayPH = getTodayPH();
  const reminders = await DTRReminder.find({ enableClockInReminder: true });

  for (const reminder of reminders) {
    const userId = String(reminder.userId);
    const tz = reminder.timezone;

    if (toLocalHHMM(now, tz) !== reminder.clockInReminderTime) continue;

    if (
      reminder.lastClockInReminderSent &&
      isSameLocalDay(reminder.lastClockInReminderSent, tz)
    )
      continue;

    const alreadyClockedIn = await DTR.exists({
      userId: reminder.userId,
      date: todayPH,
      "clocks.0": { $exists: true },
    });
    if (alreadyClockedIn) continue;

    await DTRReminder.findByIdAndUpdate(reminder._id, {
      lastClockInReminderSent: now,
    });

    const notification = await createNotification({
      recipientId: userId,
      eventType: "dtr_clock_in_reminder",
      title: "Clock-in Reminder",
      message: `Your scheduled clock-in time is ${reminder.clockInReminderTime}. Don't forget to log your attendance.`,
    });

    emitUserNotification(userId, notification);
  }
};

const runClockOutReminders = async () => {
  const now = new Date();
  const todayPH = getTodayPH();
  const reminders = await DTRReminder.find({ enableClockOutReminder: true });

  for (const reminder of reminders) {
    const userId = String(reminder.userId);
    const tz = reminder.timezone;

    if (
      reminder.lastClockOutReminderSent &&
      isSameLocalDay(reminder.lastClockOutReminderSent, tz)
    )
      continue;

    const dtr = await DTR.findOne({ userId: reminder.userId, date: todayPH });
    if (!dtr || dtr.clocks.length === 0) continue;

    const lastClock = dtr.clocks[dtr.clocks.length - 1];
    if (lastClock.timeOut) continue;

    const expectedEnd = new Date(
      lastClock.timeIn.getTime() + SHIFT_HOURS * 60 * 60 * 1000,
    );
    const reminderAt = new Date(
      expectedEnd.getTime() - reminder.clockOutReminderMinutes * 60 * 1000,
    );

    if (toLocalHHMM(now, tz) !== toLocalHHMM(reminderAt, tz)) continue;

    await DTRReminder.findByIdAndUpdate(reminder._id, {
      lastClockOutReminderSent: now,
    });

    const notification = await createNotification({
      recipientId: userId,
      eventType: "dtr_clock_out_reminder",
      title: "Clock-out Reminder",
      message: `Your shift ends at ${toLocalHHMM(expectedEnd, tz)}. Please clock out in ${reminder.clockOutReminderMinutes} minutes.`,
    });

    emitUserNotification(userId, notification);
  }
};

export const startReminderScheduler = () => {
  cron.schedule("* * * * *", () => {
    void Promise.allSettled([runClockInReminders(), runClockOutReminders()]);
  });
};
