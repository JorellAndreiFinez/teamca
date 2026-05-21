// backend/src/models/Leave.ts

import mongoose, { Document, Schema, Types } from "mongoose";

export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";
export type LeaveType = "vacation" | "sick" | "emergency" | "unpaid" | "other";

export interface IReviewHistoryEntry {
  action: "approved" | "rejected" | "cancelled";
  actor_id: Types.ObjectId;
  actor_name: string;
  reason?: string; // rejection/cancellation reason
  timestamp: Date;
}

export interface ILeave extends Document {
  userId: Types.ObjectId;
  departmentId?: Types.ObjectId;

  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  duration: number; // in days, computed

  reason: string; // applicant-provided reason

  status: LeaveStatus;

  // reviewer info (last action)
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  rejectionReason?: string;

  // full audit trail
  reviewHistory: IReviewHistoryEntry[];

  createdAt: Date;
  updatedAt: Date;
}

const reviewHistorySchema = new Schema<IReviewHistoryEntry>(
  {
    action: {
      type: String,
      enum: ["approved", "rejected", "cancelled"],
      required: true,
    },
    actor_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    actor_name: { type: String, required: true },
    reason: { type: String, trim: true, maxlength: 500 },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false },
);

const leaveSchema = new Schema<ILeave>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      index: true,
    },

    leaveType: {
      type: String,
      enum: ["vacation", "sick", "emergency", "unpaid", "other"],
      default: "other",
    },

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    duration: { type: Number, required: true, min: 1 },

    reason: { type: String, required: true, trim: true, maxlength: 500 },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
      index: true,
    },

    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    rejectionReason: { type: String, trim: true, maxlength: 500 },

    reviewHistory: { type: [reviewHistorySchema], default: [] },
  },
  { timestamps: true },
);

// Compound indexes for common queries
leaveSchema.index({ userId: 1, status: 1, startDate: -1 });
leaveSchema.index({ departmentId: 1, status: 1, startDate: -1 });
// For DTR summary integration — find approved leaves overlapping a date range
leaveSchema.index({ userId: 1, status: 1, startDate: 1, endDate: 1 });

export default mongoose.model<ILeave>("Leave", leaveSchema);
