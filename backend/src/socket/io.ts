import { Server as HttpServer } from "http";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { Server, type Socket } from "socket.io";
import User from "../models/User";

type TokenPayload = JwtPayload & {
  sub?: string;
  user_id?: string;
  id?: string;
};

let ioInstance: Server | null = null;

const getTokenFromAuthHeader = (header?: string): string | null => {
  if (!header) {
    return null;
  }

  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
};

export const initTaskSocket = (server: HttpServer, allowedOrigins: string[]) => {
  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  io.use(async (socket: Socket, next: (err?: Error) => void) => {
    try {
      const token =
        (typeof socket.handshake.auth?.token === "string" && socket.handshake.auth.token) ||
        getTokenFromAuthHeader(socket.handshake.headers.authorization as string | undefined);

      if (!token) {
        return next(new Error("Authentication token is required."));
      }

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        return next(new Error("JWT secret is not configured."));
      }

      const decoded = jwt.verify(token, jwtSecret) as TokenPayload;
      const userId = decoded.sub || decoded.user_id || decoded.id;
      if (!userId) {
        return next(new Error("Invalid token payload."));
      }

      const user = await User.findById(userId)
        .select("_id is_active")
        .lean();

      if (!user || !user.is_active) {
        return next(new Error("Account is not active or does not exist."));
      }

      socket.data.userId = String(user._id);
      return next();
    } catch {
      return next(new Error("Invalid or expired token."));
    }
  });

  io.on("connection", (socket: Socket) => {
    const userId = String(socket.data.userId || "");
    if (userId) {
      socket.join(`user:${userId}`);
    }

    socket.on("task:join", (taskId: string) => {
      if (!taskId || typeof taskId !== "string") {
        return;
      }

      socket.join(`task:${taskId}`);
    });

    socket.on("task:leave", (taskId: string) => {
      if (!taskId || typeof taskId !== "string") {
        return;
      }

      socket.leave(`task:${taskId}`);
    });
  });

  ioInstance = io;
  return io;
};

export const emitTaskStatusUpdated = (taskId: string, payload: unknown) => {
  if (!ioInstance) {
    return;
  }

  ioInstance.to(`task:${taskId}`).emit("task:status-updated", payload);
};

export const emitTaskCommentCreated = (taskId: string, payload: unknown) => {
  if (!ioInstance) {
    return;
  }

  ioInstance.to(`task:${taskId}`).emit("task:comment-created", payload);
};

export const emitUserNotification = (userId: string, payload: unknown) => {
  if (!ioInstance) {
    return;
  }

  ioInstance.to(`user:${userId}`).emit("notification:received", payload);
};

export const emitUsersNotification = (userIds: string[], payload: unknown) => {
  if (!ioInstance) {
    return;
  }

  const uniqueUserIds = [...new Set(
    userIds
      .map((userId) => userId.trim())
      .filter((userId) => userId.length > 0),
  )];

  for (const userId of uniqueUserIds) {
    ioInstance.to(`user:${userId}`).emit("notification:received", payload);
  }
};
