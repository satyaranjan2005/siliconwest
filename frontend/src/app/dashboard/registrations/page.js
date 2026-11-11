'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  BookmarkCheck,
  Search,
  Download,
  Loader2,
  Calendar,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Users,
  UserCheck,
  User,
  Shield,
  Filter,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  GraduationCap,
  Building2,
  Tag,
  Clock,
  Check,
  X,
  AlertCircle,
  Copy,
  Layers,
  MapPin,
  Sparkles,
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
import { eventsApi, registrationsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function DashboardRegistrationsPage() {
  const { user, isSuperAdmin, isClubAdmin } = useAuth();

  const [registrations, setRegistrations] = useState([]);
  const [eventsList, setEventsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'CONFIRMED' | 'CANCELLED'
  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL' | 'TEAM' | 'INDIVIDUAL'
  const [selectedEventId, setSelectedEventId] = useState('ALL'); // 'ALL' or specific event ID
  const [collapsedEvents, setCollapsedEvents] = useState({}); // eventId -> boolean
  const [selectedReg, setSelectedReg] = useState(null); // Selected registration for detail drawer
  const [updatingId, setUpdatingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [regsData, evsData] = await Promise.all([
        eventsApi.getDashboardRegistrations().catch(() => []),
        eventsApi.list({ allStatuses: 'true' }).catch(() => []),
      ]);

      setRegistrations(Array.isArray(regsData) ? regsData : []);
      setEventsList(Array.isArray(evsData) ? evsData : []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Toggle collapsing an event section
  const toggleCollapse = (eventId) => {
    setCollapsedEvents((prev) => ({
      ...prev,
      [eventId]: !prev[eventId],
    }));
  };

  const collapseAll = () => {
    const next = {};
    eventsWithRegistrations.forEach((e) => {
      next[e.id] = true;
    });
    setCollapsedEvents(next);
  };

  const expandAll = () => {
    setCollapsedEvents({});
  };

  // Status toggle handler
  const handleToggleStatus = async (reg, e) => {
    e?.stopPropagation();
    const newStatus = reg.status === 'CONFIRMED' ? 'CANCELLED' : 'CONFIRMED';
    setUpdatingId(reg.id);

    try {
      await registrationsApi.updateStatus(reg.id, newStatus);
      setRegistrations((prev) =>
        prev.map((r) => (r.id === reg.id ? { ...r, status: newStatus } : r))
      );
      if (selectedReg && selectedReg.id === reg.id) {
        setSelectedReg((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      alert(err.message || 'Failed to update registration status.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Helper: Calculate Academic Year from Graduating Batch (e.g. "2023 - 2027") or SIC (e.g. "23BTECH042")
  const calculateYearFromBatch = (batchStr, sicNo, fallbackYear) => {
    let startYear = null;
    if (batchStr) {
      const match = String(batchStr).match(/\b(20\d{2})\b/);
      if (match) startYear = parseInt(match[1], 10);
    }
    if (!startYear && sicNo) {
      const match = String(sicNo).trim().match(/^(\d{2})/);
      if (match) startYear = 2000 + parseInt(match[1], 10);
    }
    if (startYear) {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1; // 1-12
      const academicSessionStart = currentMonth >= 7 ? currentYear : currentYear - 1;
      const yearDiff = academicSessionStart - startYear + 1;

      if (yearDiff === 1) return '1st Year';
      if (yearDiff === 2) return '2nd Year';
      if (yearDiff === 3) return '3rd Year';
      if (yearDiff === 4) return '4th Year';
      if (yearDiff > 4) return `${yearDiff}th Year`;
      if (yearDiff <= 0) return 'Incoming';
    }
    return fallbackYear || 'N/A';
  };

  // Safe Google Forms-style Styled Colored Excel Sheet (.xls) / CSV export
  const handleExportCsv = (specificEventId = null, format = 'excel', teamFormat = 'roster') => {
    const listToExport = specificEventId
      ? filteredRegistrations.filter((r) => r.eventId === specificEventId || r.event?.id === specificEventId)
      : filteredRegistrations;

    if (listToExport.length === 0) return;

    const specificEvent = specificEventId ? eventsMap.get(specificEventId) : null;
    const isTeamEvent = specificEvent ? Boolean(specificEvent.isTeamEvent) : listToExport.some((r) => !!r.teamName);

    const sanitizeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      let str = String(val).replace(/"/g, '""');
      if (/^[=+\-@\t\r]/.test(str)) {
        str = "'" + str;
      }
      return `"${str}"`;
    };

    const escapeHtml = (str) => {
      if (str === null || str === undefined) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };

    // Formats date exactly like Google Forms timestamps: YYYY-MM-DD HH:mm:ss
    const formatTimestamp = (date) => {
      if (!date) return '';
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };

    const eventName = specificEventId
      ? (eventsMap.get(specificEventId)?.title || 'Event').replace(/[^a-z0-9]/gi, '_')
      : 'All_Events';

    // Helper to extract teammates roster
    const extractTeamMembers = (r) => {
      const members = [];
      if (Array.isArray(r.teamInvitations) && r.teamInvitations.length > 0) {
        r.teamInvitations.forEach((inv) => {
          const name = inv.inviteeName || 'Teammate';
          const email = inv.inviteeEmail || 'N/A';
          const sic = inv.invitee?.sicNo || (email.match(/^(\d{2}[a-zA-Z0-9]+)@/)?.[1]?.toUpperCase()) || 'N/A';
          const year = calculateYearFromBatch(inv.invitee?.batch, sic !== 'N/A' ? sic : null, null);
          const gender = inv.invitee?.gender || 'N/A';

          let dept = 'N/A';
          if (sic && sic !== 'N/A') {
            const match = sic.match(/^\d{2}([A-Za-z]+)/);
            if (match) {
              const code = match[1].toUpperCase();
              if (code.includes('CSE') || code.includes('CSN') || code.includes('BCSE')) dept = 'Computer Science & Engineering';
              else if (code.includes('ECE') || code.includes('BECE')) dept = 'Electronics & Communication';
              else if (code.includes('EEE') || code.includes('BEEE')) dept = 'Electrical & Electronics';
              else if (code.includes('MECH') || code.includes('BMECH')) dept = 'Mechanical Engineering';
              else if (code.includes('CIVIL') || code.includes('BCIVIL')) dept = 'Civil Engineering';
              else if (code.includes('IT') || code.includes('BIT')) dept = 'Information Technology';
              else dept = code;
            }
          }

          members.push({
            name,
            email,
            sic,
            phone: 'N/A',
            year,
            gender,
            dept,
            status: inv.status || 'ACCEPTED',
          });
        });
      } else if (Array.isArray(r.teamMembers) && r.teamMembers.length > 0) {
        r.teamMembers.forEach((m) => {
          if (typeof m === 'object' && m !== null) {
            const name = m.name || m.fullName || 'Teammate';
            const email = m.email || 'N/A';
            const sic = m.sic || m.sicNo || (email.match(/^(\d{2}[a-zA-Z0-9]+)@/)?.[1]?.toUpperCase()) || 'N/A';
            const year = calculateYearFromBatch(m.batch, sic !== 'N/A' ? sic : null, m.year);
            const gender = m.gender || 'N/A';
            const dept = m.branch || m.department || 'N/A';
            members.push({
              name,
              email,
              sic,
              phone: m.phone || 'N/A',
              year,
              gender,
              dept,
              status: m.status || 'CONFIRMED',
            });
          } else if (typeof m === 'string') {
            members.push({
              name: m,
              email: 'N/A',
              sic: 'N/A',
              phone: 'N/A',
              year: 'N/A',
              gender: 'N/A',
              dept: 'N/A',
              status: 'CONFIRMED',
            });
          }
        });
      }
      return members;
    };

    let maxTeammates = 0;
    if (isTeamEvent) {
      listToExport.forEach((r) => {
        const mems = extractTeamMembers(r);
        if (mems.length > maxTeammates) maxTeammates = mems.length;
      });
    }

    // =========================================================================
    // 1. Export as Plain CSV
    // =========================================================================
    if (format === 'csv') {
      let csvHeaders = [];
      const csvRows = [];

      if (!isTeamEvent) {
        // Individual Event CSV: 8 exact requested columns
        csvHeaders = ['Timestamp', 'Name', 'SIC', 'Email', 'Phone No', 'Year', 'Gender', 'Department'];
        listToExport.forEach((r) => {
          const sic = r.rollNumber || r.participantUser?.sicNo || 'N/A';
          const batch = r.participantUser?.batch;
          const year = calculateYearFromBatch(batch, sic, r.year);
          const gender = r.participantUser?.gender || 'N/A';
          const dept = r.branch || 'N/A';
          csvRows.push([
            sanitizeCsv(formatTimestamp(r.registeredAt)),
            sanitizeCsv(r.participantName),
            sanitizeCsv(sic),
            sanitizeCsv(r.participantEmail),
            sanitizeCsv(r.phone || 'N/A'),
            sanitizeCsv(year),
            sanitizeCsv(gender),
            sanitizeCsv(dept),
          ].join(','));
        });
      } else if (teamFormat === 'columns') {
        // Team Event CSV: Wide Columns per Member (Google Forms style)
        csvHeaders = [
          'Timestamp', 'Team Name', 'Team Size',
          'Leader Name', 'Leader SIC', 'Leader Email', 'Leader Phone No', 'Leader Year', 'Leader Gender', 'Leader Department'
        ];
        for (let m = 2; m <= maxTeammates + 1; m++) {
          csvHeaders.push(
            `Member ${m} Name`, `Member ${m} SIC`, `Member ${m} Email`,
            `Member ${m} Phone No`, `Member ${m} Year`, `Member ${m} Gender`, `Member ${m} Department`
          );
        }
        csvHeaders.push('Status');

        listToExport.forEach((r) => {
          const sic = r.rollNumber || r.participantUser?.sicNo || 'N/A';
          const batch = r.participantUser?.batch;
          const year = calculateYearFromBatch(batch, sic, r.year);
          const gender = r.participantUser?.gender || 'N/A';
          const dept = r.branch || 'N/A';
          const teammates = extractTeamMembers(r);
          const teamSize = 1 + teammates.length;

          const row = [
            sanitizeCsv(formatTimestamp(r.registeredAt)),
            sanitizeCsv(r.teamName || 'Team'),
            sanitizeCsv(teamSize),
            sanitizeCsv(r.participantName),
            sanitizeCsv(sic),
            sanitizeCsv(r.participantEmail),
            sanitizeCsv(r.phone || 'N/A'),
            sanitizeCsv(year),
            sanitizeCsv(gender),
            sanitizeCsv(dept),
          ];

          for (let i = 0; i < maxTeammates; i++) {
            const member = teammates[i];
            if (member) {
              row.push(
                sanitizeCsv(member.name),
                sanitizeCsv(member.sic),
                sanitizeCsv(member.email),
                sanitizeCsv(member.phone),
                sanitizeCsv(member.year),
                sanitizeCsv(member.gender),
                sanitizeCsv(member.dept)
              );
            } else {
              row.push('""', '""', '""', '""', '""', '""', '""');
            }
          }

          row.push(sanitizeCsv(r.status));
          csvRows.push(row.join(','));
        });
      } else {
        // Team Event CSV: Roster Format (1 Row per Participant) - Recommended
        csvHeaders = [
          'Timestamp', 'Team Name', 'Role', 'Participant Name', 'SIC',
          'Email', 'Phone No', 'Year', 'Gender', 'Department', 'Team Size', 'Status'
        ];

        listToExport.forEach((r) => {
          const sic = r.rollNumber || r.participantUser?.sicNo || 'N/A';
          const batch = r.participantUser?.batch;
          const year = calculateYearFromBatch(batch, sic, r.year);
          const gender = r.participantUser?.gender || 'N/A';
          const dept = r.branch || 'N/A';
          const teammates = extractTeamMembers(r);
          const teamSize = 1 + teammates.length;

          // Leader
          csvRows.push([
            sanitizeCsv(formatTimestamp(r.registeredAt)),
            sanitizeCsv(r.teamName || 'Team'),
            sanitizeCsv('Team Leader'),
            sanitizeCsv(r.participantName),
            sanitizeCsv(sic),
            sanitizeCsv(r.participantEmail),
            sanitizeCsv(r.phone || 'N/A'),
            sanitizeCsv(year),
            sanitizeCsv(gender),
            sanitizeCsv(dept),
            sanitizeCsv(teamSize),
            sanitizeCsv(r.status),
          ].join(','));

          // Members
          teammates.forEach((m, mIdx) => {
            csvRows.push([
              sanitizeCsv(formatTimestamp(r.registeredAt)),
              sanitizeCsv(r.teamName || 'Team'),
              sanitizeCsv(`Member ${mIdx + 2}`),
              sanitizeCsv(m.name),
              sanitizeCsv(m.sic),
              sanitizeCsv(m.email),
              sanitizeCsv(m.phone),
              sanitizeCsv(m.year),
              sanitizeCsv(m.gender),
              sanitizeCsv(m.dept !== 'N/A' ? m.dept : dept),
              sanitizeCsv(teamSize),
              sanitizeCsv(m.status),
            ].join(','));
          });
        });
      }

      const csvContent = '\uFEFF' + [csvHeaders.join(','), ...csvRows].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${eventName}_${isTeamEvent ? (teamFormat === 'columns' ? 'TeamResponses' : 'TeamRoster') : 'Responses'}_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return;
    }

    // =========================================================================
    // 2. Export as Styled Colored Excel Sheet (.xls with Office XML & CSS)
    // =========================================================================
    let excelHeaders = [];
    let excelRowsHtml = '';
    let totalParticipantsCount = 0;

    if (!isTeamEvent) {
      // Individual Event: 8 exact requested columns
      excelHeaders = ['Timestamp', 'Name', 'SIC', 'Email', 'Phone No', 'Year', 'Gender', 'Department'];
      totalParticipantsCount = listToExport.length;

      excelRowsHtml = listToExport.map((r, index) => {
        const isEven = index % 2 === 0;
        const rowClass = isEven ? 'row-even' : 'row-odd';
        const sic = r.rollNumber || r.participantUser?.sicNo || 'N/A';
        const batch = r.participantUser?.batch;
        const year = calculateYearFromBatch(batch, sic, r.year);
        const gender = r.participantUser?.gender || 'N/A';
        const dept = r.branch || 'N/A';

        return `
          <tr class="${rowClass}">
            <td class="col-timestamp">${escapeHtml(formatTimestamp(r.registeredAt))}</td>
            <td class="col-name">${escapeHtml(r.participantName)}</td>
            <td class="col-sic">${escapeHtml(sic)}</td>
            <td class="col-email">${escapeHtml(r.participantEmail)}</td>
            <td class="col-phone">${escapeHtml(r.phone || 'N/A')}</td>
            <td class="col-year">${escapeHtml(year)}</td>
            <td class="col-gender">${escapeHtml(gender)}</td>
            <td class="col-dept">${escapeHtml(dept)}</td>
          </tr>
        `;
      }).join('\n');

    } else if (teamFormat === 'columns') {
      // Team Event: Columns-per-member (Google Forms style)
      excelHeaders = [
        'Timestamp', 'Team Name', 'Team Size',
        'Leader Name', 'Leader SIC', 'Leader Email', 'Leader Phone No', 'Leader Year', 'Leader Gender', 'Leader Department'
      ];
      for (let m = 2; m <= maxTeammates + 1; m++) {
        excelHeaders.push(
          `Member ${m} Name`, `Member ${m} SIC`, `Member ${m} Email`,
          `Member ${m} Phone No`, `Member ${m} Year`, `Member ${m} Gender`, `Member ${m} Department`
        );
      }
      excelHeaders.push('Status');

      let participantsTally = 0;
      excelRowsHtml = listToExport.map((r, index) => {
        const isEven = index % 2 === 0;
        const rowClass = isEven ? 'row-even' : 'row-odd';
        const sic = r.rollNumber || r.participantUser?.sicNo || 'N/A';
        const batch = r.participantUser?.batch;
        const year = calculateYearFromBatch(batch, sic, r.year);
        const gender = r.participantUser?.gender || 'N/A';
        const dept = r.branch || 'N/A';
        const teammates = extractTeamMembers(r);
        const teamSize = 1 + teammates.length;
        participantsTally += teamSize;

        let memberCellsHtml = '';
        for (let i = 0; i < maxTeammates; i++) {
          const m = teammates[i];
          if (m) {
            memberCellsHtml += `
              <td class="col-name">${escapeHtml(m.name)}</td>
              <td class="col-sic">${escapeHtml(m.sic)}</td>
              <td class="col-email">${escapeHtml(m.email)}</td>
              <td class="col-phone">${escapeHtml(m.phone)}</td>
              <td class="col-year">${escapeHtml(m.year)}</td>
              <td class="col-gender">${escapeHtml(m.gender)}</td>
              <td class="col-dept">${escapeHtml(m.dept)}</td>
            `;
          } else {
            memberCellsHtml += `
              <td style="color:#cbd5e1; text-align:center;">-</td>
              <td style="color:#cbd5e1; text-align:center;">-</td>
              <td style="color:#cbd5e1; text-align:center;">-</td>
              <td style="color:#cbd5e1; text-align:center;">-</td>
              <td style="color:#cbd5e1; text-align:center;">-</td>
              <td style="color:#cbd5e1; text-align:center;">-</td>
              <td style="color:#cbd5e1; text-align:center;">-</td>
            `;
          }
        }

        return `
          <tr class="${rowClass}">
            <td class="col-timestamp">${escapeHtml(formatTimestamp(r.registeredAt))}</td>
            <td class="col-team">${escapeHtml(r.teamName || 'Team')}</td>
            <td style="text-align: center; font-weight: bold; color: #4338ca;">${teamSize}</td>
            <td class="col-name">${escapeHtml(r.participantName)}</td>
            <td class="col-sic">${escapeHtml(sic)}</td>
            <td class="col-email">${escapeHtml(r.participantEmail)}</td>
            <td class="col-phone">${escapeHtml(r.phone || 'N/A')}</td>
            <td class="col-year">${escapeHtml(year)}</td>
            <td class="col-gender">${escapeHtml(gender)}</td>
            <td class="col-dept">${escapeHtml(dept)}</td>
            ${memberCellsHtml}
            <td style="text-align: center; font-weight: 600; color: #047857;">${escapeHtml(r.status)}</td>
          </tr>
        `;
      }).join('\n');

      totalParticipantsCount = participantsTally;

    } else {
      // Team Event: Roster Format (1 Row per Participant) - Recommended
      excelHeaders = [
        'Timestamp', 'Team Name', 'Role', 'Participant Name', 'SIC',
        'Email', 'Phone No', 'Year', 'Gender', 'Department', 'Team Size', 'Status'
      ];

      const rowsList = [];
      let participantsTally = 0;

      listToExport.forEach((r, teamIndex) => {
        const isTeamEven = teamIndex % 2 === 0;
        const teamBaseClass = isTeamEven ? 'team-even' : 'team-odd';

        const sic = r.rollNumber || r.participantUser?.sicNo || 'N/A';
        const batch = r.participantUser?.batch;
        const year = calculateYearFromBatch(batch, sic, r.year);
        const gender = r.participantUser?.gender || 'N/A';
        const dept = r.branch || 'N/A';
        const teammates = extractTeamMembers(r);
        const teamSize = 1 + teammates.length;
        participantsTally += teamSize;

        // Leader Row
        rowsList.push(`
          <tr class="${teamBaseClass} team-leader-row">
            <td class="col-timestamp">${escapeHtml(formatTimestamp(r.registeredAt))}</td>
            <td class="col-team">${escapeHtml(r.teamName || 'Team')}</td>
            <td style="text-align: center;"><span class="badge-leader">Team Leader</span></td>
            <td class="col-name">${escapeHtml(r.participantName)}</td>
            <td class="col-sic">${escapeHtml(sic)}</td>
            <td class="col-email">${escapeHtml(r.participantEmail)}</td>
            <td class="col-phone">${escapeHtml(r.phone || 'N/A')}</td>
            <td class="col-year">${escapeHtml(year)}</td>
            <td class="col-gender">${escapeHtml(gender)}</td>
            <td class="col-dept">${escapeHtml(dept)}</td>
            <td style="text-align: center; font-weight: bold; color: #4338ca;">${teamSize}</td>
            <td style="text-align: center; font-weight: 600; color: #047857;">${escapeHtml(r.status)}</td>
          </tr>
        `);

        // Teammates Rows
        teammates.forEach((m, mIdx) => {
          rowsList.push(`
            <tr class="${teamBaseClass} team-member-row">
              <td class="col-timestamp" style="color: #94a3b8;">${escapeHtml(formatTimestamp(r.registeredAt))}</td>
              <td class="col-team-muted">${escapeHtml(r.teamName || 'Team')}</td>
              <td style="text-align: center;"><span class="badge-member">Member ${mIdx + 2}</span></td>
              <td class="col-name">${escapeHtml(m.name)}</td>
              <td class="col-sic">${escapeHtml(m.sic)}</td>
              <td class="col-email">${escapeHtml(m.email)}</td>
              <td class="col-phone">${escapeHtml(m.phone)}</td>
              <td class="col-year">${escapeHtml(m.year)}</td>
              <td class="col-gender">${escapeHtml(m.gender)}</td>
              <td class="col-dept">${escapeHtml(m.dept !== 'N/A' ? m.dept : dept)}</td>
              <td style="text-align: center; color: #64748b;">${teamSize}</td>
              <td style="text-align: center; font-weight: 600; color: #0284c7;">${escapeHtml(m.status)}</td>
            </tr>
          `);
        });
      });

      excelRowsHtml = rowsList.join('\n');
      totalParticipantsCount = participantsTally;
    }

    const eventTitleDisplay = specificEvent ? specificEvent.title : 'Silicon West Campus Events';
    const societyDisplay = specificEvent?.club?.name || 'Silicon West';

    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Responses</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                  <x:Selected/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; }
          table { border-collapse: collapse; width: 100%; }
          .banner-title {
            background-color: #034694;
            color: #ffffff;
            font-size: 14pt;
            font-weight: bold;
            padding: 12px 14px;
            text-align: left;
            border: 1px solid #022b5c;
          }
          .banner-meta {
            background-color: #f8fafc;
            color: #475569;
            font-size: 9.5pt;
            padding: 8px 14px;
            border-bottom: 2px solid #cbd5e1;
          }
          th {
            background-color: #034694;
            color: #ffffff;
            font-size: 10.5pt;
            font-weight: bold;
            padding: 9px 12px;
            text-align: center;
            border: 1px solid #022b5c;
            white-space: nowrap;
          }
          td {
            font-size: 9.5pt;
            color: #1e293b;
            padding: 7px 11px;
            border: 1px solid #cbd5e1;
            vertical-align: middle;
            mso-number-format: "\\@";
          }
          .row-even td { background-color: #f8fafc; }
          .row-odd td { background-color: #ffffff; }

          .team-even td { background-color: #ffffff; }
          .team-odd td { background-color: #f8fafc; }
          .team-leader-row td { border-top: 2px solid #034694 !important; }
          .team-member-row td { border-top: 1px dashed #e2e8f0; }

          .col-timestamp { text-align: center; color: #64748b; font-family: 'Consolas', monospace; font-size: 9pt; }
          .col-name { font-weight: 600; color: #0f172a; text-align: left; }
          .col-sic { text-align: center; font-family: 'Consolas', monospace; font-weight: 700; color: #034694; background-color: #eff6ff !important; }
          .col-email { color: #0369a1; text-align: left; }
          .col-phone { text-align: center; color: #334155; }
          .col-year { text-align: center; font-weight: 700; color: #047857; background-color: #ecfdf5 !important; }
          .col-gender { text-align: center; font-weight: 500; color: #475569; }
          .col-dept { text-align: left; color: #1e293b; }
          .col-team { text-align: left; color: #034694; font-weight: bold; font-size: 10pt; }
          .col-team-muted { text-align: left; color: #64748b; font-size: 8.5pt; }

          .badge-leader {
            background-color: #ede9fe;
            color: #5b21b6;
            font-weight: bold;
            font-size: 8.5pt;
            padding: 3px 8px;
            border: 1px solid #c4b5fd;
            border-radius: 4px;
            display: inline-block;
          }
          .badge-member {
            background-color: #f1f5f9;
            color: #334155;
            font-weight: 600;
            font-size: 8.5pt;
            padding: 2px 7px;
            border: 1px solid #cbd5e1;
            border-radius: 4px;
            display: inline-block;
          }
        </style>
      </head>
      <body>
        <table>
          <tr>
            <td colspan="${excelHeaders.length}" class="banner-title">
              SILICON WEST &bull; ${escapeHtml(eventTitleDisplay)} &mdash; ${isTeamEvent ? (teamFormat === 'columns' ? 'Team Form Responses' : 'Team Roster Sheet') : 'Participant Responses'}
            </td>
          </tr>
          <tr>
            <td colspan="${excelHeaders.length}" class="banner-meta">
              Exported: ${formatTimestamp(new Date())} &bull; Total Entries: ${listToExport.length} ${isTeamEvent ? `Teams (${totalParticipantsCount} Total Participants)` : 'Registrations'} &bull; Organizing Society: ${escapeHtml(societyDisplay)}
            </td>
          </tr>
          <tr><td colspan="${excelHeaders.length}" style="height: 10px; border: none; background: #ffffff;"></td></tr>
          <thead>
            <tr>
              ${excelHeaders.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${excelRowsHtml}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${eventName}_${isTeamEvent ? (teamFormat === 'columns' ? 'TeamResponses' : 'TeamRoster') : 'Responses'}_${Date.now()}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Copy helper
  const handleCopy = (text, id, e) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Build a consolidated map of events
  const eventsMap = useMemo(() => {
    const map = new Map();
    // 1. Add all from eventsList
    eventsList.forEach((e) => {
      map.set(e.id, {
        ...e,
        registrations: [],
      });
    });

    // 2. Add any events referenced in registrations that might not be in eventsList
    registrations.forEach((r) => {
      if (r.event && !map.has(r.event.id)) {
        map.set(r.event.id, {
          id: r.event.id,
          title: r.event.title,
          slug: r.event.slug,
          startsAt: r.event.startsAt,
          venue: r.event.venue,
          category: r.event.category,
          club: r.event.club,
          capacity: null,
          registrations: [],
        });
      }
    });

    return map;
  }, [eventsList, registrations]);

  // Global filtered registrations
  const filteredRegistrations = useMemo(() => {
    return registrations.filter((r) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.participantName?.toLowerCase().includes(q) ||
        r.participantEmail?.toLowerCase().includes(q) ||
        r.teamName?.toLowerCase().includes(q) ||
        r.event?.title?.toLowerCase().includes(q) ||
        r.rollNumber?.toLowerCase().includes(q) ||
        r.branch?.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
      const matchesType =
        typeFilter === 'ALL' ||
        (typeFilter === 'TEAM' && !!r.teamName) ||
        (typeFilter === 'INDIVIDUAL' && !r.teamName);

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [registrations, search, statusFilter, typeFilter]);

  // Group filtered registrations by event
  const eventsWithRegistrations = useMemo(() => {
    // Clone map so we don't mutate
    const groupedMap = new Map();

    eventsMap.forEach((eventObj, id) => {
      groupedMap.set(id, {
        ...eventObj,
        registrations: [],
      });
    });

    // Distribute matching registrations into event buckets
    filteredRegistrations.forEach((r) => {
      const evId = r.eventId || r.event?.id;
      if (evId && groupedMap.has(evId)) {
        groupedMap.get(evId).registrations.push(r);
      } else if (evId) {
        groupedMap.set(evId, {
          id: evId,
          title: r.event?.title || 'Unknown Event',
          slug: r.event?.slug || '',
          startsAt: r.event?.startsAt,
          venue: r.event?.venue,
          club: r.event?.club,
          registrations: [r],
        });
      }
    });

    let result = Array.from(groupedMap.values());

    // If searching, hide events with 0 matching registrations
    if (search.trim().length > 0 || statusFilter !== 'ALL' || typeFilter !== 'ALL') {
      result = result.filter((e) => e.registrations.length > 0);
    } else {
      // Sort events: events with registrations first, then by date descending
      result.sort((a, b) => {
        if (b.registrations.length !== a.registrations.length) {
          return b.registrations.length - a.registrations.length;
        }
        return new Date(b.startsAt || 0) - new Date(a.startsAt || 0);
      });
    }

    // Apply selected event filter if not ALL
    if (selectedEventId !== 'ALL') {
      result = result.filter((e) => e.id === selectedEventId);
    }

    return result;
  }, [eventsMap, filteredRegistrations, search, statusFilter, typeFilter, selectedEventId]);

  // Aggregate Metrics across the entire system
  const metrics = useMemo(() => {
    const total = registrations.length;
    const confirmed = registrations.filter((r) => r.status === 'CONFIRMED').length;
    const cancelled = registrations.filter((r) => r.status === 'CANCELLED').length;
    const teams = registrations.filter((r) => !!r.teamName).length;
    const activeEventsCount = new Set(registrations.map((r) => r.eventId || r.event?.id)).size;
    return { total, confirmed, cancelled, teams, activeEventsCount };
  }, [registrations]);

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Event-Wise Registrations
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                isSuperAdmin
                  ? 'bg-purple-50 border border-purple-200 text-purple-700'
                  : 'bg-blue-50 border border-blue-200 text-[#034694]'
              }`}
            >
              {isSuperAdmin ? 'Super Admin' : 'Club Admin'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Browse and manage student rosters grouped event-by-event with Silicon ID verification and team structures.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-xs disabled:opacity-50"
            title="Refresh Registrations"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#034694]' : 'text-slate-500'}`} />
            <span>Refresh</span>
          </button>

          <div className="flex items-center gap-1.5">
            <Button
              onClick={() => handleExportCsv(selectedEventId !== 'ALL' ? selectedEventId : null, 'excel', 'roster')}
              disabled={filteredRegistrations.length === 0}
              className="bg-[#034694] hover:bg-[#02336e] text-white font-bold text-xs h-9 px-3.5 rounded-xl flex items-center gap-2 shadow-xs shrink-0"
              title="Export clean tabular Excel Sheet (1 Row per Participant)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>
                {selectedEventId !== 'ALL' ? 'Export Responses (Excel)' : 'Export All Responses (Excel)'}
              </span>
            </Button>
            <button
              onClick={() => handleExportCsv(selectedEventId !== 'ALL' ? selectedEventId : null, 'excel', 'columns')}
              disabled={filteredRegistrations.length === 0}
              className="h-9 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1 shadow-xs transition-colors shrink-0 disabled:opacity-50"
              title="Export wide Google Forms layout with separate Member columns"
            >
              <span>Columns View</span>
            </button>
            <button
              onClick={() => handleExportCsv(selectedEventId !== 'ALL' ? selectedEventId : null, 'csv', 'roster')}
              disabled={filteredRegistrations.length === 0}
              className="h-9 px-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-semibold text-xs flex items-center shadow-xs transition-colors shrink-0 disabled:opacity-50"
              title="Export plain CSV"
            >
              <span>CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Signups
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#034694] flex items-center justify-center">
              <BookmarkCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{metrics.total}</span>
            <span className="text-[11px] font-medium text-slate-400">across {metrics.activeEventsCount} events</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Confirmed
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600">{metrics.confirmed}</span>
            <span className="text-[11px] font-medium text-slate-400">
              {metrics.total > 0 ? `${Math.round((metrics.confirmed / metrics.total) * 100)}% active` : '0%'}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Team Entries
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-600">{metrics.teams}</span>
            <span className="text-[11px] font-medium text-slate-400">teams formed</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Events With Signups
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600">{metrics.activeEventsCount}</span>
            <span className="text-[11px] font-medium text-slate-400">of {eventsList.length} campus events</span>
          </div>
        </div>
      </div>

      {/* Event Selection Bar (Horizontal Pills) */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#034694]" />
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Select Event to View
            </span>
          </div>

          <div className="flex items-center gap-3">
            {selectedEventId === 'ALL' && (
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={expandAll}
                  className="text-slate-500 hover:text-[#034694] font-medium transition-colors"
                >
                  Expand All
                </button>
                <span className="text-slate-300">|</span>
                <button
                  onClick={collapseAll}
                  className="text-slate-500 hover:text-[#034694] font-medium transition-colors"
                >
                  Collapse All
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Scrollable event pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
          <button
            onClick={() => setSelectedEventId('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-2 ${
              selectedEventId === 'ALL'
                ? 'bg-[#034694] text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>All Events (Grouped)</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              selectedEventId === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {registrations.length}
            </span>
          </button>

          {Array.from(eventsMap.values())
            .filter((e) => {
              const count = registrations.filter((r) => (r.eventId || r.event?.id) === e.id).length;
              return count > 0 || isSuperAdmin;
            })
            .map((ev) => {
              const count = registrations.filter((r) => (r.eventId || r.event?.id) === ev.id).length;
              const isSelected = selectedEventId === ev.id;

              return (
                <button
                  key={ev.id}
                  onClick={() => setSelectedEventId(ev.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'bg-[#034694] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span className="max-w-[180px] truncate">{ev.title}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : count > 0
                        ? 'bg-blue-100 text-[#034694] font-bold'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 pt-3 border-t border-slate-100">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search participant name, Silicon ID, roll number, or team name..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#034694]/20 transition-all placeholder:text-slate-400"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
              {['ALL', 'CONFIRMED', 'CANCELLED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                    statusFilter === st
                      ? 'bg-white shadow-xs text-[#034694]'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {st === 'ALL' ? 'All Status' : st === 'CONFIRMED' ? 'Confirmed' : 'Cancelled'}
                </button>
              ))}
            </div>

            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
              {['ALL', 'TEAM', 'INDIVIDUAL'].map((tp) => (
                <button
                  key={tp}
                  onClick={() => setTypeFilter(tp)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                    typeFilter === tp
                      ? 'bg-white shadow-xs text-slate-900'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {tp === 'ALL' ? 'All' : tp === 'TEAM' ? 'Team' : 'Solo'}
                </button>
              ))}
            </div>

            {(search || statusFilter !== 'ALL' || typeFilter !== 'ALL' || selectedEventId !== 'ALL') && (
              <button
                onClick={() => {
                  setSearch('');
                  setStatusFilter('ALL');
                  setTypeFilter('ALL');
                  setSelectedEventId('ALL');
                }}
                className="text-xs font-semibold text-[#034694] hover:underline px-2"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* EVENT-WISE ACCORDION / ROSTER CARDS */}
      {loading ? (
        <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#034694]" />
          <p className="text-xs font-semibold text-slate-500">Loading event-wise rosters...</p>
        </div>
      ) : eventsWithRegistrations.length === 0 ? (
        <Card className="py-20 text-center space-y-3 border-slate-200">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <BookmarkCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">No events matching your search or filter</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Try resetting your filters or search terms.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {eventsWithRegistrations.map((ev) => {
            const isCollapsed = selectedEventId === 'ALL' && !!collapsedEvents[ev.id];
            const eventRegs = ev.registrations || [];
            const confirmedCount = eventRegs.filter((r) => r.status === 'CONFIRMED').length;
            const cancelledCount = eventRegs.filter((r) => r.status === 'CANCELLED').length;
            const teamCount = eventRegs.filter((r) => !!r.teamName).length;
            const soloCount = eventRegs.length - teamCount;

            return (
              <div
                key={ev.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-all"
              >
                {/* Event Section Header */}
                <div
                  onClick={() => selectedEventId === 'ALL' && toggleCollapse(ev.id)}
                  className={`p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                    selectedEventId === 'ALL' ? 'cursor-pointer hover:bg-slate-50/70' : ''
                  } ${isCollapsed ? 'bg-slate-50/40' : 'bg-slate-50/80 border-b border-slate-200'}`}
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-[#034694] uppercase tracking-wider">
                        {ev.category || 'Event'}
                      </span>
                      {ev.club?.name && (
                        <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span>{ev.club.name}</span>
                        </span>
                      )}
                      {ev.venue && (
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{ev.venue}</span>
                        </span>
                      )}
                      {ev.startsAt && (
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{new Date(ev.startsAt).toLocaleDateString()}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900 truncate">
                        {ev.title}
                      </h2>
                      {ev.slug && (
                        <Link
                          href={`/events/${ev.slug}`}
                          target="_blank"
                          onClick={(e) => e.stopPropagation()}
                          className="text-slate-400 hover:text-[#034694] transition-colors p-0.5"
                          title="Open public event page"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Right Header Stats & Actions */}
                  <div className="flex flex-wrap items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {/* Badge counters */}
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-900 shadow-2xs">
                        <BookmarkCheck className="w-3.5 h-3.5 text-[#034694]" />
                        <span>{eventRegs.length} Total</span>
                      </span>

                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{confirmedCount} Confirmed</span>
                      </span>

                      {teamCount > 0 && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-700">
                          <Users className="w-3 h-3 text-indigo-600" />
                          <span>{teamCount} Teams</span>
                        </span>
                      )}

                      {ev.capacity && (
                        <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                          Cap: {ev.capacity}
                        </span>
                      )}
                    </div>

                    {/* Download Event Excel Sheet buttons */}
                    {ev.isTeamEvent || teamCount > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleExportCsv(ev.id, 'excel', 'roster')}
                          disabled={eventRegs.length === 0}
                          className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition-colors disabled:opacity-40"
                          title="Export Team Roster (1 Row per Participant)"
                        >
                          <Download className="w-3 h-3 text-indigo-600" />
                          <span>Export Roster</span>
                        </button>
                        <button
                          onClick={() => handleExportCsv(ev.id, 'excel', 'columns')}
                          disabled={eventRegs.length === 0}
                          className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors disabled:opacity-40"
                          title="Export Google Forms style (Columns per Member)"
                        >
                          <span>Columns</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleExportCsv(ev.id, 'excel', 'roster')}
                        disabled={eventRegs.length === 0}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors disabled:opacity-40"
                        title="Export Google Forms style colored Excel sheet"
                      >
                        <Download className="w-3 h-3 text-slate-500" />
                        <span>Export Excel</span>
                      </button>
                    )}

                    {/* Accordion toggle arrow */}
                    {selectedEventId === 'ALL' && (
                      <button
                        onClick={() => toggleCollapse(ev.id)}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                      >
                        {isCollapsed ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronUp className="w-5 h-5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Event Attendees Roster */}
                {!isCollapsed && (
                  <div>
                    {eventRegs.length === 0 ? (
                      <div className="py-12 text-center space-y-2">
                        <p className="text-xs font-semibold text-slate-500">
                          No student registrations found for this event yet.
                        </p>
                        {ev.slug && (
                          <Link
                            href={`/events/${ev.slug}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-xs font-medium text-[#034694] hover:underline"
                          >
                            <span>Share event registration page</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50/60 border-b border-slate-100 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                              <th className="py-2.5 px-4">#</th>
                              <th className="py-2.5 px-4">Participant & Silicon ID</th>
                              <th className="py-2.5 px-4">Participation Mode</th>
                              <th className="py-2.5 px-4">Academic Credentials</th>
                              <th className="py-2.5 px-4">Registered At</th>
                              <th className="py-2.5 px-4 text-center">Status</th>
                              <th className="py-2.5 px-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-xs">
                            {eventRegs.map((r, idx) => {
                              const isTeam = !!r.teamName;
                              const invitations = Array.isArray(r.teamInvitations) ? r.teamInvitations : [];
                              const initials = (r.participantName || 'SW')
                                .split(' ')
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join('')
                                .toUpperCase();

                              return (
                                <tr
                                  key={r.id}
                                  onClick={() => setSelectedReg(r)}
                                  className={`hover:bg-blue-50/30 transition-colors cursor-pointer ${
                                    selectedReg?.id === r.id ? 'bg-blue-50/60' : ''
                                  }`}
                                >
                                  {/* Row index */}
                                  <td className="py-3 px-4 font-mono text-[11px] text-slate-400 w-10">
                                    {idx + 1}
                                  </td>

                                  {/* 1. Participant */}
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#034694] to-[#022c5e] text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-2xs">
                                        {initials}
                                      </div>
                                      <div className="min-w-0">
                                        <div className="font-bold text-slate-900 leading-snug flex items-center gap-1.5 truncate">
                                          <span>{r.participantName}</span>
                                          <span
                                            className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-[#034694] border border-blue-200 shrink-0"
                                            title="Silicon West Verified Student"
                                          >
                                            Silicon ID
                                          </span>
                                        </div>
                                        <div className="text-[11px] text-slate-500 font-mono truncate">
                                          {r.participantEmail}
                                        </div>
                                        {r.phone && (
                                          <div className="text-[10px] text-slate-400 mt-0.5">
                                            📞 {r.phone}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </td>

                                  {/* 2. Participation Mode & Team */}
                                  <td className="py-3 px-4">
                                    {isTeam ? (
                                      <div className="space-y-1">
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold text-[11px]">
                                          <Users className="w-3 h-3 text-indigo-600 shrink-0" />
                                          <span className="truncate max-w-[140px]">{r.teamName}</span>
                                        </div>
                                        <div className="text-[10px] text-slate-400 block">
                                          {1 + invitations.length} members ({invitations.filter((i) => i.status === 'ACCEPTED').length + 1} confirmed)
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 font-medium bg-slate-100 px-2 py-0.5 rounded">
                                        <User className="w-3 h-3 text-slate-400" />
                                        Solo
                                      </span>
                                    )}
                                  </td>

                                  {/* 3. Credentials */}
                                  <td className="py-3 px-4">
                                    <div className="space-y-0.5">
                                      <div className="font-mono font-bold text-slate-800 text-[11px]">
                                        {r.rollNumber || 'No Roll #'}
                                      </div>
                                      <div className="text-[11px] text-slate-500 truncate max-w-[150px]" title={r.branch}>
                                        {r.branch || 'B.Tech CSE'} {r.year ? `(${r.year})` : ''}
                                      </div>
                                    </div>
                                  </td>

                                  {/* 4. Date */}
                                  <td className="py-3 px-4 text-slate-600">
                                    <div>{new Date(r.registeredAt).toLocaleDateString()}</div>
                                    <div className="text-[10px] text-slate-400 font-mono">
                                      {new Date(r.registeredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                  </td>

                                  {/* 5. Status */}
                                  <td className="py-3 px-4 text-center">
                                    <span
                                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                        r.status === 'CONFIRMED'
                                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                                      }`}
                                    >
                                      {r.status === 'CONFIRMED' ? (
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      ) : (
                                        <XCircle className="w-3 h-3 text-rose-600" />
                                      )}
                                      {r.status}
                                    </span>
                                  </td>

                                  {/* 6. Actions */}
                                  <td className="py-3 px-4 text-right">
                                    <div className="inline-flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                      <button
                                        onClick={(e) => handleToggleStatus(r, e)}
                                        disabled={updatingId === r.id}
                                        className={`text-[11px] font-semibold px-2 py-1 rounded border transition-colors ${
                                          r.status === 'CONFIRMED'
                                            ? 'text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200'
                                            : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200'
                                        }`}
                                        title={r.status === 'CONFIRMED' ? 'Cancel this registration' : 'Reactivate registration'}
                                      >
                                        {updatingId === r.id ? (
                                          <Loader2 className="w-3 h-3 animate-spin inline" />
                                        ) : r.status === 'CONFIRMED' ? (
                                          'Cancel'
                                        ) : (
                                          'Reinstate'
                                        )}
                                      </button>

                                      <button
                                        onClick={() => setSelectedReg(r)}
                                        className="text-slate-400 hover:text-slate-900 p-1 rounded hover:bg-slate-100 transition-colors"
                                        title="View full attendee dossier"
                                      >
                                        <ChevronRight className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Slide-over Detail Drawer / Modal for Selected Registration */}
      {selectedReg && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/30 backdrop-blur-xs flex justify-end">
          <div
            className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2">
                <BookmarkCheck className="w-5 h-5 text-[#034694]" />
                <h2 className="text-base font-bold text-slate-900">
                  Registration Dossier
                </h2>
              </div>
              <button
                onClick={() => setSelectedReg(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-800">
              {/* Participant Profile Banner */}
              <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">
                      {selectedReg.participantName}
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Silicon Verified
                    </span>
                  </div>
                  <p className="text-slate-600 font-mono mt-1">{selectedReg.participantEmail}</p>
                  {selectedReg.phone && (
                    <p className="text-slate-500 mt-0.5">Phone: {selectedReg.phone}</p>
                  )}
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    selectedReg.status === 'CONFIRMED'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {selectedReg.status}
                </span>
              </div>

              {/* Event Information */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Registered Event
                </span>
                <div className="font-bold text-slate-900 text-sm">
                  {selectedReg.event?.title || 'Unknown Event'}
                </div>
                <div className="text-slate-500 flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Organized by: {selectedReg.event?.club?.name || 'Silicon West'}</span>
                </div>
                {selectedReg.event?.venue && (
                  <div className="text-slate-500 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Venue: {selectedReg.event.venue}</span>
                  </div>
                )}
                {selectedReg.event?.slug && (
                  <div className="pt-1">
                    <Link
                      href={`/events/${selectedReg.event.slug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-[#034694] hover:underline font-semibold"
                    >
                      <span>Open Event Landing Page</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>

              {/* Academic Credentials */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  College & Academic Records
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase">Roll Number</label>
                    <div className="font-mono font-bold text-slate-900 text-xs">
                      {selectedReg.rollNumber || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase">Institution</label>
                    <div className="font-semibold text-slate-900 text-xs">
                      {selectedReg.collegeName || 'Silicon West'}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase">Department / Branch</label>
                    <div className="font-medium text-slate-800 text-xs">
                      {selectedReg.branch || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase">Academic Year</label>
                    <div className="font-medium text-slate-800 text-xs">
                      {selectedReg.year || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Team Structure & Teammates (If Team Event) */}
              {selectedReg.teamName ? (
                <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> Team Roster ({selectedReg.teamName})
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500">
                      {1 + (selectedReg.teamInvitations?.length || 0)} Members
                    </span>
                  </div>

                  <div className="space-y-2">
                    {/* Team Leader */}
                    <div className="p-2.5 rounded-lg bg-white border border-indigo-100 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{selectedReg.participantName}</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800">
                            Team Leader
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {selectedReg.participantEmail}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Confirmed
                      </span>
                    </div>

                    {/* Teammates */}
                    {Array.isArray(selectedReg.teamInvitations) && selectedReg.teamInvitations.length > 0 ? (
                      selectedReg.teamInvitations.map((invite) => (
                        <div
                          key={invite.id}
                          className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between"
                        >
                          <div>
                            <div className="font-semibold text-slate-800">
                              {invite.inviteeName || 'Student Invitee'}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {invite.inviteeEmail}
                            </div>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                              invite.status === 'ACCEPTED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : invite.status === 'DECLINED'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {invite.status}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">No teammate invitations tracked.</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Participation Format
                  </span>
                  <div className="flex items-center gap-2 text-slate-700">
                    <User className="w-4 h-4 text-slate-400" />
                    <span>Solo / Individual Participant (No team required)</span>
                  </div>
                </div>
              )}

              {/* Registration Meta */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  System Reference
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Registration ID:</span>
                  <div className="flex items-center gap-1 font-mono text-slate-800">
                    <span>{selectedReg.id}</span>
                    <button
                      onClick={(e) => handleCopy(selectedReg.id, 'reg-id', e)}
                      className="p-1 hover:text-[#034694]"
                      title="Copy Registration ID"
                    >
                      {copiedId === 'reg-id' ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Timestamp:</span>
                  <span className="font-mono text-slate-700">
                    {new Date(selectedReg.registeredAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                onClick={(e) => handleToggleStatus(selectedReg, e)}
                disabled={updatingId === selectedReg.id}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                  selectedReg.status === 'CONFIRMED'
                    ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                {updatingId === selectedReg.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin inline mr-1" />
                ) : null}
                {selectedReg.status === 'CONFIRMED'
                  ? 'Mark Registration as Cancelled'
                  : 'Reactivate to Confirmed'}
              </button>

              <button
                onClick={() => setSelectedReg(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
