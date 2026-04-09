import express from 'express';
import Response from '../models/Response.js';
import Form from '../models/Form.js';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';
import { createTransport } from 'nodemailer';
import multer from 'multer';
import fs from 'fs';
import cloudinary from '../services/cloudinary.js';
import { appendResponseToSheet } from '../services/sheetsService.js';

const router = express.Router();

// Use memory storage with 5MB limit — we'll manually stream to Cloudinary 
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

const logDebug = (msg) => {
  if (!fs.existsSync('upload-debug.log')) {
    fs.writeFileSync('upload-debug.log', '');
  }
  fs.appendFileSync('upload-debug.log', new Date().toISOString() + ' - ' + msg + '\n');
  console.log('UPLOAD DEBUG:', msg);
};

// Email transporter setup
const transporter = createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS
  }
});

// Upload file endpoint
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    logDebug('Upload started for file: ' + (req.file ? req.file.originalname : 'no-file'));

    if (!req.file) {
      logDebug('No file found');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Stream buffer to Cloudinary with resource_type: auto so ALL file types work
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'form-responses',
          resource_type: 'auto',
          use_filename: true,
          unique_filename: true,
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    logDebug('File uploaded to Cloudinary: ' + uploadResult.secure_url);
    res.json({ url: uploadResult.secure_url });
  } catch (error) {
    logDebug(`Upload error: ${error.message} - ${error.stack}`);
    res.status(500).json({ error: 'File upload failed: ' + error.message });
  }
});

// Submit form response (public - no authentication needed)
router.post('/', async (req, res) => {
  try {
    const { formId, responses, submitterInfo, completionTime, userId, isEditable, emailCopyRequested } = req.body;

    // Verify form exists and is published
    const form = await Form.findById(formId);
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    if (form.status !== 'published') {
      return res.status(400).json({ error: 'Form is not published' });
    }

    // ── Expiry date check ───────────────────────────────────────────────────
    if (form.settings?.expiryDate && new Date() > new Date(form.settings.expiryDate)) {
      return res.status(400).json({ error: 'This form has expired and is no longer accepting responses.' });
    }

    // ── Domain restriction check ────────────────────────────────────────────
    const allowedDomains = form.settings?.allowedEmailDomains || [];
    if (allowedDomains.length > 0) {
      let submitterEmail = submitterInfo?.email || null;
      if (userId) {
        const submitterUser = await User.findById(userId).select('email');
        if (submitterUser) submitterEmail = submitterUser.email;
      }
      
      if (submitterEmail) {
        const emailDomain = submitterEmail.split('@')[1]?.toLowerCase();
        const domainAllowed = allowedDomains.some(d => d.toLowerCase() === emailDomain);
        if (!domainAllowed) {
          return res.status(403).json({
            error: `Access denied. This form is only accessible to ${allowedDomains.map(d => '@' + d).join(', ')} email addresses.`
          });
        }
      } else if (form.settings?.requireLogin) {
          // If login is required but no email found (shouldn't happen with proper frontend), deny
          return res.status(401).json({ error: 'Authentication required to verify email domain.' });
      }
    }

    // Create response
    const response = new Response({
      formId,
      responses,
      submitterInfo: {
        ...submitterInfo,
        userId: userId || submitterInfo?.userId,
        savedToAccount: !!userId
      },
      completionTime,
      submittedAt: new Date(),
      isEditable: !!isEditable,
      emailCopyRequested: !!emailCopyRequested
    });

    await response.save();

    // Update form response count
    form.responses += 1;
    form.completionRate = form.views > 0 ? (form.responses / form.views) * 100 : 0;
    await form.save();

    // ── Email notification to form creator ─────────────────────────────────
    if (form.settings?.emailNotifications !== false && process.env.EMAIL_USER) {
      try {
        // Fetch form creator to get their email
        const creator = await User.findById(form.createdBy).select('email name');
        const recipientEmail = form.settings?.notificationEmail || creator?.email;

        if (recipientEmail) {
          const emailContent = responses
            .map(r => `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:600;color:#374151;width:40%">${r.fieldLabel}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;color:#6B7280">${Array.isArray(r.value) ? r.value.join(', ') : r.value || '—'}</td></tr>`)
            .join('');

          await transporter.sendMail({
            from: `"OORB Forms" <${process.env.EMAIL_USER}>`,
            to: recipientEmail,
            subject: `📋 New Response: ${form.title}`,
            html: `
              <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff">
                <div style="background:#4F46E5;padding:24px 32px;border-radius:12px 12px 0 0">
                  <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700">New Form Response</h1>
                  <p style="color:#C7D2FE;margin:4px 0 0;font-size:14px">${form.title}</p>
                </div>
                <div style="padding:24px 32px">
                  <p style="color:#6B7280;font-size:14px;margin:0 0 20px">A new response was submitted on ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST.</p>
                  <table style="width:100%;border-collapse:collapse;border:1px solid #E5E7EB;border-radius:8px;overflow:hidden">
                    <thead><tr><th style="padding:10px 12px;background:#F9FAFB;text-align:left;font-size:12px;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.05em">Field</th><th style="padding:10px 12px;background:#F9FAFB;text-align:left;font-size:12px;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.05em">Response</th></tr></thead>
                    <tbody>${emailContent}</tbody>
                  </table>
                  <div style="margin-top:24px;padding:16px;background:#F0F9FF;border:1px solid #BAE6FD;border-radius:8px">
                    <p style="margin:0;font-size:13px;color:#0369A1">View all responses in your <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="color:#0284C7;font-weight:600">OORB Forms dashboard</a>.</p>
                  </div>
                </div>
                <div style="padding:16px 32px;background:#F9FAFB;border-top:1px solid #E5E7EB;border-radius:0 0 12px 12px">
                  <p style="margin:0;font-size:12px;color:#9CA3AF">Powered by OORB Forms · <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="color:#6B7280">Unsubscribe</a></p>
                </div>
              </div>
            `
          });
          console.log(`📧 Email notification sent to ${recipientEmail} for form: ${form.title}`);
        }
      } catch (emailError) {
        console.error('Email notification failed:', emailError.message);
      }
    }

    // ── Email copy to submitter ───────────────────────────────────────────
    if (emailCopyRequested && process.env.EMAIL_USER) {
      try {
        let recipientEmail = submitterInfo?.email;
        if (userId) {
          const submitterUser = await User.findById(userId).select('email');
          if (submitterUser) recipientEmail = submitterUser.email;
        }

        if (recipientEmail) {
          const emailContent = responses
            .map(r => `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:600;color:#374151;width:40%">${r.fieldLabel}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;color:#6B7280">${Array.isArray(r.value) ? r.value.join(', ') : r.value || '—'}</td></tr>`)
            .join('');

          await transporter.sendMail({
            from: `"OORB Forms" <${process.env.EMAIL_USER}>`,
            to: recipientEmail,
            subject: `📄 Your Response Copy: ${form.title}`,
            html: `
              <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff">
                <div style="background:#10B981;padding:24px 32px;border-radius:12px 12px 0 0">
                  <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700">Thank you for your response!</h1>
                  <p style="color:#D1FAE5;margin:4px 0 0;font-size:14px">Here is a copy of what you submitted to "${form.title}"</p>
                </div>
                <div style="padding:24px 32px">
                  <table style="width:100%;border-collapse:collapse;border:1px solid #E5E7EB;border-radius:8px;overflow:hidden">
                    <thead><tr><th style="padding:10px 12px;background:#F9FAFB;text-align:left;font-size:12px;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.05em">Field</th><th style="padding:10px 12px;background:#F9FAFB;text-align:left;font-size:12px;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.05em">Your Answer</th></tr></thead>
                    <tbody>${emailContent}</tbody>
                  </table>
                  ${isEditable ? `
                  <div style="margin-top:24px;padding:16px;background:#EFF6FF;border:1px solid #DBEAFE;border-radius:8px">
                    <p style="margin:0;font-size:13px;color:#1E40AF">Need to change something? You can edit your response in your <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="color:#2563EB;font-weight:600">Response History</a>.</p>
                  </div>
                  ` : ''}
                </div>
                <div style="padding:16px 32px;background:#F9FAFB;border-top:1px solid #E5E7EB;border-radius:0 0 12px 12px">
                  <p style="margin:0;font-size:12px;color:#9CA3AF">Powered by OORB Forms · Do not reply to this email.</p>
                </div>
              </div>
            `
          });
          console.log(`📧 Response copy sent to submitter: ${recipientEmail} for form: ${form.title}`);
        }
      } catch (submitterEmailError) {
        console.error('Submitter email copy failed:', submitterEmailError.message);
      }
    }

    // ── Google Sheets integration ───────────────────────────────────────────
    if (
      form.settings?.googleSheets?.enabled &&
      form.settings?.googleSheets?.spreadsheetId
    ) {
      try {
        const creator = await User.findById(form.createdBy).select('googleRefreshToken');
        if (creator?.googleRefreshToken) {
          await appendResponseToSheet(
            creator.googleRefreshToken,
            form.settings.googleSheets.spreadsheetId,
            form.settings.googleSheets.sheetName || 'Responses',
            form.fields,
            responses,
            new Date().toISOString()
          );
        }
      } catch (sheetsError) {
        console.error('Google Sheets sync failed:', sheetsError.message);
      }
    }

    res.status(201).json({
      message: 'Response submitted successfully',
      responseId: response._id
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update an existing response (only if allowEditing is true and user owns the response)
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const { responses, completionTime } = req.body;
    const responseId = req.params.id;

    const existingResponse = await Response.findById(responseId);
    if (!existingResponse) {
      return res.status(404).json({ error: 'Response not found' });
    }

    // Verify user owns the response
    if (existingResponse.submitterInfo.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied. You can only edit your own responses.' });
    }

    const form = await Form.findById(existingResponse.formId);
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    // Check if form allows editing
    if (!form.settings?.allowEditing || !existingResponse.isEditable) {
      return res.status(400).json({ error: 'Editing is not enabled for this form or submission.' });
    }

    // Check expiry date
    if (form.settings?.expiryDate && new Date() > new Date(form.settings.expiryDate)) {
      return res.status(400).json({ error: 'This form has expired. Editing is no longer allowed.' });
    }

    // Check editing duration limit
    if (form.settings?.editingDuration > 0) {
      const minutesSinceSubmission = (Date.now() - existingResponse.submittedAt.getTime()) / (1000 * 60);
      if (minutesSinceSubmission > form.settings.editingDuration) {
        return res.status(400).json({ error: `The time limit for editing (${form.settings.editingDuration} minutes) has passed.` });
      }
    }

    // Update response fields
    existingResponse.responses = responses;
    if (completionTime) existingResponse.completionTime = completionTime;
    existingResponse.lastEditedAt = new Date();

    await existingResponse.save();

    res.json({
      message: 'Response updated successfully',
      responseId: existingResponse._id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get responses for a form (only if user owns the form)
router.get('/form/:formId', authenticateToken, async (req, res) => {
  try {
    console.log('Responses route - Getting responses for form:', req.params.formId, 'by user:', req.user._id);
    console.log('Responses route - User object:', {
      id: req.user._id,
      email: req.user.email,
      name: req.user.name
    });

    // Verify user owns the form
    const form = await Form.findOne({
      _id: req.params.formId,
      $or: [
        { createdBy: req.user._id },
        { collaborators: req.user._id }
      ]
    });

    console.log('Responses route - Form query result:', form ? 'Found' : 'Not found');

    if (!form) {
      console.log('Responses route - Form not found or access denied for form:', req.params.formId);
      return res.status(403).json({ error: 'Form not found or access denied' });
    }

    const { page = 1, limit = 10 } = req.query;
    console.log('Responses route - Pagination params:', { page, limit });

    const skip = (page - 1) * limit;

    const responses = await Response.find({ formId: req.params.formId })
      .populate('submitterInfo.userId', 'email')
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Response.countDocuments({ formId: req.params.formId });

    console.log('Responses route - Found', responses.length, 'responses out of', total, 'total');

    res.json({
      responses,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: total
      }
    });
  } catch (error) {
    console.error('Responses route - Error getting responses:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's own responses (forms they've submitted to)
router.get('/my-responses', authenticateToken, async (req, res) => {
  try {
    console.log('MY_RESPONSES_DEBUG: Starting fetch for user:', req.user._id);

    // 1. Find responses
    const responses = await Response.find({
      'submitterInfo.userId': req.user._id,
      'submitterInfo.savedToAccount': true
    })
      .populate('formId', 'title description settings shareUrl')
      .sort({ submittedAt: -1 });

    console.log(`MY_RESPONSES_DEBUG: Found ${responses.length} responses in DB`);

    // 2. Filter and Map with extreme caution
    const formattedResponses = responses
      .filter(r => {
        if (!r.formId) {
          console.log(`MY_RESPONSES_DEBUG: Skipping response ${r._id} - formId is null (likely deleted form)`);
          return false;
        }
        return true;
      })
      .map(response => {
        try {
          // Mongoose populate might return the ID if population fails, 
          // or the object if it succeeds.
          const form = response.formId;
          const formIdStr = form._id ? form._id.toString() : form.toString();
          const formTitleStr = form.title || 'Untitled Form';

          return {
            _id: response._id,
            formId: formIdStr,
            formTitle: formTitleStr,
            responses: response.responses || [],
            submittedAt: response.submittedAt,
            completionTime: response.completionTime,
            isEditable: form.settings?.allowEditing || response.isEditable || false,
            shareUrl: form.shareUrl
          };
        } catch (mapError) {
          console.error('MY_RESPONSES_DEBUG: Error mapping individual response:', response._id, mapError);
          return null;
        }
      })
      .filter(Boolean); // Remove any that failed mapping

    console.log(`MY_RESPONSES_DEBUG: Returning ${formattedResponses.length} formatted responses`);
    res.json(formattedResponses);
  } catch (error) {
    console.error('MY_RESPONSES_DEBUG: FATAL ERROR in my-responses route:');
    console.error(error.stack);
    res.status(500).json({ 
      error: 'Failed to fetch your responses', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get single response (only if user owns the form)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    console.log('Responses route - Getting single response:', req.params.id, 'by user:', req.user._id);

    const response = await Response.findById(req.params.id).populate('formId');
    if (!response) {
      return res.status(404).json({ error: 'Response not found' });
    }

    // Verify user owns the response
    const isSubmitter = response.submitterInfo && response.submitterInfo.userId && 
                        response.submitterInfo.userId.toString() === req.user._id.toString();

    // Verify user owns the form (or is a collaborator)
    const form = await Form.findOne({
      _id: response.formId,
      $or: [
        { createdBy: req.user._id },
        { collaborators: req.user._id }
      ]
    });

    if (!form && !isSubmitter) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete response (only if user owns the form)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    console.log('Responses route - Deleting response:', req.params.id, 'by user:', req.user._id);

    const response = await Response.findById(req.params.id);
    if (!response) {
      return res.status(404).json({ error: 'Response not found' });
    }

    // Verify user owns the form
    const form = await Form.findOne({
      _id: response.formId,
      $or: [
        { createdBy: req.user._id },
        { collaborators: req.user._id }
      ]
    });

    if (!form) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await Response.findByIdAndDelete(req.params.id);

    // Update form response count
    if (form) {
      form.responses = Math.max(0, form.responses - 1);
      form.completionRate = form.views > 0 ? (form.responses / form.views) * 100 : 0;
      await form.save();
    }

    res.json({ message: 'Response deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


export default router;