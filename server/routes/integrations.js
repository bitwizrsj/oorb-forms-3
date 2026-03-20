import express from 'express';
import { google } from 'googleapis';
import User from '../models/User.js';
import { authenticateToken as auth } from '../middleware/auth.js';

const router = express.Router();

const getOAuth2Client = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
};

// Get OAuth URL
router.get('/google/auth', auth, (req, res) => {
  try {
    const oauth2Client = getOAuth2Client();
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/drive'
      ],
      // We need to know who the user is when they come back, so we pass their ID in state
      state: req.user._id.toString(),
      prompt: 'consent' // Forces Google to resend refresh token
    });
    res.json({ url });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ error: 'Failed to generate auth URL' });
  }
});

// OAuth Callback
router.get('/google/callback', async (req, res) => {
  const { code, state } = req.query;
  try {
    const oauth2Client = getOAuth2Client();
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    if (tokens.refresh_token) {
      // State contains the user's MongoDB ID
      if (state) {
        await User.findByIdAndUpdate(state, {
          googleRefreshToken: tokens.refresh_token
        });
      }
    }

    // Redirect back to frontend settings or dashboard
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/ai-chat?integration=success`);
  } catch (error) {
    console.error('Error exchanging oauth token:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/ai-chat?integration=error`);
  }
});

// Check integration status
router.get('/google/status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ isConnected: !!user.googleRefreshToken });
  } catch (error) {
    console.error('Error checking integration status:', error);
    res.status(500).json({ error: 'Failed to check status' });
  }
});

// Disconnect Google Drive
router.post('/google/disconnect', auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      googleRefreshToken: null
    });
    res.json({ success: true, message: 'Google Drive disconnected' });
  } catch (error) {
    console.error('Error disconnecting Google Drive:', error);
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

export default router;