// backend\src\controllers\leaveController.ts

import { Request, Response } from "express";
import * as leaveService from "../services/leaveService";

export const createLeave = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
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
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getMyLeaves = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const leaves = await leaveService.getUserLeaves(userId);

    res.json({ success: true, count: leaves.length, data: leaves });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const approveLeave = async (req: Request, res: Response) => {
  try {
    const { leaveId } = req.params;
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
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const cancelLeave = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const { leaveId } = req.params;

    const leave = await leaveService.cancelLeave(userId, leaveId);

    res.json({
      success: true,
      message: "Leave cancelled successfully",
      data: leave,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
