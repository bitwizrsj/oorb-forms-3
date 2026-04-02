import express from 'express';
import jwt from 'jsonwebtoken';
import { google } from 'googleapis';
import { createTransport } from 'nodemailer';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// JWT Secret
if (!process.env.JWT_SECRET) {
  console.error('\x1b[31m%s\x1b[0m', 'FATAL ERROR: JWT_SECRET is not defined in environment variables.');
  process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET;
const RESET_SECRET = process.env.JWT_SECRET + '-reset';

// Email transporter (shared with responses route)
const transporter = createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS
  }
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    console.log('Registration attempt:', { name, email });

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Create new user
    const user = new User({ name, email, password });
    await user.save();

    console.log('User created successfully:', user._id);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, _id: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data (without password)
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      preferences: user.preferences,
      createdAt: user.createdAt
    };

    console.log('Registration successful, sending response');

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: userData
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Login attempt:', { email });

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log('Login attempt failed: User not found:', email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last login
    await user.updateLastLogin();

    // Generate JWT token — 30 days if rememberMe, else 7 days
    const rememberMe = req.body.rememberMe === true;
    const token = jwt.sign(
      { userId: user._id, _id: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: rememberMe ? '30d' : '7d' }
    );


    // Return user data (without password)
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      preferences: user.preferences,
      lastLogin: user.lastLogin
    };

    console.log('Login successful for user:', user._id);

    res.json({
      message: 'Login successful',
      token,
      user: userData
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    console.log('Getting current user:', req.user._id);

    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, avatar, preferences } = req.body;

    console.log('Updating profile for user:', req.user._id);

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        name,
        avatar,
        preferences,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Change password
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both current and new passwords are required' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect current password' });
    }

    // Hash and save new password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Logout (client-side token removal)
router.post('/logout', (req, res) => {
  res.json({ message: 'Logout successful' });
});

// ── Forgot Password ───────────────────────────────────────────────────────
// POST /api/auth/forgot-password  { email }
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    // Always respond 200 — don't leak whether an account exists
    if (!user) {
      return res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
    }

    // Create short-lived reset token (15 min) signed with a different secret
    const resetToken = jwt.sign(
      { userId: user._id, email: user.email, purpose: 'password-reset' },
      RESET_SECRET,
      { expiresIn: '15m' }
    );

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    if (!process.env.EMAIL_USER) {
      console.warn('EMAIL_USER not set — cannot send reset email. Reset link:', resetLink);
      return res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
    }

    await transporter.sendMail({
      from: `"OORB Forms" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: '🔑 Reset your OORB Forms password',
      html: `
        <div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:0 auto;background:#fff">
          <div style="background:#4F46E5;padding:24px 32px;border-radius:12px 12px 0 0">
            <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700">Password Reset</h1>
            <p style="color:#C7D2FE;margin:4px 0 0;font-size:13px">OORB Forms</p>
          </div>
          <div style="padding:32px">
            <p style="color:#374151;font-size:15px;margin:0 0 8px">Hi <strong>${user.name}</strong>,</p>
            <p style="color:#6B7280;font-size:14px;margin:0 0 24px">We received a request to reset your password. Click the button below to choose a new one. This link expires in <strong>15 minutes</strong>.</p>
            <a href="${resetLink}" style="display:inline-block;padding:14px 28px;background:#4F46E5;color:#fff;font-weight:700;font-size:14px;border-radius:10px;text-decoration:none">Reset Password</a>
            <p style="color:#9CA3AF;font-size:12px;margin:24px 0 0">If you didn't request this, you can safely ignore this email. Your password won't change.</p>
            <p style="color:#9CA3AF;font-size:11px;margin:8px 0 0">Link expires in 15 minutes.</p>
          </div>
          <div style="padding:16px 32px;background:#F9FAFB;border-top:1px solid #E5E7EB;border-radius:0 0 12px 12px">
            <p style="margin:0;font-size:11px;color:#9CA3AF">Powered by OORB Forms</p>
          </div>
        </div>
      `
    });

    console.log(`📧 Password reset email sent to ${user.email}`);
    res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to send reset email' });
  }
});

// ── Reset Password ────────────────────────────────────────────────────────
// POST /api/auth/reset-password  { token, password }
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token and new password are required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    // Verify reset token
    let payload;
    try {
      payload = jwt.verify(token, RESET_SECRET);
    } catch {
      return res.status(400).json({ error: 'Reset link is invalid or has expired. Please request a new one.' });
    }

    if (payload.purpose !== 'password-reset') {
      return res.status(400).json({ error: 'Invalid reset token' });
    }

    const user = await User.findById(payload.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Update password (pre-save hook hashes it)
    user.password = password;
    user.updatedAt = new Date();
    await user.save();

    console.log(`✅ Password reset successful for ${user.email}`);
    res.json({ message: 'Password reset successfully. You can now log in with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Google Login Redirect
router.get('/google/login', (req, res) => {
  try {
    const redirectUri = process.env.GOOGLE_AUTH_REDIRECT_URI || 'http://localhost:5001/api/auth/google/callback';
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['profile', 'email']
    });
    res.redirect(url);
  } catch (error) {
    console.error('Google login generation error:', error);
    res.status(500).json({ error: 'Failed to generate auth URL' });
  }
});

// Google Login Callback
router.get('/google/callback', async (req, res) => {
  const { code } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  try {
    const redirectUri = process.env.GOOGLE_AUTH_REDIRECT_URI || 'http://localhost:5001/api/auth/google/callback';
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    // Check if user exists
    let user = await User.findOne({ email: userInfo.data.email });
    if (!user) {
      // Create user
      user = new User({
        name: userInfo.data.name,
        email: userInfo.data.email,
        password: Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8), // Dummy password
        avatar: userInfo.data.picture
      });
      await user.save();
    } else {
      await user.updateLastLogin();
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, _id: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.redirect(`${frontendUrl}/login?token=${token}`);
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.redirect(`${frontendUrl}/login?error=google_failed`);
  }
});

export default router;