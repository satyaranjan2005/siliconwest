'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, ExternalLink, ChevronRight, Pencil } from 'lucide-react';
import { clubsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

// Simple avatar with image or initials fallback
function Avatar({ src, name, size = 'md' }) {
  const [err, setErr] = useState(false);
  const sizes = { sm: 'w-10 h-10 text-xs', md: 'w-14 h-14 text-sm', lg: 'w-20 h-20 text-lg' };
  const initials = (name || 'S').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  if (src && !err) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setErr(true)}
        className={`${sizes[size]} rounded-full object-cover border border-gray-200`}
      />
    );
  }

  return (
    <div className={`${sizes[size]} rounded-full bg-gray-100 text-gray-500 font-semibold flex items-center justify-center border border-gray-200`}>
      {initials}
    </div>
  );
}

export default function ClubDetailPage() {
  const params = useParams();
  const slug = params?.slug;
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, isSuperAdmin } = useAuth();

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const data = await clubsApi.getBySlug(slug);
        setClub(data);
      } catch (e) {
        setError(e.message || 'Club not found');
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  // Group coordinators by year
  const grouped = React.useMemo(() => {
    const list = Array.isArray(club?.coordinators) ? club.coordinators : [];
    const buckets = { '4th Year': [], '3rd Year': [], '2nd Year': [], 'Other': [] };
    list.forEach(c => {
      const yr = (c.year || c.branch || '').toLowerCase();
      if (yr.includes('4')) buckets['4th Year'].push(c);
      else if (yr.includes('3')) buckets['3rd Year'].push(c);
      else if (yr.includes('2')) buckets['2nd Year'].push(c);
      else buckets['Other'].push(c);
    });
    return buckets;
  }, [club?.coordinators]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !club) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="text-center space-y-3 max-w-sm">
          <p className="text-gray-900 font-semibold text-lg">Club not found</p>
          <p className="text-gray-500 text-sm">This club may have been renamed or removed.</p>
          <Link href="/clubs" className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800">
            <ArrowLeft className="w-4 h-4" /> Back to all clubs
          </Link>
        </div>
      </div>
    );
  }

  const canManage = isSuperAdmin || club.admins?.some(a => a.id === user?.id);
  const socialEntries = club.socialLinks ? Object.entries(club.socialLinks).filter(([, v]) => v) : [];

  return (
    <div className="min-h-screen bg-white">
      {/* ── Breadcrumb ── */}
      <div className="border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-3.5 sm:px-6 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500 min-w-0">
            <Link href="/clubs" className="hover:text-gray-900 transition-colors flex items-center gap-1 shrink-0 font-medium">
              <ArrowLeft className="w-3.5 h-3.5" />
              Clubs
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium truncate max-w-[130px] sm:max-w-[240px]">{club.name}</span>
          </div>
          {canManage && (
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <Link
                href={`/dashboard/clubs/${club.id}/edit`}
                className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-[#034694] bg-blue-50 hover:bg-[#034694] hover:text-white px-2.5 py-1 rounded-md transition-colors"
              >
                <Pencil className="w-3 h-3" />
                <span>Edit Society</span>
              </Link>
              <Link href="/dashboard" className="text-[11px] sm:text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-md hover:bg-slate-200 transition-colors">
                Dashboard
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-3.5 sm:px-6">
        {/* ── Banner ── */}
        {club.bannerUrl && (
          <div className="mt-4 sm:mt-6 rounded-xl overflow-hidden border border-gray-100">
            <img
              src={club.bannerUrl}
              alt={club.name}
              className="w-full h-36 sm:h-64 object-cover"
            />
          </div>
        )}

        {/* ── Hero ── */}
        <div className="py-6 sm:py-10 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
            {/* Logo */}
            {club.logoUrl && (
              <img
                src={club.logoUrl}
                alt={club.name || 'Club logo'}
                className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl object-cover border border-gray-200 shadow-sm bg-white shrink-0"
              />
            )}

            <div className="space-y-2.5 sm:space-y-3 flex-1 min-w-0">
              <div>
                <h1 className="text-xl sm:text-3xl font-bold text-gray-900 tracking-tight leading-snug">
                  {club.name}
                </h1>
                <p className="text-gray-500 text-xs sm:text-sm mt-1">
                  {club.category && <span>{club.category}</span>}
                  {club.establishedYear && <span> · Est. {club.establishedYear}</span>}
                </p>
              </div>

              {club.shortDescription && (
                <p className="text-gray-600 text-xs sm:text-sm leading-relaxed max-w-2xl">
                  {club.shortDescription}
                </p>
              )}

              {/* Quick info row */}
              <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-5 gap-y-2 text-xs text-gray-500 pt-1">
                {club.contactEmail && (
                  <a href={`mailto:${club.contactEmail}`} className="flex items-center gap-1.5 hover:text-gray-900 transition-colors truncate max-w-[260px]">
                    <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="truncate">{club.contactEmail}</span>
                  </a>
                )}
                {(club.contactPhone || club.secretaryPhone || club.phone) && (
                  <a href={`tel:${club.contactPhone || club.secretaryPhone || club.phone}`} className="flex items-center gap-1.5 hover:text-gray-900 transition-colors">
                    <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>{club.contactPhone || club.secretaryPhone || club.phone}</span>
                  </a>
                )}
              </div>

              {/* Social links */}
              {socialEntries.length > 0 && (
                <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-1">
                  {socialEntries.map(([key, url]) => (
                    <a
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-gray-500 hover:text-gray-900 capitalize transition-colors bg-gray-50 px-2.5 py-1 rounded-md border border-gray-200/60"
                    >
                      {key}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── About ── */}
        {club.description && (
          <section className="py-8 border-b border-gray-100">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">About</h2>
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line max-w-3xl">
              {club.description}
            </div>
          </section>
        )}

        {/* ── Faculty Advisor ── */}
        {club.facultyCoordinator && (
          <section className="py-8 border-b border-gray-100">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Faculty Advisor</h2>
            <div className="flex items-center gap-4">
              <Avatar src={club.facultyCoordinatorPhoto} name={club.facultyCoordinator} size="md" />
              <div>
                <p className="font-semibold text-gray-900">{club.facultyCoordinator}</p>
                <p className="text-sm text-gray-500">{club.facultyDept}</p>
                {club.facultyCoordinatorEmail && (
                  <a href={`mailto:${club.facultyCoordinatorEmail}`} className="text-xs text-gray-400 hover:text-gray-700 mt-0.5 inline-block">
                    {club.facultyCoordinatorEmail}
                  </a>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── Student Leadership ── */}
        <section className="py-8 border-b border-gray-100">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">Student Leadership</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Secretary */}
            <div className="flex items-start gap-4">
              <Avatar src={club.secretaryPhoto} name={club.secretary} size="lg" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-400 mb-0.5">Secretary</p>
                <p className="font-semibold text-gray-900 text-lg">{club.secretary || 'TBD'}</p>
                <p className="text-sm text-gray-500">{club.secretaryBranch}{club.secretaryYear ? ` · ${club.secretaryYear}` : ''}</p>
                <div className="flex flex-col gap-0.5 mt-2 text-xs text-gray-500">
                  {club.secretaryEmail && (
                    <a href={`mailto:${club.secretaryEmail}`} className="hover:text-gray-900 transition-colors flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-gray-400" />{club.secretaryEmail}
                    </a>
                  )}
                  {club.secretaryPhone && (
                    <a href={`tel:${club.secretaryPhone}`} className="hover:text-gray-900 transition-colors flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-gray-400" />{club.secretaryPhone}
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Joint Secretary */}
            <div className="flex items-start gap-4">
              <Avatar src={club.jointSecretaryPhoto} name={club.jointSecretary} size="lg" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-400 mb-0.5">Joint Secretary</p>
                <p className="font-semibold text-gray-900 text-lg">{club.jointSecretary || 'TBD'}</p>
                <p className="text-sm text-gray-500">{club.jointSecretaryBranch}{club.jointSecretaryYear ? ` · ${club.jointSecretaryYear}` : ''}</p>
                <div className="flex flex-col gap-0.5 mt-2 text-xs text-gray-500">
                  {club.jointSecretaryEmail && (
                    <a href={`mailto:${club.jointSecretaryEmail}`} className="hover:text-gray-900 transition-colors flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-gray-400" />{club.jointSecretaryEmail}
                    </a>
                  )}
                  {club.jointSecretaryPhone && (
                    <a href={`tel:${club.jointSecretaryPhone}`} className="hover:text-gray-900 transition-colors flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-gray-400" />{club.jointSecretaryPhone}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Coordinators by Year ── */}
        {['4th Year', '3rd Year', '2nd Year', 'Other'].map(yearLabel => {
          const members = grouped[yearLabel];
          if (!members || members.length === 0) return null;

          return (
            <section key={yearLabel} className="py-8 border-b border-gray-100">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">
                {yearLabel === 'Other' ? 'Coordinators' : `${yearLabel} Coordinators`}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {members.map((c, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Avatar src={c.photoUrl} name={c.name} size="md" />
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 text-sm">{c.name}</p>
                      {c.role && <p className="text-xs text-gray-500 mt-0.5">{c.role}</p>}
                      <p className="text-xs text-gray-400">{c.branch}</p>
                      {c.email && (
                        <a href={`mailto:${c.email}`} className="text-xs text-gray-400 hover:text-gray-700 mt-1 inline-block truncate max-w-full">
                          {c.email}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        {/* ── Events ── */}
        {((club.upcomingEvents && club.upcomingEvents.length > 0) || (club.pastEvents && club.pastEvents.length > 0)) && (
          <section className="py-8 border-b border-gray-100">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">Events</h2>

            {/* Upcoming */}
            {club.upcomingEvents && club.upcomingEvents.length > 0 && (
              <div className="space-y-3">
                {club.upcomingEvents.map(ev => (
                  <Link
                    key={ev.id}
                    href={`/events/${ev.slug}`}
                    className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 transition-all group"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 text-sm group-hover:text-blue-600 transition-colors truncate">
                        {ev.title}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          {new Date(ev.startsAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        {ev.venue && (
                          <span className="flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            {ev.venue}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0 ml-3" />
                  </Link>
                ))}
              </div>
            )}

            {/* Past */}
            {club.pastEvents && club.pastEvents.length > 0 && (
              <div className="mt-6">
                <p className="text-xs text-gray-400 font-medium mb-3">Past Events</p>
                <div className="space-y-2">
                  {club.pastEvents.map(ev => (
                    <Link
                      key={ev.id}
                      href={`/events/${ev.slug}`}
                      className="flex items-center justify-between py-2 text-sm text-gray-500 hover:text-gray-900 transition-colors group"
                    >
                      <span className="truncate">{ev.title}</span>
                      <span className="text-xs text-gray-400 shrink-0 ml-3">
                        {new Date(ev.startsAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {(!club.upcomingEvents || club.upcomingEvents.length === 0) && (!club.pastEvents || club.pastEvents.length === 0) && (
              <p className="text-sm text-gray-400">No events scheduled at the moment.</p>
            )}
          </section>
        )}

        <div className="pb-16" />
      </div>
    </div>
  );
}
