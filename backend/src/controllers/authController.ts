// backend\src\controllers\authController.ts
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";

const JWT_SECRET =
  process.env.JWT_SECRET || "teamca-dev-secret-change-in-production";

if (
  process.env.NODE_ENV === "production" &&
  JWT_SECRET === "teamca-dev-secret-change-in-production"
) {
  throw new Error("JWT_SECRET must be set in production.");
}

/**
 * Check if an email exists and if it needs setup
 */
export const checkEmail = async (req: Request, res: Response) => {
  try {
    const email = String(req.body?.email ?? "")
      .trim()
      .toLowerCase();
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });

    if (user) return res.json({ exists: true, needsSetup: false });

    // If user not found, assume it needs setup (or check whitelist logic here)
    return res.json({ exists: false, needsSetup: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Login user
 */
// backend/controllers/authController.ts
export const login = async (req: Request, res: Response) => {
  console.log("\n[LOGIN ATTEMPT FROM FRONTEND]");
  console.log("➡️ Email:", req.body.email);
  console.log("⏱ Timestamp:", new Date().toISOString());

  try {
    const email = String(req.body?.email ?? "")
      .trim()
      .toLowerCase();
    const password = String(req.body?.password ?? "");
    if (!email || !password)
      return res
        .status(400)
        .json({ message: "Email and password are required" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ message: "Invalid email or password" });

    if (!user.is_active)
      return res
        .status(403)
        .json({ message: "Account is inactive. Contact your administrator." });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid email or password" });

    const token = jwt.sign({ user_id: user._id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    const { password_hash, ...userData } = user.toObject();

    console.log("✅ Login successful");
    console.log("👤 User ID:", user._id.toString());
    console.log("🎭 Role:", user.global_role);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    res.json({ token, user: userData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Complete setup for a new user
 */
export const completeSetup = async (req: Request, res: Response) => {
  try {
    const email = String(req.body?.email ?? "")
      .trim()
      .toLowerCase();
    const first_name = String(req.body?.first_name ?? "").trim();
    const last_name = String(req.body?.last_name ?? "").trim();
    const password = String(req.body?.password ?? "");

    if (!email || !first_name || !last_name || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters long" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res
        .status(409)
        .json({ message: "Account already exists for this email" });

    const password_hash = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      email,
      first_name,
      last_name,
      password_hash,
      global_role: "Standard_User",
      is_active: true,
    });

    const token = jwt.sign({ user_id: newUser._id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    const { password_hash: ph, ...userData } = newUser.toObject();
    res.status(201).json({ token, user: userData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
