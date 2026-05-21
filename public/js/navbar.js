/**
 * Quantéra — Tubelight Navbar (Vanilla JS)
 * Injects a floating pill navbar at top-center (bottom on mobile).
 * Matches the React tubelight-navbar design faithfully.
 * NOTE: Skips injection on /admin (which has its own sidebar layout).
 */
(function () {
    // Skip floating navbar on admin — it has its own sidebar + inline pill
    if (window.location.pathname.startsWith('/admin')) {
        // Still apply saved theme and wire theme toggle for admin page
        const saved = localStorage.getItem('theme');
        if (saved === 'minimalistic') {
            document.body.setAttribute('data-theme', 'minimalistic');
        }
        // Admin wires its own theme-toggle via admin.js
        return;
    }

    // ─── Nav items ───────────────────────────────────────────────────────────────
    const NAV_ITEMS = [
        { name: 'Home', url: '/', icon: '🏠', matchFn: p => p === '/' },
        { name: 'Laptops', url: '/laptops', icon: '💻', matchFn: p => p.startsWith('/laptops') },
        { name: 'Accessories', url: '/accessories', icon: '🎧', matchFn: p => p.startsWith('/accessories') },
        { name: 'About', url: '/about', icon: '✨', matchFn: p => p.startsWith('/about') },
        { name: 'Track Order', url: '/order-tracking', icon: '📦', matchFn: p => p.startsWith('/order-tracking') },
    ];

    // Detect active tab by pathname
    const path = window.location.pathname;
    const hash = window.location.hash;

    function getInitialActive() {
        // Prioritise deeper matches first
        for (const item of NAV_ITEMS) {
            if (item.matchFn(path)) return item.name;
        }
        // Home is default
        return 'Home';
    }

    let activeTab = getInitialActive();

    // ─── Build HTML ──────────────────────────────────────────────────────────────
    function buildNavbar() {
        const linksHTML = NAV_ITEMS.map(item => {
            const isActive = activeTab === item.name;
            return `
        <a href="${item.url}"
           class="tl-link${isActive ? ' tl-active' : ''}"
           data-name="${item.name}">
          ${isActive ? `<span class="tl-lamp"></span>` : ''}
          <span class="tl-label">${item.name}</span>
          <span class="tl-icon">${item.icon}</span>
        </a>`;
        }).join('');

        return `
    <nav class="tl-navbar" id="tlNavbar" role="navigation" aria-label="Main navigation">
      <div class="tl-logo">
        <a href="/">
          <img id="tl-logo-img" src="/images/Quantera.png" alt="Quantéra" class="tl-logo-full">
        </a>
      </div>
      <div class="tl-pill">
        ${linksHTML}
      </div>
      <div class="tl-actions">
        <button id="qs-trigger" class="tl-search-btn" aria-label="Open search" title="Search (Ctrl+K)" onclick="console.log('Button clicked!'); openSearch();" style="pointer-events: auto; cursor: pointer;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <span class="tl-search-label">Search</span>
          <span class="tl-search-hint">Ctrl+K</span>
        </button>
        <a href="/cart.html" id="cart-btn" class="tl-cart-btn" aria-label="Shopping cart" title="Your cart">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          <span class="tl-cart-count" id="cart-count">0</span>
        </a>
        <div id="tl-auth-slot"></div>
      </div>
    </nav>`;
    }

    // ─── Inject into page ────────────────────────────────────────────────────────
    function inject() {
        // Remove any existing global navbar element so we don't duplicate
        // Use class/ID targeting to avoid deleting local functional navs (e.g. sidebar tabs)
        const existingGlobalNav = document.querySelector('.tl-navbar, #tlNavbar');
        if (existingGlobalNav) existingGlobalNav.remove();

        document.body.insertAdjacentHTML('afterbegin', buildNavbar());
        attachListeners();
        mirrorThemeButton();
        mirrorAuthSlot();
        wireSearchButton();
        loadSpotlight();
    }

    // ─── Click listeners & animated indicator ────────────────────────────────────
    function attachListeners() {
        document.querySelectorAll('.tl-link').forEach(link => {
            link.addEventListener('click', function (e) {
                const name = this.dataset.name;

                // If on same page (hash link), don't reload; just update active
                const isSamePage = false; // All links now go to separate pages

                // Update active state
                document.querySelectorAll('.tl-link').forEach(l => {
                    l.classList.remove('tl-active');
                    const lamp = l.querySelector('.tl-lamp');
                    if (lamp) lamp.remove();
                });

                this.classList.add('tl-active');
                // Insert lamp at start of link
                const lamp = document.createElement('span');
                lamp.className = 'tl-lamp';
                this.insertBefore(lamp, this.firstChild);

                activeTab = name;
            });
        });
    }



    // ─── Auth slot — created here, filled by script.js initNavAuth() ─────────────
    // script.js's initNavAuth IIFE polls for #navAuthSlot and injects the
    // Sign In / user-chip UI using q_access / q_user localStorage keys.
    function mirrorAuthSlot() {
        const slot = document.getElementById('tl-auth-slot');
        if (!slot) return;
        if (!document.getElementById('navAuthSlot')) {
            const authDiv = document.createElement('div');
            authDiv.id = 'navAuthSlot';
            slot.appendChild(authDiv);
        }
    }

    // ─── Simple working search function ─────────────────────────────────────────────────
    window.openSearch = function () {
        console.log('openSearch function called - mouse click detected!');

        // Remove any existing search overlay
        const existing = document.getElementById('search-overlay');
        if (existing) {
            console.log('Closing existing search overlay');
            existing.remove();
            return;
        }

        console.log('Creating new search overlay...');

        // Create the search overlay
        const overlay = document.createElement('div');
        overlay.id = 'search-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(20px);
            display: flex;
            align-items: flex-start;
            justify-content: center;
            padding-top: 80px;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;

        // Create the search container
        const container = document.createElement('div');
        container.style.cssText = `
            background: rgba(20, 20, 20, 0.95);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            width: 90%;
            max-width: 640px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
            transform: translateY(-20px) scale(0.95);
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        `;

        // Add shortcuts at the top
        const shortcuts = document.createElement('div');
        shortcuts.style.cssText = `
            display: flex;
            gap: 8px;
            padding: 20px 20px 0;
            flex-wrap: wrap;
            justify-content: center;
        `;

        const shortcutItems = [
            { label: 'Home', icon: '🏠', url: 'index.html' },
            { label: 'Laptops', icon: '💻', url: 'laptops.html' },
            { label: 'Accessories', icon: '🎧', url: 'accessories.html' },
            { label: 'About', icon: '✨', url: 'about.html' },
            { label: 'Track Order', icon: '📦', url: 'order-tracking.html' },
        ];

        shortcutItems.forEach(item => {
            const shortcut = document.createElement('a');
            shortcut.href = item.url;
            shortcut.style.cssText = `
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 12px 16px;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                text-decoration: none;
                color: rgba(255, 255, 255, 0.8);
                transition: all 0.2s ease;
                min-width: 80px;
            `;
            shortcut.innerHTML = `
                <span style="font-size: 20px; margin-bottom: 4px;">${item.icon}</span>
                <span style="font-size: 12px; font-weight: 500;">${item.label}</span>
            `;
            shortcut.addEventListener('mouseenter', () => {
                shortcut.style.background = 'rgba(0, 212, 255, 0.15)';
                shortcut.style.borderColor = 'rgba(0, 212, 255, 0.3)';
                shortcut.style.transform = 'translateY(-2px)';
            });
            shortcut.addEventListener('mouseleave', () => {
                shortcut.style.background = 'rgba(255, 255, 255, 0.05)';
                shortcut.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                shortcut.style.transform = 'translateY(0)';
            });
            shortcuts.appendChild(shortcut);
        });

        // Add search box
        const searchBox = document.createElement('div');
        searchBox.style.cssText = `
            padding: 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        `;

        const inputContainer = document.createElement('div');
        inputContainer.style.cssText = `
            display: flex;
            align-items: center;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 12px;
            padding: 16px 20px;
            transition: all 0.2s ease;
        `;

        const searchIcon = document.createElement('div');
        searchIcon.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: rgba(255, 255, 255, 0.5); margin-right: 12px;">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
        `;

        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Search Quantéra...';
        input.style.cssText = `
            flex: 1;
            background: transparent;
            border: none;
            outline: none;
            color: rgba(255, 255, 255, 0.9);
            font-size: 18px;
            font-weight: 400;
        `;

        const escKey = document.createElement('kbd');
        escKey.textContent = 'Esc';
        escKey.style.cssText = `
            background: rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.5);
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 12px;
            font-family: inherit;
        `;

        inputContainer.appendChild(searchIcon);
        inputContainer.appendChild(input);
        inputContainer.appendChild(escKey);
        searchBox.appendChild(inputContainer);

        // Add results container
        const results = document.createElement('div');
        results.id = 'search-results';
        results.style.cssText = `
            padding: 0 20px 20px;
            max-height: 300px;
            overflow-y: auto;
        `;

        // Add footer
        const footer = document.createElement('div');
        footer.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            font-size: 12px;
            color: rgba(255, 255, 255, 0.4);
        `;
        footer.innerHTML = `
            <div style="display: flex; gap: 16px;">
                <span>↩ to visit</span>
                <span>↑↓ to navigate</span>
                <span>Esc to close</span>
            </div>
        `;

        // Assemble the container
        container.appendChild(shortcuts);
        container.appendChild(searchBox);
        container.appendChild(results);
        container.appendChild(footer);
        overlay.appendChild(container);
        document.body.appendChild(overlay);

        // Animate in
        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
            container.style.transform = 'translateY(0) scale(1)';
        });

        // Focus input
        setTimeout(() => input.focus(), 100);

        // Add search functionality
        const searchData = [
            { icon: '🏠', label: 'Home', desc: 'Back to the homepage', url: 'index.html' },
            { icon: '💻', label: 'Laptops', desc: 'Browse our laptop collection', url: 'laptops.html' },
            { icon: '🎧', label: 'Accessories', desc: 'Browse accessories & peripherals', url: 'accessories.html' },
            { icon: '✨', label: 'About Us', desc: 'Learn about Quantéra', url: 'about.html' },
            { icon: '📦', label: 'Track Order', desc: 'Check your order status', url: 'order-tracking.html' },
            { icon: '🔑', label: 'Sign In', desc: 'Access your account', url: 'auth.html' },
            { icon: '🛒', label: 'Shopping Cart', desc: 'View your cart', url: 'cart.html' },
            { icon: '💻', label: 'ASUS ROG STRIX G16', desc: 'Gaming Laptop - ₹89,999', url: 'laptops.html' },
            { icon: '💻', label: 'Dell ALIENWARE', desc: 'Gaming Laptop - ₹149,999', url: 'laptops.html' },
            { icon: '💻', label: 'HP ENVY', desc: 'Ultrabook - ₹79,999', url: 'laptops.html' },
            { icon: '💻', label: 'MacBook Pro', desc: 'Professional Laptop - ₹199,999', url: 'laptops.html' },
            { icon: '🎧', label: 'Gaming Headset', desc: 'Audio Accessory - ₹4,999', url: 'accessories.html' },
            { icon: '🖱️', label: 'Gaming Mouse', desc: 'Input Device - ₹2,999', url: 'accessories.html' },
        ];

        function updateResults(query) {
            if (!query.trim()) {
                results.innerHTML = '';
                return;
            }

            const filtered = searchData.filter(item =>
                item.label.toLowerCase().includes(query.toLowerCase()) ||
                item.desc.toLowerCase().includes(query.toLowerCase())
            ).slice(0, 6);

            if (filtered.length === 0) {
                results.innerHTML = `
                    <div style="text-align: center; padding: 40px 20px; color: rgba(255, 255, 255, 0.5);">
                        <div style="font-size: 48px; margin-bottom: 16px;">🔍</div>
                        <div>No results for "${query}"</div>
                    </div>
                `;
                return;
            }

            results.innerHTML = filtered.map(item => `
                <a href="${item.url}" style="
                    display: flex;
                    align-items: center;
                    padding: 12px 16px;
                    margin: 4px 0;
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: 8px;
                    text-decoration: none;
                    color: rgba(255, 255, 255, 0.9);
                    transition: all 0.2s ease;
                " onmouseover="this.style.background='rgba(0, 212, 255, 0.1)'" onmouseout="this.style.background='rgba(255, 255, 255, 0.03)'">
                    <span style="font-size: 20px; margin-right: 16px;">${item.icon}</span>
                    <div style="flex: 1;">
                        <div style="font-weight: 500; margin-bottom: 2px;">${item.label}</div>
                        <div style="font-size: 12px; color: rgba(255, 255, 255, 0.6);">${item.desc}</div>
                    </div>
                    <span style="color: rgba(255, 255, 255, 0.3);">→</span>
                </a>
            `).join('');
        }

        input.addEventListener('input', (e) => {
            updateResults(e.target.value);
        });

        // Close handlers
        function closeSearch() {
            overlay.style.opacity = '0';
            container.style.transform = 'translateY(-20px) scale(0.95)';
            setTimeout(() => overlay.remove(), 300);
        }

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeSearch();
        });

        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') {
                closeSearch();
                document.removeEventListener('keydown', escHandler);
            }
        });

        // Focus styling
        inputContainer.addEventListener('focusin', () => {
            inputContainer.style.borderColor = 'rgba(0, 212, 255, 0.5)';
            inputContainer.style.background = 'rgba(255, 255, 255, 0.08)';
        });

        inputContainer.addEventListener('focusout', () => {
            inputContainer.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            inputContainer.style.background = 'rgba(255, 255, 255, 0.05)';
        });

        console.log('Search overlay created and displayed successfully!');
    };

    // ─── Additional event listener for search button as backup ─────────────────────────────────────────────────
    function wireSearchButton() {
        const searchBtn = document.getElementById('qs-trigger');
        if (searchBtn) {
            console.log('Wiring additional click listener to search button');
            searchBtn.addEventListener('click', function (e) {
                console.log('Search button clicked via event listener!');
                e.preventDefault();
                e.stopPropagation();
                if (typeof window.openSearch === 'function') {
                    window.openSearch();
                } else {
                    console.error('openSearch function not found!');
                }
            });

            // Also add mousedown event as backup
            searchBtn.addEventListener('mousedown', function (e) {
                console.log('Search button mousedown detected!');
            });

            console.log('Search button event listeners attached successfully');
        } else {
            console.error('Search button not found for event listener attachment');
        }
    }

    // ─── Load & wire Spotlight ───────────────────────────────────────────────────
    function loadSpotlight() {
        console.log('Wiring spotlight functionality...');

        // Since spotlight.js is loaded via HTML, just wait for it to be available
        let attempts = 0;
        const checkSpotlight = setInterval(() => {
            attempts++;

            if (window.QSpotlight) {
                console.log('QSpotlight is available, wiring button');
                clearInterval(checkSpotlight);
                wireSpotlightButton();
            } else if (attempts > 30) {
                console.error('QSpotlight not available after 30 attempts');
                clearInterval(checkSpotlight);
                wireSpotlightButtonFallback();
            }
        }, 100);
    }

    function wireSpotlightButton() {
        console.log('Attempting to wire spotlight button');

        const btn = document.getElementById('qs-trigger');
        if (!btn) {
            console.error('Search button not found');
            return;
        }

        if (!window.QSpotlight) {
            console.error('QSpotlight not available');
            wireSpotlightButtonFallback();
            return;
        }

        // Remove any existing click listeners by cloning the button
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        newBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Search button clicked - opening QSpotlight');
            try {
                window.QSpotlight.toggle();
            } catch (error) {
                console.error('Error opening QSpotlight:', error);
            }
        });

        console.log('Search button wired successfully to QSpotlight');
    }

    // Fallback function if spotlight.js fails to load
    function wireSpotlightButtonFallback() {
        console.log('Using fallback search functionality');
        const btn = document.getElementById('qs-trigger');
        if (btn) {
            // Remove any existing click listeners by cloning the button
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);

            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Fallback search clicked');
                if (window.QuanteraUI?.showAlert) {
                    window.QuanteraUI.showAlert({
                        title: 'Search Unavailable',
                        description: 'Search functionality is temporarily unavailable. Please try refreshing the page.',
                        variant: 'warning'
                    });
                } else {
                    alert('Search functionality is temporarily unavailable. Please try refreshing the page.');
                }
            });
            console.log('Search button wired with fallback');
        }
    }

    // ─── Global keyboard shortcut - use spotlight if available, otherwise use current search ─────────────────────────────────────────────────
    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            // Try to use spotlight first, fallback to current search
            if (window.QSpotlight && typeof window.QSpotlight.toggle === 'function') {
                window.QSpotlight.toggle();
            } else {
                window.openSearch();
            }
        }
    });

    // ─── Global keyboard shortcut handled by spotlight.js ─────────────────────────────────────────────────
    // Removed duplicate keyboard shortcut - spotlight.js handles Ctrl+K
    function updateCartCount() {
        const cart = JSON.parse(localStorage.getItem('quantera_cart') || '[]');
        const count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        const cartCountEl = document.getElementById('cart-count');
        if (cartCountEl) {
            cartCountEl.textContent = count;
            cartCountEl.style.display = count > 0 ? 'flex' : 'none';
        }
    }

    // ─── Run ─────────────────────────────────────────────────────────────────────
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            inject();
            updateCartCount();
            mirrorAuthSlot();
            // Listen for storage changes (from other tabs)
            window.addEventListener('storage', updateCartCount);
            // Listen for custom cart update event
            document.addEventListener('cartUpdated', updateCartCount);
        });
    } else {
        inject();
        updateCartCount();
        mirrorAuthSlot();
        window.addEventListener('storage', updateCartCount);
        document.addEventListener('cartUpdated', updateCartCount);
    }
})();
