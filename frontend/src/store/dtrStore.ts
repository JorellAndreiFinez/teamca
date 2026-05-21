import { create } from "zustand";
import type { DailyTimeRecord } from "../types/dtr";
import { dtrService } from "../services/dtrService";

const getActiveClock = (records: DailyTimeRecord[]) => {
  if (!records.length) return undefined;

  // Only check the most recent (today's) DTR record for open clocks
  // This prevents picking up stale unclosed entries from past days
  const today = records.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )[0];

  return today?.clocks?.find((clock) => clock.timeIn && !clock.timeOut);
};

const syncFlagsFromRecords = (records: DailyTimeRecord[]) => {
  const activeClock = getActiveClock(records);
  const breakIsActive = Boolean(
    activeClock &&
    activeClock.breaks &&
    activeClock.breaks.length > 0 &&
    !activeClock.breaks[activeClock.breaks.length - 1].breakEnd,
  );

  return {
    clockedIn: Boolean(activeClock),
    isOnBreak: breakIsActive,
  };
};

const mergeRecordIntoState = (
  records: DailyTimeRecord[],
  nextRecord: DailyTimeRecord,
) => {
  if (!nextRecord?._id) {
    return records;
  }

  const index = records.findIndex((record) => record._id === nextRecord._id);
  if (index === -1) {
    return [nextRecord, ...records];
  }

  const merged = records.slice();
  merged[index] = nextRecord;
  return merged;
};

interface DtrState {
  records: DailyTimeRecord[];
  setRecords: (records: DailyTimeRecord[]) => void;
  refreshRecords: () => Promise<void>;
  clockedIn: boolean;
  setClockedIn: (v: boolean) => void;
  isOnBreak: boolean;
  setIsOnBreak: (v: boolean) => void;
  clockIn: () => Promise<void>;
  clockOut: (remarks: string) => Promise<void>;
  startBreak: (breakType?: string) => Promise<void>;
  endBreak: () => Promise<void>;
}

export const useDtrStore = create<DtrState>((set, get) => ({
  records: [],
  setRecords: (records) => {
    const flags = syncFlagsFromRecords(records);
    set({ records, ...flags });
  },
  refreshRecords: async () => {
    const records = await dtrService.getDTRRecords();
    get().setRecords(records);
  },
  clockedIn: false,
  setClockedIn: (v) => set({ clockedIn: v }),
  isOnBreak: false,
  setIsOnBreak: (v) => set({ isOnBreak: v }),
  clockIn: async () => {
    try {
      const updatedRecord = await dtrService.clockIn();
      set((state) => {
        const records = mergeRecordIntoState(state.records, updatedRecord);
        return { records, ...syncFlagsFromRecords(records) };
      });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "";
      // If server says already clocked in, refresh records to sync state
      if (
        typeof msg === "string" &&
        msg.toLowerCase().includes("already clocked in")
      ) {
        await get().refreshRecords();
        return;
      }
      // rethrow for upstream handling
      throw err;
    }

    await get().refreshRecords();
  },
  clockOut: async (remarks: string) => {
    try {
      const updatedRecord = await dtrService.clockOut(remarks);
      set((state) => {
        const records = mergeRecordIntoState(state.records, updatedRecord);
        return { records, ...syncFlagsFromRecords(records) };
      });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "";
      // If server says no clock-in found or last clock already timed out, refresh and sync
      if (
        typeof msg === "string" &&
        (msg.toLowerCase().includes("no clock-in") ||
          msg.toLowerCase().includes("already timed out") ||
          msg.toLowerCase().includes("last clock-in already timed out"))
      ) {
        await get().refreshRecords();
        // ensure local flag reflects no active clock
        get().setClockedIn(false);
        return;
      }

      throw err;
    }

    // on success ensure flags updated from the refreshed record list
    get().setClockedIn(false);
    await get().refreshRecords();
  },
  startBreak: async (breakType = "rest") => {
    const updatedRecord = await dtrService.startBreak(breakType);
    set((state) => {
      const records = mergeRecordIntoState(state.records, updatedRecord);
      return { records, ...syncFlagsFromRecords(records) };
    });
    await get().refreshRecords();
  },
  endBreak: async () => {
    const updatedRecord = await dtrService.endBreak();
    set((state) => {
      const records = mergeRecordIntoState(state.records, updatedRecord);
      return { records, ...syncFlagsFromRecords(records) };
    });
    await get().refreshRecords();
  },
}));
