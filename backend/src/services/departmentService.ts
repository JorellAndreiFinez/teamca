import mongoose from "mongoose";
import Department from "../models/Department.js";
import User from "../models/User.js";

export type DepartmentRoleCounts = {
  Head: number;
  Supervisor: number;
  Intern: number;
};

const emptyRoleCounts = (): DepartmentRoleCounts => ({
  Head: 0,
  Supervisor: 0,
  Intern: 0,
});

const attachMemberCounts = async <T extends { _id: any }>(
  departments: T[],
): Promise<(T & { member_count: number; role_counts: DepartmentRoleCounts })[]> => {
  if (departments.length === 0) return [];

  const ids = departments.map((d) => d._id);
  const counts = await User.aggregate([
    { $unwind: "$departments" },
    { $match: { "departments.department_id": { $in: ids } } },
    {
      $group: {
        _id: {
          dept: "$departments.department_id",
          role: "$departments.department_role",
        },
        count: { $sum: 1 },
      },
    },
  ]);

  const breakdown = new Map<string, DepartmentRoleCounts>();
  for (const row of counts) {
    const deptKey = String(row._id.dept);
    const bucket = breakdown.get(deptKey) ?? emptyRoleCounts();
    const role = row._id.role as keyof DepartmentRoleCounts;
    if (role in bucket) {
      bucket[role] += row.count;
    }
    breakdown.set(deptKey, bucket);
  }

  return departments.map((d) => {
    const role_counts = breakdown.get(String(d._id)) ?? emptyRoleCounts();
    const member_count =
      role_counts.Head + role_counts.Supervisor + role_counts.Intern;
    return { ...d, member_count, role_counts };
  });
};

export const getAllDepartments = async () => {
  const departments = await Department.find()
    .populate("department_head", "user_id first_name last_name email")
    .sort({ department_name: 1 })
    .lean();
  return attachMemberCounts(departments);
};

export const getDepartmentsByIds = async (departmentIds: string[]) => {
  if (departmentIds.length === 0) {
    return [];
  }

  const departments = await Department.find({ _id: { $in: departmentIds } })
    .populate("department_head", "user_id first_name last_name email")
    .sort({ department_name: 1 })
    .lean();
  return attachMemberCounts(departments);
};

export const getDepartmentById = async (departmentId: string) => {
  const department = await Department.findById(departmentId)
    .populate("department_head", "user_id first_name last_name email")
    .lean();
  if (!department) return null;

  const [attached] = await attachMemberCounts([department]);
  return attached;
};

const syncHeadToUser = async (
  departmentId: string,
  prevHeadId: string | null,
  newHeadId: string | null,
) => {
  const samePerson =
    prevHeadId && newHeadId && String(prevHeadId) === String(newHeadId);

  if (prevHeadId && !samePerson) {
    await User.updateOne(
      { _id: prevHeadId, "departments.department_id": departmentId },
      { $set: { "departments.$.department_role": "Supervisor" } },
    );
  }

  if (!newHeadId) return;

  const newHead = await User.findById(newHeadId);
  if (!newHead) return;

  const hasMembership = newHead.departments.some(
    (d) => String(d.department_id) === String(departmentId),
  );

  if (hasMembership) {
    await User.updateOne(
      { _id: newHeadId, "departments.department_id": departmentId },
      { $set: { "departments.$.department_role": "Head" } },
    );
  } else {
    await User.updateOne(
      { _id: newHeadId },
      {
        $push: {
          departments: {
            department_id: new mongoose.Types.ObjectId(departmentId),
            department_role: "Head",
          },
        },
      },
    );
  }
};

export const createDepartment = async (
  department_name: string,
  description?: string,
  department_head?: string,
) => {
  const normalizedName = department_name.trim();
  const existing = await Department.findOne({
    department_name: normalizedName,
  });
  if (existing) {
    throw new Error("Department already exists.");
  }

  const createPayload: any = { department_name: normalizedName };

  if (description && description.trim()) {
    createPayload.description = description.trim();
  }

  if (department_head) {
    const user = await User.findById(department_head);
    if (!user) {
      throw new Error("Selected department head user not found.");
    }
    createPayload.department_head = department_head;
  }

  const created = await Department.create(createPayload);

  if (department_head) {
    await syncHeadToUser(String(created._id), null, department_head);
  }

  return created;
};

export const updateDepartment = async (
  departmentId: string,
  updates: {
    department_name?: string;
    description?: string;
    department_head?: string | null;
  },
) => {
  const department = await Department.findById(departmentId);
  if (!department) {
    throw new Error("Department not found.");
  }

  if (updates.department_name) {
    const normalizedName = updates.department_name.trim();
    const existing = await Department.findOne({
      department_name: normalizedName,
      _id: { $ne: departmentId },
    });
    if (existing) {
      throw new Error("A department with this name already exists.");
    }
    department.department_name = normalizedName;
  }

  if (updates.description !== undefined) {
    department.description = updates.description
      ? updates.description.trim()
      : null;
  }

  let pendingSync: { prevHeadId: string | null; newHeadId: string | null } | null = null;

  if (updates.department_head !== undefined) {
    const prevHeadId = department.department_head
      ? String(department.department_head)
      : null;
    const newHeadId = updates.department_head || null;

    if (newHeadId) {
      const user = await User.findById(newHeadId);
      if (!user) {
        throw new Error("Selected department head user not found.");
      }
      department.department_head = newHeadId as any;
    } else {
      department.department_head = null;
    }

    pendingSync = { prevHeadId, newHeadId };
  }

  const saved = await department.save();

  if (pendingSync) {
    await syncHeadToUser(departmentId, pendingSync.prevHeadId, pendingSync.newHeadId);
  }

  return saved;
};

export const deleteDepartment = async (departmentId: string) => {
  const department = await Department.findById(departmentId);
  if (!department) {
    throw new Error("Department not found.");
  }

  const usersInDepartment = await User.countDocuments({
    "departments.department_id": departmentId,
  });

  if (usersInDepartment > 0) {
    throw new Error(
      `Cannot delete department with ${usersInDepartment} existing member(s). Please reassign or remove all members first.`,
    );
  }

  return Department.findByIdAndDelete(departmentId);
};

export default {
  getAllDepartments,
  getDepartmentsByIds,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};
