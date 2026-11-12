'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  MapPin,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Send,
  Sparkles,
  Users,
  User,
  Plus,
  Trash2,
  LogIn,
  UserPlus,
  Building2,
  Clock,
  Ticket,
  Phone,
  Mail,
  GraduationCap,
  Download,
  Info,
  Hash,
  Share2,
  Printer,
  ChevronRight,
  Search,
  Check,
  X,
  Bell,
  Loader2,
  UserCheck,
} from 'lucide-react';
import { eventsApi, registrationsApi, usersApi, invitationsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function EventRegisterPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug;
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [successRegistration, setSuccessRegistration] = useState(null);

  // Profile details (optional phone & SIC)
  const [phone, setPhone] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [branch, setBranch] = useState('Computer Science & Engineering (CSE)');

  // Participation Mode: 'INDIVIDUAL' or 'TEAM'
  const [participationMode, setParticipationMode] = useState('INDIVIDUAL');
  const [teamName, setTeamName] = useState('');
  const [teamMembers, setTeamMembers] = useState([]); // [{ id, name, email, rollNumber, status: 'PENDING' }]

  // Teammate Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const searchBoxRef = useRef(null);

  // Incoming invitations for the current logged-in user for this event
  const [myInvitations, setMyInvitations] = useState([]);
  const [respondingInviteId, setRespondingInviteId] = useState(null);

  // Load event details
  useEffect(() => {
    if (!slug) return;
    async function fetchEvent() {
      try {
        const data = await eventsApi.getBySlug(slug);
        setEvent(data);

        // Auto configure participation mode based on event setup
        if (data.isTeamEvent && (data.minTeamSize || 1) > 1) {
          setParticipationMode('TEAM');
        } else if (data.isTeamEvent) {
          setParticipationMode('TEAM');
        } else {
          setParticipationMode('INDIVIDUAL');
        }
      } catch (err) {
        setFormError(err.message || 'Could not load event.');
      } finally {
        setLoading(false);
      }
    }
    fetchEvent();
  }, [slug, user]);

  const [userReg, setUserReg] = useState(null);

  // Client-side cross-verification with /api/registrations/my
  useEffect(() => {
    if (!isAuthenticated || !event) return;
    if (event.userRegistration) {
      setUserReg(event.userRegistration);
      return;
    }
    async function checkMyRegistration() {
      try {
        const myRegs = await registrationsApi.getMy();
        if (Array.isArray(myRegs)) {
          const match = myRegs.find(
            (r) =>
              r.eventId === event.id ||
              r.event?.id === event.id ||
              (slug && r.event?.slug === slug)
          );
          if (match) {
            setUserReg({
              id: match.id,
              teamName: match.teamName,
              role: match.roleInEvent || (match.teamName ? 'Team Leader' : 'Participant'),
              status: match.status,
            });
          }
        }
      } catch (err) {
        // silent
      }
    }
    checkMyRegistration();
  }, [isAuthenticated, event, slug]);

  const activeRegistration = event?.userRegistration || userReg;

  // Load pending invitations for current student
  useEffect(() => {
    if (!isAuthenticated) return;
    async function fetchInvitations() {
      try {
        const list = await invitationsApi.getMy();
        if (Array.isArray(list)) {
          setMyInvitations(list);
        }
      } catch (err) {
        console.error('Failed to load user invitations:', err);
      }
    }
    fetchInvitations();
  }, [isAuthenticated, slug]);

  // Live Teammate Search (debounced)
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setSearchDropdownOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await usersApi.search(searchQuery.trim());
        setSearchResults(Array.isArray(results) ? results : []);
        setSearchDropdownOpen(true);
      } catch (err) {
        console.error('Search teammates error:', err);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setSearchDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Team constraints
  const minTeamSize = event?.minTeamSize || 1;
  const maxTeamSize = event?.maxTeamSize || 4;
  const maxTeammates = Math.max(0, maxTeamSize - 1); // Excludes team leader

  // Add teammate from search
  const handleSelectTeammate = (candidate) => {
    if (teamMembers.length >= maxTeammates) {
      setFormError(`Maximum team size for this event is ${maxTeamSize} members (Lead + ${maxTeammates} teammates).`);
      return;
    }

    // Check duplicate
    if (teamMembers.some((m) => m.email.toLowerCase() === candidate.email.toLowerCase())) {
      setFormError(`${candidate.name} is already added to your team.`);
      return;
    }

    setTeamMembers((prev) => [
      ...prev,
      {
        userId: candidate.id,
        name: candidate.name,
        email: candidate.email,
        status: 'PENDING',
      },
    ]);
    setSearchQuery('');
    setSearchDropdownOpen(false);
    setFormError(null);
  };

  // Remove teammate
  const handleRemoveTeammate = (index) => {
    setTeamMembers((prev) => prev.filter((_, i) => i !== index));
  };

  // Accept or Decline an incoming invitation
  const handleRespondInvitation = async (invitationId, action) => {
    setRespondingInviteId(invitationId);
    try {
      await invitationsApi.respond(invitationId, action);
      // Reload invitations
      const list = await invitationsApi.getMy();
      setMyInvitations(Array.isArray(list) ? list : []);

      if (action === 'ACCEPT') {
        // Refresh event data to reflect registration
        const updatedEvent = await eventsApi.getBySlug(slug);
        setEvent(updatedEvent);
      }
    } catch (err) {
      alert(err.message || 'Failed to update invitation.');
    } finally {
      setRespondingInviteId(null);
    }
  };

  // Submit registration (1-Click for solo, or Team creation with invitations)
  const handleRegister = async (e) => {
    if (e) e.preventDefault();
    setFormError(null);

    if (!user) {
      router.push(`/login?redirect=/events/${event.slug}/register`);
      return;
    }

    if (activeRegistration) {
      setFormError('You (or your team) are already registered for this event. View your pass in My Registrations.');
      return;
    }

    const isTeam = participationMode === 'TEAM';

    if (isTeam) {
      if (!teamName.trim()) {
        setFormError('Please enter a Team Name.');
        return;
      }

      const totalTeamCount = 1 + teamMembers.length; // Leader + invited members
      if (totalTeamCount < minTeamSize) {
        setFormError(
          `This event requires at least ${minTeamSize} members. Please search and invite at least ${
            minTeamSize - 1
          } teammate(s).`
        );
        return;
      }
      if (totalTeamCount > maxTeamSize) {
        setFormError(`Maximum team size is ${maxTeamSize} members.`);
        return;
      }
    }

    setSubmitting(true);

    try {
      const payload = {
        eventId: event.id,
        participantName: user.name,
        participantEmail: user.email,
        phone: phone ? phone.trim() : undefined,
        rollNumber: rollNumber ? rollNumber.trim().toUpperCase() : undefined,
        branch: branch ? branch.trim() : 'Computer Science & Engineering (CSE)',
        collegeName: 'Silicon Institute of Technology, Sambalpur',
        teamName: isTeam && teamName ? teamName.trim() : undefined,
        teamMembers: isTeam && Array.isArray(teamMembers) && teamMembers.length > 0
          ? teamMembers.map((m) => ({
              userId: m.userId,
              name: m.name,
              email: m.email,
              status: 'PENDING',
            }))
          : undefined,
      };

      const res = await registrationsApi.create(payload);
      setSuccessRegistration({
        ...(res.registration || {}),
        ...payload,
        eventTitle: event.title,
        eventVenue: event.venue,
        eventStartsAt: event.startsAt,
        eventEndsAt: event.endsAt,
        clubName: event.club?.name,
      });
    } catch (err) {
      console.error('Registration submission error:', err);
      setFormError(err.message || 'Failed to confirm registration.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrintPass = () => {
    window.print();
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 border-4 border-[#034694] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Loading Event Registration Portal...
          </p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-md shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Event Not Found</h2>
          <p className="text-xs text-slate-500">
            The event you are trying to register for could not be found or is no longer active.
          </p>
          <Link
            href="/events"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#034694] text-white text-xs font-bold rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Events
          </Link>
        </div>
      </div>
    );
  }

  const startDate = new Date(event.startsAt);
  const deadlineDate = new Date(event.registrationDeadline);
  const isClosed = !event.isRegistrationOpen && event.registrationCloseReason;

  // Check if current user has a pending invitation specifically for this event
  const pendingEventInvite = myInvitations.find(
    (inv) => inv.eventId === event.id && inv.status === 'PENDING'
  );

  // -------------------------------------------------------------
  // SUCCESS / CONFIRMED PASS STATE
  // -------------------------------------------------------------
  if (successRegistration) {
    return (
      <div className="min-h-screen bg-slate-100/70 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center print:bg-white print:p-0">
        <div className="max-w-2xl w-full space-y-6">
          <div className="flex items-center justify-between print:hidden">
            <Link
              href={`/events/${event.slug}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Event Details</span>
            </Link>
            <button
              type="button"
              onClick={handlePrintPass}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print / Save Pass</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden print:border print:shadow-none">
            <div className="bg-[#034694] px-6 sm:px-8 py-6 text-white relative overflow-hidden">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] font-bold tracking-widest uppercase text-amber-300">
                      Official Silicon West Entry Pass
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight mt-1">
                    Participation Confirmed!
                  </h1>
                  <p className="text-xs text-blue-100 mt-0.5">
                    Silicon Institute of Technology, Silicon West Campus
                  </p>
                </div>
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 border border-white/20">
                  <Ticket className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200/70 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#034694] bg-[#034694]/10 px-2 py-0.5 rounded-md">
                      {event.club?.name || 'Campus Activity'}
                    </span>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                      {event.title}
                    </h2>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Confirmed
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-600 pt-1 border-t border-slate-200/50">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>
                      {startDate.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex items-center gap-2 sm:col-span-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-medium text-slate-800">
                      {event.venue || 'Silicon West Innovation Lab'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Participant Profile Chip */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Registered Silicon Participant
                </span>
                <div className="font-bold text-slate-900 text-sm">{user?.name}</div>
                <div className="text-slate-500 font-mono">{user?.email}</div>
                <div className="text-slate-500">Silicon Institute of Technology</div>
              </div>

              {/* Team Roster with Invitation Status */}
              {successRegistration.teamName && (
                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#034694]">
                        Registered Team
                      </span>
                      <div className="text-sm font-bold text-slate-900">
                        {successRegistration.teamName}
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                      Team Captain: You
                    </span>
                  </div>

                  {Array.isArray(successRegistration.teamMembers) && successRegistration.teamMembers.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-blue-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                        Invited Teammates (Notifications Sent):
                      </span>
                      <div className="space-y-1.5">
                        {successRegistration.teamMembers.map((tm, idx) => (
                          <div
                            key={idx}
                            className="bg-white/90 border border-blue-100 rounded-lg p-2.5 text-xs flex items-center justify-between"
                          >
                            <div>
                              <span className="font-bold text-slate-900">{tm.name}</span>
                              <span className="block text-[11px] text-slate-500 font-mono">{tm.email}</span>
                            </div>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                              <Clock className="w-3 h-3 text-amber-600" />
                              Invite Request Sent
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Pass ID Banner */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block">
                    Official Coded Pass Number
                  </span>
                  <div className="font-mono text-base sm:text-lg font-black text-amber-400 tracking-wider">
                    {successRegistration.passCode ||
                      `SW-PASS-${new Date().getFullYear()}-${(successRegistration.id || '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase()}`}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Carry your physical Silicon student identity card during check-in.
                  </span>
                </div>
                <div className="bg-white p-2 rounded-xl shrink-0 self-center sm:self-auto shadow-sm">
                  <div className="w-14 h-14 bg-slate-900 rounded-lg p-1.5 flex flex-col justify-between">
                    <div className="flex justify-between">
                      <div className="w-3 h-3 bg-white rounded-xs" />
                      <div className="w-3 h-3 bg-white rounded-xs" />
                    </div>
                    <div className="w-2 h-2 bg-amber-400 mx-auto rounded-full" />
                    <div className="flex justify-between">
                      <div className="w-3 h-3 bg-white rounded-xs" />
                      <div className="w-2 h-2 bg-white rounded-xs self-end" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 print:hidden pt-2">
                <Link
                  href={`/my-registrations?registered=${encodeURIComponent(successRegistration.id || '')}`}
                  className="py-3 px-4 bg-[#034694] hover:bg-[#02336e] text-white font-bold text-xs rounded-xl transition-colors shadow-2xs flex items-center justify-center gap-2 text-center"
                >
                  <Ticket className="w-4 h-4" />
                  <span>View in My Registrations</span>
                </Link>
                <Link
                  href={`/events/${event.slug}`}
                  className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 text-center"
                >
                  <span>Back to Event Details</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // REGISTRATION & CONFIRMATION PORTAL
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-50/70 py-6 sm:py-10 px-3 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href={`/events/${event.slug}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Cancel and Return to Event</span>
          </Link>
          <span className="text-[11px] font-semibold text-slate-400">
            Silicon West Campus Event Hub
          </span>
        </div>

        {/* INCOMING INVITATION BANNER (If current user was invited by a team leader) */}
        {pendingEventInvite && (
          <div className="p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 shadow-sm space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                    Team Invitation Request
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    {pendingEventInvite.inviterName} invited you to join team &ldquo;{pendingEventInvite.teamName}&rdquo;!
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Accept this request to confirm your seat in the team roster for {event.title}.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-amber-200/60">
              <button
                type="button"
                disabled={respondingInviteId === pendingEventInvite.id}
                onClick={() => handleRespondInvitation(pendingEventInvite.id, 'ACCEPT')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                {respondingInviteId === pendingEventInvite.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>Accept &amp; Confirm My Seat</span>
              </button>

              <button
                type="button"
                disabled={respondingInviteId === pendingEventInvite.id}
                onClick={() => handleRespondInvitation(pendingEventInvite.id, 'DECLINE')}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl border border-slate-300 transition-colors flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5 text-slate-500" />
                <span>Decline</span>
              </button>
            </div>
          </div>
        )}

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Participation Action (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Header Banner */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-2">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#034694]/10 text-[#034694] text-[11px] font-bold">
                <Ticket className="w-3.5 h-3.5" />
                <span>Event Participation</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                Join {event.title}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Participation requires an authenticated Silicon West student account. No tedious repetitive forms required.
              </p>

              {isClosed && (
                <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>Notice: {event.registrationCloseReason || 'Registration is closed.'}</span>
                </div>
              )}
            </div>

            {/* ERROR ALERT */}
            {formError && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2.5 shadow-2xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {/* GATEWAY 1: NOT SIGNED IN -> DEDICATED SIGN IN WALL */}
            {!isAuthenticated ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-2xs text-center space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-[#034694] flex items-center justify-center mx-auto shadow-2xs">
                  <ShieldCheck className="w-8 h-8 text-[#034694]" />
                </div>

                <div className="space-y-2 max-w-md mx-auto">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Official Silicon ID Sign In Required
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    To maintain academic verification and issue official event credentials, participation is restricted to students signed in with an official Silicon ID (<strong>@silicon.ac.in</strong>).
                  </p>
                </div>

                <div className="max-w-sm mx-auto space-y-3 pt-2">
                  <Link
                    href={`/login?redirect=/events/${event.slug}/register`}
                    className="w-full py-3.5 bg-[#034694] hover:bg-[#02336e] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-center"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Sign In with Silicon ID</span>
                  </Link>

                  <Link
                    href={`/signup?redirect=/events/${event.slug}/register`}
                    className="w-full py-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 text-center"
                  >
                    <UserPlus className="w-4 h-4 text-slate-500" />
                    <span>Create Silicon Student Account</span>
                  </Link>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-4 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    1-Click Confirmation
                  </span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-[#034694]" />
                    Teammate Search &amp; Invites
                  </span>
                </div>
              </div>
            ) : (
              /* GATEWAY 2: SIGNED IN -> ZERO MANUAL FORMS */
              <div className="space-y-6">
                {/* Verified Account Identification Card */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        Verified Silicon Participant
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Silicon ID Authenticated
                    </span>
                  </div>

                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-[#034694] text-white flex items-center justify-center font-black text-lg shadow-2xs shrink-0">
                      {user?.name?.charAt(0) || 'S'}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 text-sm sm:text-base truncate">
                        {user?.name}
                      </div>
                      <div className="text-xs text-slate-500 font-mono truncate">{user?.email}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Silicon Institute of Technology</div>
                    </div>
                  </div>
                </div>

                {/* Already Registered Notification Banner */}
                {activeRegistration && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 sm:p-7 shadow-2xs space-y-3">
                    <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>You Are Already Registered for This Event</span>
                    </div>
                    <p className="text-xs text-emerald-800 leading-relaxed">
                      {activeRegistration.teamName
                        ? `You are registered as ${activeRegistration.role || 'Member'} of Team "${activeRegistration.teamName}".`
                        : 'Your individual entry pass has been confirmed.'}{' '}
                      Further registrations for this event are locked for your account.
                    </p>
                    <div className="pt-2">
                      <Link
                        href="/my-registrations"
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                      >
                        <span>View Official Pass in My Registrations</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                )}

                {/* Participation Format Configuration */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#034694]" />
                      Participation Setup
                    </h2>
                    {event.isTeamEvent && (
                      <span className="text-[11px] font-semibold text-[#034694] bg-[#034694]/10 px-2.5 py-0.5 rounded-full">
                        Team Size: {minTeamSize} – {maxTeamSize} Members
                      </span>
                    )}
                  </div>

                  {/* Mode Selector */}
                  {event.isTeamEvent && minTeamSize > 1 ? (
                    <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-slate-700 flex items-center gap-2.5">
                      <Info className="w-4 h-4 text-[#034694] shrink-0" />
                      <span>
                        This event requires a team of <strong>{minTeamSize} to {maxTeamSize} members</strong>. Search and invite your teammates below.
                      </span>
                    </div>
                  ) : event.isTeamEvent ? (
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setParticipationMode('INDIVIDUAL')}
                        className={`p-4 rounded-2xl border text-left transition-all ${
                          participationMode === 'INDIVIDUAL'
                            ? 'border-[#034694] bg-blue-50/50 shadow-2xs ring-1 ring-[#034694]'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-[#034694]" />
                            Individual (Solo)
                          </span>
                          {participationMode === 'INDIVIDUAL' && (
                            <div className="w-2 h-2 rounded-full bg-[#034694]" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500">1-Click Solo Pass</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setParticipationMode('TEAM')}
                        className={`p-4 rounded-2xl border text-left transition-all ${
                          participationMode === 'TEAM'
                            ? 'border-[#034694] bg-blue-50/50 shadow-2xs ring-1 ring-[#034694]'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-[#034694]" />
                            Team Participation
                          </span>
                          {participationMode === 'TEAM' && (
                            <div className="w-2 h-2 rounded-full bg-[#034694]" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500">Form a team (up to {maxTeamSize})</p>
                      </button>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-center gap-2">
                      <User className="w-4 h-4 text-[#034694] shrink-0" />
                      <span>Solo Participant Admission (Individual format).</span>
                    </div>
                  )}

                  {/* CASE A: SOLO / INDIVIDUAL CONFIRMATION (1-Click) */}
                  {participationMode === 'INDIVIDUAL' && (
                    <div className="space-y-4 pt-1">
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
                        <div className="flex items-center gap-2 font-bold text-slate-900">
                          <Sparkles className="w-4 h-4 text-[#034694]" />
                          <span>1-Click Participation</span>
                        </div>
                        <p>
                          Your verified account (<strong>{user.email}</strong>) will be registered immediately for {event.title}. You will receive your official campus entry pass on the next screen.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleRegister}
                        disabled={submitting || isClosed || Boolean(activeRegistration)}
                        className={`w-full py-4 font-black text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 ${
                          activeRegistration
                            ? 'bg-emerald-50 text-emerald-800 border-2 border-emerald-300 cursor-not-allowed opacity-90'
                            : 'bg-[#034694] hover:bg-[#02336e] disabled:bg-slate-300 text-white'
                        }`}
                      >
                        {activeRegistration ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            <span>Already Registered &bull; Registration Disabled</span>
                          </>
                        ) : submitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Confirming Participation...</span>
                          </>
                        ) : (
                          <>
                            <Ticket className="w-4 h-4" />
                            <span>Confirm Participation (1-Click) &bull; {event.entryFee || 'Free Entry'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* CASE B: TEAM PARTICIPATION WITH SEARCH & INVITATIONS */}
                  {participationMode === 'TEAM' && (
                    <div className="space-y-5 pt-1">
                      {/* Team Name Input */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">
                          Team Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={teamName}
                          onChange={(e) => setTeamName(e.target.value)}
                          placeholder="e.g. ByteCrushers, AI Innovators"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#034694] focus:border-[#034694]"
                        />
                      </div>

                      {/* Team Leader Badge */}
                      <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-[#034694] text-white flex items-center justify-center font-bold text-xs">
                            1
                          </div>
                          <div>
                            <span className="font-bold text-slate-900">{user.name}</span>
                            <span className="block text-[11px] text-slate-500 font-mono">{user.email}</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-[#034694] bg-blue-100 px-2 py-0.5 rounded-full">
                          Team Leader (Confirmed)
                        </span>
                      </div>

                      {/* TEAMMATE SEARCH BAR */}
                      <div className="space-y-2 relative" ref={searchBoxRef}>
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                          <span>Search &amp; Add Teammates</span>
                          <span className="text-[11px] text-slate-400 font-normal">
                            {teamMembers.length} of {maxTeammates} spots added
                          </span>
                        </label>

                        <div className="relative">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Type student name or Silicon email to search..."
                            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#034694] focus:border-[#034694]"
                          />
                          {searching && (
                            <Loader2 className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 animate-spin" />
                          )}
                        </div>

                        {/* Search Dropdown Results */}
                        {searchDropdownOpen && (
                          <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 max-h-56 overflow-y-auto divide-y divide-slate-100">
                            {searchResults.length === 0 ? (
                              <div className="p-4 text-center text-xs text-slate-400">
                                {searching ? 'Searching Silicon students...' : 'No Silicon students found matching query.'}
                              </div>
                            ) : (
                              searchResults.map((cand) => {
                                const alreadyAdded = teamMembers.some(
                                  (m) => m.email.toLowerCase() === cand.email.toLowerCase()
                                );
                                return (
                                  <div
                                    key={cand.id}
                                    className="p-3 hover:bg-slate-50 flex items-center justify-between gap-3 text-xs"
                                  >
                                    <div className="min-w-0">
                                      <div className="font-bold text-slate-900 truncate">{cand.name}</div>
                                      <div className="text-[11px] text-slate-500 font-mono truncate">
                                        {cand.email}
                                      </div>
                                    </div>

                                    {alreadyAdded ? (
                                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">
                                        Added ✓
                                      </span>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleSelectTeammate(cand)}
                                        className="px-3 py-1 bg-[#034694] hover:bg-[#02336e] text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1 shrink-0"
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>Invite to Team</span>
                                      </button>
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>

                      {/* ADDED TEAMMATES ROSTER WITH INVITATION NOTICE */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                          Team Members Roster ({1 + teamMembers.length} Members Total)
                        </label>

                        {teamMembers.length === 0 ? (
                          <div className="p-5 border border-dashed border-slate-200 rounded-2xl text-center space-y-1 bg-slate-50/50">
                            <p className="text-xs font-semibold text-slate-600">No additional teammates added yet</p>
                            <p className="text-[11px] text-slate-400">
                              Use the search bar above to look up enrolled Silicon students and invite them.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {teamMembers.map((member, idx) => (
                              <div
                                key={idx}
                                className="p-3 sm:p-3.5 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 text-xs"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-xs shrink-0">
                                    {idx + 2}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-bold text-slate-900 truncate">{member.name}</div>
                                    <div className="text-[11px] text-slate-500 font-mono truncate">
                                      {member.email}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                    <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                                    <span className="hidden sm:inline">Invitation Request will be Sent</span>
                                    <span className="sm:hidden">Invite Pending</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveTeammate(idx)}
                                    className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors"
                                    title="Remove from Team"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-start gap-2">
                          <Bell className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <span>
                            <strong>Team Confirmation Policy</strong>: When you submit this team registration, an official confirmation request will be delivered to each teammate. Once they confirm, they are locked into the official roster.
                          </span>
                        </div>
                      </div>

                      {/* Confirm Team Registration Button */}
                      <button
                        type="button"
                        onClick={handleRegister}
                        disabled={submitting || isClosed || Boolean(activeRegistration)}
                        className={`w-full py-4 font-black text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 ${
                          activeRegistration
                            ? 'bg-emerald-50 text-emerald-800 border-2 border-emerald-300 cursor-not-allowed opacity-90'
                            : 'bg-[#034694] hover:bg-[#02336e] disabled:bg-slate-300 text-white'
                        }`}
                      >
                        {activeRegistration ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            <span>
                              {event.userRegistration.teamName
                                ? `Team "${event.userRegistration.teamName}" Registered`
                                : 'Already Registered'} &bull; Disabled
                            </span>
                          </>
                        ) : submitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Registering Team &amp; Sending Invites...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>Confirm Team &amp; Send Invitations &bull; {event.entryFee || 'Free Entry'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Sticky Event Overview Card (4 cols) */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xs space-y-5 p-6">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#034694] bg-[#034694]/10 px-2.5 py-1 rounded-full">
                  {event.club?.name || 'Silicon West Club'}
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  {event.entryFee || 'Free'}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  {event.category || 'Campus Activity'}
                </span>
                <h3 className="text-lg font-bold text-slate-900 leading-snug mt-0.5">
                  {event.title}
                </h3>
              </div>

              <div className="space-y-3 text-xs text-slate-600 pt-1">
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-[#034694] shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-semibold text-slate-800">Date &amp; Schedule</span>
                    <span>
                      {startDate.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="block text-[11px] text-slate-400">
                      {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} onwards
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[#034694] shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-semibold text-slate-800">Venue &amp; Reporting</span>
                    <span>{event.venue || 'Silicon West Campus'}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-[#034694] shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-semibold text-slate-800">Registration Deadline</span>
                    <span>
                      {deadlineDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })},{' '}
                      {deadlineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users className="w-4 h-4 text-[#034694] shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-semibold text-slate-800">Team Format</span>
                    <span>
                      {event.isTeamEvent ? `Team Event (${minTeamSize} - ${maxTeamSize} Members)` : 'Individual Solo'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider">
                  Important Guidelines
                </span>
                <ul className="space-y-1.5 text-slate-600 text-[11px]">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Participation strictly requires Silicon student identity.</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Teammates receive confirmation requests to accept.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
