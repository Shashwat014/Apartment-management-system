import { Router } from 'express';
import { assignTenant, createUnit, deleteUnit, listUnits, removeTenant, updateUnit } from '../controllers/unit.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { assignTenantSchema, unitCreateSchema, unitUpdateSchema } from '../validators/schemas.js';

const router = Router();
router.use(authenticate);
router.get('/', listUnits);
router.post('/', authorize('admin', 'owner'), validate(unitCreateSchema), createUnit);
router.patch('/:unitId', authorize('admin', 'owner'), validate(unitUpdateSchema), updateUnit);
router.patch('/:unitId/tenant', authorize('admin', 'owner'), validate(assignTenantSchema), assignTenant);
router.delete('/:unitId/tenant', authorize('admin', 'owner'), removeTenant);
router.delete('/:unitId', authorize('admin', 'owner'), deleteUnit);
export default router;
