'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
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
} from 'lucide-react';
import { registrationsApi, invitationsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function MyRegistrationsPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [respondingInviteId, setRespondingInviteId] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [regData, invData] = await Promise.all([
        registrationsApi.getMy().catch(() => []),
        invitationsApi.getMy().catch(() => []),
      ]);
      setRegistrations(regData || []);
      setInvitations(invData || []);
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
      await loadRegistrations();
    } catch (err) {
      alert(err.message || 'Failed to cancel registration.');
    } finally {
      setCancellingId(null);
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
            Please sign in with your student or participant account to view your confirmed event passes.
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
              Confirmed event bookings for <span className="font-semibold text-slate-800">{user.email}</span>
            </p>
          </div>

          <Link
            href="/events"
            className="bg-[#034694] hover:bg-blue-900 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shrink-0"
          >
            Find More Events
          </Link>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* PENDING TEAM INVITATIONS & CONFIRMATIONS */}
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
                      <span>Accept &amp; Join</span>
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

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((n) => (
              <div key={n} className="h-32 bg-white rounded-2xl border border-slate-200 animate-pulse"></div>
            ))}
          </div>
        ) : registrations.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
            <BookmarkCheck className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No Registrations Found</h3>
            <p className="text-xs text-slate-500">
              You haven&apos;t registered for any events yet. Check out the upcoming events schedule!
            </p>
            <Link
              href="/events"
              className="inline-block mt-3 px-5 py-2.5 bg-[#034694] text-white text-xs font-bold rounded-xl shadow-sm"
            >
              Explore Events Hub
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {registrations.map((reg) => {
              const event = reg.event;
              const isConfirmed = reg.status === 'CONFIRMED';
              const startDate = new Date(event.startsAt);

              return (
                <div
                  key={reg.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                          isConfirmed
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500 line-through'
                        }`}
                      >
                        {reg.status}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        • {event.club?.name}
                      </span>
                      {reg.teamName && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#034694] bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-md">
                          <Users className="w-3 h-3" />
                          Team: {reg.teamName}
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/events/${event.slug}`}
                      className="text-lg font-bold text-slate-900 hover:text-[#034694] transition-colors block"
                    >
                      {event.title}
                    </Link>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{startDate.toLocaleDateString()}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{event.venue || 'Campus Venue'}</span>
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Ref: {reg.id.slice(0, 8)}...
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-stretch sm:self-auto justify-between sm:justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <Link
                      href={`/events/${event.slug}`}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                    >
                      View Event
                    </Link>

                    {isConfirmed && (
                      <button
                        onClick={() => handleCancelRegistration(reg.id)}
                        disabled={cancellingId === reg.id}
                        className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors disabled:opacity-50"
                      >
                        {cancellingId === reg.id ? 'Cancelling...' : 'Cancel Registration'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
