let currentTab = 'active';
let activeStudents = [];
let deletedStudents = [];
let studentModalInstance = null;

function getApiBase() {
    const custom = localStorage.getItem('custom_backend_url');
    if (custom && custom.trim() !== '') {
        return custom.trim().replace(/\/+$/, '') + '/api/students';
    }
    return '/api/students';
}

document.addEventListener('DOMContentLoaded', () => {
    studentModalInstance = new bootstrap.Modal(document.getElementById('studentModal'));
    
    const savedBackend = localStorage.getItem('custom_backend_url');
    if (savedBackend) {
        document.getElementById('customBackendUrlInput').value = savedBackend;
        document.getElementById('apiStatusBadge').textContent = 'Connected (Custom)';
    }

    fetchStudents();
    checkBackendHealth();

    document.getElementById('searchInput').addEventListener('input', (e) => {
        renderTable(e.target.value);
    });
});

function showToast(message, isError = false) {
    const toastEl = document.getElementById('liveToast');
    const toastMessage = document.getElementById('toastMessage');
    
    toastEl.classList.remove('bg-success', 'bg-danger');
    toastEl.classList.add(isError ? 'bg-danger' : 'bg-success');
    
    toastMessage.innerHTML = `<i class="bi ${isError ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'} fs-5"></i> <span>${message}</span>`;
    
    const toast = new bootstrap.Toast(toastEl, { delay: 3500 });
    toast.show();
}

async function checkBackendHealth() {
    const healthUrl = getApiBase() + '/health';
    const statusEl = document.getElementById('backendStatusText');
    try {
        const res = await fetch(healthUrl);
        if (res.ok) {
            statusEl.textContent = 'Online';
            statusEl.className = 'fs-6 fw-bold text-success';
        } else {
            statusEl.textContent = 'Degraded';
            statusEl.className = 'fs-6 fw-bold text-warning';
        }
    } catch (e) {
        statusEl.textContent = 'Connecting...';
        statusEl.className = 'fs-6 fw-bold text-secondary';
    }
}

async function fetchStudents() {
    const base = getApiBase();
    try {
        const [activeRes, deletedRes] = await Promise.all([
            fetch(base),
            fetch(`${base}/deleted`)
        ]);

        if (!activeRes.ok) throw new Error(`HTTP ${activeRes.status} fetching active students`);
        
        activeStudents = await activeRes.json();
        deletedStudents = deletedRes.ok ? await deletedRes.json() : [];

        updateMetrics();
        renderTable();
    } catch (err) {
        console.error('Fetch error:', err);
        showToast('Error connecting to backend API: ' + err.message, true);
        const tbody = document.getElementById('studentsTableBody');
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-5 text-danger">
                    <i class="bi bi-exclamation-octagon fs-1 d-block mb-2"></i>
                    Could not connect to backend at <code>${getApiBase()}</code>.<br>
                    <small class="text-muted">Ensure Spring Boot is running, or set your Render backend URL in API Config.</small>
                </td>
            </tr>
        `;
    }
}

function updateMetrics() {
    document.getElementById('metricActiveCount').textContent = activeStudents.length;
    document.getElementById('metricDeletedCount').textContent = deletedStudents.length;
    document.getElementById('tabActiveBadge').textContent = activeStudents.length;
    document.getElementById('tabDeletedBadge').textContent = deletedStudents.length;
}

function switchTab(tab) {
    currentTab = tab;
    document.getElementById('tabActive').classList.toggle('active', tab === 'active');
    document.getElementById('tabDeleted').classList.toggle('active', tab === 'deleted');
    renderTable();
}

function renderTable(filterQuery = '') {
    const query = (filterQuery || document.getElementById('searchInput').value || '').toLowerCase().trim();
    const students = currentTab === 'active' ? activeStudents : deletedStudents;
    const tbody = document.getElementById('studentsTableBody');

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
        const isArchived = student.deleted || student.isDeleted;

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
    const val = document.getElementById('customBackendUrlInput').value.trim();
    if (val) {
        localStorage.setItem('custom_backend_url', val);
        document.getElementById('apiStatusBadge').textContent = 'Custom API';
    } else {
        localStorage.removeItem('custom_backend_url');
        document.getElementById('apiStatusBadge').textContent = 'Default API';
    }
    const modalEl = document.getElementById('settingsModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();
    showToast('Backend configuration updated.');
    fetchStudents();
    checkBackendHealth();
}

function resetBackendUrl() {
    localStorage.removeItem('custom_backend_url');
    document.getElementById('customBackendUrlInput').value = '';
    saveBackendUrl();
}

