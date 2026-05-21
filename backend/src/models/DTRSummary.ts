// backend\src\models\DTRSummary.ts

import mongoose, { Schema, Document } from "mongoose";

export interface IDTRSummary extends Document {
  userId: mongoose.Types.ObjectId;
  departmentId: mongoose.Types.ObjectId;
  period: "week" | "month";
  startDate: Date;
  endDate: Date;

  // hours tracking
  totalHours: number; // total work hours rendered
  requiredHours: number; // baseline requirement
  overtimeHours: number; // hours beyond required
  undertimeHours: number; // hours short of required
  totalBreakTime: number; // total break time in minutes

  // day counts
  daysPresent: number;
  daysLate: number;
  daysAbsent: number;
  daysOnLeave: number;

  // violations
  lateCount: number; // number of late arrivals
  undertimeDays: number; // days with undertime

  createdAt: Date;
  updatedAt: Date;
}

const DTRSummarySchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },

    period: {
      type: String,
      enum: ["week", "month"],
      required: true,
    },

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    totalHours: { type: Number, default: 0 },
    requiredHours: { type: Number, default: 0 },
    overtimeHours: { type: Number, default: 0 },
    undertimeHours: { type: Number, default: 0 },
    totalBreakTime: { type: Number, default: 0 },

    daysPresent: { type: Number, default: 0 },
    daysLate: { type: Number, default: 0 },
    daysAbsent: { type: Number, default: 0 },
    daysOnLeave: { type: Number, default: 0 },

    lateCount: { type: Number, default: 0 },
    undertimeDays: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// indexes for efficient queries
DTRSummarySchema.index({ userId: 1, period: 1, startDate: -1 });
DTRSummarySchema.index({ departmentId: 1, period: 1, startDate: -1 });
DTRSummarySchema.index({ userId: 1, startDate: 1, endDate: 1 });

export default mongoose.model<IDTRSummary>("DTRSummary", DTRSummarySchema);
