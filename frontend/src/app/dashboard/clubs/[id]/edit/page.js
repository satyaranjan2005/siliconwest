'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Mail,
  Phone,
  User,
  UserCheck,
  Users,
  Plus,
  Trash2,
  Sparkles,
  Loader2,
  Shield,
  Layers,
  Save,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import { clubsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function EditClubPage() {
  const router = useRouter();
  const params = useParams();
  const clubIdOrSlug = params?.id;
  const { isSuperAdmin } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [actualClubId, setActualClubId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const [form, setForm] = useState({
    name: '',
    slug: '',
    category: 'Technical',
    shortDescription: '',
    description: '',
    logoUrl: '',
    bannerUrl: '',
    contactEmail: '',
    contactPhone: '',

    // Faculty Advisor
    facultyCoordinator: '',
    facultyCoordinatorEmail: '',
    facultyCoordinatorPhone: '',
    facultyCoordinatorPhoto: '',
    facultyDept: 'Associate Professor, CSE',

    // Student General Secretary
    secretary: '',
    secretaryEmail: '',
    secretaryPhone: '',
    secretaryBranch: 'B.Tech CSE',
    secretaryYear: '4th Year',
    secretaryPhoto: '',

    // Student Joint Secretary
    jointSecretary: '',
    jointSecretaryEmail: '',
    jointSecretaryPhone: '',
    jointSecretaryBranch: 'B.Tech CSE',
    jointSecretaryYear: '3rd Year',
    jointSecretaryPhoto: '',

    isPublic: true,
    isArchived: false,
  });

  // Dynamic Coordinators List (from 2nd, 3rd, 4th Year)
  const [coordinators, setCoordinators] = useState([]);

  useEffect(() => {
    async function loadClubData() {
      if (!clubIdOrSlug) return;
      setLoading(true);
      setError(null);
      try {
        const club = await clubsApi.getBySlug(clubIdOrSlug);
        if (!club) {
          setError('Club not found.');
          return;
        }

        setActualClubId(club.id);
        setForm({
          name: club.name || '',
          slug: club.slug || '',
          category: club.category || 'Technical',
          shortDescription: club.shortDescription || '',
          description: club.description || '',
          logoUrl: club.logoUrl || '',
          bannerUrl: club.bannerUrl || '',
          contactEmail: club.contactEmail || '',
          contactPhone: club.contactPhone || '',

          facultyCoordinator: club.facultyCoordinator || '',
          facultyCoordinatorEmail: club.facultyCoordinatorEmail || '',
          facultyCoordinatorPhone: club.facultyCoordinatorPhone || '',
          facultyCoordinatorPhoto: club.facultyCoordinatorPhoto || '',
          facultyDept: club.facultyDept || 'Associate Professor, CSE',

          secretary: club.secretary || '',
          secretaryEmail: club.secretaryEmail || '',
          secretaryPhone: club.secretaryPhone || '',
          secretaryBranch: club.secretaryBranch || 'B.Tech CSE',
          secretaryYear: club.secretaryYear || '4th Year',
          secretaryPhoto: club.secretaryPhoto || '',

          jointSecretary: club.jointSecretary || '',
          jointSecretaryEmail: club.jointSecretaryEmail || '',
          jointSecretaryPhone: club.jointSecretaryPhone || '',
          jointSecretaryBranch: club.jointSecretaryBranch || 'B.Tech CSE',
          jointSecretaryYear: club.jointSecretaryYear || '3rd Year',
          jointSecretaryPhoto: club.jointSecretaryPhoto || '',

          isPublic: club.isPublic ?? true,
          isArchived: club.isArchived ?? false,
        });

        if (Array.isArray(club.coordinators) && club.coordinators.length > 0) {
          setCoordinators(
            club.coordinators.map((c, i) => ({
              id: Date.now() + i,
              name: c.name || '',
              role: c.role || '',
              year: c.year || '3rd Year',
              branch: c.branch || 'B.Tech CSE',
              email: c.email || '',
              phone: c.phone || '',
              photoUrl: c.photoUrl || '',
            }))
          );
        } else {
          setCoordinators([
            {
              id: 1,
              name: '',
              role: '',
              year: '3rd Year',
              branch: 'B.Tech CSE',
              email: '',
              phone: '',
              photoUrl: '',
            },
          ]);
        }
      } catch (err) {
        console.error('Failed to load club:', err);
        setError(err.message || 'Failed to retrieve club details.');
      } finally {
        setLoading(false);
      }
    }

    loadClubData();
  }, [clubIdOrSlug]);

  const addCoordinator = (year = '3rd Year') => {
    setCoordinators((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        name: '',
        role: '',
        year: year,
        branch: 'B.Tech CSE',
        email: '',
        phone: '',
        photoUrl: '',
      },
    ]);
  };

  const updateCoordinator = (index, field, value) => {
    setCoordinators((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const removeCoordinator = (index) => {
    setCoordinators((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCoordinatorPhotoUpload = (e, index) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (PNG, JPG, WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Coordinator photo size exceeds 5MB limit.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 400;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        updateCoordinator(index, 'photoUrl', canvas.toDataURL('image/jpeg', 0.88));
        setError(null);
      };
      img.src = uploadEvent.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Dedicated Image Compressor for Logos, Banners & Leadership Photos
  const handleFileUpload = (e, fieldKey, maxDimension = 800, quality = 0.85) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit. Please choose a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        setForm((prev) => ({ ...prev, [fieldKey]: compressedDataUrl }));
        setError(null);
      };
      img.src = uploadEvent.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!form.name.trim()) {
      setError('Please provide a club/society name.');
      return;
    }
    if (!form.description.trim() || form.description.trim().length < 10) {
      setError('Description must be at least 10 characters long.');
      return;
    }

    setSubmitting(true);
    try {
      const validCoordinators = coordinators
        .filter((c) => c.name && c.name.trim().length > 0)
        .map((c) => ({
          name: c.name.trim(),
          role: (c.role || '').trim() || undefined,
          year: c.year || '3rd Year',
          branch: c.branch.trim() || undefined,
          email: c.email.trim() || undefined,
          phone: c.phone.trim() || undefined,
          photoUrl: c.photoUrl || undefined,
        }));

      const payload = {
        name: form.name.trim(),
        category: form.category,
        shortDescription: form.shortDescription.trim() || null,
        description: form.description.trim(),
        logoUrl: form.logoUrl || null,
        bannerUrl: form.bannerUrl || null,
        contactEmail: form.contactEmail.trim() || null,
        contactPhone: form.contactPhone.trim() || null,

        // Faculty Advisor
        facultyCoordinator: form.facultyCoordinator.trim() || null,
        facultyCoordinatorEmail: form.facultyCoordinatorEmail.trim() || null,
        facultyCoordinatorPhone: form.facultyCoordinatorPhone.trim() || null,
        facultyCoordinatorPhoto: form.facultyCoordinatorPhoto || null,
        facultyDept: form.facultyDept.trim() || null,

        // Student General Secretary
        secretary: form.secretary.trim() || null,
        secretaryEmail: form.secretaryEmail.trim() || null,
        secretaryPhone: form.secretaryPhone.trim() || null,
        secretaryBranch: form.secretaryBranch.trim() || null,
        secretaryYear: form.secretaryYear || null,
        secretaryPhoto: form.secretaryPhoto || null,

        // Student Joint Secretary
        jointSecretary: form.jointSecretary.trim() || null,
        jointSecretaryEmail: form.jointSecretaryEmail.trim() || null,
        jointSecretaryPhone: form.jointSecretaryPhone.trim() || null,
        jointSecretaryBranch: form.jointSecretaryBranch.trim() || null,
        jointSecretaryYear: form.jointSecretaryYear || null,
        jointSecretaryPhoto: form.jointSecretaryPhoto || null,

        // Student Coordinators List
        coordinators: validCoordinators,

        isPublic: form.isPublic,
      };

      const targetId = actualClubId || clubIdOrSlug;
      await clubsApi.update(targetId, payload);
      setSuccessMsg('Society charter details updated successfully!');
      setTimeout(() => {
        router.push('/dashboard/clubs');
      }, 1200);
    } catch (err) {
      console.error('Update club error:', err);
      setError(err.message || 'Failed to update society charter. Please check all fields.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClub = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      const targetId = actualClubId || clubIdOrSlug;
      await clubsApi.delete(targetId);
      router.push('/dashboard/clubs');
    } catch (err) {
      console.error('Delete club error:', err);
      setDeleteError(err.message || 'Failed to delete society.');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#034694]" />
        <p className="text-xs font-semibold text-slate-500">Loading society charter data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/clubs"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Clubs Directory</span>
        </Link>

        {form.slug && (
          <Link
            href={`/clubs/${form.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#034694] hover:underline"
          >
            <span>View Public Page</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-1">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#034694]">
          <Building2 className="w-3.5 h-3.5" />
          <span>Charter Management</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Edit Society &amp; Executive Council
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Update institutional records, faculty advisor, student leadership, year-wise coordinators, and visual identity.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Core Charter Details */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#034694]" />
            Core Charter Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700">Club / Society Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Silicon Coding Club"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#034694]/20"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">URL Slug *</label>
              <input
                type="text"
                value={form.slug}
                disabled
                className="w-full px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono text-slate-500 cursor-not-allowed"
              />
              <p className="text-[10px] text-slate-400">Slug is permanent to preserve public link bookmarks.</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Domain / Category *</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#034694]/20"
              >
                <option value="Technical">Technical &amp; Engineering</option>
                <option value="Cultural">Cultural, Music &amp; Dance</option>
                <option value="Sports">Sports &amp; Athletics</option>
                <option value="Media & Arts">Media, Literature &amp; Arts</option>
                <option value="Social & Community">Social, NSS &amp; Community</option>
                <option value="Academic">Academic &amp; Research</option>
              </select>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700">Short Summary / Mission Tagline</label>
              <input
                type="text"
                value={form.shortDescription}
                onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
                placeholder="Brief one-line summary of club objectives"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#034694]/20"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700">Detailed Charter Description *</label>
              <textarea
                rows={5}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Comprehensive overview of society vision, regular activities, annual events, and member benefits..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#034694]/20 leading-relaxed"
                required
              />
            </div>
          </div>
        </div>

        {/* Section 2: Visual Branding & Media */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-[#034694]" />
            Visual Identity &amp; Media Assets
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Society Logo Upload */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Society Emblem / Logo</span>
                <span className="text-[10px] text-slate-400 font-normal">PNG / JPG / WebP</span>
              </label>

              <div className="border border-dashed border-slate-200 rounded-2xl p-4 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col items-center justify-center gap-3">
                {form.logoUrl ? (
                  <div className="relative group w-24 h-24 rounded-2xl overflow-hidden border border-slate-200 shadow-xs bg-white">
                    <img src={form.logoUrl} alt="Club Logo Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, logoUrl: '' })}
                      className="absolute inset-0 bg-slate-900/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-semibold"
                    >
                      Change Logo
                    </button>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#034694] flex items-center justify-center border border-blue-100">
                    <Upload className="w-6 h-6" />
                  </div>
                )}

                <div className="space-y-1">
                  <label
                    htmlFor="logo-file-input"
                    className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-[#034694] text-[#034694] text-xs font-bold rounded-xl shadow-2xs transition-all"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Emblem</span>
                  </label>
                  <input
                    id="logo-file-input"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'logoUrl', 400, 0.9)}
                    className="hidden"
                  />
                  <p className="text-[10px] text-slate-400">
                    Recommended: <strong>400 × 400 px</strong> (Square 1:1), Max 5MB
                  </p>
                </div>
              </div>
            </div>

            {/* Society Cover Banner Upload */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Society Cover Banner</span>
                <span className="text-[10px] text-slate-400 font-normal">PNG / JPG / WebP</span>
              </label>

              <div className="border border-dashed border-slate-200 rounded-2xl p-4 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col items-center justify-center gap-3">
                {form.bannerUrl ? (
                  <div className="relative group w-full h-24 rounded-2xl overflow-hidden border border-slate-200 shadow-xs bg-white">
                    <img src={form.bannerUrl} alt="Cover Banner Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, bannerUrl: '' })}
                      className="absolute inset-0 bg-slate-900/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-semibold"
                    >
                      Change Banner
                    </button>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                )}

                <div className="space-y-1">
                  <label
                    htmlFor="banner-file-input"
                    className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-[#034694] text-[#034694] text-xs font-bold rounded-xl shadow-2xs transition-all"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Banner</span>
                  </label>
                  <input
                    id="banner-file-input"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'bannerUrl', 1200, 0.85)}
                    className="hidden"
                  />
                  <p className="text-[10px] text-slate-400">
                    Recommended: <strong>1200 × 400 px</strong> (3:1 Panorama), Max 10MB
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Official Contact Channels */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#034694]" />
            Official Contact Channels
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Official Society Email</label>
              <input
                type="email"
                value={form.contactEmail}
                onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                placeholder="society@silicon.ac.in"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#034694]/20"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Official Contact Number</label>
              <input
                type="tel"
                value={form.contactPhone}
                onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                placeholder="+91 98610 XXXXX"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#034694]/20"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Faculty Advisor Mentorship */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-[#034694]" />
            Faculty Advisor Mentorship
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Faculty Advisor Full Name</label>
              <input
                type="text"
                value={form.facultyCoordinator}
                onChange={(e) => setForm({ ...form, facultyCoordinator: e.target.value })}
                placeholder="e.g. Dr. Amrit Ranjan Mohanty"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#034694]/20"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Academic Department &amp; Designation</label>
              <input
                type="text"
                value={form.facultyDept}
                onChange={(e) => setForm({ ...form, facultyDept: e.target.value })}
                placeholder="e.g. Associate Professor, Dept. of CSE"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#034694]/20"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Institutional Email</label>
              <input
                type="email"
                value={form.facultyCoordinatorEmail}
                onChange={(e) => setForm({ ...form, facultyCoordinatorEmail: e.target.value })}
                placeholder="amrit.mohanty@silicon.ac.in"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#034694]/20"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Faculty Contact Number</label>
              <input
                type="tel"
                value={form.facultyCoordinatorPhone}
                onChange={(e) => setForm({ ...form, facultyCoordinatorPhone: e.target.value })}
                placeholder="+91 94370 XXXXX"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#034694]/20"
              />
            </div>

            {/* Faculty Advisor Photo Uploader */}
            <div className="sm:col-span-2 pt-2 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                  {form.facultyCoordinatorPhoto ? (
                    <img src={form.facultyCoordinatorPhoto} alt="Faculty Advisor" className="w-full h-full object-cover" />
                  ) : (
                    <GraduationCap className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Faculty Advisor Profile Photo</p>
                  <p className="text-[10px] text-slate-400">Square 1:1 portrait (Max 3MB, PNG/JPG)</p>
                </div>
              </div>

              <div>
                <label
                  htmlFor="faculty-photo-input"
                  className="cursor-pointer inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{form.facultyCoordinatorPhoto ? 'Replace Photo' : 'Upload Photo'}</span>
                </label>
                <input
                  id="faculty-photo-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'facultyCoordinatorPhoto', 400, 0.88)}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Student General Secretary */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#034694]" />
            Student General Secretary
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">General Secretary Name</label>
              <input
                type="text"
                value={form.secretary}
                onChange={(e) => setForm({ ...form, secretary: e.target.value })}
                placeholder="e.g. Siddharth Patnaik"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#034694]/20"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Academic Branch</label>
              <input
                type="text"
                value={form.secretaryBranch}
                onChange={(e) => setForm({ ...form, secretaryBranch: e.target.value })}
                placeholder="e.g. B.Tech CSE"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#034694]/20"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Academic Year</label>
              <select
                value={form.secretaryYear}
                onChange={(e) => setForm({ ...form, secretaryYear: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#034694]/20"
              >
                <option value="4th Year">4th Year (Senior Lead)</option>
                <option value="3rd Year">3rd Year</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Official Student Email</label>
              <input
                type="email"
                value={form.secretaryEmail}
                onChange={(e) => setForm({ ...form, secretaryEmail: e.target.value })}
                placeholder="siddharth.scc@silicon.ac.in"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#034694]/20"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700">Secretary Contact Phone</label>
              <input
                type="tel"
                value={form.secretaryPhone}
                onChange={(e) => setForm({ ...form, secretaryPhone: e.target.value })}
                placeholder="+91 98610 23451"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#034694]/20"
              />
            </div>

            {/* Secretary Photo Uploader */}
            <div className="sm:col-span-2 pt-2 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                  {form.secretaryPhoto ? (
                    <img src={form.secretaryPhoto} alt="General Secretary" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">General Secretary Profile Photo</p>
                  <p className="text-[10px] text-slate-400">Square 1:1 portrait (Max 3MB, PNG/JPG)</p>
                </div>
              </div>

              <div>
                <label
                  htmlFor="secretary-photo-input"
                  className="cursor-pointer inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{form.secretaryPhoto ? 'Replace Photo' : 'Upload Photo'}</span>
                </label>
                <input
                  id="secretary-photo-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'secretaryPhoto', 400, 0.88)}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 6: Student Joint Secretary */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#034694]" />
            Student Joint Secretary
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Joint Secretary Name</label>
              <input
                type="text"
                value={form.jointSecretary}
                onChange={(e) => setForm({ ...form, jointSecretary: e.target.value })}
                placeholder="e.g. Ananya Dash"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#034694]/20"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Academic Branch</label>
              <input
                type="text"
                value={form.jointSecretaryBranch}
                onChange={(e) => setForm({ ...form, jointSecretaryBranch: e.target.value })}
                placeholder="e.g. B.Tech CSE"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#034694]/20"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Academic Year</label>
              <select
                value={form.jointSecretaryYear}
                onChange={(e) => setForm({ ...form, jointSecretaryYear: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#034694]/20"
              >
                <option value="3rd Year">3rd Year (Junior Executive)</option>
                <option value="2nd Year">2nd Year</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Official Student Email</label>
              <input
                type="email"
                value={form.jointSecretaryEmail}
                onChange={(e) => setForm({ ...form, jointSecretaryEmail: e.target.value })}
                placeholder="ananya.scc@silicon.ac.in"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#034694]/20"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700">Joint Secretary Contact Phone</label>
              <input
                type="tel"
                value={form.jointSecretaryPhone}
                onChange={(e) => setForm({ ...form, jointSecretaryPhone: e.target.value })}
                placeholder="+91 98611 XXXXX"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#034694]/20"
              />
            </div>

            {/* Joint Secretary Photo Uploader */}
            <div className="sm:col-span-2 pt-2 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                  {form.jointSecretaryPhoto ? (
                    <img src={form.jointSecretaryPhoto} alt="Joint Secretary" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Joint Secretary Profile Photo</p>
                  <p className="text-[10px] text-slate-400">Square 1:1 portrait (Max 3MB, PNG/JPG)</p>
                </div>
              </div>

              <div>
                <label
                  htmlFor="joint-secretary-photo-input"
                  className="cursor-pointer inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{form.jointSecretaryPhoto ? 'Replace Photo' : 'Upload Photo'}</span>
                </label>
                <input
                  id="joint-secretary-photo-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'jointSecretaryPhoto', 400, 0.88)}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 7: Dynamic Student Coordinators (2nd, 3rd, 4th Year) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#034694]" />
                Student Coordinators Council ({coordinators.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Add coordinators across <strong>2nd, 3rd, and 4th year</strong> cohorts with photos.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => addCoordinator('4th Year')}
                className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#034694] text-xs font-bold transition-colors inline-flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>+ 4th Year</span>
              </button>
              <button
                type="button"
                onClick={() => addCoordinator('3rd Year')}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-colors inline-flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>+ 3rd Year</span>
              </button>
              <button
                type="button"
                onClick={() => addCoordinator('2nd Year')}
                className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold transition-colors inline-flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>+ 2nd Year</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {coordinators.map((c, index) => (
              <div
                key={c.id || index}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center shadow-2xs">
                      {index + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-800">Coordinator Profile</span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                        c.year === '4th Year'
                          ? 'bg-blue-100 text-blue-800'
                          : c.year === '3rd Year'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {c.year}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeCoordinator(index)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-50"
                    title="Remove coordinator"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700">Student Name *</label>
                    <input
                      type="text"
                      value={c.name}
                      onChange={(e) => updateCoordinator(index, 'name', e.target.value)}
                      placeholder="e.g. Soumya Ranjan"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700">Academic Year</label>
                    <select
                      value={c.year}
                      onChange={(e) => updateCoordinator(index, 'year', e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    >
                      <option value="4th Year">4th Year (Senior Lead)</option>
                      <option value="3rd Year">3rd Year (Core Coordinator)</option>
                      <option value="2nd Year">2nd Year (Junior Lead)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700">Branch &amp; Dept</label>
                    <input
                      type="text"
                      value={c.branch}
                      onChange={(e) => updateCoordinator(index, 'branch', e.target.value)}
                      placeholder="e.g. B.Tech CSE"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[11px] font-semibold text-slate-700">Email Address</label>
                    <input
                      type="email"
                      value={c.email}
                      onChange={(e) => updateCoordinator(index, 'email', e.target.value)}
                      placeholder="student@silicon.ac.in"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700">Contact Number (Optional)</label>
                    <input
                      type="tel"
                      value={c.phone}
                      onChange={(e) => updateCoordinator(index, 'phone', e.target.value)}
                      placeholder="+91 98765 00000"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>

                {/* Photo Uploader */}
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                      {c.photoUrl ? (
                        <img src={c.photoUrl} alt={c.name || 'Coordinator'} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-800">Coordinator Photo</p>
                      <p className="text-[9px] text-slate-400">1:1 Square portrait</p>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor={`coord-photo-${index}`}
                      className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 transition-colors shadow-2xs"
                    >
                      <Upload className="w-3 h-3" />
                      <span>{c.photoUrl ? 'Replace' : 'Upload Photo'}</span>
                    </label>
                    <input
                      id={`coord-photo-${index}`}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleCoordinatorPhotoUpload(e, index)}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 8: Visibility & Charter Status */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#034694]" />
            Publication &amp; Directory Status
          </h2>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-slate-900">List in Public Campus Directory</p>
              <p className="text-[11px] text-slate-500">
                Make this society visible to all university students, faculties, and guests.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPublic}
                onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#034694]"></div>
            </label>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/dashboard/clubs"
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="bg-[#034694] hover:bg-[#02336d] text-white font-bold text-xs h-10 px-6 rounded-xl shadow-xs flex items-center gap-2 transition-all disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Update Society Charter</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Danger Zone: Delete Society */}
      {isSuperAdmin && (
        <div className="bg-rose-50/60 border border-rose-200 rounded-2xl p-6 sm:p-8 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-rose-950 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Danger Zone: Delete Society
              </h3>
              <p className="text-xs text-rose-700/80 leading-relaxed max-w-xl">
                Permanently delete <strong>&ldquo;{form.name}&rdquo;</strong>, its leadership council records, and all associated event entries. This operation is permanent and cannot be undone.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setDeleteError(null);
                setShowDeleteConfirm(true);
              }}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0 flex items-center gap-2 self-start sm:self-center"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Society</span>
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">
                  Permanently delete &ldquo;{form.name}&rdquo;?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Are you absolutely sure? All registered council roles, executive records, and related event schedules will be permanently wiped from the database.
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={deleting}
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteError(null);
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteClub}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

