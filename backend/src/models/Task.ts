import mongoose, { Schema, Document, Types } from "mongoose";

export type TaskStatus = "Not Started" | "In Progress" | "Under Review" | "Completed";
export type TaskPriority = "Low" | "Medium" | "High";

export interface ITask extends Document {
  title: string;
  description?: string;
  created_by: Types.ObjectId;
  status: TaskStatus;
  priority: TaskPriority;
  deadline: Date;
  created_at: Date;
}

const taskSchema = new Schema<ITask>({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  created_by: { type: Schema.Types.ObjectId, ref: "User", required: true },
  status: {
    type: String,
    enum: ["Not Started", "In Progress", "Under Review", "Completed"],
    default: "Not Started",
  },
  priority: {
    type: String,
    enum: ["Low", "Medium", "High"],
    default: "Medium",
  },
  deadline: { type: Date, required: true },
  created_at: { type: Date, default: Date.now },
});

export default mongoose.model<ITask>("Task", taskSchema);
