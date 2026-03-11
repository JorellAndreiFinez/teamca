import type { Types } from 'mongoose';
import User from '../models/User';
import InternProfile from '../models/InternProfile';

type GlobalRole = 'Superadmin' | 'Admin' | 'Standard_User';
type DepartmentRole = 'Head' | 'Supervisor' | 'Intern';

type DepartmentAssignment = {
  department_id: Types.ObjectId;
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
  global_role?: GlobalRole;
  departments?: DepartmentAssignment[];
  is_active?: boolean;
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
  if (typeof payload.global_role !== 'undefined') {
    user.global_role = payload.global_role;
  }
  if (typeof payload.departments !== 'undefined') {
    user.set('departments', payload.departments);
  }
  if (typeof payload.is_active !== 'undefined') {
    user.is_active = payload.is_active;
  }

  return user.save();
};