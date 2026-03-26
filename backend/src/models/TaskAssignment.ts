import mongoose, { Document, Schema, Types } from "mongoose";

export interface ITaskAssignment extends Document {
  task_id: Types.ObjectId;
  assigned_to: Types.ObjectId;
  assigned_at: Date;
}

const taskAssignmentSchema = new Schema<ITaskAssignment>({
  task_id: { type: Schema.Types.ObjectId, ref: "Task", required: true, index: true },
  assigned_to: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  assigned_at: { type: Date, default: Date.now },
});

taskAssignmentSchema.index({ task_id: 1, assigned_to: 1 }, { unique: true });

export default mongoose.model<ITaskAssignment>("TaskAssignment", taskAssignmentSchema);
