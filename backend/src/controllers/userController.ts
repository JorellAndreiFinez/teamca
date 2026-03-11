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

const getUserIdParam = (req: Request): string => {
  const rawUserId = req.params.userId;
  return Array.isArray(rawUserId) ? rawUserId[0] : rawUserId;
};

export const listUsers = async (_req: Request, res: Response) => {
  try {
    const users = await getAllUsers();
    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to list users.', error });
  }
};

export const getUser = async (req: Request, res: Response) => {
  try {
    const user = await getUserById(getUserIdParam(req));
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch user.', error });
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

    return res.status(500).json({ message: 'Failed to whitelist email.', error });
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

    return res.status(500).json({ message: 'Failed to create user.', error });
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

    return res.status(500).json({ message: 'Failed to activate user.', error });
  }
};

// make sure control is only accessible by superadmin or the user themselves
export const updateUserById = async (req: Request, res: Response) => {
  try {
    const payload = req.body as {
      first_name?: string;
      last_name?: string;
      password?: string;
      global_role?: 'Superadmin' | 'Admin' | 'Standard_User';
      departments?: Array<{ department_id: string; department_role: 'Head' | 'Supervisor' | 'Intern' }>;
      is_active?: boolean;
    };

    let password_hash: string | undefined;
    if (payload.password) {
      password_hash = await bcrypt.hash(payload.password, 10);
    }

    const user = await updateUser(getUserIdParam(req), {
      ...payload,
      password_hash,
    });
    return res.status(200).json(user);
  } catch (error) {
    if (error instanceof Error && error.message === 'User not found.') {
      return res.status(404).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Failed to update user.', error });
  }
};

export const upsertInternProfileByUserId = async (req: Request, res: Response) => {
  try {
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

    const updatedUser = await upsertUserInternProfile(getUserIdParam(req), {
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

    return res.status(500).json({ message: 'Failed to upsert intern profile.', error });
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
