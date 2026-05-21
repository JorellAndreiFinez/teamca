import express from "express";
import * as dtrController from "../controllers/dtrController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { timeAdjustmentController } from "../controllers/timeAdjustmentController";
import { reminderController } from "../controllers/reminderController";
import { exportController } from "../controllers/exportController";

const router = express.Router();

// Clock in/out
router.post("/time-in", authMiddleware, dtrController.timeIn);
router.post("/time-out", authMiddleware, dtrController.timeOut);
router.get("/me", authMiddleware, dtrController.getMyDTR);

// Breaks
router.post("/break-start", authMiddleware, dtrController.startBreak);
router.post("/break-end", authMiddleware, dtrController.endBreak);

// Summaries
router.get("/summary/week", authMiddleware, dtrController.getSummaryWeek);
router.get("/summary/month", authMiddleware, dtrController.getSummaryMonth);

// History (paginated)
router.get("/history", authMiddleware, dtrController.getHistory);

// Time Adjustment Requests
router.post(
  "/adjustment-request",
  authMiddleware,
  timeAdjustmentController.submitRequest,
);
router.get(
  "/adjustment-requests",
  authMiddleware,
  timeAdjustmentController.getUserRequests,
);
router.get(
  "/adjustment-requests-pending",
  authMiddleware,
  timeAdjustmentController.getPendingRequests,
);
router.get(
  "/adjustment-request/:id",
  authMiddleware,
  timeAdjustmentController.getRequest,
);
router.post(
  "/adjustment-request/:id/approve",
  authMiddleware,
  timeAdjustmentController.approveRequest,
);
router.post(
  "/adjustment-request/:id/reject",
  authMiddleware,
  timeAdjustmentController.rejectRequest,
);

// Reminders
router.get("/reminders", authMiddleware, reminderController.getReminder);
router.put("/reminders", authMiddleware, reminderController.updateReminder);
router.post(
  "/reminders/reset",
  authMiddleware,
  reminderController.resetReminder,
);

// Export
router.get("/export", authMiddleware, exportController.exportRecords);
router.get("/export/preview", authMiddleware, exportController.previewExport);

export default router;
