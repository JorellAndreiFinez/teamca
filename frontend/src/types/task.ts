export type TaskStatus = 'Not Started' | 'In Progress' | 'Under Review' | 'Completed';
export type TaskPriority = 'Low' | 'Medium' | 'High';

export interface Task {
  task_id: string | number;
  title: string;
  description: string;
  created_by: string; // uuid
  status: TaskStatus;
  priority: TaskPriority;
  deadline: string | Date;
  created_at: string | Date;
  assignees?: string[];
}

export interface TaskAssignment {
  assignment_id: string;
  task_id: string | number;
  assigned_to: string; // uuid
  assigned_at: string | Date;
}

export interface TaskStatusHistory {
  history_id: string;
  task_id: string | number;
  updated_by: string; // uuid
  previous_status: TaskStatus;
  new_status: TaskStatus;
  update_notes?: string;
  timestamp: string | Date;
}

export interface TaskFeedback {
  feedback_id: string;
  task_id: string;
  supervisor_id: string; // uuid
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

export interface CreateTaskPayload {
  title: string;
  description?: string;
  priority: TaskPriority;
  deadline: string;
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

export interface AddTaskFeedbackPayload {
  comments: string;
}

export interface AddTaskWorkLinkPayload {
  url: string;
  label?: string;
}

export interface CreateTaskResponse {
  task: Task;
  assignments: TaskAssignment[];
}