// Learnza 2.0 - Preview Page
import { initSupabase } from './supabaseclient.js';
import { getNote, incrementViews } from './notesapi.js';
import { $, toChips, formatNumber, showLoading, hideLoading, toast, initIcons, initMobileMenu, getParam } from './utils.js';

async function init() {
    showLoading();

    try {
        await initSupabase();
        const id = getParam('id');

        if (!id) {
            showError();
            return;
        }

        const note = await getNote(id);

        if (!note) {
            showError();
            return;
        }

        await incrementViews(id);
        renderNote(note);
        initIcons();
        initMobileMenu();
    } catch (error) {
        console.error('Error:', error);
        showError();
    } finally {
        hideLoading();
    }
}

function renderNote(note) {
    $('#notePreview')?.classList.remove('hidden');
    $('#errorState')?.classList.add('hidden');

    const title = $('#noteTitle');
    const description = $('#noteDescription');
    const category = $('#noteCategory');
    const views = $('#noteViews');
    const downloads = $('#noteDownloads');
    const tags = $('#noteTags');
    const image = $('#previewImage');
    const downloadBtn = $('#downloadBtn');

    if (title) title.textContent = note.title || 'Untitled';
    if (description) description.textContent = note.description || '';
    if (category) category.textContent = note.class || 'Uncategorized';
    if (views) views.textContent = formatNumber(note.views || 0);
    if (downloads) downloads.textContent = formatNumber(note.downloads || 0);
    if (tags) tags.innerHTML = toChips(note.tags || []);
    if (image) image.textContent = note.title || 'Untitled';

    if (downloadBtn && note.file_url) {
        downloadBtn.addEventListener('click', async () => {
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
        });
    } else if (downloadBtn) {
        downloadBtn.disabled = true;
        downloadBtn.innerHTML = '<i data-feather="alert-circle"></i> No file available';
    }

    // Share Button Logic
    const shareBtn = $('#shareBtn');
    if (shareBtn) {
        shareBtn.addEventListener('click', async () => {
            const shareData = {
                title: note.title || 'Learnza Note',
                text: `Check out this note: ${note.title}`,
                url: window.location.href
            };

            try {
                if (navigator.share) {
                    await navigator.share(shareData);
                } else {
                    // Fallback to clipboard
                    await navigator.clipboard.writeText(window.location.href);
                    toast('Link copied to clipboard!', 'success');
                }
            } catch (err) {
                console.error('Share failed:', err);
            }
        });
    }

    initIcons();
}

function showError() {
    $('#notePreview')?.classList.add('hidden');
    $('#errorState')?.classList.remove('hidden');
}

init();
