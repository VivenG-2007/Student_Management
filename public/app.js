// State Management
let currentTab = 'active';
let activeStudents = [];
let deletedStudents = [];
let studentModalInstance = null;
let healthCheckTimer = null;
let searchDebounceTimer = null;

const CACHE_KEY_ACTIVE = 'cached_active_students';
const CACHE_KEY_DELETED = 'cached_deleted_students';

/**
 * Resolves the backend root URL using the following priority:
 * 1. User manual override stored in localStorage
 * 2. Injected window.__ENV__.BACKEND_URL (from Vercel build-env.js / env-config.js)
 * 3. Default Render URL when running on Vercel domain (*.vercel.app)
 * 4. Relative origin ("") for local development or direct backend hosting
 */
function getBackendUrl() {
    const userCustom = localStorage.getItem('custom_backend_url');
    if (userCustom && userCustom.trim() !== '') {
        return userCustom.trim().replace(/\/+$/, '');
    }

    if (window.__ENV__ && window.__ENV__.BACKEND_URL && window.__ENV__.BACKEND_URL.trim() !== '') {
        return window.__ENV__.BACKEND_URL.trim().replace(/\/+$/, '');
    }

    if (window.location.hostname.includes('vercel.app')) {
        return 'https://crud-spring-boot-demo.onrender.com';
    }

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

/**
 * Stale-While-Revalidate: Loads cached data instantly (0ms) from localStorage
 */
function loadCachedData() {
    try {
        const cachedActive = localStorage.getItem(CACHE_KEY_ACTIVE);
        const cachedDeleted = localStorage.getItem(CACHE_KEY_DELETED);
        if (cachedActive) activeStudents = JSON.parse(cachedActive);
        if (cachedDeleted) deletedStudents = JSON.parse(cachedDeleted);

        if (activeStudents.length > 0 || deletedStudents.length > 0) {
            updateMetrics();
            renderTable();
        }
    } catch (e) {
        console.warn('Cache load warning:', e);
    }
}

function saveCache() {
    try {
        localStorage.setItem(CACHE_KEY_ACTIVE, JSON.stringify(activeStudents));
        localStorage.setItem(CACHE_KEY_DELETED, JSON.stringify(deletedStudents));
    } catch (e) {}
}

/**
 * Non-blocking background runtime configuration check
 */
async function loadRuntimeConfig() {
    if (!window.__ENV__ || !window.__ENV__.BACKEND_URL) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1500);
            const res = await fetch('/api/config', { signal: controller.signal });
            clearTimeout(timeoutId);
            if (res.ok) {
                const data = await res.json();
                if (data && data.backendUrl) {
                    window.__ENV__ = window.__ENV__ || {};
                    window.__ENV__.BACKEND_URL = data.backendUrl;
                    updateBackendUI();
                }
            }
        } catch (e) {
            // Expected in pure static environments
        }
    }
}

// Fast DOM Initialization
document.addEventListener('DOMContentLoaded', () => {
    const modalEl = document.getElementById('studentModal');
    if (modalEl) {
        studentModalInstance = new bootstrap.Modal(modalEl);
    }

    const savedBackend = localStorage.getItem('custom_backend_url');
    const inputEl = document.getElementById('customBackendUrlInput');
    if (inputEl && savedBackend) {
        inputEl.value = savedBackend;
    }

    updateBackendUI();

    // 1. INSTANT FIRST RENDER: Render cached data in 0ms
    loadCachedData();

    // 2. FETCH IN PARALLEL: Asynchronously revalidate from backend
    fetchStudents();
    checkBackendHealth();

    // 3. NON-BLOCKING: Check runtime config in background
    loadRuntimeConfig();

    // 4. FAST SEARCH: Ultra-responsive input with micro-debouncing
    const searchEl = document.getElementById('searchInput');
    if (searchEl) {
        searchEl.addEventListener('input', (e) => {
            clearTimeout(searchDebounceTimer);
            searchDebounceTimer = setTimeout(() => {
                requestAnimationFrame(() => renderTable(e.target.value));
            }, 30);
        });
    }

    // Periodic health check
    healthCheckTimer = setInterval(checkBackendHealth, 45000);
});

function showToast(message, isError = false) {
    const toastEl = document.getElementById('liveToast');
    const toastMessage = document.getElementById('toastMessage');
    if (!toastEl || !toastMessage) return;

    toastEl.classList.remove('bg-success', 'bg-danger');
    toastEl.classList.add(isError ? 'bg-danger' : 'bg-success');

    toastMessage.innerHTML = `<i class="bi ${isError ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'} fs-5"></i> <span>${message}</span>`;

    const toast = new bootstrap.Toast(toastEl, { delay: 3500 });
    toast.show();
}

async function checkBackendHealth() {
    const healthUrl = getApiBase() + '/health';
    const statusEl = document.getElementById('backendStatusText');
    if (!statusEl) return;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
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

    // Only show full loading spinner if cache is empty
    const hasData = activeStudents.length > 0 || deletedStudents.length > 0;
    if (!hasData && retryCount === 0 && tbody) {
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

    try {
        const [activeRes, deletedRes] = await Promise.all([
            fetch(base),
            fetch(`${base}/deleted`)
        ]);

        if (!activeRes.ok) throw new Error(`HTTP ${activeRes.status} fetching active students`);

        activeStudents = await activeRes.json();
        deletedStudents = deletedRes.ok ? await deletedRes.json() : [];

        // Save fresh data to cache & update UI instantly
        saveCache();
        updateMetrics();
        renderTable();
        checkBackendHealth();
    } catch (err) {
        console.warn('Fetch error:', err);

        // Auto retry up to 2 times for Render cold starts
        if (retryCount < 2) {
            if (!hasData && tbody) {
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

        // If we already had cached data displayed, don't destroy the view, just notify
        if (hasData) {
            showToast('Backend is currently offline or sleeping. Showing cached records.', true);
        } else {
            showToast('Error connecting to backend API: ' + err.message, true);
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center py-5 text-danger">
                            <i class="bi bi-exclamation-octagon fs-1 d-block mb-2"></i>
                            Could not connect to backend at <code>${base}</code>.<br>
                            <small class="text-muted d-block mt-2">
                                If your backend is sleeping on Render, please wait ~30 seconds and click Refresh.<br>
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
}

function updateMetrics() {
    const metricActive = document.getElementById('metricActiveCount');
    const metricDeleted = document.getElementById('metricDeletedCount');
    const tabActiveBadge = document.getElementById('tabActiveBadge');
    const tabDeletedBadge = document.getElementById('tabDeletedBadge');

    const activeCount = activeStudents.length;
    const deletedCount = deletedStudents.length;

    if (metricActive) metricActive.textContent = activeCount;
    if (metricDeleted) metricDeleted.textContent = deletedCount;
    if (tabActiveBadge) tabActiveBadge.textContent = activeCount;
    if (tabDeletedBadge) tabDeletedBadge.textContent = deletedCount;
}

function switchTab(tab) {
    if (currentTab === tab) return;
    currentTab = tab;
    const tabActive = document.getElementById('tabActive');
    const tabDeleted = document.getElementById('tabDeleted');
    if (tabActive) tabActive.classList.toggle('active', tab === 'active');
    if (tabDeleted) tabDeleted.classList.toggle('active', tab === 'deleted');
    requestAnimationFrame(() => renderTable());
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

    const html = filtered.map(student => {
        const initial = (student.name && student.name.length > 0) ? student.name.charAt(0).toUpperCase() : 'S';
        const isArchived = Boolean(student.deleted || student.isDeleted);
        const isPending = Boolean(student._pending);

        return `
            <tr class="student-row ${isPending ? 'opacity-75' : ''}">
                <td class="fw-semibold text-muted">#${student.id || '...'}</td>
                <td>
                    <div class="d-flex align-items-center gap-2">
                        <div class="rounded-circle bg-primary-subtle text-primary fw-bold d-flex align-items-center justify-content-center"
                             style="width: 36px; height: 36px; font-size: 0.85rem;">
                            ${initial}
                        </div>
                        <div>
                            <div class="fw-semibold">
                                ${escapeHtml(student.name)}
                                ${isPending ? '<span class="badge bg-secondary-subtle text-secondary ms-1 small">Syncing...</span>' : ''}
                            </div>
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

    tbody.innerHTML = html;
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

/**
 * OPTIMISTIC FORM SUBMISSION:
 * Updates the UI immediately (0ms) and syncs in background.
 */
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

    // Close modal immediately for instant responsiveness
    if (studentModalInstance) {
        studentModalInstance.hide();
    }

    let originalStudent = null;
    let tempId = null;

    if (isEdit) {
        const numId = parseInt(id, 10);
        const index = activeStudents.findIndex(s => s.id === numId);
        if (index !== -1) {
            originalStudent = { ...activeStudents[index] };
            activeStudents[index] = { ...originalStudent, ...payload, id: numId };
        }
        showToast('Updating student record...');
    } else {
        tempId = Date.now();
        const optimisticStudent = { ...payload, id: tempId, _pending: true };
        activeStudents.unshift(optimisticStudent);
        showToast('Adding new student...');
    }

    // Render table & metrics instantly (0ms)
    updateMetrics();
    renderTable();
    saveCache();

    // Background network sync
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

        const serverData = await res.json();

        if (!isEdit && serverData && serverData.id) {
            // Replace temp optimistic student with real server record
            const idx = activeStudents.findIndex(s => s.id === tempId);
            if (idx !== -1) {
                activeStudents[idx] = serverData;
            }
        }

        showToast(isEdit ? 'Student record updated!' : 'Student added successfully!');
        saveCache();
        renderTable();
    } catch (err) {
        // Rollback on failure
        if (isEdit && originalStudent) {
            const idx = activeStudents.findIndex(s => s.id === parseInt(id, 10));
            if (idx !== -1) activeStudents[idx] = originalStudent;
        } else if (!isEdit && tempId) {
            activeStudents = activeStudents.filter(s => s.id !== tempId);
        }
        updateMetrics();
        renderTable();
        saveCache();
        showToast('Operation failed: ' + err.message, true);
    }
}

/**
 * OPTIMISTIC SOFT DELETE:
 * Moves student from active to deleted instantly (0ms)
 */
async function softDeleteStudent(id) {
    if (!confirm('Soft-delete this student? You can restore later from Trash.')) return;

    const numId = parseInt(id, 10);
    const index = activeStudents.findIndex(s => s.id === numId);
    if (index === -1) return;

    const [deletedItem] = activeStudents.splice(index, 1);
    deletedItem.deleted = true;
    deletedStudents.unshift(deletedItem);

    // Instant UI update
    updateMetrics();
    renderTable();
    saveCache();
    showToast('Student moved to trash.');

    // Background API call
    try {
        const res = await fetch(`${getApiBase()}/${numId}/soft-delete`, { method: 'PATCH' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
        // Rollback
        deletedStudents = deletedStudents.filter(s => s.id !== numId);
        deletedItem.deleted = false;
        activeStudents.splice(index, 0, deletedItem);
        updateMetrics();
        renderTable();
        saveCache();
        showToast('Failed to soft-delete: ' + err.message, true);
    }
}

/**
 * OPTIMISTIC RESTORE:
 * Restores student from trash to active instantly (0ms)
 */
async function restoreStudent(id) {
    const numId = parseInt(id, 10);
    const index = deletedStudents.findIndex(s => s.id === numId);
    if (index === -1) return;

    const [restoredItem] = deletedStudents.splice(index, 1);
    restoredItem.deleted = false;
    activeStudents.unshift(restoredItem);

    // Instant UI update
    updateMetrics();
    renderTable();
    saveCache();
    showToast('Student restored to active list!');

    // Background API call
    try {
        const res = await fetch(`${getApiBase()}/${numId}/restore`, { method: 'PATCH' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
        // Rollback
        activeStudents = activeStudents.filter(s => s.id !== numId);
        restoredItem.deleted = true;
        deletedStudents.splice(index, 0, restoredItem);
        updateMetrics();
        renderTable();
        saveCache();
        showToast('Failed to restore: ' + err.message, true);
    }
}

/**
 * OPTIMISTIC PERMANENT DELETE:
 * Removes student immediately (0ms)
 */
async function hardDeleteStudent(id) {
    if (!confirm('Permanently delete this student from the database? This cannot be undone.')) return;

    const numId = parseInt(id, 10);
    const activeIdx = activeStudents.findIndex(s => s.id === numId);
    const deletedIdx = deletedStudents.findIndex(s => s.id === numId);

    let removedItem = null;
    let wasActive = true;
    let originalIdx = 0;

    if (activeIdx !== -1) {
        [removedItem] = activeStudents.splice(activeIdx, 1);
        originalIdx = activeIdx;
        wasActive = true;
    } else if (deletedIdx !== -1) {
        [removedItem] = deletedStudents.splice(deletedIdx, 1);
        originalIdx = deletedIdx;
        wasActive = false;
    } else {
        return;
    }

    // Instant UI update
    updateMetrics();
    renderTable();
    saveCache();
    showToast('Student permanently deleted.');

    // Background API call
    try {
        const res = await fetch(`${getApiBase()}/${numId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
        // Rollback
        if (wasActive) {
            activeStudents.splice(originalIdx, 0, removedItem);
        } else {
            deletedStudents.splice(originalIdx, 0, removedItem);
        }
        updateMetrics();
        renderTable();
        saveCache();
        showToast('Failed to permanently delete: ' + err.message, true);
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
