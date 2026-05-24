import express from "express";
import {
  getUsers,
  getUserById,
  updateUser,
  getWhitelistedUsers,
  createWhitelistedUserHandler,
  activateWhitelistedUserHandler,
  deleteWhitelistedUserHandler,
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

router.post(
  "/whitelist",
  authMiddleware,
  requireGlobalRole("Superadmin"),
  createWhitelistedUserHandler,
);

router.delete(
  "/whitelist/:userId",
  authMiddleware,
  requireGlobalRole("Superadmin"),
  deleteWhitelistedUserHandler,
);

router.get(
  "/",
  authMiddleware,
  requireAnyRole(["Superadmin", "Admin"], ["Head", "Supervisor"]),
  getUsers,
);

router.post(
  "/:userId/activate-whitelist",
  authMiddleware,
  requireGlobalRole("Superadmin"),
  activateWhitelistedUserHandler,
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
