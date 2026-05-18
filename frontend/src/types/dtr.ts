// frontend\src\types\dtr.ts

export type DTRStatus = "Present" | "Absent" | "Leave" | "Holiday";

// Clock entry with break tracking
export interface IBreak {
  breakStart: Date | string;
  breakEnd?: Date | string;
  duration?: number; // minutes
  type: 'lunch' | 'rest' | 'other';
}

export interface ClockEntry {
  timeIn: Date | string;
  timeOut?: Date | string;
  totalHours?: number;
  overtimeHours?: number;
  remarks?: string;
  status?: string;
  breaks?: IBreak[];
}

// Daily Time Record (matches backend structure)
export interface DailyTimeRecord {
  _id?: string;
  userId?: string;
  departmentId?: string;
  date: Date | string;
  clocks: ClockEntry[];
  attendanceStatus?: 'present' | 'late' | 'very_late' | 'absent';
  totalHours?: number;
  undertimeHours?: number;
  totalBreakTime?: number;
  status?: "pending" | "approved" | "rejected";
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}
