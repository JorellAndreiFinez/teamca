import { Request, Response } from "express";
import * as leaveService from "../services/leaveService";

type AuthRequest = Request;

const getUserId = (req: AuthRequest): string => {
  if (!req.user) {
    throw new Error("Unauthorized");
  }

  return req.user.user_id.toString();
};

const normalizeParam = (value: string | string[]): string => {
  return Array.isArray(value) ? value[0] : value;
};

export const createLeave = async (req: AuthRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    const { duration, startDate, endDate, reason } = req.body;

    if (![0.5, 1, 2, 3].includes(duration)) {
      throw new Error("Invalid leave duration");
    }

    const leave = await leaveService.createLeave(userId, {
      duration,
      startDate,
      endDate,
      reason,
    });

    res.json({
      success: true,
      message: "Leave request submitted",
      data: leave,
    });
  } catch (error: unknown) {
    const err = error as Error;

    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

export const getMyLeaves = async (req: AuthRequest, res: Response) => {
  try {
    const userId = getUserId(req);

    const leaves = await leaveService.getUserLeaves(userId);

    res.json({
      success: true,
      count: leaves.length,
      data: leaves,
    });
  } catch (error: unknown) {
    const err = error as Error;

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const approveLeave = async (req: Request, res: Response) => {
  try {
    const leaveId = normalizeParam(req.params.leaveId);
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      throw new Error("Invalid status");
    }

    const leave = await leaveService.updateLeaveStatus(
      leaveId,
      status as "approved" | "rejected",
    );

    res.json({
      success: true,
      message: `Leave ${status}`,
      data: leave,
    });
  } catch (error: unknown) {
    const err = error as Error;

    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

export const cancelLeave = async (req: AuthRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    const leaveId = normalizeParam(req.params.leaveId);

    const leave = await leaveService.cancelLeave(userId, leaveId);

    res.json({
      success: true,
      message: "Leave cancelled successfully",
      data: leave,
    });
  } catch (error: unknown) {
    const err = error as Error;

    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};
