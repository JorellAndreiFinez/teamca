import mongoose, { Document, Schema, Types } from "mongoose";

export interface ITaskFeedback extends Document {
  task_id: Types.ObjectId;
  supervisor_id: Types.ObjectId;
  comments: string;
  created_at: Date;
}

const taskFeedbackSchema = new Schema<ITaskFeedback>({
  task_id: {
    type: Schema.Types.ObjectId,
    ref: "Task",
    required: true,
    index: true,
  },
  supervisor_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  comments: { type: String, required: true, trim: true },
  created_at: { type: Date, default: Date.now },
});

taskFeedbackSchema.index({ task_id: 1, created_at: -1 });

export default mongoose.model<ITaskFeedback>(
  "TaskFeedback",
  taskFeedbackSchema,
);
