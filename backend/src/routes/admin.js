const express = require('express');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const prisma = require('../db');
const { authenticate, requireSuperAdmin } = require('../middleware/auth');

const router = express.Router();

// Enforce Super Admin on all routes in this file
router.use(authenticate, requireSuperAdmin);

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['SUPER_ADMIN', 'CLUB_ADMIN', 'STUDENT']).default('CLUB_ADMIN'),
  clubIds: z.array(z.string().uuid()).optional(),
});

// GET /api/admin/users - List users
router.get('/users', async (req, res) => {
  try {
    const { role, search } = req.query;

    const where = {
      ...(role ? { role } : {}),
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ]
      } : {})
    };

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        assignments: {
          include: {
            club: {
              select: { id: true, name: true, slug: true }
            }
          }
        }
      }
    });

    res.json(users);
  } catch (err) {
    console.error('List admin users error:', err);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// POST /api/admin/users - Super Admin manually provisions a user account
router.post('/users', async (req, res) => {
  try {
    const data = createUserSchema.parse(req.body);
    const normalizedEmail = data.email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existing) {
      return res.status(409).json({ error: 'User with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const newUser = await prisma.user.create({
      data: {
        name: data.name,
        email: normalizedEmail,
        passwordHash,
        role: data.role,
        isActive: true,
      }
    });

    // If club assignments were provided for Club Admin
    if (data.role === 'CLUB_ADMIN' && data.clubIds && data.clubIds.length > 0) {
      await prisma.clubAdminAssignment.createMany({
        data: data.clubIds.map(clubId => ({
          userId: newUser.id,
          clubId,
          assignedByUserId: req.user.id
        })),
        skipDuplicates: true
      });
    }

    const userWithAssignments = await prisma.user.findUnique({
      where: { id: newUser.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        assignments: {
          include: { club: { select: { id: true, name: true, slug: true } } }
        }
      }
    });

    res.status(201).json(userWithAssignments);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('Admin create user error:', err);
    res.status(500).json({ error: 'Failed to create user.' });
  }
});

// PATCH /api/admin/users/:id/status - Toggle active/deactive status
router.patch('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActive must be a boolean.' });
    }

    // Protect: Super Admin cannot deactivate themselves
    if (id === req.user.id) {
      return res.status(400).json({ error: 'You cannot deactivate your own Super Admin account.' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: { id: true, name: true, email: true, role: true, isActive: true }
    });

    res.json(updated);
  } catch (err) {
    console.error('Toggle user status error:', err);
    res.status(500).json({ error: 'Failed to update user status.' });
  }
});

// PATCH /api/admin/users/:id/role - Change user role
router.patch('/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['SUPER_ADMIN', 'CLUB_ADMIN', 'STUDENT'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role specified.' });
    }

    if (id === req.user.id && role !== 'SUPER_ADMIN') {
      return res.status(400).json({ error: 'You cannot demote your own Super Admin account.' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        assignments: {
          include: { club: { select: { id: true, name: true, slug: true } } }
        }
      }
    });

    res.json(updated);
  } catch (err) {
    console.error('Update user role error:', err);
    res.status(500).json({ error: 'Failed to update user role.' });
  }
});

// POST /api/admin/assignments - Assign Club Admin to Club
router.post('/assignments', async (req, res) => {
  try {
    const { userId, clubId } = req.body;

    if (!userId || !clubId) {
      return res.status(400).json({ error: 'userId and clubId are required.' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Auto-promote student to CLUB_ADMIN when assigned to lead a club
    if (user.role === 'STUDENT') {
      await prisma.user.update({
        where: { id: userId },
        data: { role: 'CLUB_ADMIN' },
      });
    }

    const club = await prisma.club.findUnique({ where: { id: clubId } });
    if (!club) {
      return res.status(404).json({ error: 'Club not found.' });
    }

    // Enforce maximum of 2 admins per club
    const existingAdminCount = await prisma.clubAdminAssignment.count({
      where: { clubId }
    });

    if (existingAdminCount >= 2) {
      return res.status(400).json({
        error: `This club already has the maximum of 2 administrators assigned (${existingAdminCount}/2). Please revoke an existing admin before assigning a new one.`
      });
    }

    const assignment = await prisma.clubAdminAssignment.create({
      data: {
        userId,
        clubId,
        assignedByUserId: req.user.id,
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        club: { select: { id: true, name: true, slug: true } }
      }
    });

    res.status(201).json(assignment);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'This user is already assigned to this club.' });
    }
    console.error('Assignment error:', err);
    res.status(500).json({ error: 'Failed to create assignment.' });
  }
});

// DELETE /api/admin/assignments/:id - Remove assignment
router.delete('/assignments/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.clubAdminAssignment.delete({
      where: { id }
    });

    res.json({ message: 'Assignment removed successfully.' });
  } catch (err) {
    console.error('Delete assignment error:', err);
    res.status(500).json({ error: 'Failed to remove assignment.' });
  }
});

// GET /api/admin/registrations - Platform-wide registrations
router.get('/registrations', async (req, res) => {
  try {
    const { search, status, eventId } = req.query;

    const where = {
      ...(eventId ? { eventId } : {}),
      ...(status ? { status } : {}),
      ...(search ? {
        OR: [
          { participantName: { contains: search, mode: 'insensitive' } },
          { participantEmail: { contains: search, mode: 'insensitive' } },
          { rollNumber: { contains: search, mode: 'insensitive' } },
          { collegeName: { contains: search, mode: 'insensitive' } },
          { event: { title: { contains: search, mode: 'insensitive' } } }
        ]
      } : {})
    };

    const registrations = await prisma.registration.findMany({
      where,
      orderBy: { registeredAt: 'desc' },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
            startsAt: true,
            club: { select: { name: true, slug: true } }
          }
        }
      }
    });

    res.json(registrations);
  } catch (err) {
    console.error('Platform registrations error:', err);
    res.status(500).json({ error: 'Failed to fetch registrations.' });
  }
});

module.exports = router;
