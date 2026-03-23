import type { Request, Response } from 'express';
import { checkEmail, completeSetup, login, logout } from '../services/authService';

export const checkEmailHandler = async (req: Request, res: Response) => {
  try {
    const { email } = req.body as { email?: string };
    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const result = await checkEmail(email);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to check email.' });
  }
};

export const loginHandler = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const result = await login({ email, password });
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error && (error.message === 'Invalid credentials.' || error.message === 'Account setup is incomplete.')) {
      return res.status(401).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Failed to login.' });
  }
};

export const completeSetupHandler = async (req: Request, res: Response) => {
  try {
    const payload = req.body as {
      email?: string;
      first_name?: string;
      last_name?: string;
      password?: string;
      department_id?: string;
      school_university?: string;
      required_hours?: number;
    };

    if (!payload.email || !payload.first_name || !payload.last_name || !payload.password) {
      return res.status(400).json({
        message: 'email, first_name, last_name, and password are required.',
      });
    }

    const result = await completeSetup({
      email: payload.email,
      first_name: payload.first_name,
      last_name: payload.last_name,
      password: payload.password,
      department_id: payload.department_id,
      school_university: payload.school_university,
      required_hours: payload.required_hours,
    });

    return res.status(200).json(result);
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === 'Email is not whitelisted.' || error.message === 'Account is already active.')
    ) {
      return res.status(409).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Failed to complete setup.' });
  }
};

export const logoutHandler = async (_req: Request, res: Response) => {
  try {
    const result = await logout();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to logout.' });
  }
};

export default {
  checkEmailHandler,
  loginHandler,
  completeSetupHandler,
  logoutHandler,
};