const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const prisma = require('../src/db');

/**
 * Script to assign SUPER_ADMIN role to the user specified by email in .env file.
 * Usage:
 *   node scripts/inject-superadmin.js
 *   node scripts/inject-superadmin.js --email=another@silicon.ac.in
 */
async function injectSuperAdmin() {
  const args = process.argv.slice(2);

  // Helper to parse CLI flag: --key=value
  const getArg = (flag, fallback = '') => {
    const found = args.find((a) => a.startsWith(`--${flag}=`));
    if (found) return found.split('=')[1].trim();
    const index = args.indexOf(`--${flag}`);
    if (index !== -1 && args[index + 1]) return args[index + 1].trim();
    return fallback;
  };

  // 1. Read email from CLI arg, or SUPER_ADMIN_EMAIL / ADMIN_EMAIL in .env
  const targetEmail = (
    getArg('email') ||
    process.env.SUPER_ADMIN_EMAIL ||
    process.env.ADMIN_EMAIL ||
    ''
  ).toLowerCase().trim();

  const customPassword = getArg('password') || process.env.SUPER_ADMIN_PASSWORD || '';

  if (!targetEmail || !targetEmail.includes('@')) {
    console.error('\n❌ Error: No valid email found.');
    console.error('Please set SUPER_ADMIN_EMAIL in your backend/.env file, or pass --email=yourname@silicon.ac.in');
    process.exit(1);
  }

  console.log('\n=======================================================');
  console.log('👑 ASSIGN SUPER ADMIN ROLE UTILITY');
  console.log('=======================================================');
  console.log(`Target Email : ${targetEmail}`);
  console.log('-------------------------------------------------------');

  try {
    // 2. Find user in the database
    const user = await prisma.user.findUnique({
      where: { email: targetEmail },
    });

    if (!user) {
      // If user does not exist in the database yet:
      if (customPassword) {
        const passwordHash = await bcrypt.hash(customPassword, 10);
        const newUser = await prisma.user.create({
          data: {
            email: targetEmail,
            name: targetEmail.split('@')[0],
            passwordHash,
            role: 'SUPER_ADMIN',
            isActive: true,
            isEmailVerified: true,
          },
        });
        console.log(`✅ Created new user ${newUser.email} with SUPER_ADMIN role!`);
      } else {
        console.log(`⚠️ User with email "${targetEmail}" does not exist in database yet.`);
        console.log(`👉 Please sign up first on the portal with this email, or run:`);
        console.log(`   node scripts/inject-superadmin.js --password=YourPassword123`);
      }
      return;
    }

    // 3. Update the user role to SUPER_ADMIN (preserving existing password unless specified)
    const updateData = {
      role: 'SUPER_ADMIN',
      isActive: true,
      isEmailVerified: true,
    };

    if (customPassword) {
      updateData.passwordHash = await bcrypt.hash(customPassword, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    console.log(`✅ Success! User role has been updated to SUPER_ADMIN:`);
    console.log(`   Name  : ${updatedUser.name}`);
    console.log(`   Email : ${updatedUser.email}`);
    console.log(`   Role  : ${updatedUser.role}`);
    console.log(`   Status: Active & Verified`);
    console.log('=======================================================\n');
  } catch (error) {
    console.error('❌ Failed to assign Super Admin role:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

injectSuperAdmin();
