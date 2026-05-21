// backend\src\models\DTR.ts

import mongoose, { Schema, Document } from "mongoose";

export interface IBreak {
  breakStart: Date;
  breakEnd?: Date;
  duration?: number; // minutes
  type: "lunch" | "rest" | "other"; // break category
}

export interface IClock {
  timeIn: Date;
  timeOut?: Date;
  totalHours?: number;
  overtimeHours?: number;
  breaks?: IBreak[]; // NEW: tracked breaks
  status?: "present" | "late" | "very_late" | "absent";
  remarks?: string;
}

export interface IDTR extends Document {
  userId: mongoose.Types.ObjectId;
  departmentId: mongoose.Types.ObjectId;
  date: Date;
  clocks: IClock[];

  // computed metrics
  totalHours?: number; // total work hours (breaks excluded)
  undertimeHours?: number; // hours short of required (8h default)
  totalBreakTime?: number; // total break duration in minutes

  status?: "pending" | "approved" | "rejected";
  remarks?: string;
  attendanceStatus?: "present" | "late" | "very_late" | "absent";
}

const BreakSchema: Schema = new Schema(
  {
    breakStart: { type: Date, required: true },
    breakEnd: { type: Date },
    duration: { type: Number }, // minutes
    type: {
      type: String,
      enum: ["lunch", "rest", "other"],
      default: "rest",
    },
  },
  { _id: false },
);

const ClockSchema: Schema = new Schema(
  {
    timeIn: { type: Date, required: true },
    timeOut: { type: Date },
    totalHours: { type: Number },
    overtimeHours: { type: Number },
    breaks: [BreakSchema],

    status: {
      type: String,
      enum: ["present", "late", "very_late", "absent"],
    },

    remarks: { type: String },
  },
  { _id: false },
);

const DTRSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    date: { type: Date, required: true },
    clocks: [ClockSchema],

    totalHours: { type: Number, default: 0 },
    undertimeHours: { type: Number, default: 0 },
    totalBreakTime: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    remarks: { type: String },

    attendanceStatus: {
      type: String,
      enum: ["present", "late", "very_late", "absent"],
    },
  },
  { timestamps: true },
);

// indexes for efficient queries
DTRSchema.index({ userId: 1, date: -1 });
DTRSchema.index({ departmentId: 1, date: -1 });
DTRSchema.index({ userId: 1, date: 1 });

export default mongoose.model<IDTR>("DTR", DTRSchema);
