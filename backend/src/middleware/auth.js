const jwt = require('jsonwebtoken');
const prisma = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-silicon-west-jwt-key-2026';

// Middleware to authenticate user from Bearer token
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        assignments: {
          select: { clubId: true }
        }
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found or session invalid.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is deactivated. Access denied.' });
    }

    // Attach user and assigned club IDs
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      assignedClubIds: user.assignments.map(a => a.clubId)
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
}

// Optional auth: sets req.user if token is present and valid, but doesn't fail if missing
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { assignments: { select: { clubId: true } } }
      });
      if (user && user.isActive) {
        req.user = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          assignedClubIds: user.assignments.map(a => a.clubId)
        };
      }
    }
  } catch (e) {
    // ignore optional auth errors
  }
  next();
}

// Super Admin check
function requireSuperAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Forbidden: Super Admin access required.' });
  }
  next();
}

// Club Admin check (Super Admin is also allowed)
function requireClubAdmin(req, res, next) {
  if (!req.user || (req.user.role !== 'CLUB_ADMIN' && req.user.role !== 'SUPER_ADMIN')) {
    return res.status(403).json({ error: 'Forbidden: Club Admin or Super Admin access required.' });
  }
  next();
}

// Verifies if user can manage a specific club
function canUserManageClub(user, clubId) {
  if (!user) return false;
  if (user.role === 'SUPER_ADMIN') return true;
  if (user.role === 'CLUB_ADMIN' && user.assignedClubIds.includes(clubId)) return true;
  return false;
}

// Middleware checking club management permissions from req.params.clubId or req.body.clubId
async function checkClubAccess(req, res, next) {
  const clubId = req.params.clubId || req.params.id || req.body.clubId;
  if (!clubId) {
    return res.status(400).json({ error: 'Club ID is required.' });
  }

  if (!canUserManageClub(req.user, clubId)) {
    return res.status(403).json({ error: 'Forbidden: You do not have permission to manage this club.' });
  }
  next();
}

// Middleware checking event management permissions
// MUST fetch event from DB to verify actual owning clubId (never trust client!)
async function checkEventAccess(req, res, next) {
  const eventId = req.params.eventId || req.params.id;
  if (!eventId) {
    return res.status(400).json({ error: 'Event ID is required.' });
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, clubId: true, status: true, title: true }
  });

  if (!event) {
    return res.status(404).json({ error: 'Event not found.' });
  }

  if (!canUserManageClub(req.user, event.clubId)) {
    return res.status(403).json({ error: 'Forbidden: You do not have permission to manage this event.' });
  }

  req.targetEvent = event;
  next();
}

module.exports = {
  JWT_SECRET,
  authenticate,
  optionalAuth,
  requireSuperAdmin,
  requireClubAdmin,
  canUserManageClub,
  checkClubAccess,
  checkEventAccess,
};
