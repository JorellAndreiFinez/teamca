import type { Request, Response } from "express";
import {
  createInternProfile,
  getInternProfileByUserId,
  updateInternProfileByUserId,
} from "../services/internProfileService";
import { getUserById } from "../services/userService";
import User from "../models/User";
import {
  hasDepartmentRoleIn,
  hasSharedDepartment,
  isSameUser,
} from "../middlewares/rbac";
import { createNotificationsForRecipients } from "../services/notificationService";
import { emitUsersNotification } from "../socket/io";

const getUserIdParam = (req: Request): string => {
  const raw = req.params.userId;
  return Array.isArray(raw) ? raw[0] : raw;
};

const getPrimaryDepartmentId = (user: { departments?: Array<{ department_id?: unknown }> }): string | undefined => {
  const departmentId = user.departments?.[0]?.department_id;
  return departmentId ? String(departmentId) : undefined;
};

const getSupervisorAndHeadIdsByDepartmentId = async (departmentId?: string): Promise<string[]> => {
  if (!departmentId) {
    return [];
  }

  const users = await User.find({
    is_active: true,
    departments: {
      $elemMatch: {
        department_id: departmentId,
        department_role: { $in: ["Head", "Supervisor"] },
      },
    },
  })
    .select("_id")
    .lean();

  return [...new Set(users.map((user) => String(user._id)))];
};

export const getInternProfileByUser = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const targetUserId = getUserIdParam(req);
    const targetUser = await getUserById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found." });
    }

    const isSuperadmin = req.user.global_role === "Superadmin";
    const isAdmin = req.user.global_role === "Admin";
    const isSelf = isSameUser(req.user, targetUserId);
    const canManageTeam = hasDepartmentRoleIn(req.user, ["Head", "Supervisor"]);
    const sharesDepartment = hasSharedDepartment(
      req.user,
      getPrimaryDepartmentId(targetUser),
    );

    if (
      !isSuperadmin &&
      !isAdmin &&
      !isSelf &&
      !(canManageTeam && sharesDepartment)
    ) {
      return res
        .status(403)
        .json({
          message: "Insufficient permissions to view this intern profile.",
        });
    }

    const profile = await getInternProfileByUserId(targetUserId);
    if (!profile) {
      return res.status(404).json({ message: "Intern profile not found." });
    }

    return res.status(200).json(profile);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch intern profile." });
  }
};

export const createInternProfileHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const payload = req.body as {
      user_id?: string;
      school?: string;
      school_university?: string;
      required_hours?: number;
      rendered_hours_total?: number;
      expected_end_date?: string;
      actual_end_date?: string | null;
    };

    let actualEndDate: Date | null | undefined;
    if (payload.actual_end_date === null) {
      actualEndDate = null;
    } else if (typeof payload.actual_end_date === "string") {
      actualEndDate = new Date(payload.actual_end_date);
    }

    if (
      !payload.user_id ||
      !(payload.school || payload.school_university) ||
      !payload.required_hours ||
      !payload.expected_end_date
    ) {
      return res.status(400).json({
        message:
          "user_id, school, required_hours, and expected_end_date are required.",
      });
    }

    const targetUser = await getUserById(payload.user_id);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found." });
    }

    const isSuperadmin = req.user.global_role === "Superadmin";
    const isAdmin = req.user.global_role === "Admin";
    const isSelf = isSameUser(req.user, payload.user_id);
    const canManageTeam = hasDepartmentRoleIn(req.user, ["Head", "Supervisor"]);
    const sharesDepartment = hasSharedDepartment(
      req.user,
      getPrimaryDepartmentId(targetUser),
    );

    if (
      !isSuperadmin &&
      !isAdmin &&
      !isSelf &&
      !(canManageTeam && sharesDepartment)
    ) {
      return res
        .status(403)
        .json({
          message: "Insufficient permissions to create this intern profile.",
        });
    }

    const created = await createInternProfile({
      user_id: payload.user_id,
      school: payload.school ?? payload.school_university ?? "",
      required_hours: payload.required_hours,
      rendered_hours_total: payload.rendered_hours_total,
      expected_end_date: new Date(payload.expected_end_date),
      actual_end_date: actualEndDate,
    });

    return res.status(201).json(created);
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "User not found." ||
        error.message === "Intern profile already exists.")
    ) {
      return res.status(409).json({ message: error.message });
    }

    return res
      .status(500)
      .json({ message: "Failed to create intern profile." });
  }
};

export const updateInternProfileByUser = async (
  req: Request,
  res: Response,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const targetUserId = getUserIdParam(req);
    const targetUser = await getUserById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found." });
    }

    const isSuperadmin = req.user.global_role === "Superadmin";
    const isAdmin = req.user.global_role === "Admin";
    const isSelf = isSameUser(req.user, targetUserId);
    const canManageTeam = hasDepartmentRoleIn(req.user, ["Head", "Supervisor"]);
    const sharesDepartment = hasSharedDepartment(
      req.user,
      getPrimaryDepartmentId(targetUser),
    );

    if (
      !isSuperadmin &&
      !isAdmin &&
      !isSelf &&
      !(canManageTeam && sharesDepartment)
    ) {
      return res
        .status(403)
        .json({
          message: "Insufficient permissions to update this intern profile.",
        });
    }

    const payload = req.body as {
      school?: string;
      school_university?: string;
      required_hours?: number;
      rendered_hours_total?: number;
      expected_end_date?: string;
      actual_end_date?: string | null;
    };

    let actualEndDate: Date | null | undefined;
    if (payload.actual_end_date === null) {
      actualEndDate = null;
    } else if (typeof payload.actual_end_date === "string") {
      actualEndDate = new Date(payload.actual_end_date);
    }

    const updated = await updateInternProfileByUserId(targetUserId, {
      school: payload.school ?? payload.school_university,
      required_hours: payload.required_hours,
      rendered_hours_total: payload.rendered_hours_total,
      expected_end_date: payload.expected_end_date
        ? new Date(payload.expected_end_date)
        : undefined,
      actual_end_date: actualEndDate,
    });

    const recipientIds = await getSupervisorAndHeadIdsByDepartmentId(getPrimaryDepartmentId(targetUser));
    const notifications = await createNotificationsForRecipients(recipientIds, {
      actorId: String(req.user.user_id),
      eventType: "intern_profile_updated",
      title: "Intern profile updated",
      message: `${targetUser.first_name || "Intern"} ${targetUser.last_name || ""}`.trim() + " profile details were updated.",
      entityType: "user",
      entityId: targetUserId,
      metadata: {
        user_id: targetUserId,
      },
    });

    for (const notification of notifications) {
      emitUsersNotification([notification.recipient_id], notification);
    }

    return res.status(200).json(updated);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Intern profile not found."
    ) {
      return res.status(404).json({ message: error.message });
    }

    return res
      .status(500)
      .json({ message: "Failed to update intern profile." });
  }
};

export default {
  getInternProfileByUser,
  createInternProfileHandler,
  updateInternProfileByUser,
};
