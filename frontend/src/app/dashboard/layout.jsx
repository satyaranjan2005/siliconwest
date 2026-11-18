'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Building2,
  Calendar,
  Users,
  BookmarkCheck,
  LogOut,
  ExternalLink,
  Shield,
  Loader2,
  ArrowUpRight,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isSuperAdmin, isAuthenticated, logout, loading } = useAuth();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#034694] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Loading Dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const navItems = [
    {
      name: 'Overview',
      href: '/dashboard',
      icon: LayoutDashboard,
      active: pathname === '/dashboard',
    },
    {
      name: 'Events Hub',
      href: '/dashboard/events',
      icon: Calendar,
      active: pathname.startsWith('/dashboard/events'),
    },
    {
      name: 'Clubs Directory',
      href: '/dashboard/clubs',
      icon: Building2,
      active: pathname.startsWith('/dashboard/clubs'),
    },
    {
      name: 'Registrations',
      href: '/dashboard/registrations',
      icon: BookmarkCheck,
      active: pathname.startsWith('/dashboard/registrations'),
    },
    ...(isSuperAdmin
      ? [
          {
            name: 'User Accounts',
            href: '/dashboard/users',
            icon: Users,
            active: pathname.startsWith('/dashboard/users'),
          },
        ]
      : []),
  ];

  // Breadcrumb title
  const currentNav = navItems.find((item) => item.active) || { name: 'Overview' };

  return (
    <div className="flex min-h-screen bg-[#fafbfc] text-slate-900 font-sans">
      {/* 1. DASHBOARD SIDEBAR */}
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col justify-between shrink-0 hidden md:flex">
        <div className="p-5 space-y-6">
          {/* Brand Logo & Name */}
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-[#034694] text-white flex items-center justify-center font-bold text-base shadow-xs group-hover:bg-[#023168] transition-colors">
              S
            </div>
            <div className="flex flex-col">
              <span className="text-[#034694] font-extrabold text-sm tracking-tight leading-none">
                SILICON WEST
              </span>
              <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase mt-0.5">
                Operations Console
              </span>
            </div>
          </Link>

          {/* Navigation Items */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    item.active
                      ? 'bg-[#034694] text-white shadow-2xs font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0 opacity-80" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer User Info */}
        <div className="p-4 border-t border-slate-100 space-y-3">
          <div className="flex items-center gap-2.5 p-2 bg-slate-50 rounded-xl border border-slate-200/60">
            <div className="w-8 h-8 rounded-full bg-[#034694] text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
              {user?.name?.[0] || 'U'}
            </div>
            <div className="overflow-hidden min-w-0 flex-1">
              <div className="font-bold text-xs text-slate-900 truncate">
                {user?.name}
              </div>
              <div className="text-[10px] text-slate-500 truncate font-medium">
                {isSuperAdmin
                  ? 'Super Administrator'
                  : user?.assignedClubs?.length > 0
                  ? user.assignedClubs.map((c) => c.name).join(', ')
                  : 'Club Administrator'}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 px-1 text-xs">
            <Link
              href="/"
              className="text-slate-500 hover:text-[#034694] flex items-center gap-1 font-semibold transition-colors"
            >
              <span>Public Site</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>

            <button
              onClick={() => {
                logout();
                router.push('/login');
              }}
              className="text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="h-14 sm:h-16 border-b border-slate-200 bg-white px-4 sm:px-8 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center gap-2.5">
            {/* Mobile Drawer Toggle */}
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
              className="p-1.5 -ml-1 text-slate-700 hover:bg-slate-100 rounded-lg md:hidden"
              aria-label="Open Navigation Drawer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <Link href="/dashboard" className="hover:text-slate-900 transition-colors">
                Dashboard
              </Link>
              <span className="text-slate-300">/</span>
              <span className="font-bold text-slate-900 truncate max-w-[120px] sm:max-w-none">
                {currentNav.name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-[#034694] border border-blue-100">
              <Shield className="w-3 h-3 shrink-0" />
              <span className="truncate max-w-[90px] sm:max-w-none">
                {user?.role?.replace('_', ' ')}
              </span>
            </span>

            <Link
              href="/"
              className="hidden sm:inline-flex items-center gap-1 text-slate-500 hover:text-[#034694] text-xs font-semibold px-2 py-1 rounded-md hover:bg-slate-50"
            >
              <span>Public Site</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        {/* Mobile Slide-out Drawer */}
        {mobileDrawerOpen && (
          <div className="fixed inset-0 z-50 md:hidden bg-slate-900/40 backdrop-blur-xs flex">
            <div className="w-72 bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-left duration-200">
              <div className="p-5 space-y-6">
                <div className="flex items-center justify-between">
                  <Link href="/dashboard" className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#034694] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                      S
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[#034694] font-extrabold text-xs tracking-tight">
                        SILICON WEST
                      </span>
                      <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                        Console
                      </span>
                    </div>
                  </Link>
                  <button
                    onClick={() => setMobileDrawerOpen(false)}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Nav Items */}
                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                          item.active
                            ? 'bg-[#034694] text-white shadow-2xs font-bold'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0 opacity-80" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Drawer Footer User Profile */}
              <div className="p-4 border-t border-slate-100 space-y-3 bg-slate-50/50">
                <div className="flex items-center gap-2.5 p-2 bg-white rounded-xl border border-slate-200/60">
                  <div className="w-8 h-8 rounded-full bg-[#034694] text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
                    {user?.name?.[0] || 'U'}
                  </div>
                  <div className="overflow-hidden min-w-0 flex-1">
                    <div className="font-bold text-xs text-slate-900 truncate">
                      {user?.name}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate font-medium">
                      {isSuperAdmin
                        ? 'Super Admin'
                        : user?.assignedClubs?.length > 0
                        ? user.assignedClubs.map((c) => c.name).join(', ')
                        : 'Club Admin'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 px-1 text-xs">
                  <Link
                    href="/"
                    className="text-slate-600 hover:text-[#034694] flex items-center gap-1 font-semibold transition-colors"
                  >
                    <span>Public Site</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    onClick={() => {
                      logout();
                      router.push('/login');
                    }}
                    className="text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="flex-1" onClick={() => setMobileDrawerOpen(false)} />
          </div>
        )}

        {/* Child Workspace */}
        <main className="p-3.5 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl w-full mx-auto flex-1 pb-24 md:pb-8">
          {children}
        </main>

        {/* Mobile Bottom Navigation Bar (Smartphones) */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 flex items-center justify-around py-2 px-1 md:hidden shadow-lg">
          <Link
            href="/dashboard"
            className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors ${
              pathname === '/dashboard' ? 'text-[#034694] font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Home</span>
          </Link>

          <Link
            href="/dashboard/events"
            className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors ${
              pathname.startsWith('/dashboard/events') ? 'text-[#034694] font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Events</span>
          </Link>

          <Link
            href="/dashboard/clubs"
            className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors ${
              pathname.startsWith('/dashboard/clubs') ? 'text-[#034694] font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Clubs</span>
          </Link>

          <Link
            href="/dashboard/registrations"
            className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors ${
              pathname.startsWith('/dashboard/registrations') ? 'text-[#034694] font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <BookmarkCheck className="w-4 h-4" />
            <span>Rosters</span>
          </Link>

          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-semibold text-slate-500 hover:text-slate-900"
          >
            <Menu className="w-4 h-4" />
            <span>Menu</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
