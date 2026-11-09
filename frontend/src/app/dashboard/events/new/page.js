'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  Building2,
  Users,
  FileText,
  Mail,
  Phone,
  User,
  Sparkles,
  Loader2,
  Eye,
  Edit3,
  X,
  Trophy,
  Award,
  Paperclip,
  Shield,
  HelpCircle,
  DollarSign,
  Tag,
  Milestone,
  Plus,
  Trash2,
  ListOrdered,
} from 'lucide-react';
import { eventsApi, clubsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import MarkdownView from '@/components/ui/markdown-view';

export default function CreateEventPage() {
  const router = useRouter();
  const { user, isSuperAdmin, loading } = useAuth();

  const [clubs, setClubs] = useState([]);
  const [loadingClubs, setLoadingClubs] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [descTab, setDescTab] = useState('write'); // 'write' | 'preview'

  const [form, setForm] = useState({
    clubId: '',
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

    // Registration & Eligibility
    isRegistrationRequired: true,
    entryFee: 'Free',
    eligibility: 'Open to all enrolled undergraduate & postgraduate students (B.Tech, MCA, M.Tech) of Silicon West.',

    // Team format
    isTeamEvent: false,
    minTeamSize: '1',
    maxTeamSize: '4',

    // Prizes & Guidelines
    prizePool: '',
    rewards: '',
    rules: '',

    // Coordinators
    coordinator1Name: '',
    coordinator1Role: '',
    coordinator1Email: '',
    coordinator1Phone: '',

    coordinator2Name: '',
    coordinator2Role: '',
    coordinator2Email: '',
    coordinator2Phone: '',
  });

  const [attachment, setAttachment] = useState(null); // { name, size, type, data }

  // Event Timeline Milestones
  const [timeline, setTimeline] = useState([
    {
      id: 1,
      time: '09:30 AM',
      title: 'Reporting & Participant Check-in',
      description: 'Registration desk verification and participant kit distribution.',
    },
    {
      id: 2,
      time: '10:30 AM',
      title: 'Opening Ceremony & Keynote Address',
      description: 'Inaugural address by dignitaries, challenge brief, and orientation.',
    },
    {
      id: 3,
      time: '01:00 PM',
      title: 'Lunch Break & Mentorship Sync',
      description: 'Networking lunch and project progress review with faculty mentors.',
    },
    {
      id: 4,
      time: '04:30 PM',
      title: 'Final Evaluation & Demos',
      description: 'Live demonstrations and prototype evaluations before jury panel.',
    },
    {
      id: 5,
      time: '06:00 PM',
      title: 'Valedictory & Prize Distribution',
      description: 'Announcement of winners, trophy presentation, and concluding remarks.',
    },
  ]);

  const addTimelineItem = () => {
    setTimeline((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        time: '',
        title: '',
        description: '',
      },
    ]);
  };

  const updateTimelineItem = (index, field, value) => {
    setTimeline((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const removeTimelineItem = (index) => {
    setTimeline((prev) => prev.filter((_, i) => i !== index));
  };

  const setTimelinePreset = (type) => {
    if (type === 'hackathon') {
      setTimeline([
        { id: 1, time: 'Day 1 - 09:00 AM', title: 'Check-in & Team Assembly', description: 'Participant badge issuance and workspace allocation.' },
        { id: 2, time: 'Day 1 - 10:00 AM', title: 'Problem Tracks Released & Hacking Begins', description: 'Opening keynote, track mentor introductions, and timer countdown start.' },
        { id: 3, time: 'Day 1 - 04:00 PM', title: 'Mid-Way Architecture Review', description: 'Checkpoint 1 feedback with technical mentors.' },
        { id: 4, time: 'Day 2 - 08:30 AM', title: 'Breakfast & Code Freeze', description: 'Final commit push to official code repository.' },
        { id: 5, time: 'Day 2 - 10:00 AM', title: 'Jury Pitching & Demo Fair', description: 'Top 10 shortlisted teams pitch to judges.' },
        { id: 6, time: 'Day 2 - 01:00 PM', title: 'Awards & Closing Ceremony', description: 'Winner announcements and prize distribution.' }
      ]);
    } else if (type === 'workshop') {
      setTimeline([
        { id: 1, time: '10:00 AM', title: 'Welcome & Speaker Introduction', description: 'Opening remarks by Faculty Coordinator.' },
        { id: 2, time: '10:30 AM', title: 'Module 1: Foundations & Architecture', description: 'Live interactive presentation with code walkthrough.' },
        { id: 3, time: '12:30 PM', title: 'Hands-on Coding Lab', description: 'Guided exercise with mentor assistance.' },
        { id: 4, time: '02:00 PM', title: 'Q&A & Certificate Presentation', description: 'Open floor questions and participant feedback.' }
      ]);
    } else {
      setTimeline([]);
    }
  };

  // Access Control: Only Super Admin can create events
  useEffect(() => {
    if (!loading && user && !isSuperAdmin) {
      router.push('/dashboard/events');
    }
  }, [user, isSuperAdmin, loading, router]);

  // Fetch all active campus clubs (Super Admin event creation)
  useEffect(() => {
    async function loadClubs() {
      try {
        const data = await clubsApi.list({ includeArchived: 'false' });
        const allClubs = Array.isArray(data) ? data : [];
        setClubs(allClubs);
        if (allClubs.length > 0) {
          const defaultClub = allClubs[0];
          setForm((prev) => ({
            ...prev,
            clubId: defaultClub.id,
            coordinator1Name: defaultClub.facultyCoordinator || prev.coordinator1Name,
            coordinator1Email: defaultClub.facultyCoordinatorEmail || prev.coordinator1Email,
            coordinator2Name: defaultClub.secretary || prev.coordinator2Name,
            coordinator2Email: defaultClub.secretaryEmail || prev.coordinator2Email,
            coordinator2Phone: defaultClub.secretaryPhone || prev.coordinator2Phone,
          }));
        }
      } catch (err) {
        console.error('Failed to load clubs:', err);
      } finally {
        setLoadingClubs(false);
      }
    }
    loadClubs();
  }, []);

  // Handle organizing club switch to pre-fill coordinators if available
  const handleClubChange = (clubId) => {
    const selected = clubs.find((c) => c.id === clubId);
    setForm((prev) => ({
      ...prev,
      clubId,
      coordinator1Name: selected?.facultyCoordinator || prev.coordinator1Name,
      coordinator1Email: selected?.facultyCoordinatorEmail || prev.coordinator1Email,
      coordinator2Name: selected?.secretary || prev.coordinator2Name,
      coordinator2Email: selected?.secretaryEmail || prev.coordinator2Email,
      coordinator2Phone: selected?.secretaryPhone || prev.coordinator2Phone,
    }));
  };

  // Auto-generate slug from title
  const handleTitleChange = (e) => {
    const val = e.target.value;
    const autoSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setForm((prev) => ({
      ...prev,
      title: val,
      slug: autoSlug,
    }));
  };

  // Banner image upload with canvas optimization
  const handleBannerUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (PNG, JPG, WEBP).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Event banner file size exceeds 10MB limit. Please select a smaller image.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxWidth = 1400;
        const maxHeight = 800;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        setForm((prev) => ({ ...prev, bannerUrl: canvas.toDataURL('image/jpeg', 0.88) }));
        setError(null);
      };
      img.src = uploadEvent.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Document attachment upload
  const handleAttachmentUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      setError('Document attachment size exceeds 15MB limit.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const sizeStr = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;
      setAttachment({
        name: file.name,
        size: sizeStr,
        type: file.type || 'application/octet-stream',
        data: uploadEvent.target.result,
      });
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  // Markdown helper
  const insertMarkdown = (syntax) => {
    setForm((prev) => {
      const desc = prev.description || '';
      let addition = '';
      if (syntax === 'bold') addition = '**bold text**';
      else if (syntax === 'italic') addition = '*italic text*';
      else if (syntax === 'h2') addition = '\n## Agenda & Timeline\n';
      else if (syntax === 'list') addition = '\n- Session 1: Keynote\n- Session 2: Hands-on Lab\n';
      else if (syntax === 'code') addition = '\n```\ncode or instructions\n```\n';
      else if (syntax === 'link') addition = '[Official Documentation](https://example.com)';
      return { ...prev, description: desc + addition };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.clubId) {
      setError('Please select an organizing club.');
      return;
    }
    if (!form.title.trim()) {
      setError('Please provide an event title.');
      return;
    }
    if (!form.slug.trim()) {
      setError('Please provide an event URL slug.');
      return;
    }

    const cleanSlug = form.slug.trim().toLowerCase();
    if (!/^[a-z0-9-]+$/.test(cleanSlug)) {
      setError('Slug must contain only lowercase letters, numbers, and hyphens (e.g. tech-hackathon-2026).');
      return;
    }

    if (!form.description.trim() || form.description.trim().length < 10) {
      setError('Please provide a detailed event description (at least 10 characters).');
      return;
    }
    if (!form.startsAt || !form.endsAt) {
      setError('Please specify both event start and end times.');
      return;
    }

    const start = new Date(form.startsAt);
    const end = new Date(form.endsAt);
    if (end <= start) {
      setError('Event conclusion date must be after commencement date.');
      return;
    }

    const deadline = form.isRegistrationRequired && form.registrationDeadline
      ? new Date(form.registrationDeadline)
      : start;

    setSubmitting(true);
    try {
      const validTimeline = timeline
        .filter((item) => (item.title && item.title.trim().length > 0) || (item.time && item.time.trim().length > 0))
        .map((item) => ({
          time: (item.time || '').trim(),
          title: (item.title || '').trim(),
          description: (item.description || '').trim(),
        }));

      // Build metadata block for backward compatibility
      const meta = {
        isRegistrationOptional: !form.isRegistrationRequired,
        eligibility: form.eligibility.trim() || undefined,
        teamSize: form.isTeamEvent
          ? `${form.minTeamSize} – ${form.maxTeamSize} Members per Team`
          : 'Individual / Solo Participation',
        entryFee: form.entryFee.trim() || 'Free',
        prizePool: form.prizePool.trim() || undefined,
        rewards: form.rewards
          ? form.rewards.split('\n').filter(Boolean).map((line) => ({ title: line.trim() }))
          : undefined,
        rules: form.rules ? form.rules.split('\n').filter(Boolean) : undefined,
        timeline: validTimeline.length > 0 ? validTimeline : undefined,
        attachment: attachment || null,
        contacts: [
          ...(form.coordinator1Name
            ? [{
                name: form.coordinator1Name.trim(),
                role: form.coordinator1Role.trim() || 'Faculty Coordinator',
                email: form.coordinator1Email.trim() || undefined,
                phone: form.coordinator1Phone.trim() || undefined,
              }]
            : []),
          ...(form.coordinator2Name
            ? [{
                name: form.coordinator2Name.trim(),
                role: form.coordinator2Role.trim() || 'Student Coordinator',
                email: form.coordinator2Email.trim() || undefined,
                phone: form.coordinator2Phone.trim() || undefined,
              }]
            : []),
        ],
      };

      const finalDescription = `${(form.description || form.title).trim()}\n\n<!-- EVENT_META: ${JSON.stringify(meta)} -->`;

      const payload = {
        clubId: form.clubId,
        title: form.title.trim(),
        slug: cleanSlug,
        summary: form.summary.trim() || undefined,
        description: finalDescription,
        category: form.category,
        venue: form.venue.trim() || 'Silicon West Campus',
        onlineMeetingUrl: form.onlineMeetingUrl.trim() || undefined,
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
        registrationDeadline: deadline.toISOString(),
        capacity: form.isRegistrationRequired && form.capacity ? parseInt(form.capacity, 10) : null,
        status: form.status,
        bannerUrl: form.bannerUrl ? form.bannerUrl.trim() : undefined,

        // Direct Prisma Model Columns
        isRegistrationRequired: form.isRegistrationRequired,
        entryFee: form.entryFee.trim() || 'Free',
        eligibility: form.eligibility.trim() || undefined,
        isTeamEvent: form.isTeamEvent,
        minTeamSize: form.isTeamEvent ? parseInt(form.minTeamSize, 10) || 1 : 1,
        maxTeamSize: form.isTeamEvent ? parseInt(form.maxTeamSize, 10) || 1 : 1,
        prizePool: form.prizePool.trim() || undefined,
        rewards: meta.rewards || null,
        rules: meta.rules || null,
        timeline: validTimeline.length > 0 ? validTimeline : null,
        attachmentUrl: attachment?.data || undefined,
        attachmentName: attachment?.name || undefined,
        attachmentSize: attachment?.size || undefined,
        coordinator1Name: form.coordinator1Name.trim() || undefined,
        coordinator1Role: form.coordinator1Role.trim() || undefined,
        coordinator1Email: form.coordinator1Email.trim() || undefined,
        coordinator1Phone: form.coordinator1Phone.trim() || undefined,
        coordinator2Name: form.coordinator2Name.trim() || undefined,
        coordinator2Role: form.coordinator2Role.trim() || undefined,
        coordinator2Email: form.coordinator2Email.trim() || undefined,
        coordinator2Phone: form.coordinator2Phone.trim() || undefined,
        meta,
      };

      await eventsApi.create(payload);
      router.push('/dashboard/events');
    } catch (err) {
      console.error('Create event error:', err);
      setError(err.message || 'Failed to create event. Please verify all inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/events"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Events Hub</span>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-1">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#034694]">
          <Calendar className="w-3.5 h-3.5" />
          <span>New Campus Activity</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Create New Event
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Configure event schedules, team formats, eligibility rules, prizes, curriculum, and publishing status.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Core Details */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#034694]" />
            Core Event Identity
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Organizing Club */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Organizing Club <span className="text-rose-500">*</span>
              </label>
              {loadingClubs ? (
                <div className="h-9 bg-slate-100 rounded-lg animate-pulse" />
              ) : (
                <select
                  value={form.clubId}
                  onChange={(e) => handleClubChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#034694] focus:border-[#034694]"
                  required
                >
                  {clubs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#034694] focus:border-[#034694]"
              >
                <option value="Technical">Technical &amp; Coding</option>
                <option value="Cultural">Cultural &amp; Performing Arts</option>
                <option value="Sports">Sports &amp; Athletics</option>
                <option value="Media & Arts">Media &amp; Photography</option>
                <option value="Workshop">Hands-on Workshop</option>
                <option value="Hackathon">Hackathon &amp; Innovation Sprint</option>
                <option value="Symposium">Conference &amp; Symposium</option>
                <option value="General">General Campus Event</option>
              </select>
            </div>

            {/* Event Title */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Event Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={handleTitleChange}
                placeholder="e.g. Silicon HackNova 2026: 36-Hour National Hackathon"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#034694] focus:border-[#034694]"
                required
              />
            </div>

            {/* URL Slug */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                URL Slug <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center">
                <span className="px-3 py-2 bg-slate-100 border border-r-0 border-slate-200 rounded-l-lg text-xs text-slate-500 select-none">
                  /events/
                </span>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })}
                  placeholder="hacknova-2026"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-r-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#034694] focus:border-[#034694]"
                  required
                />
              </div>
            </div>

            {/* Short Teaser Summary */}
            <div className="sm:col-span-2 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">Short Summary</label>
                <span className="text-[10px] text-slate-400">
                  {form.summary.length}/160 characters
                </span>
              </div>
              <input
                type="text"
                maxLength={160}
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
                placeholder="Brief 1-sentence synopsis displayed on cards &amp; preview banners..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#034694] focus:border-[#034694]"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Timeline & Dates */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#034694]" />
            Timeline &amp; Deadlines
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Starts At <span className="text-rose-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#034694] focus:border-[#034694]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Ends At <span className="text-rose-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={form.endsAt}
                onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#034694] focus:border-[#034694]"
                required
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Registration Deadline {form.isRegistrationRequired && <span className="text-rose-500">*</span>}
              </label>
              <input
                type="datetime-local"
                value={form.registrationDeadline}
                onChange={(e) => setForm({ ...form, registrationDeadline: e.target.value })}
                required={form.isRegistrationRequired}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#034694] focus:border-[#034694]"
              />
              <p className="text-[11px] text-slate-400">
                Students will not be able to register after this date &amp; time.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2.5: Interactive Event Timeline & Program Schedule */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Milestone className="w-4 h-4 text-[#034694]" />
                Event Timeline &amp; Program Schedule
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Outline sequential agenda checkpoints, keynotes, hackathon phases, or guest lectures.
              </p>
            </div>
            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mr-1">Presets:</span>
              <button
                type="button"
                onClick={() => setTimelinePreset('hackathon')}
                className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 text-slate-700 hover:bg-[#034694] hover:text-white rounded-md transition-colors"
              >
                Hackathon
              </button>
              <button
                type="button"
                onClick={() => setTimelinePreset('workshop')}
                className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 text-slate-700 hover:bg-[#034694] hover:text-white rounded-md transition-colors"
              >
                Workshop
              </button>
              <button
                type="button"
                onClick={() => setTimelinePreset('clear')}
                className="px-2.5 py-1 text-[11px] font-medium text-slate-500 hover:text-rose-600 rounded-md transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {timeline.length === 0 ? (
              <div className="text-center py-8 px-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <ListOrdered className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-600">No timeline milestones added yet</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                  Add milestones to display a structured agenda on the event public page, or choose a template above.
                </p>
                <button
                  type="button"
                  onClick={addTimelineItem}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#034694] text-white rounded-lg text-xs font-medium hover:bg-[#02336e] transition-colors shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add First Milestone
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {timeline.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#034694] bg-[#034694]/10 px-2.5 py-0.5 rounded-full">
                        <span>Milestone #{idx + 1}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeTimelineItem(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors"
                        title="Remove milestone"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-1 space-y-1">
                        <label className="text-[11px] font-semibold text-slate-700">Date &amp; Time / Phase</label>
                        <input
                          type="text"
                          value={item.time || ''}
                          onChange={(e) => updateTimelineItem(idx, 'time', e.target.value)}
                          placeholder="e.g. Day 1 - 10:00 AM"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#034694] focus:border-[#034694]"
                        />
                      </div>
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[11px] font-semibold text-slate-700">Milestone Title</label>
                        <input
                          type="text"
                          value={item.title || ''}
                          onChange={(e) => updateTimelineItem(idx, 'title', e.target.value)}
                          placeholder="e.g. Keynote & Problem Statement Release"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#034694] focus:border-[#034694]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700">Description / Details (Optional)</label>
                      <textarea
                        rows={2}
                        value={item.description || ''}
                        onChange={(e) => updateTimelineItem(idx, 'description', e.target.value)}
                        placeholder="Brief notes, venue within campus, mentor check-in notes..."
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#034694] focus:border-[#034694] resize-none"
                      />
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addTimelineItem}
                  className="w-full py-2.5 border border-dashed border-slate-300 hover:border-[#034694] text-slate-600 hover:text-[#034694] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors bg-white hover:bg-slate-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Another Milestone
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Registration, Eligibility & Team Format */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#034694]" />
            Participation, Attendance &amp; Team Format
          </h2>

          <div className="space-y-5">
            {/* Registration Mode Toggle */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">Attendance Mode</div>
                  <p className="text-[11px] text-slate-500">Require individual student passes or permit open campus walk-ins</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isRegistrationRequired}
                    onChange={(e) => setForm({ ...form, isRegistrationRequired: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#034694]" />
                </label>
              </div>

              {form.isRegistrationRequired ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Maximum Seat Capacity</label>
                    <input
                      type="number"
                      min={1}
                      value={form.capacity}
                      onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                      placeholder="Leave blank for unlimited attendees"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Entry / Registration Fee</label>
                    <input
                      type="text"
                      value={form.entryFee}
                      onChange={(e) => setForm({ ...form, entryFee: e.target.value })}
                      placeholder="Free or ₹100 per team"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Open Attendance: Walk-ins and all college students are welcome without a pre-registration form.</span>
                </div>
              )}
            </div>

            {/* Team vs Solo Participation */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">Team Participation</div>
                  <p className="text-[11px] text-slate-500">Allow team formations (hackathons, sports, group competitions)</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isTeamEvent}
                    onChange={(e) => setForm({ ...form, isTeamEvent: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#034694]" />
                </label>
              </div>

              {form.isTeamEvent ? (
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-200">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Min Members / Team</label>
                    <input
                      type="number"
                      min={1}
                      value={form.minTeamSize}
                      onChange={(e) => setForm({ ...form, minTeamSize: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Max Members / Team</label>
                    <input
                      type="number"
                      min={1}
                      value={form.maxTeamSize}
                      onChange={(e) => setForm({ ...form, maxTeamSize: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                    />
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 pt-1">
                  Single Individual / Solo Participation mode.
                </p>
              )}
            </div>

            {/* Eligibility Criteria */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Eligibility Criteria</label>
              <textarea
                rows={2}
                value={form.eligibility}
                onChange={(e) => setForm({ ...form, eligibility: e.target.value })}
                placeholder="e.g. Open to all B.Tech / MCA students of Silicon West. College ID required."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#034694]"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Venue & Connectivity */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#034694]" />
            Location &amp; Connectivity
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Campus Venue / Room</label>
              <input
                type="text"
                value={form.venue}
                onChange={(e) => setForm({ ...form, venue: e.target.value })}
                placeholder="e.g. Auditorium 1 / Advanced IoT Lab, Block B"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#034694] focus:border-[#034694]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Online Meeting URL (Optional)</label>
              <input
                type="url"
                value={form.onlineMeetingUrl}
                onChange={(e) => setForm({ ...form, onlineMeetingUrl: e.target.value })}
                placeholder="https://meet.google.com/... or Zoom link"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#034694] focus:border-[#034694]"
              />
            </div>
          </div>
        </div>

        {/* Section 5: Cover Banner */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-[#034694]" />
              Event Cover Banner
            </h2>
            <span className="text-[10px] font-semibold text-[#034694] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">
              Recommended: 1200 × 630 px (16:9 Landscape) • Max 10MB
            </span>
          </div>

          <div className="space-y-3">
            {form.bannerUrl ? (
              <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="relative h-48 sm:h-56 w-full rounded-xl overflow-hidden border border-slate-200 bg-white">
                  <img
                    src={form.bannerUrl}
                    alt="Event banner preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">Cover banner active</span>
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer shadow-2xs transition-colors">
                      <Upload className="w-3.5 h-3.5 text-[#034694]" />
                      <span>Replace</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBannerUpload}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, bannerUrl: '' }))}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-8 sm:p-10 border-2 border-dashed border-slate-200 hover:border-[#034694] rounded-2xl bg-slate-50/50 hover:bg-blue-50/20 cursor-pointer transition-all group">
                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-[#034694] group-hover:border-[#034694]/30 shadow-2xs mb-2.5 transition-colors">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-[#034694] transition-colors">
                  Click to select Event Cover Banner
                </span>
                <span className="text-[11px] text-slate-500 mt-1 text-center">
                  Recommended: 1200 × 630 px • Landscape (16:9) • Max 10MB (PNG, JPG, WEBP)
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBannerUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Section 6: Prizes, Rewards & Rules */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#034694]" />
            Prizes, Rewards &amp; Guidelines
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Total Prize Pool (Optional)</label>
                <input
                  type="text"
                  value={form.prizePool}
                  onChange={(e) => setForm({ ...form, prizePool: e.target.value })}
                  placeholder="e.g. ₹50,000 Cash Pool + Trophies"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#034694]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Prizes / Rewards Breakdown (1 per line)</label>
                <textarea
                  rows={2}
                  value={form.rewards}
                  onChange={(e) => setForm({ ...form, rewards: e.target.value })}
                  placeholder="1st Prize: ₹25,000 + Winner Trophy&#10;2nd Prize: ₹15,000 + Merit Certificate&#10;All: Participation Certificates"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#034694]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Rules &amp; Code of Conduct (1 per line)</label>
              <textarea
                rows={3}
                value={form.rules}
                onChange={(e) => setForm({ ...form, rules: e.target.value })}
                placeholder="College ID card mandatory at reporting&#10;Bring your personal laptops and chargers&#10;Decisions of faculty jury are final"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#034694]"
              />
            </div>
          </div>
        </div>

        {/* Section 7: Document / Rulebook Attachment */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-[#034694]" />
              Event Resource / Rulebook Attachment
            </h2>
            <span className="text-[11px] text-slate-400">PDF, ZIP, DOCX (Max 15MB)</span>
          </div>

          {attachment ? (
            <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#034694] flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800 truncate">{attachment.name}</div>
                  <div className="text-[10px] text-slate-400 font-medium">{attachment.size}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAttachment(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                title="Remove attachment"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="flex items-center justify-center gap-2.5 p-4 rounded-xl border border-dashed border-slate-200 hover:border-[#034694] bg-slate-50/50 hover:bg-blue-50/20 cursor-pointer transition-colors text-slate-600">
              <Upload className="w-4 h-4 text-[#034694]" />
              <span className="text-xs font-semibold">Upload Event Rulebook, Schedule, or Brochure (PDF/ZIP)</span>
              <input
                type="file"
                onChange={handleAttachmentUpload}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Section 8: Event Coordinators */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#034694]" />
              Event Coordinators &amp; Contacts
            </h2>
            <span className="text-[11px] text-slate-400">Helpdesk for Student Inquiries</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Primary / Faculty Coordinator */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-900 block border-b border-slate-200 pb-2">
                1. Faculty / Primary Coordinator
              </span>
              <div className="space-y-2">
                <input
                  type="text"
                  value={form.coordinator1Name}
                  onChange={(e) => setForm({ ...form, coordinator1Name: e.target.value })}
                  placeholder="Coordinator Name"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
                <input
                  type="email"
                  value={form.coordinator1Email}
                  onChange={(e) => setForm({ ...form, coordinator1Email: e.target.value })}
                  placeholder="coordinator@silicon.ac.in"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
                <input
                  type="tel"
                  value={form.coordinator1Phone}
                  onChange={(e) => setForm({ ...form, coordinator1Phone: e.target.value })}
                  placeholder="Phone: +91 98610 00000"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            {/* Student Coordinator */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-900 block border-b border-slate-200 pb-2">
                2. Student Secretary / Coordinator
              </span>
              <div className="space-y-2">
                <input
                  type="text"
                  value={form.coordinator2Name}
                  onChange={(e) => setForm({ ...form, coordinator2Name: e.target.value })}
                  placeholder="Student Lead Name"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
                <input
                  type="email"
                  value={form.coordinator2Email}
                  onChange={(e) => setForm({ ...form, coordinator2Email: e.target.value })}
                  placeholder="secretary@siliconwest.in"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
                <input
                  type="tel"
                  value={form.coordinator2Phone}
                  onChange={(e) => setForm({ ...form, coordinator2Phone: e.target.value })}
                  placeholder="Phone: +91 98765 43210"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 9: Full Markdown Description & Agenda */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#034694]" />
              Detailed Description &amp; Curriculum (Markdown)
            </h2>

            {/* Tab switch */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setDescTab('write')}
                className={`px-3 py-1 rounded-md transition-all ${
                  descTab === 'write'
                    ? 'bg-white shadow-2xs text-slate-900 font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Edit3 className="w-3 h-3 inline mr-1" />
                Write
              </button>
              <button
                type="button"
                onClick={() => setDescTab('preview')}
                className={`px-3 py-1 rounded-md transition-all ${
                  descTab === 'preview'
                    ? 'bg-white shadow-2xs text-[#034694] font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Eye className="w-3 h-3 inline mr-1" />
                Live Preview
              </button>
            </div>
          </div>

          {descTab === 'write' ? (
            <div className="space-y-2">
              {/* Quick Syntax Toolbar */}
              <div className="flex items-center gap-1.5 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => insertMarkdown('bold')}
                  className="px-2 py-0.5 hover:bg-slate-200 rounded font-bold"
                  title="Bold"
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('italic')}
                  className="px-2 py-0.5 hover:bg-slate-200 rounded italic"
                  title="Italic"
                >
                  I
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => insertMarkdown('h2')}
                  className="px-2 py-0.5 hover:bg-slate-200 rounded font-semibold text-[11px]"
                >
                  H2
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('list')}
                  className="px-2 py-0.5 hover:bg-slate-200 rounded text-[11px]"
                >
                  • List
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('code')}
                  className="px-2 py-0.5 hover:bg-slate-200 rounded font-mono text-[11px]"
                >
                  &lt;/&gt;
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('link')}
                  className="px-2 py-0.5 hover:bg-slate-200 rounded text-[11px] text-[#034694]"
                >
                  Link
                </button>
              </div>

              <textarea
                rows={8}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Write full curriculum, key takeaways, speaker details, schedule breakdown, prerequisites..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#034694] focus:border-[#034694]"
              />
            </div>
          ) : (
            <div className="p-5 bg-slate-50/70 border border-slate-200 rounded-xl min-h-[160px] prose prose-slate max-w-none text-xs">
              {form.description ? (
                <MarkdownView content={form.description} />
              ) : (
                <p className="text-slate-400 italic text-center py-6">
                  No description entered yet. Switch to &apos;Write&apos; tab to begin.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Section 10: Publishing Status & Submit Actions */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-slate-700">Publishing Status:</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#034694]"
            >
              <option value="PUBLISHED">Published (Visible Publicly)</option>
              <option value="DRAFT">Draft (Save Unlisted)</option>
            </select>
          </div>

          <div className="flex items-center gap-3 justify-end">
            <Link
              href="/dashboard/events"
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 transition-colors"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={submitting}
              className="bg-[#034694] hover:bg-[#023168] text-white text-xs font-bold px-6 py-2 rounded-xl shadow-2xs transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Creating Event...</span>
                </>
              ) : (
                <span>Publish Event</span>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
