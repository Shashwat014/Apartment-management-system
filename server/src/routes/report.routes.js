import { Router } from 'express';
import { getRentSummary } from '../controllers/report.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
router.use(authenticate, authorize('admin', 'owner'));
router.get('/rent-summary', getRentSummary);
export default router;
