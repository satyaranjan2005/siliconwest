'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Calendar,
  CalendarDays,
  Clock,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  Search,
  MapPin,
  Users,
  ArrowRight,
  Building2,
  Tag,
  Sparkles,
  X,
  Filter,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { eventsApi, registrationsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

// Helper: category visual styles
const getCategoryStyle = (category) => {
  const cat = (category || '').toLowerCase();
  if (cat.includes('tech')) {
    return {
      badge: 'bg-blue-50 text-blue-700 border-blue-200',
      dot: 'bg-blue-600',
      border: 'border-blue-500',
      bgLight: 'bg-blue-50/50',
    };
  }
  if (cat.includes('cultur')) {
    return {
      badge: 'bg-purple-50 text-purple-700 border-purple-200',
      dot: 'bg-purple-600',
      border: 'border-purple-500',
      bgLight: 'bg-purple-50/50',
    };
  }
  if (cat.includes('sport')) {
    return {
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-600',
      border: 'border-emerald-500',
      bgLight: 'bg-emerald-50/50',
    };
  }
  if (cat.includes('media') || cat.includes('art')) {
    return {
      badge: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-600',
      border: 'border-amber-500',
      bgLight: 'bg-amber-50/50',
    };
  }
  return {
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-600',
    border: 'border-slate-500',
    bgLight: 'bg-slate-50',
  };
};

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [timeframe, setTimeframe] = useState('upcoming');
  const [viewMode, setViewMode] = useState('timeline'); // 'timeline' | 'calendar' | 'grid'

  // Calendar specific state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);
  const [myRegisteredEventIds, setMyRegisteredEventIds] = useState(new Set());

  const { user } = useAuth();

  // Load user registrations for highlighting
  useEffect(() => {
    if (!user) {
      setMyRegisteredEventIds(new Set());
      return;
    }
    async function loadMyRegistrations() {
      try {
        const myRegs = await registrationsApi.getMy();
        if (Array.isArray(myRegs)) {
          const ids = new Set();
          myRegs.forEach((r) => {
            if (r.eventId) ids.add(r.eventId);
            if (r.event?.id) ids.add(r.event.id);
          });
          setMyRegisteredEventIds(ids);
        }
      } catch (err) {
        // silent
      }
    }
    loadMyRegistrations();
  }, [user]);

  // Fetch events from backend API
  useEffect(() => {
    async function fetchEvents() {
      try {
        setLoading(true);
        const data = await eventsApi.list({
          search: search.trim() || undefined,
          category: category !== 'ALL' ? category : undefined,
          timeframe: timeframe !== 'all' ? timeframe : undefined,
        });
        const list = Array.isArray(data) ? data : [];
        setEvents(list);

        // If calendar view and we have events, auto-align month with first event if available
        if (list.length > 0) {
          const firstEventDate = new Date(list[0].startsAt);
          if (!isNaN(firstEventDate.getTime())) {
            // Keep year & month in sync if not set
            setCurrentDate((prev) => {
              // If prev is drastically different, we can center on first event's month
              const diffMonths =
                Math.abs(
                  (firstEventDate.getFullYear() - prev.getFullYear()) * 12 +
                    (firstEventDate.getMonth() - prev.getMonth())
                );
              return diffMonths > 2 ? new Date(firstEventDate.getFullYear(), firstEventDate.getMonth(), 1) : prev;
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch events:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, [search, category, timeframe, user]);

  const categories = ['ALL', 'Technical', 'Cultural', 'Sports', 'Media & Arts'];

  // Chronologically sorted events
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
  }, [events]);

  // Group events by day for Timeline View
  const timelineGroups = useMemo(() => {
    const groups = {};
    sortedEvents.forEach((ev) => {
      const d = new Date(ev.startsAt);
      if (isNaN(d.getTime())) return;
      // Key format: YYYY-MM-DD
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: d,
          events: [],
        };
      }
      groups[dateKey].events.push(ev);
    });
    return Object.values(groups);
  }, [sortedEvents]);

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const days = [];

    // Preceding padding days from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
        month: month === 0 ? 11 : month - 1,
        year: month === 0 ? year - 1 : year,
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= totalDaysInMonth; i++) {
      days.push({
        day: i,
        month: month,
        year: year,
        isCurrentMonth: true,
      });
    }

    // Following padding days to complete full 7-column rows
    const remaining = 42 - days.length; // 6 rows of 7
    for (let i = 1; i <= (remaining >= 7 ? remaining - 7 : remaining); i++) {
      days.push({
        day: i,
        month: month === 11 ? 0 : month + 1,
        year: month === 11 ? year + 1 : year,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [year, month]);

  // Map calendar days to events
  const eventsByDateMap = useMemo(() => {
    const map = new Map();
    events.forEach((ev) => {
      const d = new Date(ev.startsAt);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(ev);
    });
    return map;
  }, [events]);

  // Navigation handlers for Calendar
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedCalendarDate(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedCalendarDate(null);
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedCalendarDate({
      day: now.getDate(),
      month: now.getMonth(),
      year: now.getFullYear(),
    });
  };

  // Selected date events in calendar
  const selectedDayEvents = useMemo(() => {
    if (!selectedCalendarDate) return [];
    const key = `${selectedCalendarDate.year}-${selectedCalendarDate.month}-${selectedCalendarDate.day}`;
    return eventsByDateMap.get(key) || [];
  }, [selectedCalendarDate, eventsByDateMap]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-900 pb-24">
      {/* Minimal Header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-3.5 sm:px-6 py-6 sm:py-10 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#034694] bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full">
              Silicon West Campus Portal
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-medium text-slate-500">
              {events.length} {events.length === 1 ? 'Event' : 'Events'} Available
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Events &amp; Campus Timeline
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
                Explore, track, and register for official technical bootcamps, hackathons, sports tournaments, and cultural festivities.
              </p>
            </div>

            {/* View Switcher Tabs (Responsive grid on mobile for 1-thumb tapping) */}
            <div className="grid grid-cols-3 sm:flex sm:items-center p-1 bg-slate-100 border border-slate-200 rounded-xl w-full sm:w-auto">
              <button
                onClick={() => setViewMode('timeline')}
                className={`flex items-center justify-center gap-1.5 py-2 sm:py-1.5 px-3 rounded-lg text-xs transition-all ${
                  viewMode === 'timeline'
                    ? 'bg-white text-[#034694] shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 font-medium'
                }`}
                title="Timeline View"
              >
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>Timeline</span>
              </button>

              <button
                onClick={() => setViewMode('calendar')}
                className={`flex items-center justify-center gap-1.5 py-2 sm:py-1.5 px-3 rounded-lg text-xs transition-all ${
                  viewMode === 'calendar'
                    ? 'bg-white text-[#034694] shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 font-medium'
                }`}
                title="Calendar View"
              >
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>Calendar</span>
              </button>

              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center justify-center gap-1.5 py-2 sm:py-1.5 px-3 rounded-lg text-xs transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-[#034694] shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 font-medium'
                }`}
                title="Grid Catalog View"
              >
                <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
                <span>Grid</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3.5 sm:px-6 pt-5 sm:pt-6 space-y-5 sm:space-y-6">
        {/* Controls Bar: Search + Category Filters + Timeframe */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 space-y-3 shadow-2xs">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events by title, club, venue..."
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#034694] focus:border-[#034694] transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Timeframe Selector (Full width equal grid on mobile) */}
            <div className="grid grid-cols-3 sm:flex sm:items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200 shrink-0 w-full sm:w-auto">
              <button
                onClick={() => setTimeframe('upcoming')}
                className={`py-1.5 sm:py-1 px-3 rounded-md text-xs font-medium text-center transition-colors ${
                  timeframe === 'upcoming'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Upcoming
              </button>
              <button
                onClick={() => setTimeframe('past')}
                className={`py-1.5 sm:py-1 px-3 rounded-md text-xs font-medium text-center transition-colors ${
                  timeframe === 'past'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Past
              </button>
              <button
                onClick={() => setTimeframe('all')}
                className={`py-1.5 sm:py-1 px-3 rounded-md text-xs font-medium text-center transition-colors ${
                  timeframe === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All Time
              </button>
            </div>
          </div>

          {/* Category Chips Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs pt-1 border-t border-slate-100">
            <span className="text-[11px] font-medium text-slate-400 mr-1 shrink-0 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Category:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1 rounded-md font-medium whitespace-nowrap transition-colors text-xs shrink-0 ${
                  category === cat
                    ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                    : 'text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
            <div className="w-7 h-7 border-2 border-[#034694] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-medium text-slate-500">Loading campus events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 text-slate-400 flex items-center justify-center mx-auto">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">No events found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              There are no events matching your current filters. Try changing your search query or timeframe.
            </p>
            <button
              onClick={() => {
                setSearch('');
                setCategory('ALL');
                setTimeframe('all');
              }}
              className="text-xs font-semibold text-[#034694] hover:underline pt-1 inline-block"
            >
              Reset all filters
            </button>
          </div>
        ) : (
          <>
            {/* ============================================================== */}
            {/* VIEW 1: TIMELINE VIEW                                          */}
            {/* ============================================================== */}
            {viewMode === 'timeline' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Clock className="w-3.5 h-3.5 text-[#034694]" />
                    <span className="font-semibold text-slate-800">Chronological Event Timeline</span>
                    <span>•</span>
                    <span>{sortedEvents.length} events scheduled</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Sorted by commencement date</span>
                </div>

                <div className="relative pl-4 sm:pl-8 space-y-8 before:absolute before:left-[17px] sm:before:left-[23px] before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                  {timelineGroups.map((group, groupIdx) => {
                    const groupDate = group.date;
                    const isToday =
                      new Date().toDateString() === groupDate.toDateString();

                    return (
                      <div key={groupIdx} className="relative space-y-4">
                        {/* Day Marker on the spine */}
                        <div className="flex items-center gap-2.5 sm:gap-3 -ml-4 sm:-ml-8">
                          <div
                            className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex flex-col items-center justify-center text-center font-bold border shadow-xs z-10 transition-transform shrink-0 ${
                              isToday
                                ? 'bg-[#034694] text-white border-[#034694] ring-4 ring-blue-100'
                                : 'bg-white text-slate-800 border-slate-200'
                            }`}
                          >
                            <span className="text-[9px] uppercase tracking-tighter leading-none font-semibold opacity-80">
                              {groupDate.toLocaleDateString('en-US', { month: 'short' })}
                            </span>
                            <span className="text-xs sm:text-sm leading-tight">
                              {groupDate.getDate()}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 min-w-0">
                            <h2 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight truncate">
                              {groupDate.toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </h2>
                            {isToday && (
                              <span className="text-[10px] font-semibold bg-blue-100 text-[#034694] px-2 py-0.5 rounded-full shrink-0">
                                Today
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Events on this day */}
                        <div className="space-y-4 pl-1 sm:pl-4">
                          {group.events.map((event) => {
                            const catStyle = getCategoryStyle(event.category);
                            const startDate = new Date(event.startsAt);
                            const endDate = new Date(event.endsAt);
                            const isFull =
                              event.capacity &&
                              event.confirmedRegistrationsCount >= event.capacity;

                            return (
                              <div
                                key={event.id}
                                className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-xs group flex flex-col md:flex-row"
                              >
                                {/* Prominent Event Banner */}
                                <Link
                                  href={`/events/${event.slug}`}
                                  className="relative w-full md:w-72 lg:w-80 h-44 sm:h-48 md:h-auto min-h-[160px] sm:min-h-[190px] shrink-0 bg-slate-100 overflow-hidden block"
                                >
                                  <img
                                    src={
                                      event.bannerUrl ||
                                      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80'
                                    }
                                    alt={event.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                  <div className="absolute top-3 left-3">
                                    <span
                                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md shadow-2xs backdrop-blur-xs border ${catStyle.badge}`}
                                    >
                                      {event.category || 'General'}
                                    </span>
                                  </div>
                                </Link>

                                {/* Card Details */}
                                <div className="p-3.5 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                                  <div className="space-y-2">
                                    {/* Top meta tags */}
                                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                                      {/* Time duration */}
                                      <span className="flex items-center gap-1 text-slate-600 font-medium">
                                        <Clock className="w-3 h-3 text-[#034694] shrink-0" />
                                        {startDate.toLocaleTimeString('en-US', {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                          hour12: true,
                                        })}{' '}
                                        –{' '}
                                        {endDate.toLocaleTimeString('en-US', {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                          hour12: true,
                                        })}
                                      </span>

                                      <span className="text-slate-400">•</span>

                                      {/* Host Club */}
                                      <Link
                                        href={`/clubs/${event.club?.slug || ''}`}
                                        className="font-medium text-slate-600 hover:text-[#034694] flex items-center gap-1 transition-colors truncate max-w-[180px]"
                                      >
                                        <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                                        <span className="truncate">{event.club?.name || 'Campus Club'}</span>
                                      </Link>
                                    </div>

                                    {/* Event Title */}
                                    <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-[#034694] transition-colors leading-snug break-words">
                                      <Link href={`/events/${event.slug}`}>
                                        {event.title}
                                      </Link>
                                    </h3>

                                    {/* Event Summary */}
                                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed break-words">
                                      {event.summary || event.description}
                                    </p>
                                  </div>

                                  {/* Bottom Meta & Venue (Adaptive on mobile) */}
                                  <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 text-xs text-slate-500 border-t border-slate-100">
                                    <div className="flex flex-wrap items-center gap-3">
                                      <div className="flex items-center gap-1.5">
                                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                        <span className="truncate max-w-[170px] sm:max-w-[240px]">
                                          {event.venue || 'Campus Venue'}
                                        </span>
                                      </div>

                                      {event.capacity && (
                                        <div className="flex items-center gap-1.5">
                                          <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                          <span>
                                            {event.confirmedRegistrationsCount} / {event.capacity} seats
                                          </span>
                                        </div>
                                      )}
                                    </div>

                                    <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-slate-50">
                                      {event.isAlreadyRegistered || myRegisteredEventIds.has(event.id) ? (
                                        <span className="text-[10px] sm:text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                          Registered
                                        </span>
                                      ) : isFull ? (
                                        <span className="text-[10px] sm:text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                          Capacity Full
                                        </span>
                                      ) : event.isRegistrationOpen ? (
                                        <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                          Registration Open
                                        </span>
                                      ) : (
                                        <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                                          Registration Closed
                                        </span>
                                      )}

                                      <Link
                                        href={`/events/${event.slug}`}
                                        className="inline-flex items-center gap-1 text-xs font-bold text-[#034694] hover:underline"
                                      >
                                        <span>
                                          {event.isAlreadyRegistered || myRegisteredEventIds.has(event.id)
                                            ? 'View Pass'
                                            : 'View Event'}
                                        </span>
                                        <ArrowRight className="w-3.5 h-3.5" />
                                      </Link>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* VIEW 2: CALENDAR VIEW                                          */}
            {/* ============================================================== */}
            {viewMode === 'calendar' && (
              <div className="space-y-6">
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  {/* Calendar Navigation Bar */}
                  <div className="p-3.5 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-[#034694]/10 text-[#034694] shrink-0">
                        <CalendarDays className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                          {monthNames[month]} {year}
                        </h2>
                        <p className="text-[11px] text-slate-500">
                          Click any day to inspect scheduled activities
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                      <button
                        onClick={handleToday}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
                      >
                        Today
                      </button>

                      <div className="flex items-center rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs">
                        <button
                          onClick={handlePrevMonth}
                          className="p-1.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors border-r border-slate-200"
                          title="Previous Month"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleNextMonth}
                          className="p-1.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                          title="Next Month"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Calendar Weekday Header */}
                  <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-100/70 text-center">
                    {weekdayNames.map((d, i) => (
                      <div
                        key={d}
                        className={`py-1.5 sm:py-2 text-[10px] sm:text-[11px] font-semibold ${
                          i === 0 || i === 6 ? 'text-slate-400' : 'text-slate-700'
                        }`}
                      >
                        {d}
                      </div>
                    ))}
                  </div>

                  {/* Calendar 7-Column Grid */}
                  <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 bg-slate-50/20">
                    {calendarDays.map((cell, idx) => {
                      const dateKey = `${cell.year}-${cell.month}-${cell.day}`;
                      const dayEvents = eventsByDateMap.get(dateKey) || [];
                      const hasEvents = dayEvents.length > 0;

                      const isSelected =
                        selectedCalendarDate &&
                        selectedCalendarDate.year === cell.year &&
                        selectedCalendarDate.month === cell.month &&
                        selectedCalendarDate.day === cell.day;

                      const isRealToday =
                        new Date().getFullYear() === cell.year &&
                        new Date().getMonth() === cell.month &&
                        new Date().getDate() === cell.day;

                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            if (hasEvents || cell.isCurrentMonth) {
                              setSelectedCalendarDate(cell);
                            }
                          }}
                          className={`min-h-[52px] sm:min-h-[105px] p-1 sm:p-2 transition-all cursor-pointer flex flex-col justify-between ${
                            !cell.isCurrentMonth
                              ? 'bg-slate-50/60 text-slate-300'
                              : isSelected
                              ? 'bg-blue-50/60 ring-2 ring-inset ring-[#034694]'
                              : isRealToday
                              ? 'bg-blue-50/30 hover:bg-blue-50/50'
                              : 'bg-white hover:bg-slate-50/80'
                          }`}
                        >
                          {/* Day Number Header */}
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-[10px] sm:text-xs font-semibold rounded-md px-1 sm:px-1.5 py-0.5 inline-block ${
                                isRealToday
                                  ? 'bg-[#034694] text-white shadow-2xs'
                                  : isSelected
                                  ? 'bg-[#034694] text-white'
                                  : cell.isCurrentMonth
                                  ? 'text-slate-700'
                                  : 'text-slate-300'
                              }`}
                            >
                              {cell.day}
                            </span>

                            {hasEvents && (
                              <span className="text-[9px] sm:text-[10px] font-bold text-[#034694] bg-blue-100/80 rounded-full w-3.5 h-3.5 sm:w-4 sm:h-4 flex items-center justify-center">
                                {dayEvents.length}
                              </span>
                            )}
                          </div>

                          {/* Event Markers / Chips */}
                          <div className="space-y-1 mt-1 overflow-hidden">
                            {dayEvents.slice(0, 2).map((ev) => {
                              const style = getCategoryStyle(ev.category);
                              return (
                                <div
                                  key={ev.id}
                                  className={`hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium truncate border ${style.badge}`}
                                  title={ev.title}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
                                  <span className="truncate">{ev.title}</span>
                                </div>
                              );
                            })}

                            {/* Mobile dot marker */}
                            {hasEvents && (
                              <div className="sm:hidden flex items-center justify-center gap-1 pt-1">
                                {dayEvents.slice(0, 3).map((ev, i) => {
                                  const style = getCategoryStyle(ev.category);
                                  return (
                                    <span
                                      key={i}
                                      className={`w-1.5 h-1.5 rounded-full ${style.dot}`}
                                    />
                                  );
                                })}
                              </div>
                            )}

                            {dayEvents.length > 2 && (
                              <div className="hidden sm:block text-[9px] font-medium text-slate-500 pl-1">
                                +{dayEvents.length - 2} more
                              </div>
                            )}
                          </div>

                          {/* Bottom spacing helper */}
                          <div />
                        </div>
                      );
                    })}
                  </div>

                  {/* Calendar Legend */}
                  <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
                    <div className="flex items-center gap-4">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Categories:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                        <span className="text-[11px]">Technical</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-purple-600" />
                        <span className="text-[11px]">Cultural</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-600" />
                        <span className="text-[11px]">Sports</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-600" />
                        <span className="text-[11px]">Media & Arts</span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400">
                      Total {events.length} campus events
                    </div>
                  </div>
                </div>

                {/* Selected Date Drawer / Events List */}
                {selectedCalendarDate && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#034694]" />
                        <h3 className="text-sm font-bold text-slate-900">
                          Events on{' '}
                          {new Date(
                            selectedCalendarDate.year,
                            selectedCalendarDate.month,
                            selectedCalendarDate.day
                          ).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </h3>
                        <span className="text-xs text-slate-400">
                          ({selectedDayEvents.length} scheduled)
                        </span>
                      </div>

                      <button
                        onClick={() => setSelectedCalendarDate(null)}
                        className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" /> Close
                      </button>
                    </div>

                    {selectedDayEvents.length === 0 ? (
                      <div className="py-8 text-center space-y-2">
                        <p className="text-xs text-slate-500 font-medium">
                          No events scheduled on this specific date.
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Click on any date marked with a colored badge or switch to the Timeline view.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedDayEvents.map((ev) => {
                          const catStyle = getCategoryStyle(ev.category);
                          const startTime = new Date(ev.startsAt);
                          const endTime = new Date(ev.endsAt);

                          return (
                            <div
                              key={ev.id}
                              className="border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between bg-white hover:border-[#034694]/50 transition-all shadow-2xs group"
                            >
                              {/* Selected Day Event Banner */}
                              <Link
                                href={`/events/${ev.slug}`}
                                className="relative w-full h-36 bg-slate-100 overflow-hidden block"
                              >
                                <img
                                  src={
                                    ev.bannerUrl ||
                                    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80'
                                  }
                                  alt={ev.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute top-2.5 left-2.5">
                                  <span
                                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md shadow-2xs backdrop-blur-xs border ${catStyle.badge}`}
                                  >
                                    {ev.category || 'General'}
                                  </span>
                                </div>
                              </Link>

                              <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                                    <span className="flex items-center gap-1 font-medium">
                                      <Clock className="w-3 h-3 text-[#034694]" />
                                      {startTime.toLocaleTimeString('en-US', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: true,
                                      })}
                                    </span>
                                    <span>{ev.club?.name || 'Campus Club'}</span>
                                  </div>

                                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#034694] transition-colors line-clamp-1">
                                    <Link href={`/events/${ev.slug}`}>
                                      {ev.title}
                                    </Link>
                                  </h4>

                                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                    {ev.summary || ev.description}
                                  </p>
                                </div>

                                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs mt-3">
                                  <div className="flex items-center gap-1 text-slate-500 text-[11px]">
                                    <MapPin className="w-3 h-3 text-slate-400" />
                                    <span className="truncate max-w-[150px]">{ev.venue}</span>
                                  </div>

                                  {ev.isAlreadyRegistered || myRegisteredEventIds.has(ev.id) ? (
                                    <Link
                                      href={`/events/${ev.slug}`}
                                      className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1 hover:bg-emerald-100 transition-colors"
                                    >
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      <span>Registered (Pass)</span>
                                    </Link>
                                  ) : (
                                    <Link
                                      href={`/events/${ev.slug}`}
                                      className="text-xs font-semibold text-[#034694] hover:underline flex items-center gap-1"
                                    >
                                      <span>View &amp; Register</span>
                                      <ArrowRight className="w-3 h-3" />
                                    </Link>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ============================================================== */}
            {/* VIEW 3: GRID CATALOG VIEW                                      */}
            {/* ============================================================== */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {sortedEvents.map((event) => {
                  const startDate = new Date(event.startsAt);
                  const isFull =
                    event.capacity &&
                    event.confirmedRegistrationsCount >= event.capacity;
                  const catStyle = getCategoryStyle(event.category);

                  return (
                    <Link
                      key={event.id}
                      href={`/events/${event.slug}`}
                      className="group block border border-slate-200 hover:border-slate-300 rounded-2xl overflow-hidden bg-white transition-all duration-200 hover:shadow-xs flex flex-col justify-between"
                    >
                      <div>
                        {/* Event Banner */}
                        <div className="relative aspect-[16/9] w-full bg-slate-100 overflow-hidden">
                          <img
                            src={
                              event.bannerUrl ||
                              'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80'
                            }
                            alt={event.title}
                            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                          />
                          <div className="absolute top-3 left-3">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md shadow-2xs backdrop-blur-xs border ${catStyle.badge}`}
                            >
                              {event.category || 'General'}
                            </span>
                          </div>
                        </div>

                        {/* Card Content */}
                        <div className="p-4 space-y-2">
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                            <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{event.club?.name || 'Campus Club'}</span>
                          </div>

                          <h3 className="font-bold text-slate-900 text-sm group-hover:text-[#034694] transition-colors line-clamp-2 leading-snug break-words">
                            {event.title}
                          </h3>

                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed break-words">
                            {event.summary || event.description}
                          </p>
                        </div>
                      </div>

                      {/* Card Meta Footer */}
                      <div className="p-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {startDate.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate max-w-[120px]">
                            {event.venue || 'Campus'}
                          </span>
                        </div>

                        {event.isAlreadyRegistered || myRegisteredEventIds.has(event.id) ? (
                          <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Registered
                          </span>
                        ) : isFull ? (
                          <span className="text-[11px] text-rose-600 font-medium">
                            Full
                          </span>
                        ) : event.isRegistrationOpen ? (
                          <span className="text-[11px] text-emerald-600 font-medium">
                            Open
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">
                            Closed
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
