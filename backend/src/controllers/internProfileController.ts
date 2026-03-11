import type { Request, Response } from 'express';
import {
  createInternProfile,
  getInternProfileByUserId,
  updateInternProfileByUserId,
} from '../services/internProfileService';

const getUserIdParam = (req: Request): string => {
  const raw = req.params.userId;
  return Array.isArray(raw) ? raw[0] : raw;
};

export const getInternProfileByUser = async (req: Request, res: Response) => {
  try {
    const profile = await getInternProfileByUserId(getUserIdParam(req));
    if (!profile) {
      return res.status(404).json({ message: 'Intern profile not found.' });
    }

    return res.status(200).json(profile);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch intern profile.', error });
  }
};

export const createInternProfileHandler = async (req: Request, res: Response) => {
  try {
    const payload = req.body as {
      user_id?: string;
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

    if (!payload.user_id || !(payload.school || payload.school_university) || !payload.required_hours || !payload.expected_end_date) {
      return res.status(400).json({
        message: 'user_id, school, required_hours, and expected_end_date are required.',
      });
    }

    const created = await createInternProfile({
      user_id: payload.user_id,
      school: payload.school ?? payload.school_university ?? '',
      required_hours: payload.required_hours,
      rendered_hours_total: payload.rendered_hours_total,
      expected_end_date: new Date(payload.expected_end_date),
      actual_end_date: actualEndDate,
    });

    return res.status(201).json(created);
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === 'User not found.' || error.message === 'Intern profile already exists.')
    ) {
      return res.status(409).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Failed to create intern profile.', error });
  }
};

export const updateInternProfileByUser = async (req: Request, res: Response) => {
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

    const updated = await updateInternProfileByUserId(getUserIdParam(req), {
      school: payload.school ?? payload.school_university,
      required_hours: payload.required_hours,
      rendered_hours_total: payload.rendered_hours_total,
      expected_end_date: payload.expected_end_date ? new Date(payload.expected_end_date) : undefined,
      actual_end_date: actualEndDate,
    });

    return res.status(200).json(updated);
  } catch (error) {
    if (error instanceof Error && error.message === 'Intern profile not found.') {
      return res.status(404).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Failed to update intern profile.', error });
  }
};

export default {
  getInternProfileByUser,
  createInternProfileHandler,
  updateInternProfileByUser,
};