import api from './api';
import type { CreateTaskPayload, Task, TaskAssignment } from '../types/task';

export interface CreateTaskResponse {
  task: Task;
  assignment: TaskAssignment;
}

export const taskService = {
  getTasks: async (): Promise<Task[]> => {
    const response = await api.get<Task[]>('/tasks');
    return response.data;
  },

  createTask: async (taskData: CreateTaskPayload): Promise<CreateTaskResponse> => {
    const response = await api.post<CreateTaskResponse>('/tasks', taskData);
    return response.data;
  },

  assignTask: async (taskId: string, assigned_to: string): Promise<TaskAssignment> => {
    const response = await api.post<TaskAssignment>(`/tasks/${taskId}/assign`, { assigned_to });
    return response.data;
  },
};