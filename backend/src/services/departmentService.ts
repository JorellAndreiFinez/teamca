import Department from "../models/Department";
import User from "../models/User";

export const getAllDepartments = async () => {
  return Department.find()
    .populate("department_head", "user_id first_name last_name email")
    .sort({ department_name: 1 })
    .lean();
};

export const getDepartmentsByIds = async (departmentIds: string[]) => {
  if (departmentIds.length === 0) {
    return [];
  }

  return Department.find({ _id: { $in: departmentIds } })
    .populate("department_head", "user_id first_name last_name email")
    .sort({ department_name: 1 })
    .lean();
};

export const getDepartmentById = async (departmentId: string) => {
  return Department.findById(departmentId)
    .populate("department_head", "user_id first_name last_name email")
    .lean();
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
    // Verify that the user exists and is a valid head
    const user = await User.findById(department_head);
    if (!user) {
      throw new Error("Selected department head user not found.");
    }
    createPayload.department_head = department_head;
  }

  return Department.create(createPayload);
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

  if (updates.department_head !== undefined) {
    if (updates.department_head) {
      // Verify that the user exists
      const user = await User.findById(updates.department_head);
      if (!user) {
        throw new Error("Selected department head user not found.");
      }
      department.department_head = updates.department_head as any;
    } else {
      department.department_head = null;
    }
  }

  return department.save();
};

export const deleteDepartment = async (departmentId: string) => {
  const department = await Department.findById(departmentId);
  if (!department) {
    throw new Error("Department not found.");
  }

  // Check if any users belong to this department
  const usersInDepartment = await User.countDocuments({
    department_id: departmentId,
  });

  if (usersInDepartment > 0) {
    throw new Error(
      "Cannot delete department with existing members. Please reassign or remove all members first.",
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
