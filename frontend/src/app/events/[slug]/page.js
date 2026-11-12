'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Shield,
  ArrowLeft,
  ArrowRight,
  Download,
  Share2,
  Paperclip,
  FileText,
  Phone,
  Mail,
  User,
  Check,
  AlertCircle,
  Video,
  CheckCircle2,
  Building2,
  GraduationCap,
  Milestone,
  FileDown,
  Trophy,
  Award,
  ShieldCheck,
  Sparkles,
  CalendarCheck,
  Tag,
  Edit3,
} from 'lucide-react';
import { eventsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import MarkdownView from '@/components/ui/markdown-view';

export default function EventDetailPage() {
  const params = useParams();
  const slug = params?.slug;
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    if (!slug) return;
    async function loadEvent() {
      try {
        const data = await eventsApi.getBySlug(slug);
        setEvent(data);
      } catch (err) {
        setError(err.message || 'Event not found');
      } finally {
        setLoading(false);
      }
    }
    loadEvent();
  }, [slug, user]);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] bg-white flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 text-sm">
          <div className="w-5 h-5 border-2 border-[#034694] border-t-transparent rounded-full animate-spin" />
          <span>Fetching event details...</span>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-[70vh] bg-white flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Event Not Available</h2>
            <p className="text-xs text-slate-500 mt-1">
              This event could not be found or has not been published yet.
            </p>
          </div>
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-xs font-medium text-[#034694] hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to all events
          </Link>
        </div>
      </div>
    );
  }

  // Parse metadata if present
  let cleanDescription = event.description || '';
  let meta = null;
  const metaMatch = event.description?.match(/<!-- EVENT_META:\s*([\s\S]*?)\s*-->/);
  if (metaMatch) {
    try {
      meta = JSON.parse(metaMatch[1]);
      cleanDescription = event.description.replace(/<!-- EVENT_META:\s*[\s\S]*?\s*-->/, '').trim();
    } catch (e) {
      console.warn('Metadata parse error:', e);
    }
  }

  const attachment = event.attachmentUrl ? {
    data: event.attachmentUrl,
    name: event.attachmentName || `${event.slug}-brochure.pdf`,
    size: event.attachmentSize || 'Resource Document',
  } : meta?.attachment || null;

  const contacts = meta?.contacts || [];

  const startDate = new Date(event.startsAt);
  const endDate = new Date(event.endsAt);
  const deadlineDate = new Date(event.registrationDeadline);
  const createdAtDate = event.createdAt ? new Date(event.createdAt) : null;
  const now = new Date();
  const isDeadlinePassed = deadlineDate <= now;
  const isFull = event.capacity && event.confirmedRegistrationsCount >= event.capacity;
  const remainingSeats = event.capacity ? Math.max(0, event.capacity - event.confirmedRegistrationsCount) : null;
  const percentFilled = event.capacity
    ? Math.min(100, Math.round((event.confirmedRegistrationsCount / event.capacity) * 100))
    : 0;

  const club = event.club || {};

  // 1. Eligibility
  const eligibility = event.eligibility || meta?.eligibility || 'Open to all enrolled undergraduate & postgraduate students (B.Tech, MCA, M.Tech) across all departments and academic years of Silicon West. A valid college ID card is mandatory at reporting.';

  // 2. Team Size
  const teamSize = event.teamSize || (event.isTeamEvent ? `${event.minTeamSize || 1} – ${event.maxTeamSize || 4} Members per Team` : null) || meta?.teamSize || (event.category?.toLowerCase() === 'technical' ? '1 – 4 Members per Team (Individual or Team)' : event.category?.toLowerCase() === 'sports' ? 'Team or Individual (as per event rules)' : 'Individual / Duo (1 – 2 Members)');

  // 3. Rules & Guidelines
  const rawRules = event.rules || meta?.rules;
  const rules = Array.isArray(rawRules)
    ? rawRules
    : typeof rawRules === 'string'
    ? rawRules.split('\n').filter(Boolean)
    : [
        'All participants must carry their physical college identity card for verification during check-in.',
        'Participants must bring their personal laptops, chargers, and development kits required for the sessions.',
        'Any form of plagiarism, copying, or unauthorized external assistance will result in immediate disqualification.',
        'Teams must report to the venue at least 15 minutes prior to the scheduled start time.',
        'The decisions of the faculty jury and organizing committee will be final and binding.',
      ];

  // 4. Rewards or Prizes
  const rawRewards = event.rewards || meta?.rewards || meta?.prizes;
  const rewards = Array.isArray(rawRewards) && rawRewards.length > 0
    ? rawRewards
    : event.prizePool
    ? [
        { title: 'Total Prize Pool', reward: event.prizePool, desc: 'Official Cash / Trophy Reward' },
        { title: 'All Participants', reward: 'Official Certificate', desc: 'Certificate of Participation recognized by Silicon West Club' },
      ]
    : [
        { title: '1st Prize (Winner)', reward: 'Cash Award & Trophy', desc: 'Certificate of Excellence + Special Recognition' },
        { title: '2nd Prize (Runner-Up)', reward: 'Cash Award & Trophy', desc: 'Certificate of Merit' },
        { title: 'All Participants', reward: 'Official Certificate', desc: 'Certificate of Participation recognized by Silicon West Club' },
      ];

  // 5. Timeline & Schedule Milestones
  const customTimeline = Array.isArray(event.timeline) && event.timeline.length > 0
    ? event.timeline
    : Array.isArray(meta?.timeline) && meta.timeline.length > 0
    ? meta.timeline
    : null;

  // Exactly 2 persons' contact info
  const person1 = (event.coordinator1Name && {
    name: event.coordinator1Name,
    role: event.coordinator1Role || 'Faculty Coordinator',
    department: club.facultyDept || (club.category === 'Technical' ? 'Computer Science & Engineering' : 'Student Affairs'),
    email: event.coordinator1Email || club.facultyCoordinatorEmail || 'faculty.coordinator@silicon.ac.in',
    phone: event.coordinator1Phone || null,
  }) || (contacts && contacts[0]) || {
    name: club.facultyCoordinator || 'Dr. Alekha Dash',
    role: 'Faculty Coordinator',
    department: club.facultyDept || (club.category === 'Technical' ? 'Computer Science & Engineering' : 'Student Affairs'),
    email: club.facultyCoordinatorEmail || 'faculty.coordinator@silicon.ac.in',
    phone: null,
  };

  const person2 = (event.coordinator2Name && {
    name: event.coordinator2Name,
    role: event.coordinator2Role || 'Student Coordinator',
    department: club.secretaryBranch ? `Branch: ${club.secretaryBranch}` : 'Student Affairs Lead',
    email: event.coordinator2Email || club.secretaryEmail || 'events@siliconwest.in',
    phone: event.coordinator2Phone || club.secretaryPhone || '+91 98765 43210',
  }) || (contacts && contacts[1]) || {
    name: club.secretary || 'Rahul Tripathy',
    role: 'Student Coordinator',
    department: club.secretaryBranch ? `Branch: ${club.secretaryBranch}` : 'Student Affairs Lead',
    email: club.secretaryEmail || 'events@siliconwest.in',
    phone: club.secretaryPhone || '+91 98765 43210',
  };

  // Generate downloadable event document / brochure
  const handleDownloadBrochure = () => {
    if (!event) return;

    if (attachment?.data) {
      const a = document.createElement('a');
      a.href = attachment.data;
      a.download = attachment.name || `${event.slug}-brochure.pdf`;
      a.click();
      return;
    }

    const content = `===================================================================
SILICON INSTITUTE OF TECHNOLOGY - SILICON WEST CAMPUS
OFFICIAL EVENT BROCHURE & SCHEDULE
===================================================================

EVENT TITLE: ${event.title}
CATEGORY: ${event.category || 'General Campus Event'}
STATUS: ${event.status}

ORGANIZED BY: ${event.club?.name || 'Silicon West Student Club'}
VENUE: ${event.venue || 'Campus Auditorium / Labs'}
ONLINE MEETING: ${event.onlineMeetingUrl || 'None (In-Person)'}

EVENT SCHEDULE:
- Starts: ${startDate.toLocaleString()}
- Ends: ${endDate.toLocaleString()}
- Registration Deadline: ${deadlineDate.toLocaleString()}
- Total Capacity: ${event.capacity || 'Open Capacity'}
- Current Confirmed Participants: ${event.confirmedRegistrationsCount}

-------------------------------------------------------------------
ELIGIBILITY & TEAM PARTICIPATION:
-------------------------------------------------------------------
Eligibility: ${eligibility}
Team Structure: ${teamSize}

-------------------------------------------------------------------
IMPORTANT DATES:
-------------------------------------------------------------------
- Registration Deadline: ${deadlineDate.toLocaleString()}
- Event Commences: ${startDate.toLocaleString()}
- Event Concludes: ${endDate.toLocaleString()}
${customTimeline && customTimeline.length > 0 ? `
-------------------------------------------------------------------
EVENT AGENDA & TIMELINE:
-------------------------------------------------------------------
${customTimeline.map((item, idx) => `${idx + 1}. ${item.time ? `[${item.time}] ` : ''}${item.title}${item.description ? `\n   ${item.description}` : ''}`).join('\n\n')}
` : ''}

-------------------------------------------------------------------
REWARDS & PRIZES:
-------------------------------------------------------------------
${rewards.map(r => `- ${r.title}: ${r.reward} (${r.desc})`).join('\n')}

-------------------------------------------------------------------
RULES & GUIDELINES:
-------------------------------------------------------------------
${rules.map((rule, idx) => `${idx + 1}. ${rule}`).join('\n')}

-------------------------------------------------------------------
EVENT DESCRIPTION:
-------------------------------------------------------------------
${event.summary || ''}

${cleanDescription}

-------------------------------------------------------------------
COORDINATOR CONTACTS:
-------------------------------------------------------------------
1. ${person1.name} (${person1.role}) - ${person1.email || 'N/A'}
2. ${person2.name} (${person2.role}) - ${person2.email || 'N/A'}${person2.phone ? `, ${person2.phone}` : ''}

Generated on: ${new Date().toLocaleString()}
Campus Portal: https://siliconwest.in/events/${event.slug}
===================================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.slug}-event-guide.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-20">
      {/* Top Navigation & Quick Actions */}
      <div className="border-b border-slate-100 bg-white">
        <div className="max-w-6xl mx-auto px-3.5 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-2">
          <Link
            href="/events"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to events</span>
          </Link>

          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {event.canManage && (
              <>
                <Link
                  href={`/dashboard/events/${event.id}/edit`}
                  className="text-xs font-semibold text-[#034694] hover:text-[#022c5e] flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100/80 border border-blue-200 transition-colors shadow-2xs"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#034694]" />
                  <span>Edit</span>
                </Link>
                <Link
                  href="/dashboard/events"
                  className="text-xs font-medium text-slate-600 hover:text-slate-900 hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200"
                >
                  <Shield className="w-3.5 h-3.5 text-[#034694]" />
                  <span>Manage</span>
                </Link>
              </>
            )}

            <button
              onClick={handleCopyLink}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600 font-semibold">Copied</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Share</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3.5 sm:px-6 py-5 sm:py-8 space-y-5 sm:space-y-8">
        {/* 1. TITLE & SUMMARY (BEFORE BANNER) */}
        <div className="space-y-2.5 sm:space-y-3.5">
          {/* Metadata badges strip */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="text-[11px] sm:text-xs font-semibold text-[#034694] bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-md shadow-2xs">
              {event.category || 'General'}
            </span>

            {club.name && (
              <Link
                href={`/clubs/${club.slug}`}
                className="text-[11px] sm:text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2.5 py-0.5 rounded-md inline-flex items-center gap-1 transition-colors"
              >
                <Building2 className="w-3 h-3 text-[#034694]" />
                <span className="truncate max-w-[140px] sm:max-w-[200px]">{club.name}</span>
              </Link>
            )}

            {event.isRegistrationOpen && !isFull ? (
              <span className="text-[11px] sm:text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md flex items-center gap-1.5 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Registration Open
              </span>
            ) : isFull ? (
              <span className="text-[11px] sm:text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-md shadow-2xs">
                Full Capacity
              </span>
            ) : (
              <span className="text-[11px] sm:text-xs font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-md">
                Registration Closed
              </span>
            )}

            {createdAtDate && (
              <span className="text-[10px] sm:text-[11px] text-slate-400 sm:ml-auto w-full sm:w-auto mt-0.5 sm:mt-0 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                <span>Published on {createdAtDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </span>
            )}
          </div>

          {/* Event Title */}
          <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.18] break-words">
            {event.title}
          </h1>

          {/* Short Description */}
          {event.summary && (
            <p className="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed max-w-4xl font-normal break-words">
              {event.summary}
            </p>
          )}
        </div>

        {/* 2. EVENT BANNER */}
        <div className="rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200/90 shadow-xs bg-slate-950 relative group">
          <div className="relative w-full aspect-[16/10] sm:aspect-[16/8] md:aspect-[21/9] flex items-center justify-center overflow-hidden bg-slate-900">
            {/* Ambient blurred backdrop so any aspect ratio banner fills seamlessly without harsh letterboxing */}
            <img
              src={event.bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80'}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-110 pointer-events-none"
            />
            {/* The main banner image - rendered edge-to-edge with crisp aspect scaling */}
            <img
              src={event.bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80'}
              alt={event.title}
              className="relative z-10 w-full h-full object-cover object-center group-hover:scale-[1.015] transition-transform duration-500 ease-out"
            />
            {/* Subtle bottom gradient on mobile */}
            <div className="absolute inset-0 z-20 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent pointer-events-none sm:hidden" />
          </div>
        </div>

        {/* 3. DETAILS STRIP (AFTER BANNER) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 p-3.5 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/70 text-xs shadow-2xs divide-y sm:divide-y-0 sm:divide-x divide-slate-200/70">
          {/* Box 1: Date & Time */}
          <div className="space-y-1 sm:pr-3">
            <div className="flex items-center gap-1.5 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-[#034694]" />
              <span>Date &amp; Time</span>
            </div>
            <p className="font-semibold text-slate-900 text-sm">
              {startDate.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </p>
            <p className="text-slate-600 text-[11px]">
              {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
              {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          {/* Box 2: Location */}
          <div className="space-y-1 pt-2.5 sm:pt-0 sm:px-3">
            <div className="flex items-center gap-1.5 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
              <MapPin className="w-3.5 h-3.5 text-[#034694]" />
              <span>Location</span>
            </div>
            <p className="font-semibold text-slate-900 text-sm truncate" title={event.venue || 'Campus Venue'}>
              {event.venue || 'Campus Venue'}
            </p>
            {event.onlineMeetingUrl ? (
              <a
                href={event.onlineMeetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#034694] hover:underline block text-[11px] font-medium flex items-center gap-1 truncate"
              >
                <Video className="w-3 h-3 text-[#034694] shrink-0" />
                <span className="truncate">Online Meeting Link</span>
              </a>
            ) : (
              <p className="text-slate-600 text-[11px]">In-Person Campus Venue</p>
            )}
          </div>

          {/* Box 3: Host Club */}
          <div className="space-y-1 pt-2.5 sm:pt-0 sm:pl-3">
            <div className="flex items-center gap-1.5 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
              <Building2 className="w-3.5 h-3.5 text-[#034694]" />
              <span>Host Club</span>
            </div>
            {club.name ? (
              <Link
                href={`/clubs/${club.slug}`}
                className="font-semibold text-[#034694] hover:underline text-sm block truncate"
              >
                {club.name}
              </Link>
            ) : (
              <p className="font-semibold text-slate-900 text-sm">Silicon West</p>
            )}
            <p className="text-slate-600 text-[11px] truncate">{club.category || 'Official Club'}</p>
          </div>
        </div>

        {/* 4. MAIN 2-COLUMN SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start pt-2">
          {/* Main Content (8 Cols) */}
          <div className="lg:col-span-8 space-y-8 sm:space-y-10 order-2 lg:order-1">
            {/* ELIGIBILITY & TEAM SIZE CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Eligibility */}
              <div className="border border-slate-200 rounded-2xl p-4 sm:p-5 bg-white space-y-2">
                <div className="flex items-center gap-2 text-[#034694]">
                  <GraduationCap className="w-4 h-4" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900">
                    Eligibility
                  </h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {eligibility}
                </p>
              </div>

              {/* Team Size */}
              <div className="border border-slate-200 rounded-2xl p-4 sm:p-5 bg-white space-y-2">
                <div className="flex items-center gap-2 text-[#034694]">
                  <Users className="w-4 h-4" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900">
                    Team Size
                  </h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {teamSize}
                </p>
              </div>
            </div>

            {/* DESCRIPTION */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <FileText className="w-4 h-4 text-[#034694]" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
                  Description
                </h2>
              </div>
              <div className="prose prose-slate prose-sm sm:prose-base max-w-none text-slate-700 leading-relaxed">
                <MarkdownView content={cleanDescription} />
              </div>
            </section>

            {/* IMPORTANT DATES */}
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-[#034694]" />
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
                    Important Dates
                  </h2>
                </div>
                <span className="text-xs text-slate-400 font-medium">Schedule</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/60 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Registration Deadline</span>
                  <span className="font-semibold text-slate-900 text-xs block">
                    {deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="text-slate-500 text-[11px] block">
                    {deadlineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/60 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Event Starts &amp; Reporting</span>
                  <span className="font-semibold text-slate-900 text-xs block">
                    {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="text-slate-500 text-[11px] block">
                    {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/60 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Event Conclusion</span>
                  <span className="font-semibold text-slate-900 text-xs block">
                    {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="text-slate-500 text-[11px] block">
                    {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </section>

            {/* REWARDS OR PRIZES */}
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-[#034694]" />
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
                    Rewards &amp; Prizes
                  </h2>
                </div>
                <span className="text-xs text-slate-400 font-medium">Recognition</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {rewards.map((r, i) => (
                  <div key={i} className="border border-slate-200 rounded-2xl p-4 bg-white space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                      {i === 0 ? <Trophy className="w-4 h-4 text-amber-600" /> : <Award className="w-4 h-4 text-[#034694]" />}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">{r.title}</span>
                      <p className="text-xs font-semibold text-slate-900 mt-0.5">{r.reward}</p>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight pt-1 border-t border-slate-100">
                      {r.desc}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* RULES & GUIDELINES */}
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#034694]" />
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
                    Rules &amp; Guidelines
                  </h2>
                </div>
                <span className="text-xs text-slate-400 font-medium">Code of Conduct</span>
              </div>

              <ul className="border border-slate-200 rounded-2xl p-5 bg-white divide-y divide-slate-100 text-xs space-y-0">
                {rules.map((rule, idx) => (
                  <li key={idx} className="py-2.5 first:pt-0 last:pb-0 flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="text-slate-700 leading-relaxed">{rule}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* TIMELINE */}
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <Milestone className="w-4 h-4 text-[#034694]" />
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
                    Timeline &amp; Schedule
                  </h2>
                </div>
                <span className="text-xs text-slate-400 font-medium">Event Schedule</span>
              </div>

              <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {customTimeline && customTimeline.length > 0 ? (
                  customTimeline.map((item, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full bg-[#034694] border-2 border-white shadow-xs" />
                      <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-3.5 space-y-1 hover:border-slate-300 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                          <span className="font-semibold text-slate-900">{item.title}</span>
                          {item.time && (
                            <span className="text-[11px] font-semibold text-[#034694] bg-[#034694]/10 px-2 py-0.5 rounded-md inline-block w-fit">
                              {item.time}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-xs text-slate-600 leading-relaxed pt-0.5">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    {/* Milestone 1: Registration Deadline */}
                    <div className="relative">
                      <div className={`absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white ${isDeadlinePassed ? 'bg-slate-400' : 'bg-emerald-500'}`} />
                      <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-3.5 space-y-1">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5 sm:gap-1 text-xs">
                          <span className="font-semibold text-slate-900">Registration Deadline</span>
                          <span className="text-[11px] font-medium text-slate-500">
                            {deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })},{' '}
                            {deadlineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">
                          Registration closes for individual participants and team entries.
                        </p>
                      </div>
                    </div>

                    {/* Milestone 2: Event Starts */}
                    <div className="relative">
                      <div className="absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full bg-[#034694] border-2 border-white" />
                      <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-3.5 space-y-1">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5 sm:gap-1 text-xs">
                          <span className="font-semibold text-slate-900">Event Starts &amp; Reporting</span>
                          <span className="text-[11px] font-medium text-slate-500">
                            {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })},{' '}
                            {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">
                          Participant check-in, orientation, opening remarks, and commencement of sessions.
                        </p>
                      </div>
                    </div>

                    {/* Milestone 3: Event Ends */}
                    <div className="relative">
                      <div className="absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full bg-slate-800 border-2 border-white" />
                      <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-3.5 space-y-1">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5 sm:gap-1 text-xs">
                          <span className="font-semibold text-slate-900">Event Conclusion &amp; Valedictory</span>
                          <span className="text-[11px] font-medium text-slate-500">
                            {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })},{' '}
                            {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">
                          Presentations, assessment, prize distribution, and participation certificate issuance.
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* DOC DOWNLOAD OPTION */}
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <FileDown className="w-4 h-4 text-[#034694]" />
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
                    Doc Download Option
                  </h2>
                </div>
                <span className="text-xs text-slate-400 font-medium">Resources</span>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50/50">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#034694] flex items-center justify-center shrink-0">
                    <Paperclip className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">
                      {attachment?.name || `${event.title} - Official Event Guide & Schedule`}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {attachment?.size || 'Complete event specifications, rules, guidelines, and schedule document'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleDownloadBrochure}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-medium rounded-lg transition-colors shrink-0 shadow-2xs w-full sm:w-auto justify-center"
                >
                  <Download className="w-3.5 h-3.5 text-[#034694]" />
                  <span>Download Doc</span>
                </button>
              </div>
            </section>

            {/* CONTACT INFO (2 PERSONS) */}
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#034694]" />
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
                    Contact Info
                  </h2>
                </div>
                <span className="text-xs text-slate-400 font-medium">Event Coordinators</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Person 1 */}
                <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#034694] flex items-center justify-center font-bold shrink-0">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900 leading-none">{person1.name}</p>
                      <span className="text-[10px] text-slate-400 font-medium block mt-1">{person1.role}</span>
                    </div>
                  </div>

                  {person1.department && (
                    <p className="text-[11px] text-slate-500 pt-0.5">{person1.department}</p>
                  )}

                  <div className="pt-2 border-t border-slate-100 space-y-1 text-xs">
                    {person1.email && (
                      <a href={`mailto:${person1.email}`} className="text-slate-600 hover:text-[#034694] flex items-center gap-1.5 truncate">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{person1.email}</span>
                      </a>
                    )}
                    {person1.phone && (
                      <a href={`tel:${person1.phone}`} className="text-slate-600 hover:text-[#034694] flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{person1.phone}</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Person 2 */}
                <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#034694] flex items-center justify-center font-bold shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900 leading-none">{person2.name}</p>
                      <span className="text-[10px] text-slate-400 font-medium block mt-1">{person2.role}</span>
                    </div>
                  </div>

                  {person2.department && (
                    <p className="text-[11px] text-slate-500 pt-0.5">{person2.department}</p>
                  )}

                  <div className="pt-2 border-t border-slate-100 space-y-1 text-xs">
                    {person2.email && (
                      <a href={`mailto:${person2.email}`} className="text-slate-600 hover:text-[#034694] flex items-center gap-1.5 truncate">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{person2.email}</span>
                      </a>
                    )}
                    {person2.phone && (
                      <a href={`tel:${person2.phone}`} className="text-slate-600 hover:text-[#034694] flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{person2.phone}</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Sticky Sidebar (4 Cols) */}
          <div className="lg:col-span-4 sticky top-20 space-y-4 order-1 lg:order-2">
            {/* If user is already registered */}
            {event.userRegistration ? (
              <div className="border border-emerald-200 rounded-2xl p-6 bg-emerald-50/50 space-y-3">
                <div className="flex items-center gap-2 text-emerald-800">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-sm">You are Registered</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Your seat is confirmed. Please carry your student ID card for reporting.
                </p>
                <Link
                  href="/my-registrations"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>View Registration Pass</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : null}

            {/* Registration Box */}
            <div className="border border-slate-200 rounded-2xl p-6 bg-white shadow-2xs space-y-5">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Registration
                </p>
                <p className="text-xl font-semibold text-slate-900 mt-1">
                  {event.entryFee || 'Free Admission'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {event.isTeamEvent
                    ? `Format: ${event.minTeamSize || 1} – ${event.maxTeamSize || 4} Members / Team`
                    : 'Individual Solo Participation'}
                </p>
              </div>

              {/* Status & Capacity */}
              <div className="space-y-3 pt-4 border-t border-slate-100 text-xs">
                {event.capacity ? (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-slate-600">
                      <span>Capacity</span>
                      <span className="font-medium text-slate-900">
                        {event.confirmedRegistrationsCount} / {event.capacity} spots
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#034694] h-full rounded-full transition-all duration-300"
                        style={{ width: `${percentFilled}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 text-right">
                      {remainingSeats > 0 ? `${remainingSeats} spots remaining` : 'Capacity reached'}
                    </p>
                  </div>
                ) : (
                  <div className="flex justify-between text-slate-600">
                    <span>Attendance</span>
                    <span className="font-medium text-slate-900">
                      {event.confirmedRegistrationsCount} registered
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600 pt-1">
                  <span>Registration Deadline</span>
                  <span className="font-medium text-slate-900 text-right">
                    {deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    <span className="block text-[11px] text-slate-400">
                      {deadlineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </span>
                </div>
              </div>

              {/* Action Button */}
              {event.userRegistration ? (
                <div className="space-y-2">
                  <button
                    type="button"
                    disabled
                    className="w-full py-3 bg-emerald-50 text-emerald-800 border border-emerald-300/80 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-not-allowed opacity-90 shadow-2xs"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">
                      {event.userRegistration.teamName
                        ? `Registered (${event.userRegistration.teamName})`
                        : 'Already Registered'}
                    </span>
                  </button>
                  <Link
                    href="/my-registrations"
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>View Pass in My Registrations</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : event.isRegistrationOpen && !isFull ? (
                <Link
                  href={`/events/${event.slug}/register`}
                  className="w-full py-3 bg-[#034694] hover:bg-[#023168] text-white font-medium text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <span>Register for Event</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ) : isFull ? (
                <button
                  type="button"
                  disabled
                  className="w-full py-2.5 bg-slate-100 text-slate-400 border border-slate-200 font-medium text-xs rounded-xl text-center cursor-not-allowed"
                >
                  Registration Full
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="w-full py-2.5 bg-slate-100 text-slate-400 border border-slate-200 font-medium text-xs rounded-xl text-center cursor-not-allowed"
                >
                  Registration Closed
                </button>
              )}

              <div className="text-[11px] text-slate-400 text-center leading-relaxed">
                Silicon Institute of Technology &bull; Campus Portal
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
