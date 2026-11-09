const express = require('express');
const { z } = require('zod');
const prisma = require('../db');
const {
  sendRegistrationConfirmationEmail,
  sendTeamInvitationEmail,
} = require('../services/emailService');
const {
  authenticate,
  optionalAuth,
  canUserManageClub,
} = require('../middleware/auth');

const router = express.Router();

const registrationCreateSchema = z.object({
  eventId: z.string().uuid('Invalid Event ID format.'),
  participantName: z.string().nullable().optional().or(z.literal('')),
  participantEmail: z.string().nullable().optional().or(z.literal('')),
  collegeName: z.string().nullable().optional().or(z.literal('')),
  rollNumber: z.string().nullable().optional().or(z.literal('')),
  phone: z.string().nullable().optional().or(z.literal('')),
  branch: z.string().nullable().optional().or(z.literal('')),
  year: z.string().nullable().optional().or(z.literal('')),
  teamName: z.string().nullable().optional().or(z.literal('')),
  teamMembers: z.any().nullable().optional(),
});

// POST /api/registrations - Register for an event (Authenticated Silicon Student Only)
// Transaction-safe with concurrency protection per ADR-006 & Section 10
router.post('/', authenticate, async (req, res) => {
  try {
    const data = registrationCreateSchema.parse(req.body);

    const participantName = (data.participantName || (req.user && req.user.name) || '').trim();
    const normalizedEmail = (data.participantEmail || (req.user && req.user.email) || '').toLowerCase().trim();

    if (!normalizedEmail) {
      return res.status(400).json({ error: 'Participant email is required or you must be signed in.' });
    }
    if (!participantName) {
      return res.status(400).json({ error: 'Participant name is required or you must be signed in.' });
    }

    // Silicon ID Policy: Event registration is restricted to official Silicon email IDs
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
        error: 'Registration can only be done with an official Silicon ID (e.g. yourname@silicon.ac.in or yourname@siliconwest.in).'
      });
    }

    // Also validate teammates' emails if provided in a team registration
    if (Array.isArray(data.teamMembers)) {
      for (const tm of data.teamMembers) {
        if (tm && tm.email && tm.email.trim().length > 0) {
          if (!isSiliconEmail(tm.email)) {
            return res.status(400).json({
              error: `Teammate "${tm.name || tm.email}" must also have an official Silicon ID (*@silicon.ac.in or *@siliconwest.in).`
            });
          }
        }
      }
    }

    const now = new Date();

    // Use Prisma transaction with interactive query
    const result = await prisma.$transaction(async (tx) => {
      // 1. Lock the event row for update (PostgreSQL row locking prevents race conditions)
      const events = await tx.$queryRaw`
        SELECT id, "clubId", title, status, "registrationDeadline", capacity
        FROM events
        WHERE id = ${data.eventId}
        FOR UPDATE
      `;

      if (!events || events.length === 0) {
        throw { code: 'NOT_FOUND', message: 'Event not found.' };
      }

      const event = events[0];

      // 2. Check publication status
      if (event.status !== 'PUBLISHED') {
        throw { code: 'EVENT_NOT_PUBLISHED', message: 'Registrations are not open for this event.' };
      }

      // 3. Check registration deadline
      if (new Date(event.registrationDeadline) <= now) {
        throw { code: 'DEADLINE_PASSED', message: 'The registration deadline for this event has passed.' };
      }

      // 4. Check for duplicate registration (email per event)
      const existing = await tx.registration.findFirst({
        where: {
          eventId: data.eventId,
          participantEmail: normalizedEmail,
          status: 'CONFIRMED'
        }
      });

      if (existing) {
        throw {
          code: 'DUPLICATE_REGISTRATION',
          message: 'This email address is already registered for this event.'
        };
      }

      // 5. Check capacity
      if (event.capacity) {
        const confirmedCount = await tx.registration.count({
          where: {
            eventId: data.eventId,
            status: 'CONFIRMED'
          }
        });

        if (confirmedCount >= event.capacity) {
          throw { code: 'EVENT_FULL', message: 'Event has reached maximum capacity.' };
        }
      }

      // 6. Create registration
      const newRegistration = await tx.registration.create({
        data: {
          eventId: data.eventId,
          participantUserId: req.user ? req.user.id : null,
          participantName,
          participantEmail: normalizedEmail,
          collegeName: data.collegeName ? data.collegeName.trim() : 'Silicon Institute of Technology',
          rollNumber: data.rollNumber ? data.rollNumber.trim() : null,
          phone: data.phone ? data.phone.trim() : null,
          branch: data.branch ? data.branch.trim() : null,
          year: data.year ? data.year.trim() : null,
          teamName: data.teamName ? data.teamName.trim() : null,
          teamMembers: data.teamMembers || null,
          status: 'CONFIRMED',
        },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              slug: true,
              venue: true,
              startsAt: true,
              endsAt: true,
              club: {
                select: { name: true }
              }
            }
          }
        }
      });

      // 7. If Team Registration, dispatch team invitation requests to all teammates
      if (data.teamName && Array.isArray(data.teamMembers)) {
        for (const tm of data.teamMembers) {
          if (tm && tm.email && tm.email.trim().length > 0) {
            const tmEmail = tm.email.toLowerCase().trim();
            const inviteeUser = await tx.user.findUnique({ where: { email: tmEmail } });
            await tx.teamInvitation.upsert({
              where: {
                eventId_inviteeEmail: {
                  eventId: data.eventId,
                  inviteeEmail: tmEmail,
                }
              },
              create: {
                eventId: data.eventId,
                registrationId: newRegistration.id,
                teamName: data.teamName.trim(),
                inviterUserId: req.user ? req.user.id : newRegistration.id,
                inviterName: participantName,
                inviteeUserId: inviteeUser ? inviteeUser.id : null,
                inviteeEmail: tmEmail,
                inviteeName: tm.name ? tm.name.trim() : (inviteeUser ? inviteeUser.name : null),
                status: 'PENDING',
              },
              update: {
                teamName: data.teamName.trim(),
                registrationId: newRegistration.id,
                inviterUserId: req.user ? req.user.id : newRegistration.id,
                inviterName: participantName,
                status: 'PENDING',
              }
            }).catch((err) => console.log('Notice: team invite creation:', err.message));
          }
        }
      }

      return newRegistration;
    });

    // Asynchronously dispatch confirmation & invitation emails without blocking the response
    sendRegistrationConfirmationEmail({
      to: normalizedEmail,
      name: participantName,
      event: result.event,
      registration: result,
      teamName: data.teamName,
      teamMembers: data.teamMembers,
    }).catch((err) =>
      console.error(`⚠️ Failed to send registration email to ${normalizedEmail}:`, err.message)
    );

    if (data.teamName && Array.isArray(data.teamMembers)) {
      for (const tm of data.teamMembers) {
        if (tm && tm.email && tm.email.trim().length > 0) {
          const tmEmail = tm.email.toLowerCase().trim();
          sendTeamInvitationEmail({
            to: tmEmail,
            teammateName: tm.name || 'Student',
            inviterName: participantName,
            teamName: data.teamName.trim(),
            event: result.event,
          }).catch((err) =>
            console.error(`⚠️ Failed to send team invite email to ${tmEmail}:`, err.message)
          );
        }
      }
    }

    res.status(201).json({
      message: 'Registration confirmed successfully!',
      registration: result
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      const issueMsg =
        err.errors && err.errors[0]
          ? `${err.errors[0].path.join('.') || 'Field'}: ${err.errors[0].message}`
          : 'Validation failed';
      return res.status(400).json({ error: `Validation failed (${issueMsg})`, details: err.errors });
    }
    if (err.code) {
      const statusMap = {
        NOT_FOUND: 404,
        EVENT_NOT_PUBLISHED: 400,
        DEADLINE_PASSED: 400,
        DUPLICATE_REGISTRATION: 409,
        EVENT_FULL: 409
      };
      return res.status(statusMap[err.code] || 400).json({ error: err.message, code: err.code });
    }
    console.error('Registration transaction error:', err);
    res.status(500).json({ error: 'Failed to process registration.' });
  }
});

// GET /api/registrations/my - View current participant's registrations
router.get('/my', authenticate, async (req, res) => {
  try {
    const registrations = await prisma.registration.findMany({
      where: {
        OR: [
          { participantUserId: req.user.id },
          { participantEmail: req.user.email.toLowerCase() }
        ]
      },
      orderBy: { registeredAt: 'desc' },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
            bannerUrl: true,
            venue: true,
            startsAt: true,
            endsAt: true,
            status: true,
            club: {
              select: { name: true, slug: true, logoUrl: true }
            }
          }
        }
      }
    });

    res.json(registrations);
  } catch (err) {
    console.error('Get my registrations error:', err);
    res.status(500).json({ error: 'Failed to fetch personal registrations.' });
  }
});

// PATCH /api/registrations/:id/cancel - Cancel registration
router.patch('/:id/cancel', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const registration = await prisma.registration.findUnique({
      where: { id },
      include: {
        event: {
          select: { clubId: true, title: true }
        }
      }
    });

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found.' });
    }

    // Permission check: either the participant himself, or admin who manages the event's club
    const isParticipant =
      (registration.participantUserId && registration.participantUserId === req.user.id) ||
      registration.participantEmail.toLowerCase() === req.user.email.toLowerCase();

    const isAuthorizedAdmin = canUserManageClub(req.user, registration.event.clubId);

    if (!isParticipant && !isAuthorizedAdmin) {
      return res.status(403).json({ error: 'Forbidden: You cannot cancel this registration.' });
    }

    const updated = await prisma.registration.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });

    res.json({ message: 'Registration cancelled.', registration: updated });
  } catch (err) {
    console.error('Cancel registration error:', err);
    res.status(500).json({ error: 'Failed to cancel registration.' });
  }
});

// PATCH /api/registrations/:id/status - Update registration status (Admin)
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['CONFIRMED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ error: 'Status must be CONFIRMED or CANCELLED.' });
    }

    const registration = await prisma.registration.findUnique({
      where: { id },
      include: {
        event: { select: { clubId: true, title: true } }
      }
    });

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found.' });
    }

    if (!canUserManageClub(req.user, registration.event.clubId)) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to manage this registration.' });
    }

    const updated = await prisma.registration.update({
      where: { id },
      data: { status }
    });

    res.json({ message: `Registration marked as ${status}.`, registration: updated });
  } catch (err) {
    console.error('Update registration status error:', err);
    res.status(500).json({ error: 'Failed to update registration status.' });
  }
});

module.exports = router;
