feather.replace();

// ─── Config ───
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:';
const API_BASE = isLocal ? 'http://127.0.0.1:5000' : 'https://projexa-backend.onrender.com';

// ─── Auth ───
if (sessionStorage.getItem('adminAuth') !== 'true') window.location.href = 'AdminLogin.html';
const adminDept = sessionStorage.getItem('adminDept') || '';

// Set displayed department
document.addEventListener('DOMContentLoaded', () => {
    if(adminDept) document.getElementById('displayDept').textContent = adminDept;
});

function logout() { 
    sessionStorage.removeItem('adminAuth'); 
    sessionStorage.removeItem('adminDept'); 
    window.location.href = 'AdminLogin.html'; 
}

// ─── State ───
let currentYear = null;
let currentSection = 'A'; // Default section
let students = [];
let displayedStudents = [];

// ═══════════════════════════════════════
//  FOLDER NAVIGATION
// ═══════════════════════════════════════

function openYear(year) {
    currentYear = year;
    document.getElementById('landing').style.display = 'none';
    const fv = document.getElementById('folderView');
    fv.classList.add('active');

    const blueColor = '#2563eb';
    document.getElementById('sectionDot').style.background = blueColor;
    document.getElementById('sectionTitle').textContent = `${year}${year == 1 ? 'st' : year == 2 ? 'nd' : year == 3 ? 'rd' : 'th'} Year - Section ${currentSection}`;
    document.getElementById('sectionSub').textContent = `Manage ${adminDept} Year ${year} Section ${currentSection} records`;

    fetchStudents();
}

function changeSection(sec) {
    currentSection = sec;
    
    // Highlight active button
    ['A','B','C','D','E'].forEach(s => {
        const btn = document.getElementById('btn_sec_' + s);
        if(btn) {
            if(s === sec) {
                btn.classList.remove('btn-outline');
                btn.classList.add('btn-primary');
            } else {
                btn.classList.add('btn-outline');
                btn.classList.remove('btn-primary');
            }
        }
    });

    document.getElementById('sectionTitle').textContent = `${currentYear}${currentYear == 1 ? 'st' : currentYear == 2 ? 'nd' : currentYear == 3 ? 'rd' : 'th'} Year - Section ${currentSection}`;
    document.getElementById('sectionSub').textContent = `Manage ${adminDept} Year ${currentYear} Section ${currentSection} records`;
    fetchStudents();
}

function closeFolder() {
    document.getElementById('folderView').classList.remove('active');
    document.getElementById('landing').style.display = 'block';
    currentYear = null;
    currentSection = 'A';
    students = [];
    displayedStudents = [];
    document.getElementById('searchInput').value = '';
}

// ═══════════════════════════════════════
//  DATA FETCHING
// ═══════════════════════════════════════

async function fetchStudents() {
    document.getElementById('loadingState').style.display = 'block';
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('tableBody').innerHTML = '';

    try {
        const res = await fetch(`${API_BASE}/students?class=${currentSection}&department=${adminDept}&year=${currentYear}&t=${Date.now()}`, {
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' }
        });
        if (!res.ok) throw new Error('Server error ' + res.status);
        const data = await res.json();
        students = Array.isArray(data) ? data : [];
        handleSearch();
    } catch (err) {
        console.error('Fetch error:', err);
        document.getElementById('emptyState').style.display = 'block';
        document.getElementById('emptyState').querySelector('h3').textContent = 'Connection failed';
        document.getElementById('emptyState').querySelector('p').textContent = 'Ensure the backend is running at ' + API_BASE;
    }
    document.getElementById('loadingState').style.display = 'none';
}

// ═══════════════════════════════════════
//  SEARCH & RENDER
// ═══════════════════════════════════════

function handleSearch() {
    const q = (document.getElementById('searchInput').value || '').toLowerCase().trim();
    displayedStudents = students.filter(s => {
        if (!q) return true;
        return (s.name || '').toLowerCase().includes(q)
            || (s.reg_no || '').toLowerCase().includes(q)
            || (s.project_title || '').toLowerCase().includes(q)
            || (s.email || '').toLowerCase().includes(q);
    });
    renderTable();
    updateStats();
}

function renderTable() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';

    if (displayedStudents.length === 0) {
        document.getElementById('emptyState').style.display = 'block';
        return;
    }
    document.getElementById('emptyState').style.display = 'none';

    displayedStudents.forEach(s => {
        const initials = (s.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
        const status = (s.review_status || 'Pending').trim();
        let badgeClass = 'pending';
        if (status === 'Approved') badgeClass = 'approved';
        else if (status === 'Needs Correction') badgeClass = 'correction';

        const safeReg = (s.reg_no || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;');
        const avatarClass = currentSection === 'A' ? 'a' : 'b';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><div class="profile-cell"><div class="avatar ${avatarClass}">${initials}</div><div class="profile-info"><h4>${s.name || 'Unknown'}</h4><p>${s.email || '—'}</p></div></div></td>
            <td style="font-weight:600; font-family:monospace; font-size:13px;">${s.reg_no || '—'}</td>
            <td><div style="font-weight:600;">${s.project_title || '—'}</div><div style="font-size:12px; color:var(--text-muted);">${s.technology_used || ''}</div></td>
            <td>${s.department || '—'}</td>
            <td><span class="badge ${badgeClass}">${status}</span></td>
            <td style="text-align:right;">
                <button class="btn-icon" title="Edit" onclick="openEditModal('${safeReg}')"><i data-feather="edit-2" style="width:16px;"></i></button>
                <button class="btn-icon danger" title="Delete" onclick="deleteStudent('${safeReg}')"><i data-feather="trash-2" style="width:16px;"></i></button>
            </td>`;
        tbody.appendChild(tr);
    });
    feather.replace();
}

function updateStats() {
    document.getElementById('statTotal').textContent = students.length;
    document.getElementById('statApproved').textContent = students.filter(s => (s.review_status || '').trim() === 'Approved').length;
    document.getElementById('statPending').textContent = students.filter(s => (s.review_status || '').trim() !== 'Approved').length;
}

// ═══════════════════════════════════════
//  MODAL (CREATE / EDIT)
// ═══════════════════════════════════════

const formFields = ['reg_no','name','email','phone','department','year','class_section','review_status','project_title','technology_used','team_guide','team_name','team_size','project_domain','project_description','paper_published','journal_name','isbn_no','journal_type','report_submission','ee_sem1_mark','ee_sem2_mark','ee_sem3_mark','other_projects'];

function resetForm() {
    const form = document.getElementById('studentForm');
    if(form) form.reset();
    document.getElementById('editRegNo').value = '';
    const fileSection = document.getElementById('fileSection');
    if(fileSection) fileSection.style.display = 'none';
    const fvg = document.getElementById('fileViewerGroup');
    if(fvg) fvg.style.display = 'none';
    const wvg = document.getElementById('weeklyViewerGroup');
    if(wvg) wvg.style.display = 'none';
}

function openCreateModal() {
    resetForm();
    document.getElementById('modalTitle').textContent = 'Add Student';
    document.getElementById('saveBtn').textContent = 'Create Record';
    document.getElementById('f_reg_no').removeAttribute('readonly');
    if(adminDept) document.getElementById('f_department').value = adminDept;
    if(currentYear) document.getElementById('f_year').value = currentYear;
    if(currentSection) document.getElementById('f_class_section').value = currentSection;
    document.getElementById('modalOverlay').classList.add('active');
}

async function openEditModal(regNo) {
    resetForm();
    document.getElementById('modalTitle').textContent = 'Edit Student';
    document.getElementById('saveBtn').textContent = 'Save Changes';
    document.getElementById('f_reg_no').setAttribute('readonly', true);

    try {
        const res = await fetch(`${API_BASE}/student/${encodeURIComponent(regNo)}`);
        if (!res.ok) throw new Error('Not found');
        const s = await res.json();

        document.getElementById('editRegNo').value = regNo;

        // Map backend keys to form fields
        const map = {
            reg_no: s.reg_no, name: s.name, email: s.email, phone: s.phone,
            department: s.department, review_status: s.review_status,
            project_title: s.project_title, technology_used: s.technology_used,
            team_guide: s.team_guide, team_name: s.team_name, team_size: s.team_size,
            project_domain: s.project_domain, project_description: s.project_description,
            paper_published: s.paper_published, journal_name: s.journal_name,
            isbn_no: s.isbn_no, journal_type: s.journal_type,
            report_submission: s.report_submission,
            ee_sem1_mark: s.ee_sem1_grade, ee_sem2_mark: s.ee_sem2_grade, ee_sem3_mark: s.ee_sem3_grade,
            other_projects: s.other_projects, year: s.year, class_section: s.class_section
        };

        for (const [key, val] of Object.entries(map)) {
            const el = document.getElementById('f_' + key);
            if (el) el.value = val || '';
        }

        // File viewer
        if (s.file_name) {
            const fs = document.getElementById('fileSection');
            if(fs) fs.style.display = 'block';
            const fvGroup = document.getElementById('fileViewerGroup');
            if(fvGroup) fvGroup.style.display = 'block';
            const fv = document.getElementById('fileViewer');
            if(fv) fv.innerHTML = `<a class="file-link" href="${API_BASE}/uploads/${encodeURIComponent(s.file_name)}" target="_blank"><i data-feather="file-text" style="width:12px;"></i> ${s.file_name}</a>`;
        }

        // Weekly abstracts
        if (s.weekly_abstracts && s.weekly_abstracts.length > 0) {
            const fs = document.getElementById('fileSection');
            if(fs) fs.style.display = 'block';
            const wvGroup = document.getElementById('weeklyViewerGroup');
            if(wvGroup) wvGroup.style.display = 'block';
            const container = document.getElementById('weeklyViewer');
            if(container) {
                container.innerHTML = '';
                s.weekly_abstracts.sort((a, b) => a.week - b.week).forEach(wa => {
                    container.innerHTML += `<a class="file-link" href="${API_BASE}/uploads/${encodeURIComponent(wa.file_name)}" target="_blank"><i data-feather="file" style="width:12px;"></i> Week ${wa.week}</a>`;
                });
            }
        }

        feather.replace();
        document.getElementById('modalOverlay').classList.add('active');
    } catch (err) {
        alert('Failed to load student data: ' + err.message);
    }
}

function closeModal() { document.getElementById('modalOverlay').classList.remove('active'); }

async function handleFormSubmit(e) {
    e.preventDefault();
    const editId = document.getElementById('editRegNo').value;
    const regNo = document.getElementById('f_reg_no').value.trim();
    if (!regNo) { alert('Register Number is required.'); return false; }
    if (!document.getElementById('f_name').value.trim()) { alert('Student Name is required.'); return false; }

    const payload = {};
    const fieldMap = {
        reg_no: 'f_reg_no', name: 'f_name', email: 'f_email', phone: 'f_phone',
        department: 'f_department', year: 'f_year', class_section: 'f_class_section',
        review_status: 'f_review_status',
        project_title: 'f_project_title', technology_used: 'f_technology_used',
        team_guide: 'f_team_guide', team_name: 'f_team_name', team_size: 'f_team_size',
        project_domain: 'f_project_domain', project_description: 'f_project_description',
        paper_published: 'f_paper_published', journal_name: 'f_journal_name',
        isbn_no: 'f_isbn_no', journal_type: 'f_journal_type',
        report_submission: 'f_report_submission',
        ee_sem1_grade: 'f_ee_sem1_mark', ee_sem2_grade: 'f_ee_sem2_mark', ee_sem3_grade: 'f_ee_sem3_mark',
        other_projects: 'f_other_projects'
    };

    for (const [key, elId] of Object.entries(fieldMap)) {
        payload[key] = document.getElementById(elId).value.trim();
    }

    try {
        const url = editId ? `${API_BASE}/update/${encodeURIComponent(editId)}` : `${API_BASE}/admin_create`;
        const method = editId ? 'PUT' : 'POST';
        const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (res.ok) { closeModal(); await fetchStudents(); }
        else { const err = await res.json().catch(() => ({})); alert('Error: ' + (err.error || res.statusText)); }
    } catch (err) { alert('Network error: ' + err.message); }
    return false;
}

// ═══════════════════════════════════════
//  DELETE
// ═══════════════════════════════════════

async function deleteStudent(regNo) {
    if (!confirm('Permanently delete this student record?')) return;
    try {
        const res = await fetch(`${API_BASE}/delete/${encodeURIComponent(regNo)}`, { method: 'DELETE' });
        if (!res.ok) { const err = await res.json().catch(() => ({})); alert('Delete failed: ' + (err.error || res.statusText)); }
        await fetchStudents();
    } catch (err) { alert('Network error: ' + err.message); }
}

// ═══════════════════════════════════════
//  EXPORT CSV
// ═══════════════════════════════════════

function exportCSV() {
    if (students.length === 0) { alert('No data to export.'); return; }
    const headers = ['Reg No','Name','Email','Phone','Department','Project Title','Technology','Team Guide','Status','Report','Sem1','Sem2','Sem3'];
    const keys = ['reg_no','name','email','phone','department','project_title','technology_used','team_guide','review_status','report_submission','ee_sem1_grade','ee_sem2_grade','ee_sem3_grade'];
    let csv = headers.join(',') + '\n';
    students.forEach(s => {
        csv += keys.map(k => `"${(s[k] || '').toString().replace(/"/g, '""')}"`).join(',') + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Section_${currentSection}_Students_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
}

// ─── Close modal on overlay click ───
document.getElementById('modalOverlay').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
});
