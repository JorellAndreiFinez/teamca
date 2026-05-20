import { useEffect } from "react";
import { initializeSocket } from "../../../utils/socketSingleton";

export const useDtrSocket = (onDtrUpdated: (payload: any) => void) => {
  // Initialize socket on mount (but only once globally)
  useEffect(() => {
    let mounted = true;

    const setupSocket = async () => {
      const socket = await initializeSocket();
      if (!socket || !mounted) return;

      // Add listener
      const handler = (p: any) => onDtrUpdated(p);
      socket.on("dtr:updated", handler);

      return () => {
        socket.off("dtr:updated", handler);
      };
    };

    const cleanup = setupSocket();

    return () => {
      mounted = false;
      cleanup.then((fn) => fn?.());
    };
  }, [onDtrUpdated]);
};
