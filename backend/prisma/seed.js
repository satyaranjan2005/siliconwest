const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Database Seeding ---');

  // Clear existing records in reverse dependency order
  await prisma.otp.deleteMany();
  await prisma.teamInvitation.deleteMany();
  await prisma.registration.deleteMany();
  await prisma.event.deleteMany();
  await prisma.clubAdminAssignment.deleteMany();
  await prisma.club.deleteMany();
  await prisma.user.deleteMany();

  console.log('Existing records cleared.');

  // Password hashes
  const superAdminPassword = await bcrypt.hash('adminpassword123', 10);
  const clubAdminPassword = await bcrypt.hash('clubpassword123', 10);
  const studentPassword = await bcrypt.hash('studentpassword123', 10);

  // 1. Super Admin Account
  const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || 'superadmin@silicon.ac.in').toLowerCase().trim();
  const superAdmin = await prisma.user.create({
    data: {
      name: 'Silicon West Super Admin',
      email: superAdminEmail,
      passwordHash: superAdminPassword,
      role: 'SUPER_ADMIN',
      sicNo: '23BCSN72',
      batch: '2023 - 2027',
      gender: 'Male',
      isActive: true,
      isEmailVerified: true,
    },
  });

  // Also create fallback superadmin@silicon.ac.in if custom email is different
  if (superAdminEmail !== 'superadmin@silicon.ac.in') {
    await prisma.user.create({
      data: {
        name: 'Super Admin Fallback',
        email: 'superadmin@silicon.ac.in',
        passwordHash: superAdminPassword,
        role: 'SUPER_ADMIN',
        sicNo: '21BTECH001',
        batch: '2021 - 2025',
        gender: 'Male',
        isActive: true,
        isEmailVerified: true,
      },
    });
  }

  // 2. Club Admins
  const codingAdmin = await prisma.user.create({
    data: {
      name: 'Prof. Alekha Dash',
      email: 'coding.admin@silicon.ac.in',
      passwordHash: clubAdminPassword,
      role: 'CLUB_ADMIN',
      sicNo: 'FAC_CSE01',
      gender: 'Male',
      isActive: true,
      isEmailVerified: true,
    },
  });

  const roboticsAdmin = await prisma.user.create({
    data: {
      name: 'Dr. Priyanka Sahoo',
      email: 'robotics.admin@silicon.ac.in',
      passwordHash: clubAdminPassword,
      role: 'CLUB_ADMIN',
      sicNo: 'FAC_ECE02',
      gender: 'Female',
      isActive: true,
      isEmailVerified: true,
    },
  });

  const culturalAdmin = await prisma.user.create({
    data: {
      name: 'Rohan Mohapatra',
      email: 'resonance.admin@silicon.ac.in',
      passwordHash: clubAdminPassword,
      role: 'CLUB_ADMIN',
      sicNo: '22BTECH005',
      gender: 'Male',
      isActive: true,
      isEmailVerified: true,
    },
  });

  const sportsAdmin = await prisma.user.create({
    data: {
      name: 'Coach Ananya Panda',
      email: 'sports.admin@silicon.ac.in',
      passwordHash: clubAdminPassword,
      role: 'CLUB_ADMIN',
      sicNo: 'FAC_SPORTS01',
      gender: 'Female',
      isActive: true,
      isEmailVerified: true,
    },
  });

  const mediaAdmin = await prisma.user.create({
    data: {
      name: 'Tanmayee Nayak',
      email: 'pixels.admin@silicon.ac.in',
      passwordHash: clubAdminPassword,
      role: 'CLUB_ADMIN',
      sicNo: '22BCSE018',
      gender: 'Female',
      isActive: true,
      isEmailVerified: true,
    },
  });

  // 3. Student Participants (Diverse batches & genders for accurate Year calculation)
  const students = [
    {
      name: 'Rahul Tripathy',
      email: 'student@silicon.ac.in',
      sicNo: '23BCSE042',
      batch: '2023 - 2027',
      gender: 'Male',
      branch: 'Computer Science & Engineering',
    },
    {
      name: 'Priya Sahoo',
      email: 'priya.sahoo@silicon.ac.in',
      sicNo: '23BCSE089',
      batch: '2023 - 2027',
      gender: 'Female',
      branch: 'Computer Science & Engineering',
    },
    {
      name: 'Aman Nayak',
      email: 'aman.nayak@silicon.ac.in',
      sicNo: '24BCSE015',
      batch: '2024 - 2028',
      gender: 'Male',
      branch: 'Computer Science & Engineering',
    },
    {
      name: 'Sneha Mishra',
      email: 'sneha.mishra@silicon.ac.in',
      sicNo: '24BCSE102',
      batch: '2024 - 2028',
      gender: 'Female',
      branch: 'Computer Science & Engineering',
    },
    {
      name: 'Rohan Das',
      email: 'rohan.das@silicon.ac.in',
      sicNo: '25BECE034',
      batch: '2025 - 2029',
      gender: 'Male',
      branch: 'Electronics & Communication Engineering',
    },
    {
      name: 'Ananya Panda',
      email: 'ananya.panda@silicon.ac.in',
      sicNo: '25BECE077',
      batch: '2025 - 2029',
      gender: 'Female',
      branch: 'Electronics & Communication Engineering',
    },
    {
      name: 'Bikash Rout',
      email: 'bikash.rout@silicon.ac.in',
      sicNo: '26BEEE012',
      batch: '2026 - 2030',
      gender: 'Male',
      branch: 'Electrical & Electronics Engineering',
    },
    {
      name: 'Pooja Patel',
      email: 'pooja.patel@silicon.ac.in',
      sicNo: '26BCSE050',
      batch: '2026 - 2030',
      gender: 'Female',
      branch: 'Computer Science & Engineering',
    },
    {
      name: 'Siddharth Patnaik',
      email: 'siddharth.p@silicon.ac.in',
      sicNo: '23BCSN12',
      batch: '2023 - 2027',
      gender: 'Male',
      branch: 'Computer Science & Engineering',
    },
    {
      name: 'Deepika Sen',
      email: 'deepika.sen@silicon.ac.in',
      sicNo: '24BECE088',
      batch: '2024 - 2028',
      gender: 'Female',
      branch: 'Electronics & Communication Engineering',
    },
  ];

  const studentUsers = [];
  for (const s of students) {
    const created = await prisma.user.create({
      data: {
        name: s.name,
        email: s.email,
        passwordHash: studentPassword,
        role: 'STUDENT',
        sicNo: s.sicNo,
        batch: s.batch,
        gender: s.gender,
        isActive: true,
        isEmailVerified: true,
      },
    });
    studentUsers.push({ ...created, branch: s.branch, batch: s.batch });
  }

  console.log(`Created ${studentUsers.length} student participant profiles.`);

  // 4. Clubs
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

  const ieeeBranch = await prisma.club.create({
    data: {
      name: 'IEEE Student Branch Silicon West',
      slug: 'ieee-silicon-west',
      category: 'Technical',
      shortDescription: 'Empowering tech innovators with global IEEE research, publications, and symposiums.',
      description: 'Silicon West IEEE Student Branch is dedicated to advancing technology for humanity. We organize international conferences, research paper publishing bootcamps, and technical certification courses.',
      contactEmail: 'ieee@silicon.ac.in',
      isPublic: true,
      logoUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400&auto=format&fit=crop&q=80',
    },
  });

  // Assign club coordinators
  await prisma.clubAdminAssignment.createMany({
    data: [
      { userId: codingAdmin.id, clubId: codingClub.id, assignedByUserId: superAdmin.id },
      { userId: roboticsAdmin.id, clubId: roboticsClub.id, assignedByUserId: superAdmin.id },
      { userId: culturalAdmin.id, clubId: culturalClub.id, assignedByUserId: superAdmin.id },
      { userId: sportsAdmin.id, clubId: sportsClub.id, assignedByUserId: superAdmin.id },
      { userId: mediaAdmin.id, clubId: mediaClub.id, assignedByUserId: superAdmin.id },
    ],
  });

  console.log('Clubs and club admin assignments created.');

  // 5. Create Events (Individual + Team across all societies)
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;

  // EVENT 1: TEAM EVENT (Coding Hackathon - 2 to 4 members)
  const hackathonEvent = await prisma.event.create({
    data: {
      clubId: codingClub.id,
      title: 'Silicon HackNova 2026: 36-Hour National Hackathon',
      slug: 'silicon-hacknova-2026',
      summary: 'Grand annual 36-hour hackathon focused on AI, Web3, GreenTech, and Smart Campus solutions.',
      description: 'Silicon HackNova 2026 brings together the brightest undergraduate coders, system architects, and UI/UX designers for a 36-hour non-stop prototyping sprint. Tracks include Generative AI, Decentralized Trust, and CleanTech.',
      bannerUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&auto=format&fit=crop&q=80',
      category: 'Technical',
      venue: 'Main Auditorium & Innovation Labs, Tech Block',
      startsAt: new Date(now.getTime() + 10 * dayMs),
      endsAt: new Date(now.getTime() + 12 * dayMs),
      registrationDeadline: new Date(now.getTime() + 8 * dayMs),
      capacity: 300,
      status: 'PUBLISHED',
      isTeamEvent: true,
      minTeamSize: 2,
      maxTeamSize: 4,
      entryFee: 'Free',
      prizePool: '₹2,50,000 + Tech Mentorship',
      createdByUserId: codingAdmin.id,
    },
  });

  // EVENT 2: INDIVIDUAL EVENT (Competitive Programming)
  const algoEvent = await prisma.event.create({
    data: {
      clubId: codingClub.id,
      title: 'AlgoStrike: National Competitive Coding Olympiad',
      slug: 'algostrike-coding-olympiad',
      summary: 'Fast-paced algorithmic programming contest testing data structures, dynamic programming, and speed.',
      description: 'AlgoStrike is a 3-hour intense coding showdown on competitive platforms. Top performers receive cash awards, direct interview fast-tracks, and certificates of distinction.',
      bannerUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80',
      category: 'Technical',
      venue: 'Advanced Computing Center, Block B, Silicon West',
      startsAt: new Date(now.getTime() + 5 * dayMs),
      endsAt: new Date(now.getTime() + 5 * dayMs + 4 * 3600 * 1000),
      registrationDeadline: new Date(now.getTime() + 4 * dayMs),
      capacity: 250,
      status: 'PUBLISHED',
      isTeamEvent: false,
      minTeamSize: 1,
      maxTeamSize: 1,
      entryFee: 'Free',
      prizePool: '₹50,000 Cash Pool',
      createdByUserId: codingAdmin.id,
    },
  });

  // EVENT 3: TEAM EVENT (RoboWar & Maze Runner - 2 to 3 members)
  const roboWarEvent = await prisma.event.create({
    data: {
      clubId: roboticsClub.id,
      title: 'RoboClash: Combat Robotics & Autonomous Maze Runner',
      slug: 'roboclash-combat-robotics',
      summary: 'High-voltage combat robotics arena battles and line-follower maze navigation.',
      description: 'Bring your custom-built bots to the arena! Featuring Featherweight combat battles and autonomous vision-based maze solvers.',
      bannerUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200&auto=format&fit=crop&q=80',
      category: 'Technical',
      venue: 'Mechanical Workshop Arena, Ground Floor',
      startsAt: new Date(now.getTime() + 14 * dayMs),
      endsAt: new Date(now.getTime() + 15 * dayMs),
      registrationDeadline: new Date(now.getTime() + 11 * dayMs),
      capacity: 250,
      status: 'PUBLISHED',
      isTeamEvent: true,
      minTeamSize: 2,
      maxTeamSize: 3,
      entryFee: 'Free',
      prizePool: '₹75,000 + Trophy',
      createdByUserId: roboticsAdmin.id,
    },
  });

  // EVENT 4: INDIVIDUAL EVENT (Drone Flight & Autopilot Workshop)
  const droneEvent = await prisma.event.create({
    data: {
      clubId: roboticsClub.id,
      title: 'PX4 Drone Autopilot & Aerial Sensor Hands-on Workshop',
      slug: 'px4-drone-autopilot-workshop',
      summary: 'Hands-on training on assembling UAVs, flight controllers, and GPS waypoint mission planning.',
      description: 'Comprehensive 2-day boot camp on flight control firmware, sensor calibration, and autonomous fail-safe drone flight.',
      bannerUrl: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=1200&auto=format&fit=crop&q=80',
      category: 'Technical',
      venue: 'Advanced IoT Lab, Tech Block A',
      startsAt: new Date(now.getTime() + 18 * dayMs),
      endsAt: new Date(now.getTime() + 19 * dayMs),
      registrationDeadline: new Date(now.getTime() + 16 * dayMs),
      capacity: 250,
      status: 'PUBLISHED',
      isTeamEvent: false,
      minTeamSize: 1,
      maxTeamSize: 1,
      entryFee: 'Free',
      createdByUserId: roboticsAdmin.id,
    },
  });

  // EVENT 5: TEAM EVENT (Battle of the Bands - 3 to 6 members)
  const musicBattleEvent = await prisma.event.create({
    data: {
      clubId: culturalClub.id,
      title: 'Resonance BandWars: Inter-College Live Rock & Fusion Night',
      slug: 'resonance-bandwars-rock-night',
      summary: 'Battle of the bands featuring live rock, classical fusion, and eastern vocal ensembles.',
      description: 'The loudest cultural night of the season. Bands perform original compositions and covers before a live crowd and celebrity judges.',
      bannerUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80',
      category: 'Cultural',
      venue: 'Open Air Amphitheatre, Silicon West Campus',
      startsAt: new Date(now.getTime() + 21 * dayMs),
      endsAt: new Date(now.getTime() + 22 * dayMs),
      registrationDeadline: new Date(now.getTime() + 19 * dayMs),
      capacity: 350,
      status: 'PUBLISHED',
      isTeamEvent: true,
      minTeamSize: 3,
      maxTeamSize: 6,
      entryFee: 'Free',
      prizePool: '₹60,000 + Studio Recording Deal',
      createdByUserId: culturalAdmin.id,
    },
  });

  // EVENT 6: INDIVIDUAL EVENT (Solo Singing & Instrumental)
  const soloMusicEvent = await prisma.event.create({
    data: {
      clubId: culturalClub.id,
      title: 'Voice of Silicon: Solo Classical & Contemporary Music Idol',
      slug: 'voice-of-silicon-solo-idol',
      summary: 'Annual solo vocal and instrumental music competition for aspiring campus musicians.',
      description: 'Showcase your vocal range and instrumental mastery. Judged on melody, rhythm, stage presence, and lyrical expression.',
      bannerUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop&q=80',
      category: 'Cultural',
      venue: 'Acoustic Seminar Hall, Academic Block C',
      startsAt: new Date(now.getTime() + 12 * dayMs),
      endsAt: new Date(now.getTime() + 12 * dayMs + 6 * 3600 * 1000),
      registrationDeadline: new Date(now.getTime() + 10 * dayMs),
      capacity: 250,
      status: 'PUBLISHED',
      isTeamEvent: false,
      minTeamSize: 1,
      maxTeamSize: 1,
      entryFee: 'Free',
      prizePool: '₹25,000 + Trophy',
      createdByUserId: culturalAdmin.id,
    },
  });

  // EVENT 7: TEAM EVENT (Cricket Championship - 7 to 11 members)
  const cricketEvent = await prisma.event.create({
    data: {
      clubId: sportsClub.id,
      title: 'Silicon Premier League: Inter-Branch T20 Cricket Championship',
      slug: 'silicon-premier-league-cricket',
      summary: 'Annual 8-department T20 cricket tournament for the prestigious Silicon Rolling Trophy.',
      description: 'Departmental teams square off in league matches culminating in the grand floodlit finale. Full kits, match balls, and refreshments provided.',
      bannerUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1200&auto=format&fit=crop&q=80',
      category: 'Sports',
      venue: 'Main Sports Complex & Cricket Pavilion',
      startsAt: new Date(now.getTime() + 25 * dayMs),
      endsAt: new Date(now.getTime() + 28 * dayMs),
      registrationDeadline: new Date(now.getTime() + 22 * dayMs),
      capacity: 300,
      status: 'PUBLISHED',
      isTeamEvent: true,
      minTeamSize: 7,
      maxTeamSize: 11,
      entryFee: 'Free',
      prizePool: 'Champions Cup + Medals',
      createdByUserId: sportsAdmin.id,
    },
  });

  // EVENT 8: INDIVIDUAL EVENT (Badminton Singles Open)
  const badmintonEvent = await prisma.event.create({
    data: {
      clubId: sportsClub.id,
      title: 'Silicon Smash: Campus Badminton Singles Championship',
      slug: 'silicon-smash-badminton-singles',
      summary: 'Fast-paced knockout badminton singles tournament across Men and Women divisions.',
      description: 'Official campus badminton tournament played on international-standard synthetic courts under BWF rules.',
      bannerUrl: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1200&auto=format&fit=crop&q=80',
      category: 'Sports',
      venue: 'Indoor Sports Stadium, Badminton Courts 1 & 2',
      startsAt: new Date(now.getTime() + 8 * dayMs),
      endsAt: new Date(now.getTime() + 9 * dayMs),
      registrationDeadline: new Date(now.getTime() + 6 * dayMs),
      capacity: 250,
      status: 'PUBLISHED',
      isTeamEvent: false,
      minTeamSize: 1,
      maxTeamSize: 1,
      entryFee: 'Free',
      prizePool: '₹20,000 + Yonex Pro Gear',
      createdByUserId: sportsAdmin.id,
    },
  });

  // EVENT 9: INDIVIDUAL EVENT (Photography Contest)
  const photoEvent = await prisma.event.create({
    data: {
      clubId: mediaClub.id,
      title: 'FrameCraft: National Campus & Street Photography Exhibition',
      slug: 'framecraft-photography-contest',
      summary: 'Theme-based digital photography competition focusing on Architecture, Human Emotion, and Wildlife.',
      description: 'Submit your best captures! Shortlisted photos will be framed and exhibited in the central art gallery, with awards from renowned photojournalists.',
      bannerUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1200&auto=format&fit=crop&q=80',
      category: 'Media & Arts',
      venue: 'University Art Gallery & Design Center',
      startsAt: new Date(now.getTime() + 16 * dayMs),
      endsAt: new Date(now.getTime() + 17 * dayMs),
      registrationDeadline: new Date(now.getTime() + 14 * dayMs),
      capacity: 250,
      status: 'PUBLISHED',
      isTeamEvent: false,
      minTeamSize: 1,
      maxTeamSize: 1,
      entryFee: 'Free',
      prizePool: '₹30,000 + Camera Accessories',
      createdByUserId: mediaAdmin.id,
    },
  });

  // EVENT 10: INDIVIDUAL EVENT (IEEE Paper Presentation)
  const ieeeEvent = await prisma.event.create({
    data: {
      clubId: ieeeBranch.id,
      title: 'IEEE TechColloquium: Undergraduate Research Paper Presentation',
      slug: 'ieee-techcolloquium-research',
      summary: 'Present peer-reviewed research papers on Embedded AI, VLSI, Wireless Comms, and Green Energy.',
      description: 'Selected manuscripts will receive IEEE conference publication assistance and mentorship from IEEE Senior Members.',
      bannerUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&auto=format&fit=crop&q=80',
      category: 'Technical',
      venue: 'Main Seminar Hall 1, Research & Incubation Block',
      startsAt: new Date(now.getTime() + 30 * dayMs),
      endsAt: new Date(now.getTime() + 31 * dayMs),
      registrationDeadline: new Date(now.getTime() + 26 * dayMs),
      capacity: 250,
      status: 'PUBLISHED',
      isTeamEvent: false,
      minTeamSize: 1,
      maxTeamSize: 1,
      entryFee: 'Free',
      prizePool: '₹40,000 + IEEE Certification',
      createdByUserId: codingAdmin.id,
    },
  });

  console.log('Created 10 diverse events (both Team & Individual).');

  // =========================================================================
  // 6. PROCEDURAL GENERATOR: 100 PARTICIPANTS FOR EVERY SINGLE EVENT
  // =========================================================================

  const FIRST_NAMES = [
    'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
    'Shaurya', 'Atharv', 'Advik', 'Pranav', 'Advaith', 'Aaryan', 'Dhruv', 'Kabir', 'Rohan', 'Bikash',
    'Rahul', 'Aniket', 'Ayush', 'Priyanshu', 'Siddharth', 'Satyaranjan', 'Sourav', 'Subham', 'Abhishek', 'Deepak',
    'Manish', 'Rakesh', 'Suresh', 'Amit', 'Alok', 'Sumit', 'Debasish', 'Chinmay', 'Biswajit', 'Ashutosh',
    'Ananya', 'Diya', 'Saanvi', 'Aadhya', 'Kiara', 'Pari', 'Ira', 'Myra', 'Anvi', 'Prisha',
    'Riya', 'Aarohi', 'Anaya', 'Sneha', 'Pooja', 'Priya', 'Deepika', 'Swati', 'Sunita', 'Neha',
    'Shreya', 'Tanmayee', 'Monika', 'Laxmi', 'Rashmi', 'Jyoti', 'Kavita', 'Sasmita', 'Barsa', 'Mitali'
  ];

  const LAST_NAMES = [
    'Sharma', 'Verma', 'Patel', 'Nayak', 'Rout', 'Mohanty', 'Panda', 'Das', 'Dash', 'Sahoo',
    'Tripathy', 'Mishra', 'Pradhan', 'Behera', 'Patnaik', 'Samal', 'Barik', 'Mallick', 'Jena', 'Swain',
    'Bhoi', 'Sethy', 'Lenka', 'Muduli', 'Kundu', 'Senapati', 'Acharya', 'Biswal', 'Panigrahi', 'Rath'
  ];

  const BRANCHES = [
    { name: 'Computer Science & Engineering', code: 'BCSE' },
    { name: 'Electronics & Communication Engineering', code: 'BECE' },
    { name: 'Electrical & Electronics Engineering', code: 'BEEE' },
    { name: 'Mechanical Engineering', code: 'BMECH' },
    { name: 'Civil Engineering', code: 'BCIVIL' },
    { name: 'Information Technology', code: 'BIT' },
  ];

  const BATCHES = [
    { batch: '2023 - 2027', year: '4th Year', code: '23' },
    { batch: '2024 - 2028', year: '3rd Year', code: '24' },
    { batch: '2025 - 2029', year: '2nd Year', code: '25' },
    { batch: '2026 - 2030', year: '1st Year', code: '26' },
  ];

  const TEAM_PREFIXES = [
    'Cyber', 'Quantum', 'Alpha', 'Nexus', 'Turbo', 'Hyper', 'Silicon', 'Apex', 'Matrix', 'Vortex',
    'Echo', 'Omega', 'Phoenix', 'Titan', 'Byte', 'Neural', 'Binary', 'Shadow', 'Iron', 'Solar',
    'Pulse', 'Aero', 'Stellar', 'Code', 'Robo', 'Sonic', 'Cosmo', 'Vector', 'Prime', 'Zenith',
    'Blaze', 'Fusion', 'Thunder', 'Astral', 'Delta', 'Dynamic', 'Nova', 'Storm', 'Gravity', 'Spark'
  ];

  const TEAM_SUFFIXES = [
    'Knights', 'Pioneers', 'Warriors', 'Innovators', 'Wizards', 'Titans', 'Spartans', 'Crushers', 'Hackers', 'Legends',
    'Devs', 'Strikers', 'Rangers', 'Benders', 'Voyagers', 'Squad', 'Crew', 'Syndicate', 'Force', 'Dynasty'
  ];

  const crypto = require('crypto');

  // Helper to build realistic student entry
  function generateStudent(eventPrefix, idx) {
    const f = FIRST_NAMES[idx % FIRST_NAMES.length];
    const l = LAST_NAMES[Math.floor(idx / FIRST_NAMES.length) % LAST_NAMES.length];
    const b = BATCHES[idx % BATCHES.length];
    const br = BRANCHES[idx % BRANCHES.length];
    const email = `${f.toLowerCase()}.${l.toLowerCase()}${idx + 1}.${eventPrefix}@silicon.ac.in`;
    const sic = `${b.code}${br.code}${String(100 + (idx % 899)).padStart(3, '0')}`;
    const phone = `+91 ${9000000000 + ((idx * 3719) % 999999999)}`;
    const gender = (idx % 2 === 0) ? 'Male' : 'Female';

    return {
      name: `${f} ${l}`,
      email,
      sic,
      phone,
      branch: br.name,
      year: b.year,
      gender,
      batch: b.batch,
    };
  }

  // --- 1. SEED 100 PARTICIPANTS FOR INDIVIDUAL EVENTS ---
  const individualEvents = [
    { event: algoEvent, prefix: 'algo' },
    { event: droneEvent, prefix: 'drone' },
    { event: soloMusicEvent, prefix: 'voice' },
    { event: badmintonEvent, prefix: 'smash' },
    { event: photoEvent, prefix: 'photo' },
    { event: ieeeEvent, prefix: 'ieee' },
  ];

  for (const { event, prefix } of individualEvents) {
    const regRecords = [];
    for (let i = 0; i < 100; i++) {
      const student = generateStudent(prefix, i);
      // Realistic staggered registration timestamp in the past 14 days
      const registeredAt = new Date(now.getTime() - (100 - i) * 3600 * 1000 * 3);

      regRecords.push({
        id: crypto.randomUUID(),
        eventId: event.id,
        participantName: student.name,
        participantEmail: student.email,
        collegeName: 'Silicon Institute of Technology (Silicon West)',
        rollNumber: student.sic,
        phone: student.phone,
        branch: student.branch,
        year: student.year,
        status: 'CONFIRMED',
        registeredAt,
      });
    }

    await prisma.registration.createMany({ data: regRecords });
    console.log(`Seeded 100 individual participants for: ${event.title}`);
  }

  // --- 2. SEED 100 PARTICIPANTS FOR TEAM EVENTS ---
  const teamEvents = [
    { event: hackathonEvent, prefix: 'hack', teamSize: 4, teamCount: 25 },   // 25 teams * 4 = 100 participants
    { event: roboWarEvent, prefix: 'robo', teamSize: 3, teamCount: 34 },     // 34 teams * 3 = 102 participants
    { event: musicBattleEvent, prefix: 'band', teamSize: 4, teamCount: 25 }, // 25 teams * 4 = 100 participants
    { event: cricketEvent, prefix: 'cric', teamSize: 10, teamCount: 10 },    // 10 teams * 10 = 100 participants
  ];

  for (const { event, prefix, teamSize, teamCount } of teamEvents) {
    let globalIdx = 0;

    for (let t = 0; t < teamCount; t++) {
      const teamAdj = TEAM_PREFIXES[t % TEAM_PREFIXES.length];
      const teamNoun = TEAM_SUFFIXES[t % TEAM_SUFFIXES.length];
      const teamName = `${teamAdj} ${teamNoun}`;

      // Leader
      const leader = generateStudent(prefix, globalIdx++);
      const regId = crypto.randomUUID();
      const registeredAt = new Date(now.getTime() - (teamCount - t) * 3600 * 1000 * 12);

      await prisma.registration.create({
        data: {
          id: regId,
          eventId: event.id,
          participantName: leader.name,
          participantEmail: leader.email,
          collegeName: 'Silicon Institute of Technology (Silicon West)',
          rollNumber: leader.sic,
          phone: leader.phone,
          branch: leader.branch,
          year: leader.year,
          teamName,
          status: 'CONFIRMED',
          registeredAt,
        },
      });

      // Teammates with accepted invitations
      const memberCount = teamSize - 1;
      const invitations = [];

      for (let m = 0; m < memberCount; m++) {
        const teammate = generateStudent(prefix, globalIdx++);
        invitations.push({
          id: crypto.randomUUID(),
          eventId: event.id,
          registrationId: regId,
          teamName,
          inviterUserId: superAdmin.id,
          inviterName: leader.name,
          inviteeName: teammate.name,
          inviteeEmail: teammate.email,
          status: 'ACCEPTED',
          createdAt: new Date(registeredAt.getTime() + (m + 1) * 3600 * 1000 * 2),
        });
      }

      await prisma.teamInvitation.createMany({ data: invitations });
    }

    console.log(`Seeded 100+ team participants (${teamCount} teams x ${teamSize} members) for: ${event.title}`);
  }

  console.log('\n=============================================================');
  console.log('✅ DATABASE SEEDING COMPLETED: 1,000+ PARTICIPANTS SEEDED!');
  console.log('   - 6 Individual Events x 100 participants = 600 participants');
  console.log('   - 4 Team Events x ~100 participants     = 402 participants');
  console.log('   - Total Event Participants              = 1,002 participants');
  console.log('=============================================================\n');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
