import express from 'express';
import { google } from 'googleapis';
import User from '../models/User.js';
import Form from '../models/Form.js';
import { authenticateToken as auth } from '../middleware/auth.js';
import { createSpreadsheet } from '../services/sheetsService.js';

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
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/spreadsheets'
      ],
      state: req.user._id.toString(),
      prompt: 'consent'
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

// ── Google Sheets: Link spreadsheet to a form ──────────────────────────────
// POST /api/integrations/google-sheets/link
// Body: { formId, spreadsheetId, sheetName, enabled }
router.post('/google-sheets/link', auth, async (req, res) => {
  try {
    const { formId, spreadsheetId, sheetName = 'Responses', enabled = true } = req.body;
    if (!formId) return res.status(400).json({ error: 'formId is required' });

    const form = await Form.findOne({ _id: formId, createdBy: req.user._id });
    if (!form) return res.status(404).json({ error: 'Form not found or access denied' });

    form.settings = form.settings || {};
    form.settings.googleSheets = { spreadsheetId, sheetName, enabled };
    await form.save();

    res.json({ success: true, googleSheets: form.settings.googleSheets });
  } catch (error) {
    console.error('Error linking Google Sheets:', error);
    res.status(500).json({ error: 'Failed to link Google Sheets' });
  }
});

// ── Google Sheets: Create new spreadsheet for a form ──────────────────────
// POST /api/integrations/google-sheets/create
// Body: { formId, title }
router.post('/google-sheets/create', auth, async (req, res) => {
  try {
    const { formId, title } = req.body;

    const user = await User.findById(req.user._id);
    if (!user?.googleRefreshToken) {
      return res.status(400).json({ error: 'Google account not connected. Please connect Google Drive first.' });
    }

    const form = await Form.findOne({ _id: formId, createdBy: req.user._id });
    if (!form) return res.status(404).json({ error: 'Form not found' });

    const sheet = await createSpreadsheet(
      user.googleRefreshToken,
      title || `${form.title} – Responses`
    );

    // Auto-link the new sheet to the form
    form.settings = form.settings || {};
    form.settings.googleSheets = {
      spreadsheetId: sheet.spreadsheetId,
      sheetName: sheet.sheetName,
      enabled: true
    };
    await form.save();

    res.json({ success: true, ...sheet });
  } catch (error) {
    console.error('Error creating Google Sheet:', error);
    res.status(500).json({ error: 'Failed to create Google Sheet: ' + error.message });
  }
});

export default router;