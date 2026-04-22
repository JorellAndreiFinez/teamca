import { Request, Response } from "express";
import User from "../models/User";
import {
  createUser as createUserService,
  updateUser as updateUserService,
  deleteWhitelistedUser as deleteUserService,
  createWhitelistedUser,
  activateWhitelistedUser,
} from "../services/userService";
import { createNotificationsForRecipients } from "../services/notificationService";
import { emitUsersDirectoryUpdated, emitUsersNotification } from "../socket/io";

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
    let userId = req.params.userId;

    // Handle "me" to return the authenticated user's data
    if (userId === "me") {
      userId = (req as any).user?._id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
    }

    const user = await User.findById(userId, "-password_hash");
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

      required_hours,
      working_hours,
      working_days,
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
      is_active,

      required_hours,
      working_hours,
      working_days,

      departments: department_id ? [{ department_id, department_role }] : [],
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

export const createWhitelistedUserHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const email = String(req.body?.email ?? "")
      .trim()
      .toLowerCase();

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const newUser = await createWhitelistedUser({ email });

    // Audit log: whitelist operation
    console.log(
      `[createWhitelistedUser] Email whitelisted: ${email} by user ${req.user?.user_id}`,
    );
    res.status(201).json(newUser);
  } catch (err: any) {
    console.error("[createWhitelistedUser] error:", err);
    res
      .status(400)
      .json({ message: err.message || "Failed to whitelist email" });
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
    const password_hash = String(req.body?.password_hash ?? "");
    const global_role = req.body?.global_role || "Standard_User";
    const department_id = req.body?.department_id;
    const department_role = req.body?.department_role || "Intern";

    if (!first_name || !last_name || !password_hash) {
      return res
        .status(400)
        .json({ message: "First name, last name, and password are required" });
    }

    // Validate name length
    if (first_name.length < 2 || last_name.length < 2) {
      return res
        .status(400)
        .json({ message: "Names must be at least 2 characters" });
    }

    // Validate password hash format (should be bcrypt hash)
    if (!password_hash.startsWith("$2")) {
      return res.status(400).json({ message: "Invalid password format" });
    }

    const user = await activateWhitelistedUser(userId, {
      first_name,
      last_name,
      password_hash,
      global_role: global_role as "Superadmin" | "Admin" | "Standard_User",
      department_id,
      department_role: department_role as "Head" | "Supervisor" | "Intern",
    });

    // Audit log: activation operation
    console.log(
      `[activateWhitelistedUser] User activated: ${first_name} ${last_name} (${userId}) by ${req.user?.user_id}`,
    );
    res.json(user);
  } catch (err: any) {
    console.error("[activateWhitelistedUser] error:", err);
    res
      .status(400)
      .json({ message: err.message || "Failed to activate whitelisted user" });
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
        (field) => payload[field] !== undefined,
      );
      if (includesRestrictedField) {
        return res
          .status(403)
          .json({ message: "You can only edit your basic profile fields." });
      }
    } else if (actorIsHead) {
      if (!sharesAtLeastOneDepartment(actor, previousUser)) {
        return res
          .status(403)
          .json({
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
        (field) => payload[field] !== undefined,
      );
      if (includesRestrictedField) {
        return res
          .status(403)
          .json({ message: "Heads can only edit basic profile fields." });
      }
    }

    if (!isSuperadmin(actor)) {
      if (previousUser.global_role === "Superadmin") {
        return res
          .status(403)
          .json({
            message: "Only Superadmins can modify Superadmin accounts.",
          });
      }

      if (payload.global_role === "Superadmin") {
        return res
          .status(403)
          .json({
            message: "Only Superadmins can assign the Superadmin role.",
          });
      }
    }

    const sanitizedPayload = actorIsSelf
      ? {
          first_name: payload.first_name,
          last_name: payload.last_name,
          email: payload.email,
        }
      : actorIsHead
        ? {
            first_name: payload.first_name,
            last_name: payload.last_name,
          }
        : payload;

    const hasAnyFieldToUpdate = Object.values(sanitizedPayload).some(
      (value) => value !== undefined,
    );
    if (!hasAnyFieldToUpdate) {
      return res.status(400).json({ message: "No editable fields provided." });
    }

    const updatedUser = await updateUserService(userId, sanitizedPayload);

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log(
      `[updateUser] User updated: ${updatedUser.first_name} ${updatedUser.last_name} (${updatedUser.email})`,
    );

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
          `${updatedUser.first_name || "User"} ${updatedUser.last_name || ""}`.trim() +
          " updated their profile information.",
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
            `${updatedUser.first_name || "User"} ${updatedUser.last_name || ""}`.trim() +
            " role assignment was updated.",
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
            `${updatedUser.first_name || "User"} ${updatedUser.last_name || ""}`.trim() +
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
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const userId = getUserIdParam(req);
    const userToDelete = await User.findById(userId)
      .select("first_name last_name email global_role")
      .lean();

    if (!userToDelete) {
      return res.status(404).json({ message: "User not found." });
    }

    const actor = req.user;
    const actorCanDelete = isSuperadmin(actor) || isSupervisorAdmin(actor);
    if (!actorCanDelete) {
      return res
        .status(403)
        .json({
          message: "Only Supervisor(Admin) or Superadmin can delete users.",
        });
    }

    if (!isSuperadmin(actor)) {
      if (userToDelete.global_role !== "Standard_User") {
        return res
          .status(403)
          .json({ message: "Supervisors can only delete Standard Users." });
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
        `${userToDelete.first_name || "User"} ${userToDelete.last_name || ""}`.trim() +
        " was deleted by an admin.",
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

    res.json(result);
  } catch (err: any) {
    console.error("[deleteUser] error:", err);
    res.status(400).json({ message: err.message || "Failed to delete user" });
  }
};
