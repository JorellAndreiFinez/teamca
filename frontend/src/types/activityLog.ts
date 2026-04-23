export type ActionType =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "login"
  | "logout";
export type ResourceType =
  | "user"
  | "task"
  | "department"
  | "dtr"
  | "internProfile"
  | "auth";
export type LogStatus = "success" | "failed";

export interface ActivityLog {
  _id: string;
  timestamp: Date;
  user_id: string;
  user_name: string;
  action_type: ActionType;
  resource_type: ResourceType;
  resource_id?: string;
  description: string;
  changes: Record<string, any>;
  status: LogStatus;
}

export interface ActivityLogsResponse {
  logs: ActivityLog[];
  total: number;
}
