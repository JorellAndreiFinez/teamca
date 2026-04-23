import { useEffect, useMemo } from "react";
import { io, type Socket } from "socket.io-client";
import { config } from "../../../config/env";

type UseTaskSocketArgs = {
  taskId: string | null;
  onCommentCreated: (payload: any) => void;
  onStatusUpdated: (payload: any) => void;
};

const getToken = (): string | null => {
  try {
    const stored = localStorage.getItem("auth-storage");
    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored);
    return parsed?.state?.token || null;
  } catch {
    return null;
  }
};

export const useTaskSocket = ({
  taskId,
  onCommentCreated,
  onStatusUpdated,
}: UseTaskSocketArgs) => {
  const socket = useMemo<Socket | null>(() => {
    const token = getToken();
    if (!token) {
      return null;
    }

    return io(config.backendUrl, {
      transports: ["websocket"],
      auth: { token },
      autoConnect: true,
    });
  }, []);

  useEffect(() => {
    if (!socket) {
      return;
    }

    socket.on("task:comment-created", onCommentCreated);
    socket.on("task:status-updated", onStatusUpdated);

    return () => {
      socket.off("task:comment-created", onCommentCreated);
      socket.off("task:status-updated", onStatusUpdated);
    };
  }, [onCommentCreated, onStatusUpdated, socket]);

  useEffect(() => {
    if (!socket || !taskId) {
      return;
    }

    socket.emit("task:join", taskId);

    return () => {
      socket.emit("task:leave", taskId);
    };
  }, [socket, taskId]);

  useEffect(() => {
    return () => {
      socket?.disconnect();
    };
  }, [socket]);
};
