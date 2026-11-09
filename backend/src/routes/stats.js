const express = require('express');
const prisma = require('../db');
const { authenticate, requireClubAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/stats/dashboard - Role-scoped statistics
router.get('/dashboard', authenticate, requireClubAdmin, async (req, res) => {
  try {
    const isSuperAdmin = req.user.role === 'SUPER_ADMIN';
    const assignedClubIds = req.user.assignedClubIds || [];
    const now = new Date();

    if (isSuperAdmin) {
      // Super Admin platform-wide statistics
      const [
        totalClubs,
        archivedClubs,
        publishedEvents,
        draftEvents,
        upcomingEvents,
        confirmedRegistrations,
        cancelledRegistrations,
        recentRegistrations,
        recentEvents
      ] = await Promise.all([
        prisma.club.count({ where: { isArchived: false } }),
        prisma.club.count({ where: { isArchived: true } }),
        prisma.event.count({ where: { status: 'PUBLISHED' } }),
        prisma.event.count({ where: { status: 'DRAFT' } }),
        prisma.event.count({ where: { status: 'PUBLISHED', startsAt: { gte: now } } }),
        prisma.registration.count({ where: { status: 'CONFIRMED' } }),
        prisma.registration.count({ where: { status: 'CANCELLED' } }),
        prisma.registration.findMany({
          take: 5,
          orderBy: { registeredAt: 'desc' },
          include: {
            event: { select: { title: true, club: { select: { name: true } } } }
          }
        }),
        prisma.event.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            club: { select: { name: true, slug: true } },
            _count: { select: { registrations: true } }
          }
        })
      ]);

      return res.json({
        role: 'SUPER_ADMIN',
        metrics: {
          totalClubs,
          archivedClubs,
          publishedEvents,
          draftEvents,
          upcomingEvents,
          totalRegistrations: confirmedRegistrations + cancelledRegistrations,
          confirmedRegistrations,
          cancelledRegistrations,
        },
        recentRegistrations,
        recentEvents,
      });
    }

    // Club Admin: stats scoped only to their assigned clubs
    const clubFilter = { id: { in: assignedClubIds } };
    const eventFilter = { clubId: { in: assignedClubIds } };

    const [
      assignedClubs,
      totalEvents,
      publishedEvents,
      draftEvents,
      upcomingEvents,
      confirmedRegistrations,
      cancelledRegistrations,
      recentRegistrations,
      myEvents
    ] = await Promise.all([
      prisma.club.findMany({
        where: clubFilter,
        select: { id: true, name: true, slug: true, logoUrl: true, isArchived: true }
      }),
      prisma.event.count({ where: eventFilter }),
      prisma.event.count({ where: { ...eventFilter, status: 'PUBLISHED' } }),
      prisma.event.count({ where: { ...eventFilter, status: 'DRAFT' } }),
      prisma.event.count({ where: { ...eventFilter, status: 'PUBLISHED', startsAt: { gte: now } } }),
      prisma.registration.count({ where: { event: eventFilter, status: 'CONFIRMED' } }),
      prisma.registration.count({ where: { event: eventFilter, status: 'CANCELLED' } }),
      prisma.registration.findMany({
        where: { event: eventFilter },
        take: 5,
        orderBy: { registeredAt: 'desc' },
        include: {
          event: { select: { title: true, club: { select: { name: true } } } }
        }
      }),
      prisma.event.findMany({
        where: eventFilter,
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          club: { select: { name: true, slug: true } },
          _count: { select: { registrations: true } }
        }
      })
    ]);

    res.json({
      role: 'CLUB_ADMIN',
      assignedClubs,
      metrics: {
        assignedClubsCount: assignedClubs.length,
        totalEvents,
        publishedEvents,
        draftEvents,
        upcomingEvents,
        totalRegistrations: confirmedRegistrations + cancelledRegistrations,
        confirmedRegistrations,
        cancelledRegistrations,
      },
      recentRegistrations,
      recentEvents: myEvents,
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics.' });
  }
});

module.exports = router;
