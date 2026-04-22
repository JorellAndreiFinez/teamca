import express from "express";
import rateLimit from "express-rate-limit";
import {
  getUsers,
  getUserById,
  updateUser,
  getWhitelistedUsers,
  createUser,
  deleteUser,
  createWhitelistedUserHandler,
  activateWhitelistedUserHandler,
} from "../controllers/userController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { requireAnyRole, requireGlobalRole } from "../middlewares/rbac";

const router = express.Router();

<<<<<<< Updated upstream
// rate limit 
const whitelistLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // max 50 whitelist operations per hour per IP
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many whitelist operations. Please try again later." },
  skip: (req) => {
    // skip for superadmins
    return req.user?.global_role === "Superadmin";
  },
});

router.post(
  "/whitelist",
  authMiddleware,
  requireGlobalRole("Superadmin"),
  whitelistLimiter,
  createWhitelistedUserHandler,
);

router.post(
  "/:userId/activate-whitelist",
  authMiddleware,
  requireGlobalRole("Superadmin"),
  activateWhitelistedUserHandler,
);

=======
>>>>>>> Stashed changes
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

router.post(
  "/",
  authMiddleware,
  requireGlobalRole("Superadmin"),
  createUser,
);

router.delete(
  "/:userId",
  authMiddleware,
  requireAnyRole(["Superadmin", "Admin"]),
  deleteUser,
);

export default router;
