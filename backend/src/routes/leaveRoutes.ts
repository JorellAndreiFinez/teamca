// backend/src/routes/leaveRoutes.ts

import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import { requireAnyRole } from "../middlewares/rbac";
import {
  createLeaveHandler,
  getMyLeavesHandler,
  getPendingLeavesHandler,
  reviewLeaveHandler,
  cancelLeaveHandler,
} from "../controllers/leaveController";

const router = Router();

// All leave routes require authentication
router.use(authMiddleware);

// ── applicant routes ───────────────────────────────────────────────────────────

// POST   /leave          → file a new leave request (any authenticated user)
router.post("/", createLeaveHandler);

// GET    /leave/me       → get own leave history
router.get("/me", getMyLeavesHandler);

// PATCH  /leave/:leaveId/cancel  → cancel own pending leave
router.patch("/:leaveId/cancel", cancelLeaveHandler);

// ── reviewer routes ────────────────────────────────────────────────────────────

// GET    /leave/pending  → get pending leaves (admins: all; heads: dept-scoped)
// requireAnyRole: global Admin/Superadmin OR department Head
router.get(
  "/pending",
  requireAnyRole(["Admin", "Superadmin"], ["Head"]),
  getPendingLeavesHandler,
);

// PATCH  /leave/:leaveId/approve  → approve or reject a leave
// Body: { status: "approved" | "rejected", rejectionReason?: string }
router.patch(
  "/:leaveId/approve",
  requireAnyRole(["Admin", "Superadmin"], ["Head"]),
  reviewLeaveHandler,
);

export default router;