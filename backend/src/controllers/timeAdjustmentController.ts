import { Request, Response } from "express";
import { z } from "zod";
import { timeAdjustmentService } from "../services/timeAdjustmentService.js";
import { IUser } from "../models/User.js";
import {
  compactActivityChanges,
  logActivityForRequest,
  optionalActivityText,
} from "../utils/activityLogPayload.js";

// Zod validation schemas
const submitRequestSchema = z.object({
  dtrDate: z.string().datetime(),
  adjustmentType: z.enum(["time_in", "time_out", "manual_entry", "leave"]),
  requestedValue: z.string().min(1),
  reason: z.string().min(1),
  originalValue: z.string().optional(),
});

const reviewRequestSchema = z.object({
  reviewNotes: z.string().optional(),
});

const asActivityRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

export const timeAdjustmentController = {
  async submitRequest(req: Request, res: Response) {
    try {
      const user = (req as any).user as IUser;
      const userId = (req as any).user?.user_id || (user as any)?._id;
      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }
      const validated = submitRequestSchema.parse(req.body);

      const adjustment = await timeAdjustmentService.submitRequest(
        String(userId),
        new Date(validated.dtrDate),
        validated.adjustmentType,
        validated.requestedValue,
        validated.reason,
        validated.originalValue,
      );

      res.status(201).json({ success: true, data: adjustment });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, message: "Validation error" });
      } else {
        res
          .status(500)
          .json({ success: false, message: error.message || "Server error" });
      }
    }
  },

  async getUserRequests(req: Request, res: Response) {
    try {
      const user = (req as any).user as IUser;
      const userId = (req as any).user?.user_id || (user as any)?._id;
      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }
      const { status } = req.query;

      const requests = await timeAdjustmentService.getUserRequests(
        String(userId),
        status as string | undefined,
      );

      res.status(200).json({ success: true, data: requests });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, message: error.message || "Server error" });
    }
  },

  async getPendingRequests(req: Request, res: Response) {
    try {
      const user = (req as any).user as IUser;
      const userId = (req as any).user?.user_id || (user as any)?._id;
      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      // Check if user is admin/head
      const isAdmin =
        user.global_role === "Admin" || user.global_role === "Superadmin";
      const isHead = user.departments?.some(
        (d) => d.department_role === "Head",
      );

      if (!isAdmin && !isHead) {
        return res
          .status(403)
          .json({ success: false, message: "Unauthorized to review requests" });
      }

      const departmentId = !isAdmin
        ? user.departments?.[0]?.department_id?.toString()
        : undefined;

      const requests =
        await timeAdjustmentService.getPendingRequests(departmentId);

      res.status(200).json({ success: true, data: requests });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, message: error.message || "Server error" });
    }
  },

  async approveRequest(req: Request, res: Response) {
    try {
      const user = (req as any).user as IUser;
      const userId = (req as any).user?.user_id || (user as any)?._id;
      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }
      const id = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;
      const validated = reviewRequestSchema.parse(req.body);

      // Check if user is admin/head
      const isAdmin =
        user.global_role === "Admin" || user.global_role === "Superadmin";
      const isHead = user.departments?.some(
        (d) => d.department_role === "Head",
      );

      if (!isAdmin && !isHead) {
        return res
          .status(403)
          .json({
            success: false,
            message: "Unauthorized to approve requests",
          });
      }

      const request = await timeAdjustmentService.approveRequest(
        id,
        String(userId),
        validated.reviewNotes,
      );
      const requestRecord = asActivityRecord(request);

      await logActivityForRequest(req, {
        action_type: "update",
        resource_type: "dtr",
        resource_id: id,
        description: "Time adjustment request approved.",
        changes: compactActivityChanges({
          record_type: "time_adjustment",
          adjustment_request_id: optionalActivityText(requestRecord._id) ?? id,
          dtr_id: optionalActivityText(requestRecord.dtrId),
          requesting_user_id: optionalActivityText(requestRecord.userId),
          approver_user_id: String(userId),
          approver_email: optionalActivityText(req.user?.email),
          outcome: "approved",
          adjustment_type: optionalActivityText(requestRecord.adjustmentType),
          original_value: optionalActivityText(requestRecord.originalValue),
          requested_value: optionalActivityText(requestRecord.requestedValue),
          review_notes: optionalActivityText(requestRecord.reviewNotes),
        }),
      });

      res.status(200).json({ success: true, data: request });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, message: error.message || "Server error" });
    }
  },

  async rejectRequest(req: Request, res: Response) {
    try {
      const user = (req as any).user as IUser;
      const userId = (req as any).user?.user_id || (user as any)?._id;
      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }
      const id = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;
      const validated = reviewRequestSchema.parse(req.body);

      if (!validated.reviewNotes) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Review notes are required for rejection",
          });
      }

      // Check if user is admin/head
      const isAdmin =
        user.global_role === "Admin" || user.global_role === "Superadmin";
      const isHead = user.departments?.some(
        (d) => d.department_role === "Head",
      );

      if (!isAdmin && !isHead) {
        return res
          .status(403)
          .json({ success: false, message: "Unauthorized to reject requests" });
      }

      const request = await timeAdjustmentService.rejectRequest(
        id,
        String(userId),
        validated.reviewNotes,
      );
      const requestRecord = asActivityRecord(request);

      await logActivityForRequest(req, {
        action_type: "update",
        resource_type: "dtr",
        resource_id: id,
        description: "Time adjustment request rejected.",
        changes: compactActivityChanges({
          record_type: "time_adjustment",
          adjustment_request_id: optionalActivityText(requestRecord._id) ?? id,
          dtr_id: optionalActivityText(requestRecord.dtrId),
          requesting_user_id: optionalActivityText(requestRecord.userId),
          approver_user_id: String(userId),
          approver_email: optionalActivityText(req.user?.email),
          outcome: "rejected",
          adjustment_type: optionalActivityText(requestRecord.adjustmentType),
          original_value: optionalActivityText(requestRecord.originalValue),
          requested_value: optionalActivityText(requestRecord.requestedValue),
          review_notes: optionalActivityText(requestRecord.reviewNotes),
        }),
      });

      res.status(200).json({ success: true, data: request });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, message: error.message || "Server error" });
    }
  },

  async getRequest(req: Request, res: Response) {
    try {
      const id = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

      const request = await timeAdjustmentService.getRequest(id);

      if (!request) {
        return res
          .status(404)
          .json({ success: false, message: "Request not found" });
      }

      res.status(200).json({ success: true, data: request });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, message: error.message || "Server error" });
    }
  },
};
