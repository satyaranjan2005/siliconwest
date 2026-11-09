import React from 'react';
import Link from 'next/link';
import {
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Building2,
  Calendar,
  Compass,
  ArrowUpRight,
} from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-20 sm:pb-12 space-y-8 sm:space-y-12">
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
          {/* Column 1: Brand & Institution Overview (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-[#034694] text-white flex items-center justify-center font-bold text-base shadow-xs group-hover:bg-[#023168] transition-colors">
                S
              </div>
              <div className="flex flex-col">
                <span className="text-white font-extrabold text-base tracking-tight leading-none">
                  SILICON WEST
                </span>
                <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase mt-0.5">
                  Silicon Institute of Technology
                </span>
              </div>
            </Link>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              The official centralized platform for discovering student-led societies, registering for national hackathons, technical bootcamps, cultural galas, and athletic championships.
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Silicon University • Sambalpur Campus Hub</span>
            </div>
          </div>

          {/* Column 2: Student Communities */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">
              Student Societies
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/clubs/silicon-coding-club" className="hover:text-white transition-colors">
                  Silicon Coding Club
                </Link>
              </li>
              <li>
                <Link href="/clubs/robosilicon" className="hover:text-white transition-colors">
                  RoboSilicon &amp; Drone Club
                </Link>
              </li>
              <li>
                <Link href="/clubs/resonance-cultural-club" className="hover:text-white transition-colors">
                  Resonance Cultural Society
                </Link>
              </li>
              <li>
                <Link href="/clubs/spartans-sports" className="hover:text-white transition-colors">
                  Spartans Athletics &amp; Sports
                </Link>
              </li>
              <li>
                <Link href="/clubs/pixels-media-society" className="hover:text-white transition-colors">
                  Pixels Media &amp; Visual Arts
                </Link>
              </li>
              <li>
                <Link href="/clubs/ieee-silicon-west" className="hover:text-white transition-colors">
                  IEEE Student Branch
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Quick Navigation */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">
              Explore Portal
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/events" className="hover:text-white transition-colors flex items-center gap-1">
                  <span>Events Timeline</span>
                </Link>
              </li>
              <li>
                <Link href="/clubs" className="hover:text-white transition-colors">
                  Clubs Directory
                </Link>
              </li>
              <li>
                <Link href="/my-registrations" className="hover:text-white transition-colors">
                  My Registrations
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  Coordinator Sign In
                </Link>
              </li>
              <li>
                <a
                  href="https://silicon.ac.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors inline-flex items-center gap-1"
                >
                  <span>Main University</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-500" />
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Campus Desk & Contact */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">
              Campus Desk
            </h4>
            <div className="space-y-2.5 text-xs text-slate-400">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  Silicon Hills, Sason, Sambalpur,<br />
                  Odisha, India - 768200
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>+91 94371 45450 / 0663 2010200</span>
              </div>

              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <a href="mailto:clubs.west@silicon.ac.in" className="hover:text-white transition-colors">
                  clubs.west@silicon.ac.in
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Compliance */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>
            © {currentYear} Silicon West Campus. Silicon Institute of Technology, Silicon University.
          </p>

          <div className="flex flex-wrap items-center gap-5">
            <span className="hover:text-slate-400 transition-colors cursor-pointer">
              Privacy Policy
            </span>
            <span className="hover:text-slate-400 transition-colors cursor-pointer">
              Event Code of Conduct
            </span>
            <span className="hover:text-slate-400 transition-colors cursor-pointer">
              Anti-Ragging Cell
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
