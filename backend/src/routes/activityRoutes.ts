import express from "express";
import { requireGlobalRole } from "../middlewares/rbac";
import { authMiddleware } from "../middlewares/authMiddleware";
import {
  getActivityLogsHandler,
  exportActivityLogsHandler,
} from "../controllers/activityController";

const router = express.Router();

router.use(authMiddleware);
router.use(requireGlobalRole("Superadmin"));

router.get("/", getActivityLogsHandler);

router.post("/export", exportActivityLogsHandler);

export default router;
