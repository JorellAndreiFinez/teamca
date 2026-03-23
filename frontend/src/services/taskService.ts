import api from './api';
import type {
  AddTaskFeedbackPayload,
  AddTaskWorkLinkPayload,
  CreateTaskResponse,
  CreateTaskPayload,
  Task,
  TaskAssignment,
  TaskFeedback,
  TaskWorkLink,
  TaskStatusHistory,
  UpdateTaskStatusPayload,
  UpdateTaskStatusResponse,
} from '../types/task';

export const taskService = {
  getTasks: async (): Promise<Task[]> => {
    const response = await api.get<Task[]>('/tasks');
    return response.data;
  },

  createTask: async (taskData: CreateTaskPayload): Promise<CreateTaskResponse> => {
    const response = await api.post<CreateTaskResponse>('/tasks', taskData);
    return response.data;
  },

  assignTask: async (taskId: string, assigned_to: string[]): Promise<TaskAssignment[]> => {
    const response = await api.post<TaskAssignment[]>(`/tasks/${taskId}/assign`, { assigned_to });
    return response.data;
  },

  updateTaskStatus: async (taskId: string, payload: UpdateTaskStatusPayload): Promise<UpdateTaskStatusResponse> => {
    const response = await api.patch<UpdateTaskStatusResponse>(`/tasks/${taskId}/status`, payload);
    return response.data;
  },

  getTaskStatusHistory: async (taskId: string): Promise<TaskStatusHistory[]> => {
    const response = await api.get<TaskStatusHistory[]>(`/tasks/${taskId}/status-history`);
    return response.data;
  },

  getTaskFeedback: async (taskId: string): Promise<TaskFeedback[]> => {
    const response = await api.get<TaskFeedback[]>(`/tasks/${taskId}/feedback`);
    return response.data;
  },

  addTaskFeedback: async (taskId: string, payload: AddTaskFeedbackPayload): Promise<TaskFeedback> => {
    const response = await api.post<TaskFeedback>(`/tasks/${taskId}/feedback`, payload);
    return response.data;
  },

  getTaskWorkLinks: async (taskId: string): Promise<TaskWorkLink[]> => {
    const response = await api.get<TaskWorkLink[]>(`/tasks/${taskId}/work-links`);
    return response.data;
  },

  addTaskWorkLink: async (taskId: string, payload: AddTaskWorkLinkPayload): Promise<TaskWorkLink> => {
    const response = await api.post<TaskWorkLink>(`/tasks/${taskId}/work-links`, payload);
    return response.data;
  },

  deleteTaskWorkLink: async (taskId: string, workLinkId: string): Promise<void> => {
    await api.delete(`/tasks/${taskId}/work-links/${workLinkId}`);
  },
};