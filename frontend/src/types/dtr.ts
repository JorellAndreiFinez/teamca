// frontend\src\types\dtr.ts

export type DTRStatus = "Present" | "Absent" | "Leave" | "Holiday";

// frontend/src/types/dtr.ts
export interface ClockEntry {
  timeIn: string;
  timeOut?: string;
  totalHours?: number;
}

export interface DailyTimeRecord {
  _id: string;
  userId: string;
  date: string;
  clocks: ClockEntry[];
  status: "pending" | "approved" | "rejected";
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}
