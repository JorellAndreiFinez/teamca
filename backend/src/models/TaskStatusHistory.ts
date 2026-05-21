import mongoose, { Document, Schema, Types } from "mongoose";
import type { TaskStatus } from "./Task.js";

export interface ITaskStatusHistory extends Document {
  task_id: Types.ObjectId;
  updated_by: Types.ObjectId;
  previous_status: TaskStatus;
  new_status: TaskStatus;
  update_notes?: string;
  timestamp: Date;
}

const taskStatusHistorySchema = new Schema<ITaskStatusHistory>({
  task_id: {
    type: Schema.Types.ObjectId,
    ref: "Task",
    required: true,
    index: true,
  },
  updated_by: { type: Schema.Types.ObjectId, ref: "User", required: true },
  previous_status: {
    type: String,
    enum: ["Not Started", "In Progress", "Under Review", "Completed"],
    required: true,
  },
  new_status: {
    type: String,
    enum: ["Not Started", "In Progress", "Under Review", "Completed"],
    required: true,
  },
  update_notes: { type: String, trim: true },
  timestamp: { type: Date, default: Date.now },
});

taskStatusHistorySchema.index({ task_id: 1, timestamp: -1 });

export default mongoose.model<ITaskStatusHistory>(
  "TaskStatusHistory",
  taskStatusHistorySchema,
);
