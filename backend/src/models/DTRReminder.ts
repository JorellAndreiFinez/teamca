import mongoose, { Schema, Document } from "mongoose";

export interface IDTRReminder extends Document {
  userId: mongoose.Types.ObjectId;

  // settings
  enableClockInReminder: boolean;
  clockInReminderTime: string; // "08:00" format

  enableClockOutReminder: boolean;
  clockOutReminderMinutes: number; // e.g., 15 (15 min before end time)

  notificationMethod: "push" | "email" | "both";
  timezone: string; // e.g., "Asia/Manila"

  // tracking
  lastClockInReminderSent?: Date;
  lastClockOutReminderSent?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const DTRReminderSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    enableClockInReminder: { type: Boolean, default: true },
    clockInReminderTime: { type: String, default: "08:00" },

    enableClockOutReminder: { type: Boolean, default: true },
    clockOutReminderMinutes: { type: Number, default: 15 },

    notificationMethod: {
      type: String,
      enum: ["push", "email", "both"],
      default: "both",
    },

    timezone: { type: String, default: "Asia/Manila" },

    lastClockInReminderSent: { type: Date },
    lastClockOutReminderSent: { type: Date },
  },
  { timestamps: true },
);

export default mongoose.model<IDTRReminder>("DTRReminder", DTRReminderSchema);
