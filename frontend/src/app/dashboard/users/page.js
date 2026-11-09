'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Search,
  Loader2,
  Shield,
  Building,
  UserCheck,
  UserX,
  AlertCircle,
  Plus,
  X,
  Trash2,
  CheckCircle2,
  Filter,
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
import { adminApi, clubsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function DashboardUsersPage() {
  const router = useRouter();
  const { isSuperAdmin, loading: authLoading, user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [clubFilter, setClubFilter] = useState('ALL');
  const [actionLoading, setActionLoading] = useState(null);

  // Modal State for Assigning Club Admin
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedClubId, setSelectedClubId] = useState('');
  const [assigningLoading, setAssigningLoading] = useState(false);
  const [assignError, setAssignError] = useState(null);
  const [revokingId, setRevokingId] = useState(null);

  useEffect(() => {
    if (!authLoading && !isSuperAdmin) {
      router.push('/dashboard');
    }
  }, [isSuperAdmin, authLoading, router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, clubsData] = await Promise.all([
        adminApi.getUsers().catch(() => []),
        clubsApi.list({ includeArchived: 'false' }).catch(() => []),
      ]);
      setUsers(usersData || []);
      setClubs(clubsData || []);
    } catch (err) {
      console.error('Failed to load users & clubs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      loadData();
    }
  }, [isSuperAdmin]);

  const handleToggleStatus = async (targetUser) => {
    setActionLoading(targetUser.id);
    try {
      await adminApi.toggleUserStatus(targetUser.id, !targetUser.isActive);
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, isActive: !u.isActive } : u))
      );
    } catch (err) {
      alert(err.message || 'Failed to update user status.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleChange = async (targetUser, newRole) => {
    if (targetUser.id === currentUser?.id && newRole !== 'SUPER_ADMIN') {
      alert('You cannot demote your own Super Admin account.');
      return;
    }
    setActionLoading(targetUser.id);
    try {
      await adminApi.updateUserRole(targetUser.id, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      alert(err.message || 'Failed to update user role.');
    } finally {
      setActionLoading(null);
    }
  };

  // Get all users who are currently admins of a specific club
  const getClubAdmins = (clubId) => {
    return users.filter((u) =>
      (u.assignments || []).some((a) => a.clubId === clubId || a.club?.id === clubId)
    );
  };

  // Open Assign Modal for a specific user or generic
  const openAssignModal = (targetUser = null) => {
    setAssignError(null);
    const userToSelect = targetUser ? targetUser.id : (users[0]?.id || '');
    setSelectedUserId(userToSelect);

    // Pick first club with available quota (< 2 admins) if possible
    const availableClub = clubs.find((c) => {
      const admins = getClubAdmins(c.id);
      const isAlreadyAssigned = targetUser?.assignments?.some((a) => a.clubId === c.id || a.club?.id === c.id);
      return admins.length < 2 && !isAlreadyAssigned;
    });

    if (availableClub) {
      setSelectedClubId(availableClub.id);
    } else if (clubs.length > 0) {
      setSelectedClubId(clubs[0].id);
    }

    setShowAssignModal(true);
  };

  // Submit new assignment
  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!selectedUserId || !selectedClubId) {
      setAssignError('Please select both a user and a club.');
      return;
    }

    // Check if club already has 2 admins
    const clubAdmins = getClubAdmins(selectedClubId);
    if (clubAdmins.length >= 2) {
      setAssignError(
        `This club already has the maximum limit of 2 administrators assigned (${clubAdmins.map((a) => a.name).join(', ')}). Revoke one before adding a new administrator.`
      );
      return;
    }

    setAssigningLoading(true);
    setAssignError(null);
    try {
      const assignment = await adminApi.createAssignment(selectedUserId, selectedClubId);
      
      // Update local state with the new assignment and promote role to CLUB_ADMIN if was STUDENT
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === selectedUserId) {
            const currentAssignments = u.assignments || [];
            // Avoid duplicate
            if (currentAssignments.some((a) => a.clubId === selectedClubId)) return u;
            const chosenClub = clubs.find((c) => c.id === selectedClubId);
            const newAssignmentItem = {
              id: assignment.id,
              userId: selectedUserId,
              clubId: selectedClubId,
              club: chosenClub || assignment.club,
            };
            return {
              ...u,
              role: u.role === 'STUDENT' ? 'CLUB_ADMIN' : u.role,
              assignments: [...currentAssignments, newAssignmentItem],
            };
          }
          return u;
        })
      );

      // Keep modal open or clear selection
      const remainingClubs = clubs.filter(
        (c) => c.id !== selectedClubId
      );
      if (remainingClubs.length > 0) {
        setSelectedClubId(remainingClubs[0].id);
      }
    } catch (err) {
      setAssignError(err.message || 'Failed to assign user to club.');
    } finally {
      setAssigningLoading(false);
    }
  };

  // Revoke an assignment
  const handleRevokeAssignment = async (assignmentId, userId) => {
    if (!confirm('Are you sure you want to remove this club admin assignment?')) return;
    setRevokingId(assignmentId);
    try {
      await adminApi.deleteAssignment(assignmentId);
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === userId) {
            return {
              ...u,
              assignments: (u.assignments || []).filter((a) => a.id !== assignmentId),
            };
          }
          return u;
        })
      );
    } catch (err) {
      alert(err.message || 'Failed to revoke club assignment.');
    } finally {
      setRevokingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    const matchesSearch =
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q);

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;

    const matchesClub =
      clubFilter === 'ALL' ||
      (u.assignments || []).some((a) => a.clubId === clubFilter || a.club?.id === clubFilter);

    return matchesSearch && matchesRole && matchesClub;
  });

  const activeSelectedUser = users.find((u) => u.id === selectedUserId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            User Accounts & Permissions
          </h1>
          <p className="text-xs text-slate-500">
            Super Administrator console to manage roles, assign club administrators, and oversee access.
          </p>
        </div>

        {/* Top Header Action to Assign Club Admins */}
        <Button
          onClick={() => openAssignModal()}
          className="bg-[#034694] hover:bg-[#02336d] text-white font-bold h-10 px-4 text-xs rounded-xl shadow-xs flex items-center gap-2 self-start sm:self-auto"
        >
          <Building className="w-4 h-4" />
          <span>Assign Club Admin</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name or email..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#034694]/20"
          />
        </div>

        {/* Role Filter */}
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#034694]/20"
        >
          <option value="ALL">All Roles</option>
          <option value="SUPER_ADMIN">Super Admin</option>
          <option value="CLUB_ADMIN">Club Admin</option>
          <option value="STUDENT">Student</option>
        </select>

        {/* Club Filter */}
        <select
          value={clubFilter}
          onChange={(e) => setClubFilter(e.target.value)}
          className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#034694]/20"
        >
          <option value="ALL">All Assigned Clubs</option>
          {clubs.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table Card */}
      <Card className="overflow-hidden border-slate-200 shadow-xs">
        <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between py-4 px-6">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900">
              Users Directory ({filteredUsers.length})
            </CardTitle>
            <CardDescription className="text-xs">
              System access accounts across faculty, clubs, and student bodies
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#034694]" />
              <p className="text-xs font-semibold text-slate-500">Loading user accounts...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <Users className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-500">No users match your filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80">
                    <TableHead className="font-bold text-slate-700 text-xs">User</TableHead>
                    <TableHead className="font-bold text-slate-700 text-xs">Role</TableHead>
                    <TableHead className="font-bold text-slate-700 text-xs">Assigned Clubs</TableHead>
                    <TableHead className="font-bold text-slate-700 text-xs">Status</TableHead>
                    <TableHead className="font-bold text-slate-700 text-xs text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u) => {
                    const userAssignments = u.assignments || [];
                    return (
                      <TableRow key={u.id} className="hover:bg-slate-50/60 transition-colors">
                        <TableCell>
                          <div className="font-bold text-slate-900 text-xs">{u.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                        </TableCell>

                        {/* Role Selector */}
                        <TableCell>
                          <select
                            value={u.role}
                            disabled={actionLoading === u.id || u.id === currentUser?.id}
                            onChange={(e) => handleRoleChange(u, e.target.value)}
                            className={`text-[11px] font-bold px-2 py-1 rounded-lg border focus:outline-none transition-colors ${
                              u.role === 'SUPER_ADMIN'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : u.role === 'CLUB_ADMIN'
                                ? 'bg-blue-50 text-[#034694] border-blue-200'
                                : 'bg-slate-50 text-slate-700 border-slate-200'
                            }`}
                          >
                            <option value="STUDENT">STUDENT</option>
                            <option value="CLUB_ADMIN">CLUB ADMIN</option>
                            <option value="SUPER_ADMIN">SUPER ADMIN</option>
                          </select>
                        </TableCell>

                        {/* Assigned Clubs Chips & Quick Assign */}
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-1.5 max-w-md">
                            {userAssignments.length > 0 ? (
                              userAssignments.map((a) => (
                                <span
                                  key={a.id}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50/80 border border-blue-200/60 text-[#034694] text-[11px] font-semibold"
                                >
                                  <Building className="w-3 h-3 text-[#034694]" />
                                  <span>{a.club?.name || 'Club'}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRevokeAssignment(a.id, u.id)}
                                    disabled={revokingId === a.id}
                                    title="Revoke Club Admin assignment"
                                    className="hover:bg-blue-200/60 rounded p-0.5 text-blue-600 hover:text-rose-600 transition-colors"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">
                                No club assigned
                              </span>
                            )}

                            {/* Add/Assign Button */}
                            <button
                              type="button"
                              onClick={() => openAssignModal(u)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-dashed border-slate-300 hover:border-[#034694] text-slate-500 hover:text-[#034694] text-[10px] font-semibold transition-colors bg-white hover:bg-blue-50/30"
                              title="Assign this user to a club"
                            >
                              <Plus className="w-2.5 h-2.5" />
                              <span>Assign</span>
                            </button>
                          </div>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <Badge variant={u.isActive ? 'success' : 'destructive'}>
                            {u.isActive ? 'Active' : 'Disabled'}
                          </Badge>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openAssignModal(u)}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs"
                            >
                              <Building className="w-3 h-3 text-[#034694]" />
                              <span>Clubs ({userAssignments.length})</span>
                            </button>

                            {u.role !== 'SUPER_ADMIN' && (
                              <button
                                onClick={() => handleToggleStatus(u)}
                                disabled={actionLoading === u.id}
                                className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                                  u.isActive
                                    ? 'border-red-200 text-red-600 hover:bg-red-50'
                                    : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                                }`}
                              >
                                {actionLoading === u.id
                                  ? 'Updating...'
                                  : u.isActive
                                  ? 'Deactivate'
                                  : 'Activate'}
                              </button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal: Assign Club Admin to Club */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#034694] flex items-center justify-center">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Assign Club Admin</h3>
                  <p className="text-xs text-slate-500">Authorize user to manage a club and its events</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {assignError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{assignError}</span>
              </div>
            )}

            <form onSubmit={handleCreateAssignment} className="space-y-4 text-xs">
              {/* Select User */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">User Account *</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#034694]/20"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email}) — [{u.role}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Current Assignments of this selected user */}
              {activeSelectedUser && (
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-700 text-[11px] block">
                    Current Assigned Clubs ({activeSelectedUser.assignments?.length || 0})
                  </span>
                  {activeSelectedUser.assignments?.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {activeSelectedUser.assignments.map((a) => (
                        <span
                          key={a.id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs font-semibold shadow-2xs"
                        >
                          <Building className="w-3.5 h-3.5 text-[#034694]" />
                          <span>{a.club?.name || 'Club'}</span>
                          <button
                            type="button"
                            onClick={() => handleRevokeAssignment(a.id, activeSelectedUser.id)}
                            disabled={revokingId === a.id}
                            className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors"
                            title="Remove assignment"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">No clubs assigned yet.</p>
                  )}
                </div>
              )}

              {/* Select Club to Assign */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Assign to Club *</label>
                <select
                  value={selectedClubId}
                  onChange={(e) => setSelectedClubId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#034694]/20"
                >
                  {clubs.map((c) => {
                    const clubAdmins = getClubAdmins(c.id);
                    const isAlreadyAssigned = activeSelectedUser?.assignments?.some(
                      (a) => a.clubId === c.id || a.club?.id === c.id
                    );
                    const isFull = clubAdmins.length >= 2;
                    const adminNames = clubAdmins.map((a) => a.name).join(', ');

                    let statusText = '';
                    if (isAlreadyAssigned) {
                      statusText = '— (Already Assigned to This User)';
                    } else if (isFull) {
                      statusText = `— [FULL: 2/2 Admins (${adminNames})]`;
                    } else if (clubAdmins.length === 1) {
                      statusText = `— [1/2 Admins: ${adminNames}]`;
                    } else {
                      statusText = '— [0/2 Admins Available]';
                    }

                    return (
                      <option
                        key={c.id}
                        value={c.id}
                        disabled={isAlreadyAssigned || isFull}
                      >
                        {c.name} {statusText}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Selected Club Admin Quota Status Box */}
              {(() => {
                const selectedClub = clubs.find((c) => c.id === selectedClubId);
                const selectedClubAdmins = selectedClubId ? getClubAdmins(selectedClubId) : [];
                const isSelectedClubFull = selectedClubAdmins.length >= 2;
                const isUserAlreadyAssignedToSelectedClub = activeSelectedUser?.assignments?.some(
                  (a) => a.clubId === selectedClubId || a.club?.id === selectedClubId
                );

                if (!selectedClub) return null;

                return (
                  <div
                    className={`p-3 rounded-xl border text-xs space-y-1.5 transition-colors ${
                      isSelectedClubFull
                        ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                        : selectedClubAdmins.length === 1
                        ? 'bg-amber-50/60 border-amber-200 text-amber-900'
                        : 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-[11px]">
                      <span className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-[#034694]" />
                        <span>{selectedClub.name} Admin Quota</span>
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          isSelectedClubFull
                            ? 'bg-rose-200/80 text-rose-900'
                            : selectedClubAdmins.length === 1
                            ? 'bg-amber-200/80 text-amber-900'
                            : 'bg-emerald-200/80 text-emerald-900'
                        }`}
                      >
                        {selectedClubAdmins.length} / 2 Admins Assigned
                      </span>
                    </div>

                    {selectedClubAdmins.length > 0 ? (
                      <div className="text-[11px] text-slate-700">
                        <span className="font-semibold">Current Administrators: </span>
                        {selectedClubAdmins.map((a) => a.name).join(', ')}
                      </div>
                    ) : (
                      <p className="text-[11px] text-emerald-700 italic">
                        No administrators currently assigned. Both slots (2/2) are available.
                      </p>
                    )}

                    {isSelectedClubFull && (
                      <p className="text-[11px] text-rose-700 font-semibold pt-1 border-t border-rose-200/60">
                        Maximum quota reached. Each club can have at most 2 administrators. Please revoke an existing administrator before assigning a new one.
                      </p>
                    )}

                    {isUserAlreadyAssignedToSelectedClub && (
                      <p className="text-[11px] text-blue-700 font-semibold pt-1 border-t border-slate-200">
                        This user is already an assigned administrator of this club.
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Information Note */}
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/70 text-blue-900 text-[11px] leading-relaxed flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#034694] shrink-0 mt-0.5" />
                <span>
                  <strong>Campus Quota Policy:</strong> Each club is strictly restricted to a maximum of <strong>2 administrators</strong> (Student Secretary & Joint Secretary). Assigning a student automatically grants them <strong>Club Admin</strong> privileges.
                </span>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAssignModal(false)}
                  className="h-9 px-4 text-xs font-semibold"
                >
                  Done
                </Button>
                {(() => {
                  const selectedClubAdmins = selectedClubId ? getClubAdmins(selectedClubId) : [];
                  const isSelectedClubFull = selectedClubAdmins.length >= 2;
                  const isUserAlreadyAssigned = activeSelectedUser?.assignments?.some(
                    (a) => a.clubId === selectedClubId || a.club?.id === selectedClubId
                  );

                  return (
                    <Button
                      type="submit"
                      disabled={assigningLoading || isSelectedClubFull || isUserAlreadyAssigned}
                      className="bg-[#034694] hover:bg-[#02336d] text-white font-bold h-9 px-5 text-xs shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {assigningLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Assigning...
                        </>
                      ) : isSelectedClubFull ? (
                        'Club Full (2/2 Admins)'
                      ) : (
                        'Add Assignment'
                      )}
                    </Button>
                  );
                })()}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
