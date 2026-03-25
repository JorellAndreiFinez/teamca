import type { Request, Response } from 'express';
import {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  getDepartmentsByIds,
  updateDepartment,
} from '../services/departmentService';

const getDepartmentIdParam = (req: Request): string => {
  const raw = req.params.departmentId;
  return Array.isArray(raw) ? raw[0] : raw;
};

export const listDepartments = async (_req: Request, res: Response) => {
  try {
    const reqUser = _req.user;

    // Unauthenticated (e.g. first-time setup form) — return all departments
    if (!reqUser) {
      const departments = await getAllDepartments();
      return res.status(200).json(departments);
    }

    if (reqUser.global_role === 'Superadmin' || reqUser.global_role === 'Admin') {
      const departments = await getAllDepartments();
      return res.status(200).json(departments);
    }

    const departmentIds = reqUser.department_id ? [String(reqUser.department_id)] : [];
    const departments = await getDepartmentsByIds(departmentIds);
    return res.status(200).json(departments);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to list departments.' });
  }
};

export const getDepartment = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const requestedDepartmentId = getDepartmentIdParam(req);
    const department = await getDepartmentById(requestedDepartmentId);
    if (!department) {
      return res.status(404).json({ message: 'Department not found.' });
    }

    if (req.user.global_role === 'Superadmin' || req.user.global_role === 'Admin') {
      return res.status(200).json(department);
    }

    const hasDepartmentAccess =
      typeof req.user.department_id !== 'undefined' &&
      String(req.user.department_id) === requestedDepartmentId;

    if (!hasDepartmentAccess) {
      return res.status(403).json({ message: 'Insufficient permissions to view this department.' });
    }

    return res.status(200).json(department);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch department.' });
  }
};

export const createDepartmentHandler = async (req: Request, res: Response) => {
  try {
    const { department_name } = req.body as { department_name?: string };
    if (!department_name) {
      return res.status(400).json({ message: 'department_name is required.' });
    }

    const created = await createDepartment(department_name);
    return res.status(201).json(created);
  } catch (error) {
    if (error instanceof Error && error.message === 'Department already exists.') {
      return res.status(409).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Failed to create department.' });
  }
};

export const updateDepartmentHandler = async (req: Request, res: Response) => {
  try {
    const { department_name } = req.body as { department_name?: string };
    if (!department_name) {
      return res.status(400).json({ message: 'department_name is required.' });
    }

    const updated = await updateDepartment(getDepartmentIdParam(req), department_name);
    return res.status(200).json(updated);
  } catch (error) {
    if (error instanceof Error && error.message === 'Department not found.') {
      return res.status(404).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Failed to update department.' });
  }
};

export default {
  listDepartments,
  getDepartment,
  createDepartmentHandler,
  updateDepartmentHandler,
};