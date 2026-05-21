import DTR from "../models/DTR.js";
import DTRSummary from "../models/DTRSummary.js";
import User from "../models/User.js";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

const PH_TIMEZONE = "Asia/Manila";

const buildDateRangeExpr = (startDate: string, endDate: string) => ({
  $expr: {
    $and: [
      {
        $gte: [
          {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$date",
              timezone: PH_TIMEZONE,
            },
          },
          startDate,
        ],
      },
      {
        $lte: [
          {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$date",
              timezone: PH_TIMEZONE,
            },
          },
          endDate,
        ],
      },
    ],
  },
});

// PDF generation (could use pdfkit or html2pdf libraries)
export const exportService = {
  async generateExcelData(
    userId: string,
    startDate: string,
    endDate: string,
    _format: "csv" | "json",
  ) {
    const records = await DTR.find({
      userId,
      ...buildDateRangeExpr(startDate, endDate),
    }).sort({ date: 1 });

    const user = await User.findById(userId);

    if (!records.length) {
      return {
        headers: [
          "Date",
          "Time In",
          "Time Out",
          "Total Hours",
          "Status",
          "Remarks",
        ],
        rows: [],
        user: user?.first_name + " " + user?.last_name,
      };
    }

    const rows = records.map((record: any) => {
      const clock = record.clocks?.[0];
      return [
        record.date.toISOString().split("T")[0],
        clock?.timeIn?.toLocaleTimeString() || "-",
        clock?.timeOut?.toLocaleTimeString() || "-",
        record.totalHours || 0,
        record.attendanceStatus || "pending",
        record.remarks || "-",
      ];
    });

    return {
      headers: [
        "Date",
        "Time In",
        "Time Out",
        "Total Hours",
        "Status",
        "Remarks",
      ],
      rows,
      user: user?.first_name + " " + user?.last_name,
    };
  },

  async generateSummaryExport(
    userId: string,
    period: "week" | "month",
    dateInPeriod: Date,
  ) {
    let startDate: Date;
    let endDate: Date;

    if (period === "week") {
      const dayOfWeek = dateInPeriod.getDay();
      const diff =
        dateInPeriod.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      startDate = new Date(dateInPeriod.setDate(diff));
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
    } else {
      startDate = new Date(
        dateInPeriod.getFullYear(),
        dateInPeriod.getMonth(),
        1,
      );
      endDate = new Date(
        dateInPeriod.getFullYear(),
        dateInPeriod.getMonth() + 1,
        0,
      );
    }

    const summary = await DTRSummary.findOne({
      userId,
      period,
      startDate: { $lte: startDate },
      endDate: { $gte: endDate },
    });

    const user = await User.findById(userId);

    return {
      user: user?.first_name + " " + user?.last_name,
      period: `${period} of ${startDate.toISOString().split("T")[0]}`,
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      data: {
        totalHours: summary?.totalHours || 0,
        requiredHours: summary?.requiredHours || 0,
        overtimeHours: summary?.overtimeHours || 0,
        undertimeHours: summary?.undertimeHours || 0,
        daysPresent: summary?.daysPresent || 0,
        daysLate: summary?.daysLate || 0,
        daysAbsent: summary?.daysAbsent || 0,
        daysOnLeave: summary?.daysOnLeave || 0,
        lateCount: summary?.lateCount || 0,
        undertimeDays: summary?.undertimeDays || 0,
      },
    };
  },

  async generateDetailedReport(
    userId: string,
    startDate: string,
    endDate: string,
  ) {
    const records = await DTR.find({
      userId,
      ...buildDateRangeExpr(startDate, endDate),
    }).sort({ date: 1 });

    const user = await User.findById(userId);

    const detailed = records.map((record: any) => {
      const clock = record.clocks?.[0];
      const breaks = clock?.breaks || [];

      return {
        date: record.date.toISOString().split("T")[0],
        timeIn: clock?.timeIn?.toLocaleTimeString() || "-",
        timeOut: clock?.timeOut?.toLocaleTimeString() || "-",
        totalHours: record.totalHours || 0,
        breaks: breaks.map((b: any) => ({
          type: b.type,
          start: b.breakStart?.toLocaleTimeString() || "-",
          end: b.breakEnd?.toLocaleTimeString() || "-",
          duration: b.duration || 0,
        })),
        totalBreakTime: record.totalBreakTime || 0,
        status: record.attendanceStatus || "pending",
        remarks: record.remarks || "-",
      };
    });

    return {
      user: user?.first_name + " " + user?.last_name,
      dateRange: {
        start: startDate,
        end: endDate,
      },
      records: detailed,
      summary: {
        totalRecords: detailed.length,
        totalHoursRendered: detailed.reduce(
          (sum, d) => sum + (d.totalHours || 0),
          0,
        ),
        totalBreakTime: detailed.reduce(
          (sum, d) => sum + (d.totalBreakTime || 0),
          0,
        ),
      },
    };
  },

  toJSON(data: any): string {
    return JSON.stringify(data, null, 2);
  },

  toCSV(headers: string[], rows: any[][]): string {
    const csvHeaders = headers.map((h) => `"${h}"`).join(",");
    const csvRows = rows
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    return `${csvHeaders}\n${csvRows}`;
  },

  async toXlsxBuffer(data: any): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("DTR Export");

    const addTitle = (title: string) => {
      const row = sheet.addRow([title]);
      row.font = { size: 14, bold: true };
      sheet.addRow([]);
    };

    const addMeta = (items: Array<[string, string]>) => {
      items.forEach(([label, value]) => {
        const row = sheet.addRow([label, value]);
        row.font = { bold: label === "User" };
      });
      sheet.addRow([]);
    };

    const applyHeaderStyle = (rowNumber: number) => {
      const row = sheet.getRow(rowNumber);
      row.font = { bold: true };
      row.alignment = { vertical: "middle", horizontal: "left" };
      row.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFEFEFEF" },
        };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    };

    const applyBodyBorders = (startRow: number, endRow: number) => {
      for (let i = startRow; i <= endRow; i += 1) {
        sheet.getRow(i).eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
      }
    };

    const autoFitColumns = () => {
      sheet.columns = sheet.columns.map((column) => {
        if (!column) return column;
        let maxLength = 12;
        (column as any).eachCell({ includeEmpty: true }, (cell: any) => {
          const raw = cell.value ?? "";
          const text = typeof raw === "string" ? raw : String(raw);
          maxLength = Math.max(maxLength, Math.min(40, text.length + 2));
        });
        return { ...column, width: maxLength };
      });
    };

    addTitle("DTR Export");
    const meta: Array<[string, string]> = [];
    if (data?.user) meta.push(["User", data.user]);
    if (data?.dateRange?.start && data?.dateRange?.end) {
      meta.push([
        "Date Range",
        `${data.dateRange.start} to ${data.dateRange.end}`,
      ]);
    }
    if (data?.startDate && data?.endDate) {
      meta.push(["Date Range", `${data.startDate} to ${data.endDate}`]);
    }
    if (data?.period) meta.push(["Period", data.period]);
    if (meta.length > 0) addMeta(meta);

    if (data?.headers && data?.rows) {
      const headerRowNumber = sheet.rowCount + 1;
      sheet.addRow(data.headers);
      applyHeaderStyle(headerRowNumber);
      const startRow = sheet.rowCount + 1;
      data.rows.forEach((row: any[]) => sheet.addRow(row));
      applyBodyBorders(startRow, sheet.rowCount);
      sheet.autoFilter = {
        from: { row: headerRowNumber, column: 1 },
        to: { row: headerRowNumber, column: data.headers.length },
      };
    } else if (data?.records) {
      const headers = [
        "Date",
        "Time In",
        "Time Out",
        "Total Hours",
        "Total Break Time",
        "Status",
        "Remarks",
        "Breaks",
      ];
      const headerRowNumber = sheet.rowCount + 1;
      sheet.addRow(headers);
      applyHeaderStyle(headerRowNumber);
      const startRow = sheet.rowCount + 1;
      data.records.forEach((record: any) => {
        const breaks = (record.breaks || [])
          .map((b: any) => `${b.type}: ${b.start}-${b.end} (${b.duration}m)`)
          .join("; ");
        sheet.addRow([
          record.date,
          record.timeIn,
          record.timeOut,
          record.totalHours ?? 0,
          record.totalBreakTime ?? 0,
          record.status ?? "-",
          record.remarks ?? "-",
          breaks || "-",
        ]);
      });
      applyBodyBorders(startRow, sheet.rowCount);
      sheet.autoFilter = {
        from: { row: headerRowNumber, column: 1 },
        to: { row: headerRowNumber, column: headers.length },
      };
    } else if (data?.data) {
      const rows = Object.entries(data.data).map(([key, value]) => [
        key,
        value,
      ]);
      const headerRowNumber = sheet.rowCount + 1;
      sheet.addRow(["Metric", "Value"]);
      applyHeaderStyle(headerRowNumber);
      const startRow = sheet.rowCount + 1;
      rows.forEach((row) => sheet.addRow(row as any));
      applyBodyBorders(startRow, sheet.rowCount);
    } else {
      sheet.addRow(["Export Data"]);
      sheet.addRow([this.toJSON(data)]);
    }

    autoFitColumns();

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.isBuffer(buffer)
      ? buffer
      : Buffer.from(buffer as ArrayBuffer);
  },

  async toPdfBuffer(data: any): Promise<Buffer> {
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks: Buffer[] = [];

    const writeMeta = (items: Array<[string, string]>) => {
      const startX = doc.page.margins.left;
      const boxWidth =
        doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const boxY = doc.y;
      const lineHeight = 14;
      const boxHeight = items.length * lineHeight + 16;

      doc.save();
      doc.fillColor("#F8FAFC").rect(startX, boxY, boxWidth, boxHeight).fill();
      doc
        .strokeColor("#E2E8F0")
        .rect(startX, boxY, boxWidth, boxHeight)
        .stroke();
      doc.restore();

      let cursorY = boxY + 8;
      items.forEach(([label, value]) => {
        doc
          .font("Helvetica-Bold")
          .fillColor("#334155")
          .text(`${label}: `, startX + 8, cursorY, {
            continued: true,
          });
        doc.font("Helvetica").fillColor("#0F172A").text(value);
        cursorY += lineHeight;
      });
      doc.y = boxY + boxHeight + 10;
    };

    const ensureSpace = (height: number) => {
      const bottom = doc.page.height - doc.page.margins.bottom;
      if (doc.y + height > bottom) {
        doc.addPage();
      }
    };

    const getColumnWidths = (headers: string[]) => {
      const pageWidth =
        doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const weights = headers.map((header) => {
        const key = header.toLowerCase();
        if (key.includes("remarks") || key.includes("break")) return 2.2;
        if (key.includes("date")) return 1.4;
        return 1;
      });
      const total = weights.reduce((sum, w) => sum + w, 0);
      return weights.map((w) => Math.round((pageWidth * w) / total));
    };

    const writeTable = (headers: string[], rows: string[][]) => {
      const rowHeight = 18;
      const startX = doc.page.margins.left;
      const widths = getColumnWidths(headers);
      const tableWidth = widths.reduce((sum, w) => sum + w, 0);

      ensureSpace(rowHeight * 2);

      const headerY = doc.y;
      doc.save();
      doc
        .fillColor("#E2E8F0")
        .rect(startX, headerY, tableWidth, rowHeight)
        .fill();
      doc.restore();
      doc
        .strokeColor("#CBD5E1")
        .rect(startX, headerY, tableWidth, rowHeight)
        .stroke();

      doc.font("Helvetica-Bold").fillColor("#0F172A");
      headers.forEach((header, i) => {
        const x = startX + widths.slice(0, i).reduce((a, b) => a + b, 0);
        doc.text(header, x + 6, headerY + 4, { width: widths[i] - 12 });
      });
      doc.y = headerY + rowHeight;

      doc.font("Helvetica").fillColor("#111827");
      rows.forEach((row, rowIndex) => {
        ensureSpace(rowHeight * 2);
        const rowY = doc.y;
        if (rowIndex % 2 === 0) {
          doc.save();
          doc
            .fillColor("#F8FAFC")
            .rect(startX, rowY, tableWidth, rowHeight)
            .fill();
          doc.restore();
        }
        doc
          .strokeColor("#E2E8F0")
          .rect(startX, rowY, tableWidth, rowHeight)
          .stroke();
        row.forEach((cell, i) => {
          const x = startX + widths.slice(0, i).reduce((a, b) => a + b, 0);
          doc.text(cell, x + 6, rowY + 4, { width: widths[i] - 12 });
        });
        doc.y = rowY + rowHeight;
      });
    };

    return new Promise((resolve, reject) => {
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      doc
        .fillColor("#0F172A")
        .font("Helvetica-Bold")
        .fontSize(18)
        .text("DTR Export", {
          align: "left",
        });
      doc.moveDown(0.2);
      const accentY = doc.y;
      doc.save();
      doc
        .strokeColor("#2563EB")
        .lineWidth(2)
        .moveTo(doc.page.margins.left, accentY)
        .lineTo(doc.page.margins.left + 120, accentY)
        .stroke();
      doc.restore();
      doc.moveDown(0.6);

      const meta: Array<[string, string]> = [];
      if (data?.user) meta.push(["User", data.user]);
      if (data?.dateRange?.start && data?.dateRange?.end) {
        meta.push([
          "Date Range",
          `${data.dateRange.start} to ${data.dateRange.end}`,
        ]);
      }
      if (data?.startDate && data?.endDate) {
        meta.push(["Date Range", `${data.startDate} to ${data.endDate}`]);
      }
      if (data?.period) meta.push(["Period", data.period]);
      if (meta.length > 0) writeMeta(meta);

      if (data?.headers && data?.rows) {
        doc.fontSize(9);
        const headers = data.headers.map((h: any) => String(h));
        const rows = data.rows.map((row: any[]) =>
          row.map((cell) => String(cell ?? "-")),
        );
        writeTable(headers, rows);
      } else if (data?.records) {
        doc.fontSize(9);
        const headers = [
          "Date",
          "Time In",
          "Time Out",
          "Hours",
          "Breaks",
          "Status",
        ];
        const rows = data.records.map((record: any) => {
          const breaks = (record.breaks || [])
            .map((b: any) => `${b.type} ${b.start}-${b.end} (${b.duration}m)`)
            .join("; ");
          return [
            record.date,
            record.timeIn,
            record.timeOut,
            String(record.totalHours ?? 0),
            breaks || "-",
            record.status ?? "-",
          ];
        });
        writeTable(headers, rows);
      } else if (data?.data) {
        doc.fontSize(10);
        const rows = Object.entries(data.data).map(([k, v]) => [
          String(k),
          String(v),
        ]);
        writeTable(["Metric", "Value"], rows);
      } else {
        doc.fontSize(9).text(this.toJSON(data));
      }

      doc.end();
    });
  },
};
