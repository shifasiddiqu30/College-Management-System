import { Router } from 'express';
import { login, getMe } from '../controllers/authController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = Router();

// Public: Single Unified Login
router.post('/login', login);

// Protected: Get currently authenticated user profile
router.get('/me', verifyToken, getMe);

export default router;
