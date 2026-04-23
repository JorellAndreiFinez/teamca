import { Request, Response, NextFunction } from "express";
import { logActivity } from "../services/activityService";

// capture request/response details for activity logging
export const activityLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const originalSend = res.send;
  const originalJson = res.json;
  let hasLogged = false; // flag to prevent duplicate logging

  // helper function to log activity
  const logRequestActivity = () => {
    // prevent duplicate logs if both res.send and res.json are called
    if (hasLogged) return;
    hasLogged = true;
    const user = req.user as any;
    let user_id = user?.id || user?.user_id || user?._id;
    let user_name = user?.name || user?.email;

    // for login/signup endpoints, user info may not be available yet
    if (!user_id) {
      if (
        req.body?.email &&
        (req.path.includes("/login") || req.path.includes("/complete-setup"))
      ) {
        user_name = req.body.email;
        if (res.statusCode < 400 && res.statusCode !== 403) {
          user_id = "system"; // placeholder
        }
      }
      // skip logging if no user context and not an auth endpoint
      if (!user_id && !req.path.includes("/auth")) {
        return;
      }
      if (!user_id) {
        user_id = "anonymous";
      }
    }

    // determine action type based on http method
    const actionTypeMap: { [key: string]: string } = {
      GET: "read",
      POST: "create",
      PUT: "update",
      PATCH: "update",
      DELETE: "delete",
    };
    const actionType = actionTypeMap[req.method] || "read";

    // skip logging for reads to reduce noise
    if (actionType === "read") {
      return;
    }

    const pathSegments = req.path.split("/").filter(Boolean);
    let resourceType = pathSegments[0] || "unknown";

    // map common path names to enum values
    const resourceTypeMap: { [key: string]: string } = {
      auth: "auth",
      users: "user",
      tasks: "task",
      departments: "department",
      dtr: "dtr",
      profiles: "internProfile",
      "intern-profiles": "internProfile",
      notifications: "notification",
      "activity-logs": "activityLog",
    };
    // use mapped value, or 'auth' as safe default for unrecognized paths
    resourceType = resourceTypeMap[resourceType] || "auth";

    // create human-readable action description
    const actionDescMap: { [key: string]: { [key: string]: string } } = {
      read: {
        user: "Viewed user",
        task: "Viewed task",
        department: "Viewed department",
        dtr: "Viewed DTR",
        internProfile: "Viewed intern profile",
        auth: "Viewed auth resource",
        notification: "Viewed notification",
        activityLog: "Viewed activity log",
      },
      create: {
        user: "Created user",
        task: "Created task",
        department: "Created department",
        dtr: "Created DTR",
        internProfile: "Created intern profile",
        auth: "Logged in",
        notification: "Created notification",
        activityLog: "Created activity log",
      },
      update: {
        user: "Updated user",
        task: "Updated task",
        department: "Updated department",
        dtr: "Updated DTR",
        internProfile: "Updated intern profile",
        auth: "Updated auth",
        notification: "Updated notification",
        activityLog: "Updated activity log",
      },
      delete: {
        user: "Deleted user",
        task: "Deleted task",
        department: "Deleted department",
        dtr: "Deleted DTR",
        internProfile: "Deleted intern profile",
        auth: "Deleted auth",
        notification: "Deleted notification",
        activityLog: "Deleted activity log",
      },
      login: {
        auth: "Logged in",
        user: "Logged in",
      },
      logout: {
        auth: "Logged out",
        user: "Logged out",
      },
    };
    const description =
      actionDescMap[actionType]?.[resourceType] ||
      `${actionType} ${resourceType}`.charAt(0).toUpperCase() +
        `${actionType} ${resourceType}`.slice(1);

    const changes: { [key: string]: any } = {};
    if (req.body) {
      try {
        // log first-level keys only, avoid logging sensitive data
        Object.keys(req.body).forEach((key) => {
          if (
            ![
              "password",
              "password_hash",
              "token",
              "secret",
              "authorization",
              "confirmPassword",
            ].includes(key.toLowerCase())
          ) {
            changes[key] = req.body[key];
          }
        });
      } catch (err) {
        // silently ignore parsing errors
      }
    }

    let resource_id: string | undefined;
    const getParamAsString = (
      param: string | string[] | undefined,
    ): string | undefined => {
      if (!param) return undefined;
      return Array.isArray(param) ? param[0] : param;
    };

    resource_id =
      getParamAsString(req.params?.userId) ||
      getParamAsString(req.params?.taskId) ||
      getParamAsString(req.params?.departmentId) ||
      getParamAsString(req.params?.notificationId) ||
      getParamAsString(req.params?.workLinkId) ||
      getParamAsString(req.params?.id);

    const statusCode = res.statusCode;
    const logStatus = statusCode >= 400 ? "failed" : "success";

    // call logActivity asynchronously without awaiting
    logActivity({
      user_id,
      user_name,
      action_type: actionType as any,
      resource_type: resourceType as any,
      resource_id,
      description,
      changes,
      status: logStatus as any,
    }).catch((err) => {
      console.error("[activityLogger] failed to log activity:", err.message);
    });
  };

  res.send = function (data: any) {
    logRequestActivity();
    return originalSend.call(this, data);
  };

  res.json = function (data: any) {
    logRequestActivity();
    return originalJson.call(this, data);
  };

  next();
};
