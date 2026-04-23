import mongoose from "mongoose";

export type ActionType =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "login"
  | "logout";
export type ResourceType =
  | "user"
  | "task"
  | "department"
  | "dtr"
  | "internProfile"
  | "auth";
export type LogStatus = "success" | "failed";

export interface IActivityLog {
  _id?: string;
  timestamp: Date;
  user_id: mongoose.Types.ObjectId;
  user_name: string;
  action_type: ActionType;
  resource_type: ResourceType;
  resource_id?: string;
  description: string;
  changes?: Record<string, any>;
  status: LogStatus;
  createdAt: Date;
}

const activityLogSchema = new mongoose.Schema<IActivityLog>(
  {
    timestamp: { type: Date, required: true, default: Date.now },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    user_name: { type: String, required: true },
    action_type: {
      type: String,
      required: true,
      enum: ["create", "read", "update", "delete", "login", "logout"],
    },
    resource_type: {
      type: String,
      required: true,
      enum: ["user", "task", "department", "dtr", "internProfile", "auth"],
    },
    resource_id: { type: String },
    description: { type: String, required: true },
    changes: { type: mongoose.Schema.Types.Mixed },
    status: {
      type: String,
      required: true,
      enum: ["success", "failed"],
      default: "success",
    },
  },
  { timestamps: true },
);

// index for fast queries
activityLogSchema.index({ timestamp: -1 });
activityLogSchema.index({ user_id: 1, timestamp: -1 });
activityLogSchema.index({ resource_type: 1, timestamp: -1 });

export default mongoose.model<IActivityLog>("ActivityLog", activityLogSchema);
