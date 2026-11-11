'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Plus,
  Search,
  ExternalLink,
  Download,
  Loader2,
  Building,
  CheckCircle2,
  Edit3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { eventsApi, clubsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function DashboardEventsPage() {
  const { user, isSuperAdmin, isClubAdmin } = useAuth();

  const [events, setEvents] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const managedClubs = isSuperAdmin
    ? clubs
    : clubs.filter((c) =>
        (user?.assignedClubs || []).some((ac) => ac.id === c.id || ac.slug === c.slug)
      );

  const loadData = async () => {
    setLoading(true);
    try {
      const [eventsData, clubsData] = await Promise.all([
        eventsApi.list({ allStatuses: 'true' }).catch(() => []),
        clubsApi.list({ includeArchived: 'false' }).catch(() => []),
      ]);
      setEvents(eventsData || []);
      setClubs(clubsData || []);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDownloadCsv = async (event, teamFormat = 'roster') => {
    try {
      const blob = await eventsApi.downloadExport(event.id, { teamFormat });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cleanTitle = (event.title || event.slug || 'Event').replace(/[^a-z0-9]/gi, '_');
      const suffix = event.isTeamEvent ? (teamFormat === 'columns' ? 'TeamResponses' : 'TeamRoster') : 'Responses';
      a.download = `${cleanTitle}_${suffix}.xls`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert(err.message || 'Export failed');
    }
  };

  const filteredEvents = events.filter((ev) => {
    const matchesSearch =
      ev.title?.toLowerCase().includes(search.toLowerCase()) ||
      ev.club?.name?.toLowerCase().includes(search.toLowerCase()) ||
      ev.venue?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || ev.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Events Hub &amp; Hackathons
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Platform-wide event operations, participant rosters, and scheduling across all campus societies.
          </p>
        </div>

        {isSuperAdmin && (
          <Link
            href="/dashboard/events/new"
            className="inline-flex items-center justify-center gap-2 bg-[#034694] hover:bg-[#023168] text-white font-bold text-xs h-10 px-4 rounded-xl shadow-xs transition-colors w-full sm:w-auto shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Event</span>
          </Link>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events by title, organizing club, or venue..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#034694]/20"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#034694]/20"
        >
          <option value="ALL">All Statuses</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Events Table Card */}
      <Card className="overflow-hidden border-slate-200 shadow-xs">
        <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between py-4 px-6">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900">
              Scheduled Events ({filteredEvents.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Live registration tracking and attendance export
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#034694]" />
              <p className="text-xs font-semibold text-slate-500">Loading events...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">No events found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {search ? 'Try adjusting your search criteria.' : 'Create an event for students to participate.'}
                </p>
              </div>
              {isSuperAdmin && (
                <Link
                  href="/dashboard/events/new"
                  className="inline-flex items-center gap-1.5 bg-[#034694] hover:bg-[#023168] text-white font-bold text-xs h-9 px-4 rounded-xl shadow-xs"
                >
                  <Plus className="w-4 h-4 mr-0.5" />
                  <span>Create Event</span>
                </Link>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80">
                  <TableHead className="font-bold text-slate-700 text-xs">Event Name</TableHead>
                  <TableHead className="font-bold text-slate-700 text-xs">Organizing Club</TableHead>
                  <TableHead className="font-bold text-slate-700 text-xs">Date & Time</TableHead>
                  <TableHead className="font-bold text-slate-700 text-xs">Registrations</TableHead>
                  <TableHead className="font-bold text-slate-700 text-xs">Status</TableHead>
                  <TableHead className="font-bold text-slate-700 text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((event) => (
                  <TableRow key={event.id} className="hover:bg-slate-50/60 transition-colors">
                    <TableCell>
                      <span className="font-bold text-slate-900 block leading-snug">{event.title}</span>
                      <span className="text-[11px] text-slate-400 font-mono">/events/{event.slug}</span>
                    </TableCell>

                    <TableCell>
                      <span className="font-semibold text-slate-800 text-xs">{event.club?.name || 'College'}</span>
                    </TableCell>

                    <TableCell className="text-xs text-slate-600">
                      <div>{new Date(event.startsAt).toLocaleDateString()}</div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(event.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="font-bold text-slate-900 text-xs">
                        {event._count?.registrations ?? 0}
                      </span>
                      {event.capacity ? (
                        <span className="text-[11px] text-slate-400"> / {event.capacity} max</span>
                      ) : (
                        <span className="text-[11px] text-slate-400"> (unlimited)</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={
                          event.status === 'PUBLISHED'
                            ? 'success'
                            : event.status === 'DRAFT'
                            ? 'secondary'
                            : 'destructive'
                        }
                      >
                        {event.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-3">
                        <Link
                          href={`/dashboard/events/${event.id}/edit`}
                          title="Edit Event"
                          className="inline-flex items-center gap-1 text-[#034694] hover:text-[#022c5e] text-xs font-semibold"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </Link>
                        <button
                          onClick={() => handleDownloadCsv(event)}
                          title="Export Registrations to CSV"
                          className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 text-xs font-semibold"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>CSV</span>
                        </button>
                        <Link
                          href={`/events/${event.slug}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-slate-600 hover:text-[#034694] font-semibold text-xs"
                        >
                          <span>View</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
