'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building,
  Calendar,
  Users,
  Plus,
  Download,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Eye,
  Paperclip,
  Upload,
  FileText,
  Phone,
  Mail,
  User,
  Edit3,
  X,
} from 'lucide-react';
import { statsApi, eventsApi, clubsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import MarkdownView from '@/components/ui/markdown-view';

export default function ClubAdminPage() {
  const router = useRouter();
  const { user, isClubAdmin, isSuperAdmin, isAuthenticated, loading: authLoading } = useAuth();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedClubId, setSelectedClubId] = useState('');
  const [clubEvents, setClubEvents] = useState([]);

        
  // Registrations Viewer state
  const [viewingEvent, setViewingEvent] = useState(null);
  const [eventRegistrations, setEventRegistrations] = useState([]);
  const [regSearch, setRegSearch] = useState('');
  const [regsLoading, setRegsLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || (!isClubAdmin && !isSuperAdmin))) {
      router.push('/login');
      return;
    }

    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isClubAdmin, isSuperAdmin, authLoading, router]);

  async function loadDashboard() {
    setLoading(true);
    try {
      const data = await statsApi.getDashboard();
      setDashboardData(data);

      const assigned = data.assignedClubs || [];
      if (assigned.length > 0 && !selectedClubId) {
        setSelectedClubId(assigned[0].id);
      }

      // Load events
      const events = await eventsApi.list({ allStatuses: 'true' });
      setClubEvents(events || []);
    } catch (err) {
      console.error('Failed to load club admin data:', err);
    } finally {
      setLoading(false);
    }
  }

  // Handle File Upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      alert('File size exceeds 15MB limit.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const sizeStr = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;
      setNewEvent((prev) => ({
        ...prev,
        attachment: {
          name: file.name,
          size: sizeStr,
          type: file.type || 'application/octet-stream',
          data: uploadEvent.target.result,
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  // Insert Markdown helper
  const insertMarkdown = (syntax) => {
    setNewEvent((prev) => {
      const desc = prev.description || '';
      let addition = '';
      if (syntax === 'bold') addition = '**bold text**';
      else if (syntax === 'italic') addition = '*italic text*';
      else if (syntax === 'h2') addition = '\n## Section Heading\n';
      else if (syntax === 'list') addition = '\n- Item 1\n- Item 2\n';
      else if (syntax === 'code') addition = '\n```\ncode block\n```\n';
      else if (syntax === 'link') addition = '[Link Title](https://example.com)';
      return { ...prev, description: desc + addition };
    });
  };

  // Handle Event Creation
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setSubmittingEvent(true);
    try {
      if (!selectedClubId) {
        alert('Please select an assigned club first.');
        setSubmittingEvent(false);
        return;
      }

      const metadata = {
        isRegistrationOptional: !newEvent.isRegistrationRequired,
        attachment: newEvent.attachment || null,
        contacts: (newEvent.contactName || newEvent.contactEmail || newEvent.contactPhone) ? [{
          name: newEvent.contactName,
          email: newEvent.contactEmail,
          phone: newEvent.contactPhone,
        }] : [],
      };

      const finalDescription = `${newEvent.description.trim()}\n\n<!-- EVENT_META: ${JSON.stringify(metadata)} -->`;

      const regDeadline = newEvent.isRegistrationRequired && newEvent.registrationDeadline
        ? new Date(newEvent.registrationDeadline).toISOString()
        : new Date(newEvent.startsAt || new Date()).toISOString();

      await eventsApi.create({
        clubId: selectedClubId,
        title: newEvent.title.trim(),
        slug: newEvent.slug.trim(),
        category: newEvent.category,
        summary: newEvent.summary.trim() || undefined,
        description: finalDescription,
        venue: newEvent.venue.trim() || undefined,
        onlineMeetingUrl: newEvent.onlineMeetingUrl.trim() || undefined,
        startsAt: new Date(newEvent.startsAt).toISOString(),
        endsAt: new Date(newEvent.endsAt).toISOString(),
        registrationDeadline: regDeadline,
        capacity: newEvent.isRegistrationRequired && newEvent.capacity ? parseInt(newEvent.capacity, 10) : null,
        status: newEvent.status,
        bannerUrl: newEvent.bannerUrl ? newEvent.bannerUrl.trim() : undefined,
      });

      setShowEventModal(false);
      setNewEvent({
        title: '',
        slug: '',
        category: 'Technical',
        summary: '',
        description: '',
        venue: '',
        onlineMeetingUrl: '',
        startsAt: '',
        endsAt: '',
        registrationDeadline: '',
        capacity: '',
        status: 'PUBLISHED',
        bannerUrl: '',
        isRegistrationRequired: true,
        attachment: null,
        contactName: '',
        contactEmail: '',
        contactPhone: '',
      });
      loadDashboard();
    } catch (err) {
      alert(err.message || 'Failed to create event.');
    } finally {
      setSubmittingEvent(false);
    }
  };

  // Open Registrations for an event
  const handleOpenRegistrations = async (event) => {
    setViewingEvent(event);
    setRegsLoading(true);
    try {
      const data = await eventsApi.getRegistrations(event.id);
      setEventRegistrations(data || []);
    } catch (err) {
      alert(err.message || 'Failed to load registrations.');
    } finally {
      setRegsLoading(false);
    }
  };

  // Download Google Forms style responses spreadsheet
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="w-12 h-12 border-4 border-[#034694] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const assignedClubs = dashboardData?.assignedClubs || user?.assignedClubs || [];
  const metrics = dashboardData?.metrics || {};

  // Filter events belonging to assigned clubs
  const managedEvents = clubEvents.filter((e) => {
    if (isSuperAdmin) return true;
    return assignedClubs.some((c) => c.id === e.club?.id || c.name === e.club?.name);
  });

  const filteredRegistrations = eventRegistrations.filter((r) => {
    if (!regSearch.trim()) return true;
    const q = regSearch.toLowerCase();
    return (
      r.participantName?.toLowerCase().includes(q) ||
      r.participantEmail?.toLowerCase().includes(q) ||
      r.rollNumber?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header Card */}
        <div className="bg-gradient-to-r from-[#034694] via-[#022b5c] to-slate-900 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 bg-amber-400/20 text-amber-300 border border-amber-400/30 px-3 py-1 rounded-full text-xs font-bold">
              <Building className="w-3.5 h-3.5" />
              Club Administration Desk
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Event Operations & Participant Rosters
            </h1>
            <p className="text-xs text-blue-200">
              Logged in as <span className="font-semibold text-white">{user?.name}</span> ({user?.email})
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/events/new"
              className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-extrabold text-xs px-5 py-2.5 rounded-xl shadow transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Create New Event
            </Link>
          </div>
        </div>

        {/* Assigned Club Selector (if multiple) */}
        {assignedClubs.length > 1 && (
          <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-700">Select Active Club:</span>
            <div className="flex flex-wrap gap-2">
              {assignedClubs.map((club) => (
                <button
                  key={club.id}
                  onClick={() => setSelectedClubId(club.id)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                    selectedClubId === club.id
                      ? 'bg-[#034694] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {club.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Metrics Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Building className="w-4 h-4 text-blue-600" /> Assigned Clubs
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {assignedClubs.length || 1}
            </div>
            <span className="text-[11px] text-slate-500">Autonomous Societies</span>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-600" /> Active Events
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {metrics.publishedEvents ?? managedEvents.filter((e) => e.status === 'PUBLISHED').length}
            </div>
            <span className="text-[11px] text-slate-500">
              {metrics.draftEvents || 0} drafts
            </span>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-amber-600" /> Confirmed Registrations
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {metrics.confirmedRegistrations ?? 0}
            </div>
            <span className="text-[11px] text-slate-500">In assigned club events</span>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-purple-600" /> Upcoming Schedules
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {metrics.upcomingEvents ?? 0}
            </div>
            <span className="text-[11px] text-slate-500">Campus & Lab Tracks</span>
          </div>
        </div>

        {/* Managed Events Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden space-y-4">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              Events Organized by Your Assigned Clubs ({managedEvents.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-5">Event Title</th>
                  <th className="py-3 px-5">Host Club</th>
                  <th className="py-3 px-5">Starts At</th>
                  <th className="py-3 px-5">Capacity / Confirmed</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {managedEvents.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-5">
                      <span className="font-bold text-slate-900 block">{e.title}</span>
                      <span className="text-[11px] text-slate-400 font-mono">/events/{e.slug}</span>
                    </td>
                    <td className="py-3.5 px-5 text-slate-700 font-medium">
                      {e.club?.name}
                    </td>
                    <td className="py-3.5 px-5 text-slate-600">
                      {new Date(e.startsAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-5 text-slate-700 font-semibold">
                      {e.capacity ? `${e.confirmedRegistrationsCount} / ${e.capacity}` : `${e.confirmedRegistrationsCount} (Open)`}
                    </td>
                    <td className="py-3.5 px-5">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          e.status === 'PUBLISHED'
                            ? 'bg-emerald-50 text-emerald-700'
                            : e.status === 'CANCELLED'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-amber-50 text-amber-800'
                        }`}
                      >
                        {e.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right space-x-2">
                      <button
                        onClick={() => handleOpenRegistrations(e)}
                        className="bg-blue-50 text-[#034694] hover:bg-blue-100 px-2.5 py-1 rounded font-bold text-[11px]"
                      >
                        Registrations ({e.confirmedRegistrationsCount})
                      </button>
                      <button
                        onClick={() => handleDownloadCsv(e)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded font-bold text-[11px] inline-flex items-center gap-1"
                        title="Export Google Forms style responses sheet"
                      >
                        <Download className="w-3 h-3" /> Export Sheet
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: View Registrations Roster */}
        {viewingEvent && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-4xl w-full p-8 shadow-2xl space-y-6 max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Participant Roster
                  </span>
                  <h3 className="font-bold text-slate-900 text-lg leading-tight">
                    {viewingEvent.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadCsv(viewingEvent)}
                    className="bg-[#034694] hover:bg-blue-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" /> Export Responses (Excel / CSV)
                  </button>
                  <button
                    onClick={() => setViewingEvent(null)}
                    className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Search in Modal */}
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  value={regSearch}
                  onChange={(e) => setRegSearch(e.target.value)}
                  placeholder="Filter by participant name, email, roll number..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              {/* Registrations List */}
              <div className="flex-1 overflow-y-auto border border-slate-100 rounded-xl">
                {regsLoading ? (
                  <div className="p-8 text-center text-xs text-slate-400 font-bold">
                    Loading participants...
                  </div>
                ) : filteredRegistrations.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500 font-semibold">
                    No registrations found.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-100 sticky top-0">
                      <tr>
                        <th className="py-2.5 px-4">Participant Name</th>
                        <th className="py-2.5 px-4">Email</th>
                        <th className="py-2.5 px-4">College / Roll</th>
                        <th className="py-2.5 px-4">Status</th>
                        <th className="py-2.5 px-4">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRegistrations.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-4 font-bold text-slate-900">{r.participantName}</td>
                          <td className="py-2.5 px-4 text-slate-600 font-mono text-[11px]">
                            {r.participantEmail}
                          </td>
                          <td className="py-2.5 px-4 text-slate-500">
                            {r.rollNumber || '—'} {r.collegeName ? `(${r.collegeName})` : ''}
                          </td>
                          <td className="py-2.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                r.status === 'CONFIRMED'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-rose-50 text-rose-700'
                              }`}
                            >
                              {r.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-slate-400 text-[11px]">
                            {new Date(r.registeredAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        
      </div>
    </div>
  );
}
