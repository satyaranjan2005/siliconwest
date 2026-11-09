'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Compass,
  Search,
  ArrowRight,
  Users,
  GraduationCap,
  Code2,
  Palette,
  Trophy,
  Camera,
  Layers,
  X,
  Pencil,
} from 'lucide-react';
import { clubsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

const CATEGORIES = [
  { id: 'ALL', label: 'All Communities', icon: Layers },
  { id: 'Technical', label: 'Technical', icon: Code2 },
  { id: 'Cultural', label: 'Cultural', icon: Palette },
  { id: 'Sports', label: 'Sports', icon: Trophy },
  { id: 'Media & Arts', label: 'Media & Arts', icon: Camera },
];

function getCategoryIcon(cat) {
  if (!cat) return Compass;
  const lower = cat.toLowerCase();
  if (lower.includes('tech') || lower.includes('code') || lower.includes('robot')) return Code2;
  if (lower.includes('cultur') || lower.includes('music') || lower.includes('dance')) return Palette;
  if (lower.includes('sport') || lower.includes('game') || lower.includes('athlet')) return Trophy;
  if (lower.includes('media') || lower.includes('art') || lower.includes('photo')) return Camera;
  return Compass;
}

function getCategoryStyle(cat) {
  const lower = (cat || '').toLowerCase();
  if (lower.includes('tech') || lower.includes('code') || lower.includes('robot')) {
    return {
      badge: 'bg-blue-50 text-blue-700 border-blue-200',
      dot: 'bg-blue-600',
      accent: 'text-[#034694]',
    };
  }
  if (lower.includes('cultur') || lower.includes('music') || lower.includes('dance')) {
    return {
      badge: 'bg-purple-50 text-purple-700 border-purple-200',
      dot: 'bg-purple-600',
      accent: 'text-purple-700',
    };
  }
  if (lower.includes('sport') || lower.includes('game') || lower.includes('athlet')) {
    return {
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-600',
      accent: 'text-emerald-700',
    };
  }
  if (lower.includes('media') || lower.includes('art') || lower.includes('photo')) {
    return {
      badge: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-600',
      accent: 'text-amber-700',
    };
  }
  return {
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-600',
    accent: 'text-slate-800',
  };
}

function ClubLogo({ src, name, category }) {
  const [imgError, setImgError] = useState(false);
  const CategoryIcon = getCategoryIcon(category);

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setImgError(true)}
        className="w-full h-full object-cover rounded-xl"
      />
    );
  }
  return <CategoryIcon className="w-10 h-10 text-[#034694]" />;
}

export default function ClubsPage() {
  const { isSuperAdmin, isClubAdmin } = useAuth();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  useEffect(() => {
    async function fetchClubs() {
      try {
        setLoading(true);
        const data = await clubsApi.list({
          search: search.trim() || undefined,
          category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
        });
        setClubs(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch clubs:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchClubs();
  }, [search, selectedCategory]);

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-900 pb-24">
      {/* Header Section */}
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#034694] bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full">
              Silicon West Campus Societies
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-medium text-slate-500">
              {clubs.length} Recognized Student Clubs
            </span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 sm:gap-6">
            <div className="max-w-3xl space-y-2">
              <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900">
                Student Clubs &amp; Communities
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                Discover student-run and faculty-mentored societies at Silicon West.
                Build robotics, develop open-source systems, perform in cultural arts, or compete in collegiate athletics.
              </p>
            </div>

            {/* Quick Metrics Cards (Side-by-side grid on mobile) */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
              <div className="bg-slate-50 rounded-xl px-3.5 sm:px-4 py-2 sm:py-2.5 border border-slate-200/80 flex items-center gap-2.5 sm:gap-3 shadow-2xs">
                <div className="w-8 h-8 rounded-lg bg-blue-100/80 text-[#034694] flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">{clubs.length || 6} Clubs</div>
                  <div className="text-[10px] text-slate-500 font-medium">Active Societies</div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl px-3.5 sm:px-4 py-2 sm:py-2.5 border border-slate-200/80 flex items-center gap-2.5 sm:gap-3 shadow-2xs">
                <div className="w-8 h-8 rounded-lg bg-purple-100/80 text-purple-700 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">Faculty Guided</div>
                  <div className="text-[10px] text-slate-500 font-medium">100% Mentorship</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-5 sm:space-y-6">
        {/* Controls: Search + Categories */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search clubs by name, category, or leadership..."
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#034694] focus:border-[#034694] transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 transition-colors"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-all ${
                      isSelected
                        ? 'bg-[#034694] text-white shadow-2xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/70'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Clubs Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="h-[440px] bg-white rounded-2xl border border-slate-200 p-5 animate-pulse flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="h-40 bg-slate-100 rounded-xl" />
                  <div className="h-5 bg-slate-100 rounded w-2/3" />
                  <div className="h-4 bg-slate-100 rounded w-full" />
                  <div className="h-16 bg-slate-100 rounded-xl" />
                </div>
                <div className="h-10 bg-slate-100 rounded-xl" />
              </div>
            ))}
          </div>
        ) : clubs.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 sm:p-12 text-center border border-slate-200 shadow-2xs max-w-md mx-auto space-y-3">
            <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">No clubs match your query</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              We couldn&apos;t find any student society matching your criteria. Try adjusting your search term.
            </p>
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategory('ALL');
              }}
              className="text-xs font-semibold text-[#034694] hover:underline pt-1 inline-block"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {clubs.map((club) => {
              const CategoryIcon = getCategoryIcon(club.category);
              const catStyle = getCategoryStyle(club.category);

              return (
                <div
                  key={club.id}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 shadow-2xs hover:shadow-sm transition-all duration-300 flex flex-col justify-between overflow-hidden group"
                >
                  <div>
                    {/* Club Banner Header */}
                    <Link
                      href={`/clubs/${club.slug}`}
                      className="block relative h-36 sm:h-40 w-full bg-slate-100 overflow-hidden"
                    >
                      <img
                        src={
                          club.bannerUrl ||
                          'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&auto=format&fit=crop&q=80'
                        }
                        alt={club.name}
                        className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-950/15 to-transparent" />

                      {/* Top Badges Over Banner */}
                      <div className="absolute top-3 left-3">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-0.5 rounded-md shadow-2xs backdrop-blur-xs border ${catStyle.badge}`}
                        >
                          <CategoryIcon className="w-3 h-3" />
                          <span>{club.category || 'General'}</span>
                        </span>
                      </div>
                    </Link>

                    {/* Logo & Club Information */}
                    <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-3">
                      {/* Prominently Sized Club Logo Overlapping Banner */}
                      <div className="-mt-9 sm:-mt-10 relative z-10 flex items-end justify-between">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border-4 border-white shadow-md p-1 overflow-hidden flex items-center justify-center">
                          <ClubLogo src={club.logoUrl} name={club.name} category={club.category} />
                        </div>
                      </div>

                      {/* Club Title & Subtitle */}
                      <div className="space-y-1">
                        <Link href={`/clubs/${club.slug}`} className="block">
                          <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-[#034694] transition-colors leading-snug line-clamp-2">
                            {club.name}
                          </h3>
                        </Link>
                        <p className="text-[11px] text-slate-500 font-medium">
                          Official Student Community
                        </p>
                      </div>

                      {/* Club Summary */}
                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                        {club.shortDescription || club.description}
                      </p>
                    </div>
                  </div>

                  {/* Card Bottom Action */}
                  <div className="px-4 sm:px-5 py-2.5 sm:py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs">
                    {(isSuperAdmin || isClubAdmin) ? (
                      <Link
                        href={`/dashboard/clubs/${club.id}/edit`}
                        className="inline-flex items-center gap-1 text-slate-500 hover:text-[#034694] text-xs font-semibold px-2 py-1 rounded-md hover:bg-white transition-colors"
                      >
                        <Pencil className="w-3 h-3 text-[#034694]" />
                        <span>Edit</span>
                      </Link>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-medium">Silicon West</span>
                    )}

                    <Link
                      href={`/clubs/${club.slug}`}
                      className="inline-flex items-center gap-1.5 text-[#034694] hover:text-[#023168] text-xs font-semibold group-hover:underline"
                    >
                      <span>Explore Club</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
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
