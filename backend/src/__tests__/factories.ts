import mongoose from "mongoose";
import Department from "../models/Department.js";
import User from "../models/User.js";

let userCounter = 0;

export const makeUser = async (overrides: Partial<{
  first_name: string;
  last_name: string;
  email: string;
  global_role: "Superadmin" | "Admin" | "Standard_User";
  is_active: boolean;
  departments: { department_id: mongoose.Types.ObjectId | string; department_role: "Head" | "Supervisor" | "Intern" }[];
}> = {}) => {
  userCounter += 1;
  return User.create({
    first_name: overrides.first_name ?? `First${userCounter}`,
    last_name: overrides.last_name ?? `Last${userCounter}`,
    email: overrides.email ?? `user${userCounter}@test.local`,
    password_hash: "hashed",
    global_role: overrides.global_role ?? "Standard_User",
    is_active: overrides.is_active ?? true,
    departments: (overrides.departments ?? []).map((d) => ({
      department_id:
        typeof d.department_id === "string"
          ? new mongoose.Types.ObjectId(d.department_id)
          : d.department_id,
      department_role: d.department_role,
    })),
  });
};

export const makeDepartment = async (overrides: Partial<{
  department_name: string;
  description: string;
  department_head: mongoose.Types.ObjectId | string | null;
}> = {}) => {
  return Department.create({
    department_name: overrides.department_name ?? `Dept ${Math.random().toString(36).slice(2, 8)}`,
    description: overrides.description ?? null,
    department_head: overrides.department_head ?? null,
  });
};
