import User from '../models/User';
import InternProfile from '../models/InternProfile';

const SAFE_USER_SELECT = '-password_hash';

type GlobalRole = 'Superadmin' | 'Admin' | 'Standard_User';
type DepartmentRole = 'Head' | 'Supervisor' | 'Intern';

export type CreateWhitelistedUserInput = {
  email: string;
};

export type ActivateWhitelistedUserInput = {
  first_name: string;
  last_name: string;
  password_hash: string;
  global_role: GlobalRole;
  department_id?: string;
  department_role?: DepartmentRole;
};

export type UpdateUserInput = {
  first_name?: string;
  last_name?: string;
  password_hash?: string;
  global_role?: GlobalRole;
  department_id?: string;
  department_role?: DepartmentRole;
  is_active?: boolean;
};

export type CreateUserInput = {
  first_name: string;
  last_name: string;
  email: string;
  password_hash: string;
  global_role: GlobalRole;
  department_id?: string;
  department_role?: DepartmentRole;
  is_active?: boolean;
};

export type UpsertInternProfileInput = {
  school?: string;
  required_hours?: number;
  rendered_hours_total?: number;
  expected_end_date?: Date;
  actual_end_date?: Date | null;
};

export const getAllUsers = async () => {
  return User.find().select(SAFE_USER_SELECT).sort({ createdAt: -1 }).lean();
};

export const getUserById = async (userId: string) => {
  const user = await User.findById(userId).select(SAFE_USER_SELECT).lean();
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

  const created = await User.create({
    email,
    is_active: false,
    first_name: '',
    last_name: '',
    password_hash: '',
    global_role: 'Standard_User',
  });

  return getUserById(String(created._id));
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
  if (typeof payload.department_id !== 'undefined') {
    user.department_id = payload.department_id;
  }
  if (typeof payload.department_role !== 'undefined') {
    user.department_role = payload.department_role;
  }
  user.is_active = true;

  await user.save();
  return getUserById(String(user._id));
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
    department_id: payload.department_id,
    department_role: payload.department_role,
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
  if (typeof payload.department_id !== 'undefined') {
    user.department_id = payload.department_id;
  }
  if (typeof payload.department_role !== 'undefined') {
    user.department_role = payload.department_role;
  }
  if (typeof payload.is_active !== 'undefined') {
    user.is_active = payload.is_active;
  }

  await user.save();
  return getUserById(String(user._id));
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