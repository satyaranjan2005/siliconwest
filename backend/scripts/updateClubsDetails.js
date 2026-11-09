const prisma = require('../src/db');

async function main() {
  console.log('Enriching club leadership & details...');

  const clubsData = [
    {
      slug: 'silicon-coding-club',
      establishedYear: 2018,
      roomOrVenue: 'Tech Innovation Lab 3, Academic Block II',
      meetingSchedule: 'Every Wednesday & Saturday, 4:30 PM - 6:30 PM',
      facultyCoordinator: 'Dr. Amrit Ranjan Mohanty',
      facultyCoordinatorEmail: 'amrit.mohanty@silicon.ac.in',
      facultyDept: 'Associate Professor, Dept. of Computer Science & Engineering',
      secretary: 'Siddharth Patnaik',
      secretaryEmail: 'siddharth.scc@silicon.ac.in',
      secretaryPhone: '+91 98610 23451',
      secretaryBranch: 'B.Tech CSE (4th Year)',
      jointSecretary: 'Ananya Rath',
      jointSecretaryEmail: 'ananya.rath@silicon.ac.in',
      jointSecretaryPhone: '+91 97780 44120',
      jointSecretaryBranch: 'B.Tech CSE (3rd Year)',
      socialLinks: {
        github: 'https://github.com/siliconwest-scc',
        linkedin: 'https://linkedin.com/company/silicon-coding-club',
        instagram: 'https://instagram.com/scc_silicon',
        discord: 'https://discord.gg/silicon-devs'
      },
      coordinators: [
        {
          name: 'Subham Kumar Jena',
          role: 'Lead Technical Coordinator (Algorithms & CP)',
          branch: 'B.Tech CSE, 3rd Year',
          email: 'subham.jena@silicon.ac.in',
          phone: '+91 98612 00192'
        },
        {
          name: 'Priyanka Mishra',
          role: 'Full-Stack & Open Source Coordinator',
          branch: 'B.Tech CSE, 3rd Year',
          email: 'priyanka.m@silicon.ac.in',
          phone: '+91 97782 11984'
        },
        {
          name: 'Rohan Mohapatra',
          role: 'Hackathons & Contests Coordinator',
          branch: 'B.Tech ECE, 3rd Year',
          email: 'rohan.m@silicon.ac.in',
          phone: '+91 94371 45091'
        },
        {
          name: 'Ishita Roy',
          role: 'Community Outreach & PR Coordinator',
          branch: 'B.Tech CSE, 2nd Year',
          email: 'ishita.roy@silicon.ac.in',
          phone: '+91 91240 66723'
        }
      ]
    },
    {
      slug: 'robosilicon',
      establishedYear: 2017,
      roomOrVenue: 'Advanced Mechatronics & Embedded IoT Lab, Ground Floor',
      meetingSchedule: 'Every Tuesday & Friday, 4:00 PM - 6:00 PM',
      facultyCoordinator: 'Prof. Soumya Ranjan Samal',
      facultyCoordinatorEmail: 'soumya.samal@silicon.ac.in',
      facultyDept: 'Assistant Professor, Dept. of Electronics & Communication',
      secretary: 'Abhishek Tripathy',
      secretaryEmail: 'abhishek.robo@silicon.ac.in',
      secretaryPhone: '+91 94371 88203',
      secretaryBranch: 'B.Tech ECE (4th Year)',
      jointSecretary: 'Tanmay Panda',
      jointSecretaryEmail: 'tanmay.p@silicon.ac.in',
      jointSecretaryPhone: '+91 91240 55678',
      jointSecretaryBranch: 'B.Tech EEE (3rd Year)',
      socialLinks: {
        linkedin: 'https://linkedin.com/company/robosilicon',
        instagram: 'https://instagram.com/robosilicon_official',
        youtube: 'https://youtube.com/@robosilicon'
      },
      coordinators: [
        {
          name: 'Aditya Narayanan',
          role: 'Drone Tech & Autonomous Systems Lead',
          branch: 'B.Tech ECE, 3rd Year',
          email: 'aditya.n@silicon.ac.in',
          phone: '+91 98613 44512'
        },
        {
          name: 'Deepak Mohanty',
          role: 'Embedded Hardware & PCB Design Lead',
          branch: 'B.Tech EEE, 3rd Year',
          email: 'deepak.m@silicon.ac.in',
          phone: '+91 94380 77123'
        },
        {
          name: 'Swati Swagatika',
          role: 'RoboWars Logistics & Safety Coordinator',
          branch: 'B.Tech ME, 2nd Year',
          email: 'swati.s@silicon.ac.in',
          phone: '+91 96582 33410'
        }
      ]
    },
    {
      slug: 'resonance-cultural-club',
      establishedYear: 2016,
      roomOrVenue: 'Student Activity Center (SAC) & Open Air Amphitheatre',
      meetingSchedule: 'Every Monday, Thursday & Saturday, 5:00 PM - 7:00 PM',
      facultyCoordinator: 'Dr. Minati Behera',
      facultyCoordinatorEmail: 'minati.behera@silicon.ac.in',
      facultyDept: 'Dean of Student Welfare & Cultural Affairs',
      secretary: 'Rituparna Sengupta',
      secretaryEmail: 'rituparna.s@silicon.ac.in',
      secretaryPhone: '+91 98532 10984',
      secretaryBranch: 'B.Tech CSE (4th Year)',
      jointSecretary: 'Ayush Dash',
      jointSecretaryEmail: 'ayush.dash@silicon.ac.in',
      jointSecretaryPhone: '+91 90901 23456',
      jointSecretaryBranch: 'B.Tech ME (3rd Year)',
      socialLinks: {
        instagram: 'https://instagram.com/resonance_silicon',
        youtube: 'https://youtube.com/@resonance_cultural'
      },
      coordinators: [
        {
          name: 'Sohini Roy',
          role: 'Vocal & Music Band Coordinator',
          branch: 'B.Tech CSE, 3rd Year',
          email: 'sohini.roy@silicon.ac.in',
          phone: '+91 98615 77890'
        },
        {
          name: 'Kunal Nayak',
          role: 'Choreography & Dance Crew Head',
          branch: 'B.Tech ECE, 3rd Year',
          email: 'kunal.nayak@silicon.ac.in',
          phone: '+91 94391 22340'
        },
        {
          name: 'Debasish Barik',
          role: 'Dramatics & Street Play (Nukkad) Lead',
          branch: 'B.Tech ME, 2nd Year',
          email: 'debasish.b@silicon.ac.in',
          phone: '+91 97785 66712'
        },
        {
          name: 'Payal Agarwal',
          role: 'Stage Production & Emcee Coordinator',
          branch: 'B.Tech CSE, 2nd Year',
          email: 'payal.a@silicon.ac.in',
          phone: '+91 90908 11234'
        }
      ]
    },
    {
      slug: 'spartans-sports',
      establishedYear: 2015,
      roomOrVenue: 'Sports Complex, Cricket Ground & Badminton Arena',
      meetingSchedule: 'Daily: 6:00 AM - 7:30 AM & 5:00 PM - 6:30 PM',
      facultyCoordinator: 'Prof. Rajesh Kumar Pradhan',
      facultyCoordinatorEmail: 'rajesh.pradhan@silicon.ac.in',
      facultyDept: 'Director of Physical Education & Sports',
      secretary: 'Vikramjit Singh',
      secretaryEmail: 'vikram.sports@silicon.ac.in',
      secretaryPhone: '+91 94390 12874',
      secretaryBranch: 'B.Tech Civil (4th Year)',
      jointSecretary: 'Smruti Rekha Das',
      jointSecretaryEmail: 'smruti.das@silicon.ac.in',
      jointSecretaryPhone: '+91 96580 43210',
      jointSecretaryBranch: 'B.Tech CSE (3rd Year)',
      socialLinks: {
        instagram: 'https://instagram.com/spartans_silicon',
        facebook: 'https://facebook.com/spartans.silicon'
      },
      coordinators: [
        {
          name: 'Rahul Verma',
          role: 'Cricket & Football Coordinator',
          branch: 'B.Tech ME, 3rd Year',
          email: 'rahul.verma@silicon.ac.in',
          phone: '+91 98618 33451'
        },
        {
          name: 'Pooja Sahoo',
          role: 'Badminton & Volleyball Lead',
          branch: 'B.Tech ECE, 3rd Year',
          email: 'pooja.sahoo@silicon.ac.in',
          phone: '+91 94372 99014'
        },
        {
          name: 'Manish Pattnaik',
          role: 'Table Tennis & Chess Coordinator',
          branch: 'B.Tech CSE, 2nd Year',
          email: 'manish.p@silicon.ac.in',
          phone: '+91 91244 55891'
        }
      ]
    },
    {
      slug: 'ieee-silicon-west',
      establishedYear: null,
      roomOrVenue: 'IEEE Student Research Center, Central Library Level 2',
      meetingSchedule: 'Every Alternate Thursday & Sunday, 11:00 AM - 1:00 PM',
      facultyCoordinator: 'Dr. Debabrata Singh',
      facultyCoordinatorEmail: 'debabrata.singh@silicon.ac.in',
      facultyDept: 'Senior Member IEEE, Professor, Dept. of CSE',
      secretary: 'Shreya Suman Panda',
      secretaryEmail: 'shreya.ieee@silicon.ac.in',
      secretaryPhone: '+91 94380 99120',
      secretaryBranch: 'B.Tech ECE (4th Year)',
      jointSecretary: 'Rajat Ray',
      jointSecretaryEmail: 'rajat.ray@silicon.ac.in',
      jointSecretaryPhone: '+91 98611 77234',
      jointSecretaryBranch: 'B.Tech CSE (3rd Year)',
      socialLinks: {
        linkedin: 'https://linkedin.com/company/ieee-silicon-west',
        instagram: 'https://instagram.com/ieee_siliconwest'
      },
      coordinators: [
        {
          name: 'Alok Kumar Sahu',
          role: 'Research Papers & Publications Lead',
          branch: 'B.Tech CSE, 3rd Year',
          email: 'alok.sahu@silicon.ac.in',
          phone: '+91 98614 22345'
        },
        {
          name: 'Sneha Parida',
          role: 'Women in Engineering (WIE) Coordinator',
          branch: 'B.Tech ECE, 3rd Year',
          email: 'sneha.p@silicon.ac.in',
          phone: '+91 97781 55670'
        },
        {
          name: 'Gaurav Mohanty',
          role: 'Industry Relations & Tech Symposium Lead',
          branch: 'B.Tech EE, 2nd Year',
          email: 'gaurav.m@silicon.ac.in',
          phone: '+91 94377 88912'
        }
      ]
    },
    {
      slug: 'pixels-media-society',
      establishedYear: 2019,
      roomOrVenue: 'Media Production & Visual Studio, Studio Block B',
      meetingSchedule: 'Every Friday, 4:30 PM - 6:30 PM & During University Events',
      facultyCoordinator: 'Prof. Archana Sahoo',
      facultyCoordinatorEmail: 'archana.sahoo@silicon.ac.in',
      facultyDept: 'Faculty Advisor, Dept. of Basic Sciences & Media Cell',
      secretary: 'Omm Prakash Mohanty',
      secretaryEmail: 'omm.pixels@silicon.ac.in',
      secretaryPhone: '+91 97760 11234',
      secretaryBranch: 'B.Tech CSE (4th Year)',
      jointSecretary: 'Lipsa Priyadarshini',
      jointSecretaryEmail: 'lipsa.p@silicon.ac.in',
      jointSecretaryPhone: '+91 91780 88901',
      jointSecretaryBranch: 'B.Tech ECE (3rd Year)',
      socialLinks: {
        instagram: 'https://instagram.com/pixels_silicon',
        youtube: 'https://youtube.com/@pixels_media_silicon'
      },
      coordinators: [
        {
          name: 'Subhajit Roy',
          role: 'Photography & Live Events Lead',
          branch: 'B.Tech CSE, 3rd Year',
          email: 'subhajit.r@silicon.ac.in',
          phone: '+91 98619 88123'
        },
        {
          name: 'Aditi Senapati',
          role: 'Cinematography & Aftermovie Director',
          branch: 'B.Tech ECE, 3rd Year',
          email: 'aditi.s@silicon.ac.in',
          phone: '+91 94393 44567'
        },
        {
          name: 'Pratik Dash',
          role: 'Digital Design & Visual Identity Coordinator',
          branch: 'B.Tech CSE, 2nd Year',
          email: 'pratik.dash@silicon.ac.in',
          phone: '+91 91249 77801'
        }
      ]
    }
  ];

  for (const item of clubsData) {
    const updated = await prisma.club.updateMany({
      where: { slug: item.slug },
      data: item
    });
    console.log(`Updated ${item.slug}:`, updated.count);
  }

  console.log('Finished updating clubs with council and leadership details.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
