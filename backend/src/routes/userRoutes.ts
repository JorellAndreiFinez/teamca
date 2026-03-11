import { Router } from 'express';
import {
  activateUser,
  createUserHandler,
  getUser,
  listUsers,
  updateUserById,
  upsertInternProfileByUserId,
  whitelistUserEmail,
} from '../controllers/userController';
import authenticateJWT from '../middleware/auth';
import { requireGlobalRole } from '../middleware/rbac';

const router = Router();

router.get('/', authenticateJWT, listUsers);
router.get('/:userId', authenticateJWT, getUser);

router.post('/', authenticateJWT, requireGlobalRole('Superadmin', 'Admin'), createUserHandler);
router.put('/:userId', authenticateJWT, requireGlobalRole('Superadmin', 'Admin'), updateUserById);
router.post('/whitelist', authenticateJWT, requireGlobalRole('Superadmin'), whitelistUserEmail);
router.put('/:userId/activate', authenticateJWT, requireGlobalRole('Superadmin'), activateUser);
router.put('/:userId/intern-profile', authenticateJWT, upsertInternProfileByUserId);

export default router;