'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from '../components/ThemeProvider';

export default function LandingPage() {
  const router = useRouter();
  const { dark, toggle, mounted } = useTheme();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      const role = localStorage.getItem('auth_role');
      if (token && role === 'ADMIN') {
        router.replace('/admin');
        return;
      } else if (token && role === 'STUDENT') {
        router.replace('/student');
        return;
      }
      setChecked(true);
    }
  }, [router]);

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 transition-colors selection:bg-indigo-500 selection:text-white overflow-hidden">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-black/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
            <span className="font-bold text-base sm:text-lg tracking-tight text-zinc-900 dark:text-white">StudentHub</span>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Theme Toggle Button */}
            {mounted && (
              <button
                onClick={toggle}
                className="p-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 transition"
                title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                aria-label="Toggle theme"
              >
                {dark ? (
                  <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
            )}
            <Link
              href="/login"
              className="px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-sm active:scale-95"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-20 pb-16 sm:pb-28 px-4 overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[350px] sm:w-[600px] h-[350px] sm:h-[600px] bg-indigo-500/10 dark:bg-indigo-600/15 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-5 sm:mb-6 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            Role-Based Attendance &amp; Student Portal
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-zinc-900 dark:text-white mb-4 sm:mb-6 leading-tight animate-slide-up">
            Smart Attendance<br />
            <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-500 bg-clip-text text-transparent">
              Made Fast &amp; Effortless
            </span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed px-2 animate-fade-in">
            A modern, lightning-fast student attendance management system. Administrators mark attendance in one tap, and students monitor their eligibility % in real-time.
          </p>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto sm:max-w-none animate-slide-up">
            <Link
              href="/login"
              className="w-full sm:w-auto px-7 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition active:scale-95 text-sm text-center"
            >
              Get Started — Sign In →
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto px-7 py-3.5 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-semibold rounded-xl border border-zinc-200 dark:border-zinc-800 transition text-sm text-center"
            >
              Explore Features
            </a>
          </div>
        </div>

        {/* Dashboard Preview Graphic */}
        <div className="relative max-w-5xl mx-auto mt-12 sm:mt-16 animate-fade-in">
          <div className="bg-zinc-50 dark:bg-[#0a0a0a] rounded-2xl sm:rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden">
            {/* Window bar */}
            <div className="bg-zinc-100 dark:bg-[#141414] border-b border-zinc-200 dark:border-zinc-800 px-3 sm:px-4 py-2.5 sm:py-3 flex items-center space-x-2">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-400"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
              <div className="flex-1 ml-3 bg-white dark:bg-[#1c1c1c] rounded-md h-5 max-w-[200px] sm:max-w-xs flex items-center px-2.5">
                <span className="text-[10px] text-zinc-400 font-mono truncate">studenthub-portal.vercel.app</span>
              </div>
            </div>

            {/* Mock Dashboard Layout */}
            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-5 sm:h-6 w-32 sm:w-44 bg-zinc-200 dark:bg-zinc-800 rounded-lg"></div>
                <div className="h-7 sm:h-8 w-20 sm:w-28 bg-indigo-500/20 rounded-xl"></div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                {[
                  { label: 'Attendance', val: '88%', color: 'text-emerald-500 bg-emerald-500/10' },
                  { label: 'Present Days', val: '22', color: 'text-indigo-500 bg-indigo-500/10' },
                  { label: 'Absent Days', val: '3', color: 'text-rose-500 bg-rose-500/10' },
                  { label: 'Total Classes', val: '25', color: 'text-zinc-400 bg-zinc-500/10' },
                ].map((item, i) => (
                  <div key={i} className="bg-white dark:bg-[#111111] rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-zinc-200 dark:border-zinc-800/80">
                    <span className="text-[10px] sm:text-xs text-zinc-500 uppercase tracking-wider block">{item.label}</span>
                    <span className={`text-lg sm:text-2xl font-black mt-1 inline-block ${item.color.split(' ')[0]}`}>{item.val}</span>
                  </div>
                ))}
              </div>
              <div className="bg-white dark:bg-[#111111] rounded-xl sm:rounded-2xl border border-zinc-200 dark:border-zinc-800/80 p-3 sm:p-4 space-y-2.5">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-1 border-b border-zinc-100 dark:border-zinc-800/50 last:border-0">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-mono">#{101 + i}</div>
                      <div>
                        <div className="h-3 w-24 sm:w-36 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                      </div>
                    </div>
                    <div className="h-5 w-16 sm:w-20 bg-emerald-500/15 rounded-full"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-24 px-4 bg-zinc-50 dark:bg-[#070707] border-t border-zinc-200 dark:border-zinc-800/80">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-black text-zinc-900 dark:text-white mb-3">
              Core Capabilities
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base max-w-xl mx-auto">
              Engineered with modern Next.js + Spring Boot architectures for speed and simplicity.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                icon: '⚡',
                title: 'One-Tap Attendance',
                desc: 'Admins toggle present/absent per student with optional notes. Bulk mark everyone present or absent with a single tap.',
              },
              {
                icon: '📊',
                title: 'Live Attendance % Tracker',
                desc: 'Real-time percentage calculations with dynamic color rings and eligibility status badges (75% threshold).',
              },
              {
                icon: '🎓',
                title: 'Role-Based Dashboards',
                desc: 'Separated portals for Admin (full CRUD & marks) and Students (personal attendance history & profile).',
              },
              {
                icon: '🗑️',
                title: 'Trash & Soft Delete',
                desc: 'Safely archive deleted students into Trash, restore them anytime, or permanently remove them from the database.',
              },
              {
                icon: '🌓',
                title: 'True Dark & Light Theme',
                desc: 'OLED pitch-black theme with high-contrast elements alongside crisp, clean light mode.',
              },
              {
                icon: '📱',
                title: 'Mobile First Design',
                desc: 'Fully responsive UI optimized for smartphones, tablets, and wide desktop displays.',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="bg-white dark:bg-[#0d0d0d] rounded-2xl p-5 sm:p-6 border border-zinc-200 dark:border-zinc-800/80 hover:border-indigo-500/50 transition-colors"
              >
                <div className="text-2xl sm:text-3xl mb-3.5">{f.icon}</div>
                <h3 className="font-bold text-zinc-900 dark:text-white mb-2 text-sm sm:text-base">{f.title}</h3>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 px-4 bg-gradient-to-b from-indigo-600 to-indigo-700 text-white">
        <div className="max-w-2xl mx-auto text-center px-4">
          <h2 className="text-2xl sm:text-4xl font-black mb-3">Ready to get started?</h2>
          <p className="text-indigo-100 mb-8 text-sm sm:text-base">
            Sign in with your admin or student credentials to access your dashboard.
          </p>
          <Link
            href="/login"
            className="inline-block w-full sm:w-auto px-8 py-3.5 bg-white text-indigo-700 font-bold rounded-xl hover:bg-zinc-100 transition shadow-xl active:scale-95 text-sm"
          >
            Sign In to Portal →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 sm:py-8 px-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black text-center text-xs text-zinc-500 dark:text-zinc-500">
        <p>StudentHub Portal · Built with Next.js &amp; Spring Boot · Vercel + Render</p>
      </footer>
    </div>
  );
}
