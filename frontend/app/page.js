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
    // If already logged in, redirect to dashboard
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden">
      {/* Navbar */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-800 dark:text-white">StudentHub</span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Dark mode toggle */}
            {mounted && (
              <button
                onClick={toggle}
                className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {dark ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
            )}
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-xl transition"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-4 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-100 dark:bg-indigo-900/30 rounded-full blur-3xl opacity-60" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-violet-100 dark:bg-violet-900/30 rounded-full blur-3xl opacity-50" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-6 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            Role-Based Attendance System
          </div>

          <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-slate-900 dark:text-white mb-6 leading-tight animate-slide-up">
            Smart Attendance<br />
            <span className="bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
              Made Effortless
            </span>
          </h1>

          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in">
            A powerful student management portal where admins mark attendance instantly
            and students track their progress in real time — all in one clean interface.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up">
            <Link
              href="/login"
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-200 dark:shadow-indigo-900 transition active:scale-95 text-sm"
            >
              Get Started — Sign In →
            </Link>
            <a
              href="#features"
              className="px-8 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-2xl transition text-sm"
            >
              Learn More
            </a>
          </div>
        </div>

        {/* Hero Visual (dashboard mock) */}
        <div className="relative max-w-5xl mx-auto mt-20 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl shadow-slate-200/60 dark:shadow-slate-900/60 overflow-hidden">
            {/* Mock browser chrome */}
            <div className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-rose-400"></div>
              <div className="w-3 h-3 rounded-full bg-amber-400"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
              <div className="flex-1 ml-4 bg-white dark:bg-slate-700 rounded-lg h-6 max-w-xs flex items-center px-3">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">studenthub.vercel.app/admin</span>
              </div>
            </div>
            {/* Mock dashboard content */}
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-6 w-40 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
                <div className="h-8 w-24 bg-indigo-100 dark:bg-indigo-900 rounded-xl animate-pulse"></div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
                    <div className="h-3 w-16 bg-slate-200 dark:bg-slate-600 rounded mb-3 animate-pulse"></div>
                    <div className={`h-8 w-12 rounded animate-pulse ${i === 0 ? 'bg-indigo-200 dark:bg-indigo-800' : i === 1 ? 'bg-emerald-200 dark:bg-emerald-800' : i === 2 ? 'bg-rose-200 dark:bg-rose-800' : 'bg-slate-200 dark:bg-slate-600'}`}></div>
                  </div>
                ))}
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4">
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 animate-pulse flex-shrink-0"></div>
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-32 animate-pulse"></div>
                        <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded w-20 animate-pulse"></div>
                      </div>
                      <div className="h-6 w-20 bg-emerald-100 dark:bg-emerald-900 rounded-full animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-4">
              Everything you need to manage attendance
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl mx-auto">
              Built for educational institutions that need a fast, reliable, and simple system.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: '⚡',
                title: 'Instant Attendance Marking',
                desc: 'Admins can mark individual or bulk attendance in seconds. Present/absent toggling with optional remarks per student.',
                color: 'indigo',
              },
              {
                icon: '📊',
                title: 'Live Percentage Tracking',
                desc: 'Students see their real-time attendance percentage with visual progress rings and historical date-wise logs.',
                color: 'emerald',
              },
              {
                icon: '🎓',
                title: 'Role-Based Access',
                desc: 'Secure login for both Admins (full CRUD + attendance) and Students (view-only personal dashboard).',
                color: 'violet',
              },
              {
                icon: '🗑️',
                title: 'Safe Trash & Restore',
                desc: 'Soft-delete students to trash, restore them anytime, or permanently remove archived records.',
                color: 'amber',
              },
              {
                icon: '🔒',
                title: 'Token-Based Auth',
                desc: 'JWT authentication keeps sessions secure. Each login role gets a scoped token with minimal permissions.',
                color: 'rose',
              },
              {
                icon: '☁️',
                title: 'Cloud Deployed',
                desc: 'Frontend on Vercel + Spring Boot backend on Render. Fast global CDN and auto-scaling infra.',
                color: 'sky',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:-translate-y-0.5 transition duration-200"
              >
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700">
        <div className="max-w-2xl mx-auto text-center text-white">
          <h2 className="text-3xl sm:text-4xl font-black mb-4">Ready to get started?</h2>
          <p className="text-indigo-200 mb-8 text-lg">
            Sign in with your admin or student credentials and manage attendance in minutes.
          </p>
          <Link
            href="/login"
            className="inline-block px-10 py-4 bg-white text-indigo-700 font-bold rounded-2xl hover:bg-slate-50 transition shadow-xl active:scale-95 text-sm"
          >
            Sign In to Portal →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-center text-xs text-slate-400 dark:text-slate-600">
        <p>StudentHub Attendance Portal · Built with Next.js & Spring Boot · Deployed on Vercel + Render</p>
      </footer>
    </div>
  );
}
