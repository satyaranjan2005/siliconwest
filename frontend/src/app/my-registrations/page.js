'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  BookmarkCheck,
  Calendar,
  MapPin,
  Clock,
  ArrowRight,
  XCircle,
  AlertCircle,
  ExternalLink,
  Users,
  Bell,
  Check,
  X,
  Loader2,
  Ticket,
  Printer,
  Copy,
  CheckCircle2,
  GraduationCap,
  Building2,
  Phone,
  Mail,
  Hash,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Share2,
} from 'lucide-react';
import { registrationsApi, invitationsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export function getCodedPass(reg) {
  if (reg?.passCode) return reg.passCode;
  const id = reg?.id || '';
  const year = new Date(reg?.registeredAt || Date.now()).getFullYear() || 2026;
  const clean = id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase();
  return `SW-PASS-${year}-${clean || '000000'}`;
}

function MyRegistrationsContent() {
  const searchParams = useSearchParams();
  const registeredHighlightId = searchParams.get('registered') || '';

  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [respondingInviteId, setRespondingInviteId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [passModalReg, setPassModalReg] = useState(null);
  const [expandedRegs, setExpandedRegs] = useState({});
  const [resendingPassId, setResendingPassId] = useState(null);
  const [resendSuccess, setResendSuccess] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [regData, invData] = await Promise.all([
        registrationsApi.getMy().catch(() => []),
        invitationsApi.getMy().catch(() => []),
      ]);
      const list = Array.isArray(regData) ? regData : [];
      setRegistrations(list);
      setInvitations(Array.isArray(invData) ? invData : []);

      // If registered highlight ID is present, expand it by default
      if (registeredHighlightId) {
        setExpandedRegs((prev) => ({ ...prev, [registeredHighlightId]: true }));
        const match = list.find((r) => r.id === registeredHighlightId);
        if (match) {
          setPassModalReg(match);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load personal registrations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      setLoading(false);
      return;
    }
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, authLoading]);

  const toggleExpand = (id) => {
    setExpandedRegs((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopy = (text, id, e) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRespondInvitation = async (id, action) => {
    setRespondingInviteId(id);
    try {
      await invitationsApi.respond(id, action);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to update invitation.');
    } finally {
      setRespondingInviteId(null);
    }
  };

  const pendingInvites = invitations.filter((i) => i.status === 'PENDING');

  const handleCancelRegistration = async (id) => {
    if (!window.confirm('Are you sure you want to cancel your registration for this event?')) {
      return;
    }
    setCancellingId(id);
    try {
      await registrationsApi.cancel(id);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to cancel registration.');
    } finally {
      setCancellingId(null);
    }
  };

  const handlePrintPass = () => {
    window.print();
  };

  const handleResendPass = async (id) => {
    try {
      setResendingPassId(id);
      const res = await registrationsApi.resendPass(id);
      setResendSuccess(res.message || 'Pass dispatched to your registered email.');
      setTimeout(() => setResendSuccess(null), 4000);
    } catch (err) {
      alert(err.message || 'Failed to dispatch admission pass.');
    } finally {
      setResendingPassId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="w-10 h-10 border-4 border-[#034694] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-4 shadow-sm">
          <BookmarkCheck className="w-12 h-12 text-[#034694] mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Sign In to View Registrations</h2>
          <p className="text-xs text-slate-500">
            Please sign in with your student account to view your complete registrations and event passes.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/login"
              className="py-2.5 bg-[#034694] text-white font-bold text-xs rounded-xl"
            >
              Sign In to Portal
            </Link>
            <Link
              href="/events"
              className="py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
            >
              Browse Campus Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-6 sm:py-12 px-3 sm:px-8">
      <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
        {/* Top Header Banner */}
        <div className="bg-white rounded-2xl p-5 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#034694] uppercase tracking-wider">
              <BookmarkCheck className="w-4 h-4" />
              <span>Participant Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              My Event Registrations
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified registrations &amp; event entry passes for{' '}
              <span className="font-semibold text-slate-800">{user?.email}</span>
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => loadData()}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-2xs flex items-center gap-1.5"
            >
              <span>Refresh</span>
            </button>
            <Link
              href="/events"
              className="bg-[#034694] hover:bg-blue-900 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shrink-0 flex items-center gap-1.5 shadow-2xs"
            >
              <span>Find More Events</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Highlight notification if coming from a fresh registration */}
        {registeredHighlightId && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold">Registration Confirmed!</h4>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Your event pass has been generated. All details, roster info, and pass code are available below.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg shrink-0">
              Pass Active
            </span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* PENDING TEAM INVITATIONS */}
        {pendingInvites.length > 0 && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                <Bell className="w-4 h-4 text-amber-600 animate-bounce" />
                <span>Pending Team Invitations ({pendingInvites.length})</span>
              </div>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-200/70 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Action Required
              </span>
            </div>
            <p className="text-xs text-slate-600">
              You have been invited by team leaders to participate in campus events. Confirm your participation below to claim your seat on the official team roster.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {pendingInvites.map((inv) => (
                <div
                  key={inv.id}
                  className="bg-white rounded-xl border border-amber-200 p-4 space-y-3 shadow-2xs"
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#034694] bg-[#034694]/10 px-2 py-0.5 rounded">
                      {inv.event?.title || 'Campus Event'}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">
                      Team &ldquo;{inv.teamName}&rdquo;
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Invited by <strong>{inv.inviterName}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={respondingInviteId === inv.id}
                      onClick={() => handleRespondInvitation(inv.id, 'ACCEPT')}
                      className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      {respondingInviteId === inv.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>Accept &amp; Join Team</span>
                    </button>

                    <button
                      type="button"
                      disabled={respondingInviteId === inv.id}
                      onClick={() => handleRespondInvitation(inv.id, 'DECLINE')}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REGISTRATIONS LIST */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((n) => (
              <div key={n} className="h-44 bg-white rounded-2xl border border-slate-200 animate-pulse"></div>
            ))}
          </div>
        ) : registrations.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3 shadow-xs">
            <BookmarkCheck className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No Registrations Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You haven&apos;t registered for any campus events yet. Explore upcoming competitions, workshops, and sports tournaments!
            </p>
            <Link
              href="/events"
              className="inline-block mt-3 px-5 py-2.5 bg-[#034694] text-white text-xs font-bold rounded-xl shadow-sm hover:bg-[#02336e] transition-colors"
            >
              Explore Events Hub
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {registrations.map((reg) => {
              const event = reg.event || {};
              const isConfirmed = reg.status === 'CONFIRMED';
              const startDate = new Date(event.startsAt);
              const isHighlighted = reg.id === registeredHighlightId;
              const isExpanded = expandedRegs[reg.id] !== false; // default open for full visibility
              const isTeam = Boolean(reg.teamName);

              // Extract team members
              const teammates = Array.isArray(reg.teamInvitations) && reg.teamInvitations.length > 0
                ? reg.teamInvitations
                : Array.isArray(reg.teamMembers)
                ? reg.teamMembers
                : [];

              const sicDisplay = reg.rollNumber || reg.participantUser?.sicNo || 'N/A';
              const deptDisplay = reg.branch || reg.participantUser?.department || 'N/A';
              const yearDisplay = reg.year || 'N/A';

              return (
                <div
                  key={reg.id}
                  id={`reg-${reg.id}`}
                  className={`bg-white rounded-2xl border transition-all shadow-xs overflow-hidden ${
                    isHighlighted
                      ? 'border-[#034694] ring-2 ring-[#034694]/20'
                      : 'border-slate-200/90 hover:border-slate-300'
                  }`}
                >
                  {/* Top Bar / Header Stripe */}
                  <div className="p-5 sm:p-6 bg-slate-50/70 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Status Badge */}
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                            isConfirmed
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200 line-through'
                          }`}
                        >
                          {reg.status}
                        </span>

                        {/* Role in Event Badge */}
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                            reg.roleInEvent === 'Team Leader'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : reg.roleInEvent === 'Team Member'
                              ? 'bg-blue-50 text-[#034694] border border-blue-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {reg.roleInEvent || (isTeam ? 'Team Member' : 'Individual Pass')}
                        </span>

                        {/* Organizing Club */}
                        {event.club?.name && (
                          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                            • {event.club.name}
                          </span>
                        )}

                        {/* Team Name Badge */}
                        {reg.teamName && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#034694] bg-blue-50/80 border border-blue-200/60 px-2 py-0.5 rounded-md">
                            <Users className="w-3 h-3 text-[#034694]" />
                            <span>Team: {reg.teamName}</span>
                          </span>
                        )}
                      </div>

                      {/* Event Title */}
                      <Link
                        href={`/events/${event.slug}`}
                        className="text-lg sm:text-xl font-bold text-slate-900 hover:text-[#034694] transition-colors block leading-snug truncate"
                      >
                        {event.title}
                      </Link>

                      {/* Event Date & Location */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-0.5">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {startDate.toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{event.venue || 'Silicon West Innovation Campus'}</span>
                        </span>
                      </div>
                    </div>

                    {/* Header Right Actions */}
                    <div className="flex items-center gap-2 shrink-0 self-stretch sm:self-auto justify-between sm:justify-end">
                      <button
                        type="button"
                        onClick={() => setPassModalReg(reg)}
                        className="px-3.5 py-2 bg-[#034694] hover:bg-[#02336e] text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
                      >
                        <Ticket className="w-3.5 h-3.5" />
                        <span>View Pass</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleExpand(reg.id)}
                        className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-colors"
                        title={isExpanded ? 'Collapse Details' : 'Expand Complete Registration'}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* COMPLETE REGISTRATION DETAILS (Expanded View) */}
                  {isExpanded && (
                    <div className="p-5 sm:p-6 space-y-6">
                      {/* Section 1: Registered Participant Profile Card */}
                      <div>
                        <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                            <GraduationCap className="w-4 h-4 text-[#034694]" />
                            <span>Registered Student Profile</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                            <span>Pass:</span>
                            <span className="font-bold text-[#034694]">{getCodedPass(reg)}</span>
                            <button
                              type="button"
                              onClick={(e) => handleCopy(getCodedPass(reg), reg.id, e)}
                              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition-colors"
                              title="Copy Coded Pass Number"
                            >
                              {copiedId === reg.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Information Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                          <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-100">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              Participant Name
                            </span>
                            <span className="text-xs font-bold text-slate-900 mt-0.5 block truncate">
                              {reg.participantName}
                            </span>
                          </div>

                          <div className="bg-blue-50/50 rounded-xl p-3 border border-blue-100/60">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#034694] block">
                              SIC No (Student ID)
                            </span>
                            <span className="text-xs font-mono font-bold text-[#034694] mt-0.5 block">
                              {sicDisplay}
                            </span>
                          </div>

                          <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-100">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              Department / Branch
                            </span>
                            <span className="text-xs font-semibold text-slate-800 mt-0.5 block truncate">
                              {deptDisplay}
                            </span>
                          </div>

                          <div className="bg-emerald-50/40 rounded-xl p-3 border border-emerald-100/60">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                              Academic Year
                            </span>
                            <span className="text-xs font-bold text-emerald-700 mt-0.5 block">
                              {yearDisplay}
                            </span>
                          </div>

                          <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-100">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              Email Address
                            </span>
                            <span className="text-xs font-mono text-slate-700 mt-0.5 block truncate">
                              {reg.participantEmail}
                            </span>
                          </div>

                          <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-100">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              Phone Number
                            </span>
                            <span className="text-xs text-slate-700 mt-0.5 block">
                              {reg.phone || 'Not provided'}
                            </span>
                          </div>

                          <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-100 sm:col-span-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              Institution
                            </span>
                            <span className="text-xs text-slate-700 mt-0.5 block truncate">
                              {reg.collegeName || 'Silicon Institute of Technology, Sambalpur'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Complete Team Roster (If Team Event) */}
                      {isTeam && (
                        <div>
                          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                              <Users className="w-4 h-4 text-[#034694]" />
                              <span>Team Roster &bull; {reg.teamName}</span>
                            </div>
                            <span className="text-[11px] font-bold text-[#034694] bg-blue-50 px-2 py-0.5 rounded-full">
                              {1 + teammates.length} Total Members
                            </span>
                          </div>

                          <div className="overflow-x-auto rounded-xl border border-slate-200">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200">
                                <tr>
                                  <th className="py-2.5 px-3">Role</th>
                                  <th className="py-2.5 px-3">Name</th>
                                  <th className="py-2.5 px-3">SIC / ID</th>
                                  <th className="py-2.5 px-3">Department</th>
                                  <th className="py-2.5 px-3">Email</th>
                                  <th className="py-2.5 px-3 text-center">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {/* Leader Row */}
                                <tr className="bg-purple-50/30">
                                  <td className="py-2.5 px-3 font-bold text-purple-700">
                                    <span className="px-2 py-0.5 bg-purple-100 rounded text-[10px]">Team Leader</span>
                                  </td>
                                  <td className="py-2.5 px-3 font-bold text-slate-900">{reg.participantName}</td>
                                  <td className="py-2.5 px-3 font-mono font-bold text-[#034694]">{sicDisplay}</td>
                                  <td className="py-2.5 px-3 text-slate-700">{deptDisplay}</td>
                                  <td className="py-2.5 px-3 text-slate-500 font-mono">{reg.participantEmail}</td>
                                  <td className="py-2.5 px-3 text-center">
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                                      CONFIRMED
                                    </span>
                                  </td>
                                </tr>

                                {/* Teammates Rows */}
                                {teammates.map((tm, idx) => {
                                  const name = tm.inviteeName || tm.name || 'Teammate';
                                  const email = tm.inviteeEmail || tm.email || 'N/A';
                                  const tmSic = tm.invitee?.sicNo || tm.sic || tm.rollNumber || 'N/A';
                                  const tmDept = tm.invitee?.department || tm.branch || 'N/A';
                                  const tmStatus = tm.status || 'PENDING';

                                  return (
                                    <tr key={idx} className="hover:bg-slate-50/50">
                                      <td className="py-2.5 px-3 text-slate-500 font-medium">
                                        Member {idx + 2}
                                      </td>
                                      <td className="py-2.5 px-3 font-semibold text-slate-800">{name}</td>
                                      <td className="py-2.5 px-3 font-mono text-slate-700">{tmSic}</td>
                                      <td className="py-2.5 px-3 text-slate-600">{tmDept}</td>
                                      <td className="py-2.5 px-3 text-slate-500 font-mono">{email}</td>
                                      <td className="py-2.5 px-3 text-center">
                                        <span
                                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                            tmStatus === 'ACCEPTED' || tmStatus === 'CONFIRMED'
                                              ? 'bg-emerald-100 text-emerald-700'
                                              : 'bg-amber-100 text-amber-800'
                                          }`}
                                        >
                                          {tmStatus}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Card Footer: Metadata & Action Buttons */}
                      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                          <span>Registered on:</span>
                          <span className="font-semibold text-slate-700">
                            {new Date(reg.registeredAt).toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Link
                            href={`/events/${event.slug}`}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold transition-colors flex items-center gap-1"
                          >
                            <span>Event Page</span>
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </Link>

                          {isConfirmed && reg.isLeader !== false && (
                            <button
                              type="button"
                              onClick={() => handleCancelRegistration(reg.id)}
                              disabled={cancellingId === reg.id}
                              className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold transition-colors disabled:opacity-50"
                            >
                              {cancellingId === reg.id ? 'Cancelling...' : 'Cancel Registration'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* OFFICIAL SILICON WEST ENTRY PASS MODAL */}
        {passModalReg && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:p-0 print:bg-white animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-200 print:border-none print:shadow-none flex flex-col max-h-[92vh]">
              {/* Modal Header Controls (hidden on print) */}
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                  <Ticket className="w-4 h-4" />
                  <span>Official Entry Ticket</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrintPass}
                    className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Pass</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPassModalReg(null)}
                    className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Printable Ticket Area */}
              <div className="p-6 sm:p-8 space-y-6 overflow-y-auto">
                {/* Header Ticket Banner */}
                <div className="bg-[#034694] p-6 rounded-2xl text-white relative overflow-hidden">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-bold tracking-widest uppercase text-amber-300 block">
                        Silicon Institute of Technology &bull; Silicon West Campus
                      </span>
                      <h2 className="text-xl sm:text-2xl font-black mt-1 leading-tight">
                        {passModalReg.event?.title}
                      </h2>
                      <span className="text-xs text-blue-100 mt-1 block">
                        Organized by {passModalReg.event?.club?.name || 'Silicon West Student Affairs'}
                      </span>
                    </div>
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0 border border-white/20">
                      <Ticket className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>

                {/* Event Schedule & Location */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Date &amp; Time
                    </span>
                    <div className="font-bold text-slate-800">
                      {new Date(passModalReg.event?.startsAt).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      {new Date(passModalReg.event?.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Reporting Venue
                    </span>
                    <div className="font-bold text-slate-800">
                      {passModalReg.event?.venue || 'Campus Innovation Lab'}
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      Silicon West Campus
                    </div>
                  </div>
                </div>

                {/* Participant Details */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#034694] block">
                    Participant Credentials
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Name</span>
                      <span className="font-bold text-slate-900">{passModalReg.participantName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">SIC No</span>
                      <span className="font-mono font-bold text-[#034694]">
                        {passModalReg.rollNumber || passModalReg.participantUser?.sicNo || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Department</span>
                      <span className="font-medium text-slate-800">
                        {passModalReg.branch || passModalReg.participantUser?.department || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Academic Year</span>
                      <span className="font-bold text-emerald-700">
                        {passModalReg.year || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Official Email</span>
                      <span className="font-mono text-slate-600 truncate block">
                        {passModalReg.participantEmail}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Phone</span>
                      <span className="text-slate-700">{passModalReg.phone || 'N/A'}</span>
                    </div>
                  </div>

                  {passModalReg.teamName && (
                    <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Registered Team</span>
                        <span className="font-bold text-[#034694]">{passModalReg.teamName}</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                        {passModalReg.roleInEvent || 'Team Member'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Pass Code / QR / Verification Stamp */}
                <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 block">
                        Official Coded Pass Number
                      </span>
                      <div className="font-mono text-base sm:text-lg font-black text-amber-400 tracking-wider">
                        {getCodedPass(passModalReg)}
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Present this pass along with your physical College ID card at entry.
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded-xl shrink-0">
                      <div className="w-12 h-12 bg-slate-900 rounded-lg p-1 flex flex-col justify-between">
                        <div className="flex justify-between">
                          <div className="w-2.5 h-2.5 bg-white rounded-2xs" />
                          <div className="w-2.5 h-2.5 bg-white rounded-2xs" />
                        </div>
                        <div className="w-2 h-2 bg-amber-400 mx-auto rounded-full" />
                        <div className="flex justify-between">
                          <div className="w-2.5 h-2.5 bg-white rounded-2xs" />
                          <div className="w-2.5 h-2.5 bg-white rounded-2xs self-end" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono text-slate-500 truncate">
                      UUID: {passModalReg.id}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleResendPass(passModalReg.id)}
                      disabled={resendingPassId === passModalReg.id}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800 text-amber-300 text-[11px] font-semibold rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
                    >
                      <Mail className="w-3 h-3" />
                      <span>{resendingPassId === passModalReg.id ? 'Sending...' : 'Send Pass to Email'}</span>
                    </button>
                  </div>

                  {resendSuccess && (
                    <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-[11px] font-medium text-center">
                      {resendSuccess}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MyRegistrationsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
          <div className="w-10 h-10 border-4 border-[#034694] border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <MyRegistrationsContent />
    </Suspense>
  );
}
