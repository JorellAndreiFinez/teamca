import { Request, Response } from "express";
import User from "../models/User";

/**
 * Get all users
 */
export const getUsers = async (_req: Request, res: Response) => {
  try {
    const users = await User.find({}, "-password_hash");
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.userId, "-password_hash");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Update user details
 */
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { first_name, last_name } = req.body;
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (first_name) user.first_name = first_name;
    if (last_name) user.last_name = last_name;

    await user.save();
    const { password_hash, ...userData } = user.toObject();
    res.json(userData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
