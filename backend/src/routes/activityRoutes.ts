import express from "express";
import { requireGlobalRole } from "../middlewares/rbac.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import {
  getActivityLogsHandler,
  exportActivityLogsHandler,
} from "../controllers/activityController.js";

const router = express.Router();

router.use(authMiddleware);
router.use(requireGlobalRole("Superadmin"));

router.get("/", getActivityLogsHandler);

router.post("/export", exportActivityLogsHandler);

export default router;
