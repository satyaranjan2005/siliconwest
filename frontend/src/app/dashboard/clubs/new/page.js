'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  MapPin,
  Clock,
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
  X,
} from 'lucide-react';
import { clubsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function CreateClubPage() {
  const router = useRouter();
  const { isSuperAdmin } = useAuth();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

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
    facultyDept: '',
    facultyCoordinatorPhoto: '',

    // Student General Secretary
    secretary: '',
    secretaryEmail: '',
    secretaryPhone: '',
    secretaryBranch: '',
    secretaryPhoto: '',

    // Student Joint Secretary
    jointSecretary: '',
    jointSecretaryEmail: '',
    jointSecretaryPhone: '',
    jointSecretaryBranch: '',
    jointSecretaryPhoto: '',

    isPublic: true,
  });

  // Dynamic Coordinators List (from 2nd, 3rd, 4th Year)
  const [coordinators, setCoordinators] = useState([
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

  const handleNameChange = (e) => {
    const val = e.target.value;
    const autoSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setForm((prev) => ({
      ...prev,
      name: val,
      slug: autoSlug,
    }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (PNG, JPG, WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Logo file size exceeds 5MB limit. Please select a smaller image.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 500;
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
        setForm((prev) => ({ ...prev, logoUrl: canvas.toDataURL('image/jpeg', 0.85) }));
        setError(null);
      };
      img.src = uploadEvent.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleBannerUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (PNG, JPG, WEBP).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Banner file size exceeds 10MB limit. Please select a smaller image.');
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
        const maxHeight = 600;
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

  // Generic profile photo uploader for Faculty Coordinator, Secretary, and Joint Secretary
  const handlePhotoUpload = (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (PNG, JPG, WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Photo file size exceeds 5MB limit. Please select a smaller image.');
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
        setForm((prev) => ({ ...prev, [field]: canvas.toDataURL('image/jpeg', 0.88) }));
        setError(null);
      };
      img.src = uploadEvent.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError('Please provide a club/society name.');
      return;
    }
    if (!form.slug.trim()) {
      setError('Please provide a URL slug.');
      return;
    }
    if (!form.description.trim() || form.description.trim().length < 10) {
      setError('Description must be at least 10 characters long.');
      return;
    }

    setSubmitting(true);
    try {
      // Build clean list of coordinators from 2nd, 3rd, 4th year
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
        slug: form.slug.trim().toLowerCase(),
        category: form.category,
        shortDescription: form.shortDescription.trim() || undefined,
        description: form.description.trim(),
        logoUrl: form.logoUrl || undefined,
        bannerUrl: form.bannerUrl || undefined,
        contactEmail: form.contactEmail.trim() || undefined,
        contactPhone: form.contactPhone.trim() || undefined,

        // Faculty Advisor
        facultyCoordinator: form.facultyCoordinator.trim() || undefined,
        facultyCoordinatorEmail: form.facultyCoordinatorEmail.trim() || undefined,
        facultyCoordinatorPhone: form.facultyCoordinatorPhone.trim() || undefined,
        facultyCoordinatorPhoto: form.facultyCoordinatorPhoto || undefined,
        facultyDept: form.facultyDept.trim() || undefined,

        // Student General Secretary
        secretary: form.secretary.trim() || undefined,
        secretaryEmail: form.secretaryEmail.trim() || undefined,
        secretaryPhone: form.secretaryPhone.trim() || undefined,
        secretaryBranch: form.secretaryBranch.trim() || undefined,
        secretaryYear: form.secretaryYear || undefined,
        secretaryPhoto: form.secretaryPhoto || undefined,

        // Student Joint Secretary
        jointSecretary: form.jointSecretary.trim() || undefined,
        jointSecretaryEmail: form.jointSecretaryEmail.trim() || undefined,
        jointSecretaryPhone: form.jointSecretaryPhone.trim() || undefined,
        jointSecretaryBranch: form.jointSecretaryBranch.trim() || undefined,
        jointSecretaryYear: form.jointSecretaryYear || undefined,
        jointSecretaryPhoto: form.jointSecretaryPhoto || undefined,

        // Student Coordinators List
        coordinators: validCoordinators,

        isPublic: form.isPublic,
      };

      await clubsApi.create(payload);
      router.push('/dashboard/clubs');
    } catch (err) {
      console.error('Create club error:', err);
      setError(err.message || 'Failed to create society charter. Please check all fields.');
    } finally {
      setSubmitting(false);
    }
  };

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
      </div>

      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-1">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#034694]">
          <Building2 className="w-3.5 h-3.5" />
          <span>Charter Registration</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Register New Society &amp; Executive Council
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Charter a recognized student club, appoint faculty advisor, executive secretaries &amp; student coordinators, and configure visual branding.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
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
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Society Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={handleNameChange}
                placeholder="e.g. RoboSilicon - Robotics & IoT Club"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#034694] focus:border-[#034694]"
                required
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                URL Slug <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center">
                <span className="px-3 py-2 bg-slate-100 border border-r-0 border-slate-200 rounded-l-lg text-xs text-slate-500 select-none">
                  /clubs/
                </span>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })}
                  placeholder="robosilicon"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-r-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#034694] focus:border-[#034694]"
                  required
                />
              </div>
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#034694] focus:border-[#034694]"
              >
                <option value="Technical">Technical &amp; Research</option>
                <option value="Cultural">Cultural &amp; Performing Arts</option>
                <option value="Sports">Sports &amp; Athletics</option>
                <option value="Media & Arts">Media &amp; Photography</option>
                <option value="General">General Campus Society</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Visual Branding (Logo & Banner) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-6">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-[#034694]" />
              Visual Branding &amp; Media
            </h2>
            <span className="text-[11px] text-slate-400 font-medium">PNG, JPG, WEBP formats</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Logo Upload Card */}
            <div className="space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <label className="text-xs font-bold text-slate-800">Society Logo Badge</label>
                <span className="text-[10px] font-semibold text-[#034694] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">
                  Recommended: 400 × 400 px (1:1) • Max 5MB
                </span>
              </div>

              {form.logoUrl ? (
                <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="w-20 h-20 rounded-xl bg-white border border-slate-200 p-1 shrink-0 overflow-hidden flex items-center justify-center shadow-xs">
                    <img src={form.logoUrl} alt="Logo preview" className="w-full h-full object-cover rounded-lg" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div>
                      <div className="text-xs font-bold text-slate-900">Logo Uploaded</div>
                      <p className="text-[11px] text-slate-500">Ready for official society profile &amp; directory badge</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer shadow-2xs transition-colors">
                        <Upload className="w-3.5 h-3.5 text-[#034694]" />
                        <span>Replace</span>
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                      </label>
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, logoUrl: '' }))}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 hover:border-[#034694] rounded-2xl bg-slate-50/50 hover:bg-blue-50/20 cursor-pointer transition-all group">
                  <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-[#034694] group-hover:border-[#034694]/30 shadow-2xs mb-2.5 transition-colors">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 group-hover:text-[#034694] transition-colors">
                    Click to select Society Logo
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1 text-center">
                    Square 1:1 format • 400 × 400 px recommended (Max 5MB)
                  </span>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
              )}
            </div>

            {/* Banner Upload Card */}
            <div className="space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <label className="text-xs font-bold text-slate-800">Society Cover Banner</label>
                <span className="text-[10px] font-semibold text-[#034694] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">
                  Recommended: 1200 × 400 px (3:1) • Max 10MB
                </span>
              </div>

              {form.bannerUrl ? (
                <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="h-28 w-full rounded-xl overflow-hidden border border-slate-200 bg-white">
                    <img src={form.bannerUrl} alt="Banner preview" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-medium">Cover banner active</span>
                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer shadow-2xs transition-colors">
                        <Upload className="w-3.5 h-3.5 text-[#034694]" />
                        <span>Replace</span>
                        <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
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
                <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 hover:border-[#034694] rounded-2xl bg-slate-50/50 hover:bg-blue-50/20 cursor-pointer transition-all group">
                  <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-[#034694] group-hover:border-[#034694]/30 shadow-2xs mb-2.5 transition-colors">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 group-hover:text-[#034694] transition-colors">
                    Click to select Cover Banner
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1 text-center">
                    Panoramic 3:1 format • 1200 × 400 px recommended (Max 10MB)
                  </span>
                  <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Overview & Description */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#034694]" />
            Mission &amp; About Description
          </h2>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">Short Tagline</label>
                <span className="text-[10px] text-slate-400">
                  {form.shortDescription.length}/120 characters
                </span>
              </div>
              <input
                type="text"
                maxLength={120}
                value={form.shortDescription}
                onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
                placeholder="e.g. Empowering students to build next-generation robotics and IoT systems."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#034694] focus:border-[#034694]"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  Full Description &amp; Objectives <span className="text-rose-500">*</span>
                </label>
                <span className={`text-[10px] ${form.description.length < 10 ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>
                  {form.description.length} chars (min 10)
                </span>
              </div>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Comprehensive overview of society vision, regular projects, hackathons, and workshops..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#034694] focus:border-[#034694]"
                required
              />
            </div>
          </div>
        </div>

        {/* Section 4: Official Contact */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#034694]" />
            Official Society Contact
          </h2>

          <div className="max-w-md space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Official Contact Email</label>
            <input
              type="email"
              value={form.contactEmail}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
              placeholder="club@silicon.ac.in"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#034694] focus:border-[#034694]"
            />
          </div>
        </div>

        {/* Section 5: Faculty Advisor */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-[#034694]" />
              Faculty Advisor Mentorship
            </h2>
            <span className="text-[11px] text-slate-400">Chief Faculty Mentor</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Faculty Coordinator Name</label>
              <input
                type="text"
                value={form.facultyCoordinator}
                onChange={(e) => setForm({ ...form, facultyCoordinator: e.target.value })}
                placeholder="e.g. Dr. Amrit Ranjan Mohanty"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#034694] focus:border-[#034694]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Department / Designation</label>
              <input
                type="text"
                value={form.facultyDept}
                onChange={(e) => setForm({ ...form, facultyDept: e.target.value })}
                placeholder="Associate Professor, Dept. of CSE"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#034694] focus:border-[#034694]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Faculty Email</label>
              <input
                type="email"
                value={form.facultyCoordinatorEmail}
                onChange={(e) => setForm({ ...form, facultyCoordinatorEmail: e.target.value })}
                placeholder="faculty@silicon.ac.in"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#034694] focus:border-[#034694]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Faculty Contact Number</label>
              <input
                type="tel"
                value={form.facultyCoordinatorPhone}
                onChange={(e) => setForm({ ...form, facultyCoordinatorPhone: e.target.value })}
                placeholder="+91 98610 00000"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#034694] focus:border-[#034694]"
              />
            </div>

            {/* Photo Uploader */}
            <div className="sm:col-span-2 pt-3 border-t border-slate-100">
              <label className="text-xs font-semibold text-slate-700 block mb-2">Faculty Advisor Profile Photo</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs">
                  {form.facultyCoordinatorPhoto ? (
                    <img src={form.facultyCoordinatorPhoto} alt="Faculty Coordinator" className="w-full h-full object-cover" />
                  ) : (
                    <GraduationCap className="w-7 h-7 text-slate-400" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer shadow-2xs transition-colors">
                      <Upload className="w-3.5 h-3.5 text-[#034694]" />
                      <span>{form.facultyCoordinatorPhoto ? 'Change Photo' : 'Upload Advisor Photo'}</span>
                      <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, 'facultyCoordinatorPhoto')} className="hidden" />
                    </label>
                    {form.facultyCoordinatorPhoto && (
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, facultyCoordinatorPhoto: '' }))}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">Square 1:1 • Recommended: 400 × 400 px (Max 5MB)</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 6: Student General Secretary */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <User className="w-4 h-4 text-[#034694]" />
              Student General Secretary
            </h2>
            <span className="text-[11px] text-slate-400">Executive Council Head</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Secretary Name</label>
              <input
                type="text"
                value={form.secretary}
                onChange={(e) => setForm({ ...form, secretary: e.target.value })}
                placeholder="e.g. Siddharth Patnaik"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#034694] focus:border-[#034694]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Branch &amp; Year</label>
              <input
                type="text"
                value={form.secretaryBranch}
                onChange={(e) => setForm({ ...form, secretaryBranch: e.target.value })}
                placeholder="e.g. B.Tech CSE • 4th Year"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#034694] focus:border-[#034694]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Secretary Email</label>
              <input
                type="email"
                value={form.secretaryEmail}
                onChange={(e) => setForm({ ...form, secretaryEmail: e.target.value })}
                placeholder="secretary@silicon.ac.in"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#034694] focus:border-[#034694]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Secretary Phone</label>
              <input
                type="tel"
                value={form.secretaryPhone}
                onChange={(e) => setForm({ ...form, secretaryPhone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#034694] focus:border-[#034694]"
              />
            </div>

            {/* Photo Uploader */}
            <div className="sm:col-span-2 pt-3 border-t border-slate-100">
              <label className="text-xs font-semibold text-slate-700 block mb-2">General Secretary Profile Photo</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs">
                  {form.secretaryPhoto ? (
                    <img src={form.secretaryPhoto} alt="General Secretary" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-7 h-7 text-slate-400" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer shadow-2xs transition-colors">
                      <Upload className="w-3.5 h-3.5 text-[#034694]" />
                      <span>{form.secretaryPhoto ? 'Change Photo' : 'Upload Secretary Photo'}</span>
                      <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, 'secretaryPhoto')} className="hidden" />
                    </label>
                    {form.secretaryPhoto && (
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, secretaryPhoto: '' }))}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">Square 1:1 • Recommended: 400 × 400 px (Max 5MB)</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 7: Student Joint Secretary */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#034694]" />
              Student Joint Secretary
            </h2>
            <span className="text-[11px] text-slate-400">Executive Council Co-Lead</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Joint Secretary Name</label>
              <input
                type="text"
                value={form.jointSecretary}
                onChange={(e) => setForm({ ...form, jointSecretary: e.target.value })}
                placeholder="e.g. Ananya Das"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#034694] focus:border-[#034694]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Branch &amp; Year</label>
              <input
                type="text"
                value={form.jointSecretaryBranch}
                onChange={(e) => setForm({ ...form, jointSecretaryBranch: e.target.value })}
                placeholder="e.g. B.Tech ECE • 3rd Year"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#034694] focus:border-[#034694]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Joint Secretary Email</label>
              <input
                type="email"
                value={form.jointSecretaryEmail}
                onChange={(e) => setForm({ ...form, jointSecretaryEmail: e.target.value })}
                placeholder="joint.secretary@silicon.ac.in"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#034694] focus:border-[#034694]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Joint Secretary Phone</label>
              <input
                type="tel"
                value={form.jointSecretaryPhone}
                onChange={(e) => setForm({ ...form, jointSecretaryPhone: e.target.value })}
                placeholder="+91 98765 00000"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#034694] focus:border-[#034694]"
              />
            </div>

            {/* Photo Uploader */}
            <div className="sm:col-span-2 pt-3 border-t border-slate-100">
              <label className="text-xs font-semibold text-slate-700 block mb-2">Joint Secretary Profile Photo</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs">
                  {form.jointSecretaryPhoto ? (
                    <img src={form.jointSecretaryPhoto} alt="Joint Secretary" className="w-full h-full object-cover" />
                  ) : (
                    <UserCheck className="w-7 h-7 text-slate-400" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer shadow-2xs transition-colors">
                      <Upload className="w-3.5 h-3.5 text-[#034694]" />
                      <span>{form.jointSecretaryPhoto ? 'Change Photo' : 'Upload Joint Secretary Photo'}</span>
                      <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, 'jointSecretaryPhoto')} className="hidden" />
                    </label>
                    {form.jointSecretaryPhoto && (
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, jointSecretaryPhoto: '' }))}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">Square 1:1 • Recommended: 400 × 400 px (Max 5MB)</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 8: Student Coordinators (2nd, 3rd & 4th Year) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-6">
          <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#034694]" />
                Student Coordinators ({coordinators.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Add student committee leads and volunteers from 2nd, 3rd, and 4th year
              </p>
            </div>

            {/* Quick Add Buttons by Year */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => addCoordinator('4th Year')}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#034694] border border-blue-200/80 rounded-xl text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ 4th Year</span>
              </button>
              <button
                type="button"
                onClick={() => addCoordinator('3rd Year')}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/80 rounded-xl text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ 3rd Year</span>
              </button>
              <button
                type="button"
                onClick={() => addCoordinator('2nd Year')}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 rounded-xl text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ 2nd Year</span>
              </button>
            </div>
          </div>

          {coordinators.length === 0 ? (
            <div className="py-8 px-4 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center mx-auto shadow-2xs">
                <Users className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-800">No student coordinators added yet</p>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  Add coordinators to manage technical activities, design, events, and workshops across 2nd, 3rd, and 4th years.
                </p>
              </div>
              <button
                type="button"
                onClick={() => addCoordinator('3rd Year')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#034694] hover:bg-[#023168] text-white text-xs font-bold rounded-xl shadow-2xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add First Coordinator</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {coordinators.map((c, index) => (
                <div
                  key={c.id || index}
                  className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-4 relative group hover:border-[#034694]/40 transition-colors"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200/70">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-900">
                        {c.name ? c.name : `Coordinator #${index + 1}`}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          c.year === '4th Year'
                            ? 'bg-blue-100 text-blue-800'
                            : c.year === '3rd Year'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {c.year}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeCoordinator(index)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
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
                        <label className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer shadow-2xs">
                          <Upload className="w-3 h-3 text-[#034694]" />
                          <span>{c.photoUrl ? 'Change Photo' : 'Upload Photo'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleCoordinatorPhotoUpload(e, index)}
                            className="hidden"
                          />
                        </label>
                        {c.photoUrl && (
                          <button
                            type="button"
                            onClick={() => updateCoordinator(index, 'photoUrl', '')}
                            className="ml-2 text-[11px] text-rose-600 hover:underline font-semibold"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 hidden sm:inline">Square 1:1 • Max 5MB</span>
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-500 font-medium">
                  {coordinators.length} coordinator{coordinators.length > 1 ? 's' : ''} configured
                </span>
                <button
                  type="button"
                  onClick={() => addCoordinator('3rd Year')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5 text-[#034694]" />
                  <span>Add Another Coordinator</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs flex items-center justify-end gap-3">
          <Link
            href="/dashboard/clubs"
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Discard
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 rounded-xl bg-[#034694] hover:bg-[#023168] text-white text-xs font-bold transition-colors shadow-2xs disabled:opacity-50 flex items-center gap-2"
          >
            {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{submitting ? 'Registering...' : 'Register Society'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
