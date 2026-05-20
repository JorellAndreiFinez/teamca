import mongoose, { Schema, Document } from "mongoose";

export interface ITimeAdjustmentRequest extends Document {
  userId: mongoose.Types.ObjectId;
  dtrId: mongoose.Types.ObjectId;
  dtrDate: Date;
  
  // requested change
  adjustmentType: "time_in" | "time_out" | "manual_entry" | "leave";
  originalValue?: string;       // original time (HH:mm format)
  requestedValue: string;       // new time or duration/reason
  reason: string;               // explanation for adjustment
  
  // approval workflow
  status: "pending" | "approved" | "rejected";
  reviewedBy?: mongoose.Types.ObjectId;
  reviewNotes?: string;
  reviewedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

const TimeAdjustmentRequestSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    dtrId: { type: Schema.Types.ObjectId, ref: "DTR", required: true },
    dtrDate: { type: Date, required: true },
    
    adjustmentType: {
      type: String,
      enum: ["time_in", "time_out", "manual_entry", "leave"],
      required: true,
    },
    
    originalValue: { type: String },
    requestedValue: { type: String, required: true },
    reason: { type: String, required: true },
    
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewNotes: { type: String },
    reviewedAt: { type: Date },
  },
  { timestamps: true },
);

// indexes for efficient queries
TimeAdjustmentRequestSchema.index({ userId: 1, status: 1 });
TimeAdjustmentRequestSchema.index({ status: 1, createdAt: -1 });
TimeAdjustmentRequestSchema.index({ dtrDate: -1 });

export default mongoose.model<ITimeAdjustmentRequest>(
  "TimeAdjustmentRequest",
  TimeAdjustmentRequestSchema,
);
