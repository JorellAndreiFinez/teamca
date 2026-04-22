import DTR from "../models/DTR";

/**
 * CONFIGURATION
 */
const START_TIME = 8 * 60; // 8:00 AM
const END_TIME = 22 * 60; // 10:00 PM HARD LIMIT
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
    dtr = await DTR.create({
      userId,
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
    throw new Error("You already clocked in and haven't clocked out yet");
  }

  dtr.attendanceStatus = attendanceStatus;

  dtr.clocks.push({
    timeIn: now,
    status: attendanceStatus,
  });

  await dtr.save();

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
    throw new Error("No clock-in found for today");
  }

  const lastClock = dtr.clocks[dtr.clocks.length - 1];

  if (lastClock.timeOut) {
    throw new Error("Last clock-in already timed out");
  }

  const now = new Date();
  const nowMinutes = getMinutes(now);

  lastClock.timeOut = now;
  lastClock.remarks = remarks;

  /**
   * TOTAL HOURS
   */
  const totalHours =
    (now.getTime() - lastClock.timeIn.getTime()) / (1000 * 60 * 60);

  lastClock.totalHours = parseFloat(totalHours.toFixed(2));

  /**
   * OVERTIME
   * - Only if beyond scheduled end
   * - HARD STOP at 10:00 PM
   */
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

  console.log("TIME-OUT RECORDED:", lastClock);

  return lastClock;
};

/**
 * GET USER DTR
 */
export const getMyDTR = async (userId: string) => {
  return await DTR.find({ userId }).sort({ date: -1 });
};
