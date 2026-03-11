import Department from '../models/Department';

export const getAllDepartments = async () => {
  return Department.find().sort({ department_name: 1 }).lean();
};

export const getDepartmentById = async (departmentId: string) => {
  return Department.findById(departmentId).lean();
};

export const createDepartment = async (department_name: string) => {
  const normalizedName = department_name.trim();
  const existing = await Department.findOne({ department_name: normalizedName });
  if (existing) {
    throw new Error('Department already exists.');
  }

  return Department.create({ department_name: normalizedName });
};

export const updateDepartment = async (departmentId: string, department_name: string) => {
  const department = await Department.findById(departmentId);
  if (!department) {
    throw new Error('Department not found.');
  }

  department.department_name = department_name.trim();
  return department.save();
};