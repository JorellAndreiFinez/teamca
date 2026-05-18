import mongoose from "mongoose";
import User from "../models/User";
import InternProfile from "../models/InternProfile";
import { Request, Response } from "express";

const SAFE_USER_SELECT = "-password_hash";

type GlobalRole = "Superadmin" | "Admin" | "Standard_User";
type DepartmentRole = "Head" | "Supervisor" | "Intern";

export type CreateWhitelistedUserInput = {
  email: string;
};

export type ActivateWhitelistedUserInput = {
  first_name: string;
  last_name: string;
  password_hash: string;
  global_role: GlobalRole;
  department_id?: string;
  department_role?: DepartmentRole;
};

export type UpdateUserInput = {
  first_name?: string;
  last_name?: string;
  email?: string;
  password_hash?: string;
  global_role?: GlobalRole;

  departments?: {
    department_id: string;
    department_role: DepartmentRole;
  }[];

  is_active?: boolean;

  working_hours?: {
    start?: string;
    end?: string;
  };

  working_days?: ("M" | "T" | "W" | "Th" | "F" | "Sat" | "Sun")[];
};

export type CreateUserInput = {
  first_name: string;
  last_name: string;
  email: string;
  password_hash: string;
  global_role: GlobalRole;
  is_active?: boolean;

  departments?: {
    department_id: string;
    department_role: DepartmentRole;
  }[];

  working_hours?: {
    start: string;
    end: string;
  };

  working_days?: ("M" | "T" | "W" | "Th" | "F" | "Sat" | "Sun")[];
};

export type UpsertInternProfileInput = {
  school_university?: string;
  required_hours?: number;
  rendered_hours_total?: number;
  actual_end_date?: Date | null;
};

export const getAllUsers = async () => {
  return User.find().select(SAFE_USER_SELECT).sort({ createdAt: -1 }).lean();
};

export const getUserById = async (userId: string) => {
  const user = await User.findById(userId).select(SAFE_USER_SELECT).lean();
  if (!user) return null;

  const intern_profile = await InternProfile.findOne({
    user_id: user._id,
  }).lean();
  return { ...user, intern_profile };
};

export const createWhitelistedUser = async (
  payload: CreateWhitelistedUserInput,
) => {
  const email = payload.email.trim().toLowerCase();

  const existing = await User.findOne({ email });
  if (existing) throw new Error("Email already exists.");

  const created = await User.create({
    email,
    is_active: false,
    first_name: "",
    last_name: "",
    global_role: "Standard_User",
    departments: [],
  });

  return getUserById(String(created._id));
};

export const activateWhitelistedUser = async (
  userId: string,
  payload: ActivateWhitelistedUserInput,
) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found.");

  // Security: Ensure user is whitelisted (inactive without password)
  if (user.is_active) throw new Error("User is already active.");
  if (user.password_hash) throw new Error("User already has a password set.");

  // Security: Prevent role escalation - don't allow changing global_role to Superadmin
  if (payload.global_role === "Superadmin") {
    throw new Error("Cannot assign Superadmin role through this endpoint.");
  }

  user.first_name = payload.first_name;
  user.last_name = payload.last_name;
  user.password_hash = payload.password_hash;
  user.global_role = payload.global_role;

  if (payload.department_id && payload.department_role) {
    user.departments = [
      {
        department_id: new mongoose.Types.ObjectId(payload.department_id),
        department_role: payload.department_role,
      },
    ];
  }

  user.is_active = true;
  await user.save();

  return getUserById(String(user._id));
};

export const createUser = async (payload: CreateUserInput) => {
  const email = payload.email.trim().toLowerCase();

  const existing = await User.findOne({ email });
  if (existing) throw new Error("Email already exists.");

  const userPayload = {
    first_name: payload.first_name,
    last_name: payload.last_name,
    email,
    password_hash: payload.password_hash,
    global_role: payload.global_role,
    is_active: payload.is_active ?? true,

    working_hours: {
      start: payload.working_hours?.start || "",
      end: payload.working_hours?.end || "",
    },

    working_days: payload.working_days || [],

    departments: (payload.departments || []).map((d) => ({
      department_id: new mongoose.Types.ObjectId(d.department_id),
      department_role: d.department_role,
    })),
  };

  const created = await User.create(userPayload);

  return getUserById(String(created._id));
};

export const updateUser = async (userId: string, payload: UpdateUserInput) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  if (payload.first_name !== undefined) user.first_name = payload.first_name;
  if (payload.last_name !== undefined) user.last_name = payload.last_name;
  if (payload.email !== undefined) {
    const nextEmail = payload.email.trim().toLowerCase();
    if (!nextEmail) {
      throw new Error("Email is required");
    }

    const existingEmailUser = await User.findOne({
      email: nextEmail,
      _id: { $ne: userId },
    });
    if (existingEmailUser) {
      throw new Error("Email already exists.");
    }

    user.email = nextEmail;
  }
  if (payload.password_hash !== undefined) {
    user.password_hash = payload.password_hash;
  }
  if (payload.global_role !== undefined) user.global_role = payload.global_role;
  if (payload.is_active !== undefined) user.is_active = payload.is_active;

  // ✅ working_hours
  if (payload.working_hours) {
    user.working_hours = {
      start: payload.working_hours.start ?? user.working_hours?.start ?? "",
      end: payload.working_hours.end ?? user.working_hours?.end ?? "",
    };
  }

  // ✅ working_days
  if (Array.isArray(payload.working_days)) {
    user.working_days = payload.working_days;
  }

  if (Array.isArray(payload.departments)) {
    user.departments = payload.departments.map((d) => ({
      department_id: new mongoose.Types.ObjectId(d.department_id),
      department_role: d.department_role,
    }));
  }

  await user.save();

  // lightweight update response without intern profile
  return user.toObject();
};

export const deleteWhitelistedUser = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found.");

  await user.deleteOne();
  return { message: "Whitelisted user deleted" };
};

export const getWhitelistedUsers = async (req: Request, res: Response) => {
  try {
    const currentUser = req.user;
    if (!currentUser || currentUser.global_role !== "Superadmin") {
      return res
        .status(403)
        .json({ message: "Forbidden: Only Superadmins can access this." });
    }

    const whitelistedUsers = await User.find({ is_active: true })
      .select("-password_hash")
      .lean();

    res.json(whitelistedUsers);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

export const upsertUserInternProfile = async (
  userId: string,
  payload: UpsertInternProfileInput,
) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found.");

  const existingProfile = await InternProfile.findOne({ user_id: user._id });

  if (!existingProfile) {
    if (
      !payload.school_university ||
      !payload.required_hours
    ) {
      throw new Error(
        "school_university and required_hours are required for new intern profiles.",
      );
    }

    await InternProfile.create({
      user_id: user._id,
      school_university: payload.school_university,
      required_hours: payload.required_hours,
      rendered_hours_total: payload.rendered_hours_total ?? 0,
      actual_end_date: payload.actual_end_date ?? null,
    });
  } else {
    if (payload.school_university !== undefined) {
      existingProfile.school_university = payload.school_university;
    }
    if (payload.required_hours !== undefined) {
      existingProfile.required_hours = payload.required_hours;
    }
    if (payload.rendered_hours_total !== undefined) {
      existingProfile.rendered_hours_total = payload.rendered_hours_total;
    }
    if (payload.actual_end_date !== undefined) {
      existingProfile.actual_end_date = payload.actual_end_date;
    }

    await existingProfile.save();
  }

  return getUserById(String(user._id));
};

export const deleteUser = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found.");

  if (user.global_role === "Superadmin") {
    throw new Error("Cannot delete a Superadmin user.");
  }

  // delete associated intern profile if exists
  await InternProfile.deleteOne({ user_id: user._id });

  // delete user
  await user.deleteOne();

  return { message: "User successfully deleted" };
};
