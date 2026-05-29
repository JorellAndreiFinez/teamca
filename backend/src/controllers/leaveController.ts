// backend/src/controllers/leaveController.ts

import type { Request, Response } from "express";
import { z } from "zod";
import * as leaveService from "../services/leaveService.js";
import {
  compactActivityChanges,
  logActivityForRequest,
  optionalActivityText,
} from "../utils/activityLogPayload.js";

// ─── validation schemas ───────────────────────────────────────────────────────

const createLeaveSchema = z.object({
  leaveType: z
    .enum(["vacation", "sick", "emergency", "unpaid", "other"])
    .optional()
    .default("other"),
  startDate: z.string().min(1, "startDate is required"),
  endDate: z.string().min(1, "endDate is required"),
  reason: z.string().min(3, "Reason must be at least 3 characters").max(500),
});

const reviewLeaveSchema = z.object({
  rejectionReason: z.string().trim().max(500).optional(),
});

// ─── helpers ──────────────────────────────────────────────────────────────────

const getUserId = (req: Request): string => {
  if (!req.user) throw new Error("Unauthorized: Missing user");
  return String(req.user.user_id);
};

const getRouteParam = (
  value: string | string[] | undefined,
  name: string,
): string => {
  if (!value || Array.isArray(value)) {
    throw new Error(`${name} is required.`);
  }

  return value;
};

// ─── handlers ─────────────────────────────────────────────────────────────────

/**
 * POST /leave
 * Create a new leave request for the authenticated user.
 */
export const createLeaveHandler = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);

    const parsed = createLeaveSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation error.",
        issues: parsed.error.issues,
      });
    }

    const leave = await leaveService.createLeave({
      userId,
      leaveType: parsed.data.leaveType,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      reason: parsed.data.reason,
    });

    return res.status(201).json({
      success: true,
      message: "Leave request submitted successfully.",
      data: leave,
    });
  } catch (error) {
    const err = error as Error;
    const isValidation =
      err.message.includes("overlap") ||
      err.message.includes("Invalid date") ||
      err.message.includes("startDate must be");
    return res.status(isValidation ? 400 : 500).json({
      success: false,
      message: err.message || "Failed to create leave request.",
    });
  }
};

/**
 * GET /leave/me
 * Get all leave requests for the authenticated user.
 */
export const getMyLeavesHandler = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const leaves = await leaveService.getMyLeaves(userId);
    return res.status(200).json({ success: true, data: leaves });
  } catch (error) {
    const err = error as Error;
    return res
      .status(500)
      .json({
        success: false,
        message: err.message || "Failed to fetch leaves.",
      });
  }
};

/**
 * GET /leave/pending
 * Get pending leaves scoped to the reviewer's role:
 *   - Admin/Superadmin → all pending leaves
 *   - Department Head  → pending leaves in their department(s) only
 */
export const getPendingLeavesHandler = async (req: Request, res: Response) => {
  try {
    const actorId = getUserId(req);
    const leaves = await leaveService.getPendingLeaves(actorId);
    return res.status(200).json({ success: true, data: leaves });
  } catch (error) {
    const err = error as Error;
    return res
      .status(500)
      .json({
        success: false,
        message: err.message || "Failed to fetch pending leaves.",
      });
  }
};

/**
 * PATCH /leave/:leaveId/approve
 * Approve or reject a leave request.
 * Body: { status: "approved" | "rejected", rejectionReason?: string }
 *
 * Uses a single endpoint to stay compatible with the existing frontend leaveService
 * which calls PATCH /leave/:id/approve with { status: "approved" | "rejected" }.
 */
export const reviewLeaveHandler = async (req: Request, res: Response) => {
  try {
    const actorId = getUserId(req);
    const leaveId = getRouteParam(req.params.leaveId, "leaveId");

    // status comes from the body (existing frontend contract)
    const statusSchema = z.object({
      status: z.enum(["approved", "rejected"]),
      rejectionReason: z.string().trim().max(500).optional(),
    });

    const parsed = statusSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation error.",
        issues: parsed.error.issues,
      });
    }

    let leave;

    if (parsed.data.status === "approved") {
      leave = await leaveService.approveLeave({ leaveId, actorId });
    } else {
      if (!parsed.data.rejectionReason) {
        return res.status(400).json({
          success: false,
          message: "rejectionReason is required when rejecting a leave.",
        });
      }
      leave = await leaveService.rejectLeave({
        leaveId,
        actorId,
        rejectionReason: parsed.data.rejectionReason,
      });
    }

    await logActivityForRequest(req, {
      action_type: "update",
      resource_type: "dtr",
      resource_id: leaveId,
      description: `Leave request ${parsed.data.status}.`,
      changes: compactActivityChanges({
        record_type: "leave",
        leave_id: leaveId,
        requesting_user_id: optionalActivityText(leave?.userId),
        approver_user_id: actorId,
        approver_email: optionalActivityText(req.user?.email),
        outcome: parsed.data.status,
        rejection_reason:
          parsed.data.status === "rejected"
            ? parsed.data.rejectionReason
            : undefined,
      }),
    });

    return res.status(200).json({
      success: true,
      message: `Leave ${parsed.data.status} successfully.`,
      data: leave,
    });
  } catch (error) {
    const err = error as Error;
    const isNotFound = err.message.includes("not found");
    const isBadState = err.message.includes("Cannot");
    const isMissingReason = err.message.includes("required");
    const statusCode = isNotFound
      ? 404
      : isBadState || isMissingReason
        ? 400
        : 500;
    return res
      .status(statusCode)
      .json({ success: false, message: err.message });
  }
};

/**
 * PATCH /leave/:leaveId/cancel
 * Cancel own pending leave request.
 */
export const cancelLeaveHandler = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const leaveId = getRouteParam(req.params.leaveId, "leaveId");

    const leave = await leaveService.cancelLeave(userId, leaveId);

    return res.status(200).json({
      success: true,
      message: "Leave request cancelled.",
      data: leave,
    });
  } catch (error) {
    const err = error as Error;
    const isNotFound = err.message.includes("not found");
    const isForbidden = err.message.includes("your own");
    const isBadState = err.message.includes("Only pending");
    const statusCode = isNotFound
      ? 404
      : isForbidden
        ? 403
        : isBadState
          ? 400
          : 500;
    return res
      .status(statusCode)
      .json({ success: false, message: err.message });
  }
};
