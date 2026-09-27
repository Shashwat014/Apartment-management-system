import { Router } from 'express';
import { getCurrentUser, login, logout, register, updateProfile } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { loginSchema, profileSchema, registerSchema } from '../validators/schemas.js';

const router = Router();
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/logout', logout);
router.get('/me', authenticate, getCurrentUser);
router.patch('/me', authenticate, validate(profileSchema), updateProfile);
export default router;
