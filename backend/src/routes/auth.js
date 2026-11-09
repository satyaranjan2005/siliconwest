const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const prisma = require('../db');
const { authenticate, JWT_SECRET } = require('../middleware/auth');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');

const router = express.Router();

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

const verifyEmailSchema = z.object({
  email: z.string().email(),
  code: z.string().min(4).max(10),
  sicNo: z.string().optional().nullable(),
  batch: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
});

const resendVerificationSchema = z.object({
  email: z.string().email(),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  email: z.string().email(),
  code: z.string().min(4).max(10),
  newPassword: z.string().min(6),
});

// Helper to generate a 6-digit numeric OTP
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Issue a new OTP and persist in database
async function issueOtp(email, type = 'EMAIL_VERIFICATION') {
  const code = generateOtp();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  // Invalidate previous unconsumed OTPs of this type
  await prisma.otp.updateMany({
    where: { email, type, isUsed: false },
    data: { isUsed: true },
  });

  // Store new OTP record
  await prisma.otp.create({
    data: {
      email,
      code,
      type,
      expiresAt,
    },
  });

  return { code, expiresAt };
}

// Verify submitted OTP from database
async function verifyOtp(email, code, type = 'EMAIL_VERIFICATION') {
  const submittedCode = String(code).trim();
  const now = new Date();

  const otpRecord = await prisma.otp.findFirst({
    where: {
      email,
      code: submittedCode,
      type,
      isUsed: false,
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (otpRecord) {
    await prisma.otp.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    });
    return true;
  }

  return false;
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        assignments: {
          include: {
            club: {
              select: { id: true, name: true, slug: true }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'This account has been deactivated. Contact Super Admin.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Check if email verification is required and pending
    if (user.isEmailVerified === false) {
      const { code: verificationCode, expiresAt: verificationCodeExpiresAt } = await issueOtp(normalizedEmail, 'EMAIL_VERIFICATION');

      await prisma.user.update({
        where: { id: user.id },
        data: { verificationCode, verificationCodeExpiresAt },
      });

      // Send fresh verification email
      await sendVerificationEmail({
        to: normalizedEmail,
        name: user.name,
        code: verificationCode,
      }).catch((err) => console.error('Failed to send verification email on login:', err));

      return res.status(403).json({
        error: 'Please verify your email address to continue. A fresh verification code was sent.',
        requiresVerification: true,
        email: normalizedEmail,
      });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        sicNo: user.sicNo,
        batch: user.batch,
        gender: user.gender,
        isEmailVerified: user.isEmailVerified,
        assignedClubs: user.assignments.map(a => a.club)
      }
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during authentication.' });
  }
});

// POST /api/auth/register (for participants / students)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = registerSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase().trim();

    // Enforce Silicon ID restriction
    const isSiliconEmail = (str) => {
      if (!str || typeof str !== 'string') return false;
      const lower = str.toLowerCase().trim();
      return (
        lower.endsWith('@silicon.ac.in') ||
        lower.endsWith('@siliconwest.in') ||
        /@([a-z0-9.-]+\.)?silicon\.ac\.in$/.test(lower)
      );
    };

    if (!isSiliconEmail(normalizedEmail)) {
      return res.status(400).json({
        error: 'Account registration is restricted to official Silicon IDs only (@silicon.ac.in or @siliconwest.in).'
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      // If user exists but is not verified, allow them to re-verify
      if (existingUser.isEmailVerified === false) {
        const { code: verificationCode, expiresAt: verificationCodeExpiresAt } = await issueOtp(normalizedEmail, 'EMAIL_VERIFICATION');
        const passwordHash = await bcrypt.hash(password, 10);

        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            name,
            passwordHash,
            verificationCode,
            verificationCodeExpiresAt,
          },
        });

        await sendVerificationEmail({
          to: normalizedEmail,
          name,
          code: verificationCode,
        }).catch((err) => console.error('Failed to send verification email:', err));

        return res.status(200).json({
          message: 'An unverified account already exists. A new verification code was sent to your email.',
          email: normalizedEmail,
          requiresVerification: true,
        });
      }

      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const { code: verificationCode, expiresAt: verificationCodeExpiresAt } = await issueOtp(normalizedEmail, 'EMAIL_VERIFICATION');

    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash,
        role: 'STUDENT',
        isActive: true,
        isEmailVerified: false,
        verificationCode,
        verificationCodeExpiresAt,
      }
    });

    // Send verification email
    await sendVerificationEmail({
      to: normalizedEmail,
      name,
      code: verificationCode,
    }).catch((err) => console.error('Failed to send verification email on register:', err));

    res.status(201).json({
      message: 'Account created! Please enter the 6-digit verification code sent to your email.',
      email: normalizedEmail,
      requiresVerification: true,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// POST /api/auth/verify-email
router.post('/verify-email', async (req, res) => {
  try {
    const { email, code, sicNo, batch, gender } = verifyEmailSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        assignments: {
          include: {
            club: {
              select: { id: true, name: true, slug: true }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Account not found with this email.' });
    }

    if (user.isEmailVerified) {
      // User is already verified, provide token
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      return res.json({
        message: 'Email is already verified.',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isEmailVerified: true,
          assignedClubs: user.assignments.map(a => a.club)
        }
      });
    }

    // Check verification code match against Otp table, fallback to user model
    const submittedCode = String(code).trim();
    const isOtpValid = await verifyOtp(normalizedEmail, submittedCode, 'EMAIL_VERIFICATION');
    const isLegacyValid = user.verificationCode &&
      String(user.verificationCode).trim() === submittedCode &&
      (!user.verificationCodeExpiresAt || new Date() <= new Date(user.verificationCodeExpiresAt));

    if (!isOtpValid && !isLegacyValid) {
      console.warn(`[VERIFY MISMATCH] Email: ${normalizedEmail} | Input: "${submittedCode}"`);
      return res.status(400).json({ error: 'Invalid verification code. Please check and try again.' });
    }

    // Mark as verified and clear code, saving student profile if provided
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        verificationCode: null,
        verificationCodeExpiresAt: null,
        ...(sicNo !== undefined && { sicNo: sicNo ? String(sicNo).trim().toUpperCase() : null }),
        ...(batch !== undefined && { batch: batch ? String(batch).trim() : null }),
        ...(gender !== undefined && { gender: gender ? String(gender).trim() : null }),
      },
    });

    const token = jwt.sign(
      { userId: updatedUser.id, role: updatedUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Email verified successfully! Welcome to Silicon West.',
      token,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        sicNo: updatedUser.sicNo,
        batch: updatedUser.batch,
        gender: updatedUser.gender,
        isEmailVerified: true,
        assignedClubs: user.assignments.map(a => a.club)
      }
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('Verify email error:', err);
    res.status(500).json({ error: 'Server error during email verification.' });
  }
});

// POST /api/auth/resend-verification
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = resendVerificationSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user) {
      return res.status(404).json({ error: 'No account found with this email.' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ error: 'This email is already verified. You can sign in directly.' });
    }

    const { code: verificationCode, expiresAt: verificationCodeExpiresAt } = await issueOtp(normalizedEmail, 'EMAIL_VERIFICATION');

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationCode,
        verificationCodeExpiresAt,
      },
    });

    await sendVerificationEmail({
      to: normalizedEmail,
      name: user.name,
      code: verificationCode,
    });

    res.json({ message: 'A fresh verification code has been sent to your email.' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('Resend verification error:', err);
    res.status(500).json({ error: 'Failed to resend verification code.' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase().trim();

    // Check whether any user with that email exists before sending email
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user) {
      return res.status(404).json({
        error: 'No registered user found with this email address. Please check your email or sign up.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        error: 'This account has been deactivated. Please contact campus administration.'
      });
    }

    const { code: resetToken, expiresAt: resetTokenExpiresAt } = await issueOtp(normalizedEmail, 'PASSWORD_RESET');

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiresAt,
      },
    });

    await sendPasswordResetEmail({
      to: normalizedEmail,
      name: user.name,
      code: resetToken,
    });

    res.json({
      message: 'A 6-digit password reset code has been sent to your email.',
      email: normalizedEmail,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Failed to process password reset request.' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = resetPasswordSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user) {
      return res.status(404).json({ error: 'Account not found with this email.' });
    }

    const submittedCode = String(code).trim();
    const isOtpValid = await verifyOtp(normalizedEmail, submittedCode, 'PASSWORD_RESET');
    const isLegacyValid = user.resetToken &&
      String(user.resetToken).trim() === submittedCode &&
      (!user.resetTokenExpiresAt || new Date() <= new Date(user.resetTokenExpiresAt));

    if (!isOtpValid && !isLegacyValid) {
      return res.status(400).json({ error: 'Invalid password reset code. Please check and try again.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiresAt: null,
      },
    });

    res.json({
      message: 'Your password has been reset successfully! You can now log in with your new password.',
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        assignments: {
          include: {
            club: {
              select: { id: true, name: true, slug: true, logoUrl: true }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      sicNo: user.sicNo,
      batch: user.batch,
      gender: user.gender,
      isEmailVerified: user.isEmailVerified,
      assignedClubs: user.assignments.map(a => a.club)
    });
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ error: 'Failed to fetch current user profile.' });
  }
});

// PATCH /api/auth/profile - Update student profile (SIC No, Batch, Gender, etc.)
router.patch('/profile', authenticate, async (req, res) => {
  try {
    const { sicNo, batch, gender, name } = req.body;
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(sicNo !== undefined && { sicNo: sicNo ? String(sicNo).trim().toUpperCase() : null }),
        ...(batch !== undefined && { batch: batch ? String(batch).trim() : null }),
        ...(gender !== undefined && { gender: gender ? String(gender).trim() : null }),
        ...(name !== undefined && { name: String(name).trim() }),
      }
    });

    res.json({
      message: 'Profile updated successfully.',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        sicNo: updatedUser.sicNo,
        batch: updatedUser.batch,
        gender: updatedUser.gender,
        isEmailVerified: updatedUser.isEmailVerified,
      }
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

module.exports = router;
