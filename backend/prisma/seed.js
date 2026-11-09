const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Database Seeding ---');

  // Clear existing records in reverse dependency order
  await prisma.otp.deleteMany();
  await prisma.registration.deleteMany();
  await prisma.event.deleteMany();
  await prisma.clubAdminAssignment.deleteMany();
  await prisma.club.deleteMany();
  await prisma.user.deleteMany();

  console.log('Existing records cleared.');

  // Create Users
  const superAdminPassword = await bcrypt.hash('adminpassword123', 10);
  const clubAdminPassword = await bcrypt.hash('clubpassword123', 10);
  const studentPassword = await bcrypt.hash('studentpassword123', 10);

  const superAdmin = await prisma.user.create({
    data: {
      name: 'Silicon West Super Admin',
      email: 'superadmin@silicon.ac.in',
      passwordHash: superAdminPassword,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  const codingAdmin = await prisma.user.create({
    data: {
      name: 'Prof. Alekha Dash',
      email: 'coding.admin@silicon.ac.in',
      passwordHash: clubAdminPassword,
      role: 'CLUB_ADMIN',
      isActive: true,
    },
  });

  const roboticsAdmin = await prisma.user.create({
    data: {
      name: 'Dr. Priyanka Sahoo',
      email: 'robotics.admin@silicon.ac.in',
      passwordHash: clubAdminPassword,
      role: 'CLUB_ADMIN',
      isActive: true,
    },
  });

  const culturalAdmin = await prisma.user.create({
    data: {
      name: 'Rohan Mohapatra',
      email: 'resonance.admin@silicon.ac.in',
      passwordHash: clubAdminPassword,
      role: 'CLUB_ADMIN',
      isActive: true,
    },
  });

  const sportsAdmin = await prisma.user.create({
    data: {
      name: 'Coach Ananya Panda',
      email: 'sports.admin@silicon.ac.in',
      passwordHash: clubAdminPassword,
      role: 'CLUB_ADMIN',
      isActive: true,
    },
  });

  const studentUser = await prisma.user.create({
    data: {
      name: 'Rahul Tripathy',
      email: 'student@silicon.ac.in',
      passwordHash: studentPassword,
      role: 'STUDENT',
      isActive: true,
    },
  });

  console.log('Users created successfully.');

  // Create Clubs
  const codingClub = await prisma.club.create({
    data: {
      name: 'Silicon Coding Club (SCC)',
      slug: 'silicon-coding-club',
      category: 'Technical',
      shortDescription: 'The premier competitive coding, open-source and hackathon hub of Silicon University.',
      description: 'Silicon Coding Club (SCC) nurtures problem-solving, algorithm design, full-stack software development, machine learning, and cloud computing. We organize 24-hour hackathons, weekly code sprints, and tech talks from distinguished industry alumni.',
      contactEmail: 'codingclub@silicon.ac.in',
      isPublic: true,
      logoUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&auto=format&fit=crop&q=80',
    },
  });

  const roboticsClub = await prisma.club.create({
    data: {
      name: 'RoboSilicon - Robotics & IoT Club',
      slug: 'robosilicon',
      category: 'Technical',
      shortDescription: 'Building autonomous systems, embedded micro-controllers, IoT networks, and combat robotics.',
      description: 'RoboSilicon provides students with hands-on exposure to microcontrollers, PCB design, autonomous rovers, and drone technology. Our members participate in prestigious national robotics competitions including Techfest and e-Yantra.',
      contactEmail: 'robotics@silicon.ac.in',
      isPublic: true,
      logoUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&auto=format&fit=crop&q=80',
    },
  });

  const culturalClub = await prisma.club.create({
    data: {
      name: 'Resonance - Cultural & Performing Arts Club',
      slug: 'resonance-cultural-club',
      category: 'Cultural',
      shortDescription: 'The vibrant heartbeat of Silicon West campus culture, music, dance, and dramatic arts.',
      description: 'Resonance brings together artists, singers, dancers, and actors from across departments. We organize the annual flagship cultural extravaganza "Zygon", inter-college drama fests, acoustic musical nights, and cultural celebrations.',
      contactEmail: 'resonance@silicon.ac.in',
      isPublic: true,
      logoUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
    },
  });

  const sportsClub = await prisma.club.create({
    data: {
      name: 'Spartans Sports & Athletics Club',
      slug: 'spartans-sports',
      category: 'Sports',
      shortDescription: 'Fostering athletic excellence, teamwork, and championship spirit on the field.',
      description: 'Spartans promotes physical fitness, sportsmanship, and competitive athletic prowess. We host annual inter-branch tournaments in cricket, football, volleyball, basketball, badminton, table tennis, and track athletics.',
      contactEmail: 'sports@silicon.ac.in',
      isPublic: true,
      logoUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&auto=format&fit=crop&q=80',
    },
  });

  const ieeeBranch = await prisma.club.create({
    data: {
      name: 'IEEE Student Branch Silicon West',
      slug: 'ieee-silicon-west',
      category: 'Technical & Research',
      shortDescription: 'Empowering tech innovators with global IEEE research, publications, and symposiums.',
      description: 'Silicon West IEEE Student Branch is dedicated to advancing technology for humanity. We organize international conferences, research paper publishing bootcamps, and technical certification courses.',
      contactEmail: 'ieee@silicon.ac.in',
      isPublic: true,
      logoUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400&auto=format&fit=crop&q=80',
      establishedYear: null,
      socialLinks: {
        linkedin: 'https://linkedin.com/company/ieee-silicon-west',
        instagram: 'https://instagram.com/ieee_siliconwest',
      },
    },
  });

  const mediaClub = await prisma.club.create({
    data: {
      name: 'Pixels Photography & Media Society',
      slug: 'pixels-media-society',
      category: 'Media & Arts',
      shortDescription: 'Capturing the moments, stories, and visual memories of Silicon University.',
      description: 'Pixels is the official media & creative production team of Silicon West. We specialize in digital photography, short film cinematography, graphic design, and media coverage of all university milestones.',
      contactEmail: 'pixels@silicon.ac.in',
      isPublic: true,
      logoUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&auto=format&fit=crop&q=80',
    },
  });

  console.log('Clubs created successfully.');

  // Create Club Admin Assignments
  await prisma.clubAdminAssignment.createMany({
    data: [
      { userId: codingAdmin.id, clubId: codingClub.id, assignedByUserId: superAdmin.id },
      { userId: roboticsAdmin.id, clubId: roboticsClub.id, assignedByUserId: superAdmin.id },
      { userId: culturalAdmin.id, clubId: culturalClub.id, assignedByUserId: superAdmin.id },
      { userId: sportsAdmin.id, clubId: sportsClub.id, assignedByUserId: superAdmin.id },
    ],
  });

  console.log('Club admin assignments created.');

  // Now create sample events
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;

  const event1 = await prisma.event.create({
    data: {
      clubId: codingClub.id,
      title: 'Silicon HackNova 2026: 36-Hour National Hackathon',
      slug: 'silicon-hacknova-2026',
      summary: 'Grand annual 36-hour hackathon focused on AI, Web3, GreenTech, and Smart Campus solutions.',
      description: `Silicon HackNova 2026 brings together the brightest undergraduate coders, system architects, and UI/UX designers for a 36-hour non-stop prototyping sprint.

Tracks include:
- Next-Gen Generative AI & Edge Agents
- Decentralized Trust & Web3 Infrastructure
- Sustainable CleanTech & Smart Campus Automation
- HealthTech & Accessible Computing

Prizes worth INR 2,50,000 + Incubation mentorship at Silicon University Technology Incubation Cell. Food, beverages, cloud credits, and swags provided for all participants.`,
      bannerUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&auto=format&fit=crop&q=80',
      category: 'Technical',
      venue: 'Main Auditorium & Innovation Labs, Tech Block, Silicon West',
      startsAt: new Date(now.getTime() + 10 * dayMs),
      endsAt: new Date(now.getTime() + 12 * dayMs),
      registrationDeadline: new Date(now.getTime() + 8 * dayMs),
      capacity: 150,
      status: 'PUBLISHED',
      createdByUserId: codingAdmin.id,
    },
  });

  const event2 = await prisma.event.create({
    data: {
      clubId: roboticsClub.id,
      title: 'Autonomous Robotics & Drone Tech Hands-on Workshop',
      slug: 'robotics-drone-tech-workshop',
      summary: 'Comprehensive 2-day boot camp on ROS 2, LiDAR navigation, and PX4 autopilot drone flight.',
      description: `Explore the future of autonomous mobility and aerial robotics! This intensive hands-on workshop walks through sensor fusion, SLAM navigation, and PX4 quadcopter flight controllers.

All hardware kits (ESP32, Ultrasonic, LiDAR sensors, and frame components) are provided during lab sessions. Certificates from RoboSilicon & IEEE Robotics Chapter will be awarded.`,
      bannerUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200&auto=format&fit=crop&q=80',
      category: 'Technical',
      venue: 'Advanced Robotics Lab, Silicon University Sambalpur Campus',
      startsAt: new Date(now.getTime() + 15 * dayMs),
      endsAt: new Date(now.getTime() + 16 * dayMs),
      registrationDeadline: new Date(now.getTime() + 13 * dayMs),
      capacity: 60,
      status: 'PUBLISHED',
      createdByUserId: roboticsAdmin.id,
    },
  });

  const event3 = await prisma.event.create({
    data: {
      clubId: culturalClub.id,
      title: 'Zygon 2026: Annual Cultural Gala & Battle of the Bands',
      slug: 'zygon-2026-cultural-gala',
      summary: 'The grandest cultural night of the year featuring music, dance choreography, and live rock bands.',
      description: `Get ready to rock the night! Zygon 2026 is Silicon West's flagship annual cultural festival. Witness high-octane western and eastern dance battles, dramatic theatrical performances, and an electrifying Battle of the Bands featuring campus favorites and guest headliners.

Entry is open to all university students with valid ID cards. Prior registration is mandatory for crowd control and access wristbands.`,
      bannerUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80',
      category: 'Cultural',
      venue: 'Open Air Amphitheatre, Silicon West Campus',
      startsAt: new Date(now.getTime() + 20 * dayMs),
      endsAt: new Date(now.getTime() + 22 * dayMs),
      registrationDeadline: new Date(now.getTime() + 18 * dayMs),
      capacity: 500,
      status: 'PUBLISHED',
      createdByUserId: culturalAdmin.id,
    },
  });

  const event4 = await prisma.event.create({
    data: {
      clubId: sportsClub.id,
      title: 'Silicon Premier League: Inter-Branch Cricket Championship',
      slug: 'silicon-premier-league-cricket',
      summary: 'Annual T20 tournament bringing together faculty and student teams in a battle for the trophy.',
      description: `The most anticipated cricket tournament of the semester is here. 8 department teams compete in a league format culminating in the high-stakes grand finale under the floodlights. Register your participation or cheering squad access now!`,
      bannerUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1200&auto=format&fit=crop&q=80',
      category: 'Sports',
      venue: 'Silicon West University Sports Grounds',
      startsAt: new Date(now.getTime() + 25 * dayMs),
      endsAt: new Date(now.getTime() + 28 * dayMs),
      registrationDeadline: new Date(now.getTime() + 22 * dayMs),
      capacity: 100,
      status: 'PUBLISHED',
      createdByUserId: sportsAdmin.id,
    },
  });

  // Seed sample registrations
  await prisma.registration.create({
    data: {
      eventId: event1.id,
      participantUserId: studentUser.id,
      participantName: 'Rahul Tripathy',
      participantEmail: 'student@silicon.ac.in',
      collegeName: 'Silicon Institute of Technology (Silicon West)',
      rollNumber: '21BTECH042',
      status: 'CONFIRMED',
    },
  });

  await prisma.registration.create({
    data: {
      eventId: event1.id,
      participantName: 'Swati Mohanty',
      participantEmail: 'swati.mohanty@silicon.ac.in',
      collegeName: 'Silicon Institute of Technology (Silicon West)',
      rollNumber: '22BTECH108',
      status: 'CONFIRMED',
    },
  });

  await prisma.registration.create({
    data: {
      eventId: event2.id,
      participantUserId: studentUser.id,
      participantName: 'Rahul Tripathy',
      participantEmail: 'student@silicon.ac.in',
      collegeName: 'Silicon Institute of Technology (Silicon West)',
      rollNumber: '21BTECH042',
      status: 'CONFIRMED',
    },
  });

  console.log('Events and sample registrations seeded successfully.');
  console.log('--- Database Seeding Complete ---');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
