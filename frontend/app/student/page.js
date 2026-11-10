'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import { api } from '../../lib/api';
import { CardSkeleton, Spinner } from '../../components/LoadingSkeleton';

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
    if (pct >= 75) return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'text-emerald-600', ring: 'text-emerald-500' };
    if (pct >= 60) return { bg: 'bg-amber-50 text-amber-700 border-amber-200', text: 'text-amber-600', ring: 'text-amber-500' };
    return { bg: 'bg-rose-50 text-rose-700 border-rose-200', text: 'text-rose-600', ring: 'text-rose-500' };
  };

  const pct = attendance?.attendancePercentage ?? 0;
  const statusColors = getStatusColor(pct);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar role="STUDENT" user={student} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-96 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">Student Portal</span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
                Welcome back, {student?.name || 'Student'}!
              </h1>
              <p className="text-indigo-200 text-xs sm:text-sm mt-1">
                Roll No: <span className="font-semibold text-white">#{student?.rollno || '-'}</span> • Course: <span className="font-semibold text-white">{student?.subject || 'General'}</span>
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center space-x-2 text-xs font-medium bg-white/10 hover:bg-white/20 active:scale-95 text-white px-4 py-2.5 rounded-xl backdrop-blur-md transition border border-white/10 w-fit"
            >
              <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{refreshing ? 'Refreshing...' : 'Refresh Records'}</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center space-x-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Metrics Overview Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Attendance Percentage Main Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Attendance %</span>
                <div className={`text-3xl font-extrabold mt-1 ${statusColors.text}`}>
                  {pct}%
                </div>
                <div className="mt-2">
                  <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusColors.bg}`}>
                    {pct >= 75 ? 'Good Standing' : pct >= 60 ? 'Low Warning' : 'Critical Shortage'}
                  </span>
                </div>
              </div>

              {/* Progress ring graphic */}
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100"
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
                <span className="absolute text-[11px] font-bold text-slate-700">{Math.round(pct)}%</span>
              </div>
            </div>

            {/* Present Days Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Present Days</span>
              <div className="text-3xl font-extrabold text-emerald-600 mt-1">
                {attendance?.presentDays ?? 0}
              </div>
              <p className="text-xs text-slate-500 mt-2">Classes attended</p>
            </div>

            {/* Absent Days Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Absent Days</span>
              <div className="text-3xl font-extrabold text-rose-600 mt-1">
                {attendance?.absentDays ?? 0}
              </div>
              <p className="text-xs text-slate-500 mt-2">Classes missed</p>
            </div>

            {/* Total Classes Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Sessions</span>
              <div className="text-3xl font-extrabold text-slate-800 mt-1">
                {attendance?.totalClasses ?? 0}
              </div>
              <p className="text-xs text-slate-500 mt-2">Total working days recorded</p>
            </div>
          </div>
        )}

        {/* History Table & Student Profile */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Detailed Attendance History (2 columns) */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Attendance Log by Date</span>
              </h2>
              <span className="text-xs text-slate-500">
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
              <div className="text-center py-12 text-slate-400">
                <svg className="w-12 h-12 mx-auto mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm">No attendance records have been marked for you yet.</p>
                <small className="text-xs text-slate-400">Your administrator marks daily attendance.</small>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Marked By</th>
                      <th className="py-3 px-4">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {attendance.records.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-medium text-slate-700">{rec.date}</td>
                        <td className="py-3 px-4">
                          {rec.status === 'PRESENT' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Present
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              Absent
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-500">{rec.markedBy || 'admin'}</td>
                        <td className="py-3 px-4 text-xs text-slate-400">{rec.remarks || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Student Profile Info Card (1 column) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm h-fit">
            <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Student Profile</span>
            </h2>

            <div className="space-y-3.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block font-medium">Full Name</span>
                <span className="text-slate-800 font-bold text-sm">{student?.name || '-'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block font-medium">Roll Number</span>
                <span className="text-slate-800 font-bold text-sm">#{student?.rollno || '-'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block font-medium">Email Address</span>
                <span className="text-slate-800 font-semibold">{student?.email || '-'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block font-medium">Subject / Course</span>
                <span className="text-slate-800 font-semibold">{student?.subject || '-'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block font-medium">Age</span>
                <span className="text-slate-800 font-semibold">{student?.age ? `${student.age} years` : '-'}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
