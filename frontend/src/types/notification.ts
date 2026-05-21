export type NotificationEventType =
  | "task_comment_created"
  | "task_feedback_added"
  | "task_assignment_added"
  | "task_assignment_removed"
  | "task_reassigned"
  | "task_status_changed"
  | "task_moved_back"
  | "task_status_under_review"
  | "task_status_completed"
  | "task_details_updated"
  | "task_deleted"
  | "task_due_today"
  | "task_overdue"
  | "user_profile_updated"
  | "user_role_changed"
  | "user_activation_changed"
  | "user_deleted"
  | "intern_profile_updated"
  | "leave_submitted"
  | "leave_approved"
  | "leave_rejected"
  | "leave_cancelled";

export interface NotificationItem {
  notification_id: string;
  recipient_id: string;
  actor_id?: string;
  event_type: NotificationEventType;
  title: string;
  message: string;
  entity_type?: "task" | "user" | "leave";
  entity_id?: string;
  metadata?: Record<string, unknown>;
  is_read: boolean;
  read_at?: string | Date;
  created_at: string | Date;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  total: number;
  unread_count: number;
  page: number;
  limit: number;
  total_pages: number;
}
