'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  ExternalLink,
  Save,
} from 'lucide-react';
import { eventsApi, clubsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import MarkdownView from '@/components/ui/markdown-view';

function formatForDateTimeInput(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const eventIdOrSlug = params?.id;
  const { user, isSuperAdmin, loading: authLoading } = useAuth();

  const [clubs, setClubs] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [descTab, setDescTab] = useState('write'); // 'write' | 'preview'
  const [actualEventId, setActualEventId] = useState(null);
  const [currentSlug, setCurrentSlug] = useState('');

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
  const [timeline, setTimeline] = useState([]);

  // Fetch campus clubs list
  useEffect(() => {
    async function loadClubs() {
      try {
        const data = await clubsApi.list({ includeArchived: 'false' });
        setClubs(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load clubs:', err);
      }
    }
    loadClubs();
  }, []);

  // Fetch event details on mount
  useEffect(() => {
    if (!eventIdOrSlug) return;

    async function loadEvent() {
      setLoadingData(true);
      setError(null);
      try {
        const ev = await eventsApi.getBySlug(eventIdOrSlug);
        if (!ev) {
          setError('Event not found.');
          return;
        }

        setActualEventId(ev.id);
        setCurrentSlug(ev.slug);

        // Check if description has embedded meta
        let cleanDesc = ev.description || '';
        let meta = ev.meta || null;
        const metaMatch = ev.description?.match(/<!-- EVENT_META:\s*([\s\S]*?)\s*-->/);
        if (metaMatch) {
          try {
            meta = meta || JSON.parse(metaMatch[1]);
            cleanDesc = ev.description.replace(/<!-- EVENT_META:\s*[\s\S]*?\s*-->/, '').trim();
          } catch (e) {
            console.warn('Metadata parse warning:', e);
          }
        }

        // Timeline milestones
        const rawTimeline = Array.isArray(ev.timeline) && ev.timeline.length > 0
          ? ev.timeline
          : Array.isArray(meta?.timeline) && meta.timeline.length > 0
          ? meta.timeline
          : [];

        setTimeline(
          rawTimeline.map((item, idx) => ({
            id: item.id || Date.now() + idx,
            time: item.time || '',
            title: item.title || '',
            description: item.description || '',
          }))
        );

        // Rewards string
        let rewardsStr = '';
        if (Array.isArray(ev.rewards)) {
          rewardsStr = ev.rewards.map(r => typeof r === 'string' ? r : r.title ? `${r.title}: ${r.reward || ''}` : JSON.stringify(r)).join('\n');
        } else if (typeof ev.rewards === 'string') {
          rewardsStr = ev.rewards;
        } else if (Array.isArray(meta?.rewards)) {
          rewardsStr = meta.rewards.map(r => typeof r === 'string' ? r : r.title || '').join('\n');
        }

        // Rules string
        let rulesStr = '';
        if (Array.isArray(ev.rules)) {
          rulesStr = ev.rules.join('\n');
        } else if (typeof ev.rules === 'string') {
          rulesStr = ev.rules;
        } else if (Array.isArray(meta?.rules)) {
          rulesStr = meta.rules.join('\n');
        }

        // Attachment
        if (ev.attachmentUrl) {
          setAttachment({
            name: ev.attachmentName || `${ev.slug}-attachment.pdf`,
            size: ev.attachmentSize || 'Resource Document',
            data: ev.attachmentUrl,
          });
        } else if (meta?.attachment) {
          setAttachment(meta.attachment);
        }

        const contacts = meta?.contacts || [];

        setForm({
          clubId: ev.clubId || ev.club?.id || '',
          title: ev.title || '',
          slug: ev.slug || '',
          category: ev.category || 'Technical',
          summary: ev.summary || '',
          description: cleanDesc,
          venue: ev.venue || '',
          onlineMeetingUrl: ev.onlineMeetingUrl || '',
          startsAt: formatForDateTimeInput(ev.startsAt),
          endsAt: formatForDateTimeInput(ev.endsAt),
          registrationDeadline: formatForDateTimeInput(ev.registrationDeadline),
          capacity: ev.capacity ? String(ev.capacity) : '',
          status: ev.status || 'PUBLISHED',
          bannerUrl: ev.bannerUrl || '',

          isRegistrationRequired: ev.isRegistrationRequired ?? (meta?.isRegistrationOptional ? false : true),
          entryFee: ev.entryFee || meta?.entryFee || 'Free',
          eligibility: ev.eligibility || meta?.eligibility || 'Open to all enrolled undergraduate & postgraduate students (B.Tech, MCA, M.Tech) of Silicon West.',

          isTeamEvent: ev.isTeamEvent ?? (ev.minTeamSize > 1 || false),
          minTeamSize: ev.minTeamSize ? String(ev.minTeamSize) : '1',
          maxTeamSize: ev.maxTeamSize ? String(ev.maxTeamSize) : '4',

          prizePool: ev.prizePool || meta?.prizePool || '',
          rewards: rewardsStr,
          rules: rulesStr,

          coordinator1Name: ev.coordinator1Name || contacts[0]?.name || '',
          coordinator1Role: ev.coordinator1Role || contacts[0]?.role || 'Faculty Coordinator',
          coordinator1Email: ev.coordinator1Email || contacts[0]?.email || '',
          coordinator1Phone: ev.coordinator1Phone || contacts[0]?.phone || '',

          coordinator2Name: ev.coordinator2Name || contacts[1]?.name || '',
          coordinator2Role: ev.coordinator2Role || contacts[1]?.role || 'Student Coordinator',
          coordinator2Email: ev.coordinator2Email || contacts[1]?.email || '',
          coordinator2Phone: ev.coordinator2Phone || contacts[1]?.phone || '',
        });
      } catch (err) {
        console.error('Failed to load event:', err);
        setError(err.message || 'Failed to load event details.');
      } finally {
        setLoadingData(false);
      }
    }

    loadEvent();
  }, [eventIdOrSlug]);

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
    setSuccessMsg(null);

    const targetId = actualEventId || eventIdOrSlug;
    if (!targetId) {
      setError('Missing Event ID.');
      return;
    }

    if (!form.title.trim()) {
      setError('Please provide an event title.');
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

    if (deadline > start) {
      setError('Registration deadline cannot be after event start time.');
      return;
    }

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
        ...(form.clubId ? { clubId: form.clubId } : {}),
        title: form.title.trim(),
        summary: form.summary.trim() || null,
        description: finalDescription,
        category: form.category,
        venue: form.venue.trim() || 'Silicon West Campus',
        onlineMeetingUrl: form.onlineMeetingUrl.trim() || '',
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
        registrationDeadline: deadline.toISOString(),
        capacity: form.isRegistrationRequired && form.capacity ? parseInt(form.capacity, 10) : null,
        status: form.status,
        bannerUrl: form.bannerUrl ? form.bannerUrl.trim() : '',

        // Direct Prisma Model Columns
        isRegistrationRequired: form.isRegistrationRequired,
        entryFee: form.entryFee.trim() || 'Free',
        eligibility: form.eligibility.trim() || null,
        isTeamEvent: form.isTeamEvent,
        minTeamSize: form.isTeamEvent ? parseInt(form.minTeamSize, 10) || 1 : 1,
        maxTeamSize: form.isTeamEvent ? parseInt(form.maxTeamSize, 10) || 1 : 1,
        prizePool: form.prizePool.trim() || null,
        rewards: meta.rewards || null,
        rules: meta.rules || null,
        timeline: validTimeline.length > 0 ? validTimeline : null,
        attachmentUrl: attachment?.data || null,
        attachmentName: attachment?.name || null,
        attachmentSize: attachment?.size || null,
        coordinator1Name: form.coordinator1Name.trim() || null,
        coordinator1Role: form.coordinator1Role.trim() || null,
        coordinator1Email: form.coordinator1Email.trim() || null,
        coordinator1Phone: form.coordinator1Phone.trim() || null,
        coordinator2Name: form.coordinator2Name.trim() || null,
        coordinator2Role: form.coordinator2Role.trim() || null,
        coordinator2Email: form.coordinator2Email.trim() || null,
        coordinator2Phone: form.coordinator2Phone.trim() || null,
        meta,
      };

      await eventsApi.update(targetId, payload);
      setSuccessMsg('Event updated successfully!');
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // After 1.5 seconds, navigate back to dashboard
      setTimeout(() => {
        router.push('/dashboard/events');
      }, 1500);
    } catch (err) {
      console.error('Update event error:', err);
      setError(err.message || 'Failed to update event. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 text-sm">
          <Loader2 className="w-5 h-5 animate-spin text-[#034694]" />
          <span>Loading event information...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 pb-24">
      {/* Top sticky action banner */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/dashboard/events"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Back to Events"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#034694] uppercase tracking-wider">
                  Event Settings
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  form.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                  form.status === 'DRAFT' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                  'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {form.status}
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                Edit: {form.title || 'Event Details'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {currentSlug && (
              <Link
                href={`/events/${currentSlug}`}
                target="_blank"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <span>View Live</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}
            <Link
              href="/dashboard/events"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#034694] hover:bg-[#02336e] transition-colors disabled:opacity-50 shadow-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-xs text-red-800 font-medium leading-relaxed">
              {error}
            </div>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-800 font-medium leading-relaxed">
              {successMsg}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SECTION 1: ESSENTIAL DETAILS */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Calendar className="w-4 h-4 text-[#034694]" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                1. Basic Event Information
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Organizing Club / Society <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.clubId}
                  onChange={(e) => setForm((prev) => ({ ...prev, clubId: e.target.value }))}
                  className="w-full text-xs rounded-lg border border-slate-200 p-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#034694]/20 focus:border-[#034694]"
                >
                  <option value="">-- Select Organizing Club --</option>
                  {clubs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.category || 'Club'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Event Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                  className="w-full text-xs rounded-lg border border-slate-200 p-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#034694]/20 focus:border-[#034694]"
                >
                  <option value="Technical">Technical (Coding, Robotics, AI, IoT)</option>
                  <option value="Cultural">Cultural (Music, Dance, Drama, Lit)</option>
                  <option value="Sports">Sports & Athletics</option>
                  <option value="Hackathon">Hackathon / Ideathon</option>
                  <option value="Workshop">Technical Workshop / Boot camp</option>
                  <option value="Seminar">Guest Lecture & Seminar</option>
                  <option value="Gaming">Esports & Gaming</option>
                  <option value="Entrepreneurship">Entrepreneurship & E-Cell</option>
                  <option value="Other">Other Campus Event</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Event Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. CodeForge Hackathon 2026"
                  className="w-full text-xs rounded-lg border border-slate-200 p-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#034694]/20 focus:border-[#034694] font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  URL Slug (Read-only)
                </label>
                <input
                  type="text"
                  disabled
                  value={form.slug}
                  className="w-full text-xs rounded-lg border border-slate-200 p-2.5 bg-slate-100 text-slate-500 font-mono cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Catchy Summary / Subtitle
              </label>
              <input
                type="text"
                value={form.summary}
                onChange={(e) => setForm((prev) => ({ ...prev, summary: e.target.value }))}
                placeholder="A high-impact 36-hour flagship hackathon solving real-world campus problems."
                className="w-full text-xs rounded-lg border border-slate-200 p-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#034694]/20 focus:border-[#034694]"
              />
            </div>

            {/* Markdown Description */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Detailed Event Description & Overview <span className="text-red-500">*</span>
                </label>
                <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
                  <button
                    type="button"
                    onClick={() => setDescTab('write')}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                      descTab === 'write' ? 'bg-white shadow-xs text-[#034694]' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Edit3 className="w-3 h-3 inline mr-1" />
                    Write
                  </button>
                  <button
                    type="button"
                    onClick={() => setDescTab('preview')}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                      descTab === 'preview' ? 'bg-white shadow-xs text-[#034694]' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Eye className="w-3 h-3 inline mr-1" />
                    Preview
                  </button>
                </div>
              </div>

              {descTab === 'write' ? (
                <div>
                  <div className="flex flex-wrap items-center gap-1.5 mb-2 pb-2 border-b border-slate-100">
                    <button
                      type="button"
                      onClick={() => insertMarkdown('bold')}
                      className="px-2 py-0.5 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded"
                    >
                      B
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('italic')}
                      className="px-2 py-0.5 text-[11px] italic bg-slate-100 hover:bg-slate-200 text-slate-700 rounded"
                    >
                      I
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('h2')}
                      className="px-2 py-0.5 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded"
                    >
                      H2 Heading
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('list')}
                      className="px-2 py-0.5 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded"
                    >
                      • Bullet List
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('code')}
                      className="px-2 py-0.5 text-[11px] font-mono bg-slate-100 hover:bg-slate-200 text-slate-700 rounded"
                    >
                      &lt;/&gt; Code
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('link')}
                      className="px-2 py-0.5 text-[11px] text-[#034694] bg-blue-50 hover:bg-blue-100 rounded"
                    >
                      Link
                    </button>
                  </div>
                  <textarea
                    rows={8}
                    value={form.description}
                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Provide a thorough overview of the event, eligibility, instructions, and outcomes..."
                    className="w-full text-xs font-mono rounded-lg border border-slate-200 p-3 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#034694]/20 focus:border-[#034694] leading-relaxed"
                  />
                </div>
              ) : (
                <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/30 min-h-[190px]">
                  {form.description ? (
                    <MarkdownView content={form.description} />
                  ) : (
                    <span className="text-xs text-slate-400 italic">No description written yet.</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* SECTION 2: SCHEDULE, VENUE & DATES */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Clock className="w-4 h-4 text-[#034694]" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                2. Venue, Timings & Deadlines
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Physical Venue / Location <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={form.venue}
                    onChange={(e) => setForm((prev) => ({ ...prev, venue: e.target.value }))}
                    placeholder="e.g. Main Auditorium / CSE Seminar Hall"
                    className="w-full text-xs rounded-lg border border-slate-200 pl-9 pr-3 py-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#034694]/20 focus:border-[#034694]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Online Stream / Meeting URL (Optional)
                </label>
                <input
                  type="url"
                  value={form.onlineMeetingUrl}
                  onChange={(e) => setForm((prev) => ({ ...prev, onlineMeetingUrl: e.target.value }))}
                  placeholder="https://meet.google.com/xyz-abc"
                  className="w-full text-xs rounded-lg border border-slate-200 p-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#034694]/20 focus:border-[#034694]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Event Starts At <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(e) => setForm((prev) => ({ ...prev, startsAt: e.target.value }))}
                  className="w-full text-xs rounded-lg border border-slate-200 p-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#034694]/20 focus:border-[#034694]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Event Ends At <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(e) => setForm((prev) => ({ ...prev, endsAt: e.target.value }))}
                  className="w-full text-xs rounded-lg border border-slate-200 p-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#034694]/20 focus:border-[#034694]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Registration Closes At <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={form.registrationDeadline}
                  onChange={(e) => setForm((prev) => ({ ...prev, registrationDeadline: e.target.value }))}
                  className="w-full text-xs rounded-lg border border-slate-200 p-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#034694]/20 focus:border-[#034694]"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: EVENT TIMELINE & PROGRAM SCHEDULE */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Milestone className="w-4 h-4 text-[#034694]" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  3. Program Agenda & Timeline
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTimelinePreset('hackathon')}
                  className="text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded transition-colors"
                >
                  Hackathon Preset
                </button>
                <button
                  type="button"
                  onClick={() => setTimelinePreset('workshop')}
                  className="text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded transition-colors"
                >
                  Workshop Preset
                </button>
                <button
                  type="button"
                  onClick={addTimelineItem}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-white bg-[#034694] hover:bg-[#02336e] px-2.5 py-1 rounded transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Add Milestone
                </button>
              </div>
            </div>

            {timeline.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-slate-200 rounded-lg">
                <p className="text-xs text-slate-500">No timeline milestones configured yet.</p>
                <button
                  type="button"
                  onClick={addTimelineItem}
                  className="mt-2 text-xs font-semibold text-[#034694] hover:underline"
                >
                  + Add first timeline item
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {timeline.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-start gap-3"
                  >
                    <div className="w-full sm:w-44 shrink-0">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Time / Day
                      </label>
                      <input
                        type="text"
                        value={item.time}
                        onChange={(e) => updateTimelineItem(index, 'time', e.target.value)}
                        placeholder="e.g. 10:00 AM / Day 1"
                        className="w-full text-xs rounded-md border border-slate-200 p-2 bg-white focus:outline-none focus:ring-1 focus:ring-[#034694]"
                      />
                    </div>

                    <div className="w-full flex-1 space-y-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Milestone Title
                        </label>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => updateTimelineItem(index, 'title', e.target.value)}
                          placeholder="e.g. Inauguration & Problem Statements"
                          className="w-full text-xs font-medium rounded-md border border-slate-200 p-2 bg-white focus:outline-none focus:ring-1 focus:ring-[#034694]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Brief Note (Optional)
                        </label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateTimelineItem(index, 'description', e.target.value)}
                          placeholder="Short description of activities or speaker"
                          className="w-full text-xs rounded-md border border-slate-200 p-2 bg-white focus:outline-none focus:ring-1 focus:ring-[#034694]"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeTimelineItem(index)}
                      className="p-2 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors self-end sm:self-center"
                      title="Remove milestone"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 4: REGISTRATION & TEAM SETTINGS */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Users className="w-4 h-4 text-[#034694]" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                4. Registration Rules & Team Participation
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Registration Mode
                </label>
                <div className="flex items-center gap-4 mt-2">
                  <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      checked={form.isRegistrationRequired}
                      onChange={() => setForm((prev) => ({ ...prev, isRegistrationRequired: true }))}
                      className="text-[#034694] focus:ring-[#034694]"
                    />
                    Required
                  </label>
                  <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      checked={!form.isRegistrationRequired}
                      onChange={() => setForm((prev) => ({ ...prev, isRegistrationRequired: false }))}
                      className="text-[#034694] focus:ring-[#034694]"
                    />
                    Open / Walk-in
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Participant Capacity Limit
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.capacity}
                  onChange={(e) => setForm((prev) => ({ ...prev, capacity: e.target.value }))}
                  placeholder="Leave empty for unlimited"
                  className="w-full text-xs rounded-lg border border-slate-200 p-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#034694]/20 focus:border-[#034694]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Entry Fee
                </label>
                <input
                  type="text"
                  value={form.entryFee}
                  onChange={(e) => setForm((prev) => ({ ...prev, entryFee: e.target.value }))}
                  placeholder="Free / ₹50 per person"
                  className="w-full text-xs rounded-lg border border-slate-200 p-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#034694]/20 focus:border-[#034694]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Eligibility Guidelines
              </label>
              <input
                type="text"
                value={form.eligibility}
                onChange={(e) => setForm((prev) => ({ ...prev, eligibility: e.target.value }))}
                placeholder="e.g. Open to all B.Tech / MCA students of Silicon West."
                className="w-full text-xs rounded-lg border border-slate-200 p-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#034694]/20 focus:border-[#034694]"
              />
            </div>

            {/* Team Participation */}
            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Team Participation Format
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Enable if participants must register in teams with a team leader and teammate search.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isTeamEvent}
                    onChange={(e) => setForm((prev) => ({ ...prev, isTeamEvent: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#034694]"></div>
                </label>
              </div>

              {form.isTeamEvent && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-blue-50/50 border border-blue-100">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Minimum Team Size
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={form.minTeamSize}
                      onChange={(e) => setForm((prev) => ({ ...prev, minTeamSize: e.target.value }))}
                      className="w-full text-xs rounded-lg border border-slate-200 p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#034694]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Maximum Team Size
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={form.maxTeamSize}
                      onChange={(e) => setForm((prev) => ({ ...prev, maxTeamSize: e.target.value }))}
                      className="w-full text-xs rounded-lg border border-slate-200 p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#034694]"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 5: REWARDS & GUIDELINES */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Trophy className="w-4 h-4 text-[#034694]" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                5. Rewards, Prizes & Rules
              </h2>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Total Prize Pool / Headline Reward
              </label>
              <input
                type="text"
                value={form.prizePool}
                onChange={(e) => setForm((prev) => ({ ...prev, prizePool: e.target.value }))}
                placeholder="e.g. ₹50,000 Cash Pool + Certificates & Trophies"
                className="w-full text-xs rounded-lg border border-slate-200 p-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#034694]/20 focus:border-[#034694]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Detailed Rewards (One per line)
                </label>
                <textarea
                  rows={4}
                  value={form.rewards}
                  onChange={(e) => setForm((prev) => ({ ...prev, rewards: e.target.value }))}
                  placeholder={`1st Prize: ₹25,000 + Winner Trophy\n2nd Prize: ₹15,000 + Merit Certificate\nAll Participants: Official Certificate`}
                  className="w-full text-xs rounded-lg border border-slate-200 p-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#034694]/20 focus:border-[#034694]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Rules & Regulations (One per line)
                </label>
                <textarea
                  rows={4}
                  value={form.rules}
                  onChange={(e) => setForm((prev) => ({ ...prev, rules: e.target.value }))}
                  placeholder={`Carry college ID card.\nBring your own laptop.\nPlagiarism leads to instant disqualification.`}
                  className="w-full text-xs rounded-lg border border-slate-200 p-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#034694]/20 focus:border-[#034694]"
                />
              </div>
            </div>
          </div>

          {/* SECTION 6: BANNER & ATTACHMENT */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <ImageIcon className="w-4 h-4 text-[#034694]" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                6. Banner Image & Brochure Attachment
              </h2>
            </div>

            {/* Banner */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Event Banner Graphic (16:9 recommended)
              </label>

              {form.bannerUrl ? (
                <div className="space-y-3">
                  <div className="relative rounded-lg overflow-hidden border border-slate-200 max-h-56 bg-slate-100">
                    <img
                      src={form.bannerUrl}
                      alt="Banner Preview"
                      className="w-full h-56 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, bannerUrl: '' }))}
                      className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-900/70 hover:bg-red-600 text-white transition-colors"
                      title="Remove Banner"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" /> Replace Banner
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-lg cursor-pointer hover:border-[#034694] hover:bg-blue-50/20 transition-all text-center">
                  <ImageIcon className="w-8 h-8 text-slate-400 mb-2" />
                  <span className="text-xs font-semibold text-slate-700">Click to upload event banner</span>
                  <span className="text-[11px] text-slate-400 mt-0.5">PNG, JPG, WEBP up to 10MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Document attachment */}
            <div className="pt-3 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Brochure / Rulebook Attachment (PDF / DOCX)
              </label>

              {attachment ? (
                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50">
                  <div className="flex items-center gap-2.5">
                    <Paperclip className="w-4 h-4 text-[#034694]" />
                    <div>
                      <div className="text-xs font-semibold text-slate-900">{attachment.name}</div>
                      <div className="text-[11px] text-slate-400">{attachment.size}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAttachment(null)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer">
                  <Paperclip className="w-3.5 h-3.5" /> Attach Document (Max 15MB)
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleAttachmentUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* SECTION 7: EVENT COORDINATORS */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <User className="w-4 h-4 text-[#034694]" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                7. Official Coordinators & Contact Details
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Coordinator 1 */}
              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/30 space-y-3">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                  Coordinator 1 (Faculty Lead)
                </span>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={form.coordinator1Name}
                    onChange={(e) => setForm((prev) => ({ ...prev, coordinator1Name: e.target.value }))}
                    placeholder="Dr. Alekha Dash"
                    className="w-full text-xs rounded-md border border-slate-200 p-2 bg-white focus:outline-none focus:ring-1 focus:ring-[#034694]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Role / Designation</label>
                  <input
                    type="text"
                    value={form.coordinator1Role}
                    onChange={(e) => setForm((prev) => ({ ...prev, coordinator1Role: e.target.value }))}
                    placeholder="Faculty Coordinator, CSE"
                    className="w-full text-xs rounded-md border border-slate-200 p-2 bg-white focus:outline-none focus:ring-1 focus:ring-[#034694]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Email</label>
                    <input
                      type="email"
                      value={form.coordinator1Email}
                      onChange={(e) => setForm((prev) => ({ ...prev, coordinator1Email: e.target.value }))}
                      placeholder="faculty@silicon.ac.in"
                      className="w-full text-xs rounded-md border border-slate-200 p-2 bg-white focus:outline-none focus:ring-1 focus:ring-[#034694]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={form.coordinator1Phone}
                      onChange={(e) => setForm((prev) => ({ ...prev, coordinator1Phone: e.target.value }))}
                      placeholder="+91 98765 43210"
                      className="w-full text-xs rounded-md border border-slate-200 p-2 bg-white focus:outline-none focus:ring-1 focus:ring-[#034694]"
                    />
                  </div>
                </div>
              </div>

              {/* Coordinator 2 */}
              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/30 space-y-3">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                  Coordinator 2 (Student Secretary)
                </span>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={form.coordinator2Name}
                    onChange={(e) => setForm((prev) => ({ ...prev, coordinator2Name: e.target.value }))}
                    placeholder="Rahul Tripathy"
                    className="w-full text-xs rounded-md border border-slate-200 p-2 bg-white focus:outline-none focus:ring-1 focus:ring-[#034694]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Role / Designation</label>
                  <input
                    type="text"
                    value={form.coordinator2Role}
                    onChange={(e) => setForm((prev) => ({ ...prev, coordinator2Role: e.target.value }))}
                    placeholder="Student Secretary"
                    className="w-full text-xs rounded-md border border-slate-200 p-2 bg-white focus:outline-none focus:ring-1 focus:ring-[#034694]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Email</label>
                    <input
                      type="email"
                      value={form.coordinator2Email}
                      onChange={(e) => setForm((prev) => ({ ...prev, coordinator2Email: e.target.value }))}
                      placeholder="events@siliconwest.in"
                      className="w-full text-xs rounded-md border border-slate-200 p-2 bg-white focus:outline-none focus:ring-1 focus:ring-[#034694]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={form.coordinator2Phone}
                      onChange={(e) => setForm((prev) => ({ ...prev, coordinator2Phone: e.target.value }))}
                      placeholder="+91 91234 56789"
                      className="w-full text-xs rounded-md border border-slate-200 p-2 bg-white focus:outline-none focus:ring-1 focus:ring-[#034694]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 8: STATUS & PUBLICATION */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Shield className="w-4 h-4 text-[#034694]" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                8. Event Status & Visibility
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Publication Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                  className="w-full text-xs rounded-lg border border-slate-200 p-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#034694]/20 focus:border-[#034694] font-semibold"
                >
                  <option value="PUBLISHED">PUBLISHED (Visible to all students)</option>
                  <option value="DRAFT">DRAFT (Hidden, only admins can view)</option>
                  <option value="CANCELLED">CANCELLED (Marked cancelled)</option>
                </select>
              </div>

              <div className="sm:col-span-2 flex items-center">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Published events are actively displayed on the college calendar and homepage. Draft events remain private until you decide to launch them.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Save Action Bar */}
          <div className="flex items-center justify-between pt-4">
            <Link
              href="/dashboard/events"
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-semibold text-white bg-[#034694] hover:bg-[#02336e] transition-colors disabled:opacity-50 shadow-md"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Updates...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

