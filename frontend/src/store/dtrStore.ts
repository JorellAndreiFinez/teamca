import { create } from 'zustand';
import type { DailyTimeRecord } from '../types/dtr';
import { dtrService } from '../services/dtrService';

const TIMEZONE_OFFSET = 8 * 60 * 60 * 1000; // PH (UTC+8)

const toPHDateKey = (date: Date) => {
  return new Date(date.getTime() + TIMEZONE_OFFSET).toISOString().split("T")[0];
};

const getActiveClock = (records: DailyTimeRecord[]) => {
  const todayKey = toPHDateKey(new Date());
  const todayRecord = records.find((record) => {
    const recordDate = new Date(record.date as any);
    return toPHDateKey(recordDate) === todayKey;
  });

  return todayRecord?.clocks?.find((clock) => clock.timeIn && !clock.timeOut);
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
    await dtrService.clockIn();
    await get().refreshRecords();
  },
  clockOut: async (remarks: string) => {
    await dtrService.clockOut(remarks);
    await get().refreshRecords();
  },
  startBreak: async (breakType = 'rest') => {
    await dtrService.startBreak(breakType);
    await get().refreshRecords();
  },
  endBreak: async () => {
    await dtrService.endBreak();
    await get().refreshRecords();
  },
}));
