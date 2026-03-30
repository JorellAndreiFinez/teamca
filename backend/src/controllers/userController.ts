// backend\src\controllers\userController.ts

// backend\src\controllers\userController.ts

import { Request, Response } from "express";
import User from "../models/User";
import {
  createUser as createUserService,
  updateUser as updateUserService,
  deleteWhitelistedUser as deleteUserService,
} from "../services/userService";
import { createNotificationsForRecipients } from "../services/notificationService";
import { emitUsersNotification } from "../socket/io";

const getUserIdParam = (req: Request): string => {
  const raw = req.params.userId;
  return Array.isArray(raw) ? raw[0] : raw;
};

const getActiveSuperadminIds = async (): Promise<string[]> => {
  const superadmins = await User.find({
    global_role: "Superadmin",
    is_active: true,
  })
    .select("_id")
    .lean();

  return [...new Set(superadmins.map((item) => String(item._id)))];
};

/**
 * Get all users
 */
export const getUsers = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const isGlobalManager = req.user.global_role === "Superadmin" || req.user.global_role === "Admin";
    const isDepartmentScoped = req.user.department_role === "Head"
      || req.user.department_role === "Supervisor"
      || req.user.department_role === "Intern";

    let users;
    if (isGlobalManager) {
      users = await User.find({}, "-password_hash");
    } else if (isDepartmentScoped && req.user.department_id) {
      users = await User.find({
        is_active: true,
        departments: {
          $elemMatch: {
            department_id: req.user.department_id,
          },
        },
      }, "-password_hash");
    } else {
      users = await User.find({ _id: req.user.user_id }, "-password_hash");
    }

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
    const previousUser = await User.findById(userId)
      .select("global_role is_active departments")
      .lean();

    if (!previousUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const updatedUser = await updateUserService(userId, payload);

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log(
      `[updateUser] User updated: ${updatedUser.first_name} ${updatedUser.last_name} (${updatedUser.email})`,
    );

    const recipientIds = await getActiveSuperadminIds();
    const actorId = req.user ? String(req.user.user_id) : undefined;
    const updatedFields = Object.keys(payload || {}).filter((key) => payload?.[key] !== undefined);
    const updatedEntityId = String(updatedUser._id || userId);

    const notifications = await createNotificationsForRecipients(recipientIds, {
      actorId,
      eventType: "user_profile_updated",
      title: "User profile updated",
      message: `${updatedUser.first_name || "User"} ${updatedUser.last_name || ""}`.trim() + " updated their profile information.",
      entityType: "user",
      entityId: updatedEntityId,
      metadata: {
        user_id: updatedEntityId,
        updated_fields: updatedFields,
      },
    });

    for (const notification of notifications) {
      emitUsersNotification([notification.recipient_id], notification);
    }

    const previousDepartmentRole = previousUser.departments?.[0]?.department_role;
    const updatedDepartmentRole = updatedUser.departments?.[0]?.department_role;
    const roleChanged = previousUser.global_role !== updatedUser.global_role
      || previousDepartmentRole !== updatedDepartmentRole;

    if (roleChanged) {
      const roleRecipientIds = [...new Set([...recipientIds, updatedEntityId])];
      const roleNotifications = await createNotificationsForRecipients(roleRecipientIds, {
        actorId,
        eventType: "user_role_changed",
        title: "User role updated",
        message: `${updatedUser.first_name || "User"} ${updatedUser.last_name || ""}`.trim() + " role assignment was updated.",
        entityType: "user",
        entityId: updatedEntityId,
        metadata: {
          user_id: updatedEntityId,
          previous_global_role: previousUser.global_role,
          new_global_role: updatedUser.global_role,
          previous_department_role: previousDepartmentRole,
          new_department_role: updatedDepartmentRole,
        },
      });

      for (const notification of roleNotifications) {
        emitUsersNotification([notification.recipient_id], notification);
      }
    }

    if (previousUser.is_active !== updatedUser.is_active) {
      const activationRecipientIds = [...new Set([...recipientIds, updatedEntityId])];
      const activationNotifications = await createNotificationsForRecipients(activationRecipientIds, {
        actorId,
        eventType: "user_activation_changed",
        title: "User activation status changed",
        message: `${updatedUser.first_name || "User"} ${updatedUser.last_name || ""}`.trim() + ` was ${updatedUser.is_active ? "activated" : "deactivated"}.`,
        entityType: "user",
        entityId: updatedEntityId,
        metadata: {
          user_id: updatedEntityId,
          previous_is_active: previousUser.is_active,
          new_is_active: updatedUser.is_active,
        },
      });

      for (const notification of activationNotifications) {
        emitUsersNotification([notification.recipient_id], notification);
      }
    }

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
    const userToDelete = await User.findById(userId)
      .select("first_name last_name email")
      .lean();

    if (!userToDelete) {
      return res.status(404).json({ message: "User not found." });
    }

    const result = await deleteUserService(userId);

    const recipientIds = await getActiveSuperadminIds();
    const actorId = req.user ? String(req.user.user_id) : undefined;

    const notifications = await createNotificationsForRecipients(recipientIds, {
      actorId,
      eventType: "user_deleted",
      title: "User deleted",
      message: `${userToDelete.first_name || "User"} ${userToDelete.last_name || ""}`.trim() + " was deleted by an admin.",
      entityType: "user",
      entityId: userId,
      metadata: {
        user_id: userId,
        email: userToDelete.email,
      },
    });

    for (const notification of notifications) {
      emitUsersNotification([notification.recipient_id], notification);
    }

    res.json(result);
  } catch (err: any) {
    console.error("[deleteUser] error:", err);
    res.status(400).json({ message: err.message || "Failed to delete user" });
  }
};
