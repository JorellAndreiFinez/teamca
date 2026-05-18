import mongoose, { Document, Schema, Types } from "mongoose";

export interface ITaskComment extends Document {
  task_id: Types.ObjectId;
  user_id: Types.ObjectId;
  message: string;
  created_at: Date;
}

const taskCommentSchema = new Schema<ITaskComment>({
  task_id: {
    type: Schema.Types.ObjectId,
    ref: "Task",
    required: true,
    index: true,
  },
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  message: { type: String, required: true, trim: true, maxlength: 2000 },
  created_at: { type: Date, default: Date.now },
});

taskCommentSchema.index({ task_id: 1, created_at: -1 });

export default mongoose.model<ITaskComment>("TaskComment", taskCommentSchema);
