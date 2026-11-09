'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Building,
  Plus,
  Search,
  ExternalLink,
  Calendar,
  Loader2,
  Users,
  Award,
  GraduationCap,
  Pencil,
  Trash2,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { clubsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function DashboardClubsPage() {
  const { isSuperAdmin } = useAuth();

  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [clubToDelete, setClubToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);

  const loadClubs = async () => {
    setLoading(true);
    try {
      const data = await clubsApi.list({ includeArchived: 'true' });
      setClubs(data || []);
    } catch (err) {
      console.error('Failed to load clubs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClub = async () => {
    if (!clubToDelete) return;
    setDeleting(true);
    setActionError(null);
    try {
      await clubsApi.delete(clubToDelete.id);
      setClubs((prev) => prev.filter((c) => c.id !== clubToDelete.id));
      setActionSuccess(`Society "${clubToDelete.name}" has been permanently deleted.`);
      setClubToDelete(null);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      console.error('Delete club error:', err);
      setActionError(err.message || 'Failed to delete society.');
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    loadClubs();
  }, []);

  const filteredClubs = clubs.filter((club) => {
    const matchesSearch =
      club.name.toLowerCase().includes(search.toLowerCase()) ||
      club.slug.toLowerCase().includes(search.toLowerCase()) ||
      (club.category && club.category.toLowerCase().includes(search.toLowerCase())) ||
      (club.secretary && club.secretary.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory =
      categoryFilter === 'ALL' ||
      (club.category && club.category.toLowerCase() === categoryFilter.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  const categories = ['ALL', 'Technical', 'Cultural', 'Sports', 'Media & Arts'];

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Building className="w-6 h-6 text-[#034694]" />
            Clubs & Societies Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage official university societies, executive leadership (Secretaries & Faculty Advisors), and charters
          </p>
        </div>

        {isSuperAdmin && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link
              href="/dashboard/clubs/new"
              className="bg-[#034694] hover:bg-[#02336d] text-white font-bold text-xs h-10 px-4 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-colors w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Club</span>
            </Link>
          </div>
        )}
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* METRIC HIGHLIGHTS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-slate-200 shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#034694] flex items-center justify-center font-bold">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-black text-slate-900">{clubs.length}</p>
              <p className="text-[11px] font-semibold text-slate-500">Registered Societies</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-black text-slate-900">
                {clubs.filter((c) => !c.isArchived).length}
              </p>
              <p className="text-[11px] font-semibold text-slate-500">Active Charters</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-black text-slate-900">
                {clubs.reduce((acc, c) => acc + (c.upcomingEventsCount || 0), 0)}
              </p>
              <p className="text-[11px] font-semibold text-slate-500">Live Campus Events</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-black text-slate-900">
                {clubs.filter((c) => c.secretary).length}
              </p>
              <p className="text-[11px] font-semibold text-slate-500">Elected Secretaries</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SEARCH AND CATEGORY FILTER TABS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by society name, slug, secretary or domain..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#034694]/20"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                categoryFilter === cat
                  ? 'bg-[#034694] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat === 'ALL' ? 'All Domains' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* CLUBS TABLE DIRECTORY */}
      <Card className="overflow-hidden border-slate-200 shadow-xs">
        <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between py-4 px-6">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900">
              Institutional Society Charters ({filteredClubs.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Silicon West registered student chapters, leadership &amp; executive councils
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#034694]" />
              <p className="text-xs font-semibold text-slate-500">Loading clubs directory...</p>
            </div>
          ) : filteredClubs.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Building className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">No clubs found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {search
                    ? 'No clubs match your current search query. Try resetting your filter.'
                    : 'Start by creating your first student club or society.'}
                </p>
              </div>
              {isSuperAdmin && (
                <Link
                  href="/dashboard/clubs/new"
                  className="inline-flex items-center gap-1.5 bg-[#034694] hover:bg-[#02336d] text-white font-bold text-xs h-9 px-4 rounded-xl shadow-xs"
                >
                  <Plus className="w-4 h-4 mr-0.5" />
                  <span>Create Club</span>
                </Link>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80">
                  <TableHead className="font-bold text-slate-700 text-xs">Society & Logo</TableHead>
                  <TableHead className="font-bold text-slate-700 text-xs">Council Leadership</TableHead>
                  <TableHead className="font-bold text-slate-700 text-xs">Category</TableHead>
                  <TableHead className="font-bold text-slate-700 text-xs">Events</TableHead>
                  <TableHead className="font-bold text-slate-700 text-xs">Status</TableHead>
                  <TableHead className="font-bold text-slate-700 text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClubs.map((club) => (
                  <TableRow key={club.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Club Name & Logo */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                          {club.logoUrl ? (
                            <img
                              src={club.logoUrl}
                              alt={club.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="font-black text-[#034694] text-base">
                              {club.name?.[0]}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-sm truncate">{club.name}</p>
                          <span className="text-[11px] text-slate-400 font-mono">/clubs/{club.slug}</span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Council Leadership (Secretary & Faculty Advisor) */}
                    <TableCell>
                      <div className="space-y-1 text-xs">
                        {club.secretary && (
                          <div className="flex items-center gap-1.5 text-slate-800">
                            <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span className="font-bold">{club.secretary}</span>
                            <span className="text-[10px] text-slate-400 font-medium">(Sec)</span>
                          </div>
                        )}
                        {club.facultyCoordinator && (
                          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                            <GraduationCap className="w-3.5 h-3.5 text-[#034694] shrink-0" />
                            <span className="truncate max-w-[180px]">{club.facultyCoordinator}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant="secondary" className="font-semibold text-xs">
                        {club.category || 'General'}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                        <Calendar className="w-3.5 h-3.5 text-amber-500" />
                        <span>{club.upcomingEventsCount ?? 0} Events</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant={club.isArchived ? 'destructive' : 'success'}>
                        {club.isArchived ? 'Archived' : 'Active'}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/dashboard/clubs/${club.id}/edit`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-[#034694] text-[#034694] hover:text-white font-bold text-xs transition-colors shadow-2xs"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </Link>
                        {isSuperAdmin && (
                          <button
                            type="button"
                            onClick={() => {
                              setActionError(null);
                              setClubToDelete(club);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white font-bold text-xs transition-colors shadow-2xs"
                            title="Delete society"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        )}
                        <Link
                          href={`/clubs/${club.slug}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 px-2 py-1 text-slate-500 hover:text-slate-900 font-semibold text-xs transition-colors"
                        >
                          <span>View</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      {clubToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">
                  Delete &ldquo;{clubToDelete.name}&rdquo;?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Are you sure you want to permanently delete this society? This will remove its executive council, leadership records, and all associated event entries. This action cannot be undone.
                </p>
              </div>
            </div>

            {actionError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={deleting}
                onClick={() => {
                  setClubToDelete(null);
                  setActionError(null);
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
