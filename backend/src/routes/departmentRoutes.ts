import { Router } from "express";
import {
  createDepartmentHandler,
  deleteDepartmentHandler,
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
router.patch(
  "/:departmentId",
  authenticateJWT,
  requireGlobalRole("Superadmin", "Admin"),
  updateDepartmentHandler,
);
router.delete(
  "/:departmentId",
  authenticateJWT,
  requireGlobalRole("Superadmin", "Admin"),
  deleteDepartmentHandler,
);

export default router;
