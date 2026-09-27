import { Router } from 'express';
import { createRentRecord, listRentRecords, markRentPaid } from '../controllers/rent.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { rentCreateSchema, rentPaymentSchema } from '../validators/schemas.js';

const router = Router();
router.use(authenticate);
router.get('/', listRentRecords);
router.post('/', authorize('admin', 'owner'), validate(rentCreateSchema), createRentRecord);
router.patch('/:rentId/payment', authorize('admin', 'owner'), validate(rentPaymentSchema), markRentPaid);
export default router;
