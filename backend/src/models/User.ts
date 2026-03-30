// backend/src/models/User.ts

import mongoose, { Schema, Document, Types } from "mongoose";

export interface IUserDepartment {
  department_id: Types.ObjectId;
  department_role: "Head" | "Supervisor" | "Intern";
}

export interface IUser extends Document {
  first_name: string;
  last_name: string;
  email: string;
  password_hash: string;
  global_role: "Superadmin" | "Admin" | "Standard_User";
  departments: IUserDepartment[];
  is_active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userDepartmentSchema = new Schema<IUserDepartment>(
  {
    department_id: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    department_role: {
      type: String,
      enum: ["Head", "Supervisor", "Intern"],
      required: true,
    },
  },
  { _id: false }, // prevent Mongoose from creating _id for each subdocument
);

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
    departments: { type: [userDepartmentSchema], default: [] }, // array of departments
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default mongoose.model<IUser>("User", userSchema);
