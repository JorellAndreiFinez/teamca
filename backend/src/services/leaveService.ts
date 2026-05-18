// backend\src\services\leaveService.ts

import Leave, { ILeave } from "../models/Leave";
import User from "../models/User";

export const createLeave = async (userId: string, data: Partial<ILeave>) => {
  const user = await User.findById(userId);

  if (!user || !user.departments || user.departments.length === 0) {
    throw new Error("User is not assigned to any department");
  }

  const rawDepartmentId = user.departments[0].department_id;

  /**
   * FIX: normalize string | string[] → string
   */
  const departmentId = Array.isArray(rawDepartmentId)
    ? rawDepartmentId[0]
    : rawDepartmentId;

  if (!departmentId) {
    throw new Error("Invalid department ID");
  }

  const leave = await Leave.create({
    userId,
    departmentId,
    type: "Professional",
    duration: data.duration,
    startDate: data.startDate,
    endDate: data.endDate,
    reason: data.reason,
    status: "pending",
  });

  return leave;
};

export const getUserLeaves = async (userId: string) => {
  return await Leave.find({ userId }).sort({ createdAt: -1 });
};

export const getDepartmentLeaves = async (departmentId: string) => {
  return await Leave.find({ departmentId }).sort({ createdAt: -1 });
};

export const updateLeaveStatus = async (
  leaveId: string,
  status: "approved" | "rejected",
) => {
  const leave = await Leave.findById(leaveId);
  if (!leave) throw new Error("Leave not found");

  if (leave.status === "cancelled") {
    throw new Error("Cannot update a cancelled leave");
  }

  if (leave.status !== "pending") {
    throw new Error("Only pending leaves can be updated");
  }

  leave.status = status;
  await leave.save();

  return leave;
};

export const cancelLeave = async (userId: string, leaveId: string) => {
  const leave = await Leave.findById(leaveId);
  const user = await User.findById(userId);

  if (!leave) throw new Error("Leave not found");

  const isOwner = leave.userId.toString() === userId.toString();
  const isAdmin = user?.global_role === "Admin";

  if (!isOwner && !isAdmin) {
    throw new Error("Not authorized to cancel this leave");
  }

  if (leave.status === "cancelled") {
    throw new Error("Leave is already cancelled");
  }

  leave.status = "cancelled";
  await leave.save();

  return leave;
};
