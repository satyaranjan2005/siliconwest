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
        participantUser: {
          select: {
            sicNo: true,
            batch: true,
            gender: true,
          }
        },
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
            startsAt: true,
            venue: true,
            category: true,
            entryFee: true,
            club: { select: { id: true, name: true, slug: true, logoUrl: true } }
          }
        },
        teamInvitations: {
          select: {
            id: true,
            inviteeName: true,
            inviteeEmail: true,
            status: true,
            createdAt: true,
            invitee: {
              select: {
                sicNo: true,
                batch: true,
                gender: true,
              }
            }
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

    // Check if current user (or their team) is already registered for this event
    let userRegistration = null;
    if (req.user) {
      const userEmail = (req.user.email || '').toLowerCase().trim();
      const userId = req.user.id;

      // 1. Direct registration (individual or team leader)
      const direct = await prisma.registration.findFirst({
        where: {
          eventId: event.id,
          status: 'CONFIRMED',
          OR: [
            { participantUserId: userId },
            { participantEmail: { equals: userEmail, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          status: true,
          teamName: true,
          registeredAt: true,
          participantName: true,
          participantEmail: true,
        }
      });

      if (direct) {
        userRegistration = {
          id: direct.id,
          teamName: direct.teamName,
          role: direct.teamName ? 'Team Leader' : 'Participant',
          status: direct.status,
          registeredAt: direct.registeredAt,
          isLeader: Boolean(direct.teamName)
        };
      } else {
        // 2. Check if accepted member in an event's registered team
        const invite = await prisma.teamInvitation.findFirst({
          where: {
            eventId: event.id,
            status: 'ACCEPTED',
            OR: [
              { inviteeUserId: userId },
              { inviteeEmail: { equals: userEmail, mode: 'insensitive' } }
            ]
          },
          include: {
            registration: {
              select: {
                id: true,
                status: true,
                teamName: true,
                registeredAt: true
              }
            }
          }
        });

        if (invite && invite.registration && invite.registration.status === 'CONFIRMED') {
          userRegistration = {
            id: invite.registration.id,
            teamName: invite.teamName || invite.registration.teamName,
            role: 'Team Member',
            status: 'CONFIRMED',
            registeredAt: invite.registration.registeredAt,
            isLeader: false
          };
        }
      }
    }

    res.json({
      ...event,
      confirmedRegistrationsCount: confirmedCount,
      isRegistrationOpen,
      registrationCloseReason,
      userRegistration,
      isAlreadyRegistered: Boolean(userRegistration),
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

// Helper: Calculate Academic Year from Graduating Batch (e.g. "2023 - 2027") or SIC (e.g. "23BTECH042")
function calculateYearFromBatch(batchStr, sicNo, fallbackYear) {
  let startYear = null;

  // 1. Extract from batch string: "2023 - 2027", "2023-2027", "2023"
  if (batchStr) {
    const match = String(batchStr).match(/\b(20\d{2})\b/);
    if (match) {
      startYear = parseInt(match[1], 10);
    }
  }

  // 2. Fallback to first 2 digits of SIC: "23BTECH042", "24BCSN10"
  if (!startYear && sicNo) {
    const match = String(sicNo).trim().match(/^(\d{2})/);
    if (match) {
      startYear = 2000 + parseInt(match[1], 10);
    }
  }

  if (startYear) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12
    // Academic session starts in July (month 7)
    const academicSessionStart = currentMonth >= 7 ? currentYear : currentYear - 1;
    const yearDiff = academicSessionStart - startYear + 1;

    if (yearDiff === 1) return '1st Year';
    if (yearDiff === 2) return '2nd Year';
    if (yearDiff === 3) return '3rd Year';
    if (yearDiff === 4) return '4th Year';
    if (yearDiff > 4) return `${yearDiff}th Year`;
    if (yearDiff <= 0) return 'Incoming';
  }

  return fallbackYear || 'N/A';
}

// GET /api/events/:id/export - Styled Colored Excel Sheet & CSV Export
router.get('/:id/export', authenticate, checkEventAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const event = req.targetEvent;
    const format = (req.query.format || 'excel').toLowerCase();
    const teamFormat = (req.query.teamFormat || 'roster').toLowerCase(); // 'roster' (1 row per member) or 'columns' (wide google forms)

    const registrations = await prisma.registration.findMany({
      where: { eventId: id },
      include: {
        participantUser: {
          select: {
            sicNo: true,
            batch: true,
            gender: true,
          }
        },
        teamInvitations: {
          select: {
            id: true,
            inviteeName: true,
            inviteeEmail: true,
            status: true,
            invitee: {
              select: {
                sicNo: true,
                batch: true,
                gender: true,
              }
            }
          }
        },
        event: {
          select: {
            title: true,
            category: true,
            venue: true,
            startsAt: true,
            isTeamEvent: true,
            club: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: { registeredAt: 'asc' }
    });

    // Sanitizer for CSV Formula Injection
    const sanitizeCsvValue = (val) => {
      if (val === null || val === undefined) return '""';
      let str = String(val).replace(/"/g, '""');
      if (/^[=+\-@\t\r]/.test(str)) {
        str = "'" + str;
      }
      return `"${str}"`;
    };

    const escapeHtml = (str) => {
      if (str === null || str === undefined) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };

    const formatTimestamp = (date) => {
      if (!date) return '';
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };

    const isTeamEvent = Boolean(event.isTeamEvent);
    const cleanTitle = (event.title || 'Event').replace(/[^a-z0-9]/gi, '_');

    // Helper to extract teammates roster from teamInvitations or teamMembers JSON
    const extractTeamMembers = (r) => {
      const members = [];
      if (Array.isArray(r.teamInvitations) && r.teamInvitations.length > 0) {
        r.teamInvitations.forEach((inv) => {
          const name = inv.inviteeName || 'Teammate';
          const email = inv.inviteeEmail || 'N/A';
          const sic = inv.invitee?.sicNo || (email.match(/^(\d{2}[a-zA-Z0-9]+)@/)?.[1]?.toUpperCase()) || 'N/A';
          const year = calculateYearFromBatch(inv.invitee?.batch, sic !== 'N/A' ? sic : null, null);
          const gender = inv.invitee?.gender || 'N/A';

          let dept = 'N/A';
          if (sic && sic !== 'N/A') {
            const match = sic.match(/^\d{2}([A-Za-z]+)/);
            if (match) {
              const code = match[1].toUpperCase();
              if (code.includes('CSE') || code.includes('CSN') || code.includes('BCSE')) dept = 'Computer Science & Engineering';
              else if (code.includes('ECE') || code.includes('BECE')) dept = 'Electronics & Communication';
              else if (code.includes('EEE') || code.includes('BEEE')) dept = 'Electrical & Electronics';
              else if (code.includes('MECH') || code.includes('BMECH')) dept = 'Mechanical Engineering';
              else if (code.includes('CIVIL') || code.includes('BCIVIL')) dept = 'Civil Engineering';
              else if (code.includes('IT') || code.includes('BIT')) dept = 'Information Technology';
              else dept = code;
            }
          }

          members.push({
            name,
            email,
            sic,
            phone: 'N/A',
            year,
            gender,
            dept,
            status: inv.status || 'ACCEPTED',
          });
        });
      } else if (Array.isArray(r.teamMembers) && r.teamMembers.length > 0) {
        r.teamMembers.forEach((m) => {
          if (typeof m === 'object' && m !== null) {
            const name = m.name || m.fullName || 'Teammate';
            const email = m.email || 'N/A';
            const sic = m.sic || m.sicNo || (email.match(/^(\d{2}[a-zA-Z0-9]+)@/)?.[1]?.toUpperCase()) || 'N/A';
            const year = calculateYearFromBatch(m.batch, sic !== 'N/A' ? sic : null, m.year);
            const gender = m.gender || 'N/A';
            const dept = m.branch || m.department || 'N/A';
            members.push({
              name,
              email,
              sic,
              phone: m.phone || 'N/A',
              year,
              gender,
              dept,
              status: m.status || 'CONFIRMED',
            });
          } else if (typeof m === 'string') {
            members.push({
              name: m,
              email: 'N/A',
              sic: 'N/A',
              phone: 'N/A',
              year: 'N/A',
              gender: 'N/A',
              dept: 'N/A',
              status: 'CONFIRMED',
            });
          }
        });
      }
      return members;
    };

    // Calculate maximum teammate count across all teams for column-wise export
    let maxTeammates = 0;
    if (isTeamEvent) {
      registrations.forEach(r => {
        const mems = extractTeamMembers(r);
        if (mems.length > maxTeammates) maxTeammates = mems.length;
      });
    }

    // =========================================================================
    // 1. PLAIN CSV EXPORT
    // =========================================================================
    if (format === 'csv') {
      let csvHeaders = [];
      const csvRows = [];

      if (!isTeamEvent) {
        // Individual Event CSV: 8 exact requested columns
        csvHeaders = ['Timestamp', 'Name', 'SIC', 'Email', 'Phone No', 'Year', 'Gender', 'Department'];
        registrations.forEach(r => {
          const sic = r.rollNumber || r.participantUser?.sicNo || 'N/A';
          const batch = r.participantUser?.batch;
          const year = calculateYearFromBatch(batch, sic, r.year);
          const gender = r.participantUser?.gender || 'N/A';
          const dept = r.branch || 'N/A';
          csvRows.push([
            sanitizeCsvValue(formatTimestamp(r.registeredAt)),
            sanitizeCsvValue(r.participantName),
            sanitizeCsvValue(sic),
            sanitizeCsvValue(r.participantEmail),
            sanitizeCsvValue(r.phone || 'N/A'),
            sanitizeCsvValue(year),
            sanitizeCsvValue(gender),
            sanitizeCsvValue(dept),
          ].join(','));
        });
      } else if (teamFormat === 'columns') {
        // Team Event CSV: Wide Columns per Member (Google Forms style)
        csvHeaders = [
          'Timestamp', 'Team Name', 'Team Size',
          'Leader Name', 'Leader SIC', 'Leader Email', 'Leader Phone No', 'Leader Year', 'Leader Gender', 'Leader Department'
        ];
        for (let m = 2; m <= maxTeammates + 1; m++) {
          csvHeaders.push(
            `Member ${m} Name`, `Member ${m} SIC`, `Member ${m} Email`,
            `Member ${m} Phone No`, `Member ${m} Year`, `Member ${m} Gender`, `Member ${m} Department`
          );
        }
        csvHeaders.push('Status');

        registrations.forEach(r => {
          const sic = r.rollNumber || r.participantUser?.sicNo || 'N/A';
          const batch = r.participantUser?.batch;
          const year = calculateYearFromBatch(batch, sic, r.year);
          const gender = r.participantUser?.gender || 'N/A';
          const dept = r.branch || 'N/A';
          const teammates = extractTeamMembers(r);
          const teamSize = 1 + teammates.length;

          const row = [
            sanitizeCsvValue(formatTimestamp(r.registeredAt)),
            sanitizeCsvValue(r.teamName || 'Team'),
            sanitizeCsvValue(teamSize),
            sanitizeCsvValue(r.participantName),
            sanitizeCsvValue(sic),
            sanitizeCsvValue(r.participantEmail),
            sanitizeCsvValue(r.phone || 'N/A'),
            sanitizeCsvValue(year),
            sanitizeCsvValue(gender),
            sanitizeCsvValue(dept),
          ];

          for (let i = 0; i < maxTeammates; i++) {
            const member = teammates[i];
            if (member) {
              row.push(
                sanitizeCsvValue(member.name),
                sanitizeCsvValue(member.sic),
                sanitizeCsvValue(member.email),
                sanitizeCsvValue(member.phone),
                sanitizeCsvValue(member.year),
                sanitizeCsvValue(member.gender),
                sanitizeCsvValue(member.dept)
              );
            } else {
              row.push('""', '""', '""', '""', '""', '""', '""');
            }
          }

          row.push(sanitizeCsvValue(r.status));
          csvRows.push(row.join(','));
        });
      } else {
        // Team Event CSV: Roster Format (1 Row per Participant) - Recommended
        csvHeaders = [
          'Timestamp', 'Team Name', 'Role', 'Participant Name', 'SIC',
          'Email', 'Phone No', 'Year', 'Gender', 'Department', 'Team Size', 'Status'
        ];

        registrations.forEach(r => {
          const sic = r.rollNumber || r.participantUser?.sicNo || 'N/A';
          const batch = r.participantUser?.batch;
          const year = calculateYearFromBatch(batch, sic, r.year);
          const gender = r.participantUser?.gender || 'N/A';
          const dept = r.branch || 'N/A';
          const teammates = extractTeamMembers(r);
          const teamSize = 1 + teammates.length;

          // 1. Leader Row
          csvRows.push([
            sanitizeCsvValue(formatTimestamp(r.registeredAt)),
            sanitizeCsvValue(r.teamName || 'Team'),
            sanitizeCsvValue('Team Leader'),
            sanitizeCsvValue(r.participantName),
            sanitizeCsvValue(sic),
            sanitizeCsvValue(r.participantEmail),
            sanitizeCsvValue(r.phone || 'N/A'),
            sanitizeCsvValue(year),
            sanitizeCsvValue(gender),
            sanitizeCsvValue(dept),
            sanitizeCsvValue(teamSize),
            sanitizeCsvValue(r.status),
          ].join(','));

          // 2. Member Rows
          teammates.forEach((m, mIdx) => {
            csvRows.push([
              sanitizeCsvValue(formatTimestamp(r.registeredAt)),
              sanitizeCsvValue(r.teamName || 'Team'),
              sanitizeCsvValue(`Member ${mIdx + 2}`),
              sanitizeCsvValue(m.name),
              sanitizeCsvValue(m.sic),
              sanitizeCsvValue(m.email),
              sanitizeCsvValue(m.phone),
              sanitizeCsvValue(m.year),
              sanitizeCsvValue(m.gender),
              sanitizeCsvValue(m.dept !== 'N/A' ? m.dept : dept),
              sanitizeCsvValue(teamSize),
              sanitizeCsvValue(m.status),
            ].join(','));
          });
        });
      }

      const csvContent = '\uFEFF' + [csvHeaders.join(','), ...csvRows].join('\r\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${cleanTitle}_Responses_${Date.now()}.csv"`);
      return res.send(csvContent);
    }

    // =========================================================================
    // 2. STYLED COLORED EXCEL SHEET (.xls with Office XML & CSS)
    // =========================================================================
    let excelHeaders = [];
    let excelRowsHtml = '';
    let totalParticipantsCount = 0;

    if (!isTeamEvent) {
      // Individual Event: 8 exact requested columns
      excelHeaders = ['Timestamp', 'Name', 'SIC', 'Email', 'Phone No', 'Year', 'Gender', 'Department'];
      totalParticipantsCount = registrations.length;

      excelRowsHtml = registrations.map((r, index) => {
        const isEven = index % 2 === 0;
        const rowClass = isEven ? 'row-even' : 'row-odd';
        const sic = r.rollNumber || r.participantUser?.sicNo || 'N/A';
        const batch = r.participantUser?.batch;
        const year = calculateYearFromBatch(batch, sic, r.year);
        const gender = r.participantUser?.gender || 'N/A';
        const dept = r.branch || 'N/A';

        return `
          <tr class="${rowClass}">
            <td class="col-timestamp">${escapeHtml(formatTimestamp(r.registeredAt))}</td>
            <td class="col-name">${escapeHtml(r.participantName)}</td>
            <td class="col-sic">${escapeHtml(sic)}</td>
            <td class="col-email">${escapeHtml(r.participantEmail)}</td>
            <td class="col-phone">${escapeHtml(r.phone || 'N/A')}</td>
            <td class="col-year">${escapeHtml(year)}</td>
            <td class="col-gender">${escapeHtml(gender)}</td>
            <td class="col-dept">${escapeHtml(dept)}</td>
          </tr>
        `;
      }).join('\n');

    } else if (teamFormat === 'columns') {
      // Team Event: Columns-per-member (Google Forms style)
      excelHeaders = [
        'Timestamp', 'Team Name', 'Team Size',
        'Leader Name', 'Leader SIC', 'Leader Email', 'Leader Phone No', 'Leader Year', 'Leader Gender', 'Leader Department'
      ];
      for (let m = 2; m <= maxTeammates + 1; m++) {
        excelHeaders.push(
          `Member ${m} Name`, `Member ${m} SIC`, `Member ${m} Email`,
          `Member ${m} Phone No`, `Member ${m} Year`, `Member ${m} Gender`, `Member ${m} Department`
        );
      }
      excelHeaders.push('Status');

      let participantsTally = 0;
      excelRowsHtml = registrations.map((r, index) => {
        const isEven = index % 2 === 0;
        const rowClass = isEven ? 'row-even' : 'row-odd';
        const sic = r.rollNumber || r.participantUser?.sicNo || 'N/A';
        const batch = r.participantUser?.batch;
        const year = calculateYearFromBatch(batch, sic, r.year);
        const gender = r.participantUser?.gender || 'N/A';
        const dept = r.branch || 'N/A';
        const teammates = extractTeamMembers(r);
        const teamSize = 1 + teammates.length;
        participantsTally += teamSize;

        let memberCellsHtml = '';
        for (let i = 0; i < maxTeammates; i++) {
          const m = teammates[i];
          if (m) {
            memberCellsHtml += `
              <td class="col-name">${escapeHtml(m.name)}</td>
              <td class="col-sic">${escapeHtml(m.sic)}</td>
              <td class="col-email">${escapeHtml(m.email)}</td>
              <td class="col-phone">${escapeHtml(m.phone)}</td>
              <td class="col-year">${escapeHtml(m.year)}</td>
              <td class="col-gender">${escapeHtml(m.gender)}</td>
              <td class="col-dept">${escapeHtml(m.dept)}</td>
            `;
          } else {
            memberCellsHtml += `
              <td style="color:#cbd5e1; text-align:center;">-</td>
              <td style="color:#cbd5e1; text-align:center;">-</td>
              <td style="color:#cbd5e1; text-align:center;">-</td>
              <td style="color:#cbd5e1; text-align:center;">-</td>
              <td style="color:#cbd5e1; text-align:center;">-</td>
              <td style="color:#cbd5e1; text-align:center;">-</td>
              <td style="color:#cbd5e1; text-align:center;">-</td>
            `;
          }
        }

        return `
          <tr class="${rowClass}">
            <td class="col-timestamp">${escapeHtml(formatTimestamp(r.registeredAt))}</td>
            <td class="col-team">${escapeHtml(r.teamName || 'Team')}</td>
            <td style="text-align: center; font-weight: bold; color: #4338ca;">${teamSize}</td>
            <td class="col-name">${escapeHtml(r.participantName)}</td>
            <td class="col-sic">${escapeHtml(sic)}</td>
            <td class="col-email">${escapeHtml(r.participantEmail)}</td>
            <td class="col-phone">${escapeHtml(r.phone || 'N/A')}</td>
            <td class="col-year">${escapeHtml(year)}</td>
            <td class="col-gender">${escapeHtml(gender)}</td>
            <td class="col-dept">${escapeHtml(dept)}</td>
            ${memberCellsHtml}
            <td style="text-align: center; font-weight: 600; color: #047857;">${escapeHtml(r.status)}</td>
          </tr>
        `;
      }).join('\n');

      totalParticipantsCount = participantsTally;

    } else {
      // Team Event: Roster Format (1 Row per Participant) - Recommended
      excelHeaders = [
        'Timestamp', 'Team Name', 'Role', 'Participant Name', 'SIC',
        'Email', 'Phone No', 'Year', 'Gender', 'Department', 'Team Size', 'Status'
      ];

      const rowsList = [];
      let participantsTally = 0;

      registrations.forEach((r, teamIndex) => {
        const isTeamEven = teamIndex % 2 === 0;
        const teamBaseClass = isTeamEven ? 'team-even' : 'team-odd';

        const sic = r.rollNumber || r.participantUser?.sicNo || 'N/A';
        const batch = r.participantUser?.batch;
        const year = calculateYearFromBatch(batch, sic, r.year);
        const gender = r.participantUser?.gender || 'N/A';
        const dept = r.branch || 'N/A';
        const teammates = extractTeamMembers(r);
        const teamSize = 1 + teammates.length;
        participantsTally += teamSize;

        // 1. Leader Row
        rowsList.push(`
          <tr class="${teamBaseClass} team-leader-row">
            <td class="col-timestamp">${escapeHtml(formatTimestamp(r.registeredAt))}</td>
            <td class="col-team">${escapeHtml(r.teamName || 'Team')}</td>
            <td style="text-align: center;"><span class="badge-leader">Team Leader</span></td>
            <td class="col-name">${escapeHtml(r.participantName)}</td>
            <td class="col-sic">${escapeHtml(sic)}</td>
            <td class="col-email">${escapeHtml(r.participantEmail)}</td>
            <td class="col-phone">${escapeHtml(r.phone || 'N/A')}</td>
            <td class="col-year">${escapeHtml(year)}</td>
            <td class="col-gender">${escapeHtml(gender)}</td>
            <td class="col-dept">${escapeHtml(dept)}</td>
            <td style="text-align: center; font-weight: bold; color: #4338ca;">${teamSize}</td>
            <td style="text-align: center; font-weight: 600; color: #047857;">${escapeHtml(r.status)}</td>
          </tr>
        `);

        // 2. Teammates Rows
        teammates.forEach((m, mIdx) => {
          rowsList.push(`
            <tr class="${teamBaseClass} team-member-row">
              <td class="col-timestamp" style="color: #94a3b8;">${escapeHtml(formatTimestamp(r.registeredAt))}</td>
              <td class="col-team-muted">${escapeHtml(r.teamName || 'Team')}</td>
              <td style="text-align: center;"><span class="badge-member">Member ${mIdx + 2}</span></td>
              <td class="col-name">${escapeHtml(m.name)}</td>
              <td class="col-sic">${escapeHtml(m.sic)}</td>
              <td class="col-email">${escapeHtml(m.email)}</td>
              <td class="col-phone">${escapeHtml(m.phone)}</td>
              <td class="col-year">${escapeHtml(m.year)}</td>
              <td class="col-gender">${escapeHtml(m.gender)}</td>
              <td class="col-dept">${escapeHtml(m.dept !== 'N/A' ? m.dept : dept)}</td>
              <td style="text-align: center; color: #64748b;">${teamSize}</td>
              <td style="text-align: center; font-weight: 600; color: #0284c7;">${escapeHtml(m.status)}</td>
            </tr>
          `);
        });
      });

      excelRowsHtml = rowsList.join('\n');
      totalParticipantsCount = participantsTally;
    }

    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Responses</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                  <x:Selected/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; }
          table { border-collapse: collapse; width: 100%; }
          .banner-title {
            background-color: #034694;
            color: #ffffff;
            font-size: 14pt;
            font-weight: bold;
            padding: 12px 14px;
            text-align: left;
            border: 1px solid #022b5c;
          }
          .banner-meta {
            background-color: #f8fafc;
            color: #475569;
            font-size: 9.5pt;
            padding: 8px 14px;
            border-bottom: 2px solid #cbd5e1;
          }
          th {
            background-color: #034694;
            color: #ffffff;
            font-size: 10.5pt;
            font-weight: bold;
            padding: 9px 12px;
            text-align: center;
            border: 1px solid #022b5c;
            white-space: nowrap;
          }
          td {
            font-size: 9.5pt;
            color: #1e293b;
            padding: 7px 11px;
            border: 1px solid #cbd5e1;
            vertical-align: middle;
            mso-number-format: "\\@";
          }
          .row-even td { background-color: #f8fafc; }
          .row-odd td { background-color: #ffffff; }

          .team-even td { background-color: #ffffff; }
          .team-odd td { background-color: #f8fafc; }
          .team-leader-row td { border-top: 2px solid #034694 !important; }
          .team-member-row td { border-top: 1px dashed #e2e8f0; }

          .col-timestamp { text-align: center; color: #64748b; font-family: 'Consolas', monospace; font-size: 9pt; }
          .col-name { font-weight: 600; color: #0f172a; text-align: left; }
          .col-sic { text-align: center; font-family: 'Consolas', monospace; font-weight: 700; color: #034694; background-color: #eff6ff !important; }
          .col-email { color: #0369a1; text-align: left; }
          .col-phone { text-align: center; color: #334155; }
          .col-year { text-align: center; font-weight: 700; color: #047857; background-color: #ecfdf5 !important; }
          .col-gender { text-align: center; font-weight: 500; color: #475569; }
          .col-dept { text-align: left; color: #1e293b; }
          .col-team { text-align: left; color: #034694; font-weight: bold; font-size: 10pt; }
          .col-team-muted { text-align: left; color: #64748b; font-size: 8.5pt; }

          .badge-leader {
            background-color: #ede9fe;
            color: #5b21b6;
            font-weight: bold;
            font-size: 8.5pt;
            padding: 3px 8px;
            border: 1px solid #c4b5fd;
            border-radius: 4px;
            display: inline-block;
          }
          .badge-member {
            background-color: #f1f5f9;
            color: #334155;
            font-weight: 600;
            font-size: 8.5pt;
            padding: 2px 7px;
            border: 1px solid #cbd5e1;
            border-radius: 4px;
            display: inline-block;
          }
        </style>
      </head>
      <body>
        <table>
          <tr>
            <td colspan="${excelHeaders.length}" class="banner-title">
              SILICON WEST &bull; ${escapeHtml(event.title || 'Campus Event')} &mdash; ${isTeamEvent ? (teamFormat === 'columns' ? 'Team Form Responses' : 'Team Roster Sheet') : 'Participant Responses'}
            </td>
          </tr>
          <tr>
            <td colspan="${excelHeaders.length}" class="banner-meta">
              Exported: ${formatTimestamp(new Date())} &bull; Total Entries: ${registrations.length} ${isTeamEvent ? `Teams (${totalParticipantsCount} Total Participants)` : 'Registrations'} &bull; Organizing Society: ${escapeHtml(event.club?.name || 'Silicon West')}
            </td>
          </tr>
          <tr><td colspan="${excelHeaders.length}" style="height: 10px; border: none; background: #ffffff;"></td></tr>
          <thead>
            <tr>
              ${excelHeaders.map(h => `<th>${escapeHtml(h)}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${excelRowsHtml}
          </tbody>
        </table>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'application/vnd.ms-excel; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${cleanTitle}_${isTeamEvent ? (teamFormat === 'columns' ? 'TeamResponses' : 'TeamRoster') : 'Responses'}_${Date.now()}.xls"`);
    res.send(excelHtml);
  } catch (err) {
    console.error('Export registrations error:', err);
    res.status(500).json({ error: 'Failed to export registrations.' });
  }
});

module.exports = router;
