// Learnza 2.0 - Downloader with Cloudflare Worker
import { formatBytes, toast, getParam } from './utils.js';

// DOM elements
let progressFill, progressPercentage, progressStatus, downloadSubtitle, errorMessage;

// State
let downloadController = null;
let isCancelled = false;
let startTime = 0;

// Your Cloudflare Worker URL
const PROXY_URL = 'https://learnza-proxy.goharrehmanfsd260.workers.dev/?url=';

document.addEventListener('DOMContentLoaded', () => {
    // Cache DOM elements
    progressFill = document.getElementById('progressBar');
    progressPercentage = document.getElementById('percentage');
    progressStatus = document.getElementById('statusText');
    downloadSubtitle = document.getElementById('fileTitle');
    errorMessage = document.getElementById('errorMsg');

    init();
});

async function init() {
    const url = getParam('url');
    const title = getParam('title') || 'Document';

    if (downloadSubtitle) downloadSubtitle.textContent = title;

    // Bind buttons
    const backBtn = document.getElementById('backBtn');
    const retryBtn = document.getElementById('retryBtn');
    const cancelBtn = document.getElementById('cancelBtn');

    // Back to library
    backBtn?.addEventListener('click', () => {
        window.location.href = './';
    });

    // Retry download
    retryBtn?.addEventListener('click', () => {
        if (url && title) {
            resetUI();
            startDownload(url, title);
        }
    });

    // Cancel download
    cancelBtn?.addEventListener('click', () => {
        if (downloadController) {
            isCancelled = true;
            downloadController.abort();
            toast('Download cancelled', 'info');
            showError('Download cancelled by user');
        }
    });

    // Start download
    if (url) {
        // Show cancel button, hide others
        cancelBtn?.classList.remove('hidden');
        backBtn?.classList.add('hidden');
        retryBtn?.classList.add('hidden');

        startDownload(url, title);
    } else {
        showError('No file URL provided.');
    }
}

async function startDownload(url, title) {
    startTime = Date.now();
    isCancelled = false;
    downloadController = new AbortController();

    updateProgress(0, 'Connecting...');
    toast('Download started', 'info');

    try {
        // Use Cloudflare Worker to fetch with progress
        const proxiedUrl = PROXY_URL + encodeURIComponent(url);
        const response = await fetch(proxiedUrl, {
            signal: downloadController.signal
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const contentLength = response.headers.get('content-length');
        const total = contentLength ? parseInt(contentLength, 10) : 0;
        let loaded = 0;

        const reader = response.body.getReader();
        const chunks = [];

        while (true) {
            if (isCancelled) {
                reader.cancel();
                throw new Error('Download cancelled');
            }

            const { done, value } = await reader.read();
            if (done) break;

            chunks.push(value);
            loaded += value.length;

            // Calculate progress
            const elapsed = (Date.now() - startTime) / 1000;
            const speed = loaded / elapsed;

            if (total > 0) {
                const percent = (loaded / total) * 100;
                const eta = (total - loaded) / speed;
                updateProgressWithStats(percent, speed, eta);
            } else {
                updateProgress(Math.min(loaded / 1000000 * 10, 90), 'Downloading...');
            }
        }

        // Create blob and download
        updateProgress(95, 'Preparing file...');
        const blob = new Blob(chunks, { type: 'application/pdf' });
        const downloadUrl = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${title.replace(/[^a-z0-9\-_]/gi, '_').toLowerCase()}.pdf`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(downloadUrl);

        updateProgress(100, 'Complete!');

        // Hide cancel, show back button
        document.getElementById('cancelBtn')?.classList.add('hidden');
        document.getElementById('backBtn')?.classList.remove('hidden');

        setTimeout(showComplete, 500);

    } catch (error) {
        console.error('Download error:', error);

        // Hide cancel, show retry and back buttons
        document.getElementById('cancelBtn')?.classList.add('hidden');
        document.getElementById('retryBtn')?.classList.remove('hidden');
        document.getElementById('backBtn')?.classList.remove('hidden');

        if (error.name === 'AbortError' || error.message === 'Download cancelled') {
            showError('Download cancelled');
        } else {
            showError('Download failed: ' + error.message);
            toast('Download failed', 'error');
        }
    }
}

function updateProgress(percent, status) {
    if (progressFill) {
        const radius = progressFill.r?.baseVal?.value || 90;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (percent / 100) * circumference;
        progressFill.style.strokeDashoffset = offset;
    }
    if (progressPercentage) progressPercentage.textContent = Math.round(percent) + '%';
    if (progressStatus) progressStatus.textContent = status;
}

function updateProgressWithStats(percent, speed, eta) {
    updateProgress(percent, 'Downloading...');

    const speedEl = document.getElementById('downloadSpeed');
    const etaEl = document.getElementById('timeRemaining');

    if (speedEl) speedEl.textContent = formatBytes(speed) + '/s';
    if (etaEl) {
        if (eta < 60) {
            etaEl.textContent = Math.round(eta) + 's';
        } else {
            const mins = Math.floor(eta / 60);
            const secs = Math.round(eta % 60);
            etaEl.textContent = `${mins}m ${secs}s`;
        }
    }
}

function showComplete() {
    if (progressPercentage) progressPercentage.textContent = '✓';
    if (progressStatus) progressStatus.textContent = 'Complete!';
    if (progressFill) progressFill.style.stroke = 'var(--success)';
    document.getElementById('backBtn')?.classList.remove('hidden');
    toast('Download complete!', 'success');
}

function showError(message) {
    if (errorMessage) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
    }
    if (progressStatus) progressStatus.textContent = 'Error';
    if (progressFill) progressFill.style.stroke = 'var(--danger)';
    document.getElementById('retryBtn')?.classList.remove('hidden');
    document.getElementById('backBtn')?.classList.remove('hidden');
}

function resetUI() {
    if (errorMessage) errorMessage.classList.add('hidden');
    document.getElementById('retryBtn')?.classList.add('hidden');
    document.getElementById('backBtn')?.classList.add('hidden');
    document.getElementById('cancelBtn')?.classList.remove('hidden');
    if (progressFill) progressFill.style.stroke = 'var(--primary)';
    if (progressPercentage) progressPercentage.textContent = '0%';
    if (progressStatus) progressStatus.textContent = 'Preparing';
    isCancelled = false;
}
