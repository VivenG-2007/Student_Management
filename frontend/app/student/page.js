'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import { api } from '../../lib/api';
import { CardSkeleton } from '../../components/LoadingSkeleton';

export default function StudentDashboard() {
  const router = useRouter();
  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      const role = localStorage.getItem('auth_role');
      const userData = localStorage.getItem('auth_user');

      if (!token || role !== 'STUDENT') {
        router.replace('/login');
        return;
      }

      if (userData) {
        try {
          const parsed = JSON.parse(userData);
          setStudent(parsed);
          loadAttendance(parsed.id);
        } catch (e) {
          router.replace('/login');
        }
      }
    }
  }, [router]);

  const loadAttendance = async (studentId) => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getStudentAttendanceSummary(studentId);
      setAttendance(data);
    } catch (err) {
      setError(err.message || 'Failed to load attendance record.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    if (student?.id) {
      setRefreshing(true);
      loadAttendance(student.id);
    }
  };

  const getStatusColor = (pct) => {
    if (pct >= 75) {
      return {
        badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
        text: 'text-emerald-600 dark:text-emerald-400',
        ring: 'text-emerald-500',
        label: 'Good Standing (Eligible)',
      };
    }
    if (pct >= 60) {
      return {
        badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
        text: 'text-amber-600 dark:text-amber-400',
        ring: 'text-amber-500',
        label: 'Warning (< 75%)',
      };
    }
    return {
      badge: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20',
      text: 'text-rose-600 dark:text-rose-400',
      ring: 'text-rose-500',
      label: 'Critical Shortage (< 60%)',
    };
  };

  const pct = attendance?.attendancePercentage ?? 0;
  const statusColors = getStatusColor(pct);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 flex flex-col transition-colors">
      <Navbar role="STUDENT" user={student} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-4 sm:space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-zinc-950 border border-indigo-900/60 dark:border-zinc-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-80 sm:w-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div>
              <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-indigo-300">
                Student Portal
              </span>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight mt-1">
                Welcome back, {student?.name || 'Student'}!
              </h1>
              <p className="text-zinc-300 text-xs sm:text-sm mt-1">
                Roll No: <span className="font-semibold text-white">#{student?.rollno || '-'}</span> • Course: <span className="font-semibold text-white">{student?.subject || 'General'}</span>
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center justify-center space-x-2 text-xs font-semibold bg-white/10 hover:bg-white/20 active:scale-95 text-white px-4 py-2.5 rounded-xl backdrop-blur-md transition border border-white/15 w-full sm:w-auto"
            >
              <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{refreshing ? 'Refreshing...' : 'Refresh Records'}</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl sm:rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs sm:text-sm flex items-center space-x-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Metrics Overview Cards */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Attendance Percentage Main Card */}
            <div className="col-span-2 sm:col-span-1 bg-white dark:bg-[#0a0a0a] rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] sm:text-xs font-semibold text-zinc-500 uppercase tracking-wider">Attendance Rate</span>
                <div className={`text-2xl sm:text-3xl font-extrabold mt-1 ${statusColors.text}`}>
                  {pct}%
                </div>
                <div className="mt-2">
                  <span className={`inline-block text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusColors.badge}`}>
                    {statusColors.label}
                  </span>
                </div>
              </div>

              {/* Progress ring graphic */}
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-zinc-200 dark:text-zinc-800"
                    strokeWidth="3.8"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={statusColors.ring}
                    strokeDasharray={`${Math.min(pct, 100)}, 100`}
                    strokeWidth="3.8"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-[11px] sm:text-xs font-bold text-zinc-800 dark:text-zinc-200">{Math.round(pct)}%</span>
              </div>
            </div>

            {/* Present Days Card */}
            <div className="bg-white dark:bg-[#0a0a0a] rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <span className="text-[10px] sm:text-xs font-semibold text-zinc-500 uppercase tracking-wider">Present Days</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                {attendance?.presentDays ?? 0}
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-500 mt-1 sm:mt-2">Classes attended</p>
            </div>

            {/* Absent Days Card */}
            <div className="bg-white dark:bg-[#0a0a0a] rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <span className="text-[10px] sm:text-xs font-semibold text-zinc-500 uppercase tracking-wider">Absent Days</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
                {attendance?.absentDays ?? 0}
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-500 mt-1 sm:mt-2">Classes missed</p>
            </div>

            {/* Total Classes Card */}
            <div className="bg-white dark:bg-[#0a0a0a] rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <span className="text-[10px] sm:text-xs font-semibold text-zinc-500 uppercase tracking-wider">Total Sessions</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white mt-1">
                {attendance?.totalClasses ?? 0}
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-500 mt-1 sm:mt-2">Class days recorded</p>
            </div>
          </div>
        )}

        {/* History Table & Student Profile */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Detailed Attendance History (2 columns on desktop) */}
          <div className="lg:col-span-2 bg-white dark:bg-[#0a0a0a] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Attendance Log by Date</span>
              </h2>
              <span className="text-xs text-zinc-500">
                {attendance?.records?.length || 0} total records
              </span>
            </div>

            {loading ? (
              <div className="space-y-2 py-4">
                <div className="h-10 rounded-xl skeleton-shimmer"></div>
                <div className="h-10 rounded-xl skeleton-shimmer"></div>
                <div className="h-10 rounded-xl skeleton-shimmer"></div>
              </div>
            ) : attendance?.records?.length === 0 ? (
              <div className="text-center py-10 text-zinc-400">
                <svg className="w-10 h-10 mx-auto mb-2 text-zinc-300 dark:text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-xs sm:text-sm">No attendance records have been marked for you yet.</p>
                <small className="text-[11px] text-zinc-500">Your administrator marks daily attendance.</small>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full text-left text-xs sm:text-sm min-w-[480px]">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                      <th className="py-2.5 px-3 sm:px-4">Date</th>
                      <th className="py-2.5 px-3 sm:px-4">Status</th>
                      <th className="py-2.5 px-3 sm:px-4">Marked By</th>
                      <th className="py-2.5 px-3 sm:px-4">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                    {attendance.records.map((rec) => (
                      <tr key={rec.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition">
                        <td className="py-3 px-3 sm:px-4 font-medium text-zinc-800 dark:text-zinc-200">{rec.date}</td>
                        <td className="py-3 px-3 sm:px-4">
                          {rec.status === 'PRESENT' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Present
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              Absent
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 sm:px-4 text-xs text-zinc-500">{rec.markedBy || 'admin'}</td>
                        <td className="py-3 px-3 sm:px-4 text-xs text-zinc-400 dark:text-zinc-500">{rec.remarks || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Student Profile Info Card (1 column) */}
          <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm h-fit">
            <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Student Profile</span>
            </h2>

            <div className="space-y-2.5 sm:space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#141414] border border-zinc-200/80 dark:border-zinc-800/80">
                <span className="text-zinc-500 block font-medium">Full Name</span>
                <span className="text-zinc-900 dark:text-white font-bold text-sm">{student?.name || '-'}</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#141414] border border-zinc-200/80 dark:border-zinc-800/80">
                <span className="text-zinc-500 block font-medium">Roll Number</span>
                <span className="text-zinc-900 dark:text-white font-bold text-sm">#{student?.rollno || '-'}</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#141414] border border-zinc-200/80 dark:border-zinc-800/80">
                <span className="text-zinc-500 block font-medium">Email Address</span>
                <span className="text-zinc-800 dark:text-zinc-200 font-semibold break-all">{student?.email || '-'}</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#141414] border border-zinc-200/80 dark:border-zinc-800/80">
                <span className="text-zinc-500 block font-medium">Subject / Course</span>
                <span className="text-zinc-800 dark:text-zinc-200 font-semibold">{student?.subject || '-'}</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#141414] border border-zinc-200/80 dark:border-zinc-800/80">
                <span className="text-zinc-500 block font-medium">Age</span>
                <span className="text-zinc-800 dark:text-zinc-200 font-semibold">{student?.age ? `${student.age} years` : '-'}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
