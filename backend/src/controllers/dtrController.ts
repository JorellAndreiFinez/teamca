import { Request, Response } from "express";
import * as dtrService from "../services/dtrService";

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

    console.warn("TIME-IN REQUEST:", {
      userId,
      time: new Date().toISOString(),
    });

    const result = await dtrService.timeIn(userId);

    res.json({
      success: true,
      message: "Time-in recorded successfully",
      data: result,
    });
  } catch (error: unknown) {
    const err = error as Error;

    console.error("TIME-IN ERROR:", err.message);

    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

export const timeOut = async (req: AuthRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    const { remarks } = req.body;

    const result = await dtrService.timeOut(userId, remarks);

    res.json({
      success: true,
      message: "Time-out recorded successfully",
      data: result,
    });
  } catch (error: unknown) {
    const err = error as Error;

    console.error(err.message);

    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

export const getMyDTR = async (req: AuthRequest, res: Response) => {
  try {
    const userId = getUserId(req);

    console.warn("FETCH DTR FOR:", userId);

    const dtrs = await dtrService.getMyDTR(userId);

    console.warn("DTR RESULT COUNT:", dtrs.length);

    res.json({
      success: true,
      count: dtrs.length,
      data: dtrs,
    });
  } catch (error: unknown) {
    const err = error as Error;

    console.error("GET DTR ERROR:", err.message);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
