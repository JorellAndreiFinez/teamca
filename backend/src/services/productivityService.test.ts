import { describe, expect, it } from "vitest";

import {
  computeStreaks,
  computeWeeklyTargetHours,
  parseTimeHHMM,
  startOfPHISOWeek,
  getProductivitySummary,
} from "./productivityService.js";
import DTR from "../models/DTR.js";
import Task from "../models/Task.js";
import TaskAssignment from "../models/TaskAssignment.js";
import TaskStatusHistory from "../models/TaskStatusHistory.js";
import { makeDepartment, makeUser } from "../__tests__/factories.js";

// ─── pure helpers ────────────────────────────────────────────────────────────

describe("parseTimeHHMM", () => {
  it("parses 08:00 → 480", () => {
    expect(parseTimeHHMM("08:00")).toBe(480);
  });

  it("parses 17:30 → 1050", () => {
    expect(parseTimeHHMM("17:30")).toBe(1050);
  });

  it("returns 0 for empty/undefined", () => {
    expect(parseTimeHHMM(undefined)).toBe(0);
    expect(parseTimeHHMM("")).toBe(0);
  });

  it("returns 0 for malformed strings", () => {
    expect(parseTimeHHMM("not-a-time")).toBe(0);
    expect(parseTimeHHMM("25")).toBe(0);
  });
});

describe("computeWeeklyTargetHours", () => {
  it("returns 0 if no working_hours", () => {
    expect(computeWeeklyTargetHours({})).toBe(0);
  });

  it("computes 8h/day × 5 days = 40 for a typical schedule", () => {
    const hours = computeWeeklyTargetHours({
      working_hours: { start: "08:00", end: "16:00" },
      working_days: ["M", "T", "W", "Th", "F"],
    });
    expect(hours).toBe(40);
  });

  it("defaults to 5 days when working_days is missing", () => {
    const hours = computeWeeklyTargetHours({
      working_hours: { start: "09:00", end: "17:00" },
    });
    expect(hours).toBe(40);
  });

  it("handles a 6-day intern schedule", () => {
    const hours = computeWeeklyTargetHours({
      working_hours: { start: "09:00", end: "13:00" }, // 4h/day
      working_days: ["M", "T", "W", "Th", "F", "Sat"],
    });
    expect(hours).toBe(24);
  });
});

describe("startOfPHISOWeek", () => {
  it("returns the previous Monday for any day in the week", () => {
    // 2026-06-04 is a Thursday in PH
    const thu = new Date("2026-06-04T12:00:00+08:00");
    const monday = startOfPHISOWeek(thu);
    // PH Monday of that week is 2026-06-01 00:00 PH
    expect(monday.toISOString()).toBe(
      new Date("2026-06-01T00:00:00+08:00").toISOString(),
    );
  });

  it("Sunday rolls back to the previous Monday (ISO week)", () => {
    const sun = new Date("2026-06-07T15:00:00+08:00");
    const monday = startOfPHISOWeek(sun);
    expect(monday.toISOString()).toBe(
      new Date("2026-06-01T00:00:00+08:00").toISOString(),
    );
  });

  it("a Monday returns itself (start of day PH)", () => {
    const mon = new Date("2026-06-01T16:00:00+08:00");
    const start = startOfPHISOWeek(mon);
    expect(start.toISOString()).toBe(
      new Date("2026-06-01T00:00:00+08:00").toISOString(),
    );
  });
});

describe("computeStreaks", () => {
  const day = (iso: string): Date => new Date(`${iso}T10:00:00+08:00`);

  it("returns 0/0 for no completions", () => {
    expect(computeStreaks([])).toEqual({ current: 0, longest: 0 });
  });

  it("counts a single day as a streak of 1", () => {
    const today = new Date();
    const dates = [today];
    const { current, longest } = computeStreaks(dates);
    expect(longest).toBe(1);
    expect(current).toBe(1);
  });

  it("counts consecutive days as one continuous streak", () => {
    // Three consecutive days ending today
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);
    const { current, longest } = computeStreaks([
      twoDaysAgo,
      yesterday,
      today,
    ]);
    expect(current).toBe(3);
    expect(longest).toBe(3);
  });

  it("breaks the streak when a day is skipped", () => {
    const today = new Date();
    const threeDaysAgo = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);
    const fourDaysAgo = new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000);
    // Streak A: 4 and 3 days ago (length 2)
    // Streak B: today (length 1, current)
    const { current, longest } = computeStreaks([
      fourDaysAgo,
      threeDaysAgo,
      today,
    ]);
    expect(longest).toBe(2);
    expect(current).toBe(1);
  });

  it("current streak stays alive when today has no completion but yesterday does", () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const { current, longest } = computeStreaks([twoDaysAgo, yesterday]);
    // Current streak: 2 (yesterday and 2 days ago) — today gets a grace pass
    expect(current).toBe(2);
    expect(longest).toBe(2);
  });

  it("treats multiple completions on the same day as one day", () => {
    const today = new Date();
    // FIX: Using the same date twice prevents the test from failing if run right before midnight.
    const { current, longest } = computeStreaks([today, new Date(today.getTime())]);
    expect(current).toBe(1);
    expect(longest).toBe(1);
  });
});

// ─── integration: getProductivitySummary ──────────────────────────────────────

describe("getProductivitySummary", () => {
  const seedTaskCompletion = async (
    userId: string,
    completedAt: Date,
  ) => {
    const task = await Task.create({
      title: `task-${Math.random().toString(36).slice(2, 8)}`,
      description: "",
      created_by: userId,
      priority: "Medium",
      status: "Completed",
    });
    await TaskAssignment.create({
      task_id: task._id,
      assigned_to: userId,
    });
    await TaskStatusHistory.create({
      task_id: task._id,
      updated_by: userId,
      previous_status: "Under Review",
      new_status: "Completed",
      timestamp: completedAt,
    });
    return task;
  };

  it("returns a summary with zeros for a fresh user", async () => {
    const dept = await makeDepartment();
    const user = await makeUser({
      departments: [{ department_id: dept._id, department_role: "Intern" }],
    });

    const summary = await getProductivitySummary(String(user._id));

    expect(summary.user.first_name).toBe(user.first_name);
    expect(summary.week.hours_worked).toBe(0);
    expect(summary.week.tasks_completed).toBe(0);
    expect(summary.week.days_clocked_in).toBe(0);
    expect(summary.streak.current_days).toBe(0);
    expect(summary.streak.longest_days).toBe(0);
    expect(summary.recent_completions).toEqual([]);
  });

  it("counts hours_worked from DTR records inside the current week", async () => {
    const dept = await makeDepartment();
    const user = await makeUser({
      departments: [{ department_id: dept._id, department_role: "Intern" }],
    });

    // Two days in the current ISO week, with 4h and 3.5h totals
    const weekStart = startOfPHISOWeek(new Date());
    const day1 = new Date(weekStart.getTime() + 24 * 60 * 60 * 1000); // Tue
    const day2 = new Date(weekStart.getTime() + 2 * 24 * 60 * 60 * 1000); // Wed
    await DTR.create({
      userId: user._id,
      departmentId: dept._id,
      date: day1,
      totalHours: 4,
      clocks: [],
    });
    await DTR.create({
      userId: user._id,
      departmentId: dept._id,
      date: day2,
      totalHours: 3.5,
      clocks: [],
    });

    // A DTR outside the week with 8h — should NOT count
    const lastWeek = new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    await DTR.create({
      userId: user._id,
      departmentId: dept._id,
      date: lastWeek,
      totalHours: 8,
      clocks: [],
    });

    const summary = await getProductivitySummary(String(user._id));
    expect(summary.week.hours_worked).toBe(7.5);
    expect(summary.week.days_clocked_in).toBe(2);
  });

  it("returns recent_completions sorted newest first", async () => {
    const dept = await makeDepartment();
    const user = await makeUser({
      departments: [{ department_id: dept._id, department_role: "Intern" }],
    });

    const oldest = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    const middle = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const newest = new Date();

    await seedTaskCompletion(String(user._id), oldest);
    await seedTaskCompletion(String(user._id), middle);
    await seedTaskCompletion(String(user._id), newest);

    const summary = await getProductivitySummary(String(user._id));
    expect(summary.recent_completions).toHaveLength(3);
    const timestamps = summary.recent_completions.map((r) =>
      new Date(r.completed_at).getTime(),
    );
    expect(timestamps[0]).toBeGreaterThan(timestamps[1]);
    expect(timestamps[1]).toBeGreaterThan(timestamps[2]);
  });

  it("computes streak from completion history (3 consecutive days)", async () => {
    const dept = await makeDepartment();
    const user = await makeUser({
      departments: [{ department_id: dept._id, department_role: "Intern" }],
    });

    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);

    await seedTaskCompletion(String(user._id), twoDaysAgo);
    await seedTaskCompletion(String(user._id), yesterday);
    await seedTaskCompletion(String(user._id), today);

    const summary = await getProductivitySummary(String(user._id));
    expect(summary.streak.current_days).toBe(3);
    expect(summary.streak.longest_days).toBe(3);
  });

  it("throws when the user does not exist", async () => {
    await expect(
      getProductivitySummary("000000000000000000000000"),
    ).rejects.toThrow(/not found/i);
  });
});