import React, { useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { initializeSocket, disconnectSocket } from "../utils/socketSingleton";

export default function SocketInitializer() {
  const isAuthenticated = useAuthStore((state: any) => state.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket();
      return;
    }

    // Initialize socket when authenticated
    const initSocket = async () => {
      try {
        const socket = await initializeSocket();
        if (!socket) {
          return;
        }
      } catch (err) {
        return;
      }
    };

    initSocket();

    return () => {
      // Don't disconnect on unmount - socket should persist
    };
  }, [isAuthenticated]);

  return null;
}
