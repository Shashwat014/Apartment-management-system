import { Router } from 'express';
import { getOwnerDashboard, getTenantDashboard } from '../controllers/dashboard.controller.js';
import { getAdminDashboard } from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);
router.get('/admin', authorize('admin'), getAdminDashboard);
router.get('/owner', authorize('owner'), getOwnerDashboard);
router.get('/tenant', authorize('tenant'), getTenantDashboard);
export default router;
