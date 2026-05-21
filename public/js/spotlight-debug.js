/**
 * Debug version of Quantéra Spotlight Search
 */
console.log('Loading spotlight-debug.js...');

(function () {
    console.log('Spotlight IIFE started');

    // Simple test data
    const SHORTCUTS = [
        { label: 'Home', icon: '🏠', url: 'index.html' },
        { label: 'Laptops', icon: '💻', url: 'laptops.html' },
        { label: 'Accessories', icon: '🎧', url: 'accessories.html' },
        { label: 'About', icon: '✨', url: 'about.html' },
        { label: 'Track Order', icon: '📦', url: 'order-tracking.html' },
    ];

    const STATIC_RESULTS = [
        { icon: '🏠', label: 'Home', desc: 'Back to the homepage', url: 'index.html' },
        { icon: '💻', label: 'Laptops', desc: 'Browse our laptop collection', url: 'laptops.html' },
        { icon: '🎧', label: 'Accessories', desc: 'Browse accessories & peripherals', url: 'accessories.html' },
        { icon: '✨', label: 'About Us', desc: 'Learn about Quantéra', url: 'about.html' },
        { icon: '📦', label: 'Track Order', desc: 'Check your order status', url: 'order-tracking.html' },
        { icon: '🔑', label: 'Sign In', desc: 'Log in to your Quantéra account', url: 'auth.html' },
    ];

    let isOpen = false;
    let searchValue = '';
    let allProducts = [];
    let activeResultIdx = -1;

    // Simple search function
    function getResults(query) {
        if (!query) return [];
        const q = query.toLowerCase();
        const pool = [...STATIC_RESULTS, ...allProducts];
        return pool.filter(r =>
            r.label.toLowerCase().includes(q) ||
            r.desc.toLowerCase().includes(q)
        ).slice(0, 8);
    }

    // Simple highlight function
    function highlight(text, query) {
        if (!query) return text;
        const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return text.replace(re, '<mark class="qs-mark">$1</mark>');
    }

    // Build overlay HTML
    function buildOverlay() {
        console.log('Building overlay...');
        const el = document.createElement('div');
        el.id = 'qs-overlay';
        el.className = 'qs-overlay';
        el.setAttribute('role', 'dialog');
        el.setAttribute('aria-label', 'Search');
        el.innerHTML = `
            <div class="qs-backdrop" id="qs-backdrop"></div>
            <div class="qs-wrapper" id="qs-wrapper">
                <!-- Shortcut pills (shown when no query) -->
                <div class="qs-shortcuts" id="qs-shortcuts">
                    ${SHORTCUTS.map((s, i) => `
                        <a href="${s.url}" class="qs-shortcut" data-idx="${i}" title="${s.label}">
                            <span class="qs-shortcut-icon">${s.icon}</span>
                            <span class="qs-shortcut-label">${s.label}</span>
                        </a>`).join('')}
                </div>

                <!-- Main search box -->
                <div class="qs-box" id="qs-box">
                    <!-- Input row -->
                    <div class="qs-input-row">
                        <span class="qs-search-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                            </svg>
                        </span>
                        <input
                            id="qs-input"
                            class="qs-input"
                            type="text"
                            placeholder="Search Quantéra…"
                            autocomplete="off"
                            spellcheck="false"
                        >
                        <kbd class="qs-esc">Esc</kbd>
                    </div>

                    <!-- Results list -->
                    <div class="qs-results" id="qs-results" style="display:none;"></div>

                    <!-- Empty state -->
                    <div class="qs-empty" id="qs-empty" style="display:none;">
                        No results for "<span id="qs-empty-query"></span>"
                    </div>

                    <!-- Footer -->
                    <div class="qs-footer">
                        <span>↩ to visit</span>
                        <span>↑↓ to navigate</span>
                        <span>Esc to close</span>
                    </div>
                </div>
            </div>`;
        return el;
    }

    // Render results
    function renderResults(query) {
        console.log('Rendering results for:', query);
        const resultsList = document.getElementById('qs-results');
        const emptyState = document.getElementById('qs-empty');
        const emptyQuery = document.getElementById('qs-empty-query');
        if (!resultsList) return;

        if (!query) {
            resultsList.style.display = 'none';
            emptyState.style.display = 'none';
            return;
        }

        const results = getResults(query);
        if (results.length === 0) {
            resultsList.style.display = 'none';
            emptyState.style.display = 'block';
            emptyQuery.textContent = query;
            return;
        }

        emptyState.style.display = 'none';
        resultsList.style.display = 'block';
        resultsList.innerHTML = results.map((r, i) => `
            <a href="${r.url}" class="qs-result-item" data-idx="${i}" tabindex="-1">
                <span class="qs-result-icon">${r.icon}</span>
                <span class="qs-result-text">
                    <span class="qs-result-label">${highlight(r.label, query)}</span>
                    <span class="qs-result-desc">${r.desc}</span>
                </span>
                <span class="qs-result-arrow">→</span>
            </a>`).join('');

        // Keyboard nav: track selected row
        resultsList.querySelectorAll('.qs-result-item').forEach((item, i) => {
            item.addEventListener('mouseenter', () => setActiveResult(i));
        });
    }

    // Keyboard navigation
    function setActiveResult(idx) {
        const items = document.querySelectorAll('.qs-result-item');
        items.forEach(el => el.classList.remove('qs-active'));
        activeResultIdx = idx;
        if (items[idx]) {
            items[idx].classList.add('qs-active');
            items[idx].scrollIntoView({ block: 'nearest' });
        }
    }

    // Open function
    function open() {
        if (isOpen) return;
        console.log('Opening search overlay');
        isOpen = true;

        const overlay = buildOverlay();
        document.body.appendChild(overlay);
        document.body.classList.add('qs-no-scroll');

        // Animate in
        requestAnimationFrame(() => {
            overlay.classList.add('qs-open');
        });

        // Focus input
        const input = document.getElementById('qs-input');
        if (input) {
            setTimeout(() => input.focus(), 50);

            input.addEventListener('input', e => {
                searchValue = e.target.value;
                activeResultIdx = -1;
                renderResults(searchValue);
                // Show/hide shortcuts
                const shortcuts = document.getElementById('qs-shortcuts');
                if (shortcuts) shortcuts.style.opacity = searchValue ? '0' : '1';
            });

            input.addEventListener('keydown', e => {
                const items = document.querySelectorAll('.qs-result-item');
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setActiveResult(Math.min(activeResultIdx + 1, items.length - 1));
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setActiveResult(Math.max(activeResultIdx - 1, 0));
                } else if (e.key === 'Enter') {
                    if (activeResultIdx >= 0 && items[activeResultIdx]) {
                        items[activeResultIdx].click();
                    }
                } else if (e.key === 'Escape') {
                    close();
                }
            });
        }

        // Backdrop click
        const backdrop = document.getElementById('qs-backdrop');
        if (backdrop) backdrop.addEventListener('click', close);
    }

    // Close function
    function close() {
        if (!isOpen) return;
        console.log('Closing search overlay');
        const overlay = document.getElementById('qs-overlay');
        if (overlay) {
            overlay.classList.remove('qs-open');
            overlay.classList.add('qs-closing');
            setTimeout(() => {
                if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
            }, 220);
        }
        document.body.classList.remove('qs-no-scroll');
        isOpen = false;
        searchValue = '';
        activeResultIdx = -1;
    }

    // Global keyboard shortcut
    document.addEventListener('keydown', e => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            isOpen ? close() : open();
        }
        if (e.key === 'Escape' && isOpen) close();
    });

    // Expose to window
    window.QSpotlight = { 
        open, 
        close, 
        toggle: () => {
            console.log('QSpotlight toggle called, isOpen:', isOpen);
            return isOpen ? close() : open();
        }
    };
    
    console.log('QSpotlight initialized and exposed to window');

    // Load some sample products
    allProducts = [
        { icon: '💻', label: 'ASUS ROG STRIX G16', desc: 'Gaming Laptop - ₹89,999', url: 'laptops.html' },
        { icon: '💻', label: 'Dell ALIENWARE', desc: 'Gaming Laptop - ₹149,999', url: 'laptops.html' },
        { icon: '💻', label: 'HP ENVY', desc: 'Ultrabook - ₹79,999', url: 'laptops.html' },
        { icon: '💻', label: 'MacBook Pro', desc: 'Professional Laptop - ₹199,999', url: 'laptops.html' },
        { icon: '🎧', label: 'Gaming Headset', desc: 'Audio Accessory - ₹4,999', url: 'accessories.html' },
        { icon: '🖱️', label: 'Gaming Mouse', desc: 'Input Device - ₹2,999', url: 'accessories.html' },
    ];

    console.log('Spotlight IIFE completed');
})();

console.log('spotlight-debug.js loaded');