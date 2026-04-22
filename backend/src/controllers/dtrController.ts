// backend\src\controllers\dtrController.ts

import { Request, Response } from "express";
import * as dtrService from "../services/dtrService";

export const timeIn = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;

    console.log("TIME-IN REQUEST:", {
      userId,
      time: new Date().toISOString(),
    });

    const result = await dtrService.timeIn(userId);

    console.log("TIME-IN RESULT:", result);

    res.json({
      success: true,
      message: "Time-in recorded successfully",
      data: result,
    });
  } catch (error: any) {
    console.error("TIME-IN ERROR:", error.message);

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const timeOut = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const { remarks } = req.body;

    const result = await dtrService.timeOut(userId, remarks);

    res.json({
      success: true,
      message: "Time-out recorded successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMyDTR = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;

    console.log("FETCH DTR FOR:", userId);

    const dtrs = await dtrService.getMyDTR(userId);

    console.log("DTR RESULT COUNT:", dtrs.length);

    res.json({
      success: true,
      count: dtrs.length,
      data: dtrs,
    });
  } catch (error: any) {
    console.error("GET DTR ERROR:", error.message);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
