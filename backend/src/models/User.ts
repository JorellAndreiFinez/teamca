import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  first_name: string;
  last_name: string;
  email: string;
  password_hash: string;
  global_role: "Superadmin" | "Admin" | "Standard_User";
  department_role?: "Head" | "Supervisor" | "Intern";
  department_id?: number;
  is_active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    first_name: { type: String, default: "" },
    last_name: { type: String, default: "" },
    email: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    global_role: {
      type: String,
      enum: ["Superadmin", "Admin", "Standard_User"],
      default: "Standard_User",
    },
    department_role: { type: String, enum: ["Head", "Supervisor", "Intern"] },
    department_id: Number,
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default mongoose.model<IUser>("User", userSchema);
