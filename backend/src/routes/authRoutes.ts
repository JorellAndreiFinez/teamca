import express from "express";
import {
  checkEmail,
  login,
  completeSetup,
} from "../controllers/authController";

const router = express.Router();

router.post("/check-email", checkEmail);
router.post("/login", login);
router.post("/complete-setup", completeSetup);

export default router;
