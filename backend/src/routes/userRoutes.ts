import express from "express";
import {
  getUsers,
  getUserById,
  updateUser,
} from "../controllers/userController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = express.Router();

router.get("/", authMiddleware, getUsers);
router.get("/:userId", authMiddleware, getUserById);
router.put("/:userId", authMiddleware, updateUser);

export default router;
