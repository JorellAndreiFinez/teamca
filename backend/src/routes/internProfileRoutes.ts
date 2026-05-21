import { Router } from "express";
import {
  createInternProfileHandler,
  getInternProfileByUser,
  updateInternProfileByUser,
} from "../controllers/internProfileController.js";
import authenticateJWT from "../middlewares/auth.js";

const router = Router();

router.get("/user/:userId", authenticateJWT, getInternProfileByUser);
router.post("/", authenticateJWT, createInternProfileHandler);
router.put("/user/:userId", authenticateJWT, updateInternProfileByUser);

export default router;
