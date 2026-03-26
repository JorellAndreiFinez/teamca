// frontend\src\services\departmentService.ts

import api from "./api";
import type { Department } from "../types/user";

export interface DepartmentPayload {
  department_name: string;
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
    const { data } = await api.put<Department>(
      `/departments/${departmentId}`,
      payload,
    );
    return data;
  },
};
