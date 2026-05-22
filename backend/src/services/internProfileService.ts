import mongoose from "mongoose";
import InternProfile from "../models/InternProfile.js";
import DTR from "../models/DTR.js";
import User from "../models/User.js";

export type InternProfilePayload = {
  user_id: string;
  school_university: string;
  required_hours: number;
  rendered_hours_total?: number;
  actual_end_date?: Date | null;
};

export const getInternProfileByUserId = async (userId: string) => {
  return InternProfile.findOne({ user_id: userId }).lean();
};

export const syncRenderedHours = async (userId: string): Promise<void> => {
  const result = await DTR.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        status: { $ne: "rejected" },
        totalHours: { $gt: 0 },
      },
    },
    {
      $group: {
        _id: null,
        renderedHours: { $sum: "$totalHours" },
        daysWorked: { $sum: 1 },
      },
    },
  ]);

  const renderedHours = parseFloat((result[0]?.renderedHours ?? 0).toFixed(2));
  const daysWorked = result[0]?.daysWorked ?? 0;

  await InternProfile.findOneAndUpdate(
    { user_id: userId },
    { rendered_hours_total: renderedHours, days_worked: daysWorked },
  );
};

export const createInternProfile = async (payload: InternProfilePayload) => {
  const user = await User.findById(payload.user_id);
  if (!user) {
    throw new Error("User not found.");
  }

  const existing = await InternProfile.findOne({ user_id: payload.user_id });
  if (existing) {
    throw new Error("Intern profile already exists.");
  }

  return InternProfile.create({
    user_id: payload.user_id,
    school_university: payload.school_university,
    required_hours: payload.required_hours,
    rendered_hours_total: payload.rendered_hours_total ?? 0,
    actual_end_date: payload.actual_end_date ?? null,
  });
};

export const updateInternProfileByUserId = async (
  userId: string,
  payload: Partial<Omit<InternProfilePayload, "user_id">>,
) => {
  const profile = await InternProfile.findOne({ user_id: userId });
  if (!profile) {
    throw new Error("Intern profile not found.");
  }

  if (typeof payload.school_university !== "undefined") {
    profile.school_university = payload.school_university;
  }
  if (typeof payload.required_hours !== "undefined") {
    profile.required_hours = payload.required_hours;
  }
  if (typeof payload.rendered_hours_total !== "undefined") {
    profile.rendered_hours_total = payload.rendered_hours_total;
  }
  if (typeof payload.actual_end_date !== "undefined") {
    profile.actual_end_date = payload.actual_end_date;
  }

  return profile.save();
};
