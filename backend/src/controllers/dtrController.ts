import { Request, Response } from "express";
import * as dtrService from "../services/dtrService";
import { z } from "zod";

type AuthRequest = Request;

const getUserId = (req: AuthRequest): string => {
  const user = req.user;

  if (!user) {
    throw new Error("Unauthorized: Missing user");
  }

  return user.user_id.toString();
};

export const timeIn = async (req: AuthRequest, res: Response) => {
  try {
    const userId = getUserId(req);

    const result = await dtrService.timeIn(userId);

    res.json({
      success: true,
      message: "Time-in recorded successfully",
      data: result,
    });
  } catch (error: unknown) {
    const err = error as Error;

    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

export const timeOut = async (req: AuthRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    const schema = z.object({ remarks: z.string().min(1) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payload" });
    }

    const { remarks } = parsed.data;

    const result = await dtrService.timeOut(userId, remarks);

    res.json({
      success: true,
      message: "Time-out recorded successfully",
      data: result,
    });
  } catch (error: unknown) {
    const err = error as Error;

    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

export const getMyDTR = async (req: AuthRequest, res: Response) => {
  try {
    const userId = getUserId(req);

    const dtrs = await dtrService.getMyDTR(userId);

    res.json({
      success: true,
      count: dtrs.length,
      data: dtrs,
    });
  } catch (error: unknown) {
    const err = error as Error;

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * START BREAK
 * POST /dtr/break-start
 * Body: { breakType?: "lunch" | "rest" | "other" }
 */
export const startBreak = async (req: AuthRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    const schema = z.object({
      breakType: z.enum(["lunch", "rest", "other"]).optional(),
    });
    const parsed = schema.safeParse(req.body || {});
    if (!parsed.success) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payload" });
    }

    const { breakType = "rest" } = parsed.data;

    const result = await dtrService.startBreak(userId, breakType);

    res.json({
      success: true,
      message: "Break started successfully",
      data: result,
    });
  } catch (error: unknown) {
    const err = error as Error;

    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * END BREAK
 * POST /dtr/break-end
 */
export const endBreak = async (req: AuthRequest, res: Response) => {
  try {
    const userId = getUserId(req);

    const result = await dtrService.endBreak(userId);

    res.json({
      success: true,
      message: "Break ended successfully",
      data: result,
    });
  } catch (error: unknown) {
    const err = error as Error;

    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * GET SUMMARY - WEEK
 * GET /dtr/summary/week
 */
export const getSummaryWeek = async (req: AuthRequest, res: Response) => {
  try {
    const userId = getUserId(req);

    const summary = await dtrService.getSummary(userId, "week");

    res.json({
      success: true,
      message: "Weekly summary retrieved",
      data: summary,
    });
  } catch (error: unknown) {
    const err = error as Error;

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * GET SUMMARY - MONTH
 * GET /dtr/summary/month
 */
export const getSummaryMonth = async (req: AuthRequest, res: Response) => {
  try {
    const userId = getUserId(req);

    const summary = await dtrService.getSummary(userId, "month");

    res.json({
      success: true,
      message: "Monthly summary retrieved",
      data: summary,
    });
  } catch (error: unknown) {
    const err = error as Error;

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * GET HISTORY - PAGINATED
 * GET /dtr/history?page=1&limit=10&date_from=2024-01-01&date_to=2024-01-31&status=present&sort_by=date_desc
 */
export const getHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    const { page, limit, date_from, date_to, status, sort_by } = req.query;

    const pageNum = page ? parseInt(page as string, 10) : 1;
    const limitNum = limit ? parseInt(limit as string, 10) : 10;

    const filters = {
      date_from: date_from as string | undefined,
      date_to: date_to as string | undefined,
      status: status as string | undefined,
      sort_by: sort_by as string | undefined,
    };

    // Changed: getHistoryWithLeaves instead of getHistoryPaginated
    const result = await dtrService.getHistoryWithLeaves(
      userId,
      pageNum,
      limitNum,
      filters,
    );

    res.json({
      success: true,
      message: "History retrieved successfully",
      data: result,
    });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ success: false, message: err.message });
  }
};
