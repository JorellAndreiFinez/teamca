import { Router } from "express";
import authenticateJWT from "../middleware/auth";
import {
  addTaskWorkLinkHandler,
  addTaskFeedbackHandler,
  assignTaskHandler,
  createTaskHandler,
  deleteTaskWorkLinkHandler,
  listTaskFeedbackHandler,
  listTaskWorkLinksHandler,
  listTaskStatusHistoryHandler,
  listTasksHandler,
  updateTaskStatusHandler,
} from "../controllers/taskController";

const router = Router();

router.use(authenticateJWT);
router.get("/", listTasksHandler);
router.post("/", createTaskHandler);
router.post("/:taskId/assign", assignTaskHandler);
router.patch("/:taskId/status", updateTaskStatusHandler);
router.get("/:taskId/status-history", listTaskStatusHistoryHandler);
router.get("/:taskId/work-links", listTaskWorkLinksHandler);
router.post("/:taskId/work-links", addTaskWorkLinkHandler);
router.delete("/:taskId/work-links/:workLinkId", deleteTaskWorkLinkHandler);
router.get("/:taskId/feedback", listTaskFeedbackHandler);
router.post("/:taskId/feedback", addTaskFeedbackHandler);

export default router;
