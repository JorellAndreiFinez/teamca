import express from "express";
import {
  getUsers,
  getUserById,
  updateUser,
  getWhitelistedUsers,
  createUser,
  deleteUser,
} from "../controllers/userController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { requireAnyRole, requireGlobalRole } from "../middlewares/rbac.js";

const router = express.Router();

router.get(
  "/whitelisted",
  authMiddleware,
  requireGlobalRole("Superadmin"),
  getWhitelistedUsers,
);

router.get(
  "/",
  authMiddleware,
  requireAnyRole(["Superadmin", "Admin"], ["Head", "Supervisor"]),
  getUsers,
);

router.get("/:userId", authMiddleware, getUserById);
router.put("/:userId", authMiddleware, updateUser);

router.post("/", authMiddleware, requireGlobalRole("Superadmin"), createUser);

router.delete(
  "/:userId",
  authMiddleware,
  requireAnyRole(["Superadmin", "Admin"]),
  deleteUser,
);

export default router;
