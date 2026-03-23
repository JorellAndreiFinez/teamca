import { Router } from "express";
import authenticateJWT from "../middleware/auth";
import {
  assignTaskHandler,
  createTaskHandler,
  listTasksHandler,
} from "../controllers/taskController";

const router = Router();

router.use(authenticateJWT);
router.get("/", listTasksHandler);
router.post("/", createTaskHandler);
router.post("/:taskId/assign", assignTaskHandler);

export default router;
