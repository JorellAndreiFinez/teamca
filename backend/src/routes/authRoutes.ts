import express from "express";
import rateLimit from "express-rate-limit";
import {
  checkEmail,
  login,
  completeSetup,
} from "../controllers/authController";

const router = express.Router();

const checkEmailLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 40,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many email checks. Please try again later." },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many login attempts. Please try again in 15 minutes." },
});

const completeSetupLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many setup attempts. Please try again later." },
});

router.post("/check-email", checkEmailLimiter, checkEmail);
router.post("/login", loginLimiter, login);
router.post("/complete-setup", completeSetupLimiter, completeSetup);

export default router;
