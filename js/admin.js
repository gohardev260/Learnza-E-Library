// Learnza 2.0 - Admin Panel
import { initSupabase, supabase } from './supabaseclient.js';
import { adminListNotes, createNote, updateNote, deleteNote, getStats } from './notesapi.js';
import { $, parseTags, debounce, showLoading, hideLoading, toast, initIcons, initMobileMenu } from './utils.js';
import { CONFIG } from './config.js';

let currentNoteId = null;
let currentPage = 1;

async function init() {
    showLoading();

    try {
        await initSupabase();
        await checkAuth();
        initIcons();
        initMobileMenu();
    } catch (error) {
        console.error('Init error:', error);
    } finally {
        hideLoading();
    }
}

async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
        showAdminPanel();
        await loadStats();
        await loadNotes();
        bindEvents();
    } else {
        showLogin();
    }
}

function showLogin() {
    $('#loginSection')?.classList.remove('hidden');
    $('#adminPanel')?.classList.add('hidden');

    const form = $('#loginForm');
    const msg = $('#loginMsg');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = $('#email').value.trim();
            const password = $('#password').value.trim();

            if (!email || !password) {
                if (msg) {
                    msg.className = 'login-message error';
                    msg.textContent = 'Please enter email and password';
                }
                return;
            }

            showLoading();

            try {
                const { error } = await supabase.auth.signInWithPassword({ email, password });

                if (error) throw error;

                showAdminPanel();
                await loadStats();
                await loadNotes();
                bindEvents();
            } catch (error) {
                console.error('Login error:', error);
                if (msg) {
                    msg.className = 'login-message error';
                    msg.textContent = error.message || 'Login failed';
                }
            } finally {
                hideLoading();
            }
        });
    }
}

function showAdminPanel() {
    $('#loginSection')?.classList.add('hidden');
    $('#adminPanel')?.classList.remove('hidden');
    $('#logoutBtn')?.classList.remove('hidden');
    $('#logoutBtnMobile')?.classList.remove('hidden');

    $('#logoutBtn')?.addEventListener('click', logout);
    $('#logoutBtnMobile')?.addEventListener('click', logout);
}

async function logout() {
    await supabase.auth.signOut();
    location.reload();
}

function bindEvents() {
    const noteForm = $('#noteForm');
    const resetForm = $('#resetForm');
    const deleteBtn = $('#deleteNote');
    const adminSearch = $('#adminSearch');
    const filterPublished = $('#filterPublished');

    if (noteForm) {
        noteForm.addEventListener('submit', handleSaveNote);
    }

    if (resetForm) {
        resetForm.addEventListener('click', clearForm);
    }

    if (deleteBtn) {
        deleteBtn.addEventListener('click', handleDeleteNote);
    }

    if (adminSearch) {
        adminSearch.addEventListener('input', debounce(() => {
            currentPage = 1;
            loadNotes();
        }, CONFIG.SEARCH_DEBOUNCE));
    }

    if (filterPublished) {
        filterPublished.addEventListener('change', () => {
            currentPage = 1;
            loadNotes();
        });
    }
}

async function loadStats() {
    try {
        const stats = await getStats();
        $('#statTotal').textContent = stats.total_notes || 0;
        $('#statPublished').textContent = stats.published_notes || 0;
        $('#statDownloads').textContent = stats.total_downloads || 0;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadNotes() {
    showLoading();

    try {
        const q = $('#adminSearch')?.value || '';
        const published = $('#filterPublished')?.value || '';

        const { data, count } = await adminListNotes({ q, published, page: currentPage });

        renderNotesTable(data);
        renderPagination(count);
    } catch (error) {
        console.error('Error loading notes:', error);
        toast('Failed to load notes', 'error');
    } finally {
        hideLoading();
    }
}

function renderNotesTable(notes) {
    const table = $('#notesTable');
    if (!table) return;

    let html = '<div class="table-row table-header">';
    html += '<div class="table-cell">Title</div>';
    html += '<div class="table-cell">Category</div>';
    html += '<div class="table-cell">Status</div>';
    html += '<div class="table-cell">Stats</div>';
    html += '<div class="table-cell">Actions</div>';
    html += '</div>';

    if (!notes.length) {
        html += '<div class="empty-table"><i data-feather="inbox"></i><p>No notes found</p></div>';
        table.innerHTML = html;
        initIcons();
        return;
    }

    notes.forEach(note => {
        html += '<div class="table-row">';
        html += `<div class="table-cell title">${note.title || 'Untitled'}</div>`;
        html += `<div class="table-cell category">${note.class || '-'}</div>`;
        html += `<div class="table-cell status">`;
        if (note.published) {
            html += '<span class="status-badge published"><i data-feather="check-circle"></i> Published</span>';
        } else {
            html += '<span class="status-badge draft"><i data-feather="clock"></i> Draft</span>';
        }
        html += '</div>';
        html += `<div class="table-cell"><i data-feather="eye"></i> ${note.views || 0} | <i data-feather="download"></i> ${note.downloads || 0}</div>`;
        html += `<div class="table-cell table-actions">`;
        html += `<button class="btn btn-outline" onclick="window.editNote('${note.id}')"><i data-feather="edit-2"></i> Edit</button>`;
        html += '</div>';
        html += '</div>';
    });

    table.innerHTML = html;
    initIcons();
}

function renderPagination(total) {
    const pagination = $('#adminPagination');
    if (!pagination) return;

    const totalPages = Math.ceil(total / CONFIG.PAGE_SIZE);

    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let html = '';

    html += `<button class="page-btn" ${currentPage <= 1 ? 'disabled' : ''} onclick="window.goToPage(${currentPage - 1})">
    <i data-feather="chevron-left"></i>
  </button>`;

    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
            html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="window.goToPage(${i})">${i}</button>`;
        }
    }

    html += `<button class="page-btn" ${currentPage >= totalPages ? 'disabled' : ''} onclick="window.goToPage(${currentPage + 1})">
    <i data-feather="chevron-right"></i>
  </button>`;

    pagination.innerHTML = html;
    initIcons();
}

window.goToPage = (page) => {
    currentPage = page;
    loadNotes();
};

window.editNote = async (id) => {
    try {
        showLoading();
        const { getNote } = await import('./notesapi.js');
        const note = await getNote(id);

        currentNoteId = note.id;
        $('#noteId').value = note.id;
        $('#title').value = note.title || '';
        $('#category').value = note.class || '';
        $('#tags').value = (note.tags || []).join(', ');
        $('#fileUrl').value = note.file_url || '';
        $('#description').value = note.description || '';
        $('#published').checked = note.published || false;
        $('#deleteNote').disabled = false;

        window.scrollTo({ top: 0, behavior: 'smooth' });
        toast('Editing note', 'info');
    } catch (error) {
        console.error('Error loading note:', error);
        toast('Failed to load note', 'error');
    } finally {
        hideLoading();
    }
};

async function handleSaveNote(e) {
    e.preventDefault();

    const title = $('#title').value.trim();
    const category = $('#category').value.trim();
    const tags = parseTags($('#tags').value);
    const fileUrl = $('#fileUrl').value.trim();
    const description = $('#description').value.trim();
    const published = $('#published').checked;

    if (!title) {
        toast('Title is required', 'warning');
        return;
    }

    showLoading();

    try {
        const payload = { title, category, tags, fileUrl, description, published };

        if (currentNoteId) {
            await updateNote(currentNoteId, payload);
            toast('Note updated successfully', 'success');
        } else {
            await createNote(payload);
            toast('Note created successfully', 'success');
        }

        clearForm();
        await loadStats();
        await loadNotes();
    } catch (error) {
        console.error('Save error:', error);
        toast('Failed to save note', 'error');
    } finally {
        hideLoading();
    }
}

async function handleDeleteNote() {
    if (!currentNoteId) return;

    if (!confirm('Are you sure you want to delete this note?')) return;

    showLoading();

    try {
        await deleteNote(currentNoteId);
        toast('Note deleted successfully', 'success');
        clearForm();
        await loadStats();
        await loadNotes();
    } catch (error) {
        console.error('Delete error:', error);
        toast('Failed to delete note', 'error');
    } finally {
        hideLoading();
    }
}

function clearForm() {
    currentNoteId = null;
    $('#noteForm').reset();
    $('#noteId').value = '';
    $('#deleteNote').disabled = true;
}

init();
