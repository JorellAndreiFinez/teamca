import api from './api';
import type { Task } from '../types/task';

export const taskService = {
  getTasks: async (): Promise<Task[]> => {
    const response = await api.get<Task[]>('/tasks');
    return response.data;
  },
  
  createTask: async (taskData: Partial<Task>): Promise<Task> => {
    const response = await api.post<Task>('/tasks', taskData);
    return response.data;
  },
  
  updateTask: async (taskId: string, taskData: Partial<Task>): Promise<Task> => {
    const response = await api.put<Task>(`/tasks/${taskId}`, taskData);
    return response.data;
  },
  
  deleteTask: async (taskId: string): Promise<{ message?: string }> => {
    const response = await api.delete<{ message?: string }>(`/tasks/${taskId}`);
    return (response as { data: { message?: string } }).data;
  },
};