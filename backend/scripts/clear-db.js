const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const prisma = require('../src/db');

/**
 * Script to safely wipe or reset the Silicon West database.
 * Usage:
 *   node scripts/clear-db.js
 *   node scripts/clear-db.js --force
 *   node scripts/clear-db.js --keep-superadmin
 */
async function clearDatabase() {
  const args = process.argv.slice(2);
  const keepSuperAdmin = args.includes('--keep-superadmin');
  const isForced = args.includes('--force') || args.includes('-f') || process.env.CONFIRM_CLEAR === 'true';

  console.log('\n=======================================================');
  console.log('⚠️  DATABASE CLEANUP & RESET UTILITY');
  console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`Target: ${process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:[^:]*@/, ':***@') : 'configured database'}`);
  if (keepSuperAdmin) {
    console.log('Mode: Clear all data but PRESERVE Super Admin accounts');
  } else {
    console.log('Mode: Complete Database Wipe (All records will be deleted)');
  }
  console.log('=======================================================\n');

  try {
    console.log('⏳ Clearing database records in dependency order...');

    // 1. Clear team invitations
    const deletedInvites = await prisma.teamInvitation.deleteMany();
    console.log(`  ✓ Removed ${deletedInvites.count} team invitations`);

    // 2. Clear registrations
    const deletedRegs = await prisma.registration.deleteMany();
    console.log(`  ✓ Removed ${deletedRegs.count} event registrations`);

    // 3. Clear OTP verification codes
    const deletedOtps = await prisma.otp.deleteMany();
    console.log(`  ✓ Removed ${deletedOtps.count} OTP codes`);

    // 4. Clear events
    const deletedEvents = await prisma.event.deleteMany();
    console.log(`  ✓ Removed ${deletedEvents.count} events`);

    // 5. Clear club admin assignments
    const deletedAssignments = await prisma.clubAdminAssignment.deleteMany();
    console.log(`  ✓ Removed ${deletedAssignments.count} club assignments`);

    // 6. Clear clubs
    const deletedClubs = await prisma.club.deleteMany();
    console.log(`  ✓ Removed ${deletedClubs.count} clubs`);

    // 7. Clear users
    let deletedUsers;
    if (keepSuperAdmin) {
      deletedUsers = await prisma.user.deleteMany({
        where: {
          role: { not: 'SUPER_ADMIN' },
        },
      });
      console.log(`  ✓ Removed ${deletedUsers.count} users (Preserved Super Admin accounts)`);
    } else {
      deletedUsers = await prisma.user.deleteMany();
      console.log(`  ✓ Removed ${deletedUsers.count} users`);
    }

    console.log('\n=======================================================');
    console.log('✅ Database has been cleared successfully!');
    console.log('=======================================================\n');
  } catch (error) {
    console.error('\n❌ Error during database cleanup:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabase();
