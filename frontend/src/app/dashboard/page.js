'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Calendar,
  Users,
  BookmarkCheck,
  TrendingUp,
  ArrowRight,
  Plus,
  Loader2,
  Clock,
  MapPin,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  Shield,
} from 'lucide-react';
import { statsApi, eventsApi, clubsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function DashboardOverviewPage() {
  const { user, isSuperAdmin, isClubAdmin } = useAuth();

  const [stats, setStats] = useState(null);
  const [recentRegistrations, setRecentRegistrations] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOverview() {
      setLoading(true);
      try {
        const [statsData, clubsData, eventsData] = await Promise.all([
          statsApi.getDashboard().catch(() => ({})),
          clubsApi.list({ includeArchived: 'false' }).catch(() => []),
          eventsApi.list({ allStatuses: 'true' }).catch(() => []),
        ]);

        setStats(statsData?.metrics || {});
        setRecentRegistrations(statsData?.recentRegistrations || []);
        setClubs(Array.isArray(clubsData) ? clubsData : []);
        setEvents(Array.isArray(eventsData) ? eventsData : []);
      } catch (err) {
        console.error('Failed to load overview metrics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadOverview();
  }, []);

  const managedClubs = isSuperAdmin
    ? clubs
    : clubs.filter((c) =>
        (user?.assignedClubs || []).some((ac) => ac.id === c.id || ac.slug === c.slug)
      );

  const upcomingEvents = events.filter(
    (e) => e.status === 'PUBLISHED' && new Date(e.startsAt) >= new Date()
  );

  const totalCapacity = upcomingEvents.reduce((acc, curr) => acc + (curr.capacity || 0), 0);
  const totalConfirmed = upcomingEvents.reduce(
    (acc, curr) => acc + (curr.confirmedRegistrationsCount || 0),
    0
  );
  const occupancyPercent =
    totalCapacity > 0 ? Math.min(100, Math.round((totalConfirmed / totalCapacity) * 100)) : 85;

  return (
    <div className="space-y-8">
      {/* 1. Header Welcome Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#034694] bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full">
              Operations Console
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">
              {isSuperAdmin ? 'Super Administrator Access' : 'Club Administrator Access'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Welcome back, {user?.name || 'Administrator'}
          </h1>

          <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
            {isSuperAdmin
              ? 'Oversee campus societies, schedule upcoming hackathons, review student applications, and monitor capacity.'
              : `Managing activity operations and participant rosters for: ${
                  managedClubs.map((c) => c.name).join(', ') || 'Your Assigned Society'
                }`}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 self-stretch sm:self-auto shrink-0">
          {isSuperAdmin && (
            <Link
              href="/dashboard/events/new"
              className="inline-flex items-center gap-1.5 bg-[#034694] hover:bg-[#023168] text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-2xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Event</span>
            </Link>
          )}

          {isSuperAdmin && (
            <Link
              href="/dashboard/clubs/new"
              className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold px-4 py-2 rounded-xl transition-colors shadow-2xs"
            >
              <Building2 className="w-3.5 h-3.5 text-[#034694]" />
              <span>Add Society</span>
            </Link>
          )}

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs font-semibold px-3 py-2 rounded-xl transition-colors shadow-2xs"
            title="Open Public Portal"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Portal</span>
          </Link>
        </div>
      </div>

      {/* 2. Key Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Metric 1 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-5 shadow-2xs space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {isSuperAdmin ? 'Active Clubs' : 'Managed Clubs'}
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-50 text-[#034694] flex items-center justify-center shrink-0">
              <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {isSuperAdmin ? clubs.filter((c) => !c.isArchived).length : managedClubs.length}
            </div>
            <Link
              href="/dashboard/clubs"
              className="text-[10px] sm:text-[11px] text-[#034694] hover:underline font-semibold flex items-center gap-1 mt-1 truncate"
            >
              <span className="truncate">{isSuperAdmin ? 'View all societies' : 'View club profile'}</span>
              <ArrowRight className="w-3 h-3 shrink-0" />
            </Link>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-5 shadow-2xs space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Upcoming Events
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {upcomingEvents.length}
            </div>
            <Link
              href="/dashboard/events"
              className="text-[10px] sm:text-[11px] text-[#034694] hover:underline font-semibold flex items-center gap-1 mt-1 truncate"
            >
              <span className="truncate">{events.length} total recorded</span>
              <ArrowRight className="w-3 h-3 shrink-0" />
            </Link>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-5 shadow-2xs space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Registrations
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
              <BookmarkCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {stats?.totalRegistrations ?? totalConfirmed}
            </div>
            <Link
              href="/dashboard/registrations"
              className="text-[10px] sm:text-[11px] text-[#034694] hover:underline font-semibold flex items-center gap-1 mt-1 truncate"
            >
              <span className="truncate">Manage roster</span>
              <ArrowRight className="w-3 h-3 shrink-0" />
            </Link>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-5 shadow-2xs space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Occupancy Rate
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {occupancyPercent}%
            </div>
            <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-slate-500 mt-1 truncate">
              <span className="truncate">{totalConfirmed} of {totalCapacity || 100} seats</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-[#034694] h-1.5 rounded-full"
                style={{ width: `${occupancyPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Operational Grid: Upcoming Events + Recent Registrations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Scheduled Events (7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Scheduled Campus Events</h3>
                <p className="text-xs text-slate-500">Upcoming workshops, hackathons &amp; galas</p>
              </div>
              <Link
                href="/dashboard/events"
                className="text-xs font-semibold text-[#034694] hover:underline flex items-center gap-1"
              >
                <span>View Hub</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="py-12 text-center flex justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-[#034694]" />
              </div>
            ) : upcomingEvents.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-500">
                No upcoming events scheduled right now.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {upcomingEvents.slice(0, 5).map((ev) => {
                  const startDate = new Date(ev.startsAt);
                  const isFull = ev.capacity && ev.confirmedRegistrationsCount >= ev.capacity;

                  return (
                    <div
                      key={ev.id}
                      className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                          <span className="font-semibold text-slate-700">{ev.club?.name}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {startDate.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                          {ev.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-900 block">
                            {ev.confirmedRegistrationsCount ?? ev._count?.registrations ?? 0}{' '}
                            <span className="text-slate-400 font-normal">
                              / {ev.capacity || 'Open'}
                            </span>
                          </span>
                          <span
                            className={`text-[10px] font-semibold ${
                              isFull ? 'text-rose-600' : 'text-emerald-700'
                            }`}
                          >
                            {isFull ? 'Full' : 'Open'}
                          </span>
                        </div>

                        <Link
                          href={`/events/${ev.slug}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#034694] hover:bg-slate-100 transition-colors"
                          title="View Live Event Page"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-3.5 bg-slate-50/70 border-t border-slate-100 text-center">
            <Link
              href="/dashboard/events"
              className="text-xs font-semibold text-[#034694] hover:underline"
            >
              Manage all event schedules &amp; deadlines →
            </Link>
          </div>
        </div>

        {/* Right Column: Recent Student Registrations (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Recent Registrations</h3>
                <p className="text-xs text-slate-500">Live student enrollments</p>
              </div>
              <Link
                href="/dashboard/registrations"
                className="text-xs font-semibold text-[#034694] hover:underline flex items-center gap-1"
              >
                <span>Roster</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="py-12 text-center flex justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-[#034694]" />
              </div>
            ) : recentRegistrations.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-500">
                No recent registrations recorded.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentRegistrations.slice(0, 5).map((reg) => (
                  <div
                    key={reg.id}
                    className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                  >
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 text-xs truncate">
                          {reg.participantName || reg.user?.name || 'Student Participant'}
                        </span>
                        {reg.rollNumber && (
                          <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded font-mono">
                            {reg.rollNumber}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">
                        {reg.event?.title || 'Campus Event'}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.2 rounded">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Confirmed</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3.5 bg-slate-50/70 border-t border-slate-100 text-center">
            <Link
              href="/dashboard/registrations"
              className="text-xs font-semibold text-[#034694] hover:underline"
            >
              Export attendance sheets &amp; passes →
            </Link>
          </div>
        </div>
      </div>

      {/* 4. Active Campus Societies Snapshot */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recognized Student Societies</h3>
            <p className="text-xs text-slate-500">Clubs directory and leadership rosters</p>
          </div>
          <Link
            href="/dashboard/clubs"
            className="text-xs font-semibold text-[#034694] hover:underline flex items-center gap-1"
          >
            <span>Manage All Clubs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          {managedClubs.slice(0, 3).map((club) => (
            <div key={club.id} className="p-5 space-y-3 hover:bg-slate-50/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 p-1 shrink-0 overflow-hidden flex items-center justify-center">
                  {club.logoUrl ? (
                    <img
                      src={club.logoUrl}
                      alt={club.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Building2 className="w-5 h-5 text-[#034694]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                    {club.name}
                  </h4>
                  <span className="text-[10px] font-semibold text-[#034694] bg-blue-50 px-2 py-0.5 rounded">
                    {club.category || 'General'}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                {club.shortDescription || club.description}
              </p>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500">
                  {club.secretary ? `Secretary: ${club.secretary}` : 'Active Community'}
                </span>
                <Link
                  href={`/clubs/${club.slug}`}
                  className="text-xs font-semibold text-[#034694] hover:underline flex items-center gap-1"
                >
                  <span>Profile</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
