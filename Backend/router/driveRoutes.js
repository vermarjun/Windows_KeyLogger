import express from 'express';
import { getGoogleOAuthUrl, handleGoogleOAuthCallback } from '../controllers/driveController.js';

const router = express.Router();

// Google OAuth routes
router.get('/google-oauth-url', getGoogleOAuthUrl);
router.get('/google-oauth-callback', handleGoogleOAuthCallback);

export default router; 