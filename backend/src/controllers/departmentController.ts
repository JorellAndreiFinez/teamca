import type { Request, Response } from 'express';
import {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
} from '../services/departmentService';

const getDepartmentIdParam = (req: Request): string => {
  const raw = req.params.departmentId;
  return Array.isArray(raw) ? raw[0] : raw;
};

export const listDepartments = async (_req: Request, res: Response) => {
  try {
    const departments = await getAllDepartments();
    return res.status(200).json(departments);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to list departments.', error });
  }
};

export const getDepartment = async (req: Request, res: Response) => {
  try {
    const department = await getDepartmentById(getDepartmentIdParam(req));
    if (!department) {
      return res.status(404).json({ message: 'Department not found.' });
    }

    return res.status(200).json(department);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch department.', error });
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

    return res.status(500).json({ message: 'Failed to create department.', error });
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

    return res.status(500).json({ message: 'Failed to update department.', error });
  }
};

export default {
  listDepartments,
  getDepartment,
  createDepartmentHandler,
  updateDepartmentHandler,
};