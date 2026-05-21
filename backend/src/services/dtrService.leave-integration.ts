// backend/src/services/dtrService.leave-integration.ts
//
// PATCH: Add this function to your existing dtrService.ts
// and expose it via GET /dtr/history (replace getHistoryPaginated call
// with getHistoryWithLeaves in dtrController.ts → getHistory handler).
//
// The DTR summary already integrates leave via generateDTRSummary (daysOnLeave).
// This patch makes the *history list* also show approved leave records
// so users see a unified attendance + leave timeline.

import DTR from "../models/DTR.js";
import Leave from "../models/Leave.js";

// ── Paste this function into dtrService.ts ────────────────────────────────────

/**
 * GET HISTORY WITH LEAVE RECORDS (paginated)
 *
 * Returns DTR records merged with approved leave records for the same period,
 * sorted by date descending. Leave records are tagged with `recordType: "leave"`
 * so the frontend can render them differently from DTR rows.
 *
 * Replace `getHistoryPaginated` with this in dtrController.ts → getHistory.
 */
export const getHistoryWithLeaves = async (
  userId: string,
  page: number = 1,
  limit: number = 10,
  filters?: {
    date_from?: string;
    date_to?: string;
    status?: string;
    sort_by?: string;
  },
) => {
  const pageNum = Math.max(1, page);
  const limitNum = Math.max(1, Math.min(100, limit));

  // ── Build DTR query ─────────────────────────────────────────────────────────
  const dtrQuery: any = { userId };

  if (filters?.date_from || filters?.date_to) {
    dtrQuery.date = {};
    if (filters.date_from) {
      const from = new Date(filters.date_from);
      from.setHours(0, 0, 0, 0);
      dtrQuery.date.$gte = from;
    }
    if (filters.date_to) {
      const to = new Date(filters.date_to);
      to.setHours(23, 59, 59, 999);
      dtrQuery.date.$lte = to;
    }
  }

  // When filtering by status, only filter DTR records (leave has its own status)
  if (
    filters?.status &&
    filters.status !== "all" &&
    filters.status !== "leave"
  ) {
    dtrQuery.attendanceStatus = filters.status;
  }

  // ── Build Leave query (approved leaves in the same date range) ──────────────
  const leaveQuery: any = { userId, status: "approved" };

  if (filters?.date_from || filters?.date_to) {
    // overlapping range: leave.startDate <= date_to AND leave.endDate >= date_from
    if (filters.date_from) {
      const from = new Date(filters.date_from);
      from.setHours(0, 0, 0, 0);
      leaveQuery.endDate = { $gte: from };
    }
    if (filters.date_to) {
      const to = new Date(filters.date_to);
      to.setHours(23, 59, 59, 999);
      leaveQuery.startDate = { $lte: to };
    }
  }

  // ── Fetch both in parallel ──────────────────────────────────────────────────
  const [dtrRecords, leaveRecords] = await Promise.all([
    DTR.find(dtrQuery).sort({ date: -1 }).lean(),
    // Only include leave records if not filtering by a non-leave status
    !filters?.status || filters.status === "all" || filters.status === "leave"
      ? Leave.find(leaveQuery).sort({ startDate: -1 }).lean()
      : Promise.resolve([]),
  ]);

  // ── Normalize DTR records ───────────────────────────────────────────────────
  const normalizedDTR = dtrRecords.map((dtr: any) => ({
    ...dtr,
    recordType: "dtr" as const,
    _sortDate: dtr.date as Date,
  }));

  // ── Normalize leave records ─────────────────────────────────────────────────
  const normalizedLeave = leaveRecords.map((leave: any) => ({
    _id: leave._id,
    recordType: "leave" as const,
    date: leave.startDate, // use startDate as the sort anchor
    startDate: leave.startDate,
    endDate: leave.endDate,
    duration: leave.duration,
    leaveType: leave.leaveType,
    reason: leave.reason,
    status: leave.status,
    reviewedBy: leave.reviewedBy,
    reviewedAt: leave.reviewedAt,
    reviewHistory: leave.reviewHistory,
    _sortDate: leave.startDate as Date,
  }));

  // ── Merge and sort by date descending ───────────────────────────────────────
  const sort = filters?.sort_by ?? "date_desc";
  const merged = [...normalizedDTR, ...normalizedLeave].sort((a, b) => {
    const aDate = new Date(a._sortDate).getTime();
    const bDate = new Date(b._sortDate).getTime();
    if (sort === "date_asc") return aDate - bDate;
    return bDate - aDate; // default: newest first
  });

  // ── Paginate in-memory ──────────────────────────────────────────────────────
  // NOTE: For large datasets consider separate pagination. This is fine for
  // typical intern/employee history volumes (< 1000 records/user/year).
  const total = merged.length;
  const skip = (pageNum - 1) * limitNum;
  const items = merged.slice(skip, skip + limitNum);

  return {
    items,
    total,
    page: pageNum,
    limit: limitNum,
    total_pages: Math.max(1, Math.ceil(total / limitNum)),
  };
};

// ── In dtrController.ts, replace getHistory with: ────────────────────────────
//
// export const getHistory = async (req: AuthRequest, res: Response) => {
//   try {
//     const userId = getUserId(req);
//     const { page, limit, date_from, date_to, status, sort_by } = req.query;
//
//     const pageNum = page ? parseInt(page as string, 10) : 1;
//     const limitNum = limit ? parseInt(limit as string, 10) : 10;
//
//     const filters = {
//       date_from: date_from as string | undefined,
//       date_to: date_to as string | undefined,
//       status: status as string | undefined,
//       sort_by: sort_by as string | undefined,
//     };
//
//     // Changed: getHistoryWithLeaves instead of getHistoryPaginated
//     const result = await dtrService.getHistoryWithLeaves(userId, pageNum, limitNum, filters);
//
//     res.json({ success: true, message: "History retrieved successfully", data: result });
//   } catch (error: unknown) {
//     const err = error as Error;
//     res.status(500).json({ success: false, message: err.message });
//   }
// };
