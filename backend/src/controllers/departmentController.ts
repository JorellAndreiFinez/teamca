import type { Request, Response } from "express";
import {
  createDepartment,
  deleteDepartment,
  getAllDepartments,
  getDepartmentById,
  getDepartmentMembers,
  getDepartmentsByIds,
  updateDepartment,
} from "../services/departmentService.js";
import {
  compactActivityChanges,
  logActivityForRequest,
  optionalActivityText,
  safeActivityText,
} from "../utils/activityLogPayload.js";

const getDepartmentIdParam = (req: Request): string => {
  const raw = req.params.departmentId;
  return Array.isArray(raw) ? raw[0] : raw;
};

const asActivityRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const getEntityActivityId = (value: unknown): string | undefined => {
  const record = asActivityRecord(value);
  return optionalActivityText(record._id) ?? optionalActivityText(value);
};

const getDepartmentActivitySnapshot = (
  department: unknown,
): Record<string, unknown> => {
  const record = asActivityRecord(department);
  return compactActivityChanges({
    department_id: optionalActivityText(record._id),
    department_name: optionalActivityText(record.department_name),
    description: optionalActivityText(record.description),
    department_head: getEntityActivityId(record.department_head),
  });
};

const getDepartmentActivityName = (
  department: unknown,
  fallback: string,
): string => {
  const record = asActivityRecord(department);
  return safeActivityText(record.department_name, fallback);
};

export const listDepartments = async (_req: Request, res: Response) => {
  try {
    const reqUser = _req.user;

    // Unauthenticated (e.g. first-time setup form) — return all departments
    if (!reqUser) {
      const departments = await getAllDepartments();
      return res.status(200).json(departments);
    }

    if (
      reqUser.global_role === "Superadmin" ||
      reqUser.global_role === "Admin"
    ) {
      const departments = await getAllDepartments();
      return res.status(200).json(departments);
    }

    const departmentIds = reqUser.department_id
      ? [String(reqUser.department_id)]
      : [];
    const departments = await getDepartmentsByIds(departmentIds);
    return res.status(200).json(departments);
  } catch (error) {
    return res.status(500).json({ message: error });
  }
};

export const getDepartment = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const requestedDepartmentId = getDepartmentIdParam(req);
    const department = await getDepartmentById(requestedDepartmentId);
    if (!department) {
      return res.status(404).json({ message: "Department not found." });
    }

    if (
      req.user.global_role === "Superadmin" ||
      req.user.global_role === "Admin"
    ) {
      return res.status(200).json(department);
    }

    const hasDepartmentAccess =
      typeof req.user.department_id !== "undefined" &&
      String(req.user.department_id) === requestedDepartmentId;

    if (!hasDepartmentAccess) {
      return res
        .status(403)
        .json({ message: "Insufficient permissions to view this department." });
    }

    return res.status(200).json(department);
  } catch (error) {
    return res.status(500).json({ message: error });
  }
};

export const listDepartmentMembersHandler = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const departmentId = getDepartmentIdParam(req);

    const isPrivileged =
      req.user.global_role === "Superadmin" || req.user.global_role === "Admin";
    const isMemberOfDept =
      typeof req.user.department_id !== "undefined" &&
      String(req.user.department_id) === departmentId;

    if (!isPrivileged && !isMemberOfDept) {
      return res
        .status(403)
        .json({ message: "Insufficient permissions to view this department." });
    }

    const role = req.query.role ? String(req.query.role) : undefined;
    const allowedRoles = ["Head", "Supervisor", "Intern"];
    const normalizedRole =
      role && allowedRoles.includes(role)
        ? (role as "Head" | "Supervisor" | "Intern")
        : null;

    const result = await getDepartmentMembers(departmentId, {
      page: req.query.page ? Number(req.query.page) : undefined,
      pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
      search: req.query.search ? String(req.query.search) : undefined,
      role: normalizedRole,
    });

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: error });
  }
};

export const createDepartmentHandler = async (req: Request, res: Response) => {
  try {
    const { department_name, description, department_head } = req.body as {
      department_name?: string;
      description?: string;
      department_head?: string;
    };

    if (!department_name) {
      return res.status(400).json({ message: "department_name is required." });
    }

    const created = await createDepartment(
      department_name,
      description,
      department_head,
    );
    const departmentId = safeActivityText(created._id, "new-department");
    await logActivityForRequest(req, {
      action_type: "create",
      resource_type: "department",
      resource_id: departmentId,
      description: `Department created: ${getDepartmentActivityName(
        created,
        department_name,
      )}`,
      changes: compactActivityChanges({
        department_id: departmentId,
        department_name: getDepartmentActivityName(created, department_name),
        performed_by_user_id: optionalActivityText(req.user?.user_id),
        performed_by_email: optionalActivityText(req.user?.email),
        after: getDepartmentActivitySnapshot(created),
      }),
    });
    return res.status(201).json(created);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Department already exists."
    ) {
      return res.status(409).json({ message: error.message });
    }

    if (error instanceof Error) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: "Failed to create department." });
  }
};

export const updateDepartmentHandler = async (req: Request, res: Response) => {
  try {
    const { department_name, description, department_head } = req.body as {
      department_name?: string;
      description?: string;
      department_head?: string | null;
    };

    const departmentId = getDepartmentIdParam(req);
    const previous = await getDepartmentById(departmentId);
    const updated = await updateDepartment(departmentId, {
      department_name,
      description,
      department_head,
    });
    await logActivityForRequest(req, {
      action_type: "update",
      resource_type: "department",
      resource_id: departmentId,
      description: `Department updated: ${getDepartmentActivityName(
        updated,
        departmentId,
      )}`,
      changes: compactActivityChanges({
        department_id: departmentId,
        department_name: getDepartmentActivityName(updated, departmentId),
        performed_by_user_id: optionalActivityText(req.user?.user_id),
        performed_by_email: optionalActivityText(req.user?.email),
        changed_fields: Object.entries({
          department_name,
          description,
          department_head,
        })
          .filter(([, value]) => value !== undefined)
          .map(([field]) => field),
        before: getDepartmentActivitySnapshot(previous),
        after: getDepartmentActivitySnapshot(updated),
      }),
    });
    return res.status(200).json(updated);
  } catch (error) {
    if (error instanceof Error && error.message === "Department not found.") {
      return res.status(404).json({ message: error.message });
    }

    if (error instanceof Error) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: "Failed to update department." });
  }
};

export const deleteDepartmentHandler = async (req: Request, res: Response) => {
  try {
    const departmentId = getDepartmentIdParam(req);
    const previous = await getDepartmentById(departmentId);
    await deleteDepartment(departmentId);
    await logActivityForRequest(req, {
      action_type: "delete",
      resource_type: "department",
      resource_id: departmentId,
      description: `Department deleted: ${getDepartmentActivityName(
        previous,
        departmentId,
      )}`,
      changes: compactActivityChanges({
        department_id: departmentId,
        department_name: getDepartmentActivityName(previous, departmentId),
        performed_by_user_id: optionalActivityText(req.user?.user_id),
        performed_by_email: optionalActivityText(req.user?.email),
        before: getDepartmentActivitySnapshot(previous),
      }),
    });
    return res
      .status(200)
      .json({ message: "Department deleted successfully." });
  } catch (error) {
    if (error instanceof Error && error.message === "Department not found.") {
      return res.status(404).json({ message: error.message });
    }

    if (
      error instanceof Error &&
      error.message.includes("Cannot delete department")
    ) {
      return res.status(409).json({ message: error.message });
    }

    if (error instanceof Error) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: "Failed to delete department." });
  }
};

export default {
  listDepartments,
  getDepartment,
  listDepartmentMembersHandler,
  createDepartmentHandler,
  updateDepartmentHandler,
  deleteDepartmentHandler,
};
