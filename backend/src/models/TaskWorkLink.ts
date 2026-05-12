import mongoose, { Document, Schema, Types } from "mongoose";

export interface ITaskWorkLink extends Document {
  task_id: Types.ObjectId;
  submitted_by: Types.ObjectId;
  url: string;
  label?: string;
  created_at: Date;
}

const taskWorkLinkSchema = new Schema<ITaskWorkLink>({
  task_id: {
    type: Schema.Types.ObjectId,
    ref: "Task",
    required: true,
    index: true,
  },
  submitted_by: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  url: { type: String, required: true, trim: true },
  label: { type: String, trim: true },
  created_at: { type: Date, default: Date.now },
});

taskWorkLinkSchema.index({ task_id: 1, created_at: -1 });

export default mongoose.model<ITaskWorkLink>(
  "TaskWorkLink",
  taskWorkLinkSchema,
);
