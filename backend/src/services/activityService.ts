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

    const escapeCsv = (value: unknown): string => {
      const raw = value == null ? "" : String(value);
      const escaped = raw.replace(/"/g, '""');
      return `"${escaped}"`;
    };

    const formatValue = (value: unknown): string => {
      if (value == null || value === "") {
        return "-";
      }
      if (value instanceof Date) {
        return value.toISOString();
      }
      if (typeof value === "object") {
        return JSON.stringify(value);
      }
      return String(value);
    };

    const formatChanges = (changes?: Record<string, any>): string => {
      if (!changes || typeof changes !== "object" || Object.keys(changes).length === 0) {
        return "-";
      }

      return Object.entries(changes)
        .map(([field, value]) => {
          if (
            value &&
            typeof value === "object" &&
            !Array.isArray(value) &&
            ("from" in value || "to" in value)
          ) {
            const fromValue = formatValue((value as Record<string, unknown>).from);
            const toValue = formatValue((value as Record<string, unknown>).to);
            return `${field}: ${fromValue} -> ${toValue}`;
          }

          return `${field}: ${formatValue(value)}`;
        })
        .join(" | ");
    };

    const toTitleCase = (value: string): string =>
      value
        .replace(/[_-]+/g, " ")
        .split(" ")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(" ");

    // csv header
    const headers = [
      "Date Time",
      "User",
      "Action",
      "Resource",
      "Resource ID",
      "Description",
      "Changes",
      "Status",
    ];
    const rows = [headers.map(escapeCsv).join(",")];

    // csv rows
    logs.forEach((log: any) => {
      const row = [
        escapeCsv(new Date(log.timestamp).toLocaleString()),
        escapeCsv(log.user_name || "-"),
        escapeCsv(toTitleCase(String(log.action_type || "-"))),
        escapeCsv(toTitleCase(String(log.resource_type || "-"))),
        escapeCsv(log.resource_id || "-"),
        escapeCsv(log.description || "-"),
        escapeCsv(formatChanges(log.changes)),
        escapeCsv(toTitleCase(String(log.status || "-"))),
      ];
      rows.push(row.join(","));
    });

    return rows.join("\n");
  } catch (err) {
    throw new Error(`Failed to export activity logs: ${err instanceof Error ? err.message : "unknown error"}`);
  }
};
