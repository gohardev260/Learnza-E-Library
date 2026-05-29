// Learnza 2.0 - Homepage (main.js)
import { initSupabase } from './supabaseclient.js';
import { listNotes, getCategories } from './notesapi.js';
import { $, $$, debounce, parseTags, toChips, formatNumber, showLoading, hideLoading, toast, initIcons, initMobileMenu, setParam, getParam } from './utils.js';
import { CONFIG } from './config.js';

// State
const state = {
    q: '',
    tags: [],
    category: '',
    sortBy: 'created_at',
    page: 1,
    totalPages: 0
};

// Initialize
async function init() {
    showLoading();

    try {
        await initSupabase();
        await loadCategories();
        bindEvents();
        loadFromURL();
        await loadNotes();
        initIcons();
        initMobileMenu();
    } catch (error) {
        console.error('Initialization error:', error);
        toast('Failed to initialize app', 'error');
    } finally {
        hideLoading();
    }
}

// Load categories
async function loadCategories() {
    try {
        const categories = await getCategories();
        const select = $('#categoryFilter');
        if (select) {
            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat;
                option.textContent = cat;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Bind events
function bindEvents() {
    const searchInput = $('#searchInput');
    const tagsFilter = $('#tagsFilter');
    const categoryFilter = $('#categoryFilter');
    const sortFilter = $('#sortFilter');
    const clearSearch = $('#clearSearch');
    const resetFilters = $('#resetFilters');
    const resetEmpty = $('#resetEmpty');

    if (searchInput) {
        searchInput.addEventListener('input', debounce((e) => {
            state.q = e.target.value;
            state.page = 1;
            clearSearch?.classList.toggle('hidden', !state.q);
            loadNotes();
        }, CONFIG.SEARCH_DEBOUNCE));
    }

    if (tagsFilter) {
        tagsFilter.addEventListener('input', debounce((e) => {
            state.tags = parseTags(e.target.value);
            state.page = 1;
            loadNotes();
        }, CONFIG.SEARCH_DEBOUNCE));
    }

    if (categoryFilter) {
        categoryFilter.addEventListener('change', (e) => {
            state.category = e.target.value;
            state.page = 1;
            loadNotes();
        });
    }

    if (sortFilter) {
        sortFilter.addEventListener('change', (e) => {
            state.sortBy = e.target.value;
            state.page = 1;
            loadNotes();
        });
    }

    if (clearSearch) {
        clearSearch.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            state.q = '';
            state.page = 1;
            clearSearch.classList.add('hidden');
            loadNotes();
        });
    }

    if (resetFilters || resetEmpty) {
        [resetFilters, resetEmpty].forEach(btn => {
            btn?.addEventListener('click', resetAllFilters);
        });
    }
}

// Load from URL
function loadFromURL() {
    const q = getParam('q');
    const category = getParam('category');
    const page = getParam('page');

    if (q) {
        state.q = q;
        const input = $('#searchInput');
        if (input) input.value = q;
    }

    if (category) {
        state.category = category;
        const select = $('#categoryFilter');
        if (select) select.value = category;
    }

    if (page) {
        state.page = parseInt(page) || 1;
    }
}

// Load notes
async function loadNotes() {
    showLoading();

    try {
        const { data, count } = await listNotes({
            q: state.q,
            tags: state.tags,
            category: state.category,
            sortBy: state.sortBy,
            page: state.page
        });

        state.totalPages = Math.ceil(count / CONFIG.PAGE_SIZE);
        renderNotes(data, count);
        renderPagination();
        updateURL();
    } catch (error) {
        console.error('Error loading notes:', error);
        toast('Failed to load notes', 'error');
        showEmptyState();
    } finally {
        hideLoading();
    }
}

// Render notes
function renderNotes(notes, total) {
    const grid = $('#notesGrid');
    const template = $('#noteCardTemplate');
    const emptyState = $('#emptyState');
    const resultsMeta = $('#resultsMeta');

    if (!grid || !template) return;

    grid.innerHTML = '';

    if (!notes.length) {
        showEmptyState();
        return;
    }

    if (emptyState) emptyState.classList.add('hidden');
    if (resultsMeta) {
        resultsMeta.classList.remove('hidden');
        const count = resultsMeta.querySelector('.results-count');
        if (count) count.textContent = `${total.toLocaleString()} note${total !== 1 ? 's' : ''} found`;
    }

    notes.forEach(note => {
        const clone = template.content.cloneNode(true);
        const card = clone.querySelector('.note-card');

        if (!card) return;

        // Image
        const img = clone.querySelector('.note-image');
        if (img) img.textContent = note.title || 'Untitled';

        // Content
        const title = clone.querySelector('.note-title');
        const category = clone.querySelector('.category-badge');
        const description = clone.querySelector('.note-description');
        const tags = clone.querySelector('.note-tags');
        const views = clone.querySelector('.views-count');
        const downloads = clone.querySelector('.downloads-count');

        if (title) title.textContent = note.title || 'Untitled';
        if (category) {
            if (note.class) {
                category.textContent = note.class;
            } else {
                category.style.display = 'none';
            }
        }
        if (description) description.textContent = note.description || '';
        if (tags) tags.innerHTML = toChips(note.tags || []);
        if (views) views.textContent = formatNumber(note.views || 0);
        if (downloads) downloads.textContent = formatNumber(note.downloads || 0);

        // Actions
        const previewBtn = clone.querySelector('.preview-btn');
        const downloadBtn = clone.querySelector('.download-btn');

        if (previewBtn) {
            previewBtn.href = `preview.html?id=${note.id}`;
        }

        if (downloadBtn && note.file_url) {
            downloadBtn.addEventListener('click', () => handleDownload(note));
        }

        grid.appendChild(clone);
    });

    initIcons();
}

// Show empty state
function showEmptyState() {
    const grid = $('#notesGrid');
    const emptyState = $('#emptyState');
    const resultsMeta = $('#resultsMeta');

    if (grid) grid.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    if (resultsMeta) resultsMeta.classList.add('hidden');
}

// Render pagination
function renderPagination() {
    const pagination = $('#pagination');
    if (!pagination || state.totalPages <= 1) {
        if (pagination) pagination.innerHTML = '';
        return;
    }

    let html = '';

    // Previous
    html += `<button class="page-btn" ${state.page <= 1 ? 'disabled' : ''} data-page="${state.page - 1}">
    <i data-feather="chevron-left"></i>
  </button>`;

    // Pages
    for (let i = 1; i <= state.totalPages; i++) {
        if (i === 1 || i === state.totalPages || Math.abs(i - state.page) <= 1) {
            html += `<button class="page-btn ${i === state.page ? 'active' : ''}" data-page="${i}">${i}</button>`;
        } else if (Math.abs(i - state.page) === 2) {
            html += `<span class="page-btn" disabled>...</span>`;
        }
    }

    // Next
    html += `<button class="page-btn" ${state.page >= state.totalPages ? 'disabled' : ''} data-page="${state.page + 1}">
    <i data-feather="chevron-right"></i>
  </button>`;

    pagination.innerHTML = html;

    // Bind
    $$('.page-btn[data-page]').forEach(btn => {
        btn.addEventListener('click', () => {
            state.page = parseInt(btn.dataset.page);
            loadNotes();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });

    initIcons();
}

// Handle download
async function handleDownload(note) {
    if (!note.file_url) {
        toast('No file available', 'warning');
        return;
    }

    try {
        const { incrementDownloads } = await import('./notesapi.js');
        // Increment count in background
        incrementDownloads(note.id).catch(console.error);

        // Redirect to downloader page
        const params = new URLSearchParams({
            url: note.file_url,
            title: note.title,
            id: note.id
        });

        window.location.href = `download.html?${params.toString()}`;
    } catch (error) {
        console.error('Download init error:', error);
        toast('Could not start download', 'error');
    }
}

// Reset filters
function resetAllFilters() {
    state.q = '';
    state.tags = [];
    state.category = '';
    state.sortBy = 'created_at';
    state.page = 1;

    const searchInput = $('#searchInput');
    const tagsFilter = $('#tagsFilter');
    const categoryFilter = $('#categoryFilter');
    const sortFilter = $('#sortFilter');
    const clearSearch = $('#clearSearch');

    if (searchInput) searchInput.value = '';
    if (tagsFilter) tagsFilter.value = '';
    if (categoryFilter) categoryFilter.value = '';
    if (sortFilter) sortFilter.value = 'created_at';
    if (clearSearch) clearSearch.classList.add('hidden');

    loadNotes();
}

// Update URL
function updateURL() {
    setParam('page', state.page);
    if (state.q) setParam('q', state.q);
    if (state.category) setParam('category', state.category);
}

// Start
init();
