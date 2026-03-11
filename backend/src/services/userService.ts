import type { Types } from 'mongoose';
import User from '../models/User';
import InternProfile from '../models/InternProfile';

type GlobalRole = 'Superadmin' | 'Admin' | 'Standard_User';
type DepartmentRole = 'Head' | 'Supervisor' | 'Intern';

type DepartmentAssignment = {
  department_id: Types.ObjectId;
  department_role: DepartmentRole;
};

type DepartmentAssignmentInput = {
  department_id: string;
  department_role: DepartmentRole;
};

export type CreateWhitelistedUserInput = {
  email: string;
};

export type ActivateWhitelistedUserInput = {
  first_name: string;
  last_name: string;
  password_hash: string;
  global_role: GlobalRole;
  departments?: DepartmentAssignment[];
};

export type UpdateUserInput = {
  first_name?: string;
  last_name?: string;
  password_hash?: string;
  global_role?: GlobalRole;
  departments?: DepartmentAssignmentInput[];
  is_active?: boolean;
};

export type CreateUserInput = {
  first_name: string;
  last_name: string;
  email: string;
  password_hash: string;
  global_role: GlobalRole;
  departments?: DepartmentAssignmentInput[];
  is_active?: boolean;
};

export type UpsertInternProfileInput = {
  school?: string;
  required_hours?: number;
  rendered_hours_total?: number;
  expected_end_date?: Date;
  actual_end_date?: Date | null;
};

const toDepartmentAssignments = (departments?: DepartmentAssignmentInput[]): DepartmentAssignment[] => {
  if (!departments || departments.length === 0) {
    return [];
  }

  return departments.map((department) => ({
    department_id: department.department_id as unknown as Types.ObjectId,
    department_role: department.department_role,
  }));
};

export const getAllUsers = async () => {
  return User.find().sort({ createdAt: -1 }).lean();
};

export const getUserById = async (userId: string) => {
  const user = await User.findById(userId).lean();
  if (!user) {
    return null;
  }

  const intern_profile = await InternProfile.findOne({ user_id: user._id }).lean();
  return { ...user, intern_profile };
};

export const createWhitelistedUser = async (payload: CreateWhitelistedUserInput) => {
  const email = payload.email.trim().toLowerCase();

  const existing = await User.findOne({ email });
  if (existing) {
    throw new Error('Email already exists.');
  }

  return User.create({
    email,
    is_active: false,
    first_name: null,
    last_name: null,
    password_hash: null,
    global_role: null,
    departments: [],
  });
};

export const activateWhitelistedUser = async (userId: string, payload: ActivateWhitelistedUserInput) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found.');
  }

  user.first_name = payload.first_name;
  user.last_name = payload.last_name;
  user.password_hash = payload.password_hash;
  user.global_role = payload.global_role;
  user.set('departments', payload.departments ?? []);
  user.is_active = true;

  return user.save();
};

export const createUser = async (payload: CreateUserInput) => {
  const existing = await User.findOne({ email: payload.email.trim().toLowerCase() });
  if (existing) {
    throw new Error('Email already exists.');
  }

  const created = await User.create({
    first_name: payload.first_name,
    last_name: payload.last_name,
    email: payload.email.trim().toLowerCase(),
    password_hash: payload.password_hash,
    global_role: payload.global_role,
    is_active: payload.is_active ?? true,
    departments: toDepartmentAssignments(payload.departments),
  });

  return getUserById(String(created._id));
};

export const updateUser = async (userId: string, payload: UpdateUserInput) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found.');
  }

  if (typeof payload.first_name !== 'undefined') {
    user.first_name = payload.first_name;
  }
  if (typeof payload.last_name !== 'undefined') {
    user.last_name = payload.last_name;
  }
  if (typeof payload.password_hash !== 'undefined') {
    user.password_hash = payload.password_hash;
  }
  if (typeof payload.global_role !== 'undefined') {
    user.global_role = payload.global_role;
  }
  if (typeof payload.departments !== 'undefined') {
    user.set('departments', toDepartmentAssignments(payload.departments));
  }
  if (typeof payload.is_active !== 'undefined') {
    user.is_active = payload.is_active;
  }

  return user.save();
};

export const upsertUserInternProfile = async (userId: string, payload: UpsertInternProfileInput) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found.');
  }

  const existingProfile = await InternProfile.findOne({ user_id: user._id });

  if (!existingProfile) {
    if (!payload.school || !payload.required_hours || !payload.expected_end_date) {
      throw new Error('school, required_hours, and expected_end_date are required for new intern profiles.');
    }

    await InternProfile.create({
      user_id: user._id,
      school: payload.school,
      required_hours: payload.required_hours,
      rendered_hours_total: payload.rendered_hours_total ?? 0,
      expected_end_date: payload.expected_end_date,
      actual_end_date: payload.actual_end_date ?? null,
    });
  } else {
    if (typeof payload.school !== 'undefined') {
      existingProfile.school = payload.school;
    }
    if (typeof payload.required_hours !== 'undefined') {
      existingProfile.required_hours = payload.required_hours;
    }
    if (typeof payload.rendered_hours_total !== 'undefined') {
      existingProfile.rendered_hours_total = payload.rendered_hours_total;
    }
    if (typeof payload.expected_end_date !== 'undefined') {
      existingProfile.expected_end_date = payload.expected_end_date;
    }
    if (typeof payload.actual_end_date !== 'undefined') {
      existingProfile.actual_end_date = payload.actual_end_date;
    }

    await existingProfile.save();
  }

  return getUserById(String(user._id));
};