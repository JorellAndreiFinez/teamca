// backend\src\services\dtrService.ts

import DTR from "../models/DTR";
import DTRSummary from "../models/DTRSummary";
import User from "../models/User";
import Leave from "../models/Leave";
import { emitUserDTRUpdated } from "../socket/io";
import type { IDTR } from "../models/DTR";

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

// Convert to PH time
const toPHTime = (date: Date) => {
  return new Date(date.getTime() + TIMEZONE_OFFSET);
};

// Get minutes in PH time
const getMinutes = (date: Date) => {
  const local = toPHTime(date);
  return local.getHours() * 60 + local.getMinutes();
};

// Get PH "today"
const getTodayPH = () => {
  const now = toPHTime(new Date());
  now.setHours(0, 0, 0, 0);
  return now;
};

// Attendance computation
const computeAttendance = (timeIn: Date) => {
  const minutes = getMinutes(timeIn);
  const lateMinutes = minutes - START_TIME;

  // ✅ EARLY OR ON TIME
  if (lateMinutes <= 0) return "present";

  // ✅ 30 MIN GRACE
  if (lateMinutes <= 30) return "present";

  // ✅ LATE
  if (lateMinutes <= 60) return "late";

  // ✅ VERY LATE
  if (lateMinutes < 120) return "very_late";

  // ❌ ABSENT
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
    // get user's department
    const user = await User.findById(userId);
    const departmentId = user?.departments?.[0]?.department_id;

    if (!departmentId) {
      throw new Error("User department not found");
    }

    dtr = await DTR.create({
      userId,
      departmentId,
      date: today,
      attendanceStatus,
      clocks: [
        {
          timeIn: now,
          status: attendanceStatus,
        },
      ],
    });

    return dtr;
  }

  const lastClock = dtr.clocks[dtr.clocks.length - 1];

  if (lastClock && !lastClock.timeOut) {
    // Already clocked in - return existing DTR to make this endpoint idempotent
    return dtr;
  }

  dtr.attendanceStatus = attendanceStatus;

  dtr.clocks.push({
    timeIn: now,
    status: attendanceStatus,
  });

  await dtr.save();

  // notify connected clients for this user
  try {
    emitUserDTRUpdated(userId, {
      event: "time-in",
      dtrId: dtr._id,
      date: dtr.date,
      clocks: dtr.clocks,
      attendanceStatus: dtr.attendanceStatus,
    });
  } catch (_err) {
    // Silently ignore socket emit errors
  }

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

  if (!dtr || dtr.clocks.length === 0) {
    // No clock-in found - return a clear error but allow client to refresh safely
    throw new Error("No clock-in found for today");
  }

  const lastClock = dtr.clocks[dtr.clocks.length - 1];

  if (lastClock.timeOut) {
    // Already timed out - return the last clock entry to keep the endpoint idempotent
    return lastClock;
  }

  const now = new Date();
  const nowMinutes = getMinutes(now);

  lastClock.timeOut = now;
  lastClock.remarks = remarks;

  // TOTAL HOURS (excluding breaks)
  let totalMinutes = (now.getTime() - lastClock.timeIn.getTime()) / 60000;
  
  if (lastClock.breaks && lastClock.breaks.length > 0) {
    const breakMinutes = lastClock.breaks.reduce((sum: number, b: any) => sum + (b.duration || 0), 0);
    totalMinutes -= breakMinutes;
  }

  const totalHours = totalMinutes / 60;
  lastClock.totalHours = parseFloat(totalHours.toFixed(2));

  // OVERTIME (only if beyond scheduled end, HARD STOP at 10:00 PM)
  let overtimeHours = 0;

  if (nowMinutes > END_TIME) {
    overtimeHours = 0; // no OT past 10PM
  } else if (nowMinutes > START_TIME) {
    const overtimeMinutes = nowMinutes - END_TIME;

    if (overtimeMinutes > 0) {
      overtimeHours = overtimeMinutes / 60;
    }
  }

  lastClock.overtimeHours = parseFloat(overtimeHours.toFixed(2));

  await dtr.save();

  // update DTR totals and undertime
  await updateDTRTotals(dtr._id.toString());

  try {
    emitUserDTRUpdated(userId, {
      event: "time-out",
      dtrId: dtr._id,
      lastClock: lastClock,
      totalHours: dtr.totalHours,
    });
  } catch (_err) {
    // Silently ignore socket emit errors
  }

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

  if (!dtr || dtr.clocks.length === 0) {
    throw new Error("No active clock-in found");
  }

  const lastClock = dtr.clocks[dtr.clocks.length - 1];

  if (!lastClock.timeIn || lastClock.timeOut) {
    throw new Error("Not currently clocked in");
  }

  if (lastClock.breaks && lastClock.breaks.length > 0) {
    const lastBreak = lastClock.breaks[lastClock.breaks.length - 1];
    if (!lastBreak.breakEnd) {
      throw new Error("Already on break. Resume work first.");
    }
  }

  if (!lastClock.breaks) {
    lastClock.breaks = [];
  }

  lastClock.breaks.push({
    breakStart: now,
    type: breakType,
  });

  await dtr.save();
  // notify connected clients for this user
  try {
    emitUserDTRUpdated(userId, {
      event: "break-start",
      dtrId: dtr._id,
      clocks: dtr.clocks,
    });
  } catch (_err) {
    // Silently ignore socket emit errors
  }

  return dtr;
};

/**
 * END BREAK
 */
export const endBreak = async (userId: string) => {
  const today = getTodayPH();
  const now = new Date();

  const dtr = await DTR.findOne({ userId, date: today });

  if (!dtr || dtr.clocks.length === 0) {
    throw new Error("No active clock-in found");
  }

  const lastClock = dtr.clocks[dtr.clocks.length - 1];

  if (!lastClock.breaks || lastClock.breaks.length === 0) {
    throw new Error("No active break to resume from");
  }

  const activeBreak = lastClock.breaks[lastClock.breaks.length - 1];

  if (activeBreak.breakEnd) {
    throw new Error("No active break to resume from");
  }

  // calculate break duration
  const breakDuration = Math.floor((now.getTime() - activeBreak.breakStart.getTime()) / 60000);
  activeBreak.breakEnd = now;
  activeBreak.duration = breakDuration;

  // update total break time
  const totalBreakTime = (lastClock.breaks || []).reduce((sum, b) => sum + (b.duration || 0), 0);
  dtr.totalBreakTime = totalBreakTime;

  await dtr.save();
  try {
    emitUserDTRUpdated(userId, {
      event: "break-end",
      dtrId: dtr._id,
      clocks: dtr.clocks,
    });
  } catch (_err) {
    // Silently ignore socket emit errors
  }

  return dtr;
};

/**
 * CALCULATE TOTAL HOURS (excluding breaks)
 */
const calculateTotalHours = (clock: any) => {
  if (!clock.timeIn || !clock.timeOut) {
    return 0;
  }

  let totalMinutes = (clock.timeOut.getTime() - clock.timeIn.getTime()) / 60000;
  
  // deduct break time
  if (clock.breaks && clock.breaks.length > 0) {
    const breakMinutes = clock.breaks.reduce((sum: number, b: any) => sum + (b.duration || 0), 0);
    totalMinutes -= breakMinutes;
  }

  return parseFloat((totalMinutes / 60).toFixed(2));
};

/**
 * UPDATE DTR TOTALS (compute hours, undertime, etc.)
 */
export const updateDTRTotals = async (dtrId: string) => {
  const dtr = await DTR.findById(dtrId);

  if (!dtr) {
    throw new Error("DTR record not found");
  }

  // sum all clock entries
  let totalHours = 0;
  dtr.clocks.forEach((clock) => {
    totalHours += calculateTotalHours(clock);
  });

  dtr.totalHours = parseFloat(totalHours.toFixed(2));

  // calculate undertime
  const undertimeHours = Math.max(0, REQUIRED_HOURS - totalHours);
  dtr.undertimeHours = parseFloat(undertimeHours.toFixed(2));

  await dtr.save();
  try {
    emitUserDTRUpdated(String(dtr.userId), {
      event: "totals-updated",
      dtrId: dtr._id,
      totalHours: dtr.totalHours,
      undertimeHours: dtr.undertimeHours,
    });
  } catch (_err) {
    // Silently ignore socket emit errors
  }

  return dtr;
};

/**
 * GENERATE DTR SUMMARY (weekly/monthly)
 */
export const generateDTRSummary = async (userId: string, period: "week" | "month") => {
  const today = getTodayPH();
  let startDate: Date;
  let endDate: Date;

  if (period === "week") {
    // get start of current week (Monday)
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    startDate = new Date(today.setDate(diff));
    startDate.setHours(0, 0, 0, 0);
    
    endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);
  } else {
    // get start of current month
    startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    startDate.setHours(0, 0, 0, 0);
    
    endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    endDate.setHours(23, 59, 59, 999);
  }

  // fetch DTR records for the period
  const records = await DTR.find({
    userId,
    date: { $gte: startDate, $lte: endDate },
  });

  // fetch approved leaves overlapping the period and sum their durations
  const leaves = await Leave.find({
    userId,
    status: "approved",
    startDate: { $lte: endDate },
    endDate: { $gte: startDate },
  }).lean();

  const daysOnLeave = leaves.reduce((sum: number, l: any) => sum + (l.duration || 0), 0);

  // calculate metrics
  let totalHours = 0;
  let overtimeHours = 0;
  let daysPresent = 0;
  let daysLate = 0;
  let daysAbsent = 0;
  let lateCount = 0;
  let undertimeDays = 0;
  let totalBreakTime = 0;

  records.forEach((dtr) => {
    totalHours += dtr.totalHours || 0;
    overtimeHours += (dtr.clocks || [])
      .reduce((sum: number, c: any) => sum + (c.overtimeHours || 0), 0);
    totalBreakTime += dtr.totalBreakTime || 0;

    if (dtr.attendanceStatus === "present") {
      daysPresent++;
    } else if (dtr.attendanceStatus === "late") {
      daysLate++;
      lateCount++;
    } else if (dtr.attendanceStatus === "absent") {
      daysAbsent++;
    }

    if ((dtr.undertimeHours || 0) > 0) {
      undertimeDays++;
    }
  });

  const requiredHours = records.length * REQUIRED_HOURS;
  const undertimeHours = Math.max(0, requiredHours - totalHours);

  // get user's department
  const user = await User.findById(userId);
  const departmentId = user?.departments?.[0]?.department_id;

  if (!departmentId) {
    throw new Error("User department not found");
  }

  // upsert summary
  const summary = await DTRSummary.findOneAndUpdate(
    {
      userId,
      period,
      startDate,
      endDate,
    },
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
      // integrate with leave system: count approved leave durations overlapping this period
      daysOnLeave,
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

  const summary = await DTRSummary.findOne({
    userId,
    period,
    startDate,
    endDate,
  });

  if (!summary) {
    return generateDTRSummary(userId, period);
  }

  return summary;
};

/**
 * GET HISTORY PAGINATED
 */
export const getHistoryPaginated = async (
  userId: string,
  page: number = 1,
  limit: number = 10,
  filters?: {
    date_from?: string; // ISO date
    date_to?: string; // ISO date
    status?: string; // present | late | very_late | absent
    sort_by?: string; // date_desc (default) | date_asc | hours_desc | hours_asc
  },
) => {
  // Validate pagination
  const pageNum = Math.max(1, page || 1);
  const limitNum = Math.max(1, Math.min(100, limit || 10));
  const skip = (pageNum - 1) * limitNum;

  // Build filter query
  const query: any = { userId };

  // Date range filter
  if (filters?.date_from || filters?.date_to) {
    query.date = {};
    if (filters.date_from) {
      const from = new Date(filters.date_from);
      from.setHours(0, 0, 0, 0);
      query.date.$gte = from;
    }
    if (filters.date_to) {
      const to = new Date(filters.date_to);
      to.setHours(23, 59, 59, 999);
      query.date.$lte = to;
    }
  }

  // Status filter
  if (filters?.status && filters.status !== 'all') {
    query.attendanceStatus = filters.status;
  }

  // Determine sort
  let sortObj: any = { date: -1 }; // default: newest first
  if (filters?.sort_by === 'date_asc') {
    sortObj = { date: 1 };
  } else if (filters?.sort_by === 'hours_desc') {
    sortObj = { totalHours: -1, date: -1 };
  } else if (filters?.sort_by === 'hours_asc') {
    sortObj = { totalHours: 1, date: -1 };
  }

  // Execute query
  const total = await DTR.countDocuments(query);
  const items = await DTR.find(query).sort(sortObj).skip(skip).limit(limitNum).exec();

  const total_pages = Math.ceil(total / limitNum);

  return {
    items,
    total,
    page: pageNum,
    limit: limitNum,
    total_pages,
  };
};
