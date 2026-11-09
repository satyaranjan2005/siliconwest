const express = require('express');
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/users/search?q=query
// Allows authenticated Silicon students to find teammates by name or Silicon ID
router.get('/search', authenticate, async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q || q.length < 2) {
      return res.json([]);
    }

    const currentUserId = req.user.id;

    const users = await prisma.user.findMany({
      where: {
        id: { not: currentUserId },
        isActive: true,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
        AND: [
          {
            OR: [
              { email: { endsWith: '@silicon.ac.in', mode: 'insensitive' } },
              { email: { endsWith: '@siliconwest.in', mode: 'insensitive' } },
            ]
          }
        ]
      },
      take: 10,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: { name: 'asc' }
    });

    res.json(users);
  } catch (err) {
    console.error('Search users error:', err);
    res.status(500).json({ error: 'Failed to search Silicon teammates.' });
  }
});

module.exports = router;

