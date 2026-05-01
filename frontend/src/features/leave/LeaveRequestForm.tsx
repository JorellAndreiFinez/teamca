import React, { useState } from 'react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import type { CreateLeavePayload, LeaveDuration } from '../../types/leave';

interface LeaveRequestFormProps {
  onSubmit: (payload: CreateLeavePayload) => Promise<void>;
  loading?: boolean;
}

export default function LeaveRequestForm({ onSubmit, loading = false }: LeaveRequestFormProps) {
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    duration: 1 as LeaveDuration,
    reason: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'duration' ? parseFloat(value) as LeaveDuration : value,
    }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.startDate) {
      setError('Start date is required');
      return false;
    }
    if (!formData.endDate) {
      setError('End date is required');
      return false;
    }
    if (!formData.reason.trim()) {
      setError('Reason is required');
      return false;
    }

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);

    if (start >= end) {
      setError('End date must be after start date');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    try {
      await onSubmit({
        startDate: formData.startDate,
        endDate: formData.endDate,
        duration: formData.duration,
        reason: formData.reason,
      });
      setSuccess('Leave request submitted successfully!');
      setFormData({
        startDate: '',
        endDate: '',
        duration: 1,
        reason: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit leave request');
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Start Date</label>
            <Input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">End Date</label>
            <Input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* Duration */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Duration</label>
          <select
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-400"
          >
            <option value="0.5">0.5 day (4 hours)</option>
            <option value="1">1 day (8 hours)</option>
            <option value="2">2 days (16 hours)</option>
            <option value="3">3 days (24 hours)</option>
          </select>
        </div>

        {/* Reason */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Reason</label>
          <textarea
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            placeholder="Explain the reason for your leave request..."
            maxLength={500}
            rows={4}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-400"
            required
          />
          <p className="text-xs text-slate-500">{formData.reason.length}/500 characters</p>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          {loading ? 'Submitting...' : 'Submit Leave Request'}
        </Button>
      </form>
    </div>
  );
}
