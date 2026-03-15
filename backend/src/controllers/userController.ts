import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import {
  activateWhitelistedUser,
  createUser,
  createWhitelistedUser,
  getAllUsers,
  getUserById,
  upsertUserInternProfile,
  updateUser,
} from '../services/userService';
import { hasDepartmentRoleIn, hasSharedDepartment, isSameUser } from '../middleware/rbac';

const getUserIdParam = (req: Request): string => {
  const rawUserId = req.params.userId;
  return Array.isArray(rawUserId) ? rawUserId[0] : rawUserId;
};

export const listUsers = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const users = await getAllUsers();
    if (req.user.global_role === 'Superadmin' || req.user.global_role === 'Admin') {
      return res.status(200).json(users);
    }

    const requesterId = String(req.user.user_id);
    const requesterCanViewTeam = hasDepartmentRoleIn(req.user, ['Head', 'Supervisor']);

    if (!requesterCanViewTeam) {
      const ownUser = users.filter((user) => String(user._id) === requesterId);
      return res.status(200).json(ownUser);
    }

    const scopedUsers = users.filter((user) => hasSharedDepartment(req.user!, user.departments ?? []));
    return res.status(200).json(scopedUsers);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to list users.' });
  }
};

export const getUser = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const user = await getUserById(getUserIdParam(req));
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (req.user.global_role === 'Superadmin' || req.user.global_role === 'Admin') {
      return res.status(200).json(user);
    }

    const targetUserId = String(user._id);
    if (isSameUser(req.user, targetUserId)) {
      return res.status(200).json(user);
    }

    const requesterCanViewTeam = hasDepartmentRoleIn(req.user, ['Head', 'Supervisor']);
    if (requesterCanViewTeam && hasSharedDepartment(req.user, user.departments ?? [])) {
      return res.status(200).json(user);
    }

    return res.status(403).json({ message: 'Insufficient permissions to view this user.' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch user.' });
  }
};

export const whitelistUserEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.body as { email?: string };
    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const user = await createWhitelistedUser({ email });
    return res.status(201).json({ message: 'Email whitelisted successfully.', user });
  } catch (error) {
    if (error instanceof Error && error.message === 'Email already exists.') {
      return res.status(409).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Failed to whitelist email.' });
  }
};

export const createUserHandler = async (req: Request, res: Response) => {
  try {
    const {
      first_name,
      last_name,
      email,
      password,
      global_role,
      departments,
      is_active,
    } = req.body as {
      first_name?: string;
      last_name?: string;
      email?: string;
      password?: string;
      global_role?: 'Superadmin' | 'Admin' | 'Standard_User';
      departments?: Array<{ department_id: string; department_role: 'Head' | 'Supervisor' | 'Intern' }>;
      is_active?: boolean;
    };

    if (!first_name || !last_name || !email || !password || !global_role) {
      return res.status(400).json({ message: 'first_name, last_name, email, password, and global_role are required.' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const created = await createUser({
      first_name,
      last_name,
      email,
      password_hash,
      global_role,
      departments,
      is_active,
    });

    return res.status(201).json(created);
  } catch (error) {
    if (error instanceof Error && error.message === 'Email already exists.') {
      return res.status(409).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Failed to create user.' });
  }
};

export const activateUser = async (req: Request, res: Response) => {
  try {
    const user = await activateWhitelistedUser(getUserIdParam(req), req.body);
    return res.status(200).json(user);
  } catch (error) {
    if (error instanceof Error && error.message === 'User not found.') {
      return res.status(404).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Failed to activate user.' });
  }
};

// make sure control is only accessible by superadmin or the user themselves
export const updateUserById = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const targetUserId = getUserIdParam(req);
    const targetUser = await getUserById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const isSelfUpdate = isSameUser(req.user, targetUserId);
    const isSuperadmin = req.user.global_role === 'Superadmin';
    const isAdmin = req.user.global_role === 'Admin';
    const canManageTeam = hasDepartmentRoleIn(req.user, ['Head', 'Supervisor']);
    const sharesDepartment = hasSharedDepartment(req.user, targetUser.departments ?? []);

    const canAccessTarget =
      isSuperadmin || isAdmin || isSelfUpdate || (canManageTeam && sharesDepartment);

    if (!canAccessTarget) {
      return res.status(403).json({ message: 'Insufficient permissions to update this user.' });
    }

    const payload = req.body as {
      first_name?: string;
      last_name?: string;
      password?: string;
      global_role?: 'Superadmin' | 'Admin' | 'Standard_User';
      departments?: Array<{ department_id: string; department_role: 'Head' | 'Supervisor' | 'Intern' }>;
      is_active?: boolean;
    };

    const attemptsPrivilegedChanges =
      typeof payload.global_role !== 'undefined' ||
      typeof payload.departments !== 'undefined' ||
      typeof payload.is_active !== 'undefined';

    if (!isSuperadmin && attemptsPrivilegedChanges) {
      return res.status(403).json({ message: 'Only superadmin can change roles, departments, or account status.' });
    }

    if (!isSelfUpdate && payload.password && !isSuperadmin) {
      return res.status(403).json({ message: 'Only superadmin can reset passwords for other users.' });
    }

    let password_hash: string | undefined;
    if (payload.password) {
      password_hash = await bcrypt.hash(payload.password, 10);
    }

    const user = await updateUser(targetUserId, {
      ...payload,
      password_hash,
    });
    return res.status(200).json(user);
  } catch (error) {
    if (error instanceof Error && error.message === 'User not found.') {
      return res.status(404).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Failed to update user.' });
  }
};

export const upsertInternProfileByUserId = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const targetUserId = getUserIdParam(req);
    const targetUser = await getUserById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const isSuperadmin = req.user.global_role === 'Superadmin';
    const isAdmin = req.user.global_role === 'Admin';
    const isSelf = isSameUser(req.user, targetUserId);
    const canManageTeam = hasDepartmentRoleIn(req.user, ['Head', 'Supervisor']);
    const sharesDepartment = hasSharedDepartment(req.user, targetUser.departments ?? []);

    if (!isSuperadmin && !isAdmin && !isSelf && !(canManageTeam && sharesDepartment)) {
      return res.status(403).json({ message: 'Insufficient permissions to update this intern profile.' });
    }

    const payload = req.body as {
      school?: string;
      school_university?: string;
      required_hours?: number;
      rendered_hours_total?: number;
      expected_end_date?: string;
      actual_end_date?: string | null;
    };

    let actualEndDate: Date | null | undefined;
    if (payload.actual_end_date === null) {
      actualEndDate = null;
    } else if (typeof payload.actual_end_date === 'string') {
      actualEndDate = new Date(payload.actual_end_date);
    }

    const updatedUser = await upsertUserInternProfile(targetUserId, {
      school: payload.school ?? payload.school_university,
      required_hours: payload.required_hours,
      rendered_hours_total: payload.rendered_hours_total,
      expected_end_date: payload.expected_end_date ? new Date(payload.expected_end_date) : undefined,
      actual_end_date: actualEndDate,
    });

    return res.status(200).json(updatedUser);
  } catch (error) {
    if (error instanceof Error && error.message === 'User not found.') {
      return res.status(404).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Failed to upsert intern profile.' });
  }
};

export default {
  listUsers,
  getUser,
  createUserHandler,
  whitelistUserEmail,
  activateUser,
  updateUserById,
  upsertInternProfileByUserId,
};
