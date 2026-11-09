const express = require('express');
const { z } = require('zod');
const prisma = require('../db');
const {
  authenticate,
  optionalAuth,
  requireClubAdmin,
  requireSuperAdmin,
  canUserManageClub,
  checkEventAccess,
} = require('../middleware/auth');

const router = express.Router();

const eventCreateSchema = z.object({
  clubId: z.string().uuid(),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  summary: z.string().optional().nullable().or(z.literal('')),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  bannerUrl: z.string().optional().nullable().or(z.literal('')),
  category: z.string().optional().nullable(),
  venue: z.string().optional().nullable(),
  onlineMeetingUrl: z.string().optional().nullable().or(z.literal('')),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  registrationDeadline: z.string().datetime(),
  capacity: z.number().int().nonnegative().optional().nullable(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'CANCELLED']).default('DRAFT'),

  // Extended Details & Requirements
  isRegistrationRequired: z.boolean().optional().default(true),
  entryFee: z.string().optional().nullable(),
  eligibility: z.string().optional().nullable(),
  isTeamEvent: z.boolean().optional().default(false),
  minTeamSize: z.number().int().positive().optional().nullable(),
  maxTeamSize: z.number().int().positive().optional().nullable(),
  prizePool: z.string().optional().nullable(),
  rewards: z.any().optional().nullable(),
  rules: z.any().optional().nullable(),
  timeline: z.any().optional().nullable(),

  // Attachment / Brochure
  attachmentUrl: z.string().optional().nullable(),
  attachmentName: z.string().optional().nullable(),
  attachmentSize: z.string().optional().nullable(),

  // Coordinators
  coordinator1Name: z.string().optional().nullable(),
  coordinator1Role: z.string().optional().nullable(),
  coordinator1Email: z.string().optional().nullable(),
  coordinator1Phone: z.string().optional().nullable(),
  coordinator2Name: z.string().optional().nullable(),
  coordinator2Role: z.string().optional().nullable(),
  coordinator2Email: z.string().optional().nullable(),
  coordinator2Phone: z.string().optional().nullable(),

  meta: z.any().optional().nullable(),
});

const eventUpdateSchema = z.object({
  clubId: z.string().optional(),
  title: z.string().min(3).optional(),
  summary: z.string().optional().nullable(),
  description: z.string().min(10).optional(),
  bannerUrl: z.string().optional().nullable().or(z.literal('')),
  category: z.string().optional().nullable(),
  venue: z.string().optional().nullable(),
  onlineMeetingUrl: z.string().optional().nullable().or(z.literal('')),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  registrationDeadline: z.string().datetime().optional(),
  capacity: z.number().int().positive().optional().nullable(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'CANCELLED']).optional(),

  isRegistrationRequired: z.boolean().optional(),
  entryFee: z.string().optional().nullable(),
  eligibility: z.string().optional().nullable(),
  isTeamEvent: z.boolean().optional(),
  minTeamSize: z.number().int().positive().optional().nullable(),
  maxTeamSize: z.number().int().positive().optional().nullable(),
  prizePool: z.string().optional().nullable(),
  rewards: z.any().optional().nullable(),
  rules: z.any().optional().nullable(),
  timeline: z.any().optional().nullable(),
  attachmentUrl: z.string().optional().nullable(),
  attachmentName: z.string().optional().nullable(),
  attachmentSize: z.string().optional().nullable(),
  coordinator1Name: z.string().optional().nullable(),
  coordinator1Role: z.string().optional().nullable(),
  coordinator1Email: z.string().optional().nullable(),
  coordinator1Phone: z.string().optional().nullable(),
  coordinator2Name: z.string().optional().nullable(),
  coordinator2Role: z.string().optional().nullable(),
  coordinator2Email: z.string().optional().nullable(),
  coordinator2Phone: z.string().optional().nullable(),
  meta: z.any().optional().nullable(),
});

// GET /api/events - List events (public)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { search, category, clubSlug, timeframe, status } = req.query;
    const now = new Date();

    // Default status for public: only PUBLISHED
    let statusFilter = { in: ['PUBLISHED'] };

    // If an admin requests a specific status
    if (req.user && (req.user.role === 'SUPER_ADMIN' || req.user.role === 'CLUB_ADMIN')) {
      if (status) {
        statusFilter = { equals: status };
      } else if (req.query.allStatuses === 'true') {
        statusFilter = undefined;
      }
    }

    // Role-based club scoping:
    // If user is CLUB_ADMIN and queries in dashboard/management context (allStatuses=true or managedOnly=true),
    // strictly limit to events belonging to their assigned clubs
    let clubConstraint = clubSlug ? { club: { slug: clubSlug } } : {};
    if (req.user && req.user.role === 'CLUB_ADMIN' && (req.query.allStatuses === 'true' || req.query.managedOnly === 'true')) {
      const assignedIds = req.user.assignedClubIds || [];
      clubConstraint = {
        clubId: { in: assignedIds },
        ...(clubSlug ? { club: { slug: clubSlug } } : {})
      };
    }

    const where = {
      ...clubConstraint,
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(category ? { category: { equals: category, mode: 'insensitive' } } : {}),
      ...(timeframe === 'upcoming' ? { startsAt: { gte: now } } : {}),
      ...(timeframe === 'past' ? { endsAt: { lt: now } } : {}),
      ...(search ? {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { summary: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { venue: { contains: search, mode: 'insensitive' } },
          { club: { name: { contains: search, mode: 'insensitive' } } }
        ]
      } : {})
    };

    const events = await prisma.event.findMany({
      where,
      orderBy: { startsAt: 'asc' },
      include: {
        club: {
          select: { id: true, name: true, slug: true, logoUrl: true }
        },
        _count: {
          select: {
            registrations: {
              where: { status: 'CONFIRMED' }
            }
          }
        }
      }
    });

    const sanitized = events.map(e => ({
      id: e.id,
      title: e.title,
      slug: e.slug,
      summary: e.summary,
      bannerUrl: e.bannerUrl,
      category: e.category,
      venue: e.venue,
      onlineMeetingUrl: e.onlineMeetingUrl,
      startsAt: e.startsAt,
      endsAt: e.endsAt,
      registrationDeadline: e.registrationDeadline,
      capacity: e.capacity,
      status: e.status,
      club: e.club,
      confirmedRegistrationsCount: e._count.registrations,
      isRegistrationOpen: e.status === 'PUBLISHED' &&
        new Date(e.registrationDeadline) > now &&
        (!e.capacity || e._count.registrations < e.capacity)
    }));

    res.json(sanitized);
  } catch (err) {
    console.error('List events error:', err);
    res.status(500).json({ error: 'Failed to fetch events.' });
  }
});

// GET /api/events/dashboard/registrations - Scoped list of event registrations for dashboard
router.get('/dashboard/registrations', authenticate, requireClubAdmin, async (req, res) => {
  try {
    const isSuperAdmin = req.user.role === 'SUPER_ADMIN';
    const assignedClubIds = req.user.assignedClubIds || [];

    const eventFilter = isSuperAdmin ? {} : { clubId: { in: assignedClubIds } };

    const registrations = await prisma.registration.findMany({
      where: {
        event: eventFilter,
      },
      orderBy: { registeredAt: 'desc' },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
            startsAt: true,
            venue: true,
            category: true,
            club: { select: { id: true, name: true, slug: true, logoUrl: true } }
          }
        },
        teamInvitations: {
          select: {
            id: true,
            inviteeName: true,
            inviteeEmail: true,
            status: true,
            createdAt: true
          }
        }
      }
    });

    res.json(registrations);
  } catch (err) {
    console.error('Fetch dashboard registrations error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard registrations.' });
  }
});

// GET /api/events/:slug - Event details (public)
router.get('/:slug', optionalAuth, async (req, res) => {
  try {
    const { slug } = req.params;
    const now = new Date();

    let event = await prisma.event.findUnique({
      where: { slug },
      include: {
        club: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            shortDescription: true,
            contactEmail: true
          }
        },
        _count: {
          select: {
            registrations: {
              where: { status: 'CONFIRMED' }
            }
          }
        }
      }
    });

    if (!event) {
      event = await prisma.event.findUnique({
        where: { id: slug },
        include: {
          club: {
            select: {
              id: true,
              name: true,
              slug: true,
              logoUrl: true,
              shortDescription: true,
              contactEmail: true
            }
          },
          _count: {
            select: {
              registrations: {
                where: { status: 'CONFIRMED' }
              }
            }
          }
        }
      });
    }

    if (!event) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    // If draft or cancelled, only authorized admins can view
    if (event.status !== 'PUBLISHED') {
      const canManage = canUserManageClub(req.user, event.clubId);
      if (!canManage) {
        return res.status(404).json({ error: 'Event not available.' });
      }
    }

    const confirmedCount = event._count.registrations;
    const isDeadlinePassed = new Date(event.registrationDeadline) <= now;
    const isFull = event.capacity ? confirmedCount >= event.capacity : false;
    const isRegistrationOpen = event.status === 'PUBLISHED' && !isDeadlinePassed && !isFull;

    let registrationCloseReason = null;
    if (event.status !== 'PUBLISHED') registrationCloseReason = `Event is ${event.status.toLowerCase()}`;
    else if (isDeadlinePassed) registrationCloseReason = 'Registration deadline has passed';
    else if (isFull) registrationCloseReason = 'Event capacity reached (Sold out)';

    res.json({
      ...event,
      confirmedRegistrationsCount: confirmedCount,
      isRegistrationOpen,
      registrationCloseReason,
      canManage: canUserManageClub(req.user, event.clubId)
    });
  } catch (err) {
    console.error('Get event error:', err);
    res.status(500).json({ error: 'Failed to fetch event details.' });
  }
});

// POST /api/events - Create event (Super Admin only)
router.post('/', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const data = eventCreateSchema.parse(req.body);

    // Verify date logic
    const startsAt = new Date(data.startsAt);
    const endsAt = new Date(data.endsAt);
    const deadline = new Date(data.registrationDeadline);

    if (endsAt <= startsAt) {
      return res.status(400).json({ error: 'Event end time must be after start time.' });
    }

    if (deadline > endsAt) {
      return res.status(400).json({ error: 'Registration deadline cannot be after event concludes.' });
    }

    const existingSlug = await prisma.event.findUnique({
      where: { slug: data.slug }
    });

    if (existingSlug) {
      return res.status(409).json({ error: 'An event with this slug already exists.' });
    }

    const event = await prisma.event.create({
      data: {
        clubId: data.clubId,
        title: data.title,
        slug: data.slug,
        summary: data.summary || null,
        description: data.description,
        bannerUrl: data.bannerUrl || null,
        category: data.category || null,
        venue: data.venue || null,
        onlineMeetingUrl: data.onlineMeetingUrl || null,
        startsAt,
        endsAt,
        registrationDeadline: deadline,
        capacity: data.capacity || null,
        status: data.status,
        isRegistrationRequired: data.isRegistrationRequired !== undefined ? data.isRegistrationRequired : true,
        entryFee: data.entryFee || 'Free',
        eligibility: data.eligibility || null,
        isTeamEvent: data.isTeamEvent || false,
        minTeamSize: data.minTeamSize || 1,
        maxTeamSize: data.maxTeamSize || 1,
        prizePool: data.prizePool || null,
        rewards: data.rewards || null,
        rules: data.rules || null,
        timeline: data.timeline || null,
        attachmentUrl: data.attachmentUrl || null,
        attachmentName: data.attachmentName || null,
        attachmentSize: data.attachmentSize || null,
        coordinator1Name: data.coordinator1Name || null,
        coordinator1Role: data.coordinator1Role || null,
        coordinator1Email: data.coordinator1Email || null,
        coordinator1Phone: data.coordinator1Phone || null,
        coordinator2Name: data.coordinator2Name || null,
        coordinator2Role: data.coordinator2Role || null,
        coordinator2Email: data.coordinator2Email || null,
        coordinator2Phone: data.coordinator2Phone || null,
        meta: data.meta || null,
        createdByUserId: req.user.id,
      },
      include: {
        club: {
          select: { id: true, name: true, slug: true }
        }
      }
    });

    res.status(201).json(event);
  } catch (err) {
    if (err instanceof z.ZodError) {
      const message = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
      return res.status(400).json({ error: `Validation error: ${message}`, details: err.errors });
    }
    console.error('Create event error:', err);
    res.status(500).json({ error: err.message || 'Failed to create event.' });
  }
});

// PUT /api/events/:id - Update event
router.put('/:id', authenticate, checkEventAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const data = eventUpdateSchema.parse(req.body);

    // Validate timestamps if updated
    if (data.startsAt || data.endsAt || data.registrationDeadline) {
      const current = await prisma.event.findUnique({ where: { id } });
      const startsAt = new Date(data.startsAt || current.startsAt);
      const endsAt = new Date(data.endsAt || current.endsAt);
      const deadline = new Date(data.registrationDeadline || current.registrationDeadline);

      if (endsAt <= startsAt) {
        return res.status(400).json({ error: 'Event end time must be after start time.' });
      }
      if (deadline > startsAt) {
        return res.status(400).json({ error: 'Registration deadline cannot be after start time.' });
      }
    }

    // Check capacity reduction safety (Section 8.5)
    if (data.capacity !== undefined && data.capacity !== null) {
      const confirmedCount = await prisma.registration.count({
        where: { eventId: id, status: 'CONFIRMED' }
      });
      if (data.capacity < confirmedCount) {
        return res.status(400).json({
          error: `Cannot reduce capacity to ${data.capacity} because there are already ${confirmedCount} confirmed registrations.`
        });
      }
    }

    const event = await prisma.event.update({
      where: { id },
      data: {
        ...(data.clubId && { clubId: data.clubId }),
        ...(data.title && { title: data.title }),
        ...(data.summary !== undefined && { summary: data.summary }),
        ...(data.description && { description: data.description }),
        ...(data.bannerUrl !== undefined && { bannerUrl: data.bannerUrl }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.venue !== undefined && { venue: data.venue }),
        ...(data.onlineMeetingUrl !== undefined && { onlineMeetingUrl: data.onlineMeetingUrl }),
        ...(data.startsAt && { startsAt: new Date(data.startsAt) }),
        ...(data.endsAt && { endsAt: new Date(data.endsAt) }),
        ...(data.registrationDeadline && { registrationDeadline: new Date(data.registrationDeadline) }),
        ...(data.capacity !== undefined && { capacity: data.capacity }),
        ...(data.status && { status: data.status }),
        ...(data.isRegistrationRequired !== undefined && { isRegistrationRequired: data.isRegistrationRequired }),
        ...(data.entryFee !== undefined && { entryFee: data.entryFee }),
        ...(data.eligibility !== undefined && { eligibility: data.eligibility }),
        ...(data.isTeamEvent !== undefined && { isTeamEvent: data.isTeamEvent }),
        ...(data.minTeamSize !== undefined && { minTeamSize: data.minTeamSize }),
        ...(data.maxTeamSize !== undefined && { maxTeamSize: data.maxTeamSize }),
        ...(data.prizePool !== undefined && { prizePool: data.prizePool }),
        ...(data.rewards !== undefined && { rewards: data.rewards }),
        ...(data.rules !== undefined && { rules: data.rules }),
        ...(data.timeline !== undefined && { timeline: data.timeline }),
        ...(data.attachmentUrl !== undefined && { attachmentUrl: data.attachmentUrl }),
        ...(data.attachmentName !== undefined && { attachmentName: data.attachmentName }),
        ...(data.attachmentSize !== undefined && { attachmentSize: data.attachmentSize }),
        ...(data.coordinator1Name !== undefined && { coordinator1Name: data.coordinator1Name }),
        ...(data.coordinator1Role !== undefined && { coordinator1Role: data.coordinator1Role }),
        ...(data.coordinator1Email !== undefined && { coordinator1Email: data.coordinator1Email }),
        ...(data.coordinator1Phone !== undefined && { coordinator1Phone: data.coordinator1Phone }),
        ...(data.coordinator2Name !== undefined && { coordinator2Name: data.coordinator2Name }),
        ...(data.coordinator2Role !== undefined && { coordinator2Role: data.coordinator2Role }),
        ...(data.coordinator2Email !== undefined && { coordinator2Email: data.coordinator2Email }),
        ...(data.coordinator2Phone !== undefined && { coordinator2Phone: data.coordinator2Phone }),
        ...(data.meta !== undefined && { meta: data.meta }),
      }
    });

    res.json(event);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('Update event error:', err);
    res.status(500).json({ error: 'Failed to update event.' });
  }
});

// GET /api/events/:id/registrations - Authorized list of registrations
router.get('/:id/registrations', authenticate, checkEventAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const { search, status } = req.query;

    const where = {
      eventId: id,
      ...(status ? { status } : {}),
      ...(search ? {
        OR: [
          { participantName: { contains: search, mode: 'insensitive' } },
          { participantEmail: { contains: search, mode: 'insensitive' } },
          { rollNumber: { contains: search, mode: 'insensitive' } },
          { collegeName: { contains: search, mode: 'insensitive' } },
        ]
      } : {})
    };

    const registrations = await prisma.registration.findMany({
      where,
      orderBy: { registeredAt: 'desc' }
    });

    res.json(registrations);
  } catch (err) {
    console.error('Get event registrations error:', err);
    res.status(500).json({ error: 'Failed to fetch registrations.' });
  }
});

// GET /api/events/:id/export - CSV Export with formula injection prevention (Section 9.4)
router.get('/:id/export', authenticate, checkEventAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const event = req.targetEvent;

    const registrations = await prisma.registration.findMany({
      where: { eventId: id },
      orderBy: { registeredAt: 'asc' }
    });

    // Sanitizer for CSV Formula Injection: prefix dangerous characters with single quote
    const sanitizeCsvValue = (val) => {
      if (val === null || val === undefined) return '""';
      let str = String(val).replace(/"/g, '""');
      if (/^[=+\-@\t\r]/.test(str)) {
        str = "'" + str;
      }
      return `"${str}"`;
    };

    const headers = ['Registration ID', 'Participant Name', 'Email', 'Phone', 'Team Name', 'College', 'Roll Number', 'Branch', 'Year', 'Status', 'Registered At'];
    const rows = registrations.map(r => [
      sanitizeCsvValue(r.id),
      sanitizeCsvValue(r.participantName),
      sanitizeCsvValue(r.participantEmail),
      sanitizeCsvValue(r.phone),
      sanitizeCsvValue(r.teamName || 'Individual'),
      sanitizeCsvValue(r.collegeName),
      sanitizeCsvValue(r.rollNumber),
      sanitizeCsvValue(r.branch),
      sanitizeCsvValue(r.year),
      sanitizeCsvValue(r.status),
      sanitizeCsvValue(new Date(r.registeredAt).toISOString()),
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\r\n');

    const filename = `registrations-${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${Date.now()}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
  } catch (err) {
    console.error('Export registrations error:', err);
    res.status(500).json({ error: 'Failed to export registrations.' });
  }
});

module.exports = router;
