// ── Q&A Helper ────────────────────────────────────────────────────────────────
function addQAPair() {
    const ta = document.getElementById('descriptionTextarea');
    if (!ta) return;
    const val = ta.value;
    const prefix = val.length > 0 && !val.endsWith('\n') ? '\n' : '';
    ta.value += prefix + 'Q: \nA: \n';
    // Move cursor to end of "Q: "
    const pos = ta.value.lastIndexOf('Q: ') + 3;
    ta.focus();
    ta.setSelectionRange(pos, pos);
}

document.addEventListener('DOMContentLoaded', () => {
    const getStoredAccessToken = () => {
        if (typeof getAccessToken === 'function') {
            return getAccessToken();
        }
        return localStorage.getItem('q_access') || sessionStorage.getItem('q_access');
    };

    const getStoredUser = () => {
        if (typeof getUser === 'function') {
            return getUser();
        }
        try {
            const raw = localStorage.getItem('q_user') || sessionStorage.getItem('q_user');
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    };

    const adminNameEl = document.getElementById('adminName');
    const adminAvatarEl = document.getElementById('adminAvatar');
    const currentUser = getStoredUser();
    if (currentUser) {
        if (adminNameEl) adminNameEl.textContent = currentUser.name || currentUser.email || 'Admin';
        if (adminAvatarEl) {
            const initials = (currentUser.name || currentUser.email || 'AD')
                .split(' ')
                .map(part => part[0])
                .slice(0, 2)
                .join('')
                .toUpperCase();
            adminAvatarEl.textContent = initials;
        }
    }

    const showAdminAccessMessage = (message = 'Please sign in as an admin to view subscribers.') => {
        const listEl = document.getElementById('subscribersList');
        if (!listEl) return;
        listEl.innerHTML = `
            <div style="padding: 24px; color: var(--text-secondary); text-align: center;">
                <p>${message}</p>
            </div>
        `;
    };

    // --- THEME SWITCHING LOGIC ---
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    const icon = document.getElementById('theme-icon');

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        body.setAttribute('data-theme', savedTheme);
        updateIcon(savedTheme);
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = body.getAttribute('data-theme');
            const newTheme = currentTheme === 'minimalistic' ? 'luxury' : 'minimalistic';

            if (newTheme === 'minimalistic') {
                body.setAttribute('data-theme', 'minimalistic');
            } else {
                body.removeAttribute('data-theme');
            }

            localStorage.setItem('theme', newTheme);
            updateIcon(newTheme);
        });
    }

    function updateIcon(theme) {
        if (!icon) return;
        icon.src = 'images/admin-icons/theme.png';
        icon.alt = 'Toggle Theme';
    }

    // --- IMAGE PREVIEW FUNCTIONALITY ---
    function setupImagePreview(inputId, previewContainerId, previewId) {
        const input = document.getElementById(inputId);
        const previewContainer = document.getElementById(previewContainerId);
        const preview = document.getElementById(previewId);

        if (!input) return;

        input.addEventListener('change', function (e) {
            const files = e.target.files;
            preview.innerHTML = '';

            if (files.length === 0) {
                previewContainer.style.display = 'none';
                return;
            }

            previewContainer.style.display = 'block';

            Array.from(files).forEach(file => {
                const reader = new FileReader();
                reader.onload = function (event) {
                    const img = document.createElement('img');
                    img.src = event.target.result;
                    img.style.width = '100px';
                    img.style.height = '100px';
                    img.style.objectFit = 'cover';
                    img.style.borderRadius = '8px';
                    img.style.border = '2px solid var(--accent-color)';
                    preview.appendChild(img);
                };
                reader.readAsDataURL(file);
            });
        });
    }

    // Setup preview for laptop and accessory images
    setupImagePreview('laptopImages', 'imagePreviewContainer', 'imagePreview');
    setupImagePreview('accessoryImages', 'accessoryImagePreviewContainer', 'accessoryImagePreview');

    // --- SMOOTH SCROLLING FOR NAV LINKS ---
    document.querySelectorAll('.nav-links a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);

            // Map navigation links to mode switches
            if (targetId === 'laptops') {
                switchMode('laptop');
            } else if (targetId === 'accessories') {
                switchMode('accessory');
            } else if (targetId === 'inventory') {
                switchMode('inventory');
            }

            // Scroll to top smoothly
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });

    // --- MODE SWITCHING LOGIC ---
    const sidebarLinks = document.querySelectorAll('.sidebar-link[data-mode]');

    const dashboardContainer = document.getElementById('dashboardContainer');
    const laptopContainer = document.getElementById('laptopContainer');
    const accessoryContainer = document.getElementById('accessoryContainer');
    const ordersContainer = document.getElementById('ordersContainer');
    const inventoryContainer = document.getElementById('inventoryContainer');

    function switchMode(mode) {
        // Reset all containers
        if (dashboardContainer) dashboardContainer.style.display = 'none';
        laptopContainer.style.display = 'none';
        accessoryContainer.style.display = 'none';
        if (ordersContainer) ordersContainer.style.display = 'none';
        if (inventoryContainer) inventoryContainer.style.display = 'none';
        const newsletterContainer = document.getElementById('newsletterContainer');
        const emailLogsContainer = document.getElementById('emailLogsContainer');
        if (newsletterContainer) newsletterContainer.style.display = 'none';
        if (emailLogsContainer) emailLogsContainer.style.display = 'none';

        // Reset all buttons
        sidebarLinks.forEach(link => link.classList.remove('active'));

        // Activate clicked button
        const activeLink = document.querySelector(`.sidebar-link[data-mode="${mode}"]`);
        if (activeLink) activeLink.classList.add('active');

        if (mode === 'dashboard') {
            if (dashboardContainer) dashboardContainer.style.display = 'block';
            loadDashboardStats();
        } else if (mode === 'laptop') {
            laptopContainer.style.display = 'block';
        } else if (mode === 'accessory') {
            accessoryContainer.style.display = 'block';
        } else if (mode === 'orders') {
            if (ordersContainer) {
                ordersContainer.style.display = 'block';
                console.log('Switching to orders mode, loading orders...');
                loadOrders();
            } else {
                console.error('ordersContainer not found!');
            }
        } else if (mode === 'inventory') {
            if (inventoryContainer) inventoryContainer.style.display = 'block';
            loadInventory();
        } else if (mode === 'newsletter') {
            const container = document.getElementById('newsletterContainer');
            if (container) container.style.display = 'block';
            loadNewsletterStats();
        } else if (mode === 'emailLogs') {
            const container = document.getElementById('emailLogsContainer');
            if (container) container.style.display = 'block';
            loadEmailLogs();
        }
    }

    sidebarLinks.forEach(link => {
        link.addEventListener('click', () => {
            switchMode(link.getAttribute('data-mode'));
        });
    });

    // --- DASHBOARD STATS LOGIC ---
    let dashboardCharts = {};

    async function loadDashboardStats() {
        try {
            const [ordersRes, laptopsRes, accessoriesRes] = await Promise.all([
                fetch('/api/orders'),
                fetch('/api/laptops'),
                fetch('/api/accessories')
            ]);

            const orders = await ordersRes.json();
            const laptops = await laptopsRes.json();
            const accessories = await accessoriesRes.json();

            // Calculate Stats
            let totalRevenue = 0;
            let pendingCount = 0;

            orders.forEach(order => {
                if (order.status !== 'Cancelled') {
                    totalRevenue += order.totalAmount || 0;
                }
                if (order.status === 'Pending') {
                    pendingCount++;
                }
            });

            document.getElementById('statRevenue').textContent = '₹' + totalRevenue.toFixed(2);
            document.getElementById('statOrders').textContent = orders.length;
            document.getElementById('statProducts').textContent = (laptops.length || 0) + (accessories.length || 0);
            document.getElementById('statPending').textContent = pendingCount;

            // Render Recent Orders
            const recentOrdersBody = document.getElementById('recentOrdersBody');
            if (recentOrdersBody) {
                // sort by date desc
                const sortedOrders = [...orders].sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate)).slice(0, 5);
                if (sortedOrders.length === 0) {
                    recentOrdersBody.innerHTML = '<tr><td colspan="4" style="padding: 20px; text-align: center; color: var(--text-secondary);">No recent orders</td></tr>';
                } else {
                    recentOrdersBody.innerHTML = sortedOrders.map(order => {
                        let statusColor = '#aaa';
                        if (order.status === 'Pending') statusColor = '#ffc107';
                        if (order.status === 'Processing') statusColor = '#17a2b8';
                        if (order.status === 'Shipped') statusColor = '#007bff';
                        if (order.status === 'Delivered') statusColor = '#28a745';
                        if (order.status === 'Cancelled') statusColor = '#dc3545';

                        return `
                        <tr style="border-bottom: 1px solid var(--card-border);">
                            <td style="padding: 12px; color: var(--accent-color); font-weight: 600;">${order.orderId}</td>
                            <td style="padding: 12px; color: var(--text-primary);">${order.customer?.name || 'N/A'}</td>
                            <td style="padding: 12px; color: var(--text-primary); font-weight: 600;">₹${(order.totalAmount || 0).toFixed(2)}</td>
                            <td style="padding: 12px;">
                                <span style="background: ${statusColor}33; color: ${statusColor}; padding: 4px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: 600; border: 1px solid ${statusColor}">
                                    ${order.status}
                                </span>
                            </td>
                        </tr>
                        `;
                    }).join('');
                }
            }

            renderCharts(orders);

        } catch (error) {
            console.error('Error loading dashboard stats:', error);
        }
    }

    function renderCharts(orders) {
        if (typeof Chart === 'undefined') return;

        // --- Status Chart ---
        const statusCounts = { Pending: 0, Processing: 0, Shipped: 0, Delivered: 0, Cancelled: 0 };
        orders.forEach(o => {
            if (statusCounts[o.status] !== undefined) statusCounts[o.status]++;
        });

        const ctxStatus = document.getElementById('statusChart');
        if (ctxStatus) {
            if (dashboardCharts.status) dashboardCharts.status.destroy();
            dashboardCharts.status = new Chart(ctxStatus, {
                type: 'doughnut',
                data: {
                    labels: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
                    datasets: [{
                        data: [statusCounts.Pending, statusCounts.Processing, statusCounts.Shipped, statusCounts.Delivered, statusCounts.Cancelled],
                        backgroundColor: ['#ffc107', '#17a2b8', '#007bff', '#28a745', '#dc3545'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'right', labels: { color: '#aaa' } } }
                }
            });
        }

        // --- Revenue Chart ---
        const last7Days = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        const revData = { [last7Days[0]]: 0, [last7Days[1]]: 0, [last7Days[2]]: 0, [last7Days[3]]: 0, [last7Days[4]]: 0, [last7Days[5]]: 0, [last7Days[6]]: 0 };

        orders.forEach(o => {
            if (o.status !== 'Cancelled') {
                const dateKey = new Date(o.orderDate).toISOString().split('T')[0];
                if (revData[dateKey] !== undefined) {
                    revData[dateKey] += (o.totalAmount || 0);
                }
            }
        });

        const ctxRev = document.getElementById('revenueChart');
        if (ctxRev) {
            if (dashboardCharts.revenue) dashboardCharts.revenue.destroy();
            dashboardCharts.revenue = new Chart(ctxRev, {
                type: 'line',
                data: {
                    labels: last7Days,
                    datasets: [{
                        label: 'Revenue (₹)',
                        data: Object.values(revData),
                        borderColor: '#00e5ff',
                        backgroundColor: 'rgba(0, 229, 255, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#aaa' } },
                        x: { grid: { display: false }, ticks: { color: '#aaa' } }
                    }
                }
            });
        }
    }

    // Initial Load for Dashboard
    loadDashboardStats();


    // --- LAPTOP FORM LOGIC ---
    // Tab Switching Logic
    const tabs = document.querySelectorAll('.tab-btn');
    const sections = document.querySelectorAll('.form-section');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs and sections
            tabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));

            // Set current tab and section as active
            tab.classList.add('active');
            const targetId = tab.getAttribute('data-target');
            const targetSection = document.getElementById(targetId);
            if (targetSection) targetSection.classList.add('active');
            // Load data for specific panels when shown
            if (targetId === 'newsletterContainer') {
                if (typeof loadNewsletterStats === 'function') loadNewsletterStats();
            }
        });
    });

    // Handle "Next Step" buttons in form sections
    document.addEventListener('click', (e) => {
        const nextBtn = e.target.closest('.next-tab-btn');
        if (nextBtn) {
            // Find current active tab index
            const tabsArray = Array.from(tabs);
            const activeIdx = tabsArray.findIndex(t => t.classList.contains('active'));

            // If there's a next tab, click it
            if (activeIdx !== -1 && activeIdx < tabsArray.length - 1) {
                tabsArray[activeIdx + 1].click();

                // Scroll form container to top for fresh view
                const container = document.querySelector('.admin-content');
                if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }
    });

    const laptopForm = document.getElementById('laptopForm');
    if (laptopForm) {
        laptopForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleSubmission('/api/laptops', laptopForm);
        });
    }

    // --- ACCESSORY FORM LOGIC ---
    const accessoryForm = document.getElementById('accessoryForm');
    if (accessoryForm) {
        accessoryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleSubmission('/api/accessories', accessoryForm);
        });
    }

    // =========================================================
    // INVENTORY LOGIC — 3-Layer Drilldown: Brand → Series → Product Grid
    // =========================================================
    let allLaptops = [];
    let allAccessories = [];
    let invCurrentBrand = null;
    let invCurrentSeries = null;

    async function loadInventory() {
        // Always reset to brand view on (re)load
        invCurrentBrand = null;
        invCurrentSeries = null;
        const brandView = document.getElementById('inv-brand-view');
        const seriesView = document.getElementById('inv-series-view');
        const productView = document.getElementById('inv-product-view');
        if (brandView) brandView.style.display = 'block';
        if (seriesView) seriesView.style.display = 'none';
        if (productView) productView.style.display = 'none';
        updateInvBreadcrumb();

        const brandGrid = document.getElementById('inv-brand-grid');
        if (brandGrid) brandGrid.innerHTML = '<p style="color:#aaa;grid-column:1/-1;">Loading data...</p>';

        try {
            const [laptopsRes, accessoriesRes] = await Promise.all([
                fetch('/api/laptops?full=true'),
                fetch('/api/accessories')
            ]);
            allLaptops = await laptopsRes.json();
            allAccessories = await accessoriesRes.json();
            renderBrandView();
        } catch (e) {
            console.error(e);
            if (brandGrid) brandGrid.innerHTML = '<p style="color:red;grid-column:1/-1;">Failed to load inventory. Ensure the server is running.</p>';
        }
    }

    /* ---------- helpers ---------- */

    function getInvFilter() { return document.getElementById('inventoryFilter')?.value || 'all'; }

    function getFilteredItems() {
        const filter = getInvFilter();
        let items = [];
        if (filter === 'all' || filter === 'laptops') {
            if (Array.isArray(allLaptops)) {
                items = items.concat(allLaptops.map((i, index) => ({
                    ...i, type: 'Laptop', source: 'Laptops', index,
                    displayName: `${i.brand || 'Unknown'} ${i.series || i.model_name || i.modelNumber || 'Unknown Model'}`
                })));
            }
        }
        if (filter === 'all' || filter === 'accessories') {
            if (Array.isArray(allAccessories)) {
                items = items.concat(allAccessories.map((i, index) => ({
                    ...i, type: i.type || 'Accessory', source: 'Accessories', index,
                    displayName: i.name || 'Unknown Accessory'
                })));
            }
        }
        return items;
    }

    function updateInvBreadcrumb() {
        const el = document.getElementById('inv-breadcrumb');
        if (!el) return;
        let parts = [];
        if (invCurrentBrand) {
            parts.push(`<span class="inv-crumb-link" onclick="window.invGoHome()" style="cursor:pointer;transition:color 0.2s;">All Brands</span>`);
            parts.push(`<span style="color:rgba(255,255,255,0.3)">›</span>`);
            if (invCurrentSeries !== null) {
                parts.push(`<span class="inv-crumb-link" onclick="window.invGoToSeries()" style="cursor:pointer;transition:color 0.2s;">${invCurrentBrand}</span>`);
                parts.push(`<span style="color:rgba(255,255,255,0.3)">›</span>`);
                parts.push(`<strong style="color:var(--text-primary)">${invCurrentSeries === '__all__' ? 'All Products' : invCurrentSeries}</strong>`);
            } else {
                parts.push(`<strong style="color:var(--text-primary)">${invCurrentBrand}</strong>`);
            }
        } else {
            parts.push(`<strong style="color:var(--text-primary)">All Brands</strong>`);
        }
        el.innerHTML = parts.join(' ');
        el.querySelectorAll('.inv-crumb-link').forEach(link => {
            link.style.color = 'var(--text-secondary)';
            link.onmouseover = () => link.style.color = 'var(--accent-color)';
            link.onmouseout = () => link.style.color = 'var(--text-secondary)';
        });
    }

    function updateInvStats(items) {
        const el = document.getElementById('inventoryStats');
        if (!el) return;
        const lCount = items.filter(i => i.source === 'Laptops').length;
        const aCount = items.filter(i => i.source === 'Accessories').length;
        const bCount = new Set(items.map(i => i.brand || 'Unknown').filter(Boolean)).size;
        el.innerHTML = `
            <div style="display:flex;gap:16px;flex-wrap:wrap;text-align:right;align-items:center;">
                <span><strong>${items.length}</strong> products</span>
                <span><strong>${bCount}</strong> brands</span>
                ${lCount > 0 ? `<span style="display:inline-flex;align-items:center;gap:4px;"><img src="/images/admin-icons/laptop.svg" width="16" height="16" alt="Laptops"> <strong>${lCount}</strong></span>` : ''}
                ${aCount > 0 ? `<span style="display:inline-flex;align-items:center;gap:4px;"><img src="/images/admin-icons/accessory.svg" width="16" height="16" alt="Accessories"> <strong>${aCount}</strong></span>` : ''}
            </div>`;
    }

    // --- NEWSLETTER / EMAIL ADMIN HELPERS ---
    async function loadNewsletterStats() {
        try {

            const res = await fetch('/api/admin/subscribers');

            if (res.status === 401 || res.status === 403) {
                console.error('Unauthorized access to subscribers.');
                document.getElementById('totalSubscribers').textContent = 0;
                document.getElementById('guestSubscribers').textContent = 0;
                document.getElementById('userSubscribers').textContent = 0;
                return;
            }

            const data = await res.json();
            document.getElementById('totalSubscribers').textContent = data.totalCount || 0;
            document.getElementById('guestSubscribers').textContent = (data.guests || []).length;
            document.getElementById('userSubscribers').textContent = (data.users || []).length;

            const listEl = document.getElementById('subscribersList');
            if (!listEl) return;

            // Build table of subscribers
            let html = '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse">';
            html += '<thead><tr style="text-align:left;border-bottom:2px solid var(--card-border)"><th style="padding:8px;color:var(--text-secondary)">Type</th><th style="padding:8px;color:var(--text-secondary)">Name / Email</th><th style="padding:8px;color:var(--text-secondary)">Source / Joined</th></tr></thead>';
            html += '<tbody>';

            (data.users || []).forEach(u => {
                html += `<tr><td style="padding:10px;color:var(--accent-color);font-weight:700">User</td><td style="padding:10px;color:var(--text-primary)">${u.name || '—'}<div style="color:var(--text-secondary);font-size:0.85rem">${u.email}</div></td><td style="padding:10px;color:var(--text-secondary)">${new Date(u.createdAt).toLocaleString()}</td></tr>`;
            });

            (data.guests || []).forEach(g => {
                html += `<tr><td style="padding:10px;color:var(--accent-color);font-weight:700">Guest</td><td style="padding:10px;color:var(--text-primary)">${g.email}</td><td style="padding:10px;color:var(--text-secondary)">${g.source || 'guest'} • ${new Date(g.subscribedAt).toLocaleString()}</td></tr>`;
            });

            html += '</tbody></table></div>';
            listEl.innerHTML = html;
        } catch (err) {
            console.error('Error loading newsletter stats:', err);
            const listEl = document.getElementById('subscribersList');
            if (listEl) listEl.innerHTML = '<p style="color:var(--text-secondary)">Failed to load subscribers.</p>';
        }
    }

    // Handle admin newsletter send form
    const adminNewsletterForm = document.getElementById('adminNewsletterForm');
    if (adminNewsletterForm) {
        adminNewsletterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = adminNewsletterForm.querySelector('button[type="submit"]');
            try {
                btn.disabled = true;
                const formData = new FormData(adminNewsletterForm);
                const payload = Object.fromEntries(formData.entries());
                const res = await fetch('/api/admin/newsletter/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to send newsletter');

                alert(data.message || 'Newsletter queued');
            } catch (err) {
                console.error('Newsletter send error:', err);
                alert('Failed to send newsletter: ' + (err.message || err));
            } finally {
                btn.disabled = false;
            }
        });
    }
    function getStockBadge(item) {
        const stock = item.stock ?? item.quantity;
        if (stock === null || stock === undefined) return '<span class="inv-stock-badge inv-stock-in">In Stock</span>';
        if (stock <= 0) return '<span class="inv-stock-badge inv-stock-out">Out of Stock</span>';
        if (stock <= 5) return `<span class="inv-stock-badge inv-stock-low">Low (${stock})</span>`;
        return `<span class="inv-stock-badge inv-stock-in">${stock} In Stock</span>`;
    }

    function buildProductCard(item) {
        const stockBadge = getStockBadge(item);
        const typeBadge = `<span class="inv-type-badge">${item.type}</span>`;
        const imgSrc = (item.images && item.images.length > 0) ? item.images[0] : (item.image || null);
        const placeholder = item.source === 'Laptops' ? '💻' : '🎧';
        const imgHtml = imgSrc
            ? `<img src="${imgSrc}" alt="${item.displayName}" onerror="this.style.display='none';this.parentElement.querySelector('.img-placeholder').style.display='block'">`
            : '';

        let specsHtml = '';
        if (item.source === 'Laptops') {
            const cpu = [(item.cpuBrand || item.processor_brand || ''), (item.cpuModel || item.processor_model || '')].filter(Boolean).join(' ');
            const ram = item.ramCapacity || item.ram_gb;
            const storage = item.storageCap || item.storage_gb;
            const storageType = item.storageType || item.storage_type || '';
            if (cpu) specsHtml += `<div class="inv-product-card__spec">⚡ ${cpu}</div>`;
            if (ram) specsHtml += `<div class="inv-product-card__spec">🔧 ${ram}GB RAM</div>`;
            if (storage) specsHtml += `<div class="inv-product-card__spec">💾 ${storage}${storageType ? ' ' + storageType : ''}</div>`;
        } else {
            if (item.type) specsHtml += `<div class="inv-product-card__spec">📦 ${item.type}</div>`;
            if (item.connectivity) specsHtml += `<div class="inv-product-card__spec">🔗 ${item.connectivity}</div>`;
            const s = item.stock ?? item.quantity;
            if (s !== null && s !== undefined) specsHtml += `<div class="inv-product-card__spec">📊 Stock: ${s}</div>`;
        }

        const price = item.price ? `₹${Number(item.price).toLocaleString('en-IN')}` : 'N/A';
        const seriesLabel = item.source === 'Laptops' ? (item.series || item.brand || '') : (item.brand || '');

        return `
            <div class="inv-product-card">
                <div class="inv-product-card__img">
                    ${imgHtml}
                    <div class="img-placeholder" style="${imgSrc ? 'display:none' : 'display:block'}">${placeholder}</div>
                    <div class="inv-product-card__badge-row">
                        ${typeBadge}
                        ${stockBadge}
                    </div>
                </div>
                <div class="inv-product-card__body">
                    <div class="inv-product-card__series">${seriesLabel}</div>
                    <h4 class="inv-product-card__name">${item.displayName}</h4>
                    <div class="inv-product-card__specs">${specsHtml}</div>
                    <div class="inv-product-card__price">${price}</div>
                </div>
                <div class="inv-product-card__footer">
                    <button class="action-btn edit-btn" data-source="${item.source}" data-index="${item.index}">✏️ Edit</button>
                    <button class="action-btn delete-btn" data-source="${item.source}" data-id="${item._id || item.id}">🗑️ Delete</button>
                </div>
            </div>`;
    }

    function attachCardListeners(container) {
        container.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', handleEdit));
        container.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', handleDelete));
    }

    /* ---------- Layer 1: Brand Grid ---------- */

    window.invGoHome = function () {
        invCurrentBrand = null;
        invCurrentSeries = null;
        document.getElementById('inv-brand-view').style.display = 'block';
        document.getElementById('inv-series-view').style.display = 'none';
        document.getElementById('inv-product-view').style.display = 'none';
        updateInvBreadcrumb();
        renderBrandView();
    };

    window.invSelectBrand = function (brand) {
        invCurrentBrand = brand;
        invCurrentSeries = null;
        document.getElementById('inv-brand-view').style.display = 'none';
        document.getElementById('inv-series-view').style.display = 'block';
        document.getElementById('inv-product-view').style.display = 'none';
        updateInvBreadcrumb();
        renderSeriesView(brand);
    };

    function renderBrandView() {
        const items = getFilteredItems();
        const brandGrid = document.getElementById('inv-brand-grid');
        if (!brandGrid) return;
        brandGrid.className = 'inv-brand-grid';
        updateInvStats(items);

        const groups = {};
        items.forEach(item => {
            const b = item.brand || 'Unknown Brand';
            if (!groups[b]) groups[b] = { laptops: 0, accessories: 0 };
            if (item.source === 'Laptops') groups[b].laptops++;
            else groups[b].accessories++;
        });

        if (!Object.keys(groups).length) {
            brandGrid.innerHTML = '<div style="grid-column:1/-1;padding:60px;text-align:center;color:var(--text-secondary);">No products found. Add some laptops or accessories first.</div>';
            return;
        }

        // Brand logo map — add more as images become available
        const BRAND_LOGOS = {
            'ASUS': '/images/asus.png',
            'Acer': '/images/acer.png',
            'Dell': '/images/dell.png',
            'HP': '/images/hp.png',
            'Lenovo': '/images/lenovo.png',
            'MSI': '/images/msi.png',
            'Razer': '/images/RAZER.png',
            'Apple': '/images/APPLE.png',
        };

        brandGrid.innerHTML = Object.keys(groups).sort().map(brand => {
            const safeB = brand.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
            const logoSrc = BRAND_LOGOS[brand];
            const initials = brand.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

            const logoHtml = logoSrc
                ? `<img src="${logoSrc}" alt="${brand}" class="inv-brand-card__logo-img"
                       onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                   <div class="inv-brand-card__avatar" style="display:none">${initials}</div>`
                : `<div class="inv-brand-card__avatar">${initials}</div>`;

            return `
                <div class="inv-brand-card" onclick="window.invSelectBrand('${safeB}')">
                    <div class="inv-brand-card__logo-wrap">
                        ${logoHtml}
                    </div>
                    <h3 class="inv-brand-card__name">${brand}</h3>
                    <span class="inv-brand-card__arrow">→</span>
                </div>`;
        }).join('');
    }

    /* ---------- Layer 2: Series Grid ---------- */

    window.invGoToSeries = function () {
        const brand = invCurrentBrand;
        invCurrentSeries = null;
        document.getElementById('inv-brand-view').style.display = 'none';
        document.getElementById('inv-series-view').style.display = 'block';
        document.getElementById('inv-product-view').style.display = 'none';
        updateInvBreadcrumb();
        renderSeriesView(brand);
    };

    window.invSelectSeries = function (brand, series) {
        invCurrentBrand = brand;
        invCurrentSeries = series;
        document.getElementById('inv-brand-view').style.display = 'none';
        document.getElementById('inv-series-view').style.display = 'none';
        document.getElementById('inv-product-view').style.display = 'block';
        updateInvBreadcrumb();
        renderProductCardGrid(brand, series);
    };

    const SERIES_ICONS = {
        'ROG': '🔥', 'TUF': '⚔️', 'ZenBook': '✨', 'VivoBook': '📱', 'ProArt': '🎨',
        'ExpertBook': '💼', 'ThinkPad': '🖥️', 'IdeaPad': '💡', 'Inspiron': '🌟',
        'XPS': '💎', 'Pavilion': '🏠', 'Spectre': '👑', 'OMEN': '🎮', 'Predator': '🦁',
        'Nitro': '⚡', 'Mouse': '🖱️', 'Keyboard': '⌨️', 'Headset': '🎧',
        'Monitor': '🖱️', 'Dock': '🔌', 'Bag': '🎒', 'General': '📦', 'Uncategorized': '📁'
    };

    function renderSeriesView(brand) {
        const items = getFilteredItems().filter(i => (i.brand || 'Unknown Brand') === brand);
        const initials = brand.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
        const lCount = items.filter(i => i.source === 'Laptops').length;
        const aCount = items.filter(i => i.source === 'Accessories').length;

        const headerEl = document.getElementById('inv-brand-header');
        if (headerEl) {
            headerEl.innerHTML = `
                <div class="inv-brand-header__avatar">${initials}</div>
                <div>
                    <h2 class="inv-brand-header__name">${brand}</h2>
                    <p class="inv-brand-header__sub">
                        ${items.length} product${items.length !== 1 ? 's' : ''}
                        ${lCount > 0 ? ` · 💻 ${lCount} laptop${lCount !== 1 ? 's' : ''}` : ''}
                        ${aCount > 0 ? ` · 🎧 ${aCount} accessor${aCount !== 1 ? 'ies' : 'y'}` : ''}
                    </p>
                </div>`;
        }

        // Group by series
        const seriesGroups = {};
        items.forEach(item => {
            const s = item.series || (item.source === 'Accessories' ? (item.type || 'General') : 'Uncategorized');
            if (!seriesGroups[s]) seriesGroups[s] = [];
            seriesGroups[s].push(item);
        });

        const seriesGrid = document.getElementById('inv-series-grid');
        if (!seriesGrid) return;
        const safeB = brand.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

        let html = `
            <div class="inv-series-card all-products" onclick="window.invSelectSeries('${safeB}','__all__')">
                <div class="inv-series-card__icon">📦</div>
                <h3 class="inv-series-card__name">All ${brand} Products</h3>
                <div class="inv-series-card__count">${items.length} product${items.length !== 1 ? 's' : ''}</div>
            </div>`;

        html += Object.keys(seriesGroups).sort().map(s => {
            const safeS = s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
            const icon = SERIES_ICONS[s] || '📁';
            const count = seriesGroups[s].length;
            return `
                <div class="inv-series-card" onclick="window.invSelectSeries('${safeB}','${safeS}')">
                    <div class="inv-series-card__icon">${icon}</div>
                    <h3 class="inv-series-card__name">${s}</h3>
                    <div class="inv-series-card__count">${count} product${count !== 1 ? 's' : ''}</div>
                </div>`;
        }).join('');

        seriesGrid.innerHTML = html;
    }

    /* ---------- Layer 3: Product Card Grid ---------- */

    function renderProductCardGrid(brand, series) {
        let items = getFilteredItems().filter(i => (i.brand || 'Unknown Brand') === brand);
        if (series !== '__all__') {
            items = items.filter(item => {
                const s = item.series || (item.source === 'Accessories' ? (item.type || 'General') : 'Uncategorized');
                return s === series;
            });
        }

        const headerEl = document.getElementById('inv-series-header');
        if (headerEl) {
            const label = series === '__all__' ? `All ${brand} Products` : series;
            headerEl.innerHTML = `
                <div class="inv-section-header">
                    <div>
                        <h2>${label}</h2>
                        <p>${items.length} product${items.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>`;
        }

        const grid = document.getElementById('inv-product-grid');
        if (!grid) return;

        if (!items.length) {
            grid.innerHTML = '<div style="grid-column:1/-1;padding:60px;text-align:center;color:var(--text-secondary);">No products found in this series.</div>';
            return;
        }
        grid.innerHTML = items.map(buildProductCard).join('');
        attachCardListeners(grid);
    }

    /* ---------- Search: flat product card grid ---------- */

    function invHandleSearch() {
        const searchTerm = (document.getElementById('inventorySearch')?.value || '').toLowerCase().trim();
        const brandGrid = document.getElementById('inv-brand-grid');
        const brandView = document.getElementById('inv-brand-view');
        const seriesView = document.getElementById('inv-series-view');
        const productView = document.getElementById('inv-product-view');

        if (!searchTerm) {
            invCurrentBrand = null;
            invCurrentSeries = null;
            if (brandGrid) brandGrid.className = 'inv-brand-grid';
            if (brandView) brandView.style.display = 'block';
            if (seriesView) seriesView.style.display = 'none';
            if (productView) productView.style.display = 'none';
            updateInvBreadcrumb();
            renderBrandView();
            return;
        }

        if (brandView) brandView.style.display = 'block';
        if (seriesView) seriesView.style.display = 'none';
        if (productView) productView.style.display = 'none';

        const breadcrumb = document.getElementById('inv-breadcrumb');
        if (breadcrumb) {
            breadcrumb.innerHTML = `<span style="color:var(--text-secondary)">Search: </span><strong style="color:var(--text-primary)">"${searchTerm}"</strong>`;
        }

        const items = getFilteredItems().filter(item =>
            item.displayName.toLowerCase().includes(searchTerm) ||
            (item.brand && item.brand.toLowerCase().includes(searchTerm)) ||
            (item.series && item.series.toLowerCase().includes(searchTerm)) ||
            (item.cpuBrand && item.cpuBrand.toLowerCase().includes(searchTerm)) ||
            (item.processor_brand && item.processor_brand.toLowerCase().includes(searchTerm)) ||
            (item.cpuModel && item.cpuModel.toLowerCase().includes(searchTerm)) ||
            (item.processor_model && item.processor_model.toLowerCase().includes(searchTerm)) ||
            (item.gpuModel && item.gpuModel.toLowerCase().includes(searchTerm)) ||
            (item.gpu && item.gpu.toLowerCase().includes(searchTerm))
        );

        if (!brandGrid) return;
        brandGrid.className = 'inv-product-grid';

        if (!items.length) {
            brandGrid.innerHTML = '<div style="grid-column:1/-1;padding:60px;text-align:center;color:var(--text-secondary);">No products found matching your search.</div>';
            return;
        }
        brandGrid.innerHTML = items.map(buildProductCard).join('');
        attachCardListeners(brandGrid);
    }

    // Event Listeners for inventory controls
    if (document.getElementById('inventoryFilter')) {
        document.getElementById('inventoryFilter').addEventListener('change', () => {
            const searchTerm = (document.getElementById('inventorySearch')?.value || '').trim();
            if (searchTerm) {
                invHandleSearch();
            } else if (invCurrentSeries !== null) {
                renderProductCardGrid(invCurrentBrand, invCurrentSeries);
            } else if (invCurrentBrand) {
                renderSeriesView(invCurrentBrand);
            } else {
                renderBrandView();
            }
        });
    }

    if (document.getElementById('inventorySearch')) {
        document.getElementById('inventorySearch').addEventListener('input', invHandleSearch);
    }

    // --- DELETE HANDLER ---
    async function handleDelete(event) {
        const source = event.currentTarget.getAttribute('data-source');
        const itemId = event.currentTarget.getAttribute('data-id');

        const itemType = source === 'Laptops' ? 'laptop' : 'accessory';
        const confirmMessage = `Are you sure you want to delete this ${itemType}?`;

        if (!confirm(confirmMessage)) {
            return;
        }

        try {
            const endpoint = source === 'Laptops' ? '/api/laptops' : '/api/accessories';
            const response = await fetch(`${endpoint}/${itemId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                showLocalMessage(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} deleted successfully!`, 'success');
                loadInventory(); // Reload inventory
            } else {
                if (window.QuanteraUI?.showAlert) {
                    window.QuanteraUI.showAlert({
                        title: 'Delete Failed',
                        description: `We couldn't delete this ${itemType}. Please try again.`,
                        variant: 'error'
                    });
                } else {
                    alert(`Failed to delete ${itemType}.`);
                }
            }
        } catch (error) {
            console.error('Delete error:', error);
            if (window.QuanteraUI?.showAlert) {
                window.QuanteraUI.showAlert({
                    title: 'Connection Error',
                    description: 'Failed to connect to server.',
                    variant: 'error'
                });
            } else {
                alert('Failed to connect to server.');
            }
        }
    }

    // --- EDIT HANDLER ---
    async function handleEdit(event) {
        const source = event.currentTarget.getAttribute('data-source');
        const index = parseInt(event.currentTarget.getAttribute('data-index'));

        try {
            const endpoint = source === 'Laptops' ? '/api/laptops' : '/api/accessories';
            const response = await fetch(endpoint);
            const items = await response.json();
            const item = items[index];

            if (!item) {
                if (window.QuanteraUI?.showAlert) {
                    window.QuanteraUI.showAlert({
                        title: 'Not Found',
                        description: 'Item not found.',
                        variant: 'warning'
                    });
                } else {
                    alert('Item not found.');
                }
                return;
            }

            // Switch to appropriate mode — use MongoDB _id, not array index
            const itemId = item.id || item._id;
            if (source === 'Laptops') {
                switchMode('laptop');
                populateLaptopForm(item, itemId);
            } else {
                switchMode('accessory');
                populateAccessoryForm(item, itemId);
            }

            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            console.error('Edit error:', error);
            if (window.QuanteraUI?.showAlert) {
                window.QuanteraUI.showAlert({
                    title: 'Load Error',
                    description: 'Failed to load item for editing.',
                    variant: 'error'
                });
            } else {
                alert('Failed to load item for editing.');
            }
        }
    }

    // --- POPULATE LAPTOP FORM ---
    function populateLaptopForm(item, itemId) {
        const form = document.getElementById('laptopForm');
        if (!form) return;

        // Store the MongoDB _id for update
        form.setAttribute('data-edit-index', itemId);

        // Helper function to safely set field value
        const setField = (name, value) => {
            const field = form.querySelector(`[name="${name}"]`);
            if (field && value !== undefined && value !== null) {
                if (field.type === 'checkbox') {
                    field.checked = value;
                } else {
                    field.value = value;
                }
            }
        };

        // Map new dataset fields to form fields
        setField('brand', item.brand);
        setField('series', item.model_name || item.series);
        setField('modelNumber', item.model_name || item.modelNumber);
        setField('sku', item.id || item.sku);
        setField('launchYear', item.year || item.launchYear);
        setField('price', item.price);
        setField('discountPrice', item.discountPrice);
        setField('stock', item.stock);

        // CPU fields - map from new dataset
        setField('cpuBrand', item.processor_brand || item.cpuBrand);
        setField('cpuModel', item.processor_model || item.cpuModel);
        setField('cpuCores', item.cpuCores);
        setField('pCores', item.pCores);
        setField('eCores', item.eCores);
        setField('threads', item.threads);
        setField('baseClock', item.baseClock);
        setField('boostClock', item.boostClock);
        setField('cache', item.cache);
        setField('npu', item.npu);

        // GPU fields
        setField('gpuType', item.gpuType);
        setField('gpuModel', item.gpu || item.gpuModel);
        setField('vram', item.vram);
        setField('tgp', item.tgp);
        setField('muxSwitch', item.muxSwitch);

        // RAM fields
        setField('ramCapacity', item.ram_gb || item.ramCapacity);
        setField('ramType', item.ramType);
        setField('ramSpeed', item.ramSpeed);
        setField('ramSpeedUnit', item.ramSpeedUnit);
        setField('ramSlots', item.ramSlots);
        setField('maxRam', item.maxRam);

        // Storage fields
        setField('storageCap', item.storage_gb || item.storageCap);
        setField('storageType', item.storage_type || item.storageType);
        setField('extraSlots', item.extraSlots);

        // Display fields
        setField('displaySize', item.display_size_inch || (item.display && item.display.size));
        setField('resolution', item.resolution || (item.display && item.display.resolution));
        setField('aspectRatio', item.display && item.display.aspectRatio);
        setField('panelType', item.display && item.display.panelType);
        setField('refreshRate', item.refresh_rate || (item.display && item.display.refreshRate));
        setField('responseTime', item.display && item.display.responseTime);
        setField('brightness', item.display && item.display.brightness);
        setField('colorGamut', item.display && item.display.colorGamut);
        setField('touchscreen', item.display && item.display.touchscreen);

        // Design fields
        if (item.design) {
            setField('material', item.design.material);
            setField('color', item.design.color);
            setField('weight', item.design.weight);
            setField('dimensions', item.design.dimensions);
            setField('hinge', item.design.hinge);
            setField('milStd', item.design.milStd);
        } else {
            setField('weight', item.weight_kg);
        }

        // Power fields
        setField('battery', item.battery_wh || item.battery);
        setField('adapter', item.adapter);

        // Software fields
        setField('os', item.os);
        setField('warranty', item.warranty);
        setField('description', item.description);

        // Connectivity fields
        setField('wifi', item.wifi);
        setField('bluetooth', item.bluetooth);
        setField('ports', item.ports);

        // Multimedia fields
        setField('webcam', item.webcam);
        setField('speakers', item.speakers);

        // Input fields
        setField('keyboard', item.keyboard);
        setField('touchpad', item.touchpad);

        // Change submit button text
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = 'UPDATE LAPTOP';
            submitBtn.style.background = '#ff9800';
        }
    }

    // --- POPULATE ACCESSORY FORM ---
    function populateAccessoryForm(item, itemId) {
        const form = document.getElementById('accessoryForm');
        if (!form) return;

        // Store the MongoDB _id for update
        form.setAttribute('data-edit-index', itemId);

        // Populate fields
        form.querySelector('[name="name"]').value = item.name || '';
        form.querySelector('[name="type"]').value = item.type || '';
        form.querySelector('[name="brand"]').value = item.brand || '';
        form.querySelector('[name="price"]').value = item.price || '';
        form.querySelector('[name="stock"]').value = item.stock || '';
        form.querySelector('[name="connectivity"]').value = item.connectivity || '';
        form.querySelector('[name="description"]').value = item.description || '';

        // Change submit button text
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = 'UPDATE ACCESSORY';
            submitBtn.style.background = '#ff9800';
        }
    }

    // --- GENERIC SUBMISSION HANDLER ---
    async function handleSubmission(endpoint, formElement) {
        try {
            // Check if we're in edit mode
            const editIndex = formElement.getAttribute('data-edit-index');
            const isEditMode = editIndex !== null && editIndex !== '';

            // Get file input
            const fileInput = formElement.querySelector('input[type="file"]');
            let imagePaths = [];

            // Upload images first if any files selected
            if (fileInput && fileInput.files.length > 0) {
                const uploadFormData = new FormData();
                Array.from(fileInput.files).forEach(file => {
                    uploadFormData.append('images', file);
                });

                const uploadResponse = await fetch('/api/upload', {
                    method: 'POST',
                    body: uploadFormData
                });

                if (!uploadResponse.ok) {
                    throw new Error('Failed to upload images');
                }

                const uploadResult = await uploadResponse.json();
                imagePaths = uploadResult.images;
            }

            // Now collect form data
            const formData = new FormData(formElement);
            const data = {};

            formData.forEach((value, key) => {
                // Skip file inputs as we've already handled them
                if (key === 'images') return;

                if (data[key]) {
                    if (!Array.isArray(data[key])) {
                        data[key] = [data[key]];
                    }
                    data[key].push(value);
                } else {
                    data[key] = value;
                }
            });

            // Add uploaded image paths only if new images were uploaded
            if (imagePaths.length > 0) {
                data.images = imagePaths;
                // Also set first image as main image for backward compatibility
                data.image = imagePaths[0];
            }

            const checkboxes = formElement.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(cb => {
                data[cb.name] = cb.checked;
            });

            // Determine method and endpoint based on edit mode
            const method = isEditMode ? 'PUT' : 'POST';
            const finalEndpoint = isEditMode ? `${endpoint}/${editIndex}` : endpoint;

            const response = await fetch(finalEndpoint, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                const message = isEditMode ? 'Item Updated Successfully!' : 'Item Added Successfully!';
                alert(message);

                // Reset form and clear edit mode
                formElement.reset();
                formElement.removeAttribute('data-edit-index');

                // Reset submit button
                const submitBtn = formElement.querySelector('button[type="submit"]');
                if (submitBtn) {
                    if (endpoint.includes('laptops')) {
                        submitBtn.textContent = 'ADD LAPTOP TO INVENTORY';
                        submitBtn.style.background = 'linear-gradient(90deg, var(--accent-color), var(--secondary-accent))';
                    } else {
                        submitBtn.textContent = 'ADD ACCESSORY';
                        submitBtn.style.background = 'linear-gradient(90deg, var(--secondary-accent), #ff0055)';
                    }
                }

                // Clear image previews
                const previewContainers = document.querySelectorAll('[id$="PreviewContainer"]');
                previewContainers.forEach(container => {
                    container.style.display = 'none';
                    const preview = container.querySelector('[id$="Preview"]');
                    if (preview) preview.innerHTML = '';
                });

                // Reload inventory if we're in inventory view
                if (inventoryContainer && inventoryContainer.style.display !== 'none') {
                    loadInventory();
                }
            } else {
                let errMsg = isEditMode ? 'Error updating item.' : 'Error adding item.';
                try {
                    const errData = await response.json();
                    if (errData && errData.error) errMsg = errData.error;
                } catch (e) { /* ignore parse errors */ }
                alert(errMsg);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to connect to server or upload images.');
        }
    }

    // ============================================
    // ORDER MANAGEMENT LOGIC
    // ============================================

    let allOrders = [];

    async function loadOrders() {
        console.log('loadOrders() called');
        const ordersTableBody = document.getElementById('ordersTableBody');
        if (!ordersTableBody) {
            console.error('ordersTableBody element not found!');
            return;
        }

        ordersTableBody.innerHTML = '<tr><td colspan="6" style="padding: 40px; text-align: center; color: #aaa;">Loading orders...</td></tr>';

        try {
            console.log('Attempting to fetch orders from server...');
            // Try to fetch from server first
            const response = await fetch('/api/orders');
            if (response.ok) {
                allOrders = await response.json();
                console.log('Orders loaded from server:', allOrders.length);

                // Remove offline indicator if it exists
                const existingIndicator = document.getElementById('offlineIndicator');
                if (existingIndicator) {
                    existingIndicator.remove();
                }
            } else {
                throw new Error(`Server responded with ${response.status}`);
            }
        } catch (e) {
            console.warn('Could not load orders from server, trying localStorage:', e.message);

            // Fallback to localStorage
            const localOrders = JSON.parse(localStorage.getItem('quantera_orders') || '[]');
            console.log('Raw localStorage orders:', localOrders);

            // Transform localStorage orders to match server format
            allOrders = localOrders.map(order => {
                console.log('Transforming order:', order.orderId);
                return {
                    orderId: order.orderId,
                    customer: {
                        name: `${order.customer.firstName} ${order.customer.lastName}`,
                        email: order.customer.email,
                        phone: order.customer.phone
                    },
                    items: order.cart || order.items || [],
                    totalAmount: order.pricing?.total || order.totalAmount || 0,
                    status: order.status || 'Pending',
                    orderDate: order.orderDate,
                    lastUpdated: order.lastUpdated || order.orderDate,
                    shippingAddress: order.shipping?.address || {
                        street: order.customer.address1,
                        city: order.customer.city,
                        state: order.customer.state,
                        zipCode: order.customer.zipCode
                    },
                    payment: order.payment || { method: 'Unknown', status: 'Pending' }
                };
            });

            console.log('Transformed orders:', allOrders);

            // Add offline indicator
            const offlineIndicator = document.createElement('div');
            offlineIndicator.id = 'offlineIndicator';
            offlineIndicator.style.cssText = `
                background: #ff9800;
                color: #000;
                padding: 10px;
                text-align: center;
                font-weight: bold;
                margin-bottom: 20px;
                border-radius: 5px;
            `;
            offlineIndicator.textContent = '⚠️ Server Offline - Showing orders from local storage only';

            const existingIndicator = document.getElementById('offlineIndicator');
            if (existingIndicator) {
                existingIndicator.remove();
            }

            if (ordersTableBody.parentNode) {
                ordersTableBody.parentNode.insertBefore(offlineIndicator, ordersTableBody.parentNode.firstChild);
            }

            if (allOrders.length === 0) {
                ordersTableBody.innerHTML = '<tr><td colspan="6" style="padding: 40px; text-align: center; color: #aaa;">No orders found (server offline, showing localStorage data)</td></tr>';
                return;
            }
        }

        console.log('Calling renderOrders with', allOrders.length, 'orders');
        renderOrders();
    }

    function renderOrders() {
        console.log('renderOrders() called with', allOrders.length, 'orders');
        const ordersTableBody = document.getElementById('ordersTableBody');
        const statusFilter = document.getElementById('orderStatusFilter');
        const searchInput = document.getElementById('orderSearch');

        if (!ordersTableBody) {
            console.error('ordersTableBody not found in renderOrders!');
            return;
        }

        const filterValue = statusFilter ? statusFilter.value : 'all';
        const searchValue = searchInput ? searchInput.value.toLowerCase() : '';

        let filteredOrders = allOrders;

        // Filter by status
        if (filterValue !== 'all') {
            filteredOrders = filteredOrders.filter(order => order.status === filterValue);
        }

        // Filter by search
        if (searchValue) {
            filteredOrders = filteredOrders.filter(order =>
                order.orderId.toLowerCase().includes(searchValue) ||
                (order.customer?.name && order.customer.name.toLowerCase().includes(searchValue)) ||
                (order.customer?.email && order.customer.email.toLowerCase().includes(searchValue))
            );
        }

        console.log('Filtered orders:', filteredOrders.length);

        if (filteredOrders.length === 0) {
            ordersTableBody.innerHTML = '<tr><td colspan="6" style="padding: 40px; text-align: center; color: #aaa;">No orders found</td></tr>';
            return;
        }

        ordersTableBody.innerHTML = filteredOrders.map(order => {
            const statusColor = getStatusColor(order.status);
            const itemCount = order.items && Array.isArray(order.items) ? order.items.length : 0;

            return `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.2s;">
                    <td style="padding: 15px; color: var(--accent-color); font-weight: 600; font-size: 0.9rem;">
                        ${order.orderId}
                    </td>
                    <td style="padding: 15px; color: #fff; font-size: 0.9rem;">
                        <div style="font-weight: 500;">${order.customer?.name || 'N/A'}</div>
                        <div style="color: #aaa; font-size: 0.8rem; margin-top: 2px;">${order.customer?.email || ''}</div>
                    </td>
                    <td style="padding: 15px; color: #aaa; font-size: 0.9rem;">
                        ${itemCount} item${itemCount !== 1 ? 's' : ''}
                    </td>
                    <td style="padding: 15px; color: #fff; font-weight: 600; font-size: 0.9rem;">
                        $${order.totalAmount ? order.totalAmount.toFixed(2) : '0.00'}
                    </td>
                    <td style="padding: 15px;">
                        <span style="background: ${statusColor}; padding: 6px 12px; border-radius: 12px; font-size: 0.75rem; font-weight: 700; color: #000; display: inline-block;">
                            ${order.status}
                        </span>
                    </td>
                    <td style="padding: 15px;">
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <button class="view-order-btn" data-order-id="${order.orderId}" 
                                    style="padding: 6px 12px; background: var(--accent-color); border: none; border-radius: 5px; color: #000; font-weight: 600; cursor: pointer; font-size: 0.8rem; transition: all 0.2s;">
                                View
                            </button>
                            <select class="update-status-select" data-order-id="${order.orderId}"
                                    style="padding: 6px 10px; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.2); color: #fff; border-radius: 5px; cursor: pointer; font-size: 0.8rem;">
                                <option value="">Update...</option>
                                <option value="Pending" ${order.status === 'Pending' ? 'disabled' : ''}>Pending</option>
                                <option value="Processing" ${order.status === 'Processing' ? 'disabled' : ''}>Processing</option>
                                <option value="Shipped" ${order.status === 'Shipped' ? 'disabled' : ''}>Shipped</option>
                                <option value="Delivered" ${order.status === 'Delivered' ? 'disabled' : ''}>Delivered</option>
                                <option value="Cancelled" ${order.status === 'Cancelled' ? 'disabled' : ''}>Cancelled</option>
                            </select>
                            <button class="delete-order-btn" data-order-id="${order.orderId}" title="Delete Order"
                                    style="padding: 6px 10px; background: #ff4444; border: none; border-radius: 5px; color: #fff; font-weight: 600; cursor: pointer; font-size: 0.8rem; transition: all 0.2s;">
                                Delete
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Add hover effect to table rows
        const rows = ordersTableBody.querySelectorAll('tr');
        rows.forEach(row => {
            row.addEventListener('mouseenter', () => {
                row.style.background = 'rgba(255,255,255,0.03)';
            });
            row.addEventListener('mouseleave', () => {
                row.style.background = 'transparent';
            });
        });

        // Add event listeners
        document.querySelectorAll('.view-order-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const orderId = e.currentTarget.getAttribute('data-order-id');
                viewOrderDetails(orderId);
            });
        });

        document.querySelectorAll('.update-status-select').forEach(select => {
            select.addEventListener('change', async (e) => {
                const orderId = e.currentTarget.getAttribute('data-order-id');
                const newStatus = e.currentTarget.value;
                if (newStatus) {
                    await updateOrderStatus(orderId, newStatus);
                    e.currentTarget.value = ''; // Reset select
                }
            });
        });

        document.querySelectorAll('.delete-order-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const orderId = e.currentTarget.getAttribute('data-order-id');
                if (confirm(`Are you sure you want to permanently delete order ${orderId}? This action cannot be undone.`)) {
                    await deleteOrder(orderId);
                }
            });
        });
    }

    async function deleteOrder(orderId) {
        try {
            const response = await fetch(`/api/orders/${orderId}`, {
                method: 'DELETE'
            });
            const data = await response.json();

            if (response.ok) {
                await loadOrders(); // Refresh orders after successful deletion
            } else {
                alert(data.error || 'Failed to delete order');
            }
        } catch (error) {
            console.error('Error deleting order:', error);
            alert('Failed to connect to server');
        }
    }

    function getStatusColor(status) {
        const colors = {
            'Pending': '#ffa500',
            'Processing': '#00bfff',
            'Shipped': '#9370db',
            'Delivered': '#00ff7f',
            'Cancelled': '#ff4444'
        };
        return colors[status] || '#aaa';
    }

    function viewOrderDetails(orderId) {
        const order = allOrders.find(o => o.orderId === orderId);
        if (!order) {
            alert('Order not found');
            return;
        }

        const modal = document.getElementById('orderDetailsModal');
        const content = document.getElementById('orderDetailsContent');

        const orderDate = new Date(order.orderDate).toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const lastUpdated = new Date(order.lastUpdated).toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        let itemsHtml = '';
        if (order.items && Array.isArray(order.items)) {
            itemsHtml = order.items.map((item, index) => `
                <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 5px; margin-bottom: 10px;">
                    <strong style="color: #fff;">${index + 1}. ${item.name || item.brand + ' ' + item.modelNumber || 'Product'}</strong>
                    <div style="color: #aaa; font-size: 0.9rem; margin-top: 5px;">
                        Quantity: ${item.quantity || 1} | Price: ₹${item.price ? item.price.toFixed(2) : '0.00'}
                    </div>
                </div>
            `).join('');
        } else {
            itemsHtml = '<p style="color: #aaa;">No items listed</p>';
        }

        content.innerHTML = `
            <div style="display: grid; gap: 20px;">
                <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px;">
                    <h3 style="color: var(--accent-color); margin-top: 0;">Order Information</h3>
                    <div style="display: grid; gap: 10px; color: #fff;">
                        <div><strong>Order ID:</strong> ${order.orderId}</div>
                        <div><strong>Status:</strong> <span style="background: ${getStatusColor(order.status)}; padding: 4px 10px; border-radius: 12px; font-size: 0.85rem; font-weight: 600; color: #000;">${order.status}</span></div>
                        <div><strong>Order Date:</strong> ${orderDate}</div>
                        <div><strong>Last Updated:</strong> ${lastUpdated}</div>
                        <div><strong>Total Amount:</strong> $${order.totalAmount ? order.totalAmount.toFixed(2) : '0.00'}</div>
                    </div>
                </div>

                <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px;">
                    <h3 style="color: var(--accent-color); margin-top: 0;">Customer Information</h3>
                    <div style="display: grid; gap: 10px; color: #fff;">
                        <div><strong>Name:</strong> ${order.customer?.name || 'N/A'}</div>
                        <div><strong>Email:</strong> ${order.customer?.email || 'N/A'}</div>
                        <div><strong>Phone:</strong> ${order.customer?.phone || 'N/A'}</div>
                        <div><strong>Shipping Address:</strong> ${order.shippingAddress ?
                `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}` : 'N/A'}</div>
                    </div>
                </div>

                <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px;">
                    <h3 style="color: var(--accent-color); margin-top: 0;">Order Items</h3>
                    ${itemsHtml}
                </div>
            </div>
        `;

        modal.style.display = 'block';
    }

    async function updateOrderStatus(orderId, newStatus) {
        if (!confirm(`Update order ${orderId} status to ${newStatus}?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                alert('Order status updated successfully!');
                await loadOrders(); // Reload orders
            } else {
                alert('Failed to update order status.');
            }
        } catch (error) {
            console.error('Update error:', error);
            if (window.QuanteraUI?.showAlert) {
                window.QuanteraUI.showAlert({
                    title: 'Connection Error',
                    description: 'Failed to connect to server.',
                    variant: 'error'
                });
            } else {
                alert('Failed to connect to server.');
            }
        }
    }

    // Event listeners for order filters and search
    if (document.getElementById('orderStatusFilter')) {
        document.getElementById('orderStatusFilter').addEventListener('change', renderOrders);
    }

    if (document.getElementById('orderSearch')) {
        document.getElementById('orderSearch').addEventListener('input', renderOrders);
    }

    // Close order details modal
    if (document.getElementById('closeOrderDetails')) {
        document.getElementById('closeOrderDetails').addEventListener('click', () => {
            document.getElementById('orderDetailsModal').style.display = 'none';
        });
    }

    // Close modal when clicking outside
    if (document.getElementById('orderDetailsModal')) {
        document.getElementById('orderDetailsModal').addEventListener('click', (e) => {
            if (e.target.id === 'orderDetailsModal') {
                e.target.style.display = 'none';
            }
        });
    }

    // ============================================
    // EMAIL AUDIT LOGS
    // ============================================

    let allEmailLogs = [];

    async function loadEmailLogs() {
        const tbody = document.getElementById('emailLogBody');
        if (!tbody) return;

        tbody.innerHTML = '<tr><td colspan="5" style="padding: 40px; text-align: center; color: #aaa;">Loading email logs...</td></tr>';

        try {
            const response = await fetch('/api/admin/email-logs');
            if (response.ok) {
                allEmailLogs = await response.json();
                
                if (allEmailLogs.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="5" style="padding: 40px; text-align: center; color: #aaa;">No email logs found</td></tr>';
                    return;
                }

                tbody.innerHTML = allEmailLogs.map(log => {
                    const statusColor = log.status.toLowerCase() === 'sent' ? '#4CAF50' : '#F44336';
                    const textColor = log.status.toLowerCase() === 'sent' ? '#000' : '#fff';
                    const sentAt = new Date(log.sentAt).toLocaleString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                    });

                    return `
                        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.2s;">
                            <td style="padding: 15px; color: #fff; font-size: 0.9rem;">
                                <div style="font-weight: 500;">${log.recipient}</div>
                                <div style="color: #aaa; font-size: 0.8rem; margin-top: 4px;">Sub: ${log.subject}</div>
                            </td>
                            <td style="padding: 15px; color: #aaa;">${log.templateType}</td>
                            <td style="padding: 15px;">
                                <span style="background: ${statusColor}; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; color: ${textColor};">
                                    ${log.status.toUpperCase()}
                                </span>
                            </td>
                            <td style="padding: 15px; color: #aaa; font-size: 0.9rem;">${sentAt}</td>
                            <td style="padding: 15px;">
                                <div style="display: flex; gap: 8px; align-items: center;">
                                    ${log.error ? `<span title="${log.error.replace(/"/g, '&quot;')}" style="cursor: help; background: rgba(244,67,54,0.1); padding: 4px 8px; border-radius: 4px; border: 1px solid rgba(244,67,54,0.3); color: #ff5252; font-size: 0.8rem;">View Error</span>` : '<span style="color: #4CAF50; font-size: 0.8rem; margin-right: 5px;">✓ Success</span>'}
                                    <button class="edit-emaillog-btn" data-id="${log._id}" style="padding: 5px 10px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; border-radius: 4px; cursor: pointer; font-size: 0.8rem; transition: all 0.2s;">Edit</button>
                                </div>
                            </td>
                        </tr>
                    `;
                }).join('');

                // Add hover effect
                const rows = tbody.querySelectorAll('tr');
                rows.forEach(row => {
                    row.addEventListener('mouseenter', () => row.style.background = 'rgba(255,255,255,0.03)');
                    row.addEventListener('mouseleave', () => row.style.background = 'transparent');
                });

                document.querySelectorAll('.edit-emaillog-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const logId = e.currentTarget.getAttribute('data-id');
                        openEmailLogModal(logId);
                    });
                });

            } else {
                tbody.innerHTML = '<tr><td colspan="5" style="padding: 40px; text-align: center; color: #F44336;">Failed to load email logs</td></tr>';
            }
        } catch (error) {
            console.error('Error loading email logs:', error);
            tbody.innerHTML = '<tr><td colspan="5" style="padding: 40px; text-align: center; color: #F44336;">Error connecting to server</td></tr>';
        }
    }

    async function openEmailLogModal(id) {
        const log = allEmailLogs.find(l => l._id === id);
        if (!log) return;

        document.getElementById('editEmailLogId').value = log._id;
        document.getElementById('editEmailRecipient').value = log.recipient;
        document.getElementById('editEmailSubject').value = log.subject;
        document.getElementById('editEmailTemplate').value = log.templateType;
        
        const statusSelect = document.getElementById('editEmailStatus');
        for (let i = 0; i < statusSelect.options.length; i++) {
            if (statusSelect.options[i].value.toLowerCase() === log.status.toLowerCase()) {
                statusSelect.selectedIndex = i;
                break;
            }
        }

        const errorField = document.getElementById('editEmailError');
        if (log.error) {
            errorField.value = log.error;
            errorField.style.color = '#F44336';
        } else {
            errorField.value = 'No errors. Email was sent successfully.';
            errorField.style.color = '#4CAF50';
        }

        const bodyField = document.getElementById('editEmailBody');
        bodyField.value = 'Loading preview...';
        document.getElementById('emailLogModal').style.display = 'flex';

        try {
            const res = await fetch(`/api/admin/email-logs/${id}/preview`);
            if (res.ok) {
                const data = await res.json();
                bodyField.value = data.html || '';
            } else {
                bodyField.value = 'Failed to load preview.';
            }
        } catch (err) {
            console.error('Failed to load preview', err);
            bodyField.value = 'Error loading preview.';
        }
    }

    const emailLogModal = document.getElementById('emailLogModal');
    if (emailLogModal) {
        document.getElementById('closeEmailLogModal').addEventListener('click', () => {
            emailLogModal.style.display = 'none';
        });

        emailLogModal.addEventListener('click', (e) => {
            if (e.target === emailLogModal) emailLogModal.style.display = 'none';
        });

        document.getElementById('emailLogForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('editEmailLogId').value;
            const recipient = document.getElementById('editEmailRecipient').value;
            const subject = document.getElementById('editEmailSubject').value;
            const status = document.getElementById('editEmailStatus').value;

            try {
                const res = await fetch(`/api/admin/email-logs/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ recipient, subject, status })
                });

                if (res.ok) {
                    alert('Email log updated successfully!');
                    emailLogModal.style.display = 'none';
                    loadEmailLogs();
                } else {
                    const data = await res.json();
                    alert(data.error || 'Failed to update email log');
                }
            } catch (err) {
                console.error(err);
                alert('Error updating email log');
            }
        });

        document.getElementById('deleteEmailLogBtn').addEventListener('click', async () => {
            if (!confirm('Are you sure you want to delete this log?')) return;
            const id = document.getElementById('editEmailLogId').value;

            try {
                const res = await fetch(`/api/admin/email-logs/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    alert('Log deleted!');
                    emailLogModal.style.display = 'none';
                    loadEmailLogs();
                } else {
                    alert('Failed to delete log');
                }
            } catch (err) {
                console.error(err);
                alert('Error deleting log');
            }
        });

        document.getElementById('resendEmailLogBtn').addEventListener('click', async () => {
            if (!confirm('Resend this email?')) return;
            const id = document.getElementById('editEmailLogId').value;
            const btn = document.getElementById('resendEmailLogBtn');
            const originalText = btn.textContent;
            btn.textContent = 'Sending...';
            btn.disabled = true;

            try {
                const recipient = document.getElementById('editEmailRecipient').value;
                const subject = document.getElementById('editEmailSubject').value;
                const status = document.getElementById('editEmailStatus').value;
                const customHtml = document.getElementById('editEmailBody').value;

                await fetch(`/api/admin/email-logs/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ recipient, subject, status })
                });

                const res = await fetch(`/api/admin/email-logs/${id}/resend`, { 
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ html: customHtml })
                });
                
                if (res.ok) {
                    alert('Email resent successfully!');
                    emailLogModal.style.display = 'none';
                    loadEmailLogs();
                } else {
                    const data = await res.json();
                    alert(data.error || 'Failed to resend email');
                }
            } catch (err) {
                console.error(err);
                alert('Error resending email');
            } finally {
                btn.textContent = originalText;
                btn.disabled = false;
            }
        });
    }
    
    // Attach to window just in case
    window.loadEmailLogs = loadEmailLogs;

});
