let currentTab = 'active';
let activeStudents = [];
let deletedStudents = [];
let studentModalInstance = null;
let healthCheckTimer = null;

/**
 * Resolves the backend root URL using the following priority:
 * 1. User manual override stored in localStorage
 * 2. Injected window.__ENV__.BACKEND_URL (from Vercel build-env.js / env-config.js)
 * 3. Default Render URL when running on Vercel domain (*.vercel.app)
 * 4. Relative origin ("") for local development or direct backend hosting
 */
function getBackendUrl() {
    // 1. Manual user override
    const userCustom = localStorage.getItem('custom_backend_url');
    if (userCustom && userCustom.trim() !== '') {
        return userCustom.trim().replace(/\/+$/, '');
    }

    // 2. Injected environment variable via window.__ENV__
    if (window.__ENV__ && window.__ENV__.BACKEND_URL && window.__ENV__.BACKEND_URL.trim() !== '') {
        return window.__ENV__.BACKEND_URL.trim().replace(/\/+$/, '');
    }

    // 3. Fallback when deployed on Vercel
    if (window.location.hostname.includes('vercel.app')) {
        return 'https://crud-spring-boot-demo.onrender.com';
    }

    // 4. Same-origin relative path for local development
    return '';
}

function getApiBase() {
    const base = getBackendUrl();
    return base ? `${base}/api/students` : '/api/students';
}

function updateBackendUI() {
    const activeUrl = getBackendUrl() || `${window.location.origin}/api/students (same-origin)`;
    const saved = localStorage.getItem('custom_backend_url');
    const badgeEl = document.getElementById('apiStatusBadge');
    const activeBadgeEl = document.getElementById('activeBackendUrlBadge');

    if (activeBadgeEl) {
        activeBadgeEl.textContent = activeUrl;
    }

    if (badgeEl) {
        if (saved) {
            badgeEl.textContent = 'API: Custom';
        } else if (window.__ENV__ && window.__ENV__.BACKEND_URL) {
            badgeEl.textContent = 'API: Vercel Env';
        } else if (window.location.hostname.includes('vercel.app')) {
            badgeEl.textContent = 'API: Render (Default)';
        } else {
            badgeEl.textContent = 'API: Local';
        }
    }
}

async function loadRuntimeConfig() {
    // Try fetching runtime config from Vercel Serverless Function if __ENV__ is empty
    if (!window.__ENV__ || !window.__ENV__.BACKEND_URL) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            const res = await fetch('/api/config', { signal: controller.signal });
            clearTimeout(timeoutId);
            if (res.ok) {
                const data = await res.json();
                if (data && data.backendUrl) {
                    window.__ENV__ = window.__ENV__ || {};
                    window.__ENV__.BACKEND_URL = data.backendUrl;
                }
            }
        } catch (e) {
            // Expected in static or local environments
        }
    }
    updateBackendUI();
}

document.addEventListener('DOMContentLoaded', async () => {
    const modalEl = document.getElementById('studentModal');
    if (modalEl) {
        studentModalInstance = new bootstrap.Modal(modalEl);
    }

    const savedBackend = localStorage.getItem('custom_backend_url');
    const inputEl = document.getElementById('customBackendUrlInput');
    if (inputEl && savedBackend) {
        inputEl.value = savedBackend;
    }

    // Load any runtime config if needed
    await loadRuntimeConfig();

    // Fetch initial data
    fetchStudents();
    checkBackendHealth();

    // Search filter listener
    const searchEl = document.getElementById('searchInput');
    if (searchEl) {
        searchEl.addEventListener('input', (e) => {
            renderTable(e.target.value);
        });
    }

    // Periodic health check every 45 seconds
    healthCheckTimer = setInterval(checkBackendHealth, 45000);
});

function showToast(message, isError = false) {
    const toastEl = document.getElementById('liveToast');
    const toastMessage = document.getElementById('toastMessage');
    if (!toastEl || !toastMessage) return;

    toastEl.classList.remove('bg-success', 'bg-danger');
    toastEl.classList.add(isError ? 'bg-danger' : 'bg-success');

    toastMessage.innerHTML = `<i class="bi ${isError ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'} fs-5"></i> <span>${message}</span>`;

    const toast = new bootstrap.Toast(toastEl, { delay: 4000 });
    toast.show();
}

async function checkBackendHealth() {
    const healthUrl = getApiBase() + '/health';
    const statusEl = document.getElementById('backendStatusText');
    if (!statusEl) return;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(healthUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
            statusEl.textContent = 'Online';
            statusEl.className = 'fs-6 fw-bold text-success';
        } else {
            statusEl.textContent = 'Degraded';
            statusEl.className = 'fs-6 fw-bold text-warning';
        }
    } catch (e) {
        statusEl.textContent = 'Waking up / Standby';
        statusEl.className = 'fs-6 fw-bold text-secondary';
    }
}

async function fetchStudents(retryCount = 0) {
    const base = getApiBase();
    const tbody = document.getElementById('studentsTableBody');

    try {
        // Show waking-up notice if initial attempt takes time
        if (retryCount === 0 && tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-5 text-muted">
                        <div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                        Connecting to backend... <br>
                        <small class="text-secondary">(If Render backend is sleeping on free tier, waking up takes ~30-40s)</small>
                    </td>
                </tr>
            `;
        }

        const [activeRes, deletedRes] = await Promise.all([
            fetch(base),
            fetch(`${base}/deleted`)
        ]);

        if (!activeRes.ok) throw new Error(`HTTP ${activeRes.status} fetching active students`);

        activeStudents = await activeRes.json();
        deletedStudents = deletedRes.ok ? await deletedRes.json() : [];

        updateMetrics();
        renderTable();
        checkBackendHealth();
    } catch (err) {
        console.error('Fetch error:', err);

        // Auto retry up to 2 times for Render cold starts
        if (retryCount < 2) {
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center py-5 text-primary">
                            <div class="spinner-border text-primary mb-3" role="status"></div>
                            <div class="fw-semibold">Backend is waking up from idle...</div>
                            <small class="text-muted">Retrying connection (${retryCount + 1}/2)...</small>
                        </td>
                    </tr>
                `;
            }
            setTimeout(() => fetchStudents(retryCount + 1), 6000);
            return;
        }

        showToast('Error connecting to backend API: ' + err.message, true);
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-5 text-danger">
                        <i class="bi bi-exclamation-octagon fs-1 d-block mb-2"></i>
                        Could not connect to backend at <code>${base}</code>.<br>
                        <small class="text-muted d-block mt-2">
                            If your backend is deploying or sleeping on Render, please wait ~30 seconds and click Refresh.<br>
                            You can also update the backend URL in <strong>API Config</strong> above.
                        </small>
                        <button class="btn btn-sm btn-outline-primary mt-3" onclick="fetchStudents(0)">
                            <i class="bi bi-arrow-clockwise me-1"></i> Try Again
                        </button>
                    </td>
                </tr>
            `;
        }
    }
}

function updateMetrics() {
    const metricActive = document.getElementById('metricActiveCount');
    const metricDeleted = document.getElementById('metricDeletedCount');
    const tabActiveBadge = document.getElementById('tabActiveBadge');
    const tabDeletedBadge = document.getElementById('tabDeletedBadge');

    if (metricActive) metricActive.textContent = activeStudents.length;
    if (metricDeleted) metricDeleted.textContent = deletedStudents.length;
    if (tabActiveBadge) tabActiveBadge.textContent = activeStudents.length;
    if (tabDeletedBadge) tabDeletedBadge.textContent = deletedStudents.length;
}

function switchTab(tab) {
    currentTab = tab;
    const tabActive = document.getElementById('tabActive');
    const tabDeleted = document.getElementById('tabDeleted');
    if (tabActive) tabActive.classList.toggle('active', tab === 'active');
    if (tabDeleted) tabDeleted.classList.toggle('active', tab === 'deleted');
    renderTable();
}

function renderTable(filterQuery = '') {
    const searchInput = document.getElementById('searchInput');
    const query = (filterQuery || (searchInput ? searchInput.value : '') || '').toLowerCase().trim();
    const students = currentTab === 'active' ? activeStudents : deletedStudents;
    const tbody = document.getElementById('studentsTableBody');
    if (!tbody) return;

    const filtered = students.filter(s => {
        if (!query) return true;
        const name = (s.name || '').toLowerCase();
        const email = (s.email || '').toLowerCase();
        const subject = (s.subject || '').toLowerCase();
        const roll = String(s.rollno || '');
        return name.includes(query) || email.includes(query) || subject.includes(query) || roll.includes(query);
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-5 text-muted">
                    <i class="bi bi-inbox fs-1 d-block mb-2 text-secondary"></i>
                    ${currentTab === 'active' ? 'No active students found.' : 'No archived students in trash.'}
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map(student => {
        const initial = (student.name && student.name.length > 0) ? student.name.charAt(0).toUpperCase() : 'S';
        const isArchived = Boolean(student.deleted || student.isDeleted);

        return `
            <tr class="student-row">
                <td class="fw-semibold text-muted">#${student.id}</td>
                <td>
                    <div class="d-flex align-items-center gap-2">
                        <div class="rounded-circle bg-primary-subtle text-primary fw-bold d-flex align-items-center justify-content-center"
                             style="width: 36px; height: 36px; font-size: 0.85rem;">
                            ${initial}
                        </div>
                        <div>
                            <div class="fw-semibold">${escapeHtml(student.name)}</div>
                            <div class="text-muted small">${escapeHtml(student.email)}</div>
                        </div>
                    </div>
                </td>
                <td><span class="badge-roll">${student.rollno || '-'}</span></td>
                <td><span class="badge-subject">${escapeHtml(student.subject || 'General')}</span></td>
                <td>${student.age || '-'} yrs</td>
                <td>
                    ${isArchived 
                        ? '<span class="badge bg-danger-subtle text-danger border border-danger-subtle"><i class="bi bi-dash-circle me-1"></i>Archived</span>'
                        : '<span class="badge bg-success-subtle text-success border border-success-subtle"><i class="bi bi-check-circle me-1"></i>Active</span>'}
                </td>
                <td class="text-end">
                    ${currentTab === 'active' ? `
                        <div class="d-flex justify-content-end gap-1">
                            <button type="button" class="btn btn-sm btn-outline-primary" title="Edit" onclick="prepareEditModal(${student.id})">
                                <i class="bi bi-pencil-square"></i>
                            </button>
                            <button type="button" class="btn btn-sm btn-outline-warning" title="Move to Trash" onclick="softDeleteStudent(${student.id})">
                                <i class="bi bi-archive"></i>
                            </button>
                            <button type="button" class="btn btn-sm btn-outline-danger" title="Permanently Delete" onclick="hardDeleteStudent(${student.id})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    ` : `
                        <div class="d-flex justify-content-end gap-1">
                            <button type="button" class="btn btn-sm btn-outline-success" title="Restore" onclick="restoreStudent(${student.id})">
                                <i class="bi bi-arrow-counterclockwise"></i> Restore
                            </button>
                            <button type="button" class="btn btn-sm btn-outline-danger" title="Permanently Delete" onclick="hardDeleteStudent(${student.id})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    `}
                </td>
            </tr>
        `;
    }).join('');
}

function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function prepareCreateModal() {
    document.getElementById('studentId').value = '';
    document.getElementById('studentModalLabel').innerHTML = '<i class="bi bi-person-plus text-primary me-1"></i> Add New Student';
    document.getElementById('saveStudentBtn').textContent = 'Save Student';
    document.getElementById('studentName').value = '';
    document.getElementById('studentEmail').value = '';
    document.getElementById('studentRollno').value = '';
    document.getElementById('studentAge').value = '';
    document.getElementById('studentSubject').value = '';
}

function prepareEditModal(id) {
    const student = activeStudents.find(s => s.id === id);
    if (!student) return;

    document.getElementById('studentId').value = student.id;
    document.getElementById('studentModalLabel').innerHTML = '<i class="bi bi-pencil-square text-primary me-1"></i> Edit Student';
    document.getElementById('saveStudentBtn').textContent = 'Update Student';
    document.getElementById('studentName').value = student.name || '';
    document.getElementById('studentEmail').value = student.email || '';
    document.getElementById('studentRollno').value = student.rollno || '';
    document.getElementById('studentAge').value = student.age || '';
    document.getElementById('studentSubject').value = student.subject || '';

    studentModalInstance.show();
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('studentId').value;
    const isEdit = Boolean(id);

    const payload = {
        name: document.getElementById('studentName').value.trim(),
        email: document.getElementById('studentEmail').value.trim(),
        rollno: parseInt(document.getElementById('studentRollno').value, 10),
        age: parseInt(document.getElementById('studentAge').value, 10),
        subject: document.getElementById('studentSubject').value.trim()
    };

    const url = isEdit ? `${getApiBase()}/${id}` : getApiBase();
    const method = isEdit ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `HTTP ${res.status}`);
        }

        studentModalInstance.hide();
        showToast(isEdit ? 'Student record updated successfully!' : 'Student added successfully!');
        await fetchStudents();
    } catch (err) {
        showToast('Operation failed: ' + err.message, true);
    }
}

async function softDeleteStudent(id) {
    if (!confirm('Soft-delete this student? You can restore later from Trash.')) return;
    try {
        const res = await fetch(`${getApiBase()}/${id}/soft-delete`, { method: 'PATCH' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        showToast('Student moved to trash.');
        await fetchStudents();
    } catch (err) {
        showToast('Failed to soft-delete: ' + err.message, true);
    }
}

async function restoreStudent(id) {
    try {
        const res = await fetch(`${getApiBase()}/${id}/restore`, { method: 'PATCH' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        showToast('Student restored to active list!');
        await fetchStudents();
    } catch (err) {
        showToast('Failed to restore student: ' + err.message, true);
    }
}

async function hardDeleteStudent(id) {
    if (!confirm('Permanently delete this student from the database? This cannot be undone.')) return;
    try {
        const res = await fetch(`${getApiBase()}/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        showToast('Student permanently deleted.');
        await fetchStudents();
    } catch (err) {
        showToast('Failed to delete student: ' + err.message, true);
    }
}

function saveBackendUrl() {
    const input = document.getElementById('customBackendUrlInput');
    const val = input ? input.value.trim() : '';

    if (val) {
        localStorage.setItem('custom_backend_url', val);
    } else {
        localStorage.removeItem('custom_backend_url');
    }

    const modalEl = document.getElementById('settingsModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();

    updateBackendUI();
    showToast('Backend configuration saved.');
    fetchStudents(0);
    checkBackendHealth();
}

function resetBackendUrl() {
    localStorage.removeItem('custom_backend_url');
    const input = document.getElementById('customBackendUrlInput');
    if (input) input.value = '';
    saveBackendUrl();
}
