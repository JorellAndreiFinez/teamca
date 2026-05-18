import { Router } from "express";
import authenticateJWT from "../middlewares/auth";
import {
  listNotificationsHandler,
  markAllNotificationsAsReadHandler,
  markNotificationAsReadHandler,
} from "../controllers/notificationController";

const router = Router();

router.use(authenticateJWT);
router.get("/", listNotificationsHandler);
router.patch("/read-all", markAllNotificationsAsReadHandler);
router.patch("/:notificationId/read", markNotificationAsReadHandler);

export default router;
