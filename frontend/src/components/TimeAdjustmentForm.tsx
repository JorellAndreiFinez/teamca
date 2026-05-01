import React, { useState, useEffect } from "react";
import { dtrService } from "../services/dtrService";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Card from "./ui/Card";

type AdjustmentType = "time_in" | "time_out" | "manual_entry" | "leave";

interface TimeAdjustmentFormProps {
  onSubmitSuccess?: () => void;
  initialDate?: string;
}

export const TimeAdjustmentForm: React.FC<TimeAdjustmentFormProps> = ({
  onSubmitSuccess,
  initialDate,
}) => {
  const [formData, setFormData] = useState({
    dtrDate: new Date().toISOString().split("T")[0],
    adjustmentType: "time_in" as AdjustmentType,
    requestedValue: "",
    reason: "",
    originalValue: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );

  useEffect(() => {
    if (!initialDate) return;
    const normalized = initialDate.includes("T")
      ? initialDate.split("T")[0]
      : initialDate;
    setFormData((prev) => ({ ...prev, dtrDate: normalized }));
  }, [initialDate]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      await dtrService.submitAdjustmentRequest(
        new Date(formData.dtrDate).toISOString(),
        formData.adjustmentType,
        formData.requestedValue,
        formData.reason,
        formData.originalValue,
      );

      setMessage({ type: "success", text: "Adjustment request submitted successfully" });
      setFormData({
        dtrDate: new Date().toISOString().split("T")[0],
        adjustmentType: "time_in",
        requestedValue: "",
        reason: "",
        originalValue: "",
      });

      onSubmitSuccess?.();
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to submit adjustment request",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-4">Request Time Adjustment</h2>

      {message && (
        <div
          className={`mb-4 p-3 rounded ${
            message.type === "success"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">DTR Date</label>
          <Input
            type="date"
            name="dtrDate"
            value={formData.dtrDate}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Adjustment Type</label>
          <select
            name="adjustmentType"
            value={formData.adjustmentType}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="time_in">Time In</option>
            <option value="time_out">Time Out</option>
            <option value="manual_entry">Manual Entry</option>
            <option value="leave">Leave</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Original Value (Optional)</label>
          <Input
            type="text"
            name="originalValue"
            placeholder="e.g., 08:00 AM"
            value={formData.originalValue}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Requested Value</label>
          <Input
            type="text"
            name="requestedValue"
            placeholder="e.g., 08:30 AM or 8 hours"
            value={formData.requestedValue}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Reason</label>
          <textarea
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            placeholder="Explain why you need this adjustment..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            required
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white hover:bg-blue-700"
        >
          {isLoading ? "Submitting..." : "Submit Request"}
        </Button>
      </form>
    </Card>
  );
};
