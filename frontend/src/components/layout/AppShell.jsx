'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';

const AUTH_ROUTES = ['/login', '/signup', '/register', '/verify-email', '/forgot-password', '/reset-password'];

export default function AppShell({ children }) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith('/dashboard');
  const isAuthPage = AUTH_ROUTES.some((route) => pathname?.startsWith(route));

  if (isDashboard || isAuthPage) {
    return <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">{children}</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
