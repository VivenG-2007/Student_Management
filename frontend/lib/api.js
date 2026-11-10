// API Client for Spring Boot Backend

export function getApiBaseUrl() {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('custom_backend_url');
    if (custom && custom.trim() !== '') {
      return custom.trim().replace(/\/+$/, '');
    }
  }

  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/+$/, '');
  }

  // Sensible default Render URL
  return 'https://crud-spring-boot-demo.onrender.com';
}

async function request(endpoint, options = {}) {
  const base = getApiBaseUrl();
  const url = `${base}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errMessage = `HTTP ${response.status}`;
    try {
      const errData = await response.json();
      if (errData && errData.error) errMessage = errData.error;
      else if (errData && errData.message) errMessage = errData.message;
    } catch (e) {}
    throw new Error(errMessage);
  }

  // Handle empty responses (like 204 or void return)
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  }
  return null;
}

export const api = {
  // Auth API
  login: async (role, username, password) => {
    return await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ role, username, password }),
    });
  },

  // Student Attendance Summary
  getStudentAttendanceSummary: async (studentId) => {
    return await request(`/api/attendance/student/${studentId}/summary`);
  },

  // Admin Attendance Overview for a date
  getAttendanceOverview: async (date) => {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    return await request(`/api/attendance/overview${query}`);
  },

  // Mark Batch Attendance
  saveBatchAttendance: async (date, entries) => {
    return await request('/api/attendance/batch', {
      method: 'POST',
      body: JSON.stringify({ date, entries, markedBy: 'admin' }),
    });
  },

  // Student CRUD APIs
  getStudents: async () => {
    return await request('/api/students');
  },

  getDeletedStudents: async () => {
    return await request('/api/students/deleted');
  },

  createStudent: async (studentData) => {
    return await request('/api/students', {
      method: 'POST',
      body: JSON.stringify(studentData),
    });
  },

  updateStudent: async (id, studentData) => {
    return await request(`/api/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(studentData),
    });
  },

  softDeleteStudent: async (id) => {
    return await request(`/api/students/${id}/soft-delete`, {
      method: 'PATCH',
    });
  },

  restoreStudent: async (id) => {
    return await request(`/api/students/${id}/restore`, {
      method: 'PATCH',
    });
  },

  deleteStudentPermanently: async (id) => {
    return await request(`/api/students/${id}`, {
      method: 'DELETE',
    });
  },

  // Health check
  checkHealth: async () => {
    return await request('/api/students/health');
  },
};
