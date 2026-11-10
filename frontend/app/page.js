'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from '../components/LoadingSkeleton';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      const role = localStorage.getItem('auth_role');

      if (token && role === 'ADMIN') {
        router.replace('/admin');
      } else if (token && role === 'STUDENT') {
        router.replace('/student');
      } else {
        router.replace('/login');
      }
    }
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-50 to-indigo-50/30">
      <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100 mb-4 animate-bounce">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-slate-800 mb-2">StudentHub Portal</h2>
      <div className="flex items-center space-x-2 text-sm text-slate-500">
        <Spinner size="sm" />
        <span>Loading authentication state...</span>
      </div>
    </div>
  );
}

