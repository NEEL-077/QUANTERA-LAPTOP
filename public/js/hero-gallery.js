/**
 * QuantéraCircularGallery
 * Premium 3D scroll-driven carousel — vanilla JS port of CircularGallery
 */
(function () {
    'use strict';

    // ── Gallery items ─────────────────────────────────────────
    const ITEMS = [
        {
            name:  'ASUS ROG Zephyrus',
            sub:   'Ultra-Slim Gaming Icon',
            badge: 'Gaming',
            img:   'images/ASUS ROG ZEPHYRUS.webp',
            pos:   'center 40%',
            href:  'laptops.html'
        },
        {
            name:  'Dell Alienware m18',
            sub:   'Desktop-Class Power',
            badge: 'Gaming',
            img:   'images/DELL ALIEANWARE.webp',
            pos:   'center 35%',
            href:  'laptops.html'
        },
        {
            name:  'HP OMEN Max 16',
            sub:   'Next-Gen Performance',
            badge: 'Gaming',
            img:   'images/HP OMEN MAX 16.webp',
            pos:   'center 30%',
            href:  'laptops.html'
        },
        {
            name:  'Samsung Odyssey G9',
            sub:   '49" Curved Ultrawide',
            badge: 'Monitor',
            img:   'uploads/5d3f96c6-9ab7-46b4-b519-65fafbade8ca.webp',
            pos:   'center center',
            href:  'accessories.html'
        },
        {
            name:  'MacBook Pro 16"',
            sub:   'Creative Excellence',
            badge: 'Creator',
            img:   'images/MACBOOK PRO.jpg',
            pos:   'center 45%',
            href:  'laptops.html'
        },
        {
            name:  'Razer Blade 16',
            sub:   'Sleek & Savage',
            badge: 'Stealth',
            img:   'images/RAZER BLADE 16.jpg',
            pos:   'center 38%',
            href:  'laptops.html'
        },
        {
            name:  'MSI Raider GE78',
            sub:   'Dominate Every Frame',
            badge: 'PRO',
            img:   'images/MSI RAIDER.jpg',
            pos:   'center 35%',
            href:  'laptops.html'
        },
        {
            name:  'Lenovo Legion Pro 7',
            sub:   'Performance Unleashed',
            badge: 'Gaming',
            img:   'images/Lenovo Legion Pro 7.avif',
            pos:   'center 30%',
            href:  'laptops.html'
        },
    ];

    const RADIUS         = 620;   // px distance from center
    const AUTO_SPEED     = 0.018; // deg per frame
    const SCROLL_MULT    = 360;   // total scroll rotation (deg)
    const IDLE_TIMEOUT   = 160;   // ms to consider scrolling stopped

    let rotation       = 0;
    let isScrolling    = false;
    let idleTimer      = null;
    let rafId          = null;
    let ring           = null;

    // ── Build DOM ────────────────────────────────────────────
    function buildGallery() {
        ring = document.getElementById('hgRing');
        if (!ring) return;

        const count       = ITEMS.length;
        const angleStep   = 360 / count;

        ITEMS.forEach((item, i) => {
            const angle = i * angleStep;

            const a = document.createElement('a');
            a.href      = item.href;
            a.className = 'hg-card';
            a.setAttribute('aria-label', item.name);
            a.style.transform = `rotateY(${angle}deg) translateZ(${RADIUS}px)`;

            a.innerHTML = `
                <img src="${item.img}" alt="${item.name}" loading="lazy"
                     style="object-position: ${item.pos}">
                <div class="hg-card-info">
                    <span class="hg-card-badge">${item.badge}</span>
                    <p  class="hg-card-name">${item.name}</p>
                    <p  class="hg-card-sub">${item.sub}</p>
                </div>
                <div class="hg-card-overlay">
                    <span class="hg-card-cta">View →</span>
                </div>`;

            ring.appendChild(a);
        });
    }

    // ── Update cards opacity based on facing angle ────────────
    function updateOpacity() {
        if (!ring) return;
        const cards = ring.querySelectorAll('.hg-card');
        const count = cards.length;
        const angleStep = 360 / count;

        cards.forEach((card, i) => {
            const itemAngle     = i * angleStep;
            const relAngle      = ((itemAngle + rotation) % 360 + 360) % 360;
            const normAngle     = relAngle > 180 ? 360 - relAngle : relAngle;
            const opacity       = Math.max(0.15, 1 - normAngle / 160);
            card.style.opacity  = opacity;
            // disable pointer events for back-facing cards
            card.style.pointerEvents = opacity < 0.3 ? 'none' : 'auto';
        });
    }

    // ── Animation loop ───────────────────────────────────────
    function tick() {
        if (!isScrolling) {
            rotation += AUTO_SPEED;
        }
        if (ring) {
            ring.style.transform = `rotateY(${rotation}deg)`;
        }
        updateOpacity();
        rafId = requestAnimationFrame(tick);
    }

    // ── Scroll handler ───────────────────────────────────────
    function onScroll() {
        const wrapper = document.getElementById('hgScrollWrapper');
        if (!wrapper) return;

        isScrolling = true;
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => { isScrolling = false; }, IDLE_TIMEOUT);

        const wrapRect    = wrapper.getBoundingClientRect();
        const totalScroll = wrapper.offsetHeight - window.innerHeight;
        if (totalScroll <= 0) return;

        // how far into the wrapper have we scrolled?
        const scrolled    = Math.max(0, -wrapRect.top);
        const progress    = Math.min(1, scrolled / totalScroll);
        rotation          = progress * SCROLL_MULT;
    }

    // ── Init ─────────────────────────────────────────────────
    function init() {
        buildGallery();
        window.addEventListener('scroll', onScroll, { passive: true });
        rafId = requestAnimationFrame(tick);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
