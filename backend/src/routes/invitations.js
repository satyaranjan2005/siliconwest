const express = require('express');
const { z } = require('zod');
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');
const {
  sendTeamInvitationEmail,
  sendTeamInviteStatusEmail,
} = require('../services/emailService');

const router = express.Router();

const inviteSchema = z.object({
  eventId: z.string().uuid(),
  registrationId: z.string().uuid().optional(),
  teamName: z.string().min(1),
  inviteeEmail: z.string().email(),
  inviteeName: z.string().optional(),
});

// GET /api/invitations/my - Get all pending and past team invitations for current logged-in user
router.get('/my', authenticate, async (req, res) => {
  try {
    const userEmail = req.user.email.toLowerCase().trim();

    const invitations = await prisma.teamInvitation.findMany({
      where: {
        OR: [
          { inviteeEmail: { equals: userEmail, mode: 'insensitive' } },
          { inviteeUserId: req.user.id },
        ]
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
            startsAt: true,
            endsAt: true,
            venue: true,
            category: true,
            bannerUrl: true,
            club: { select: { name: true } }
          }
        },
        inviter: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(invitations);
  } catch (err) {
    console.error('Fetch my invitations error:', err);
    res.status(500).json({ error: 'Failed to load team invitations.' });
  }
});

// POST /api/invitations - Send a team invitation to a fellow student
router.post('/', authenticate, async (req, res) => {
  try {
    const data = inviteSchema.parse(req.body);
    const targetEmail = data.inviteeEmail.toLowerCase().trim();

    if (targetEmail === req.user.email.toLowerCase().trim()) {
      return res.status(400).json({ error: 'You cannot invite yourself to your own team.' });
    }

    // Check Silicon email
    const isSilicon = targetEmail.endsWith('@silicon.ac.in') || targetEmail.endsWith('@siliconwest.in');
    if (!isSilicon) {
      return res.status(400).json({ error: 'Invitations can only be sent to official Silicon IDs (*@silicon.ac.in or *@siliconwest.in).' });
    }

    // Find if user exists in database
    const inviteeUser = await prisma.user.findUnique({
      where: { email: targetEmail }
    });

    // Create or update invitation
    const invitation = await prisma.teamInvitation.upsert({
      where: {
        eventId_inviteeEmail: {
          eventId: data.eventId,
          inviteeEmail: targetEmail,
        }
      },
      create: {
        eventId: data.eventId,
        registrationId: data.registrationId || null,
        teamName: data.teamName.trim(),
        inviterUserId: req.user.id,
        inviterName: req.user.name,
        inviteeUserId: inviteeUser ? inviteeUser.id : null,
        inviteeEmail: targetEmail,
        inviteeName: data.inviteeName ? data.inviteeName.trim() : (inviteeUser ? inviteeUser.name : null),
        status: 'PENDING',
      },
      update: {
        teamName: data.teamName.trim(),
        inviterUserId: req.user.id,
        inviterName: req.user.name,
        registrationId: data.registrationId || null,
        status: 'PENDING',
      }
    });

    // Fetch event context for email notification
    const event = await prisma.event.findUnique({
      where: { id: data.eventId },
      select: {
        id: true,
        title: true,
        startsAt: true,
        venue: true,
        club: { select: { name: true } },
      },
    });

    // Send team invitation email asynchronously
    sendTeamInvitationEmail({
      to: targetEmail,
      teammateName: data.inviteeName ? data.inviteeName.trim() : (inviteeUser ? inviteeUser.name : 'Student'),
      inviterName: req.user.name,
      teamName: data.teamName.trim(),
      event,
    }).catch((err) =>
      console.error(`⚠️ Failed to send team invite email to ${targetEmail}:`, err.message)
    );

    res.status(201).json({
      message: `Invitation notification sent to ${targetEmail}!`,
      invitation,
    });
  } catch (err) {
    console.error('Send invitation error:', err);
    res.status(500).json({ error: err.message || 'Failed to send team invitation.' });
  }
});

// PATCH /api/invitations/:id/respond - Accept or Decline an invitation
router.patch('/:id/respond', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'ACCEPT' | 'DECLINE'

    if (!['ACCEPT', 'DECLINE'].includes(action)) {
      return res.status(400).json({ error: 'Action must be ACCEPT or DECLINE.' });
    }

    const invitation = await prisma.teamInvitation.findUnique({
      where: { id },
      include: { registration: true, event: true }
    });

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found.' });
    }

    const userEmail = req.user.email.toLowerCase().trim();
    if (invitation.inviteeEmail.toLowerCase() !== userEmail && invitation.inviteeUserId !== req.user.id) {
      return res.status(403).json({ error: 'You are not authorized to respond to this invitation.' });
    }

    const newStatus = action === 'ACCEPT' ? 'ACCEPTED' : 'DECLINED';

    const updatedInvitation = await prisma.teamInvitation.update({
      where: { id },
      data: {
        status: newStatus,
        inviteeUserId: req.user.id,
        inviteeName: req.user.name,
      }
    });

    // If accepted and linked to a registration, update the teammate status inside teamMembers JSON
    if (invitation.registrationId) {
      const reg = await prisma.registration.findUnique({
        where: { id: invitation.registrationId }
      });

      if (reg && Array.isArray(reg.teamMembers)) {
        const updatedMembers = reg.teamMembers.map((m) => {
          if (m.email && m.email.toLowerCase() === userEmail) {
            return {
              ...m,
              status: newStatus === 'ACCEPTED' ? 'CONFIRMED' : 'DECLINED',
              confirmedAt: newStatus === 'ACCEPTED' ? new Date().toISOString() : undefined,
            };
          }
          return m;
        });

        await prisma.registration.update({
          where: { id: invitation.registrationId },
          data: { teamMembers: updatedMembers }
        });
      }
    }

    // Notify the inviter / team leader about the response
    (async () => {
      try {
        let inviterEmail = null;
        if (invitation.inviterUserId) {
          const inviter = await prisma.user.findUnique({
            where: { id: invitation.inviterUserId },
            select: { email: true, name: true }
          });
          if (inviter) inviterEmail = inviter.email;
        }

        if (!inviterEmail && invitation.registration?.participantEmail) {
          inviterEmail = invitation.registration.participantEmail;
        }

        if (inviterEmail) {
          await sendTeamInviteStatusEmail({
            to: inviterEmail,
            inviterName: invitation.inviterName || 'Team Leader',
            teammateName: req.user.name || invitation.inviteeName || 'Teammate',
            teamName: invitation.teamName,
            event: invitation.event,
            status: newStatus,
          });
        }
      } catch (notifyErr) {
        console.error('⚠️ Notice: Could not send invite status update email:', notifyErr.message);
      }
    })();

    res.json({
      message: action === 'ACCEPT' ? 'You have successfully joined the team!' : 'Invitation declined.',
      invitation: updatedInvitation,
    });
  } catch (err) {
    console.error('Respond invitation error:', err);
    res.status(500).json({ error: err.message || 'Failed to update invitation response.' });
  }
});

module.exports = router;

