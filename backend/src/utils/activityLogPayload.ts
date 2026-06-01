import type { Request } from "express";
import type { LogActivityInput } from "../services/activityService.js";
import { logActivity } from "../services/activityService.js";

const UNKNOWN_ACTOR_ID = "000000000000000000000000";
const UNKNOWN_ACTOR_NAME = "Unknown User";

export const safeActivityText = (
  value: unknown,
  fallback: string,
): string => {
  if (value === null || value === undefined) {
    return fallback;
  }

  try {
    const text = String(value).trim();
    return text.length > 0 ? text : fallback;
  } catch {
    return fallback;
  }
};

export const optionalActivityText = (
  value: unknown,
): string | undefined => {
  if (value === null || value === undefined) {
    return undefined;
  }

  try {
    const text = String(value).trim();
    return text.length > 0 ? text : undefined;
  } catch {
    return undefined;
  }
};

export const compactActivityChanges = (
  changes: Record<string, unknown>,
): Record<string, unknown> => {
  return Object.fromEntries(
    Object.entries(changes).filter(([, value]) => value !== undefined),
  );
};

export const uniqueActivityTexts = (values: unknown[]): string[] => {
  return [
    ...new Set(
      values
        .map((value) => optionalActivityText(value))
        .filter((value): value is string => Boolean(value)),
    ),
  ];
};

type RequestLogInput = Omit<
  LogActivityInput,
  "user_id" | "user_name" | "status"
> & {
  status?: LogActivityInput["status"];
};

export const logActivityForRequest = async (
  req: Request,
  input: RequestLogInput,
): Promise<void> => {
  try {
    await logActivity({
      user_id: safeActivityText(req.user?.user_id, UNKNOWN_ACTOR_ID),
      user_name: safeActivityText(req.user?.email, UNKNOWN_ACTOR_NAME),
      ...input,
      status: input.status ?? "success",
    });
  } catch {
    // Activity logging must never block the primary workflow.
  }
};
