import React, { useState, useEffect } from "react";
import { dtrService } from "../services/dtrService";
import Button from "./ui/Button";
import Card from "./ui/Card";

interface AdjustmentRequest {
  _id: string;
  userId: any;
  dtrDate: string;
  adjustmentType: string;
  requestedValue: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

interface TimeAdjustmentReviewProps {
  onReviewComplete?: () => void;
}

export const TimeAdjustmentReview: React.FC<TimeAdjustmentReviewProps> = ({
  onReviewComplete,
}) => {
  const [requests, setRequests] = useState<AdjustmentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );

  useEffect(() => {
    loadPendingRequests();
  }, []);

  const loadPendingRequests = async () => {
    try {
      setIsLoading(true);
      const data = await dtrService.getPendingAdjustmentRequests();
      setRequests(data);
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to load pending requests",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReview = async (id: string, approveOrReject: "approve" | "reject") => {
    if (approveOrReject === "reject" && !reviewNotes.trim()) {
      setMessage({ type: "error", text: "Review notes are required for rejection" });
      return;
    }

    try {
      if (approveOrReject === "approve") {
        await dtrService.approveAdjustmentRequest(id, reviewNotes);
      } else {
        await dtrService.rejectAdjustmentRequest(id, reviewNotes);
      }

      setMessage({
        type: "success",
        text: `Request ${approveOrReject}ed successfully`,
      });

      setReviewingId(null);
      setReviewNotes("");
      setAction(null);
      await loadPendingRequests();
      onReviewComplete?.();
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || `Failed to ${approveOrReject} request`,
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <p className="text-center text-gray-500">Loading pending requests...</p>
      </Card>
    );
  }

  if (!requests.length) {
    return (
      <Card className="p-6">
        <p className="text-center text-gray-500">No pending adjustment requests</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-4">Review Time Adjustments</h2>

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

      <div className="space-y-4">
        {requests.map((request) => (
          <div key={request._id} className="border rounded-lg p-4 hover:bg-gray-50">
            {reviewingId === request._id ? (
              <div className="space-y-3">
                <div className="bg-blue-50 p-3 rounded">
                  <p className="font-medium">
                    {request.userId.first_name} {request.userId.last_name}
                  </p>
                  <p className="text-sm text-gray-600">{request.userId.email}</p>
                  <p className="text-sm">
                    <strong>Date:</strong> {new Date(request.dtrDate).toLocaleDateString()}
                  </p>
                  <p className="text-sm">
                    <strong>Type:</strong> {request.adjustmentType}
                  </p>
                  <p className="text-sm">
                    <strong>Requested:</strong> {request.requestedValue}
                  </p>
                  <p className="text-sm mt-2">
                    <strong>Reason:</strong> {request.reason}
                  </p>
                </div>

                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add review notes (required for rejection)..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  rows={3}
                />

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleReview(request._id, "approve")}
                    className="flex-1 bg-green-600 text-white hover:bg-green-700"
                  >
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleReview(request._id, "reject")}
                    className="flex-1 bg-red-600 text-white hover:bg-red-700"
                  >
                    Reject
                  </Button>
                  <Button
                    onClick={() => {
                      setReviewingId(null);
                      setReviewNotes("");
                    }}
                    className="flex-1 bg-gray-400 text-white hover:bg-gray-500"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">
                    {request.userId.first_name} {request.userId.last_name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {new Date(request.dtrDate).toLocaleDateString()} • {request.adjustmentType}
                  </p>
                  <p className="text-sm mt-1">{request.reason}</p>
                </div>
                <Button
                  onClick={() => setReviewingId(request._id)}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  Review
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};
