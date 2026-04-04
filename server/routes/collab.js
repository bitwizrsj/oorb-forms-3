import express from 'express';
import Form from '../models/Form.js';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';
import { createTransport } from 'nodemailer';
import crypto from 'crypto';

const router = express.Router();

// Email transporter setup (Reused from responses.js)
const transporter = createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS
  }
});

// Invite a collaborator
router.post('/:formId/invite', authenticateToken, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    // 1. Verify form ownership
    const form = await Form.findOne({ _id: req.params.formId, createdBy: req.user._id });
    if (!form) return res.status(404).json({ error: 'Form not found or access denied' });

    // 2. Check if already a collaborator
    const invitee = await User.findOne({ email: email.toLowerCase() });
    if (invitee && form.collaborators.some(id => id.toString() === invitee._id.toString())) {
      return res.status(400).json({ error: 'User is already a collaborator' });
    }

    // 3. Generate token
    const token = crypto.randomBytes(32).toString('hex');

    // 4. Update pending invites
    // Remove any existing pending invite for this email first
    form.pendingCollaborators = form.pendingCollaborators.filter(p => p.email !== email.toLowerCase());
    form.pendingCollaborators.push({
      email: email.toLowerCase(),
      token,
      invitedAt: new Date()
    });
    await form.save();

    // 5. Send Invite Email
    const acceptUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/collab/accept/${token}`;
    
    const mailOptions = {
      from: `"OORB Forms" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Invitation to collaborate on "${form.title}"`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #4F46E5;">You're Invited!</h2>
          <p>Hello,</p>
          <p><strong>${req.user.name}</strong> (${req.user.email}) has invited you to collaborate on their form: <strong>"${form.title}"</strong>.</p>
          <p>As a collaborator, you'll be able to edit the form, view analytics, and manage responses.</p>
          <div style="margin: 30px 0;">
            <a href="${acceptUrl}" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Accept Invitation</a>
          </div>
          <p style="color: #666; font-size: 13px;">If you don't have an account, you'll be asked to create one first.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 11px; color: #999;">OORB Forms - The modern way to collect data.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'Invitation sent successfully', pendingCollaborators: form.pendingCollaborators });

  } catch (error) {
    console.error('Collab Invite Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Accept an invitation
router.post('/accept/:token', authenticateToken, async (req, res) => {
  try {
    const { token } = req.params;

    // 1. Find form by token
    const form = await Form.findOne({ 'pendingCollaborators.token': token });
    if (!form) return res.status(404).json({ error: 'Invalid or expired invitation token' });

    // 2. Verify identity matches invite (optional but recommended)
    const invite = form.pendingCollaborators.find(p => p.token === token);
    if (invite.email.toLowerCase() !== req.user.email.toLowerCase()) {
      return res.status(403).json({ error: 'This invitation was sent to a different email address' });
    }

    // 3. Add to collaborators and remove from pending
    const userIdStr = req.user._id.toString();
    if (!form.collaborators.some(id => id.toString() === userIdStr)) {
      form.collaborators.push(req.user._id);
    }
    form.pendingCollaborators = form.pendingCollaborators.filter(p => p.token !== token);
    
    await form.save();
    res.json({ message: 'Invitation accepted!', formId: form._id });

  } catch (error) {
    console.error('Collab Accept Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Remove a collaborator
router.delete('/:formId/remove/:userId', authenticateToken, async (req, res) => {
  try {
    // 1. Verify requester is owner
    const form = await Form.findOne({ _id: req.params.formId, createdBy: req.user._id });
    if (!form) return res.status(404).json({ error: 'Form not found or access denied (Only owners can remove collaborators)' });

    // 2. Remove
    form.collaborators = form.collaborators.filter(id => id.toString() !== req.params.userId);
    await form.save();

    res.json({ message: 'Collaborator removed', collaborators: form.collaborators });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get collaborators for a form
router.get('/:formId', authenticateToken, async (req, res) => {
  try {
    const form = await Form.findOne({ 
      _id: req.params.formId, 
      $or: [{ createdBy: req.user._id }, { collaborators: req.user._id }] 
    }).populate('collaborators', 'name email avatar')
      .populate('createdBy', 'name email avatar');

    if (!form) return res.status(404).json({ error: 'Form not found' });

    res.json({
      createdBy: form.createdBy,
      collaborators: form.collaborators,
      pending: form.pendingCollaborators.map(p => ({ email: p.email, invitedAt: p.invitedAt }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
