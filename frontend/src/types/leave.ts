export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type LeaveDuration = 0.5 | 1 | 2 | 3;

export interface ILeave {
  _id: string;
  userId: string;
  departmentId: string;
  type: 'Professional';
  duration: LeaveDuration;
  startDate: Date | string;
  endDate: Date | string;
  reason: string;
  status: LeaveStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateLeavePayload {
  duration: LeaveDuration;
  startDate: Date | string;
  endDate: Date | string;
  reason: string;
}

export interface LeaveResponse {
  success: boolean;
  message: string;
  data?: ILeave | ILeave[];
  count?: number;
}
