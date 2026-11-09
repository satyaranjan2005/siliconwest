'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Compass,
  MapPin,
  Users,
  Sparkles,
  ArrowRight,
  Search,
  CheckCircle2,
  Clock,
  Award,
  Trophy,
  ChevronRight,
  Shield,
  Layers,
  Cpu,
  Palette,
  Camera,
  Code2,
  Building2,
  HelpCircle,
  GraduationCap,
  Star,
  BookOpen,
  X,
} from 'lucide-react';
import { eventsApi, clubsApi } from '@/lib/api';

const CLUB_CATEGORIES = [
  { id: 'ALL', label: 'All Societies', icon: Layers },
  { id: 'Technical', label: 'Technical', icon: Code2 },
  { id: 'Cultural', label: 'Cultural', icon: Palette },
  { id: 'Sports', label: 'Sports', icon: Trophy },
  { id: 'Media & Arts', label: 'Media & Arts', icon: Camera },
];

function getCategoryStyle(cat) {
  const lower = (cat || '').toLowerCase();
  if (lower.includes('tech') || lower.includes('code') || lower.includes('robot')) {
    return {
      badge: 'bg-blue-50 text-blue-700 border-blue-200',
      dot: 'bg-blue-600',
    };
  }
  if (lower.includes('cultur') || lower.includes('music') || lower.includes('dance')) {
    return {
      badge: 'bg-purple-50 text-purple-700 border-purple-200',
      dot: 'bg-purple-600',
    };
  }
  if (lower.includes('sport') || lower.includes('game') || lower.includes('athlet')) {
    return {
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-600',
    };
  }
  if (lower.includes('media') || lower.includes('art') || lower.includes('photo')) {
    return {
      badge: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-600',
    };
  }
  return {
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-600',
  };
}

const FAQS = [
  {
    q: 'Who can register and participate in campus events?',
    a: 'All enrolled undergraduate and postgraduate students (B.Tech, MCA, M.Tech, B.Sc) of Silicon West across all semesters and branches are eligible to participate. A valid college ID card is required at check-in.',
  },
  {
    q: 'How do I join a student club or technical society?',
    a: 'Clubs conduct open recruitments and orientation bootcamps at the start of each semester. You can explore the club directory, reach out to student coordinators, or register through our membership portal.',
  },
  {
    q: 'Are certificates and awards recognized by Silicon University?',
    a: 'Yes. All hackathons, workshops, and inter-branch championships issue official verified certificates of participation and merit signed by faculty advisors and university authorities.',
  },
  {
    q: 'Can I participate individually or do I need a team?',
    a: 'Participation rules vary by event. Many hackathons and robotics contests allow teams of 2 to 4 students, while workshops and athletic tournaments support both individual and squad entries.',
  },
  {
    q: 'How can student coordinators create or manage an event?',
    a: 'Authorized club secretaries and admin leads can log in to the Club Admin dashboard to submit event proposals, manage seat capacities, review registrations, and export attendee rosters.',
  },
];

export default function HomePage() {
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  useEffect(() => {
    async function loadData() {
      try {
        const [eventsData, clubsData] = await Promise.all([
          eventsApi.list({ timeframe: 'upcoming' }),
          clubsApi.list(),
        ]);
        setUpcomingEvents(Array.isArray(eventsData) ? eventsData : []);
        setClubs(Array.isArray(clubsData) ? clubsData : []);
      } catch (err) {
        console.error('Failed to load home data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredClubs = clubs.filter((c) => {
    if (selectedCategory === 'ALL') return true;
    return (c.category || '').toLowerCase().includes(selectedCategory.toLowerCase());
  });

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/events?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#fafbfc] text-slate-900">
      {/* ============================================================== */}
      {/* 1. HERO SECTION                                                */}
      {/* ============================================================== */}
      <section className="relative bg-white border-b border-slate-200 overflow-hidden">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-80 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-16 relative z-10 space-y-10">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            {/* Campus Tag Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[#034694] text-xs font-semibold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#034694] animate-pulse" />
              <span>Official Student Communities &amp; Activities Portal</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.2]">
              Discover, Participate &amp; Lead at{' '}
              <span className="text-[#034694]">Silicon West</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Your centralized gateway to national-level hackathons, robotics bootcamps, annual cultural galas, sports championships, and student-run societies.
            </p>

            {/* Quick Search Input */}
            <div className="pt-2 max-w-xl mx-auto w-full">
              <form
                onSubmit={handleSearchSubmit}
                className="flex items-center bg-white rounded-xl shadow-xs p-1 sm:p-1.5 border border-slate-300 focus-within:border-[#034694] focus-within:ring-2 focus-within:ring-[#034694]/15 transition-all"
              >
                <Search className="w-4 h-4 text-slate-400 ml-2.5 sm:ml-3 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search events, workshops, clubs..."
                  className="w-full px-2.5 sm:px-3 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="p-1 text-slate-400 hover:text-slate-600 mr-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="submit"
                  className="bg-[#034694] hover:bg-[#023168] text-white text-xs font-semibold px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg transition-colors shrink-0"
                >
                  Search
                </button>
              </form>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-3 pt-2">
              <Link
                href="/events"
                className="inline-flex items-center justify-center gap-2 bg-[#034694] hover:bg-[#023168] text-white text-xs sm:text-sm font-semibold px-5 py-2.5 rounded-xl shadow-2xs transition-all text-center"
              >
                <Calendar className="w-4 h-4" />
                <span>Explore Events Timeline</span>
              </Link>

              <Link
                href="/clubs"
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs sm:text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-2xs text-center"
              >
                <Compass className="w-4 h-4 text-[#034694]" />
                <span>Clubs Directory</span>
              </Link>
            </div>
          </div>

          {/* Metric Highlights Strip */}
          <div className="pt-6 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-6 text-center">
            <div className="p-2.5 sm:p-3 bg-slate-50/70 rounded-xl border border-slate-200/60">
              <div className="text-xl sm:text-3xl font-extrabold text-slate-900">
                {clubs.length || 6}+
              </div>
              <div className="text-[10px] sm:text-[11px] font-medium text-slate-500 uppercase tracking-wider mt-0.5">
                Active Student Clubs
              </div>
            </div>

            <div className="p-2.5 sm:p-3 bg-slate-50/70 rounded-xl border border-slate-200/60">
              <div className="text-xl sm:text-3xl font-extrabold text-[#034694]">
                {upcomingEvents.length || 4}
              </div>
              <div className="text-[10px] sm:text-[11px] font-medium text-slate-500 uppercase tracking-wider mt-0.5">
                Upcoming Events
              </div>
            </div>

            <div className="p-2.5 sm:p-3 bg-slate-50/70 rounded-xl border border-slate-200/60">
              <div className="text-xl sm:text-3xl font-extrabold text-slate-900">
                100%
              </div>
              <div className="text-[10px] sm:text-[11px] font-medium text-slate-500 uppercase tracking-wider mt-0.5">
                Faculty Guided
              </div>
            </div>

            <div className="p-2.5 sm:p-3 bg-slate-50/70 rounded-xl border border-slate-200/60">
              <div className="text-xl sm:text-3xl font-extrabold text-slate-900">
                25 Yrs
              </div>
              <div className="text-[10px] sm:text-[11px] font-medium text-slate-500 uppercase tracking-wider mt-0.5">
                Academic Legacy
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 2. UPCOMING & FEATURED EVENTS SHOWCASE                         */}
      {/* ============================================================== */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#034694] uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5" />
              <span>Campus Activities</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1 tracking-tight">
              Featured &amp; Upcoming Events
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Register early for upcoming hackathons, tech bootcamps, and cultural nights.
            </p>
          </div>

          <Link
            href="/events"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#034694] hover:underline self-start sm:self-auto"
          >
            <span>View All Events ({upcomingEvents.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-80 bg-white border border-slate-200 rounded-2xl p-4 space-y-3 animate-pulse">
                <div className="h-44 bg-slate-100 rounded-xl" />
                <div className="h-4 bg-slate-100 rounded w-1/3" />
                <div className="h-5 bg-slate-100 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : upcomingEvents.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8 space-y-2">
            <p className="text-sm font-semibold text-slate-800">No upcoming events scheduled right now.</p>
            <p className="text-xs text-slate-500">Check back soon or explore past campus activity archives.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {upcomingEvents.slice(0, 3).map((event) => {
              const startDate = new Date(event.startsAt);
              const isFull = event.capacity && event.confirmedRegistrationsCount >= event.capacity;
              const catStyle = getCategoryStyle(event.category);

              return (
                <Link
                  key={event.id}
                  href={`/events/${event.slug}`}
                  className="group bg-white rounded-2xl border border-slate-200 hover:border-slate-300 shadow-2xs hover:shadow-xs transition-all duration-200 flex flex-col justify-between overflow-hidden"
                >
                  <div>
                    {/* Banner Image */}
                    <div className="relative aspect-[16/9] w-full bg-slate-100 overflow-hidden">
                      <img
                        src={
                          event.bannerUrl ||
                          'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80'
                        }
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                      />
                      <div className="absolute top-3 left-3">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md shadow-2xs backdrop-blur-xs border ${catStyle.badge}`}
                        >
                          {event.category || 'General'}
                        </span>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-4 sm:p-5 space-y-2">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                        <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{event.club?.name || 'Campus Club'}</span>
                      </div>

                      <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-[#034694] transition-colors line-clamp-2 leading-snug break-words">
                        {event.title}
                      </h3>

                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed break-words">
                        {event.summary || event.description}
                      </p>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="p-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {startDate.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate max-w-[120px]">{event.venue || 'Campus'}</span>
                    </div>

                    {isFull ? (
                      <span className="text-[11px] text-rose-600 font-semibold">Full</span>
                    ) : event.isRegistrationOpen ? (
                      <span className="text-[11px] text-emerald-600 font-semibold">Open</span>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-medium">Closed</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ============================================================== */}
      {/* 3. HOW IT WORKS (STUDENT ENGAGEMENT STEPS)                     */}
      {/* ============================================================== */}
      <section className="bg-white border-y border-slate-200 py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#034694]">
              Seamless Participation
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              How Campus Events Work
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Three simple steps to build your skills, join societies, and earn recognized credentials.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#034694] font-bold text-sm flex items-center justify-center">
                01
              </div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Discover &amp; Choose Tracks
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Browse our timeline of technical bootcamps, cultural nights, robotics challenges, and sports leagues. Filter by domain and timing.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#034694] font-bold text-sm flex items-center justify-center">
                02
              </div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Instant Registration
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Register as an individual or register your hackathon squad. Receive instant confirmation, venue passes, and downloadable brochures.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#034694] font-bold text-sm flex items-center justify-center">
                03
              </div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Compete &amp; Get Certified
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Attend hands-on sessions in specialized makerspaces, compete for cash rewards, and earn verifiable certificates recognized by Silicon West.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 4. CLUBS & STUDENT SOCIETIES DIRECTORY PREVIEW                 */}
      {/* ============================================================== */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#034694] uppercase tracking-wider">
              <Compass className="w-3.5 h-3.5" />
              <span>Campus Communities</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1 tracking-tight">
              Student Clubs &amp; Creative Societies
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Find your community, collaborate on ambitious projects, and develop leadership experience.
            </p>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0 sm:flex-wrap">
            {CLUB_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-[#034694] text-white shadow-2xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredClubs.slice(0, 6).map((club) => {
            const catStyle = getCategoryStyle(club.category);

            return (
              <Link
                key={club.id}
                href={`/clubs/${club.slug}`}
                className="group bg-white rounded-2xl border border-slate-200 hover:border-slate-300 shadow-2xs hover:shadow-xs transition-all duration-200 flex flex-col justify-between overflow-hidden"
              >
                <div>
                  {/* Banner */}
                  <div className="relative h-36 w-full bg-slate-100 overflow-hidden">
                    <img
                      src={
                        club.bannerUrl ||
                        'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&auto=format&fit=crop&q=80'
                      }
                      alt={club.name}
                      className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md shadow-2xs backdrop-blur-xs border ${catStyle.badge}`}
                      >
                        {club.category || 'General'}
                      </span>
                    </div>
                  </div>

                  {/* Logo + Title + Description */}
                  <div className="px-5 pb-5 space-y-3">
                    <div className="-mt-9 relative z-10">
                      <div className="w-16 h-16 rounded-xl bg-white border-2 border-white shadow-sm p-1 overflow-hidden flex items-center justify-center">
                        {club.logoUrl ? (
                          <img
                            src={club.logoUrl}
                            alt={club.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Compass className="w-6 h-6 text-[#034694]" />
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-[#034694] transition-colors leading-snug line-clamp-1">
                        {club.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Official Student Community
                      </p>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {club.shortDescription || club.description}
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-medium text-slate-500">
                    {club.upcomingEventsCount ? `${club.upcomingEventsCount} Upcoming Events` : 'Active Society'}
                  </span>
                  <span className="text-xs font-semibold text-[#034694] flex items-center gap-1 group-hover:underline">
                    <span>Explore</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="text-center pt-2">
          <Link
            href="/clubs"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#034694] hover:underline"
          >
            <span>Browse Full Clubs Directory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 5. CAMPUS MAKERS PACES & FACILITIES                            */}
      {/* ============================================================== */}
      <section className="bg-white border-y border-slate-200 py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#034694]">
              Campus Infrastructure
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Makerspaces &amp; Activity Hubs
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Modern laboratories and spaces supporting high-impact student projects and cultural productions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#034694] flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Advanced Robotics Lab</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Equipped with ROS 2 development kits, LiDAR scanners, drone testing enclosures, and 3D prototyping stations.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Code2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Tech Innovation Arena</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                High-speed Gigabit workstations for non-stop national hackathons, algorithmic contests, and open-source sprints.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                <Palette className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Amphitheatre &amp; SAC</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Open Air Amphitheatre and Student Activity Center acoustically engineered for battle of the bands, drama, and cultural galas.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Trophy className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Athletic Sports Grounds</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Floodlit cricket grounds, outdoor basketball &amp; volleyball courts, and an indoor arena for badminton and table tennis.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 6. FREQUENTLY ASKED QUESTIONS (FAQ)                            */}
      {/* ============================================================== */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#034694] uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Got Questions?</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Everything you need to know about joining clubs, registering for events, and earning certifications.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-semibold text-slate-900 text-sm hover:text-[#034694] transition-colors"
                >
                  <span>{faq.q}</span>
                  <span className="text-slate-400 shrink-0 text-base font-bold">
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-4 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ============================================================== */}
      {/* 7. CALL TO ACTION BANNER                                       */}
      {/* ============================================================== */}
      <section className="bg-white border-t border-slate-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto rounded-2xl bg-slate-900 text-white p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
          <div className="space-y-2 max-w-2xl text-center md:text-left">
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
              Ready to Dive Into Campus Life?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Explore upcoming hackathons, sign up for workshops, or log in to manage your club assignments and registrations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/events"
              className="bg-white hover:bg-slate-100 text-slate-900 text-xs font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-2xs"
            >
              Browse Events
            </Link>
            <Link
              href="/login"
              className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs font-semibold px-5 py-2.5 rounded-xl transition-colors"
            >
              Coordinator Sign In
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
