import { Router } from 'express';
import { createUser, deleteUser, listAuditLogs, listUsers, updateUser } from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { adminUserCreateSchema, userUpdateSchema } from '../validators/schemas.js';

const router = Router();
router.use(authenticate, authorize('admin'));
router.get('/users', listUsers);
router.post('/users', validate(adminUserCreateSchema), createUser);
router.patch('/users/:userId', validate(userUpdateSchema), updateUser);
router.delete('/users/:userId', deleteUser);
router.get('/audit-logs', listAuditLogs);
export default router;
