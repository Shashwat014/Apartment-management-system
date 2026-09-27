import { Router } from 'express';
import { createMaintenance, listMaintenance, updateMaintenance } from '../controllers/maintenance.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { maintenanceCreateSchema, maintenanceUpdateSchema } from '../validators/schemas.js';

const router = Router();
router.use(authenticate);
router.get('/', listMaintenance);
router.post('/', authorize('tenant'), validate(maintenanceCreateSchema), createMaintenance);
router.patch('/:requestId', authorize('admin', 'owner'), validate(maintenanceUpdateSchema), updateMaintenance);
export default router;
