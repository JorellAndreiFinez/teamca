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
  history_id: number;
  task_id: number;
  updated_by: string; // uuid
  previous_status: string;
  new_status: string;
  update_notes?: string;
  timestamp: Date;
}

export interface TaskFeedback {
  feedback_id: number;
  task_id: string;
  supervisor_id: string; // uuid
  comments: string;
  created_at: Date;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  priority: TaskPriority;
  deadline: string;
  assigned_to?: string;
}