'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import { Spinner } from '../../components/LoadingSkeleton';

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState('STUDENT'); // 'STUDENT' or 'ADMIN'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
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
          router.push('/student');
        } else {
          localStorage.setItem('auth_user', JSON.stringify({ name: data.name, username: data.username }));
          router.push('/admin');
        }
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickDemo = (demoRole) => {
    handleRoleChange(demoRole);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-indigo-50/20 to-slate-100">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/60 border border-slate-100 animate-slide-up">
        {/* Brand Icon & Heading */}
        <div className="text-center mb-6">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white items-center justify-center shadow-lg shadow-indigo-100 mb-3">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">StudentHub Portal</h1>
          <p className="text-xs text-slate-500 mt-1">Sign in with your role-based credentials</p>
        </div>

        {/* Role Toggle Selector */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => handleRoleChange('STUDENT')}
            className={`py-2 text-xs font-semibold rounded-xl transition ${
              role === 'STUDENT'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            🎓 Student Portal
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange('ADMIN')}
            className={`py-2 text-xs font-semibold rounded-xl transition ${
              role === 'ADMIN'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            ⚡ Admin Portal
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2 animate-fade-in">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {role === 'STUDENT' ? 'Student Roll Number or Email' : 'Admin Username'}
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={role === 'STUDENT' ? 'e.g. 101 or rahul@example.com' : 'e.g. admin'}
              className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={role === 'STUDENT' ? 'Enter roll no or password' : 'Enter admin password'}
              className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition shadow-md shadow-indigo-100 flex items-center justify-center space-x-2 disabled:opacity-60"
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
        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400 mb-2">Need quick test credentials?</p>
          <div className="flex justify-center space-x-2">
            <button
              type="button"
              onClick={() => fillQuickDemo('STUDENT')}
              className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 transition"
            >
              Fill Student (101)
            </button>
            <button
              type="button"
              onClick={() => fillQuickDemo('ADMIN')}
              className="text-[11px] font-medium text-slate-600 hover:text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 transition"
            >
              Fill Admin (admin)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

