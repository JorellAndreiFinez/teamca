import { Request, Response } from "express";
import { z, ZodError } from "zod";
import { exportService } from "../services/exportService";
import { IUser } from "../models/User";

// Zod validation schema
const exportQuerySchema = z
  .object({
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid startDate format (YYYY-MM-DD)"),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid endDate format (YYYY-MM-DD)"),
    format: z.enum(["csv", "json", "xlsx", "pdf"]).default("csv"),
    type: z.enum(["records", "summary", "detailed"]).default("records"),
  })
  .refine((data) => data.startDate <= data.endDate, {
    message: "startDate must be before or equal to endDate",
    path: ["endDate"],
  });

const toPHDate = (date: string) => {
  return new Date(`${date}T00:00:00.000+08:00`);
};

export const exportController = {
  /**
   * Export DTR records
   * GET /dtr/export?startDate=...&endDate=...&format=csv&type=records
   */
  async exportRecords(req: Request, res: Response) {
    try {
      const user = (req as any).user as IUser;
      const userId = (req as any).user?.user_id || (user as any)?._id;
      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }
      const { startDate, endDate, format, type } = exportQuerySchema.parse({
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        format: req.query.format || "csv",
        type: req.query.type || "records",
      });

      let exportData: any;

      if (type === "summary") {
        exportData = await exportService.generateSummaryExport(
          String(userId),
          "week",
          toPHDate(startDate),
        );
      } else if (type === "detailed") {
        exportData = await exportService.generateDetailedReport(
          String(userId),
          startDate,
          endDate,
        );
      } else {
        exportData = await exportService.generateExcelData(
          String(userId),
          startDate,
          endDate,
          format as "csv" | "json",
        );
      }

      if (format === "json") {
        res.setHeader("Content-Type", "application/json");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="dtr-export-${Date.now()}.json"`,
        );
        res.send(exportService.toJSON(exportData));
      } else if (format === "xlsx") {
        const buffer = await exportService.toXlsxBuffer(exportData);
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        );
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="dtr-export-${Date.now()}.xlsx"`,
        );
        res.send(buffer);
      } else if (format === "pdf") {
        const buffer = await exportService.toPdfBuffer(exportData);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="dtr-export-${Date.now()}.pdf"`,
        );
        res.send(buffer);
      } else {
        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="dtr-export-${Date.now()}.csv"`,
        );
        const csvContent =
          exportData.rows && exportData.headers
            ? exportService.toCSV(exportData.headers, exportData.rows)
            : exportService.toJSON(exportData);
        res.send(csvContent);
      }
    } catch (error: any) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: "Validation error",
          issues: error.issues,
        });
      } else {
        res
          .status(500)
          .json({ success: false, message: error.message || "Server error" });
      }
    }
  },

  /**
   * Preview export data (without download)
   * GET /dtr/export/preview?startDate=...&endDate=...&type=records
   */
  async previewExport(req: Request, res: Response) {
    try {
      const user = (req as any).user as IUser;
      const userId = (req as any).user?.user_id || (user as any)?._id;
      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }
      const { startDate, endDate, type } = exportQuerySchema.parse({
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        type: req.query.type || "records",
      });

      let exportData: any;

      if (type === "summary") {
        exportData = await exportService.generateSummaryExport(
          String(userId),
          "week",
          toPHDate(startDate),
        );
      } else if (type === "detailed") {
        exportData = await exportService.generateDetailedReport(
          String(userId),
          startDate,
          endDate,
        );
      } else {
        exportData = await exportService.generateExcelData(
          String(userId),
          startDate,
          endDate,
          "json",
        );
      }

      res.status(200).json({ success: true, data: exportData });
    } catch (error: any) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: "Validation error",
          issues: error.issues,
        });
      } else {
        res
          .status(500)
          .json({ success: false, message: error.message || "Server error" });
      }
    }
  },
};

export default exportController;
