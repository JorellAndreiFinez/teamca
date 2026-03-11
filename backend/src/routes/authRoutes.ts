import { Router } from 'express';
import {
  checkEmailHandler,
  completeSetupHandler,
  loginHandler,
  logoutHandler,
} from '../controllers/authController';

const router = Router();

router.post('/check-email', checkEmailHandler);
router.post('/login', loginHandler);
router.post('/complete-setup', completeSetupHandler);
router.post('/logout', logoutHandler);

export default router;