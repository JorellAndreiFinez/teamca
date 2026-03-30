// backend/src/routes/userRoutes.ts
import express from "express";
import {
  getUsers,
  getUserById,
  updateUser,
  getWhitelistedUsers,
  createUser,
  deleteUser,
} from "../controllers/userController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { requireAnyRole, requireGlobalRole } from "../middlewares/rbac";

const router = express.Router();

// Only Superadmin can access whitelist
router.get(
  "/whitelisted",
  authMiddleware,
  requireGlobalRole("Superadmin"),
  getWhitelistedUsers,
);

// Superadmin OR Admin can access all users
router.get(
  "/",
  authMiddleware,
  requireAnyRole(["Superadmin", "Admin"], ["Head", "Supervisor", "Intern"]),
  getUsers,
);

router.get("/:userId", authMiddleware, getUserById);
router.put("/:userId", authMiddleware, updateUser);

router.post(
  "/",
  authMiddleware,
  requireAnyRole(["Superadmin", "Admin"]),
  createUser,
);

router.delete(
  "/:userId",
  authMiddleware,
  requireAnyRole(["Superadmin", "Admin"]),
  deleteUser,
);

export default router;
