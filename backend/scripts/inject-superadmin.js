const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const prisma = require('../src/db');

/**
 * Script to promote an existing user to SUPER_ADMIN.
 * Reads the email from SUPER_ADMIN_EMAIL in backend/.env (or --email=user@silicon.ac.in).
 */
async function promoteToSuperAdmin() {
  const args = process.argv.slice(2);
  const emailArg = args.find((a) => a.startsWith('--email='))?.split('=')[1]?.trim();

  // Read email from CLI arg, or SUPER_ADMIN_EMAIL / ADMIN_EMAIL in backend/.env
  const targetEmail = (
    emailArg ||
    process.env.SUPER_ADMIN_EMAIL ||
    process.env.ADMIN_EMAIL ||
    ''
  ).toLowerCase().trim();

  if (!targetEmail || !targetEmail.includes('@')) {
    console.error('\n❌ Error: No valid email found.');
    console.error('Please set SUPER_ADMIN_EMAIL in backend/.env, or pass --email=your_email@silicon.ac.in');
    process.exit(1);
  }

  console.log('\n=======================================================');
  console.log('👑 PROMOTE USER TO SUPER ADMIN');
  console.log('=======================================================');
  console.log(`Target Email : ${targetEmail}`);
  console.log('-------------------------------------------------------');

  try {
    // 1. Find the existing user in the database
    const user = await prisma.user.findUnique({
      where: { email: targetEmail },
    });

    if (!user) {
      console.error(`\n❌ User not found with email: "${targetEmail}"`);
      console.log('👉 Please register or log in on the website first with this email, then run this script again.\n');
      process.exit(1);
    }

    if (user.role === 'SUPER_ADMIN') {
      console.log(`\nℹ️  User "${user.name}" (${user.email}) is ALREADY a SUPER_ADMIN.`);
      console.log('   No changes were needed.\n');
      return;
    }

    // 2. Just update the role to SUPER_ADMIN
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        role: 'SUPER_ADMIN',
        isActive: true,
        isEmailVerified: true,
      },
    });

    console.log(`\n✅ Role successfully updated to SUPER_ADMIN!`);
    console.log(`   User ID       : ${updatedUser.id}`);
    console.log(`   Name          : ${updatedUser.name}`);
    console.log(`   Email         : ${updatedUser.email}`);
    console.log(`   Previous Role : ${user.role}`);
    console.log(`   Current Role  : ${updatedUser.role}`);
    console.log(`   Status        : Active & Email Verified`);
    console.log('=======================================================\n');
  } catch (error) {
    console.error('\n❌ Database error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

promoteToSuperAdmin();
