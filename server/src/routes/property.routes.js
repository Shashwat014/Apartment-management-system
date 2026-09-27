import { Router } from 'express';
import { createProperty, deleteProperty, getProperty, listProperties, updateProperty } from '../controllers/property.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { propertyCreateSchema, propertyUpdateSchema } from '../validators/schemas.js';

const router = Router();
router.use(authenticate);
router.get('/', listProperties);
router.post('/', authorize('admin', 'owner'), validate(propertyCreateSchema), createProperty);
router.get('/:propertyId', getProperty);
router.patch('/:propertyId', validate(propertyUpdateSchema), updateProperty);
router.delete('/:propertyId', deleteProperty);
export default router;
