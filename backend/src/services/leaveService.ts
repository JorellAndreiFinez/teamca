// backend/src/services/leaveService.ts

import mongoose, { Types } from "mongoose";
import Leave, {
  type ILeave,
  type LeaveStatus,
  type LeaveType,
} from "../models/Leave";
import User from "../models/User";
import {
  createNotification,
  createNotificationsForRecipients,
} from "./notificationService";

// ─── helpers ──────────────────────────────────────────────────────────────────

const toObjectId = (id: string) => new Types.ObjectId(id);

/**
 * Compute working days between two dates (Mon–Fri, PH timezone).
 * Weekends are skipped; you can extend this to skip PH holidays if needed.
 */
const computeWorkingDays = (start: Date, end: Date): number => {
  let count = 0;
  const cur = new Date(start);
  cur.setHours(0, 0, 0, 0);
  const last = new Date(end);
  last.setHours(0, 0, 0, 0);

  while (cur <= last) {
    const day = cur.getDay(); // 0 = Sun, 6 = Sat
    if (day !== 0 && day !== 6) {
      count++;
    }
    cur.setDate(cur.getDate() + 1);
  }

  return Math.max(1, count);
};

/** Resolve a user's full name from the DB — used for review history labels. */
const resolveActorName = async (userId: string): Promise<string> => {
  const user = await User.findById(userId)
    .select("first_name last_name email")
    .lean();
  if (!user) return "Unknown";
  const full = `${user.first_name} ${user.last_name}`.trim();
  return full || user.email;
};

/**
 * Find all Admin users + department Heads for a given departmentId.
 * Used to notify the right reviewers when a leave is submitted/cancelled.
 */
const findReviewerIds = async (departmentId?: string): Promise<string[]> => {
  const adminQuery: any = {
    global_role: { $in: ["Admin", "Superadmin"] },
    is_active: true,
  };
  const admins = await User.find(adminQuery).select("_id").lean();
  const adminIds = admins.map((a) => String(a._id));

  if (!departmentId) return adminIds;

  const headQuery: any = {
    is_active: true,
    departments: {
      $elemMatch: {
        department_id: toObjectId(departmentId),
        department_role: "Head",
      },
    },
  };
  const heads = await User.find(headQuery).select("_id").lean();
  const headIds = heads.map((h) => String(h._id));

  // deduplicate
  return [...new Set([...adminIds, ...headIds])];
};

// ─── types ────────────────────────────────────────────────────────────────────

export type CreateLeaveInput = {
  userId: string;
  leaveType?: LeaveType;
  startDate: string; // ISO string
  endDate: string; // ISO string
  reason: string;
};

export type ReviewLeaveInput = {
  leaveId: string;
  actorId: string;
  rejectionReason?: string; // required when rejecting
};

// ─── normalizer ───────────────────────────────────────────────────────────────

const normalize = (leave: ILeave) => ({
  _id: String(leave._id),
  userId: String(leave.userId),
  departmentId: leave.departmentId ? String(leave.departmentId) : undefined,
  leaveType: leave.leaveType,
  startDate: leave.startDate,
  endDate: leave.endDate,
  duration: leave.duration,
  reason: leave.reason,
  status: leave.status,
  reviewedBy: leave.reviewedBy ? String(leave.reviewedBy) : undefined,
  reviewedAt: leave.reviewedAt,
  rejectionReason: leave.rejectionReason,
  reviewHistory: leave.reviewHistory,
  createdAt: leave.createdAt,
  updatedAt: leave.updatedAt,
});

// ─── service methods ──────────────────────────────────────────────────────────

/**
 * Create a leave request.
 * Notifies all admins + department head(s) that a leave was filed.
 */
export const createLeave = async (input: CreateLeaveInput) => {
  const user = await User.findById(input.userId)
    .select("first_name last_name email departments")
    .lean();
  if (!user) throw new Error("User not found.");

  const start = new Date(input.startDate);
  const end = new Date(input.endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error("Invalid date format.");
  }
  if (start > end) {
    throw new Error("startDate must be before or equal to endDate.");
  }

  const duration = computeWorkingDays(start, end);
  const departmentId = user.departments?.[0]?.department_id;

  // Prevent duplicate pending/approved leaves that overlap
  const overlap = await Leave.findOne({
    userId: toObjectId(input.userId),
    status: { $in: ["pending", "approved"] },
    startDate: { $lte: end },
    endDate: { $gte: start },
  });
  if (overlap) {
    throw new Error(
      `You already have a ${overlap.status} leave that overlaps with the requested dates.`,
    );
  }

  const leave = await Leave.create({
    userId: toObjectId(input.userId),
    departmentId: departmentId ? toObjectId(String(departmentId)) : undefined,
    leaveType: input.leaveType ?? "other",
    startDate: start,
    endDate: end,
    duration,
    reason: input.reason.trim(),
    status: "pending",
    reviewHistory: [],
  });

  // ── notify reviewers ─────────────────────────────────────────────────────
  const reviewerIds = await findReviewerIds(
    departmentId ? String(departmentId) : undefined,
  );
  const applicantName =
    `${user.first_name} ${user.last_name}`.trim() || user.email;

  if (reviewerIds.length > 0) {
    await createNotificationsForRecipients(reviewerIds, {
      actorId: input.userId,
      eventType: "leave_submitted",
      title: "New Leave Request",
      message: `${applicantName} filed a ${leave.leaveType} leave from ${start.toDateString()} to ${end.toDateString()} (${duration} day${duration !== 1 ? "s" : ""}).`,
      entityType: "leave",
      entityId: String(leave._id),
      metadata: { leaveId: String(leave._id), applicantName },
    });
  }

  return normalize(leave);
};

/**
 * Get all leaves for the current user, newest first.
 */
export const getMyLeaves = async (userId: string) => {
  const leaves = await Leave.find({ userId: toObjectId(userId) })
    .sort({ createdAt: -1 })
    .lean();

  return leaves.map((l) => normalize(l as unknown as ILeave));
};

/**
 * Get pending leaves visible to this reviewer:
 * - Admins/Superadmins: all pending leaves across the system
 * - Department Heads: pending leaves in their own department(s) only
 */
export const getPendingLeaves = async (actorId: string) => {
  const actor = await User.findById(actorId)
    .select("global_role departments")
    .lean();

  if (!actor) throw new Error("Actor not found.");

  const isAdmin =
    actor.global_role === "Admin" || actor.global_role === "Superadmin";

  const query: any = { status: "pending" };

  if (!isAdmin) {
    // Head: only their department(s)
    const headDeptIds = (actor.departments ?? [])
      .filter((d) => d.department_role === "Head")
      .map((d) => d.department_id);

    if (headDeptIds.length === 0) return []; // not a head — nothing to see

    query.departmentId = { $in: headDeptIds };
  }

  const leaves = await Leave.find(query)
    .populate<{
      userId: {
        _id: Types.ObjectId;
        first_name: string;
        last_name: string;
        email: string;
      };
    }>("userId", "first_name last_name email")
    .sort({ createdAt: 1 }) // oldest first — FIFO approval queue
    .lean();

  return leaves.map((l: any) => ({
    ...normalize(l as unknown as ILeave),
    applicant: l.userId
      ? {
          _id: String(l.userId._id),
          name:
            `${l.userId.first_name} ${l.userId.last_name}`.trim() ||
            l.userId.email,
          email: l.userId.email,
        }
      : undefined,
  }));
};

/**
 * Approve a leave request.
 * Notifies the applicant.
 */
export const approveLeave = async (input: ReviewLeaveInput) => {
  const leave = await Leave.findById(input.leaveId);
  if (!leave) throw new Error("Leave not found.");
  if (leave.status !== "pending") {
    throw new Error(`Cannot approve a leave that is already ${leave.status}.`);
  }

  const actorName = await resolveActorName(input.actorId);

  leave.status = "approved";
  leave.reviewedBy = toObjectId(input.actorId);
  leave.reviewedAt = new Date();
  leave.reviewHistory.push({
    action: "approved",
    actor_id: toObjectId(input.actorId),
    actor_name: actorName,
    timestamp: new Date(),
  });

  await leave.save();

  // ── notify applicant ──────────────────────────────────────────────────────
  await createNotification({
    recipientId: String(leave.userId),
    actorId: input.actorId,
    eventType: "leave_approved",
    title: "Leave Approved",
    message: `Your ${leave.leaveType} leave (${leave.startDate.toDateString()} – ${leave.endDate.toDateString()}) has been approved by ${actorName}.`,
    entityType: "leave",
    entityId: String(leave._id),
    metadata: { leaveId: String(leave._id), reviewerName: actorName },
  });

  return normalize(leave);
};

/**
 * Reject a leave request (rejection reason is required).
 * Notifies the applicant.
 */
export const rejectLeave = async (input: ReviewLeaveInput) => {
  if (!input.rejectionReason || input.rejectionReason.trim().length === 0) {
    throw new Error("A rejection reason is required.");
  }

  const leave = await Leave.findById(input.leaveId);
  if (!leave) throw new Error("Leave not found.");
  if (leave.status !== "pending") {
    throw new Error(`Cannot reject a leave that is already ${leave.status}.`);
  }

  const actorName = await resolveActorName(input.actorId);

  leave.status = "rejected";
  leave.reviewedBy = toObjectId(input.actorId);
  leave.reviewedAt = new Date();
  leave.rejectionReason = input.rejectionReason.trim();
  leave.reviewHistory.push({
    action: "rejected",
    actor_id: toObjectId(input.actorId),
    actor_name: actorName,
    reason: input.rejectionReason.trim(),
    timestamp: new Date(),
  });

  await leave.save();

  // ── notify applicant ──────────────────────────────────────────────────────
  await createNotification({
    recipientId: String(leave.userId),
    actorId: input.actorId,
    eventType: "leave_rejected",
    title: "Leave Rejected",
    message: `Your ${leave.leaveType} leave (${leave.startDate.toDateString()} – ${leave.endDate.toDateString()}) was rejected by ${actorName}. Reason: ${input.rejectionReason.trim()}`,
    entityType: "leave",
    entityId: String(leave._id),
    metadata: {
      leaveId: String(leave._id),
      reviewerName: actorName,
      rejectionReason: input.rejectionReason.trim(),
    },
  });

  return normalize(leave);
};

/**
 * Cancel own leave (applicant only; only pending leaves can be cancelled).
 * Notifies reviewers.
 */
export const cancelLeave = async (userId: string, leaveId: string) => {
  const leave = await Leave.findById(leaveId);
  if (!leave) throw new Error("Leave not found.");
  if (String(leave.userId) !== userId) {
    throw new Error("You can only cancel your own leave requests.");
  }
  if (leave.status !== "pending") {
    throw new Error(
      `Only pending leaves can be cancelled. This leave is ${leave.status}.`,
    );
  }

  const actorName = await resolveActorName(userId);

  leave.status = "cancelled";
  leave.reviewHistory.push({
    action: "cancelled",
    actor_id: toObjectId(userId),
    actor_name: actorName,
    timestamp: new Date(),
  });

  await leave.save();

  // ── notify reviewers ──────────────────────────────────────────────────────
  const reviewerIds = await findReviewerIds(
    leave.departmentId ? String(leave.departmentId) : undefined,
  );

  if (reviewerIds.length > 0) {
    await createNotificationsForRecipients(reviewerIds, {
      actorId: userId,
      eventType: "leave_cancelled",
      title: "Leave Request Cancelled",
      message: `${actorName} cancelled their ${leave.leaveType} leave request (${leave.startDate.toDateString()} – ${leave.endDate.toDateString()}).`,
      entityType: "leave",
      entityId: String(leave._id),
      metadata: { leaveId: String(leave._id), applicantName: actorName },
    });
  }

  return normalize(leave);
};
