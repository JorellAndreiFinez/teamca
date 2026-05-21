export type TaskStatus =
  | "Not Started"
  | "In Progress"
  | "Under Review"
  | "Completed";
export type TaskPriority = "Low" | "Medium" | "High";

export interface Task {
  task_id: string | number;
  title: string;
  description: string;
  created_by: string;
  status: TaskStatus;
  priority: TaskPriority;
  deadline?: string | Date;
  created_at: string | Date;
  assignees?: string[];
  is_overdue?: boolean;
  is_due_today?: boolean;
}

export interface TaskUserSummary {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface TaskDepartmentSummary {
  department_id: string;
  department_name: string;
}

export interface TaskListItem extends Task {
  assigned_users: TaskUserSummary[];
  comments_count: number;
}

export interface PaginatedTaskListResponse {
  items: TaskListItem[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface TaskAssignment {
  assignment_id: string;
  task_id: string | number;
  assigned_to: string;
  assigned_at: string | Date;
}

export interface TaskStatusHistory {
  history_id: string;
  task_id: string | number;
  updated_by: string;
  updated_by_user: TaskUserSummary | null;
  previous_status: TaskStatus;
  new_status: TaskStatus;
  update_notes?: string;
  timestamp: string | Date;
}

export interface TaskFeedback {
  feedback_id: string;
  task_id: string;
  supervisor_id: string;
  comments: string;
  created_at: string | Date;
}

export interface TaskWorkLink {
  work_link_id: string;
  task_id: string;
  submitted_by: string;
  url: string;
  label?: string;
  created_at: string | Date;
}

export interface TaskComment {
  comment_id: string;
  task_id: string;
  user_id: string;
  user: TaskUserSummary | null;
  message: string;
  created_at: string | Date;
}

export interface TaskLinkPermissions {
  can_add_links: boolean;
  can_delete_any_link: boolean;
  can_delete_own_links: boolean;
}

export interface TaskDetail extends Task {
  assigned_users: TaskUserSummary[];
  involved_departments: TaskDepartmentSummary[];
  links: TaskWorkLink[];
  links_count: number;
  history: TaskStatusHistory[];
  comments: TaskComment[];
  link_permissions: TaskLinkPermissions;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  priority: TaskPriority;
  deadline?: string;
  assigned_to?: string[];
}

export interface UpdateTaskStatusPayload {
  status: TaskStatus;
  update_notes?: string;
}

export interface UpdateTaskStatusResponse {
  task: Task;
  history: TaskStatusHistory;
}

export interface UpdateTaskDetailsPayload {
  title?: string;
  description?: string;
  deadline?: string | null;
}

export interface DeleteTasksPayload {
  task_ids: string[];
}

export interface DeleteTasksResponse {
  deleted_count: number;
  deleted_task_ids: string[];
}

export interface AddTaskFeedbackPayload {
  comments: string;
}

export interface AddTaskWorkLinkPayload {
  url: string;
  label?: string;
}

export interface AddTaskCommentPayload {
  message: string;
}

export interface CreateTaskResponse {
  task: Task;
  assignments: TaskAssignment[];
}

export interface TaskListQuery {
  page?: number;
  limit?: number;
  status?: TaskStatus;
  priority?: TaskPriority;
  search?: string;
  created_date?: "all" | "today" | "7d" | "30d";
  sort_by?:
    | "created_desc"
    | "created_asc"
    | "priority_desc"
    | "priority_asc"
    | "deadline_asc"
    | "deadline_desc"
    | "title_asc";
}
