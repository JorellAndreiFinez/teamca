// backend\src\controllers\userController.ts

import { Request, Response } from "express";
import User from "../models/User";
import {
  createUser as createUserService,
  updateUser as updateUserService,
  deleteWhitelistedUser as deleteUserService,
} from "../services/userService";

const getUserIdParam = (req: Request): string => {
  const raw = req.params.userId;
  return Array.isArray(raw) ? raw[0] : raw;
};

/**
 * Get all users
 */
export const getUsers = async (_req: Request, res: Response) => {
  try {
    const users = await User.find({}, "-password_hash");
    console.log("[getUsers] users fetched:", users);
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
    const user = await User.findById(getUserIdParam(req), "-password_hash");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Create a new user
 */
export const createUser = async (req: Request, res: Response) => {
  try {
    const {
      first_name,
      last_name,
      email,
      password_hash,
      global_role,
      department_id,
      department_role,
      is_active,
    } = req.body;

    const departments =
      department_id && department_role
        ? [{ department_id, department_role }]
        : undefined;

    if (!first_name || !last_name || !email || !password_hash || !global_role) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newUser = await createUserService({
      first_name,
      last_name,
      email,
      password_hash,
      global_role,
      departments,
      is_active,
    });

    if (newUser) {
      console.log(
        `[createUser] User created: ${newUser.first_name} ${newUser.last_name} (${newUser.email})`,
      );
    }

    res.status(201).json(newUser);
  } catch (err: any) {
    console.error("[createUser] error:", err);
    res.status(400).json({ message: err.message || "Failed to create user" });
  }
};

/**
 * Update user details (PUT /users/:userId)
 */
export const updateUser = async (req: Request, res: Response) => {
  try {
    const userId = getUserIdParam(req);
    const payload = req.body;

    const updatedUser = await updateUserService(userId, payload);

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log(
      `[updateUser] User updated: ${updatedUser.first_name} ${updatedUser.last_name} (${updatedUser.email})`,
    );

    res.json(updatedUser);
  } catch (err: any) {
    console.error("[updateUser] error:", err);
    res.status(400).json({ message: err.message || "Failed to update user" });
  }
};

export const getWhitelistedUsers = async (req: Request, res: Response) => {
  try {
    // Authenticated user
    const currentUser = req.user; // assume authMiddleware adds req.user

    if (!currentUser || currentUser.global_role !== "Superadmin") {
      return res
        .status(403)
        .json({ message: "Forbidden: Only Superadmins can access this." });
    }

    // Get users who are active
    const whitelistedUsers = await User.find({ is_active: true }) // <-- change false to true
      .select("-password_hash")
      .lean();

    res.json(whitelistedUsers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Delete a user
 */
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const userId = getUserIdParam(req);

    const result = await deleteUserService(userId);

    res.json(result);
  } catch (err: any) {
    console.error("[deleteUser] error:", err);
    res.status(400).json({ message: err.message || "Failed to delete user" });
  }
};
