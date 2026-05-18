import mongoose, { Document, Schema, Types } from "mongoose";

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
  | "intern_profile_updated";

export interface INotification extends Document {
  recipient_id: Types.ObjectId;
  actor_id?: Types.ObjectId;
  event_type: NotificationEventType;
  title: string;
  message: string;
  entity_type?: "task" | "user";
  entity_id?: Types.ObjectId;
  metadata?: Record<string, unknown>;
  is_read: boolean;
  read_at?: Date;
  created_at: Date;
}

const notificationSchema = new Schema<INotification>({
  recipient_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  actor_id: { type: Schema.Types.ObjectId, ref: "User" },
  event_type: {
    type: String,
    enum: [
      "task_comment_created",
      "task_feedback_added",
      "task_assignment_added",
      "task_assignment_removed",
      "task_reassigned",
      "task_status_changed",
      "task_moved_back",
      "task_status_under_review",
      "task_status_completed",
      "task_details_updated",
      "task_deleted",
      "task_due_today",
      "task_overdue",
      "user_profile_updated",
      "user_role_changed",
      "user_activation_changed",
      "user_deleted",
      "intern_profile_updated",
    ],
    required: true,
    index: true,
  },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  message: { type: String, required: true, trim: true, maxlength: 500 },
  entity_type: { type: String, enum: ["task", "user"] },
  entity_id: { type: Schema.Types.ObjectId },
  metadata: { type: Schema.Types.Mixed },
  is_read: { type: Boolean, default: false, index: true },
  read_at: { type: Date },
  created_at: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 30 },
});

notificationSchema.index({ recipient_id: 1, created_at: -1 });
notificationSchema.index({ recipient_id: 1, is_read: 1, created_at: -1 });

export default mongoose.model<INotification>(
  "Notification",
  notificationSchema,
);
