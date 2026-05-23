// frontend/src/services/leaveService.ts

import api from './api';
import type { ILeave, CreateLeavePayload, LeaveResponse } from '../types/leave';

/**
 * Extract the real error message from an axios error response.
 * When the backend returns 4xx/5xx, axios throws — response.data is on error.response.data.
 */
function extractError(err: unknown, fallback: string): never {
  const axiosError = err as any;
  const message =
    axiosError?.response?.data?.message ||
    axiosError?.message ||
    fallback;
  throw new Error(message);
}

export const leaveService = {
  /**
   * Create a new leave request
   */
  async createLeave(payload: CreateLeavePayload): Promise<ILeave> {
    try {
      const response = await api.post<LeaveResponse>('/leave', {
        ...payload,
        startDate: new Date(payload.startDate).toISOString(),
        endDate: new Date(payload.endDate).toISOString(),
      });

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to create leave request');
      }

      return Array.isArray(response.data.data)
        ? response.data.data[0]
        : (response.data.data as ILeave);
    } catch (err: unknown) {
      // Re-throw if it's already a plain Error we threw above
      if (err instanceof Error && !(err as any).response) throw err;
      extractError(err, 'Failed to create leave request');
    }
  },

  /**
   * Get all leave requests for the current user
   */
  async getMyLeaves(): Promise<ILeave[]> {
    try {
      const response = await api.get<LeaveResponse>('/leave/me');

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch leaves');
      }

      return Array.isArray(response.data.data)
        ? (response.data.data as ILeave[])
        : [];
    } catch (err: unknown) {
      if (err instanceof Error && !(err as any).response) throw err;
      extractError(err, 'Failed to fetch leaves');
    }
  },

  /**
   * Get pending leave requests visible to this reviewer.
   * Admins see all; Department Heads see only their department.
   */
  async getPendingLeaves(): Promise<ILeave[]> {
    try {
      const response = await api.get<LeaveResponse>('/leave/pending');

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch pending leaves');
      }

      return Array.isArray(response.data.data)
        ? (response.data.data as ILeave[])
        : [];
    } catch (err: unknown) {
      if (err instanceof Error && !(err as any).response) throw err;
      extractError(err, 'Failed to fetch pending leaves');
    }
  },

  /**
   * Approve a leave request (admin/head only)
   */
  async approveLeave(leaveId: string): Promise<ILeave> {
    try {
      const response = await api.patch<LeaveResponse>(`/leave/${leaveId}/approve`, {
        status: 'approved',
      });

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to approve leave');
      }

      return Array.isArray(response.data.data)
        ? response.data.data[0]
        : (response.data.data as ILeave);
    } catch (err: unknown) {
      if (err instanceof Error && !(err as any).response) throw err;
      extractError(err, 'Failed to approve leave');
    }
  },

  /**
   * Reject a leave request (admin/head only).
   * rejectionReason is required by the backend.
   */
  async rejectLeave(leaveId: string, rejectionReason: string): Promise<ILeave> {
    try {
      const response = await api.patch<LeaveResponse>(`/leave/${leaveId}/approve`, {
        status: 'rejected',
        rejectionReason,
      });

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to reject leave');
      }

      return Array.isArray(response.data.data)
        ? response.data.data[0]
        : (response.data.data as ILeave);
    } catch (err: unknown) {
      if (err instanceof Error && !(err as any).response) throw err;
      extractError(err, 'Failed to reject leave');
    }
  },

  /**
   * Cancel own leave request (pending only)
   */
  async cancelLeave(leaveId: string): Promise<ILeave> {
    try {
      const response = await api.patch<LeaveResponse>(`/leave/${leaveId}/cancel`);

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to cancel leave');
      }

      return Array.isArray(response.data.data)
        ? response.data.data[0]
        : (response.data.data as ILeave);
    } catch (err: unknown) {
      if (err instanceof Error && !(err as any).response) throw err;
      extractError(err, 'Failed to cancel leave');
    }
  },
};