document.addEventListener('DOMContentLoaded', () => {
    // Night theme only - no theme switching

    // ─── Parallax Effect for Hero ──────────────────────────────────────────
    const hero = document.querySelector('.hero');
    if (hero) {
        window.addEventListener('scroll', () => {
            const scrolled = window.scrollY;
            hero.style.backgroundPositionY = -(scrolled * 0.5) + 'px';
        });
    }

    // ─── Spotlight Effect for Hover Highlights ──────────────────────────────
    const syncPointer = (e) => {
        const { clientX: x, clientY: y } = e;
        const productCards = document.querySelectorAll('.product-card');

        productCards.forEach(card => {
            card.style.setProperty('--x', x.toFixed(2));
            card.style.setProperty('--xp', (x / window.innerWidth).toFixed(2));
            card.style.setProperty('--y', y.toFixed(2));
            card.style.setProperty('--yp', (y / window.innerHeight).toFixed(2));
        });
    };

    document.addEventListener('pointermove', syncPointer);
    document.addEventListener('mousemove', syncPointer);

    // ─── Circular 3D Gallery Hero Logic ────────────────────────────────────
    let galleryRotation = 0;
    let isScrolling = false;
    let scrollTimeout = null;
    let animationFrame = null;
    const autoRotateSpeed = 0.02;
    const radius = 600;

    async function initCircularGallery() {
        try {
            const response = await fetch('/api/laptops/featured');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const laptops = await response.json();
            const galleryLaptops = laptops.slice(0, 12);

            if (galleryLaptops.length > 0) {
                createGalleryItems(galleryLaptops);
            } else {
                createFallbackGallery();
            }

            setupGalleryScrollHandler();
            startAutoRotation();

        } catch (error) {
            console.error('Error loading gallery laptops:', error);
            createFallbackGallery();
        }
    }

    function createGalleryItems(laptops) {
        const galleryRing = document.getElementById('galleryRing');
        if (!galleryRing) return;

        const anglePerItem = 360 / laptops.length;
        const brandImageMap = {
            'ASUS': { image: 'images/ASUS ROG STRIX G16.webp', model: 'ROG STRIX G16' },
            'Dell': { image: 'images/DELL ALIEANWARE.webp', model: 'ALIENWARE R18' },
            'HP': { image: 'images/HP ENVY.webp', model: 'ENVY' },
            'Lenovo': { image: 'images/Lenovo Legion Pro 7.avif', model: 'LEGION PRO 7' },
            'Acer': { image: 'images/ACER HELIOS.jpg', model: 'PREDATOR HELIOS NEO 18' },
            'MSI': { image: 'images/MSI RAIDER.jpg', model: 'RAIDER' },
            'Apple': { image: 'images/MACBOOK PRO.jpg', model: 'MACBOOK PRO M5 MAX' },
            'Razer': { image: 'images/RAZER BLADE 16.jpg', model: 'BLADE 16' }
        };

        galleryRing.innerHTML = laptops.map((laptop, index) => {
            const angle = index * anglePerItem;
            const brand = laptop.brand || 'Unknown';
            const brandInfo = brandImageMap[brand] || { image: 'images/ASUS ROG STRIX G16.webp', model: 'Gaming Laptop' };
            const model = laptop.series || laptop.modelNumber || brandInfo.model;
            const price = laptop.price || 0;
            const imageUrl = laptop.image || brandInfo.image;
            const fallbackUrl = 'images/ASUS ROG STRIX G16.webp';

            return `
                <div class="gallery-item" style="transform: rotateY(${angle}deg) translateZ(${radius}px);">
                    <div class="gallery-card">
                        <img src="${imageUrl}" alt="${brand} ${model}" class="laptop-image" 
                             onerror="this.onerror=null; this.src='${fallbackUrl}';"
                             onload="this.style.opacity='1';" style="opacity:0; transition: opacity 0.3s;">
                        <div class="laptop-info">
                            <div class="laptop-brand">${brand}</div>
                            <div class="laptop-model">${model}</div>
                            <div class="laptop-price">₹${price.toLocaleString()}</div>
                        </div>
                    </div>
                </div>`;
        }).join('');

        updateGalleryOpacity();
    }

    function createFallbackGallery() {
        const fallbackLaptops = [
            { brand: 'ASUS', series: 'ROG STRIX G16', price: 125000 },
            { brand: 'Dell', series: 'ALIENWARE', price: 195000 },
            { brand: 'HP', series: 'ENVY', price: 110000 },
            { brand: 'Apple', series: 'MACBOOK PRO', price: 180000 },
            { brand: 'Acer', series: 'PREDATOR HELIOS', price: 98000 },
            { brand: 'MSI', series: 'RAIDER', price: 142000 },
            { brand: 'Razer', series: 'BLADE', price: 165000 }
        ];
        createGalleryItems(fallbackLaptops);
    }

    function setupGalleryScrollHandler() {
        const handleScroll = () => {
            isScrolling = true;
            if (scrollTimeout) clearTimeout(scrollTimeout);

            const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollProgress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
            const scrollRotation = scrollProgress * 360;

            galleryRotation = scrollRotation;
            updateGalleryRotation();

            scrollTimeout = setTimeout(() => { isScrolling = false; }, 150);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
    }

    function startAutoRotation() {
        const autoRotate = () => {
            if (!isScrolling) {
                galleryRotation += autoRotateSpeed;
                updateGalleryRotation();
            }
            animationFrame = requestAnimationFrame(autoRotate);
        };
        animationFrame = requestAnimationFrame(autoRotate);
    }

    function updateGalleryRotation() {
        const galleryRing = document.getElementById('galleryRing');
        if (galleryRing) galleryRing.style.transform = `rotateY(${galleryRotation}deg)`;
        updateGalleryOpacity();
    }

    function updateGalleryOpacity() {
        const galleryItems = document.querySelectorAll('.gallery-item');
        const totalRotation = galleryRotation % 360;

        galleryItems.forEach((item, index) => {
            const itemAngle = (index * (360 / galleryItems.length)) % 360;
            const relativeAngle = (itemAngle + totalRotation + 360) % 360;
            const normalizedAngle = Math.abs(relativeAngle > 180 ? 360 - relativeAngle : relativeAngle);
            const opacity = Math.max(0.3, 1 - (normalizedAngle / 180));
            item.style.opacity = opacity;
        });
    }

    // Initialize the circular gallery on load
    initCircularGallery();
    console.log("Quantéra Premium Interface Loaded");
});

// Navigate to product detail page
function viewProduct(productId) {
    window.location.href = `product.html?id=${productId}`;
}

// ─── Navbar Auth Integration ────────────────────────────────────────────
(function initNavAuth() {
    function injectAuthUI(slot) {
        const token = localStorage.getItem('q_access') || sessionStorage.getItem('q_access');
        let user = null;
        try {
            const raw = localStorage.getItem('q_user') || sessionStorage.getItem('q_user');
            user = raw ? JSON.parse(raw) : null;
        } catch { /* ignore */ }

        slot.querySelectorAll('.nav-auth').forEach(el => el.remove());

        if (token && user) {
            const chip = document.createElement('div');
            chip.className = 'nav-auth nav-user-chip';
            chip.innerHTML = `
                <a href="/profile.html" class="nav-account-link" title="Go to Dashboard">
                    <span class="nav-user-name">👤 ${user.name.split(' ')[0]}</span>
                </a>
                <button class="nav-logout-btn" aria-label="Logout">Sign Out</button>`;
            slot.appendChild(chip);

            chip.addEventListener('click', e => {
                if (e.target.closest('.nav-logout-btn')) {
                    e.preventDefault();
                    ['q_access', 'q_refresh', 'q_user', 'q_remember', 'q_returnTo'].forEach(k => {
                        localStorage.removeItem(k); sessionStorage.removeItem(k);
                    });
                    window.location.href = '/';
                }
            });
        } else {
            const loginBtn = document.createElement('a');
            loginBtn.href = '/auth.html';
            loginBtn.className = 'nav-auth star-btn';
            loginBtn.innerHTML = `
                <span class="star-btn-bg">
                    <svg viewBox="0 0 100 40"><path d="M56.1...Z" fill="currentColor" opacity="0.4"/></svg>
                </span>
                <span class="star-btn-light"></span>
                <span class="star-btn-label">Sign In</span>`;
            
            loginBtn.addEventListener('click', e => {
                e.preventDefault();
                sessionStorage.setItem('q_returnTo', window.location.pathname);
                window.location.href = '/auth.html';
            });
            slot.appendChild(loginBtn);
        }
    }

    function tryInject() {
        const slot = document.getElementById('navAuthSlot') || document.getElementById('tl-auth-slot');
        if (slot) {
            let inner = document.getElementById('navAuthSlot');
            if (!inner) {
                inner = document.createElement('div');
                inner.id = 'navAuthSlot';
                slot.appendChild(inner);
            }
            injectAuthUI(inner);
            return true;
        }
        return false;
    }

    function run() {
        if (tryInject()) return;
        let attempts = 0;
        const poll = setInterval(() => {
            attempts++;
            if (tryInject() || attempts > 60) clearInterval(poll);
        }, 50);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
    } else {
        run();
    }
})();
