import api from "./api";
import type {
  AddTaskCommentPayload,
  AddTaskFeedbackPayload,
  AddTaskWorkLinkPayload,
  CreateTaskResponse,
  CreateTaskPayload,
  DeleteTasksResponse,
  PaginatedTaskListResponse,
  Task,
  TaskAssignment,
  TaskComment,
  TaskDetail,
  TaskFeedback,
  TaskListQuery,
  TaskStatusHistory,
  TaskWorkLink,
  UpdateTaskDetailsPayload,
  UpdateTaskStatusPayload,
  UpdateTaskStatusResponse,
} from "../types/task";

const buildListQueryParams = (query?: TaskListQuery) => ({
  page: query?.page ?? 1,
  limit: query?.limit ?? 10,
  status: query?.status,
  priority: query?.priority,
  search: query?.search,
  created_date: query?.created_date ?? "all",
  sort_by: query?.sort_by ?? "created_desc",
});

export const taskService = {
  getTasks: async (): Promise<Task[]> => {
    const response = await api.get<Task[]>("/tasks", {
      params: { paginate: false },
      headers: {},
    });
    return response.data;
  },

  getTaskList: async (
    query?: TaskListQuery,
  ): Promise<PaginatedTaskListResponse> => {
    const response = await api.get<PaginatedTaskListResponse>("/tasks", {
      params: buildListQueryParams(query),
      headers: {},
    });

    return response.data;
  },

  getTaskDetail: async (taskId: string): Promise<TaskDetail> => {
    const response = await api.get<TaskDetail>(`/tasks/${taskId}`);
    return response.data;
  },

  createTask: async (
    taskData: CreateTaskPayload,
  ): Promise<CreateTaskResponse> => {
    const response = await api.post<CreateTaskResponse>("/tasks", taskData);
    return response.data;
  },

  assignTask: async (
    taskId: string,
    assigned_to: string[],
  ): Promise<TaskAssignment[]> => {
    const response = await api.post<TaskAssignment[]>(
      `/tasks/${taskId}/assign`,
      { assigned_to },
    );
    return response.data;
  },

  updateTaskStatus: async (
    taskId: string,
    payload: UpdateTaskStatusPayload,
  ): Promise<UpdateTaskStatusResponse> => {
    const response = await api.patch<UpdateTaskStatusResponse>(
      `/tasks/${taskId}/status`,
      payload,
    );
    return response.data;
  },

  updateTaskDetails: async (
    taskId: string,
    payload: UpdateTaskDetailsPayload,
  ): Promise<Task> => {
    const response = await api.patch<Task>(`/tasks/${taskId}`, payload);
    return response.data;
  },

  getTaskStatusHistory: async (
    taskId: string,
  ): Promise<TaskStatusHistory[]> => {
    const response = await api.get<TaskStatusHistory[]>(
      `/tasks/${taskId}/status-history`,
    );
    return response.data;
  },

  getTaskFeedback: async (taskId: string): Promise<TaskFeedback[]> => {
    const response = await api.get<TaskFeedback[]>(`/tasks/${taskId}/feedback`);
    return response.data;
  },

  addTaskFeedback: async (
    taskId: string,
    payload: AddTaskFeedbackPayload,
  ): Promise<TaskFeedback> => {
    const response = await api.post<TaskFeedback>(
      `/tasks/${taskId}/feedback`,
      payload,
    );
    return response.data;
  },

  getTaskWorkLinks: async (taskId: string): Promise<TaskWorkLink[]> => {
    const response = await api.get<TaskWorkLink[]>(
      `/tasks/${taskId}/work-links`,
    );
    return response.data;
  },

  addTaskWorkLink: async (
    taskId: string,
    payload: AddTaskWorkLinkPayload,
  ): Promise<TaskWorkLink> => {
    const response = await api.post<TaskWorkLink>(
      `/tasks/${taskId}/work-links`,
      payload,
    );
    return response.data;
  },

  deleteTaskWorkLink: async (
    taskId: string,
    workLinkId: string,
  ): Promise<void> => {
    await api.delete(`/tasks/${taskId}/work-links/${workLinkId}`);
  },

  getTaskComments: async (taskId: string): Promise<TaskComment[]> => {
    const response = await api.get<TaskComment[]>(`/tasks/${taskId}/comments`);
    return response.data;
  },

  addTaskComment: async (
    taskId: string,
    payload: AddTaskCommentPayload,
  ): Promise<TaskComment> => {
    const response = await api.post<TaskComment>(
      `/tasks/${taskId}/comments`,
      payload,
    );
    return response.data;
  },

  deleteTasks: async (taskIds: string[]): Promise<DeleteTasksResponse> => {
    const response = await api.delete<DeleteTasksResponse>("/tasks", {
      headers: {},
      data: {
        task_ids: taskIds,
      },
    });

    return response.data;
  },
};
