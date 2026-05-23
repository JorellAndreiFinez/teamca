// backend/src/services/dtrService.ts

import DTR from "../models/DTR";
import DTRSummary from "../models/DTRSummary";
import User from "../models/User";
import Leave from "../models/Leave";
import { emitUserDTRUpdated } from "../socket/io";

/**
 * CONFIGURATION
 */
const START_TIME = 8 * 60; // 8:00 AM
const END_TIME = 22 * 60; // 10:00 PM HARD LIMIT
const REQUIRED_HOURS = 8; // 8 hours per day baseline
const TIMEZONE_OFFSET = 8 * 60 * 60 * 1000; // PH (UTC+8)

/**
 * HELPERS
 */

const toPHTime = (date: Date) => {
  return new Date(date.getTime() + TIMEZONE_OFFSET);
};

const getMinutes = (date: Date) => {
  const local = toPHTime(date);
  return local.getHours() * 60 + local.getMinutes();
};

const getTodayPH = () => {
  const now = toPHTime(new Date());
  now.setHours(0, 0, 0, 0);
  return now;
};

const computeAttendance = (timeIn: Date) => {
  const minutes = getMinutes(timeIn);
  const lateMinutes = minutes - START_TIME;
  if (lateMinutes <= 0) return "present";
  if (lateMinutes <= 30) return "present";
  if (lateMinutes <= 60) return "late";
  if (lateMinutes < 120) return "very_late";
  return "absent";
};

/**
 * TIME IN
 */
export const timeIn = async (userId: string) => {
  const today = getTodayPH();
  const now = new Date();

  let dtr = await DTR.findOne({ userId, date: today });
  const attendanceStatus = computeAttendance(now);

  if (!dtr) {
    const user = await User.findById(userId);
    const departmentId = user?.departments?.[0]?.department_id;
    if (!departmentId) throw new Error("User department not found");

    dtr = await DTR.create({
      userId,
      departmentId,
      date: today,
      attendanceStatus,
      clocks: [{ timeIn: now, status: attendanceStatus }],
    });
    return dtr;
  }

  const lastClock = dtr.clocks[dtr.clocks.length - 1];
  if (lastClock && !lastClock.timeOut) return dtr;

  dtr.attendanceStatus = attendanceStatus;
  dtr.clocks.push({ timeIn: now, status: attendanceStatus });
  await dtr.save();

  try {
    emitUserDTRUpdated(userId, {
      event: "time-in",
      dtrId: dtr._id,
      date: dtr.date,
      clocks: dtr.clocks,
      attendanceStatus: dtr.attendanceStatus,
    });
  } catch (_err) {}

  return dtr;
};

/**
 * TIME OUT (WITH REMARKS + OVERTIME)
 */
export const timeOut = async (userId: string, remarks: string) => {
  if (!remarks || remarks.trim().length === 0) {
    throw new Error("Remarks are required when clocking out");
  }

  const today = getTodayPH();
  const dtr = await DTR.findOne({ userId, date: today });

  if (!dtr || dtr.clocks.length === 0) throw new Error("No clock-in found for today");

  const lastClock = dtr.clocks[dtr.clocks.length - 1];
  if (lastClock.timeOut) return lastClock;

  const now = new Date();
  const nowMinutes = getMinutes(now);

  lastClock.timeOut = now;
  lastClock.remarks = remarks;

  let totalMinutes = (now.getTime() - lastClock.timeIn.getTime()) / 60000;
  if (lastClock.breaks && lastClock.breaks.length > 0) {
    const breakMinutes = lastClock.breaks.reduce((sum: number, b: any) => sum + (b.duration || 0), 0);
    totalMinutes -= breakMinutes;
  }

  lastClock.totalHours = parseFloat((totalMinutes / 60).toFixed(2));

  let overtimeHours = 0;
  if (nowMinutes <= END_TIME && nowMinutes > START_TIME) {
    const overtimeMinutes = nowMinutes - END_TIME;
    if (overtimeMinutes > 0) overtimeHours = overtimeMinutes / 60;
  }
  lastClock.overtimeHours = parseFloat(overtimeHours.toFixed(2));

  await dtr.save();
  await updateDTRTotals(dtr._id.toString());

  try {
    emitUserDTRUpdated(userId, {
      event: "time-out",
      dtrId: dtr._id,
      lastClock,
      totalHours: dtr.totalHours,
    });
  } catch (_err) {}

  return dtr;
};

/**
 * GET USER DTR
 */
export const getMyDTR = async (userId: string) => {
  return await DTR.find({ userId }).sort({ date: -1 });
};

/**
 * START BREAK
 */
export const startBreak = async (userId: string, breakType: "lunch" | "rest" | "other" = "rest") => {
  const today = getTodayPH();
  const now = new Date();
  const dtr = await DTR.findOne({ userId, date: today });

  if (!dtr || dtr.clocks.length === 0) throw new Error("No active clock-in found");

  const lastClock = dtr.clocks[dtr.clocks.length - 1];
  if (!lastClock.timeIn || lastClock.timeOut) throw new Error("Not currently clocked in");

  if (lastClock.breaks && lastClock.breaks.length > 0) {
    const lastBreak = lastClock.breaks[lastClock.breaks.length - 1];
    if (!lastBreak.breakEnd) throw new Error("Already on break. Resume work first.");
  }

  if (!lastClock.breaks) lastClock.breaks = [];
  lastClock.breaks.push({ breakStart: now, type: breakType });
  await dtr.save();

  try {
    emitUserDTRUpdated(userId, { event: "break-start", dtrId: dtr._id, clocks: dtr.clocks });
  } catch (_err) {}

  return dtr;
};

/**
 * END BREAK
 */
export const endBreak = async (userId: string) => {
  const today = getTodayPH();
  const now = new Date();
  const dtr = await DTR.findOne({ userId, date: today });

  if (!dtr || dtr.clocks.length === 0) throw new Error("No active clock-in found");

  const lastClock = dtr.clocks[dtr.clocks.length - 1];
  if (!lastClock.breaks || lastClock.breaks.length === 0) throw new Error("No active break to resume from");

  const activeBreak = lastClock.breaks[lastClock.breaks.length - 1];
  if (activeBreak.breakEnd) throw new Error("No active break to resume from");

  activeBreak.breakEnd = now;
  activeBreak.duration = Math.floor((now.getTime() - activeBreak.breakStart.getTime()) / 60000);

  dtr.totalBreakTime = (lastClock.breaks || []).reduce((sum, b) => sum + (b.duration || 0), 0);
  await dtr.save();

  try {
    emitUserDTRUpdated(userId, { event: "break-end", dtrId: dtr._id, clocks: dtr.clocks });
  } catch (_err) {}

  return dtr;
};

/**
 * CALCULATE TOTAL HOURS (excluding breaks)
 */
const calculateTotalHours = (clock: any) => {
  if (!clock.timeIn || !clock.timeOut) return 0;
  let totalMinutes = (clock.timeOut.getTime() - clock.timeIn.getTime()) / 60000;
  if (clock.breaks && clock.breaks.length > 0) {
    const breakMinutes = clock.breaks.reduce((sum: number, b: any) => sum + (b.duration || 0), 0);
    totalMinutes -= breakMinutes;
  }
  return parseFloat((totalMinutes / 60).toFixed(2));
};

/**
 * UPDATE DTR TOTALS
 */
export const updateDTRTotals = async (dtrId: string) => {
  const dtr = await DTR.findById(dtrId);
  if (!dtr) throw new Error("DTR record not found");

  let totalHours = 0;
  dtr.clocks.forEach((clock) => { totalHours += calculateTotalHours(clock); });

  dtr.totalHours = parseFloat(totalHours.toFixed(2));
  dtr.undertimeHours = parseFloat(Math.max(0, REQUIRED_HOURS - totalHours).toFixed(2));
  await dtr.save();

  try {
    emitUserDTRUpdated(String(dtr.userId), {
      event: "totals-updated",
      dtrId: dtr._id,
      totalHours: dtr.totalHours,
      undertimeHours: dtr.undertimeHours,
    });
  } catch (_err) {}

  return dtr;
};

/**
 * GENERATE DTR SUMMARY (weekly/monthly)
 * Leave days are already integrated here — daysOnLeave counts approved leave
 * days overlapping the period so they are NOT counted as absent in reports.
 */
export const generateDTRSummary = async (userId: string, period: "week" | "month") => {
  const today = getTodayPH();
  let startDate: Date;
  let endDate: Date;

  if (period === "week") {
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    startDate = new Date(today.setDate(diff));
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);
  } else {
    startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    endDate.setHours(23, 59, 59, 999);
  }

  const records = await DTR.find({ userId, date: { $gte: startDate, $lte: endDate } });

  // Fetch approved leaves overlapping this period
  const leaves = await Leave.find({
    userId,
    status: "approved",
    startDate: { $lte: endDate },
    endDate: { $gte: startDate },
  }).lean();

  const daysOnLeave = leaves.reduce((sum: number, l: any) => sum + (l.duration || 0), 0);

  // Build a Set of leave date strings so DTR absent days on leave are not double-counted
  const leaveDateSet = new Set<string>();
  for (const leave of leaves) {
    const cur = new Date((leave as any).startDate);
    const last = new Date((leave as any).endDate);
    while (cur <= last) {
      const day = cur.getDay();
      if (day !== 0 && day !== 6) leaveDateSet.add(cur.toISOString().split("T")[0]);
      cur.setDate(cur.getDate() + 1);
    }
  }

  let totalHours = 0;
  let overtimeHours = 0;
  let daysPresent = 0;
  let daysLate = 0;
  // daysAbsent: exclude days covered by approved leave
  let daysAbsent = 0;
  let lateCount = 0;
  let undertimeDays = 0;
  let totalBreakTime = 0;

  records.forEach((dtr) => {
    const dtrDateStr = new Date(dtr.date).toISOString().split("T")[0];
    const isOnLeave = leaveDateSet.has(dtrDateStr);

    totalHours += dtr.totalHours || 0;
    overtimeHours += (dtr.clocks || []).reduce((sum: number, c: any) => sum + (c.overtimeHours || 0), 0);
    totalBreakTime += dtr.totalBreakTime || 0;

    if (dtr.attendanceStatus === "present") {
      daysPresent++;
    } else if (dtr.attendanceStatus === "late") {
      daysLate++;
      lateCount++;
    } else if (dtr.attendanceStatus === "absent" && !isOnLeave) {
      // Only count as absent if NOT covered by approved leave
      daysAbsent++;
    }

    if ((dtr.undertimeHours || 0) > 0) undertimeDays++;
  });

  const requiredHours = records.length * REQUIRED_HOURS;
  const undertimeHours = Math.max(0, requiredHours - totalHours);

  const user = await User.findById(userId);
  const departmentId = user?.departments?.[0]?.department_id;
  if (!departmentId) throw new Error("User department not found");

  const summary = await DTRSummary.findOneAndUpdate(
    { userId, period, startDate, endDate },
    {
      userId,
      departmentId,
      period,
      startDate,
      endDate,
      totalHours: parseFloat(totalHours.toFixed(2)),
      requiredHours,
      overtimeHours: parseFloat(overtimeHours.toFixed(2)),
      undertimeHours: parseFloat(undertimeHours.toFixed(2)),
      totalBreakTime,
      daysPresent,
      daysLate,
      daysAbsent,
      daysOnLeave, // approved leave days in this period
      lateCount,
      undertimeDays,
    },
    { upsert: true, new: true },
  );

  return summary;
};

/**
 * GET SUMMARY (week or month)
 */
export const getSummary = async (userId: string, period: "week" | "month") => {
  const today = getTodayPH();
  let startDate: Date;
  let endDate: Date;

  if (period === "week") {
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    startDate = new Date(today.setDate(diff));
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
  } else {
    startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  }

  const summary = await DTRSummary.findOne({ userId, period, startDate, endDate });
  if (!summary) return generateDTRSummary(userId, period);
  return summary;
};

/**
 * GET HISTORY WITH LEAVE RECORDS (paginated)
 *
 * Replaces getHistoryPaginated. Returns DTR rows merged with approved leave
 * records, tagged with recordType so the frontend renders them differently.
 * Leave days are NOT treated as missing/absent DTR records.
 */
export const getHistoryWithLeaves = async (
  userId: string,
  page: number = 1,
  limit: number = 10,
  filters?: {
    date_from?: string;
    date_to?: string;
    status?: string; // present | late | very_late | absent | leave | all
    sort_by?: string; // date_desc | date_asc | hours_desc | hours_asc
  },
) => {
  const pageNum = Math.max(1, page || 1);
  const limitNum = Math.max(1, Math.min(100, limit || 10));

  const filteringByLeaveOnly = filters?.status === "leave";
  const filteringByNonLeaveStatus =
    filters?.status && filters.status !== "all" && filters.status !== "leave";

  // ── DTR query ──────────────────────────────────────────────────────────────
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

  if (filteringByNonLeaveStatus) {
    dtrQuery.attendanceStatus = filters!.status;
  }

  // ── Leave query (approved only) ────────────────────────────────────────────
  const leaveQuery: any = { userId, status: "approved" };

  if (filters?.date_from || filters?.date_to) {
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

  // ── Fetch in parallel ──────────────────────────────────────────────────────
  const [dtrRecords, leaveRecords] = await Promise.all([
    filteringByLeaveOnly ? Promise.resolve([]) : DTR.find(dtrQuery).sort({ date: -1 }).lean(),
    filteringByNonLeaveStatus ? Promise.resolve([]) : Leave.find(leaveQuery).sort({ startDate: -1 }).lean(),
  ]);

  // Build set of leave date strings to tag DTR rows that fall on leave days
  const leaveDateSet = new Set<string>();
  for (const leave of leaveRecords) {
    const cur = new Date((leave as any).startDate);
    const last = new Date((leave as any).endDate);
    while (cur <= last) {
      const day = cur.getDay();
      if (day !== 0 && day !== 6) leaveDateSet.add(cur.toISOString().split("T")[0]);
      cur.setDate(cur.getDate() + 1);
    }
  }

  // ── Normalize DTR records ──────────────────────────────────────────────────
  const normalizedDTR = (dtrRecords as any[]).map((dtr) => ({
    ...dtr,
    recordType: "dtr" as const,
    // Flag DTR rows that fall inside an approved leave period
    coveredByLeave: leaveDateSet.has(new Date(dtr.date).toISOString().split("T")[0]),
    _sortDate: dtr.date as Date,
  }));

  // ── Normalize leave records ────────────────────────────────────────────────
  const normalizedLeave = (leaveRecords as any[]).map((leave) => ({
    _id: leave._id,
    recordType: "leave" as const,
    date: leave.startDate,
    startDate: leave.startDate,
    endDate: leave.endDate,
    duration: leave.duration,
    leaveType: leave.leaveType,
    reason: leave.reason,
    status: leave.status,
    reviewedBy: leave.reviewedBy,
    reviewedAt: leave.reviewedAt,
    reviewHistory: leave.reviewHistory ?? [],
    _sortDate: leave.startDate as Date,
  }));

  // ── Merge + sort ───────────────────────────────────────────────────────────
  const sort = filters?.sort_by ?? "date_desc";
  const merged = [...normalizedDTR, ...normalizedLeave].sort((a, b) => {
    const aDate = new Date(a._sortDate).getTime();
    const bDate = new Date(b._sortDate).getTime();
    if (sort === "date_asc") return aDate - bDate;
    return bDate - aDate;
  });

  // ── Paginate ───────────────────────────────────────────────────────────────
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

// Kept for backward compatibility — routes that still call getHistoryPaginated
// will continue to work (DTR only, no leave records merged).
export const getHistoryPaginated = getHistoryWithLeaves;