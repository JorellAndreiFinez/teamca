import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User";
import InternProfile from "../models/InternProfile";

const SAFE_USER_SELECT = "-password_hash";

type LoginInput = {
  email: string;
  password: string;
};

type CompleteSetupInput = {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  department_id?: string;
  school_university?: string;
  required_hours?: number;
};

const issueToken = (userId: string) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT secret is not configured.");
  }

  return jwt.sign({ sub: userId, user_id: userId }, secret, {
    expiresIn: "1d",
  });
};

export const checkEmail = async (email: string) => {
  const normalized = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalized }).lean();

  if (!user) {
    return {
      exists: false,
      needsSetup: false,
    };
  }

  return {
    exists: true,
    needsSetup: !user.is_active,
  };
};

export const login = async (payload: LoginInput) => {
  const user = await User.findOne({
    email: payload.email.trim().toLowerCase(),
  });

  if (!user || !user.password_hash) {
    throw new Error("Invalid credentials.");
  }

  const isValidPassword = await bcrypt.compare(
    payload.password,
    user.password_hash,
  );
  if (!isValidPassword) {
    throw new Error("Invalid credentials.");
  }

  if (!user.is_active) {
    throw new Error("Account setup is incomplete.");
  }

  const token = issueToken(String(user._id));
  const safeUser = await User.findById(user._id)
    .select(SAFE_USER_SELECT)
    .lean();

  if (!safeUser) {
    throw new Error("User not found after login.");
  }

  return {
    token,
    user: safeUser,
  };
};

export const completeSetup = async (payload: CompleteSetupInput) => {
  const user = await User.findOne({
    email: payload.email.trim().toLowerCase(),
  });

  if (!user) {
    throw new Error("Email is not whitelisted.");
  }

  if (user.is_active) {
    throw new Error("Account is already active.");
  }

  const password_hash = await bcrypt.hash(payload.password, 10);

  user.first_name = payload.first_name;
  user.last_name = payload.last_name;
  user.password_hash = password_hash;
  user.global_role = user.global_role ?? "Standard_User";
  user.is_active = true;

  if (payload.department_id) {
    user.departments = [
      {
        department_id: new mongoose.Types.ObjectId(payload.department_id),
        department_role: "Intern",
      },
    ];
  }

  await user.save();

  if (payload.school_university && payload.required_hours) {
    const existingProfile = await InternProfile.findOne({ user_id: user._id });
    const expectedEndDate = new Date();
    expectedEndDate.setDate(expectedEndDate.getDate() + 90);

    if (!existingProfile) {
      await InternProfile.create({
        user_id: user._id,
        school_university: payload.school_university,
        required_hours: payload.required_hours,
        rendered_hours_total: 0,
        expected_end_date: expectedEndDate,
      });
    }
  }

  const token = issueToken(String(user._id));
  const safeUser = await User.findById(user._id)
    .select(SAFE_USER_SELECT)
    .lean();

  if (!safeUser) {
    throw new Error("User not found after setup.");
  }

  return {
    token,
    user: safeUser,
  };
};

export const logout = async () => {
  return {
    message: "Logged out successfully.",
  };
};
