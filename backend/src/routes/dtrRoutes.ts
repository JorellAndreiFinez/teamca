// backend\src\routes\dtrRoutes.ts

import express from "express";
import * as dtrController from "../controllers/dtrController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = express.Router();

router.post("/time-in", authMiddleware, dtrController.timeIn);
router.post("/time-out", authMiddleware, dtrController.timeOut);
router.get("/me", authMiddleware, dtrController.getMyDTR);

export default router;
