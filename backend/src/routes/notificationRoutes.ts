import { Router } from "express";
import authenticateJWT from "../middlewares/auth.js";
import {
  listNotificationsHandler,
  markAllNotificationsAsReadHandler,
  markNotificationAsReadHandler,
} from "../controllers/notificationController.js";

const router = Router();

router.use(authenticateJWT);
router.get("/", listNotificationsHandler);
router.patch("/read-all", markAllNotificationsAsReadHandler);
router.patch("/:notificationId/read", markNotificationAsReadHandler);

export default router;
