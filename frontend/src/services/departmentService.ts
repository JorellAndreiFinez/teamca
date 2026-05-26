// frontend\src\services\departmentService.ts

import api from "./api";
import type { Department, DepartmentMembersPage, DepartmentRole } from "../types/user";

export interface DepartmentPayload {
  department_name?: string;
  description?: string;
  department_head?: string | null;
}

export interface GetMembersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: DepartmentRole | "";
}

export const departmentService = {
  getAllDepartments: async (): Promise<Department[]> => {
    const { data } = await api.get<Department[]>("/departments");
    return data;
  },

  getDepartmentById: async (
    departmentId: string | number,
  ): Promise<Department> => {
    const { data } = await api.get<Department>(`/departments/${departmentId}`);
    return data;
  },

  createDepartment: async (payload: DepartmentPayload): Promise<Department> => {
    const { data } = await api.post<Department>("/departments", payload);
    return data;
  },

  updateDepartment: async (
    departmentId: string | number,
    payload: DepartmentPayload,
  ): Promise<Department> => {
    const { data } = await api.patch<Department>(
      `/departments/${departmentId}`,
      payload,
    );
    return data;
  },

  deleteDepartment: async (departmentId: string | number): Promise<void> => {
    await api.delete(`/departments/${departmentId}`);
  },

  getDepartmentMembers: async (
    departmentId: string | number,
    params: GetMembersParams = {},
  ): Promise<DepartmentMembersPage> => {
    const search = new URLSearchParams();
    if (params.page) search.set("page", String(params.page));
    if (params.pageSize) search.set("pageSize", String(params.pageSize));
    if (params.search) search.set("search", params.search);
    if (params.role) search.set("role", params.role);

    const qs = search.toString();
    const url = qs
      ? `/departments/${departmentId}/members?${qs}`
      : `/departments/${departmentId}/members`;
    const { data } = await api.get<DepartmentMembersPage>(url);
    return data;
  },
};
