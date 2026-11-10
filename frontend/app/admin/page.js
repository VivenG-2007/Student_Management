'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import { api } from '../../lib/api';
import { TableRowSkeleton, Spinner } from '../../components/LoadingSkeleton';

export default function AdminDashboard() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState(null);
  const [activeTab, setActiveTab] = useState('attendance'); // 'attendance', 'summary', 'students', 'trash'

  // Attendance state
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [attendanceList, setAttendanceList] = useState([]);
  const [attendanceChanges, setAttendanceChanges] = useState({}); // studentId -> status
  const [attendanceRemarks, setAttendanceRemarks] = useState({}); // studentId -> remark
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);

  // Student CRUD state
  const [students, setStudents] = useState([]);
  const [deletedStudents, setDeletedStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [savingStudent, setSavingStudent] = useState(false);

  // Student Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    rollno: '',
    age: '',
    subject: '',
    password: '',
  });

  // Toast state
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      const role = localStorage.getItem('auth_role');
      const userData = localStorage.getItem('auth_user');

      if (!token || role !== 'ADMIN') {
        router.replace('/login');
        return;
      }

      if (userData) {
        try {
          setAdminUser(JSON.parse(userData));
        } catch (e) {}
      }

      loadAttendanceOverview(selectedDate);
      loadStudents();
      loadDeletedStudents();
    }
  }, [router]);

  const loadAttendanceOverview = async (date) => {
    setLoadingAttendance(true);
    try {
      const data = await api.getAttendanceOverview(date);
      setAttendanceList(data || []);
      const initialChanges = {};
      const initialRemarks = {};
      (data || []).forEach((item) => {
        initialChanges[item.id] = item.statusForDate === 'ABSENT' ? 'ABSENT' : 'PRESENT';
      });
      setAttendanceChanges(initialChanges);
      setAttendanceRemarks(initialRemarks);
    } catch (err) {
      showToast('Error loading attendance: ' + err.message, 'error');
    } finally {
      setLoadingAttendance(false);
    }
  };

  const loadStudents = async () => {
    setLoadingStudents(true);
    try {
      const data = await api.getStudents();
      setStudents(data || []);
    } catch (err) {
      showToast('Error loading students: ' + err.message, 'error');
    } finally {
      setLoadingStudents(false);
    }
  };

  const loadDeletedStudents = async () => {
    try {
      const data = await api.getDeletedStudents();
      setDeletedStudents(data || []);
    } catch (err) {}
  };

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
    loadAttendanceOverview(newDate);
  };

  const handleToggleAttendance = (studentId, status) => {
    setAttendanceChanges((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleBulkMark = (status) => {
    const updated = {};
    attendanceList.forEach((s) => {
      updated[s.id] = status;
    });
    setAttendanceChanges(updated);
    showToast(`Marked all students as ${status}. Click 'Save Attendance' to persist.`);
  };

  const handleSaveAttendance = async () => {
    setSavingAttendance(true);
    try {
      const entries = Object.entries(attendanceChanges).map(([studentId, status]) => ({
        studentId: parseInt(studentId, 10),
        status,
        remarks: attendanceRemarks[studentId] || '',
      }));

      await api.saveBatchAttendance(selectedDate, entries);
      showToast(`Attendance for ${selectedDate} saved successfully!`);
      loadAttendanceOverview(selectedDate);
    } catch (err) {
      showToast('Failed to save attendance: ' + err.message, 'error');
    } finally {
      setSavingAttendance(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingStudent(null);
    setFormData({
      name: '',
      email: '',
      rollno: '',
      age: '',
      subject: '',
      password: '',
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name || '',
      email: student.email || '',
      rollno: student.rollno ? String(student.rollno) : '',
      age: student.age ? String(student.age) : '',
      subject: student.subject || '',
      password: student.password || '',
    });
    setShowModal(true);
  };

  const handleSaveStudent = async (e) => {
    e.preventDefault();
    setSavingStudent(true);

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      rollno: parseInt(formData.rollno, 10),
      age: parseInt(formData.age, 10),
      subject: formData.subject.trim(),
      password: formData.password.trim() || formData.rollno.trim(),
    };

    try {
      if (editingStudent) {
        await api.updateStudent(editingStudent.id, payload);
        showToast('Student record updated!');
      } else {
        await api.createStudent(payload);
        showToast('New student added successfully!');
      }
      setShowModal(false);
      loadStudents();
      loadAttendanceOverview(selectedDate);
    } catch (err) {
      showToast('Save failed: ' + err.message, 'error');
    } finally {
      setSavingStudent(false);
    }
  };

  const handleSoftDelete = async (id, name) => {
    if (!confirm(`Move student '${name}' to Trash? You can restore them later.`)) return;
    try {
      await api.softDeleteStudent(id);
      showToast(`Student '${name}' moved to trash.`);
      loadStudents();
      loadDeletedStudents();
      loadAttendanceOverview(selectedDate);
    } catch (err) {
      showToast('Failed to delete: ' + err.message, 'error');
    }
  };

  const handleRestore = async (id, name) => {
    try {
      await api.restoreStudent(id);
      showToast(`Student '${name}' restored!`);
      loadStudents();
      loadDeletedStudents();
      loadAttendanceOverview(selectedDate);
    } catch (err) {
      showToast('Restore failed: ' + err.message, 'error');
    }
  };

  const handleHardDelete = async (id, name) => {
    if (!confirm(`Permanently delete student '${name}' from database? This cannot be undone.`)) return;
    try {
      await api.deleteStudentPermanently(id);
      showToast(`Student '${name}' permanently deleted.`);
      loadStudents();
      loadDeletedStudents();
      loadAttendanceOverview(selectedDate);
    } catch (err) {
      showToast('Failed to delete: ' + err.message, 'error');
    }
  };

  const filteredStudents = students.filter((s) => {
    if (!studentSearch.trim()) return true;
    const q = studentSearch.toLowerCase();
    return (
      (s.name || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q) ||
      (s.subject || '').toLowerCase().includes(q) ||
      String(s.rollno || '').includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 flex flex-col transition-colors">
      <Navbar role="ADMIN" user={adminUser} />

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-6 sm:top-20 z-50 animate-slide-up flex justify-center sm:justify-end pointer-events-none">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl flex items-center space-x-2 text-xs sm:text-sm text-white pointer-events-auto ${
              toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'
            }`}
          >
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-4 sm:space-y-6">
        {/* Navigation Tabs Header - horizontally scrollable on mobile */}
        <div className="bg-white dark:bg-[#0a0a0a] rounded-xl sm:rounded-2xl p-1.5 border border-zinc-200 dark:border-zinc-800 shadow-sm flex overflow-x-auto no-scrollbar gap-1 sm:gap-1.5">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`whitespace-nowrap flex-shrink-0 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'attendance'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900'
            }`}
          >
            <span>📅 Mark Attendance</span>
          </button>

          <button
            onClick={() => setActiveTab('summary')}
            className={`whitespace-nowrap flex-shrink-0 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'summary'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900'
            }`}
          >
            <span>📊 Attendance Summary %</span>
          </button>

          <button
            onClick={() => setActiveTab('students')}
            className={`whitespace-nowrap flex-shrink-0 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'students'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900'
            }`}
          >
            <span>👥 Students Directory</span>
            <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] px-1.5 py-0.5 rounded-full font-mono">
              {students.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('trash')}
            className={`whitespace-nowrap flex-shrink-0 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'trash'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900'
            }`}
          >
            <span>🗑️ Trash</span>
            <span className="bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] px-1.5 py-0.5 rounded-full font-mono">
              {deletedStudents.length}
            </span>
          </button>
        </div>

        {/* TAB 1: MARK ATTENDANCE */}
        {activeTab === 'attendance' && (
          <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-white">Mark Daily Attendance</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Select a date and toggle student attendance status
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {/* Date Picker */}
                <div className="flex items-center space-x-2 bg-zinc-50 dark:bg-[#141414] px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Date:</span>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="text-xs font-medium bg-transparent border-0 focus:outline-none cursor-pointer text-zinc-900 dark:text-zinc-100 [color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>

                {/* Bulk Actions */}
                <button
                  type="button"
                  onClick={() => handleBulkMark('PRESENT')}
                  className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition"
                >
                  ✓ All Present
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkMark('ABSENT')}
                  className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-xl bg-rose-500/10 text-rose-700 dark:text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition"
                >
                  ✕ All Absent
                </button>

                {/* Save Attendance Button */}
                <button
                  type="button"
                  disabled={savingAttendance}
                  onClick={handleSaveAttendance}
                  className="w-full sm:w-auto px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 flex items-center justify-center space-x-1.5 transition active:scale-95 disabled:opacity-60"
                >
                  {savingAttendance ? <Spinner size="xs" className="border-t-white" /> : null}
                  <span>Save Attendance</span>
                </button>
              </div>
            </div>

            {/* Attendance Marking Table */}
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full text-left text-xs sm:text-sm min-w-[620px]">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                    <th className="py-3 px-3 sm:px-4">Roll</th>
                    <th className="py-3 px-3 sm:px-4">Student</th>
                    <th className="py-3 px-3 sm:px-4">Course</th>
                    <th className="py-3 px-3 sm:px-4">Status for {selectedDate}</th>
                    <th className="py-3 px-3 sm:px-4">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                  {loadingAttendance ? (
                    <>
                      <TableRowSkeleton cols={5} />
                      <TableRowSkeleton cols={5} />
                      <TableRowSkeleton cols={5} />
                    </>
                  ) : attendanceList.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-12 text-zinc-400">
                        No active students found in directory. Add students to begin marking attendance.
                      </td>
                    </tr>
                  ) : (
                    attendanceList.map((item) => {
                      const currentStatus = attendanceChanges[item.id] || 'PRESENT';

                      return (
                        <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition">
                          <td className="py-3 px-3 sm:px-4 font-mono text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                            #{item.rollno}
                          </td>
                          <td className="py-3 px-3 sm:px-4">
                            <div className="font-semibold text-zinc-900 dark:text-white">{item.name}</div>
                            <div className="text-[11px] text-zinc-500">{item.email}</div>
                          </td>
                          <td className="py-3 px-3 sm:px-4 text-xs font-medium text-zinc-600 dark:text-zinc-300">{item.subject}</td>
                          <td className="py-3 px-3 sm:px-4">
                            <div className="inline-flex rounded-xl p-1 bg-zinc-100 dark:bg-[#141414] border border-zinc-200 dark:border-zinc-800 gap-1">
                              <button
                                type="button"
                                onClick={() => handleToggleAttendance(item.id, 'PRESENT')}
                                className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition ${
                                  currentStatus === 'PRESENT'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400'
                                }`}
                              >
                                Present
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleAttendance(item.id, 'ABSENT')}
                                className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition ${
                                  currentStatus === 'ABSENT'
                                    ? 'bg-rose-600 text-white shadow-sm'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400'
                                }`}
                              >
                                Absent
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-3 sm:px-4">
                            <input
                              type="text"
                              placeholder="Optional remarks..."
                              value={attendanceRemarks[item.id] || ''}
                              onChange={(e) =>
                                setAttendanceRemarks((prev) => ({
                                  ...prev,
                                  [item.id]: e.target.value,
                                }))
                              }
                              className="text-xs px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-[#141414] text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full max-w-[180px]"
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: ATTENDANCE SUMMARY & PERCENTAGES */}
        {activeTab === 'summary' && (
          <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4 sm:space-y-6">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-white">Attendance Percentage Report</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Overview of student attendance percentages and class metrics
              </p>
            </div>

            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full text-left text-xs sm:text-sm min-w-[580px]">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                    <th className="py-3 px-3 sm:px-4">Roll</th>
                    <th className="py-3 px-3 sm:px-4">Student Name</th>
                    <th className="py-3 px-3 sm:px-4">Total</th>
                    <th className="py-3 px-3 sm:px-4">Present</th>
                    <th className="py-3 px-3 sm:px-4">Absent</th>
                    <th className="py-3 px-3 sm:px-4">Attendance %</th>
                    <th className="py-3 px-3 sm:px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                  {attendanceList.map((item) => {
                    const pct = item.attendancePercentage ?? 0;
                    const isGood = pct >= 75;
                    const isWarning = pct >= 60 && pct < 75;

                    return (
                      <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition">
                        <td className="py-3 px-3 sm:px-4 font-mono text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                          #{item.rollno}
                        </td>
                        <td className="py-3 px-3 sm:px-4 font-semibold text-zinc-900 dark:text-white">{item.name}</td>
                        <td className="py-3 px-3 sm:px-4 text-xs font-medium text-zinc-600 dark:text-zinc-400">{item.totalClasses}</td>
                        <td className="py-3 px-3 sm:px-4 text-xs font-semibold text-emerald-600 dark:text-emerald-400">{item.presentDays}</td>
                        <td className="py-3 px-3 sm:px-4 text-xs font-semibold text-rose-600 dark:text-rose-400">{item.absentDays}</td>
                        <td className="py-3 px-3 sm:px-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-20 sm:w-24 bg-zinc-200 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  isGood ? 'bg-emerald-500' : isWarning ? 'bg-amber-500' : 'bg-rose-500'
                                }`}
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{pct}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 sm:px-4">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              isGood
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                                : isWarning
                                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
                                : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20'
                            }`}
                          >
                            {isGood ? 'Eligible (>= 75%)' : isWarning ? 'Warning (< 75%)' : 'Critical (< 60%)'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: STUDENTS DIRECTORY (CRUD) */}
        {activeTab === 'students' && (
          <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-white">Student Directory</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Manage student accounts and credentials</p>
              </div>

              <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Filter students..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="text-xs px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-[#141414] text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-1 sm:w-60"
                />

                <button
                  type="button"
                  onClick={handleOpenAddModal}
                  className="whitespace-nowrap px-3.5 sm:px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 flex items-center space-x-1.5 transition active:scale-95"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add Student</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full text-left text-xs sm:text-sm min-w-[550px]">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                    <th className="py-3 px-3 sm:px-4">Roll</th>
                    <th className="py-3 px-3 sm:px-4">Full Name</th>
                    <th className="py-3 px-3 sm:px-4">Email</th>
                    <th className="py-3 px-3 sm:px-4">Course</th>
                    <th className="py-3 px-3 sm:px-4">Age</th>
                    <th className="py-3 px-3 sm:px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                  {loadingStudents ? (
                    <>
                      <TableRowSkeleton cols={6} />
                      <TableRowSkeleton cols={6} />
                      <TableRowSkeleton cols={6} />
                    </>
                  ) : filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-12 text-zinc-400">
                        No students matching search filter.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s) => (
                      <tr key={s.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition">
                        <td className="py-3 px-3 sm:px-4 font-mono font-semibold text-xs text-zinc-600 dark:text-zinc-400">
                          #{s.rollno}
                        </td>
                        <td className="py-3 px-3 sm:px-4 font-semibold text-zinc-900 dark:text-white">{s.name}</td>
                        <td className="py-3 px-3 sm:px-4 text-xs text-zinc-500">{s.email}</td>
                        <td className="py-3 px-3 sm:px-4 text-xs font-medium text-zinc-600 dark:text-zinc-300">{s.subject}</td>
                        <td className="py-3 px-3 sm:px-4 text-xs text-zinc-500">{s.age} yrs</td>
                        <td className="py-3 px-3 sm:px-4 text-right space-x-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(s)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-500/10 transition"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSoftDelete(s.id, s.name)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-500/10 transition"
                            title="Move to Trash"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleHardDelete(s.id, s.name)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition"
                            title="Delete Permanently"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: TRASH & ARCHIVE */}
        {activeTab === 'trash' && (
          <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4 sm:space-y-6">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-white">Trash / Archived Students</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Restore soft-deleted students or permanently remove them</p>
            </div>

            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full text-left text-xs sm:text-sm min-w-[500px]">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                    <th className="py-3 px-3 sm:px-4">Roll</th>
                    <th className="py-3 px-3 sm:px-4">Student Name</th>
                    <th className="py-3 px-3 sm:px-4">Email</th>
                    <th className="py-3 px-3 sm:px-4">Course</th>
                    <th className="py-3 px-3 sm:px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                  {deletedStudents.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-12 text-zinc-400">
                        Trash is empty. No archived students.
                      </td>
                    </tr>
                  ) : (
                    deletedStudents.map((s) => (
                      <tr key={s.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition">
                        <td className="py-3 px-3 sm:px-4 font-mono font-semibold text-xs text-zinc-500">
                          #{s.rollno}
                        </td>
                        <td className="py-3 px-3 sm:px-4 font-semibold text-zinc-800 dark:text-zinc-200">{s.name}</td>
                        <td className="py-3 px-3 sm:px-4 text-xs text-zinc-500">{s.email}</td>
                        <td className="py-3 px-3 sm:px-4 text-xs font-medium text-zinc-500">{s.subject}</td>
                        <td className="py-3 px-3 sm:px-4 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => handleRestore(s.id, s.name)}
                            className="px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition"
                          >
                            Restore
                          </button>
                          <button
                            type="button"
                            onClick={() => handleHardDelete(s.id, s.name)}
                            className="px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-700 dark:text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ADD / EDIT STUDENT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-[#0c0c0c] rounded-2xl sm:rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-5 sm:p-7 shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-slide-up">
            <h3 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white mb-1">
              {editingStudent ? 'Edit Student Record' : 'Add New Student'}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5">
              Enter the student details below. Default password is their Roll Number.
            </p>

            <form onSubmit={handleSaveStudent} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Sneha Patel"
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-[#141414] text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Roll Number</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.rollno}
                    onChange={(e) => setFormData({ ...formData, rollno: e.target.value })}
                    placeholder="e.g. 105"
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-[#141414] text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Age</label>
                  <input
                    type="number"
                    required
                    min="5"
                    max="100"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    placeholder="e.g. 21"
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-[#141414] text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. sneha@example.com"
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-[#141414] text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Subject / Course</label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g. Data Science"
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-[#141414] text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Login Password (leave blank to use Roll No)
                </label>
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Optional custom password"
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-[#141414] text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingStudent}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition flex items-center space-x-1.5 disabled:opacity-60"
                >
                  {savingStudent ? <Spinner size="xs" className="border-t-white" /> : null}
                  <span>{editingStudent ? 'Update Student' : 'Create Student'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
