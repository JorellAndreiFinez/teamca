import mongoose, { Schema, Document, Types } from "mongoose";

export interface IUserDepartment {
  department_id: Types.ObjectId;
  department_role: "Head" | "Supervisor" | "Intern";
}

export interface IUser extends Document {
  first_name: string;
  last_name: string;
  email: string;
  password_hash?: string;
  global_role: "Superadmin" | "Admin" | "Standard_User";
  departments: IUserDepartment[];
  is_active: boolean;

  working_hours: {
    start: string; // "08:00"
    end: string; // "17:00"
  };

  working_days: ("M" | "T" | "W" | "Th" | "F" | "Sat" | "Sun")[];

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
  { _id: false },
);

const userSchema = new Schema<IUser>(
  {
    first_name: { type: String, default: "" },
    last_name: { type: String, default: "" },
    email: { type: String, required: true, unique: true },
    password_hash: { type: String, required: false },

    global_role: {
      type: String,
      enum: ["Superadmin", "Admin", "Standard_User"],
      default: "Standard_User",
    },

    departments: { type: [userDepartmentSchema], default: [] },
    is_active: { type: Boolean, default: true },

    working_hours: {
      start: { type: String, default: "" }, // "08:00"
      end: { type: String, default: "" }, // "17:00"
    },

    working_days: {
      type: [
        {
          type: String,
          enum: ["M", "T", "W", "Th", "F", "Sat", "Sun"],
        },
      ],
      default: [],
    },
  },
  { timestamps: true },
);

export default mongoose.model<IUser>("User", userSchema);
