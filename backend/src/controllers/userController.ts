import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import {
  createUser as createUserService,
  updateUser as updateUserService,
  deleteUser as deleteUserService,
  deleteWhitelistedUser,
  createWhitelistedUser,
  activateWhitelistedUser,
  getUserById as getUserByIdService,
} from "../services/userService.js";
import { createNotificationsForRecipients } from "../services/notificationService.js";
import {
  emitUsersDirectoryUpdated,
  emitUsersNotification,
} from "../socket/io.js";

type AuthUser = NonNullable<Request["user"]>;

const isSuperadmin = (user: AuthUser): boolean =>
  user.global_role === "Superadmin";

const isSupervisorAdmin = (user: AuthUser): boolean =>
  user.global_role === "Admin" && user.department_role === "Supervisor";

const isHeadAdmin = (user: AuthUser): boolean =>
  user.global_role === "Admin" && user.department_role === "Head";

const canViewAllUsers = (user: AuthUser): boolean =>
  isSuperadmin(user) || isSupervisorAdmin(user);

const getDepartmentIds = (userLike: {
  departments?: Array<{ department_id?: unknown }>;
}): string[] => {
  return [
    ...new Set(
      (userLike.departments ?? [])
        .map((department) => department.department_id)
        .filter((departmentId): departmentId is unknown => !!departmentId)
        .map((departmentId) => String(departmentId)),
    ),
  ];
};

const sharesAtLeastOneDepartment = (
  actor: AuthUser,
  targetUser: { departments?: Array<{ department_id?: unknown }> },
): boolean => {
  const actorDepartmentIds = getDepartmentIds({
    departments: actor.department_id
      ? [{ department_id: actor.department_id }]
      : [],
  });
  const targetDepartmentIds = getDepartmentIds(targetUser);

  if (actorDepartmentIds.length === 0 || targetDepartmentIds.length === 0) {
    return false;
  }

  return targetDepartmentIds.some((departmentId) =>
    actorDepartmentIds.includes(departmentId),
  );
};

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

const getActiveUserDirectorySubscriberIds = async (): Promise<string[]> => {
  const managers = await User.find({
    is_active: true,
    $or: [
      { global_role: "Superadmin" },
      {
        global_role: "Admin",
        "departments.department_role": { $in: ["Head", "Supervisor"] },
      },
    ],
  })
    .select("_id")
    .lean();

  return [...new Set(managers.map((item) => String(item._id)))];
};

/**
 * Get all users
 */
export const getUsers = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const isGlobalManager = canViewAllUsers(req.user);
    const isDepartmentScoped = isHeadAdmin(req.user);

    if (!isGlobalManager && !isDepartmentScoped) {
      return res
        .status(403)
        .json({ message: "Insufficient role permissions." });
    }

    let users;
    if (isGlobalManager) {
      users = await User.find({}, "-password_hash");
    } else if (isDepartmentScoped && req.user.department_id) {
      users = await User.find(
        {
          is_active: true,
          departments: {
            $elemMatch: {
              department_id: req.user.department_id,
            },
          },
        },
        "-password_hash",
      );
    } else {
      return res
        .status(403)
        .json({ message: "Insufficient role permissions." });
    }

    res.json(users);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (req: Request, res: Response) => {
  try {
    let userId: string = String(req.params.userId);

    if (userId === "me") {
      const authUser = req.user;
      if (!authUser?.user_id) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      userId = String(authUser.user_id);
    }

    const user = await getUserByIdService(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch {
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
      working_hours,
      working_days,
    } = req.body;

    if (!first_name || !last_name || !email || !password_hash || !global_role) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newUser = await createUserService({
      first_name,
      last_name,
      email,
      password_hash,
      global_role,
      is_active,
      working_hours,
      working_days,

      departments: department_id ? [{ department_id, department_role }] : [],
    });

    res.status(201).json(newUser);
  } catch (err: unknown) {
    const error = err as Error;

    res.status(400).json({ message: error.message || "Failed to create user" });
  }
};

export const createWhitelistedUserHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const email = String(req.body?.email ?? "")
      .trim()
      .toLowerCase();
    const department_id = req.body?.department_id
      ? String(req.body.department_id)
      : undefined;
    const global_role = req.body?.global_role || "Standard_User";
    const department_role = req.body?.department_role || "Intern";

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const newUser = await createWhitelistedUser({
      email,
      global_role: global_role as "Superadmin" | "Admin" | "Standard_User",
      department_id,
      department_role: department_role as "Head" | "Supervisor" | "Intern",
    });

    res.status(201).json(newUser);
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Failed to whitelist email";

    res.status(400).json({ message: errorMessage });
  }
};

export const activateWhitelistedUserHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = getUserIdParam(req);

    const first_name = String(req.body?.first_name ?? "").trim();
    const last_name = String(req.body?.last_name ?? "").trim();
    const password = String(req.body?.password ?? "");
    const suppliedPasswordHash = String(req.body?.password_hash ?? "");

    const global_role = req.body?.global_role || "Standard_User";
    const department_id = req.body?.department_id
      ? String(req.body.department_id)
      : undefined;

    const department_role = req.body?.department_role || "Intern";

    if (!first_name || !last_name || (!password && !suppliedPasswordHash)) {
      return res.status(400).json({
        message: "First name, last name, and password are required",
      });
    }

    // Validate name length
    if (first_name.length < 2 || last_name.length < 2) {
      return res.status(400).json({
        message: "Names must be at least 2 characters",
      });
    }

    if (password && password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long",
      });
    }

    // Validate password hash format if a pre-hashed password is supplied.
    if (suppliedPasswordHash && !suppliedPasswordHash.startsWith("$2")) {
      return res.status(400).json({
        message: "Invalid password format",
      });
    }

    const password_hash =
      suppliedPasswordHash || (await bcrypt.hash(password, 12));

    const user = await activateWhitelistedUser(userId, {
      first_name,
      last_name,
      password_hash,
      global_role: global_role as "Superadmin" | "Admin" | "Standard_User",
      department_id,
      department_role: department_role as "Head" | "Supervisor" | "Intern",
    });

    return res.json(user);
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));

    return res.status(400).json({
      message: error.message || "Failed to activate whitelisted user",
    });
  }
};

export const deleteWhitelistedUserHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    if (!req.user || req.user.global_role !== "Superadmin") {
      return res
        .status(403)
        .json({ message: "Forbidden: Only Superadmins can access this." });
    }

    const userId = getUserIdParam(req);
    const result = await deleteWhitelistedUser(userId);

    const directorySubscribers = await getActiveUserDirectorySubscriberIds();
    emitUsersDirectoryUpdated(directorySubscribers, {
      event_type: "user_deleted",
      user_id: userId,
      actor_id: String(req.user.user_id),
      updated_at: new Date().toISOString(),
    });

    return res.json(result);
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));

    return res.status(400).json({
      message: error.message || "Failed to cancel whitelisted user",
    });
  }
};

/**
 * Update user details (PUT /users/:userId)
 */
export const updateUser = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const userId = getUserIdParam(req);
    const payload = req.body || {};

    const previousUser = await User.findById(userId)
      .select("global_role is_active departments")
      .lean();

    if (!previousUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const actor = req.user;
    const actorCanManageFully = canViewAllUsers(actor);
    const actorIsHead = isHeadAdmin(actor);
    const actorIsSelf = String(actor.user_id) === String(previousUser._id);

    if (!actorCanManageFully && !actorIsHead && !actorIsSelf) {
      return res
        .status(403)
        .json({ message: "Insufficient role permissions." });
    }

    if (actorIsSelf) {
      const disallowedSelfFields = [
        "global_role",
        "departments",
        "is_active",
        "password_hash",
      ];

      const includesRestrictedField = disallowedSelfFields.some(
        (field) => payload?.[field] !== undefined,
      );

      if (includesRestrictedField) {
        return res.status(403).json({
          message: "You can only edit your basic profile fields.",
        });
      }
    } else if (actorIsHead) {
      if (!sharesAtLeastOneDepartment(actor, previousUser)) {
        return res.status(403).json({
          message: "Heads can only edit users within their department.",
        });
      }

      const disallowedHeadFields = [
        "global_role",
        "departments",
        "is_active",
        "password_hash",
      ];

      const includesRestrictedField = disallowedHeadFields.some(
        (field) => payload?.[field] !== undefined,
      );

      if (includesRestrictedField) {
        return res.status(403).json({
          message: "Heads can only edit basic profile fields.",
        });
      }
    }

    if (!isSuperadmin(actor)) {
      if (previousUser.global_role === "Superadmin") {
        return res.status(403).json({
          message: "Only Superadmins can modify Superadmin accounts.",
        });
      }

      if (payload?.global_role === "Superadmin") {
        return res.status(403).json({
          message: "Only Superadmins can assign the Superadmin role.",
        });
      }
    }

    const sanitizedPayload = actorIsSelf
      ? {
          first_name: payload?.first_name,
          last_name: payload?.last_name,
          email: payload?.email,
        }
      : actorIsHead
        ? {
            first_name: payload?.first_name,
            last_name: payload?.last_name,
          }
        : payload;

    const hasAnyFieldToUpdate = Object.values(sanitizedPayload ?? {}).some(
      (value) => value !== undefined,
    );

    if (!hasAnyFieldToUpdate) {
      return res.status(400).json({
        message: "No editable fields provided.",
      });
    }

    const updatedUser = await updateUserService(userId, sanitizedPayload);

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const [recipientIds, directorySubscribers] = await Promise.all([
      getActiveSuperadminIds(),
      getActiveUserDirectorySubscriberIds(),
    ]);

    const actorId = req.user ? String(req.user.user_id) : undefined;

    const updatedFields = Object.keys(payload || {}).filter(
      (key) => payload?.[key] !== undefined,
    );

    const updatedEntityId = String(updatedUser._id || userId);

    const profileNotificationRecipients = [
      ...new Set([...recipientIds, updatedEntityId]),
    ];

    const notifications = await createNotificationsForRecipients(
      profileNotificationRecipients,
      {
        actorId,
        eventType: "user_profile_updated",
        title: "User profile updated",
        message:
          `${updatedUser.first_name || "User"} ${
            updatedUser.last_name || ""
          }`.trim() + " updated their profile information.",
        entityType: "user",
        entityId: updatedEntityId,
        metadata: {
          user_id: updatedEntityId,
          updated_fields: updatedFields,
        },
      },
    );

    for (const notification of notifications) {
      emitUsersNotification([notification.recipient_id], notification);
    }

    const previousDepartmentRole =
      previousUser.departments?.[0]?.department_role;

    const updatedDepartmentRole = updatedUser.departments?.[0]?.department_role;

    const roleChanged =
      previousUser.global_role !== updatedUser.global_role ||
      previousDepartmentRole !== updatedDepartmentRole;

    if (roleChanged) {
      const roleRecipientIds = [...new Set([...recipientIds, updatedEntityId])];

      const roleNotifications = await createNotificationsForRecipients(
        roleRecipientIds,
        {
          actorId,
          eventType: "user_role_changed",
          title: "User role updated",
          message:
            `${updatedUser.first_name || "User"} ${
              updatedUser.last_name || ""
            }`.trim() + " role assignment was updated.",
          entityType: "user",
          entityId: updatedEntityId,
          metadata: {
            user_id: updatedEntityId,
            previous_global_role: previousUser.global_role,
            new_global_role: updatedUser.global_role,
            previous_department_role: previousDepartmentRole,
            new_department_role: updatedDepartmentRole,
          },
        },
      );

      for (const notification of roleNotifications) {
        emitUsersNotification([notification.recipient_id], notification);
      }
    }

    if (previousUser.is_active !== updatedUser.is_active) {
      const activationRecipientIds = [
        ...new Set([...recipientIds, updatedEntityId]),
      ];

      const activationNotifications = await createNotificationsForRecipients(
        activationRecipientIds,
        {
          actorId,
          eventType: "user_activation_changed",
          title: "User activation status changed",
          message:
            `${updatedUser.first_name || "User"} ${
              updatedUser.last_name || ""
            }`.trim() +
            ` was ${updatedUser.is_active ? "activated" : "deactivated"}.`,
          entityType: "user",
          entityId: updatedEntityId,
          metadata: {
            user_id: updatedEntityId,
            previous_is_active: previousUser.is_active,
            new_is_active: updatedUser.is_active,
          },
        },
      );

      for (const notification of activationNotifications) {
        emitUsersNotification([notification.recipient_id], notification);
      }
    }

    emitUsersDirectoryUpdated(directorySubscribers, {
      event_type: "user_updated",
      user_id: updatedEntityId,
      updated_fields: updatedFields,
      actor_id: actorId,
      updated_at: new Date().toISOString(),
    });

    return res.json(updatedUser);
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));

    return res.status(400).json({
      message: error.message || "Failed to update user",
    });
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

    const whitelistedUsers = await User.find({
      is_active: false,
      $or: [
        { password_hash: { $exists: false } },
        { password_hash: null },
        { password_hash: "" },
      ],
    })
      .select("-password_hash")
      .sort({ createdAt: -1 })
      .lean();

    res.json(whitelistedUsers);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Delete a user
 */
export const deleteUser = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const userId = getUserIdParam(req);

    const userToDelete = await User.findById(userId)
      .select("first_name last_name email global_role")
      .lean();

    if (!userToDelete) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    const actor = req.user;

    const actorCanDelete = isSuperadmin(actor) || isSupervisorAdmin(actor);

    if (!actorCanDelete) {
      return res.status(403).json({
        message: "Only Supervisor(Admin) or Superadmin can delete users.",
      });
    }

    if (!isSuperadmin(actor)) {
      if (userToDelete.global_role !== "Standard_User") {
        return res.status(403).json({
          message: "Supervisors can only delete Standard Users.",
        });
      }
    }

    const result = await deleteUserService(userId);

    const [recipientIds, directorySubscribers] = await Promise.all([
      getActiveSuperadminIds(),
      getActiveUserDirectorySubscriberIds(),
    ]);

    const actorId = req.user ? String(req.user.user_id) : undefined;

    const notifications = await createNotificationsForRecipients(recipientIds, {
      actorId,
      eventType: "user_deleted",
      title: "User deleted",
      message:
        `${userToDelete.first_name || "User"} ${
          userToDelete.last_name || ""
        }`.trim() + " was deleted by an admin.",
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

    emitUsersDirectoryUpdated(directorySubscribers, {
      event_type: "user_deleted",
      user_id: userId,
      actor_id: actorId,
      updated_at: new Date().toISOString(),
    });

    return res.json(result);
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));

    return res.status(400).json({
      message: error.message || "Failed to delete user",
    });
  }
};
