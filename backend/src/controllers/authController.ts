import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";

const JWT_SECRET =
  process.env.JWT_SECRET || "teamca-dev-secret-change-in-production";

/**
 * Check if an email exists and if it needs setup
 */
export const checkEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const normalized = email.toLowerCase();
    const user = await User.findOne({ email: normalized });

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
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res
        .status(400)
        .json({ message: "Email and password are required" });

    const user = await User.findOne({ email: email.toLowerCase() });
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
    const { email, first_name, last_name, password } = req.body;
    if (!email || !first_name || !last_name || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser)
      return res
        .status(409)
        .json({ message: "Account already exists for this email" });

    const password_hash = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      email: email.toLowerCase(),
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
