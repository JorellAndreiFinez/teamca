import ActivityLog, { IActivityLog, ActionType, ResourceType, LogStatus } from "../models/ActivityLog";

export interface LogActivityInput {
  user_id: string;
  user_name: string;
  action_type: ActionType;
  resource_type: ResourceType;
  resource_id?: string;
  description: string;
  changes?: Record<string, any>;
  status: LogStatus;
}

export const logActivity = async (input: LogActivityInput): Promise<void> => {
  try {
    const log = new ActivityLog({
      user_id: input.user_id,
      user_name: input.user_name,
      action_type: input.action_type,
      resource_type: input.resource_type,
      resource_id: input.resource_id,
      description: input.description,
      changes: input.changes,
      status: input.status,
      timestamp: new Date(),
    });

    // fire and forget - don't wait for this
    void log.save().catch((err) => {
      console.error("[logActivity] failed to save log:", err.message);
    });
  } catch (err) {
    // silently fail to avoid blocking user operations
    console.error("[logActivity] error:", err);
  }
};

export const getActivityLogs = async (
  limit: number = 20,
  skip: number = 0,
  startDate?: Date,
  endDate?: Date
): Promise<{ logs: IActivityLog[]; total: number }> => {
  try {
    const filter: Record<string, any> = {};

    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = startDate;
      if (endDate) filter.timestamp.$lte = endDate;
    }

    const [logs, total] = await Promise.all([
      ActivityLog.find(filter).lean().sort({ timestamp: -1 }).limit(limit).skip(skip),
      ActivityLog.countDocuments(filter),
    ]);

    return { logs: logs as IActivityLog[], total };
  } catch (err) {
    throw new Error(`Failed to fetch activity logs: ${err instanceof Error ? err.message : "unknown error"}`);
  }
};

export const exportActivityLogsToCSV = async (startDate?: Date, endDate?: Date): Promise<string> => {
  try {
    const filter: Record<string, any> = {};

    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = startDate;
      if (endDate) filter.timestamp.$lte = endDate;
    }

    const logs = await ActivityLog.find(filter).lean().sort({ timestamp: -1 });

    // csv header
    const headers = ["Timestamp", "User", "Action", "Resource Type", "Resource ID", "Description", "Changes", "Status"];
    const rows = [headers.join(",")];

    // csv rows
    logs.forEach((log: any) => {
      const row = [
        new Date(log.timestamp).toISOString(),
        `"${log.user_name}"`,
        log.action_type,
        log.resource_type,
        log.resource_id || "-",
        `"${log.description}"`,
        log.changes ? `"${JSON.stringify(log.changes)}"` : "-",
        log.status,
      ];
      rows.push(row.join(","));
    });

    return rows.join("\n");
  } catch (err) {
    throw new Error(`Failed to export activity logs: ${err instanceof Error ? err.message : "unknown error"}`);
  }
};
