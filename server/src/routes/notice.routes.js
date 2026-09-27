import { Router } from 'express';
import { createNotice, listNotices } from '../controllers/notice.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { noticeCreateSchema } from '../validators/schemas.js';

const router = Router();
router.use(authenticate);
router.get('/', listNotices);
router.post('/', authorize('admin', 'owner'), validate(noticeCreateSchema), createNotice);
export default router;
