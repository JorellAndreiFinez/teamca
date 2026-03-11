import type { Request, Response } from 'express';
import {
  activateWhitelistedUser,
  createWhitelistedUser,
  getAllUsers,
  getUserById,
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
    const user = await updateUser(getUserIdParam(req), req.body);
    return res.status(200).json(user);
  } catch (error) {
    if (error instanceof Error && error.message === 'User not found.') {
      return res.status(404).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Failed to update user.', error });
  }
};

export default {
  listUsers,
  getUser,
  whitelistUserEmail,
  activateUser,
  updateUserById,
};
