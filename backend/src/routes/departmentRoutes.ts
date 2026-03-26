import { Router } from "express";
import {
  createDepartmentHandler,
  getDepartment,
  listDepartments,
  updateDepartmentHandler,
} from "../controllers/departmentController";
import authenticateJWT from "../middlewares/auth";
import { requireGlobalRole } from "../middlewares/rbac";

const router = Router();

router.get("/", listDepartments);
router.get("/:departmentId", authenticateJWT, getDepartment);
router.post(
  "/",
  authenticateJWT,
  requireGlobalRole("Superadmin", "Admin"),
  createDepartmentHandler,
);
router.put(
  "/:departmentId",
  authenticateJWT,
  requireGlobalRole("Superadmin", "Admin"),
  updateDepartmentHandler,
);

export default router;
