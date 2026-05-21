import { io, type Socket } from "socket.io-client";
import { config } from "../config/env";

let socketInstance: Socket | null = null;
let socketConnectingPromise: Promise<Socket | null> | null = null;

const getToken = (): string | null => {
  try {
    const stored = localStorage.getItem("auth-storage");
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return parsed?.state?.token || null;
  } catch {
    return null;
  }
};

export const initializeSocket = async (): Promise<Socket | null> => {
  // If already connecting, wait for it
  if (socketConnectingPromise) {
    return socketConnectingPromise;
  }

  // If already connected, return
  if (socketInstance?.connected) {
    return socketInstance;
  }

  const token = getToken();
  if (!token) {
    return null;
  }

  socketConnectingPromise = new Promise(
    (resolve: (value: Socket | null) => void) => {
      try {
        const socket = io(config.backendUrl, {
          transports: ["websocket"],
          auth: { token },
          autoConnect: true,
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 10,
        });

        socket.on("connect", () => {
          socketInstance = socket;
          socketConnectingPromise = null;
          resolve(socket);
        });

        socket.on("connect_error", (error) => {
          socketConnectingPromise = null;
          resolve(null);
        });

        socket.on("disconnect", () => {
          // Don't set to null, let reconnection handle it
        });
      } catch (error) {
        socketConnectingPromise = null;
        resolve(null);
      }
    },
  );

  return socketConnectingPromise;
};

export const getSocket = (): Socket | null => {
  return socketInstance;
};

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
    socketConnectingPromise = null;
  }
};
