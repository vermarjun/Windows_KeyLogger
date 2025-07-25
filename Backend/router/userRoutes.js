import express from 'express';
import { signup, login, getUser, updateUser, deleteUser, requestPasswordReset, resetPassword } from '../controllers/userController.js';
import auth from '../middlewares/auth.js';

const router = express.Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/request-password-reset', requestPasswordReset);
router.post('/reset-password/:token', resetPassword);

// Protected routes
router.get('/me', auth, getUser);
router.put('/me', auth, updateUser);
router.delete('/me', auth, deleteUser);

export default router; 