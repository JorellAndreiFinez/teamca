// frontend/src/types/leave.ts

export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";
export type LeaveType = "vacation" | "sick" | "emergency" | "unpaid" | "other";

export interface IReviewHistoryEntry {
  action: "approved" | "rejected" | "cancelled";
  actor_id: string;
  actor_name: string;
  reason?: string; // present on rejected/cancelled entries
  timestamp: string | Date;
}

export interface ILeave {
  _id: string;
  userId: string;
  departmentId?: string;

  leaveType: LeaveType;
  startDate: string | Date;
  endDate: string | Date;
  duration: number;

  reason: string;
  status: LeaveStatus;

  // last reviewer info
  reviewedBy?: string;
  reviewedAt?: string | Date;
  rejectionReason?: string;

  // full audit trail
  reviewHistory: IReviewHistoryEntry[];

  // populated applicant (present in getPendingLeaves response)
  applicant?: {
    _id: string;
    name: string;
    email: string;
  };

  createdAt: string | Date;
  updatedAt: string | Date;
}

// LeaveDuration: manual override sent by the form UI.
// The backend computes duration from working days between startDate/endDate,
// so this field is accepted but not authoritative.
export type LeaveDuration = 0.5 | 1 | 2 | 3 | number;

export interface CreateLeavePayload {
  leaveType?: LeaveType;
  startDate: string; // ISO
  endDate: string;   // ISO
  reason: string;
  duration?: LeaveDuration; // optional — backend recomputes from dates
}

export interface LeaveResponse {
  success: boolean;
  message?: string;
  data?: ILeave | ILeave[];
}