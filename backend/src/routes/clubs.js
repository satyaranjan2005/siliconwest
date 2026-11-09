const express = require('express');
const { z } = require('zod');
const prisma = require('../db');
const {
  authenticate,
  optionalAuth,
  requireSuperAdmin,
  canUserManageClub,
} = require('../middleware/auth');

const router = express.Router();

const clubCreateSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  shortDescription: z.string().optional().nullable(),
  description: z.string().min(10),
  logoUrl: z.string().optional().or(z.literal('')).nullable(),
  bannerUrl: z.string().optional().or(z.literal('')).nullable(),
  category: z.string().optional().nullable(),
  contactEmail: z.string().email().optional().or(z.literal('')).nullable(),
  contactPhone: z.string().optional().or(z.literal('')).nullable(),
  isPublic: z.boolean().default(true),
  establishedYear: z.number().int().optional().nullable(),
  roomOrVenue: z.string().optional().nullable(),
  meetingSchedule: z.string().optional().nullable(),
  facultyCoordinator: z.string().optional().nullable(),
  facultyCoordinatorEmail: z.string().email().optional().or(z.literal('')).nullable(),
  facultyCoordinatorPhone: z.string().optional().or(z.literal('')).nullable(),
  facultyCoordinatorPhoto: z.string().optional().or(z.literal('')).nullable(),
  facultyDept: z.string().optional().nullable(),
  secretary: z.string().optional().nullable(),
  secretaryEmail: z.string().email().optional().or(z.literal('')).nullable(),
  secretaryPhone: z.string().optional().nullable(),
  secretaryBranch: z.string().optional().nullable(),
  secretaryYear: z.string().optional().nullable(),
  secretaryPhoto: z.string().optional().or(z.literal('')).nullable(),
  jointSecretary: z.string().optional().nullable(),
  jointSecretaryEmail: z.string().email().optional().or(z.literal('')).nullable(),
  jointSecretaryPhone: z.string().optional().nullable(),
  jointSecretaryBranch: z.string().optional().nullable(),
  jointSecretaryYear: z.string().optional().nullable(),
  jointSecretaryPhoto: z.string().optional().or(z.literal('')).nullable(),
  coordinators: z.any().optional(),
  socialLinks: z.any().optional(),
});

const clubUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  shortDescription: z.string().optional().nullable(),
  description: z.string().min(10).optional(),
  logoUrl: z.string().optional().nullable().or(z.literal('')),
  bannerUrl: z.string().optional().nullable().or(z.literal('')),
  category: z.string().optional().nullable(),
  contactEmail: z.string().email().optional().nullable().or(z.literal('')),
  contactPhone: z.string().optional().nullable().or(z.literal('')),
  isPublic: z.boolean().optional(),
  establishedYear: z.number().int().optional().nullable(),
  roomOrVenue: z.string().optional().nullable(),
  meetingSchedule: z.string().optional().nullable(),
  facultyCoordinator: z.string().optional().nullable(),
  facultyCoordinatorEmail: z.string().email().optional().nullable().or(z.literal('')),
  facultyCoordinatorPhone: z.string().optional().nullable().or(z.literal('')),
  facultyCoordinatorPhoto: z.string().optional().nullable().or(z.literal('')),
  facultyDept: z.string().optional().nullable(),
  secretary: z.string().optional().nullable(),
  secretaryEmail: z.string().email().optional().nullable().or(z.literal('')),
  secretaryPhone: z.string().optional().nullable(),
  secretaryBranch: z.string().optional().nullable(),
  secretaryYear: z.string().optional().nullable(),
  secretaryPhoto: z.string().optional().nullable().or(z.literal('')),
  jointSecretary: z.string().optional().nullable(),
  jointSecretaryEmail: z.string().email().optional().nullable().or(z.literal('')),
  jointSecretaryPhone: z.string().optional().nullable(),
  jointSecretaryBranch: z.string().optional().nullable(),
  jointSecretaryYear: z.string().optional().nullable(),
  jointSecretaryPhoto: z.string().optional().nullable().or(z.literal('')),
  coordinators: z.any().optional(),
  socialLinks: z.any().optional(),
});

const CLUB_ENRICHMENT_MAP = {
  'silicon-coding-club': {
    bannerUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1600&auto=format&fit=crop&q=80',
    logoUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&auto=format&fit=crop&q=80',
    establishedYear: 2018,
    roomOrVenue: 'Tech Innovation Lab 3, Academic Block II',
    meetingSchedule: 'Every Wednesday & Saturday, 4:30 PM - 6:30 PM',
    facultyCoordinator: 'Dr. Amrit Ranjan Mohanty',
    facultyCoordinatorEmail: 'amrit.mohanty@silicon.ac.in',
    facultyCoordinatorPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    facultyDept: 'Associate Professor, Dept. of Computer Science & Engineering',
    secretary: 'Siddharth Patnaik',
    secretaryEmail: 'siddharth.scc@silicon.ac.in',
    secretaryPhone: '+91 98610 23451',
    secretaryBranch: 'B.Tech CSE',
    secretaryYear: '4th Year',
    secretaryPhoto: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
    jointSecretary: 'Ananya Rath',
    jointSecretaryEmail: 'ananya.rath@silicon.ac.in',
    jointSecretaryPhone: '+91 97780 44120',
    jointSecretaryBranch: 'B.Tech CSE',
    jointSecretaryYear: '3rd Year',
    jointSecretaryPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    socialLinks: {
      github: 'https://github.com/siliconwest-scc',
      linkedin: 'https://linkedin.com/company/silicon-coding-club',
      instagram: 'https://instagram.com/scc_silicon',
      discord: 'https://discord.gg/silicon-devs'
    },
    coordinators: [
      // 4th Year Senior Coordinators
      {
        name: 'Aurobindo Tripathy',
        role: 'Senior Technical Advisor & Algorithmic Systems Lead',
        year: '4th Year',
        branch: 'B.Tech CSE (4th Year)',
        email: 'aurobindo.t@silicon.ac.in',
        phone: '+91 98611 11204',
        photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80'
      },
      {
        name: 'Monali Sahoo',
        role: 'Senior Open Source & Cloud Architect',
        year: '4th Year',
        branch: 'B.Tech CSE (4th Year)',
        email: 'monali.s@silicon.ac.in',
        phone: '+91 94370 88219',
        photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80'
      },
      // 3rd Year Coordinators
      {
        name: 'Subham Kumar Jena',
        role: 'Competitive Programming Lead',
        year: '3rd Year',
        branch: 'B.Tech CSE (3rd Year)',
        email: 'subham.jena@silicon.ac.in',
        phone: '+91 98612 00192',
        photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80'
      },
      {
        name: 'Priyanka Mishra',
        role: 'Full-Stack Web & Mobile Dev Lead',
        year: '3rd Year',
        branch: 'B.Tech CSE (3rd Year)',
        email: 'priyanka.m@silicon.ac.in',
        phone: '+91 97782 11984',
        photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
      },
      {
        name: 'Rohan Mohapatra',
        role: 'Hackathons & Contests Lead',
        year: '3rd Year',
        branch: 'B.Tech ECE (3rd Year)',
        email: 'rohan.m@silicon.ac.in',
        phone: '+91 94371 45091',
        photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80'
      },
      // 2nd Year Coordinators
      {
        name: 'Ishita Roy',
        role: 'Community Outreach & PR Coordinator',
        year: '2nd Year',
        branch: 'B.Tech CSE (2nd Year)',
        email: 'ishita.roy@silicon.ac.in',
        phone: '+91 91240 66723',
        photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80'
      },
      {
        name: 'Tanmay K. Das',
        role: 'DevOps & Git Bootcamp Associate',
        year: '2nd Year',
        branch: 'B.Tech CSE (2nd Year)',
        email: 'tanmay.das@silicon.ac.in',
        phone: '+91 98533 44019',
        photoUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&auto=format&fit=crop&q=80'
      }
    ]
  },
  'robosilicon': {
    bannerUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1600&auto=format&fit=crop&q=80',
    logoUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&auto=format&fit=crop&q=80',
    establishedYear: 2017,
    roomOrVenue: 'Advanced Mechatronics & Embedded IoT Lab, Ground Floor',
    meetingSchedule: 'Every Tuesday & Friday, 4:00 PM - 6:00 PM',
    facultyCoordinator: 'Prof. Soumya Ranjan Samal',
    facultyCoordinatorEmail: 'soumya.samal@silicon.ac.in',
    facultyCoordinatorPhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
    facultyDept: 'Assistant Professor, Dept. of Electronics & Communication',
    secretary: 'Abhishek Tripathy',
    secretaryEmail: 'abhishek.robo@silicon.ac.in',
    secretaryPhone: '+91 94371 88203',
    secretaryBranch: 'B.Tech ECE',
    secretaryYear: '4th Year',
    secretaryPhoto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80',
    jointSecretary: 'Tanmay Panda',
    jointSecretaryEmail: 'tanmay.p@silicon.ac.in',
    jointSecretaryPhone: '+91 91240 55678',
    jointSecretaryBranch: 'B.Tech EEE',
    jointSecretaryYear: '3rd Year',
    jointSecretaryPhoto: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80',
    socialLinks: {
      linkedin: 'https://linkedin.com/company/robosilicon',
      instagram: 'https://instagram.com/robosilicon_official',
      youtube: 'https://youtube.com/@robosilicon'
    },
    coordinators: [
      // 4th Year Senior Coordinators
      {
        name: 'Debasis Panigrahi',
        role: 'Combat Robotics & Aerodynamics Advisor',
        year: '4th Year',
        branch: 'B.Tech ME (4th Year)',
        email: 'debasis.p@silicon.ac.in',
        phone: '+91 94370 12093',
        photoUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&auto=format&fit=crop&q=80'
      },
      // 3rd Year Coordinators
      {
        name: 'Aditya Narayanan',
        role: 'Drone Tech & Autonomous Systems Lead',
        year: '3rd Year',
        branch: 'B.Tech ECE (3rd Year)',
        email: 'aditya.n@silicon.ac.in',
        phone: '+91 98613 44512',
        photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80'
      },
      {
        name: 'Deepak Mohanty',
        role: 'Embedded Hardware & PCB Design Lead',
        year: '3rd Year',
        branch: 'B.Tech EEE (3rd Year)',
        email: 'deepak.m@silicon.ac.in',
        phone: '+91 94380 77123',
        photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80'
      },
      // 2nd Year Coordinators
      {
        name: 'Swati Swagatika',
        role: 'RoboWars Logistics & Safety Coordinator',
        year: '2nd Year',
        branch: 'B.Tech ME (2nd Year)',
        email: 'swati.s@silicon.ac.in',
        phone: '+91 96582 33410',
        photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
      },
      {
        name: 'Satyajit Behera',
        role: 'Sensor Networks & Microcontrollers Lead',
        year: '2nd Year',
        branch: 'B.Tech ECE (2nd Year)',
        email: 'satyajit.b@silicon.ac.in',
        phone: '+91 98617 88921',
        photoUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&auto=format&fit=crop&q=80'
      }
    ]
  },
  'resonance-cultural-club': {
    bannerUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1600&auto=format&fit=crop&q=80',
    logoUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
    establishedYear: 2016,
    roomOrVenue: 'Student Activity Center (SAC) & Open Air Amphitheatre',
    meetingSchedule: 'Every Monday, Thursday & Saturday, 5:00 PM - 7:00 PM',
    facultyCoordinator: 'Dr. Minati Behera',
    facultyCoordinatorEmail: 'minati.behera@silicon.ac.in',
    facultyCoordinatorPhoto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    facultyDept: 'Dean of Student Welfare & Cultural Affairs',
    secretary: 'Rituparna Sengupta',
    secretaryEmail: 'rituparna.s@silicon.ac.in',
    secretaryPhone: '+91 98532 10984',
    secretaryBranch: 'B.Tech CSE',
    secretaryYear: '4th Year',
    secretaryPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    jointSecretary: 'Ayush Dash',
    jointSecretaryEmail: 'ayush.dash@silicon.ac.in',
    jointSecretaryPhone: '+91 90901 23456',
    jointSecretaryBranch: 'B.Tech ME',
    jointSecretaryYear: '3rd Year',
    jointSecretaryPhoto: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
    socialLinks: {
      instagram: 'https://instagram.com/resonance_silicon',
      youtube: 'https://youtube.com/@resonance_cultural'
    },
    coordinators: [
      // 4th Year Senior Coordinators
      {
        name: 'Soumyajit Rath',
        role: 'Annual Fest "Zygon" Cultural Convenor',
        year: '4th Year',
        branch: 'B.Tech EE (4th Year)',
        email: 'soumyajit.r@silicon.ac.in',
        phone: '+91 98610 55120',
        photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80'
      },
      // 3rd Year Coordinators
      {
        name: 'Sohini Roy',
        role: 'Vocal & Music Band Coordinator',
        year: '3rd Year',
        branch: 'B.Tech CSE (3rd Year)',
        email: 'sohini.roy@silicon.ac.in',
        phone: '+91 98615 77890',
        photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80'
      },
      {
        name: 'Kunal Nayak',
        role: 'Choreography & Dance Crew Head',
        year: '3rd Year',
        branch: 'B.Tech ECE (3rd Year)',
        email: 'kunal.nayak@silicon.ac.in',
        phone: '+91 94391 22340',
        photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80'
      },
      // 2nd Year Coordinators
      {
        name: 'Debasish Barik',
        role: 'Dramatics & Street Play (Nukkad) Lead',
        year: '2nd Year',
        branch: 'B.Tech ME (2nd Year)',
        email: 'debasish.b@silicon.ac.in',
        phone: '+91 97785 66712',
        photoUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&auto=format&fit=crop&q=80'
      },
      {
        name: 'Payal Agarwal',
        role: 'Stage Production & Emcee Coordinator',
        year: '2nd Year',
        branch: 'B.Tech CSE (2nd Year)',
        email: 'payal.a@silicon.ac.in',
        phone: '+91 90908 11234',
        photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80'
      }
    ]
  },
  'spartans-sports': {
    bannerUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1600&auto=format&fit=crop&q=80',
    logoUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&auto=format&fit=crop&q=80',
    establishedYear: 2015,
    roomOrVenue: 'Sports Complex, Cricket Ground & Badminton Arena',
    meetingSchedule: 'Daily: 6:00 AM - 7:30 AM & 5:00 PM - 6:30 PM',
    facultyCoordinator: 'Prof. Rajesh Kumar Pradhan',
    facultyCoordinatorEmail: 'rajesh.pradhan@silicon.ac.in',
    facultyCoordinatorPhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
    facultyDept: 'Director of Physical Education & Sports',
    secretary: 'Vikramjit Singh',
    secretaryEmail: 'vikram.sports@silicon.ac.in',
    secretaryPhone: '+91 94390 12874',
    secretaryBranch: 'B.Tech Civil',
    secretaryYear: '4th Year',
    secretaryPhoto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80',
    jointSecretary: 'Smruti Rekha Das',
    jointSecretaryEmail: 'smruti.das@silicon.ac.in',
    jointSecretaryPhone: '+91 96580 43210',
    jointSecretaryBranch: 'B.Tech CSE',
    jointSecretaryYear: '3rd Year',
    jointSecretaryPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    socialLinks: {
      instagram: 'https://instagram.com/spartans_silicon',
      facebook: 'https://facebook.com/spartans.silicon'
    },
    coordinators: [
      // 4th Year Senior Coordinators
      {
        name: 'Manoj Kumar Panda',
        role: 'Inter-College Tournament General Convenor',
        year: '4th Year',
        branch: 'B.Tech ME (4th Year)',
        email: 'manoj.p@silicon.ac.in',
        phone: '+91 94371 66201',
        photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80'
      },
      // 3rd Year Coordinators
      {
        name: 'Rahul Verma',
        role: 'Cricket & Football Tournament Lead',
        year: '3rd Year',
        branch: 'B.Tech ME (3rd Year)',
        email: 'rahul.verma@silicon.ac.in',
        phone: '+91 98618 33451',
        photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80'
      },
      {
        name: 'Pooja Sahoo',
        role: 'Badminton & Volleyball Lead',
        year: '3rd Year',
        branch: 'B.Tech ECE (3rd Year)',
        email: 'pooja.sahoo@silicon.ac.in',
        phone: '+91 94372 99014',
        photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
      },
      // 2nd Year Coordinators
      {
        name: 'Manish Pattnaik',
        role: 'Table Tennis & Chess Coordinator',
        year: '2nd Year',
        branch: 'B.Tech CSE (2nd Year)',
        email: 'manish.p@silicon.ac.in',
        phone: '+91 91244 55891',
        photoUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&auto=format&fit=crop&q=80'
      },
      {
        name: 'Anjali Moharana',
        role: 'Athletics & Fitness Track Lead',
        year: '2nd Year',
        branch: 'B.Tech EE (2nd Year)',
        email: 'anjali.m@silicon.ac.in',
        phone: '+91 98539 00124',
        photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80'
      }
    ]
  },
  'ieee-silicon-west': {
    bannerUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1600&auto=format&fit=crop&q=80',
    logoUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400&auto=format&fit=crop&q=80',
    establishedYear: null,
    roomOrVenue: 'IEEE Student Research Center, Central Library Level 2',
    meetingSchedule: 'Every Alternate Thursday & Sunday, 11:00 AM - 1:00 PM',
    facultyCoordinator: 'Dr. Debabrata Singh',
    facultyCoordinatorEmail: 'debabrata.singh@silicon.ac.in',
    facultyCoordinatorPhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
    facultyDept: 'Senior Member IEEE, Professor, Dept. of CSE',
    secretary: 'Shreya Suman Panda',
    secretaryEmail: 'shreya.ieee@silicon.ac.in',
    secretaryPhone: '+91 94380 99120',
    secretaryBranch: 'B.Tech ECE',
    secretaryYear: '4th Year',
    secretaryPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    jointSecretary: 'Rajat Ray',
    jointSecretaryEmail: 'rajat.ray@silicon.ac.in',
    jointSecretaryPhone: '+91 98611 77234',
    jointSecretaryBranch: 'B.Tech CSE',
    jointSecretaryYear: '3rd Year',
    jointSecretaryPhoto: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
    socialLinks: {
      linkedin: 'https://linkedin.com/company/ieee-silicon-west',
      instagram: 'https://instagram.com/ieee_siliconwest'
    },
    coordinators: [
      // 4th Year Senior Coordinators
      {
        name: 'Bibhudatta Rout',
        role: 'IEEE Conference & Publications Lead',
        year: '4th Year',
        branch: 'B.Tech CSE (4th Year)',
        email: 'bibhu.rout@silicon.ac.in',
        phone: '+91 94371 99201',
        photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80'
      },
      // 3rd Year Coordinators
      {
        name: 'Alok Kumar Sahu',
        role: 'Research Papers & Technical Bootcamps Lead',
        year: '3rd Year',
        branch: 'B.Tech CSE (3rd Year)',
        email: 'alok.sahu@silicon.ac.in',
        phone: '+91 98614 22345',
        photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80'
      },
      {
        name: 'Sneha Parida',
        role: 'Women in Engineering (WIE) Coordinator',
        year: '3rd Year',
        branch: 'B.Tech ECE (3rd Year)',
        email: 'sneha.p@silicon.ac.in',
        phone: '+91 97781 55670',
        photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80'
      },
      // 2nd Year Coordinators
      {
        name: 'Gaurav Mohanty',
        role: 'Industry Relations & Tech Symposium Lead',
        year: '2nd Year',
        branch: 'B.Tech EE (2nd Year)',
        email: 'gaurav.m@silicon.ac.in',
        phone: '+91 94377 88912',
        photoUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&auto=format&fit=crop&q=80'
      },
      {
        name: 'Kavita Das',
        role: 'IEEE Student Member Liaison',
        year: '2nd Year',
        branch: 'B.Tech CSE (2nd Year)',
        email: 'kavita.das@silicon.ac.in',
        phone: '+91 98610 33418',
        photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80'
      }
    ]
  },
  'pixels-media-society': {
    bannerUrl: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=1600&auto=format&fit=crop&q=80',
    logoUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&auto=format&fit=crop&q=80',
    establishedYear: 2019,
    roomOrVenue: 'Media Production & Visual Studio, Studio Block B',
    meetingSchedule: 'Every Friday, 4:30 PM - 6:30 PM & During University Events',
    facultyCoordinator: 'Prof. Archana Sahoo',
    facultyCoordinatorEmail: 'archana.sahoo@silicon.ac.in',
    facultyCoordinatorPhoto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    facultyDept: 'Faculty Advisor, Dept. of Basic Sciences & Media Cell',
    secretary: 'Omm Prakash Mohanty',
    secretaryEmail: 'omm.pixels@silicon.ac.in',
    secretaryPhone: '+91 97760 11234',
    secretaryBranch: 'B.Tech CSE',
    secretaryYear: '4th Year',
    secretaryPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    jointSecretary: 'Lipsa Priyadarshini',
    jointSecretaryEmail: 'lipsa.p@silicon.ac.in',
    jointSecretaryPhone: '+91 91780 88901',
    jointSecretaryBranch: 'B.Tech ECE',
    jointSecretaryYear: '3rd Year',
    jointSecretaryPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    socialLinks: {
      instagram: 'https://instagram.com/pixels_silicon',
      youtube: 'https://youtube.com/@pixels_media_silicon'
    },
    coordinators: [
      // 4th Year Senior Coordinators
      {
        name: 'Chinmayee Mishra',
        role: 'Chief Editor & Documentary Production Head',
        year: '4th Year',
        branch: 'B.Tech CSE (4th Year)',
        email: 'chinmayee.m@silicon.ac.in',
        phone: '+91 98612 44310',
        photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80'
      },
      // 3rd Year Coordinators
      {
        name: 'Subhajit Roy',
        role: 'Photography & Live Events Lead',
        year: '3rd Year',
        branch: 'B.Tech CSE (3rd Year)',
        email: 'subhajit.r@silicon.ac.in',
        phone: '+91 98619 88123',
        photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80'
      },
      {
        name: 'Aditi Senapati',
        role: 'Cinematography & Aftermovie Director',
        year: '3rd Year',
        branch: 'B.Tech ECE (3rd Year)',
        email: 'aditi.s@silicon.ac.in',
        phone: '+91 94393 44567',
        photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80'
      },
      // 2nd Year Coordinators
      {
        name: 'Pratik Dash',
        role: 'Digital Design & Visual Identity Coordinator',
        year: '2nd Year',
        branch: 'B.Tech CSE (2nd Year)',
        email: 'pratik.dash@silicon.ac.in',
        phone: '+91 91249 77801',
        photoUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&auto=format&fit=crop&q=80'
      },
      {
        name: 'Nisha Pattanaik',
        role: 'Campus Social Media & Stories Lead',
        year: '2nd Year',
        branch: 'B.Tech ECE (2nd Year)',
        email: 'nisha.p@silicon.ac.in',
        phone: '+91 97782 55091',
        photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80'
      }
    ]
  }
};

function enrichClub(club) {
  const defaults = CLUB_ENRICHMENT_MAP[club.slug] || {
    bannerUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1600&auto=format&fit=crop&q=80',
    logoUrl: club.logoUrl || 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=400&auto=format&fit=crop&q=80',
    establishedYear: 2020,
    roomOrVenue: 'Silicon University Central Campus, Bhubaneswar',
    meetingSchedule: 'Every Friday, 4:30 PM - 6:00 PM',
    facultyCoordinator: 'Dr. Faculty Advisor',
    facultyCoordinatorEmail: 'faculty@silicon.ac.in',
    facultyCoordinatorPhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
    facultyDept: 'Faculty Advisor & Mentor, Silicon University',
    secretary: 'Student Secretary',
    secretaryEmail: club.contactEmail || 'secretary@silicon.ac.in',
    secretaryPhone: '+91 98610 00000',
    secretaryBranch: 'B.Tech CSE',
    secretaryYear: '4th Year',
    secretaryPhoto: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
    jointSecretary: 'Student Joint Secretary',
    jointSecretaryEmail: 'joint.secretary@silicon.ac.in',
    jointSecretaryPhone: '+91 97780 00000',
    jointSecretaryBranch: 'B.Tech CSE',
    jointSecretaryYear: '3rd Year',
    jointSecretaryPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    socialLinks: {
      instagram: 'https://instagram.com/siliconuniversity',
      linkedin: 'https://linkedin.com/school/silicon-university'
    },
    coordinators: [
      {
        name: 'Senior Lead Coordinator',
        role: 'Technical & Event Operations Lead',
        year: '4th Year',
        branch: 'B.Tech 4th Year',
        email: 'senior.coordinator@silicon.ac.in',
        phone: '+91 94370 00001',
        photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80'
      },
      {
        name: 'Lead Coordinator',
        role: 'Projects & Workshop Lead',
        year: '3rd Year',
        branch: 'B.Tech 3rd Year',
        email: 'coordinator@silicon.ac.in',
        phone: '+91 94370 00000',
        photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80'
      },
      {
        name: 'Public Relations Lead',
        role: 'Creative & Outreach Coordinator',
        year: '2nd Year',
        branch: 'B.Tech 2nd Year',
        email: 'pr@silicon.ac.in',
        phone: '+91 91240 00000',
        photoUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&auto=format&fit=crop&q=80'
      }
    ]
  };

  const isIeee = club.slug === 'ieee-silicon-west';

  return {
    ...club,
    bannerUrl: club.bannerUrl || defaults.bannerUrl,
    logoUrl: club.logoUrl || defaults.logoUrl,
    contactPhone: club.contactPhone || defaults.secretaryPhone,
    establishedYear: isIeee ? null : (club.establishedYear || defaults.establishedYear),
    roomOrVenue: club.roomOrVenue || defaults.roomOrVenue,
    meetingSchedule: club.meetingSchedule || defaults.meetingSchedule,
    facultyCoordinator: club.facultyCoordinator || defaults.facultyCoordinator,
    facultyCoordinatorEmail: club.facultyCoordinatorEmail || defaults.facultyCoordinatorEmail,
    facultyCoordinatorPhoto: club.facultyCoordinatorPhoto || defaults.facultyCoordinatorPhoto,
    facultyDept: club.facultyDept || defaults.facultyDept,
    secretary: club.secretary || defaults.secretary,
    secretaryEmail: club.secretaryEmail || defaults.secretaryEmail,
    secretaryPhone: club.secretaryPhone || defaults.secretaryPhone,
    secretaryBranch: club.secretaryBranch || defaults.secretaryBranch,
    secretaryYear: club.secretaryYear || defaults.secretaryYear,
    secretaryPhoto: club.secretaryPhoto || defaults.secretaryPhoto,
    jointSecretary: club.jointSecretary || defaults.jointSecretary,
    jointSecretaryEmail: club.jointSecretaryEmail || defaults.jointSecretaryEmail,
    jointSecretaryPhone: club.jointSecretaryPhone || defaults.jointSecretaryPhone,
    jointSecretaryBranch: club.jointSecretaryBranch || defaults.jointSecretaryBranch,
    jointSecretaryYear: club.jointSecretaryYear || defaults.jointSecretaryYear,
    jointSecretaryPhoto: club.jointSecretaryPhoto || defaults.jointSecretaryPhoto,
    coordinators: club.coordinators && Array.isArray(club.coordinators) && club.coordinators.length > 0 ? club.coordinators : defaults.coordinators,
    socialLinks: isIeee
      ? { linkedin: 'https://linkedin.com/company/ieee-silicon-west', instagram: 'https://instagram.com/ieee_siliconwest' }
      : (club.socialLinks || defaults.socialLinks),
  };
}

// GET /api/clubs - List clubs (public)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { search, category, includeArchived } = req.query;
    
    // Only super admins can see archived clubs
    const canSeeArchived = req.user?.role === 'SUPER_ADMIN' && includeArchived === 'true';

    const where = {
      ...(canSeeArchived ? {} : { isArchived: false }),
      ...(!req.user || req.user.role === 'STUDENT' ? { isPublic: true } : {}),
      ...(category ? { category: { equals: category, mode: 'insensitive' } } : {}),
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { shortDescription: { contains: search, mode: 'insensitive' } },
          { category: { contains: search, mode: 'insensitive' } },
        ]
      } : {})
    };

    const clubs = await prisma.club.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            events: {
              where: {
                status: 'PUBLISHED',
                startsAt: { gte: new Date() }
              }
            }
          }
        },
        assignments: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });

    // Return sanitized club items with enriched leadership details
    const sanitized = clubs.map(rawClub => {
      const club = enrichClub(rawClub);
      return {
        id: club.id,
        name: club.name,
        slug: club.slug,
        shortDescription: club.shortDescription,
        description: club.description,
        logoUrl: club.logoUrl,
        bannerUrl: club.bannerUrl,
        category: club.category,
        contactEmail: club.contactEmail,
        isPublic: club.isPublic,
        isArchived: club.isArchived,
        establishedYear: club.establishedYear,
        roomOrVenue: club.roomOrVenue,
        meetingSchedule: club.meetingSchedule,
        facultyCoordinator: club.facultyCoordinator,
        facultyCoordinatorEmail: club.facultyCoordinatorEmail,
        facultyCoordinatorPhoto: club.facultyCoordinatorPhoto,
        facultyDept: club.facultyDept,
        secretary: club.secretary,
        secretaryEmail: club.secretaryEmail,
        secretaryPhone: club.secretaryPhone,
        secretaryBranch: club.secretaryBranch,
        secretaryYear: club.secretaryYear,
        secretaryPhoto: club.secretaryPhoto,
        jointSecretary: club.jointSecretary,
        jointSecretaryEmail: club.jointSecretaryEmail,
        jointSecretaryPhone: club.jointSecretaryPhone,
        jointSecretaryBranch: club.jointSecretaryBranch,
        jointSecretaryYear: club.jointSecretaryYear,
        jointSecretaryPhoto: club.jointSecretaryPhoto,
        coordinators: club.coordinators,
        socialLinks: club.socialLinks,
        upcomingEventsCount: rawClub._count.events,
        admins: req.user?.role === 'SUPER_ADMIN' ? rawClub.assignments.map(a => a.user) : undefined,
      };
    });

    res.json(sanitized);
  } catch (err) {
    console.error('List clubs error:', err);
    res.status(500).json({ error: 'Failed to fetch clubs.' });
  }
});

// GET /api/clubs/:slug - Get single club details by slug (public)
router.get('/:slug', optionalAuth, async (req, res) => {
  try {
    const { slug } = req.params;
    const includeQuery = {
      events: {
        where: {
          status: 'PUBLISHED',
        },
        orderBy: { startsAt: 'asc' },
        select: {
          id: true,
          title: true,
          slug: true,
          summary: true,
          bannerUrl: true,
          category: true,
          venue: true,
          startsAt: true,
          endsAt: true,
          registrationDeadline: true,
          capacity: true,
          status: true,
          _count: {
            select: {
              registrations: {
                where: { status: 'CONFIRMED' }
              }
            }
          }
        }
      },
      assignments: {
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      }
    };

    let rawClub = await prisma.club.findUnique({
      where: { slug },
      include: includeQuery,
    });

    if (!rawClub) {
      // Fallback: check if param is a club UUID id
      rawClub = await prisma.club.findUnique({
        where: { id: slug },
        include: includeQuery,
      });
    }

    if (!rawClub) {
      return res.status(404).json({ error: 'Club not found.' });
    }

    if (rawClub.isArchived && req.user?.role !== 'SUPER_ADMIN') {
      return res.status(404).json({ error: 'Club has been archived.' });
    }

    const club = enrichClub(rawClub);
    const now = new Date();
    const upcomingEvents = rawClub.events.filter(e => new Date(e.endsAt) >= now);
    const pastEvents = rawClub.events.filter(e => new Date(e.endsAt) < now);

    res.json({
      id: club.id,
      name: club.name,
      slug: club.slug,
      shortDescription: club.shortDescription,
      description: club.description,
      logoUrl: club.logoUrl,
      bannerUrl: club.bannerUrl,
      category: club.category,
      contactEmail: club.contactEmail,
      contactPhone: club.contactPhone,
      isPublic: club.isPublic,
      isArchived: club.isArchived,
      establishedYear: club.establishedYear,
      roomOrVenue: club.roomOrVenue,
      meetingSchedule: club.meetingSchedule,
      facultyCoordinator: club.facultyCoordinator,
      facultyCoordinatorEmail: club.facultyCoordinatorEmail,
      facultyCoordinatorPhoto: club.facultyCoordinatorPhoto,
      facultyDept: club.facultyDept,
      secretary: club.secretary,
      secretaryEmail: club.secretaryEmail,
      secretaryPhone: club.secretaryPhone,
      secretaryBranch: club.secretaryBranch,
      secretaryYear: club.secretaryYear,
      secretaryPhoto: club.secretaryPhoto,
      jointSecretary: club.jointSecretary,
      jointSecretaryEmail: club.jointSecretaryEmail,
      jointSecretaryPhone: club.jointSecretaryPhone,
      jointSecretaryBranch: club.jointSecretaryBranch,
      jointSecretaryYear: club.jointSecretaryYear,
      jointSecretaryPhoto: club.jointSecretaryPhoto,
      coordinators: club.coordinators,
      socialLinks: club.socialLinks,
      upcomingEvents,
      pastEvents,
      admins: (req.user?.role === 'SUPER_ADMIN' || canUserManageClub(req.user, club.id))
        ? rawClub.assignments.map(a => a.user)
        : undefined,
    });
  } catch (err) {
    console.error('Get club error:', err);
    res.status(500).json({ error: 'Failed to fetch club details.' });
  }
});

// POST /api/clubs/:slug/apply - Submit student membership application
router.post('/:slug/apply', async (req, res) => {
  try {
    const { slug } = req.params;
    const { fullName, email, rollNumber, branch, year, domain, reason } = req.body;

    if (!fullName || !email || !rollNumber) {
      return res.status(400).json({ error: 'Full name, email, and university roll number are required.' });
    }

    const club = await prisma.club.findUnique({ where: { slug } });
    if (!club) {
      return res.status(404).json({ error: 'Club not found.' });
    }

    const application = await prisma.clubMembershipApplication.create({
      data: {
        clubId: club.id,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        rollNumber: rollNumber.trim().toUpperCase(),
        branch: branch || null,
        year: year || null,
        domain: domain || null,
        reason: reason ? reason.trim() : null,
      }
    });

    res.status(201).json({
      success: true,
      message: 'Your membership application has been submitted to the Club Secretary and Executive Council!',
      applicationId: application.id,
    });
  } catch (err) {
    console.error('Membership application error:', err);
    res.status(500).json({ error: 'Failed to submit membership application.' });
  }
});

// POST /api/clubs - Create club (Super Admin or Club Admin)
router.post('/', authenticate, async (req, res) => {
  if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'CLUB_ADMIN') {
    return res.status(403).json({ error: 'Permission denied. Only Administrators can create clubs.' });
  }
  try {
    const data = clubCreateSchema.parse(req.body);

    const existingSlug = await prisma.club.findUnique({
      where: { slug: data.slug }
    });

    if (existingSlug) {
      return res.status(409).json({ error: 'A club with this slug already exists.' });
    }

    const club = await prisma.club.create({
      data: {
        name: data.name,
        slug: data.slug,
        shortDescription: data.shortDescription || null,
        description: data.description,
        logoUrl: data.logoUrl || null,
        bannerUrl: data.bannerUrl || null,
        category: data.category || 'General',
        contactEmail: data.contactEmail || null,
        contactPhone: data.contactPhone || null,
        isPublic: data.isPublic ?? true,
        establishedYear: data.establishedYear || 2024,
        roomOrVenue: data.roomOrVenue || null,
        meetingSchedule: data.meetingSchedule || null,
        facultyCoordinator: data.facultyCoordinator || null,
        facultyCoordinatorEmail: data.facultyCoordinatorEmail || null,
        facultyCoordinatorPhone: data.facultyCoordinatorPhone || null,
        facultyCoordinatorPhoto: data.facultyCoordinatorPhoto || null,
        facultyDept: data.facultyDept || null,
        secretary: data.secretary || null,
        secretaryEmail: data.secretaryEmail || null,
        secretaryPhone: data.secretaryPhone || null,
        secretaryBranch: data.secretaryBranch || null,
        secretaryYear: data.secretaryYear || null,
        secretaryPhoto: data.secretaryPhoto || null,
        jointSecretary: data.jointSecretary || null,
        jointSecretaryEmail: data.jointSecretaryEmail || null,
        jointSecretaryPhone: data.jointSecretaryPhone || null,
        jointSecretaryBranch: data.jointSecretaryBranch || null,
        jointSecretaryYear: data.jointSecretaryYear || null,
        jointSecretaryPhoto: data.jointSecretaryPhoto || null,
        coordinators: data.coordinators || [],
        socialLinks: data.socialLinks || {},
        ...(req.user.role === 'CLUB_ADMIN' ? {
          assignments: {
            create: {
              userId: req.user.id,
              assignedByUserId: req.user.id,
            }
          }
        } : {})
      }
    });

    res.status(201).json(club);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('Create club error:', err);
    res.status(500).json({ error: 'Failed to create club.' });
  }
});

// PUT /api/clubs/:id - Update club (Super Admin or Assigned Club Admin)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check permission
    if (!canUserManageClub(req.user, id)) {
      return res.status(403).json({ error: 'Forbidden: You cannot manage this club.' });
    }

    const data = clubUpdateSchema.parse(req.body);

    const club = await prisma.club.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.shortDescription !== undefined && { shortDescription: data.shortDescription }),
        ...(data.description && { description: data.description }),
        ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl }),
        ...(data.bannerUrl !== undefined && { bannerUrl: data.bannerUrl }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.contactEmail !== undefined && { contactEmail: data.contactEmail }),
        ...(data.contactPhone !== undefined && { contactPhone: data.contactPhone }),
        ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
        ...(data.establishedYear !== undefined && { establishedYear: data.establishedYear }),
        ...(data.roomOrVenue !== undefined && { roomOrVenue: data.roomOrVenue }),
        ...(data.meetingSchedule !== undefined && { meetingSchedule: data.meetingSchedule }),
        ...(data.facultyCoordinator !== undefined && { facultyCoordinator: data.facultyCoordinator }),
        ...(data.facultyCoordinatorEmail !== undefined && { facultyCoordinatorEmail: data.facultyCoordinatorEmail }),
        ...(data.facultyCoordinatorPhone !== undefined && { facultyCoordinatorPhone: data.facultyCoordinatorPhone }),
        ...(data.facultyCoordinatorPhoto !== undefined && { facultyCoordinatorPhoto: data.facultyCoordinatorPhoto }),
        ...(data.facultyDept !== undefined && { facultyDept: data.facultyDept }),
        ...(data.secretary !== undefined && { secretary: data.secretary }),
        ...(data.secretaryEmail !== undefined && { secretaryEmail: data.secretaryEmail }),
        ...(data.secretaryPhone !== undefined && { secretaryPhone: data.secretaryPhone }),
        ...(data.secretaryBranch !== undefined && { secretaryBranch: data.secretaryBranch }),
        ...(data.secretaryYear !== undefined && { secretaryYear: data.secretaryYear }),
        ...(data.secretaryPhoto !== undefined && { secretaryPhoto: data.secretaryPhoto }),
        ...(data.jointSecretary !== undefined && { jointSecretary: data.jointSecretary }),
        ...(data.jointSecretaryEmail !== undefined && { jointSecretaryEmail: data.jointSecretaryEmail }),
        ...(data.jointSecretaryPhone !== undefined && { jointSecretaryPhone: data.jointSecretaryPhone }),
        ...(data.jointSecretaryBranch !== undefined && { jointSecretaryBranch: data.jointSecretaryBranch }),
        ...(data.jointSecretaryYear !== undefined && { jointSecretaryYear: data.jointSecretaryYear }),
        ...(data.jointSecretaryPhoto !== undefined && { jointSecretaryPhoto: data.jointSecretaryPhoto }),
        ...(data.coordinators !== undefined && { coordinators: data.coordinators }),
        ...(data.socialLinks !== undefined && { socialLinks: data.socialLinks }),
      }
    });

    res.json(club);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('Update club error:', err);
    res.status(500).json({ error: 'Failed to update club.' });
  }
});

// DELETE /api/clubs/:id - Archive or permanently delete club (Super Admin only)
router.delete('/:id', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent } = req.query;

    const targetClub = await prisma.club.findFirst({
      where: {
        OR: [{ id }, { slug: id }]
      }
    });

    if (!targetClub) {
      return res.status(404).json({ error: 'Club not found.' });
    }

    if (permanent === 'true') {
      await prisma.club.delete({
        where: { id: targetClub.id }
      });
      return res.json({ message: 'Club permanently deleted successfully.', deletedClub: targetClub });
    }

    const club = await prisma.club.update({
      where: { id: targetClub.id },
      data: { isArchived: true }
    });

    res.json({ message: 'Club archived successfully.', club });
  } catch (err) {
    console.error('Delete club error:', err);
    res.status(500).json({ error: 'Failed to delete club.' });
  }
});

// POST /api/clubs/:id/restore - Restore archived club (Super Admin only)
router.post('/:id/restore', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const club = await prisma.club.update({
      where: { id },
      data: { isArchived: false }
    });

    res.json({ message: 'Club restored successfully.', club });
  } catch (err) {
    console.error('Restore club error:', err);
    res.status(500).json({ error: 'Failed to restore club.' });
  }
});

module.exports = router;
