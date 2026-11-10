'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';
import { Spinner } from '../../components/LoadingSkeleton';
import LoginLoader from '../../components/LoginLoader';
import { useTheme } from '../../components/ThemeProvider';

export default function LoginPage() {
  const { dark, toggle, mounted } = useTheme();
  const [role, setRole] = useState('STUDENT');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [settingUp, setSettingUp] = useState(false);
  const [settingUpRole, setSettingUpRole] = useState('STUDENT');
  const [error, setError] = useState('');

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setError('');
    if (newRole === 'ADMIN') {
      setUsername('admin');
      setPassword('admin123');
    } else {
      setUsername('101');
      setPassword('101');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please fill in both fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await api.login(role, username.trim(), password.trim());
      if (data && data.token) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_role', data.role);
        if (data.role === 'STUDENT') {
          localStorage.setItem('auth_user', JSON.stringify(data.student));
        } else {
          localStorage.setItem('auth_user', JSON.stringify({ name: data.name, username: data.username }));
        }

        // Show "Setting things up..." animation
        setSettingUpRole(data.role);
        setSettingUp(true);
        setLoading(false);

        // Navigate after animation completes
        setTimeout(() => {
          window.location.href = data.role === 'STUDENT' ? '/student' : '/admin';
        }, 2200);
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
      setLoading(false);
    }
  };

  const fillQuickDemo = (demoRole) => {
    handleRoleChange(demoRole);
  };

  if (settingUp) {
    return <LoginLoader role={settingUpRole} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-indigo-50/20 to-slate-100 dark:from-slate-950 dark:via-indigo-950/20 dark:to-slate-900">
      {/* Theme toggle (top right) */}
      {mounted && (
        <button
          onClick={toggle}
          className="fixed top-4 right-4 z-50 p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition shadow-sm"
          title={dark ? 'Light mode' : 'Dark mode'}
        >
          {dark ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      )}

      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl shadow-slate-200/60 dark:shadow-slate-900/80 border border-slate-100 dark:border-slate-700/50 animate-slide-up">
        {/* Back to home */}
        <Link
          href="/"
          className="inline-flex items-center space-x-1 text-xs text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition mb-6"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to Home</span>
        </Link>

        {/* Brand Icon & Heading */}
        <div className="text-center mb-6">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white items-center justify-center shadow-lg shadow-indigo-100 dark:shadow-indigo-900/50 mb-3">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">StudentHub Portal</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Sign in with your role-based credentials</p>
        </div>

        {/* Role Toggle Selector */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => handleRoleChange('STUDENT')}
            className={`py-2 text-xs font-semibold rounded-xl transition ${
              role === 'STUDENT'
                ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            🎓 Student Portal
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange('ADMIN')}
            className={`py-2 text-xs font-semibold rounded-xl transition ${
              role === 'ADMIN'
                ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            ⚡ Admin Portal
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-2 animate-fade-in">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {role === 'STUDENT' ? 'Student Roll Number or Email' : 'Admin Username'}
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={role === 'STUDENT' ? 'e.g. 101 or rahul@example.com' : 'e.g. admin'}
              className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={role === 'STUDENT' ? 'Enter roll no or password' : 'Enter admin password'}
              className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition shadow-md shadow-indigo-100 dark:shadow-indigo-900/50 flex items-center justify-center space-x-2 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Spinner size="sm" className="border-t-white" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In as {role === 'STUDENT' ? 'Student' : 'Administrator'}</span>
            )}
          </button>
        </form>

        {/* Quick Demo Fillers */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-2">Need quick test credentials?</p>
          <div className="flex justify-center space-x-2">
            <button
              type="button"
              onClick={() => fillQuickDemo('STUDENT')}
              className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-lg border border-indigo-100 dark:border-indigo-800 transition"
            >
              Fill Student (101)
            </button>
            <button
              type="button"
              onClick={() => fillQuickDemo('ADMIN')}
              className="text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 transition"
            >
              Fill Admin (admin)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
