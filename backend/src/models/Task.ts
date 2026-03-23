import mongoose, { Schema, Document } from "mongoose";

export interface ITask extends Document {
  title: string;
  description?: string;
  created_by: string;
  status: string;
  priority: string;
  deadline: Date;
  created_at: Date;
}

const taskSchema = new Schema<ITask>({
  title: { type: String, required: true },
  description: { type: String },
  created_by: { type: String, required: true },
  status: { type: String, default: "Not Started" },
  priority: { type: String, default: "Medium" },
  deadline: { type: Date, required: true },
  created_at: { type: Date, default: Date.now },
});

export default mongoose.model<ITask>("Task", taskSchema);
