// backend\src\models\Leave.ts

import mongoose, { Schema, Document } from "mongoose";

export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface ILeave extends Document {
  userId: mongoose.Types.ObjectId;
  departmentId: mongoose.Types.ObjectId;
  type: "Professional";
  duration: 0.5 | 1 | 2 | 3;
  startDate: Date;
  endDate: Date;
  reason: string;
  status: LeaveStatus;
  createdAt: Date;
  updatedAt: Date;
}

const LeaveSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    type: { type: String, enum: ["Professional"], default: "Professional" },
    duration: { type: Number, enum: [0.5, 1, 2, 3], required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true },
);

export default mongoose.model<ILeave>("Leave", LeaveSchema);
