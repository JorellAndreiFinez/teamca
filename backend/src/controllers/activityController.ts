import { Request, Response } from "express";
import {
  getActivityLogs,
  exportActivityLogsToCSV,
} from "../services/activityService.js";
import { z } from "zod";

// validate query params
const activityLogsQuerySchema = z.object({
  limit: z
    .string()
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) > 0 && Number(val) <= 100,
    )
    .default("20"),
  skip: z
    .string()
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0)
    .default("0"),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const getActivityLogsHandler = async (req: Request, res: Response) => {
  try {
    const parsed = activityLogsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ message: "invalid query parameters" });
    }

    const { limit, skip, startDate, endDate } = parsed.data;

    const result = await getActivityLogs(
      Number(limit),
      Number(skip),
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );

    res.json(result);
  } catch {
    res.status(500).json({ message: "failed to fetch activity logs" });
  }
};

export const exportActivityLogsHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const parsed = z
      .object({
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
      })
      .safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ message: "invalid parameters" });
    }

    const { startDate, endDate } = parsed.data;

    const csv = await exportActivityLogsToCSV(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="activity-logs-${new Date().toISOString().split("T")[0]}.csv"`,
    );
    res.send(csv);
  } catch {
    res.status(500).json({ message: "failed to export activity logs" });
  }
};
