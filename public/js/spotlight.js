/**
 * Quantéra — Spotlight Search Overlay (Unified Engine)
 * Senior Full-Stack Implementation:
 * - Direct REST API integration (/api/search)
 * - 300ms Debounced input
 * - Partial/Case-insensitive matching (Backend-driven)
 * - Zero UI Modification Strategy
 */
(function () {
    // ─── Shortcut quick-links (System Static) ──────────────────────────────────
    const SHORTCUTS = [
        { label: 'Home', icon: '🏠', url: '/' },
        { label: 'Laptops', icon: '💻', url: '/laptops' },
        { label: 'Accessories', icon: '🎧', url: '/accessories' },
        { label: 'About', icon: '✨', url: '/about' },
        { label: 'Track', icon: '📦', url: '/order-tracking' },
    ];

    // Static page results to merge with dynamic results
    const STATIC_PAGES = [
        { title: 'Home', type: 'page', category: 'General', url: '/', icon: '🏠' },
        { title: 'Laptop Collection', type: 'page', category: 'Store', url: '/laptops', icon: '💻' },
        { title: 'Accessories Store', type: 'page', category: 'Store', url: '/accessories', icon: '🎧' },
        { title: 'About Quantéra', type: 'page', category: 'Company', url: '/about', icon: '✨' },
        { title: 'Track Your Order', type: 'page', category: 'Support', url: '/order-tracking', icon: '📦' },
        { title: 'Sign In / Account', type: 'page', category: 'User', url: '/auth.html', icon: '🔑' },
    ];

    let isOpen = false;
    let searchValue = '';
    let results = [];
    let activeIdx = -1;
    let searchDebounce = null;

    /**
     * ─── Core Search Engine Integration ──────────────────────────────────────────
     */
    async function performSearch(query) {
        if (!query || query.length < 2) {
            results = [];
            renderResults();
            return;
        }

        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error('Search failed');
            
            const data = await response.json();
            
            // Merge static system pages with dynamic product results
            const matchedPages = STATIC_PAGES.filter(p => 
                p.title.toLowerCase().includes(query.toLowerCase())
            );

            // Source of Truth logic: Dynamic results from backend preferred
            results = [...matchedPages, ...(data.results || [])].slice(0, 8);
            renderResults(query);

        } catch (error) {
            console.error('[Search Engine] Fetch Error:', error);
            renderResults(query, true); // Hide results on hard failure
        }
    }

    /**
     * ─── UI Rendering (Strictly attaches to existing CSS) ────────────────────────
     */
    function renderResults(query, isError = false) {
        const resultsList = document.getElementById('qs-results');
        const emptyState = document.getElementById('qs-empty');
        const emptyQuery = document.getElementById('qs-empty-query');
        if (!resultsList || !emptyState) return;

        if (!query || query.length < 2 || isError) {
            resultsList.style.display = 'none';
            emptyState.style.display = 'none';
            return;
        }

        if (results.length === 0) {
            resultsList.style.display = 'none';
            emptyState.style.display = 'block';
            emptyQuery.textContent = query;
            return;
        }

        emptyState.style.display = 'none';
        resultsList.style.display = 'block';
        resultsList.innerHTML = results.map((r, i) => {
           const iconHtml = r.image
                ? `<img src="${r.image.startsWith('/') ? r.image : '/' + r.image}" alt="${r.title || r.label}" loading="lazy">`
                : `<span>${r.icon || (r.type === 'laptop' ? '💻' : '🎧')}</span>`;
            const subtext = r.type 
                ? `${r.type.toUpperCase()} • ${r.price ? '₹'+r.price.toLocaleString() : (r.category || '')}` 
                : `PAGE • ${r.category || 'System'}`;
            
            return `
                <a href="${r.url}" class="qs-result-item" data-idx="${i}" tabindex="-1">
                    <span class="qs-result-icon">${iconHtml}</span>
                    <span class="qs-result-text">
                        <span class="qs-result-label">${highlight(r.title || r.label, query)}</span>
                        <span class="qs-result-desc">${subtext}</span>
                    </span>
                    <span class="qs-result-arrow">→</span>
                </a>`;
        }).join('');

        // Reset nav state
        activeIdx = -1;
        resultsList.querySelectorAll('.qs-result-item').forEach(item => {
            item.addEventListener('mouseenter', () => setActiveItem(parseInt(item.getAttribute('data-idx'))));
        });
    }

    function highlight(text, query) {
        if (!text) return '';
        const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return text.replace(re, '<mark class="qs-mark">$1</mark>');
    }

    function setActiveItem(idx) {
        const items = document.querySelectorAll('.qs-result-item');
        items.forEach(el => el.classList.remove('qs-active'));
        activeIdx = idx;
        if (items[idx]) {
            items[idx].classList.add('qs-active');
            items[idx].scrollIntoView({ block: 'nearest' });
        }
    }

    /**
     * ─── Management Logic (Initialization & Eventing) ───────────────────────────
     */
    function buildOverlay() {
        const el = document.createElement('div');
        el.id = 'qs-overlay';
        el.className = 'qs-overlay';
        el.innerHTML = `
            <div class="qs-backdrop" id="qs-backdrop"></div>
            <div class="qs-wrapper" id="qs-wrapper">
                <div class="qs-shortcuts" id="qs-shortcuts">
                    ${SHORTCUTS.map(s => `
                        <a href="${s.url}" class="qs-shortcut">
                            <span class="qs-shortcut-icon">${s.icon}</span>
                            <span class="qs-shortcut-label">${s.label}</span>
                        </a>`).join('')}
                </div>
                <div class="qs-box" id="qs-box">
                    <div class="qs-input-row">
                        <span class="qs-search-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                            </svg>
                        </span>
                        <input id="qs-input" class="qs-input" type="text" placeholder="Search Quantéra…" autocomplete="off" spellcheck="false">
                        <kbd class="qs-esc">Esc</kbd>
                    </div>
                    <div class="qs-results" id="qs-results" style="display:none;"></div>
                    <div class="qs-empty" id="qs-empty" style="display:none;">
                        No results for "<span id="qs-empty-query"></span>"
                    </div>
                    <div class="qs-footer">
                        <span>↩ to visit</span>
                        <span>↑↓ to navigate</span>
                        <span>Esc to close</span>
                    </div>
                </div>
            </div>`;
        return el;
    }

    function open() {
        if (isOpen) return;
        isOpen = true;

        const overlay = buildOverlay();
        document.body.appendChild(overlay);
        document.body.classList.add('qs-no-scroll');
        requestAnimationFrame(() => overlay.classList.add('qs-open'));

        const input = document.getElementById('qs-input');
        if (input) {
            setTimeout(() => input.focus(), 100);
            input.addEventListener('input', e => {
                searchValue = e.target.value;
                const shortcuts = document.getElementById('qs-shortcuts');
                if (shortcuts) shortcuts.style.opacity = searchValue ? '0' : '1';
                
                // Optimized Debounce Strategy (300ms)
                clearTimeout(searchDebounce);
                searchDebounce = setTimeout(() => performSearch(searchValue), 300);
            });

            input.addEventListener('keydown', e => {
                const items = document.querySelectorAll('.qs-result-item');
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setActiveItem(Math.min(activeIdx + 1, items.length - 1));
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setActiveItem(Math.max(activeIdx - 1, 0));
                } else if (e.key === 'Enter') {
                    if (activeIdx >= 0 && items[activeIdx]) items[activeIdx].click();
                } else if (e.key === 'Escape') {
                    close();
                }
            });
        }
        document.getElementById('qs-backdrop').addEventListener('click', close);
    }

    function close() {
        if (!isOpen) return;
        const overlay = document.getElementById('qs-overlay');
        if (overlay) {
            overlay.classList.remove('qs-open');
            overlay.classList.add('qs-closing');
            setTimeout(() => overlay.remove(), 250);
        }
        document.body.classList.remove('qs-no-scroll');
        isOpen = false;
        searchValue = '';
        results = [];
        activeIdx = -1;
    }

    // Expose API
    window.QSpotlight = { open, close, toggle: () => isOpen ? close() : open() };

    document.addEventListener('keydown', e => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            window.QSpotlight.toggle();
        }
        if (e.key === 'Escape' && isOpen) close();
    });

    /**
     * ─── Navbar Hijack (Senior Strategy) ───────────────────────────────────────
     * Intercepts clicks on the navbar search button WITHOUT modifying navbar.js.
     * Uses event capturing to stop the legacy 'openSearch' from triggering.
     */
    document.addEventListener('click', e => {
        const trigger = e.target.closest('#qs-trigger');
        if (trigger) {
            e.preventDefault();
            e.stopImmediatePropagation(); // Prevents the navbar's onclick from firing
            window.QSpotlight.toggle();
        }
    }, true); // Setting 'true' enables the capture phase
})();
