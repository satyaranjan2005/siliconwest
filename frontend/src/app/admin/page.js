'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Shield,
  Building,
  Users,
  Calendar,
  BookmarkCheck,
  Plus,
  Archive,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Lock,
  Layers,
} from 'lucide-react';
import { statsApi, clubsApi, adminApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function SuperAdminPage() {
  const router = useRouter();
  const { user, isSuperAdmin, isAuthenticated, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [clubs, setClubs] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Forms
    
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'CLUB_ADMIN',
    clubIds: [],
  });

  const [regSearch, setRegSearch] = useState('');

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isSuperAdmin)) {
      router.push('/login');
      return;
    }

    if (isAuthenticated && isSuperAdmin) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isSuperAdmin, authLoading, router]);

  async function loadAllAdminData() {
    setLoading(true);
    try {
      const [statsData, clubsData, usersData, regsData] = await Promise.all([
        statsApi.getDashboard(),
        clubsApi.list({ includeArchived: 'true' }),
        adminApi.getUsers(),
        adminApi.getAllRegistrations(),
      ]);
      setStats(statsData?.metrics || {});
      setClubs(clubsData || []);
      setUsersList(usersData || []);
      setRegistrations(regsData || []);
    } catch (err) {
      console.error('Error loading super admin data:', err);
    } finally {
      setLoading(false);
    }
  }

  
  // Club Archive / Restore
  const handleToggleArchive = async (club) => {
    try {
      if (club.isArchived) {
        await clubsApi.restore(club.id);
      } else {
        if (!window.confirm(`Are you sure you want to archive "${club.name}"? Historical records will be preserved.`)) {
          return;
        }
        await clubsApi.archive(club.id);
      }
      loadAllAdminData();
    } catch (err) {
      alert(err.message || 'Failed to update club status.');
    }
  };

  // User Create
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await adminApi.createUser(newUser);
      setShowUserModal(false);
      setNewUser({
        name: '',
        email: '',
        password: '',
        role: 'CLUB_ADMIN',
        clubIds: [],
      });
      loadAllAdminData();
    } catch (err) {
      alert(err.message || 'Failed to create user.');
    }
  };

  // User Deactivate/Reactivate
  const handleToggleUserStatus = async (targetUser) => {
    try {
      await adminApi.toggleUserStatus(targetUser.id, !targetUser.isActive);
      loadAllAdminData();
    } catch (err) {
      alert(err.message || 'Failed to update user status.');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="w-12 h-12 border-4 border-[#034694] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const filteredRegistrations = registrations.filter((r) => {
    if (!regSearch.trim()) return true;
    const q = regSearch.toLowerCase();
    return (
      r.participantName?.toLowerCase().includes(q) ||
      r.participantEmail?.toLowerCase().includes(q) ||
      r.event?.title?.toLowerCase().includes(q) ||
      r.rollNumber?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Super Admin Top Header */}
        <div className="bg-gradient-to-r from-slate-900 via-[#022b5c] to-slate-900 rounded-3xl p-8 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 bg-purple-500/20 text-purple-300 border border-purple-400/30 px-3 py-1 rounded-full text-xs font-bold">
              <Shield className="w-3.5 h-3.5" />
              Platform Super Administration
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Silicon West Executive Console
            </h1>
            <p className="text-xs text-slate-300">
              Welcome, <span className="font-semibold text-white">{user?.name}</span> • Platform single source of truth
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard/clubs/new"
              className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold text-xs px-4 py-2.5 rounded-xl shadow transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> New Club
            </Link>
            <button
              onClick={() => setShowUserModal(true)}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs px-4 py-2.5 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Provision Admin
            </button>
          </div>
        </div>

        {/* 4 Metrics Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Building className="w-4 h-4 text-blue-600" /> Active Clubs
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {stats.totalClubs ?? clubs.filter((c) => !c.isArchived).length}
            </div>
            <span className="text-[11px] text-slate-500">
              {stats.archivedClubs || 0} clubs archived
            </span>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-600" /> Published Events
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {stats.publishedEvents ?? 0}
            </div>
            <span className="text-[11px] text-slate-500">
              {stats.upcomingEvents ?? 0} upcoming
            </span>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <BookmarkCheck className="w-4 h-4 text-amber-600" /> Confirmed Registrations
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {stats.confirmedRegistrations ?? 0}
            </div>
            <span className="text-[11px] text-slate-500">
              {stats.cancelledRegistrations || 0} cancelled
            </span>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-purple-600" /> System Users
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {usersList.length}
            </div>
            <span className="text-[11px] text-slate-500">
              Admins & Students
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 gap-2 overflow-x-auto">
          {[
            { id: 'overview', label: 'All Clubs' },
            { id: 'users', label: 'Admin & User Accounts' },
            { id: 'registrations', label: 'Platform Registrations' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-[#034694] text-[#034694]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Clubs Management */}
        {activeTab === 'overview' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">All Registered College Clubs</h2>
              <Link
                href="/dashboard/clubs/new"
                className="text-xs font-bold text-[#034694] hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add New Club
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-5">Club Name & Slug</th>
                    <th className="py-3 px-5">Category</th>
                    <th className="py-3 px-5">Assigned Admins</th>
                    <th className="py-3 px-5">Status</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clubs.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-5">
                        <span className="font-bold text-slate-900 block">{c.name}</span>
                        <span className="text-[11px] text-slate-400 font-mono">/clubs/{c.slug}</span>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="bg-blue-50 text-[#034694] px-2 py-0.5 rounded font-semibold text-[10px]">
                          {c.category || 'General'}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-slate-600">
                        {c.admins && c.admins.length > 0 ? (
                          <div className="space-y-0.5">
                            {c.admins.map((a) => (
                              <span key={a.id} className="block font-medium">
                                {a.name} ({a.email})
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">None assigned</span>
                        )}
                      </td>
                      <td className="py-3.5 px-5">
                        {c.isArchived ? (
                          <span className="bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded text-[10px]">
                            Archived
                          </span>
                        ) : (
                          <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded text-[10px]">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-right space-x-2">
                        <Link
                          href={`/clubs/${c.slug}`}
                          className="text-[#034694] hover:underline font-bold"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleToggleArchive(c)}
                          className={`font-bold hover:underline ${
                            c.isArchived ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {c.isArchived ? 'Restore' : 'Archive'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: User Accounts */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Administrator & User Accounts</h2>
              <button
                onClick={() => setShowUserModal(true)}
                className="text-xs font-bold text-[#034694] hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Provision New Account
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-5">User</th>
                    <th className="py-3 px-5">Role</th>
                    <th className="py-3 px-5">Assigned Clubs</th>
                    <th className="py-3 px-5">Status</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-5">
                        <span className="font-bold text-slate-900 block">{u.name}</span>
                        <span className="text-[11px] text-slate-400">{u.email}</span>
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            u.role === 'SUPER_ADMIN'
                              ? 'bg-purple-100 text-purple-800'
                              : u.role === 'CLUB_ADMIN'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {u.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-slate-600">
                        {u.assignments && u.assignments.length > 0 ? (
                          <div className="space-y-0.5">
                            {u.assignments.map((a) => (
                              <span key={a.club.id} className="block font-medium">
                                • {a.club.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-5">
                        {u.isActive ? (
                          <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded text-[10px]">
                            Active
                          </span>
                        ) : (
                          <span className="bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded text-[10px]">
                            Deactivated
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        {u.id !== user?.id && (
                          <button
                            onClick={() => handleToggleUserStatus(u)}
                            className={`font-bold hover:underline ${
                              u.isActive ? 'text-rose-600' : 'text-emerald-600'
                            }`}
                          >
                            {u.isActive ? 'Deactivate' : 'Reactivate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Global Registrations */}
        {activeTab === 'registrations' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden space-y-4 p-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-sm font-bold text-slate-900">
                All Event Registrations Across Platform ({filteredRegistrations.length})
              </h2>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  value={regSearch}
                  onChange={(e) => setRegSearch(e.target.value)}
                  placeholder="Search by participant or event..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Participant</th>
                    <th className="py-3 px-4">Event</th>
                    <th className="py-3 px-4">Club</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRegistrations.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{r.participantName}</span>
                        <span className="text-[11px] text-slate-400">{r.participantEmail}</span>
                        {r.rollNumber && (
                          <span className="text-[10px] text-slate-500 block">ID: {r.rollNumber}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {r.event?.title}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {r.event?.club?.name}
                      </td>
                      <td className="py-3 px-4">
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
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {new Date(r.registeredAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal: Create User & Assign Club */}
        {showUserModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="font-bold text-slate-900 text-base">Provision Administrator Account</h3>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    placeholder="Prof. or Student Lead Name"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="lead@silicon.ac.in"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Temporary Password</label>
                  <input
                    type="password"
                    required
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="Minimum 6 characters"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assign to Club(s)</label>
                  <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1.5 bg-slate-50">
                    {clubs.map((c) => (
                      <label key={c.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newUser.clubIds.includes(c.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewUser({ ...newUser, clubIds: [...newUser.clubIds, c.id] });
                            } else {
                              setNewUser({ ...newUser, clubIds: newUser.clubIds.filter((id) => id !== c.id) });
                            }
                          }}
                          className="rounded text-[#034694]"
                        />
                        <span>{c.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowUserModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#034694] text-white font-bold"
                  >
                    Create Account
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
