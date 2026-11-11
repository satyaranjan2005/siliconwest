import React from 'react';
import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-20 sm:pb-12 space-y-8 sm:space-y-12">
        {/* Top Section */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 lg:gap-12">
          {/* Brand & Institution Overview */}
          <div className="space-y-4 max-w-lg">
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

            <p className="text-xs text-slate-400 leading-relaxed">
              The official centralized platform for discovering student-led societies, registering for national hackathons, technical bootcamps, cultural galas, and athletic championships.
            </p>
          </div>

          {/* Quick Navigation */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">
              Explore Portal
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/events" className="hover:text-white transition-colors">
                  Events Timeline
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
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>
            © {currentYear} Silicon West Campus.
          </p>
        </div>
      </div>
    </footer>
  );
}
