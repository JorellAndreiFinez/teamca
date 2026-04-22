// backend\src\models\DTR.ts

import mongoose, { Schema, Document } from "mongoose";

export interface IClock {
  timeIn: Date;
  timeOut?: Date;
  totalHours?: number;
  overtimeHours?: number;
  status?: "present" | "late" | "very_late" | "absent";
  remarks?: string;
}

export interface IDTR extends Document {
  userId: mongoose.Types.ObjectId;
  date: Date;
  clocks: IClock[];
  status?: "pending" | "approved" | "rejected";
  remarks?: string;

  attendanceStatus?: "present" | "late" | "very_late" | "absent";
}

const ClockSchema: Schema = new Schema(
  {
    timeIn: { type: Date, required: true },
    timeOut: { type: Date },
    totalHours: { type: Number },
    overtimeHours: { type: Number },

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
    date: { type: Date, required: true },
    clocks: [ClockSchema],

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

export default mongoose.model<IDTR>("DTR", DTRSchema);
