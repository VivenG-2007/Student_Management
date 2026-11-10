'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getApiBaseUrl } from '../lib/api';

export default function Navbar({ role, user }) {
  const router = useRouter();
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [activeUrl, setActiveUrl] = useState('');
  const [backendStatus, setBackendStatus] = useState('checking'); // online, checking, offline

  useEffect(() => {
    const url = getApiBaseUrl();
    setActiveUrl(url);
    const saved = localStorage.getItem('custom_backend_url') || '';
    setCustomUrl(saved);

    // Quick health probe
    fetch(`${url}/api/students/health`, { method: 'GET', signal: AbortSignal.timeout(4000) })
      .then((res) => (res.ok ? setBackendStatus('online') : setBackendStatus('degraded')))
      .catch(() => setBackendStatus('offline'));
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_role');
      localStorage.removeItem('auth_user');
      router.push('/login');
    }
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
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
            <div>
              <span className="font-bold text-lg text-slate-800 tracking-tight">StudentHub</span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                Attendance &amp; CRUD
              </span>
            </div>
          </div>

          {/* User controls & Status */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Backend URL / Status Pill */}
            <button
              onClick={() => setShowConfigModal(true)}
              className="hidden md:flex items-center space-x-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-full transition"
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
              <span className="max-w-[150px] truncate">{activeUrl.replace(/^https?:\/\//, '')}</span>
            </button>

            {/* Role Badge */}
            {role === 'ADMIN' ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 bg-amber-50 text-amber-800 rounded-full border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                Admin
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 bg-indigo-50 text-indigo-800 rounded-full border border-indigo-200">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                Roll: {user?.rollno || 'Student'}
              </span>
            )}

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="inline-flex items-center space-x-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg border border-slate-200 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Backend URL Config Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-slide-up">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Backend Connection Settings</h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Connect your Vercel frontend to your Render backend API. Current active target:
              <code className="block mt-1 p-2 bg-slate-100 text-slate-800 rounded text-xs font-mono break-all">
                {activeUrl}
              </code>
            </p>

            <div className="space-y-2 mb-5">
              <label className="text-xs font-semibold text-slate-700">Custom Backend URL (optional override)</label>
              <input
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://your-service.onrender.com"
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-[11px] text-slate-400">Leave empty to use the default environment variable.</span>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
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

