// frontend/src/types/dtr.ts

export interface BreakRecord {
  breakStart: string | Date;
  breakEnd?: string | Date;
  duration?: number; // minutes
  type: 'lunch' | 'rest' | 'other';
}

// IBreak — alias kept for DTRRecordDetailModal compatibility
export type IBreak = BreakRecord;

export interface ClockRecord {
  timeIn: string | Date;
  timeOut?: string | Date;
  totalHours?: number;
  overtimeHours?: number;
  breaks?: BreakRecord[];
  status?: 'present' | 'late' | 'very_late' | 'absent';
  remarks?: string;
}

// ClockEntry — alias kept for DTRRecordDetailModal compatibility
export type ClockEntry = ClockRecord;

/** A standard DTR day record returned by the backend */
export interface DailyTimeRecord {
  _id: string;
  userId: string;
  departmentId: string;
  date: string | Date;
  clocks: ClockRecord[];
  totalHours?: number;
  undertimeHours?: number;
  totalBreakTime?: number;
  status?: 'pending' | 'approved' | 'rejected';
  remarks?: string;
  attendanceStatus?: 'present' | 'late' | 'very_late' | 'absent';

  // Mongoose timestamps
  createdAt?: string | Date;
  updatedAt?: string | Date;

  // Set by getHistoryWithLeaves — true when this DTR day falls inside an approved leave period
  recordType?: 'dtr';
  coveredByLeave?: boolean;
}

/** A leave record returned inline with DTR history by getHistoryWithLeaves */
export interface LeaveRecord {
  _id: string;
  recordType: 'leave';
  date: string | Date;       // equals startDate — used as sort anchor
  startDate: string | Date;
  endDate: string | Date;
  duration: number;           // working days
  leaveType: 'vacation' | 'sick' | 'emergency' | 'unpaid' | 'other';
  reason: string;
  status: 'approved';         // only approved leaves appear in DTR history
  reviewedBy?: string;
  reviewedAt?: string | Date;
  reviewHistory: Array<{
    action: 'approved' | 'rejected' | 'cancelled';
    actor_id: string;
    actor_name: string;
    reason?: string;
    timestamp: string | Date;
  }>;
}

/**
 * Union type for merged DTR + Leave history returned by GET /dtr/history.
 * Discriminate on `recordType`:
 *   - undefined or 'dtr' → DailyTimeRecord
 *   - 'leave'            → LeaveRecord
 */
export type DTRHistoryItem = DailyTimeRecord | LeaveRecord;

export interface DTRSummary {
  _id: string;
  userId: string;
  departmentId: string;
  period: 'week' | 'month';
  startDate: string | Date;
  endDate: string | Date;
  totalHours: number;
  requiredHours: number;
  overtimeHours: number;
  undertimeHours: number;
  totalBreakTime: number;
  daysPresent: number;
  daysLate: number;
  daysAbsent: number;
  daysOnLeave: number; // approved leave days in this period
  lateCount: number;
  undertimeDays: number;
}