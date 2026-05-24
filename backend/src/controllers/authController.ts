import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User.js";
import InternProfile from "../models/InternProfile.js";
import Department from "../models/Department.js";
import { logActivity } from "../services/activityService.js";

const JWT_SECRET =
  process.env.JWT_SECRET || "teamca-dev-secret-change-in-production";

if (
  process.env.NODE_ENV === "production" &&
  JWT_SECRET === "teamca-dev-secret-change-in-production"
) {
  throw new Error("JWT_SECRET must be set in production.");
}

export const checkEmail = async (req: Request, res: Response) => {
  try {
    const email = String(req.body?.email ?? "")
      .trim()
      .toLowerCase();
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });

    if (!user) return res.json({ exists: false, needsSetup: false });

    // Whitelisted user: inactive without password_hash needs setup
    const isWhitelisted = !user.is_active && !user.password_hash;
    if (isWhitelisted) return res.json({ exists: true, needsSetup: true });

    // Regular user: exists and active
    return res.json({ exists: true, needsSetup: false });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const email = String(req.body?.email ?? "")
      .trim()
      .toLowerCase();
    const password = String(req.body?.password ?? "");
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.is_active) {
      return res.status(403).json({
        message: "Account setup is incomplete. Please complete your setup.",
      });
    }

    if (!user.password_hash) {
      return res.status(403).json({
        message: "Account setup is incomplete. Please complete your setup.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ user_id: user._id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    const { ...userData } = user.toObject();

    // log successful login activity
    await logActivity({
      user_id: user._id.toString(),
      user_name: user.email,
      action_type: "login",
      resource_type: "auth",
      description: `Login successful for ${user.email}`,
      status: "success",
      changes: { email: user.email },
    }).catch(() => {}); // Ignore logging errors

    res.json({ token, user: userData });
  } catch {
    // log failed login
    const email = String(req.body?.email ?? "")
      .trim()
      .toLowerCase();
    if (email) {
      await logActivity({
        user_id: "anonymous",
        user_name: email,
        action_type: "login",
        resource_type: "auth",
        description: `Login failed for ${email}`,
        status: "failed",
        changes: { reason: "invalid credentials or server error" },
      }).catch(() => {}); // Ignore logging errors
    }
    res.status(500).json({ message: "Server error" });
  }
};

export const completeSetup = async (req: Request, res: Response) => {
  try {
    const email = String(req.body?.email ?? "")
      .trim()
      .toLowerCase();
    const first_name = String(req.body?.first_name ?? "").trim();
    const last_name = String(req.body?.last_name ?? "").trim();
    const password = String(req.body?.password ?? "");
    const department_id = String(req.body?.department_id ?? "").trim();
    const school_university = String(req.body?.school_university ?? "").trim();
    const required_hours = Number(req.body?.required_hours);

    if (
      !email ||
      !first_name ||
      !last_name ||
      !password ||
      !department_id ||
      !school_university
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!Number.isFinite(required_hours) || required_hours < 1) {
      return res
        .status(400)
        .json({ message: "Required hours must be at least 1" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Validate password strength (min 8 chars, uppercase, lowercase, number)
    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters long" });
    }
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({
        message: "Password must contain at least one uppercase letter",
      });
    }
    if (!/[a-z]/.test(password)) {
      return res.status(400).json({
        message: "Password must contain at least one lowercase letter",
      });
    }
    if (!/[0-9]/.test(password)) {
      return res
        .status(400)
        .json({ message: "Password must contain at least one number" });
    }

    // check if whitelisted
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Email is not whitelisted" });
    }
    if (user.is_active) {
      return res.status(403).json({ message: "Account is already active" });
    }
    if (user.password_hash) {
      return res
        .status(403)
        .json({ message: "Account setup is already complete" });
    }

    // Validate name length
    if (first_name.length < 2 || last_name.length < 2) {
      return res
        .status(400)
        .json({ message: "Names must be at least 2 characters" });
    }

    if (!mongoose.Types.ObjectId.isValid(department_id)) {
      return res.status(400).json({ message: "Invalid department" });
    }

    const department = await Department.findById(department_id).select("_id");
    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    const departmentRole = user.departments?.[0]?.department_role ?? "Intern";

    // update user with setup info
    const password_hash = await bcrypt.hash(password, 12);
    user.first_name = first_name;
    user.last_name = last_name;
    user.password_hash = password_hash;
    user.departments = [
      {
        department_id: new mongoose.Types.ObjectId(department_id),
        department_role: departmentRole,
      },
    ];
    user.is_active = true;
    await user.save();

    await InternProfile.findOneAndUpdate(
      { user_id: user._id },
      {
        $set: {
          school_university,
          required_hours,
        },
        $setOnInsert: {
          rendered_hours_total: 0,
          days_worked: 0,
          actual_end_date: null,
        },
      },
      {
        new: true,
        setDefaultsOnInsert: true,
        upsert: true,
      },
    );

    // log successful account setup
    await logActivity({
      user_id: user._id.toString(),
      user_name: email,
      action_type: "create",
      resource_type: "auth",
      description: `Account setup completed for ${email}`,
      status: "success",
      changes: {
        email,
        first_name,
        last_name,
        global_role: user.global_role,
        department_id,
        department_role: departmentRole,
        school_university,
        required_hours,
      },
    }).catch(() => {}); // ignore logging errors

    const token = jwt.sign({ user_id: user._id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    const userData = user.toObject();
    delete userData.password_hash;

    res.status(200).json({ token, user: userData });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};
