import express from 'express';
import { getGoogleOAuthUrl, handleGoogleOAuthCallback, getAllDrives } from '../controllers/driveController.js';

const router = express.Router();

// Google OAuth routes
router.get('/google-oauth-url', getGoogleOAuthUrl);
router.get('/google-oauth-callback', handleGoogleOAuthCallback);

// Get all drives
router.get('/drives', getAllDrives);

export default router; 