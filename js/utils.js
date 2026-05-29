// Learnza 2.0 - Utility Functions

import { CONFIG } from './config.js';

// DOM Utilities
export const $ = (selector) => document.querySelector(selector);
export const $$ = (selector) => document.querySelectorAll(selector);

// Debounce function
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Sanitize HTML
export function sanitize(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Parse tags from comma-separated string
export function parseTags(input) {
    if (!input) return [];
    return input
        .split(',')
        .map(tag => tag.trim().replace(/["']/g, ''))
        .filter(Boolean)
        .filter((tag, index, arr) => arr.indexOf(tag) === index);
}

// Convert tags array to HTML badges
export function toChips(tags = []) {
    if (!Array.isArray(tags)) return '';
    return tags
        .map(tag => {
            const cleanTag = String(tag).replace(/["']/g, '').trim();
            return `<span class="badge">${sanitize(cleanTag)}</span>`;
        })
        .join(' ');
}

// Format number with K/M suffixes
export function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// Format bytes to human readable string
export function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// Show loading overlay
export function showLoading() {
    const overlay = $('#loadingOverlay');
    if (overlay) {
        overlay.classList.add('show');
    }
}

// Hide loading overlay
export function hideLoading() {
    const overlay = $('#loadingOverlay');
    if (overlay) {
        overlay.classList.remove('show');
    }
}

// Show toast notification
export function toast(message, type = 'info') {
    const toastEl = $('#toast');
    if (!toastEl) return;

    toastEl.textContent = message;
    toastEl.className = `toast ${type}`;
    toastEl.classList.add('show');

    setTimeout(() => {
        toastEl.classList.remove('show');
    }, CONFIG.TOAST_DURATION);
}

// Initialize Feather icons
export function initIcons() {
    if (window.feather) {
        window.feather.replace();
    }
}

// Mobile menu toggle
export function initMobileMenu() {
    const toggle = $('#mobileMenuToggle');
    const nav = $('#mobileNav');

    if (toggle && nav) {
        toggle.addEventListener('click', () => {
            toggle.classList.toggle('active');
            nav.classList.toggle('active');
        });

        // Close on link click
        $$('.mobile-nav-item').forEach(item => {
            item.addEventListener('click', () => {
                toggle.classList.remove('active');
                nav.classList.remove('active');
            });
        });
    }
}

// Get URL parameter
export function getParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
}

// Set URL parameter
export function setParam(name, value) {
    const url = new URL(window.location);
    url.searchParams.set(name, value);
    window.history.pushState({}, '', url);
}
