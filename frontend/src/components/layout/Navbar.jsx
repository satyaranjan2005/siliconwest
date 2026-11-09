'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  Menu,
  X,
  Calendar,
  Compass,
  BookmarkCheck,
  Shield,
  LogOut,
  User,
  ChevronDown,
  Building2,
  ExternalLink,
  GraduationCap,
  Bell,
  Check,
  Loader2,
  Users,
} from 'lucide-react';
import { invitationsApi } from '@/lib/api';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [invitations, setInvitations] = useState([]);
  const [respondingId, setRespondingId] = useState(null);

  const dropdownRef = useRef(null);
  const notifRef = useRef(null);
  const pathname = usePathname();
  const { user, logout, isSuperAdmin, isClubAdmin, isAuthenticated } = useAuth();

  // Load invitations when authenticated
  const loadInvitations = async () => {
    if (!isAuthenticated) return;
    try {
      const data = await invitationsApi.getMy();
      setInvitations(Array.isArray(data) ? data : []);
    } catch (err) {
      // Silently catch
    }
  };

  useEffect(() => {
    loadInvitations();
  }, [isAuthenticated, pathname]);

  // Handle invitation response from Navbar
  const handleRespond = async (id, action) => {
    setRespondingId(id);
    try {
      await invitationsApi.respond(id, action);
      await loadInvitations();
    } catch (err) {
      alert(err.message || 'Failed to update invitation.');
    } finally {
      setRespondingId(null);
    }
  };

  const pendingInvitations = invitations.filter((inv) => inv.status === 'PENDING');

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  }, [pathname]);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Clubs', href: '/clubs', icon: Compass },
    { name: 'Events', href: '/events', icon: Calendar },
    ...(isAuthenticated ? [{ name: 'My Registrations', href: '/my-registrations', icon: BookmarkCheck }] : []),
  ];

  return (
    <header className="w-full z-50 sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Top University Ticker Strip */}
      <div className="bg-[#022b5c] text-white text-[11px] py-1 px-4 sm:px-6 border-b border-blue-950/40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 truncate">
            <span className="bg-amber-400 text-slate-900 font-bold px-1.5 py-0.2 rounded text-[9px] uppercase tracking-wider shrink-0">
              Campus Hub
            </span>
            <span className="text-slate-200 truncate">
              Silicon West Sambalpur Campus • College Club &amp; Event Management Portal
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-3 shrink-0 text-slate-300">
            <a
              href="https://silicon.ac.in"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              <span>Main University (silicon.ac.in)</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-9 h-9 rounded-xl bg-[#034694] text-white flex items-center justify-center font-bold text-base shadow-xs group-hover:bg-[#023168] transition-colors">
            S
          </div>
          <div className="flex flex-col">
            <span className="text-[#034694] font-extrabold text-base tracking-tight leading-none group-hover:text-blue-900 transition-colors">
              SILICON WEST
            </span>
            <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase mt-0.5">
              Campus Portal
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive =
              link.href === '/'
                ? pathname === '/'
                : pathname.startsWith(link.href);
            const Icon = link.icon;

            return (
              <Link
                key={link.name}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'text-[#034694] bg-blue-50/80 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5 opacity-70" />}
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Action Controls & User Profile */}
        <div className="hidden sm:flex items-center gap-2.5">
          {isSuperAdmin && (
            <Link
              href="/dashboard"
              className="bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200/80 px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-colors"
            >
              <Shield className="w-3 h-3 text-purple-600" />
              <span>Admin Portal</span>
            </Link>
          )}

          {isClubAdmin && (
            <Link
              href="/dashboard"
              className="bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/80 px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-colors"
            >
              <Building2 className="w-3 h-3 text-amber-600" />
              <span>Club Admin</span>
            </Link>
          )}

          {/* Notifications Bell for Team Invitations */}
          {isAuthenticated && (
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-full border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
                title="Team Invitations & Requests"
              >
                <Bell className="w-4 h-4" />
                {pendingInvitations.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center animate-pulse">
                    {pendingInvitations.length}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-80 max-w-sm bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in slide-in-from-top-1 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 px-1">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#034694]" />
                      Team Requests ({pendingInvitations.length})
                    </span>
                    {pendingInvitations.length > 0 && (
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                        Action Required
                      </span>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-2">
                    {pendingInvitations.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400">
                        No pending team invitations.
                      </div>
                    ) : (
                      pendingInvitations.map((inv) => (
                        <div
                          key={inv.id}
                          className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2"
                        >
                          <div>
                            <span className="font-bold text-slate-900 block leading-tight">
                              {inv.event?.title}
                            </span>
                            <span className="text-[11px] text-slate-500 block mt-0.5">
                              Invited by <strong>{inv.inviterName}</strong> to join team &ldquo;<strong>{inv.teamName}</strong>&rdquo;
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 pt-1">
                            <button
                              type="button"
                              disabled={respondingId === inv.id}
                              onClick={() => handleRespond(inv.id, 'ACCEPT')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1"
                            >
                              {respondingId === inv.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Check className="w-3 h-3" />
                              )}
                              <span>Join Team</span>
                            </button>

                            <button
                              type="button"
                              disabled={respondingId === inv.id}
                              onClick={() => handleRespond(inv.id, 'DECLINE')}
                              className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-600 font-semibold text-[11px] rounded-lg transition-colors"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {isAuthenticated ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all shadow-2xs"
              >
                <div className="w-6 h-6 rounded-full bg-[#034694] text-white flex items-center justify-center font-bold text-[11px]">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="max-w-[110px] truncate">{user?.name}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-1">
                  <div className="px-3.5 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                    <span className="inline-block mt-1 text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded bg-blue-50 text-[#034694] border border-blue-100">
                      {user?.role?.replace('_', ' ') || 'STUDENT'}
                    </span>
                  </div>

                  <div className="py-1">
                    <Link
                      href="/my-registrations"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-[#034694] transition-colors"
                    >
                      <BookmarkCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>My Registrations</span>
                    </Link>

                    {isSuperAdmin && (
                      <Link
                        href="/dashboard"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-[#034694] transition-colors"
                      >
                        <Shield className="w-3.5 h-3.5 text-purple-600" />
                        <span>Super Admin Console</span>
                      </Link>
                    )}

                    {isClubAdmin && (
                      <Link
                        href="/dashboard"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-[#034694] transition-colors"
                      >
                        <Building2 className="w-3.5 h-3.5 text-amber-600" />
                        <span>Club Admin Portal</span>
                      </Link>
                    )}
                  </div>

                  <div className="border-t border-slate-100 pt-1 mt-0.5">
                    <button
                      onClick={() => {
                        logout();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 text-left font-semibold transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Link
                href="/login"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-[#034694] hover:bg-slate-50 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#034694] hover:bg-[#023168] text-white shadow-2xs transition-colors"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Action Controls */}
        <div className="flex md:hidden items-center gap-1.5">
          {isAuthenticated && (
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => {
                  setNotifOpen(!notifOpen);
                  if (mobileMenuOpen) setMobileMenuOpen(false);
                }}
                className="relative p-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
                aria-label="View notifications"
              >
                <Bell className="w-4 h-4" />
                {pendingInvitations.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center animate-pulse">
                    {pendingInvitations.length}
                  </span>
                )}
              </button>
            </div>
          )}

          <button
            onClick={() => {
              setMobileMenuOpen(!mobileMenuOpen);
              if (notifOpen) setNotifOpen(false);
            }}
            className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-3 animate-in slide-in-from-top-1 duration-150">
          <div className="space-y-1">
            {navLinks.map((link) => {
              const isActive =
                link.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(link.href);
              const Icon = link.icon;

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    isActive
                      ? 'text-[#034694] bg-blue-50 font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4 opacity-70" />}
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-2">
            {isSuperAdmin && (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-purple-50 text-purple-700 text-xs font-semibold border border-purple-200"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Super Admin Portal</span>
              </Link>
            )}

            {isClubAdmin && (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-amber-50 text-amber-800 text-xs font-semibold border border-amber-200"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Club Admin Portal</span>
              </Link>
            )}

            {/* Mobile team invitations alert */}
            {isAuthenticated && pendingInvitations.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1.5">
                <span className="font-bold text-amber-900 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-amber-600" />
                  <span>{pendingInvitations.length} Pending Team Request(s)</span>
                </span>
                <p className="text-[11px] text-amber-700">
                  You have pending team invitations to join campus events.
                </p>
                <div className="space-y-1 pt-1">
                  {pendingInvitations.map((inv) => (
                    <div key={inv.id} className="bg-white p-2 rounded-lg border border-amber-200 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-slate-800 truncate">{inv.teamName} ({inv.event?.title})</span>
                      <div className="flex gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleRespond(inv.id, 'ACCEPT')}
                          className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-bold"
                        >
                          Join
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRespond(inv.id, 'DECLINE')}
                          className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px]"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {isAuthenticated ? (
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2 rounded-lg bg-rose-50 text-rose-600 text-xs font-semibold text-center flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out ({user?.name})</span>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 rounded-lg border border-slate-200 text-slate-800 text-xs font-semibold hover:bg-slate-50"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 rounded-lg bg-[#034694] text-white text-xs font-semibold hover:bg-[#023168]"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
