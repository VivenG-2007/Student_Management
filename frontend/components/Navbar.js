'use client';

import { useState, useEffect } from 'react';
import { getApiBaseUrl } from '../lib/api';
import { useTheme } from './ThemeProvider';

export default function Navbar({ role, user }) {
  const { dark, toggle, mounted } = useTheme();
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [activeUrl, setActiveUrl] = useState('');
  const [backendStatus, setBackendStatus] = useState('checking');

  useEffect(() => {
    const url = getApiBaseUrl();
    setActiveUrl(url);
    const saved = localStorage.getItem('custom_backend_url') || '';
    setCustomUrl(saved);

    fetch(`${url}/api/students/health`, { method: 'GET', signal: AbortSignal.timeout(4000) })
      .then((res) => (res.ok ? setBackendStatus('online') : setBackendStatus('degraded')))
      .catch(() => setBackendStatus('offline'));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_role');
    localStorage.removeItem('auth_user');
    window.location.href = '/login';
  };

  const handleSaveConfig = () => {
    if (customUrl.trim()) {
      localStorage.setItem('custom_backend_url', customUrl.trim());
    } else {
      localStorage.removeItem('custom_backend_url');
    }
    setShowConfigModal(false);
    window.location.reload();
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-black/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
            <div>
              <span className="font-bold text-base sm:text-lg text-zinc-900 dark:text-white tracking-tight">StudentHub</span>
              <span className="hidden sm:inline-block ml-2 text-[11px] font-semibold px-2 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-500/20">
                Attendance &amp; CRUD
              </span>
            </div>
          </div>

          {/* User controls & Status */}
          <div className="flex items-center space-x-1.5 sm:space-x-3">
            {/* Backend URL / Status Pill */}
            <button
              onClick={() => setShowConfigModal(true)}
              className="flex items-center space-x-1.5 text-xs bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2.5 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 transition"
              title="Click to view or edit backend connection URL"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  backendStatus === 'online'
                    ? 'bg-emerald-500 animate-pulse'
                    : backendStatus === 'checking'
                    ? 'bg-amber-400'
                    : 'bg-rose-500'
                }`}
              />
              <span className="hidden md:inline max-w-[130px] truncate">{activeUrl.replace(/^https?:\/\//, '')}</span>
              <span className="md:hidden text-[11px] font-mono">API</span>
            </button>

            {/* Role Badge */}
            {role === 'ADMIN' ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 sm:px-3 py-1 bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-full border border-amber-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                <span>Admin</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 sm:px-3 py-1 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 rounded-full border border-indigo-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                <span className="truncate max-w-[100px]">{user?.rollno ? `Roll: ${user.rollno}` : 'Student'}</span>
              </span>
            )}

            {/* Dark mode toggle */}
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

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="inline-flex items-center space-x-1 sm:space-x-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 px-2.5 sm:px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 transition"
              title="Logout"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden xs:inline sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Backend URL Config Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-[#0d0d0d] rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-slide-up">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Backend Connection Settings</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 leading-relaxed">
              Connect your Vercel frontend to your Render backend API. Current target:
              <code className="block mt-1 p-2 bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 rounded-lg text-xs font-mono break-all border border-zinc-200 dark:border-zinc-800">
                {activeUrl}
              </code>
            </p>

            <div className="space-y-2 mb-5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Custom Backend URL (optional override)</label>
              <input
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://your-service.onrender.com"
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-[11px] text-zinc-500">Leave empty to use the default environment variable.</span>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveConfig}
                className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow transition"
              >
                Save &amp; Reconnect
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
