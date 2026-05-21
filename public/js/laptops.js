document.addEventListener('DOMContentLoaded', async () => {
    let allLaptops = [];
    let currentBrand = null;
    let filteredLaptops = [];

    // Brand logos mapping
    const brandLogos = {
        'HP': 'images/hp.png',
        'Dell': 'images/dell.png',
        'Lenovo': 'images/lenovo.png',
        'Apple': 'images/APPLE.png',
        'ASUS': 'images/asus.png',
        'Acer': 'images/acer.png',
        'MSI': 'images/msi.png',
        'Razer': 'images/RAZER.png'
    };

    // Load laptops data
    async function loadLaptops() {
        try {
            const response = await fetch('/api/laptops?full=true');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            allLaptops = await response.json();
            renderBrandSelection();
        } catch (error) {
            console.error('Error loading laptops:', error);
            document.getElementById('brandGrid').innerHTML = 
                '<div class="no-results">Failed to load brands. Please try again.</div>';
        }
    }

    // Group laptops by brand and get counts
    function getBrandData() {
        const brandData = {};
        allLaptops.forEach(laptop => {
            const brand = laptop.brand || 'Other';
            if (!brandData[brand]) {
                brandData[brand] = [];
            }
            brandData[brand].push(laptop);
        });
        return brandData;
    }

    // Render brand selection grid
    function renderBrandSelection() {
        const brandData = getBrandData();
        const brandGrid = document.getElementById('brandGrid');
        
        const brandCards = Object.entries(brandData)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([brand, laptops]) => createBrandCard(brand, laptops.length))
            .join('');

        brandGrid.innerHTML = brandCards;
        
        // Add click listeners to brand cards
        document.querySelectorAll('.brand-card').forEach(card => {
            card.addEventListener('click', () => {
                const brand = card.dataset.brand;
                showBrandPage(brand);
            });
        });
    }

    // Create brand card HTML
    function createBrandCard(brand, count) {
        const logoPath = brandLogos[brand];
        console.log(`Creating card for ${brand}, logo path: ${logoPath}`); // Debug log
        
        const logoElement = logoPath 
            ? `<img src="${logoPath}" alt="${brand} logo" class="brand-logo-img" onload="console.log('Logo loaded: ${brand}')" onerror="console.log('Logo failed: ${brand}')">`
            : `<span class="brand-logo-text">${brand.charAt(0)}</span>`;
        
        return `
            <div class="brand-card" data-brand="${brand}">
                <div class="brand-logo">${logoElement}</div>
                <div class="brand-name">${brand}</div>
                <div class="brand-count">${count} laptops</div>
            </div>
        `;
    }

    // Show brand-specific page
    function showBrandPage(brand) {
        currentBrand = brand;
        const brandLaptops = allLaptops.filter(laptop => laptop.brand === brand);
        filteredLaptops = [...brandLaptops];
        
        // Hide brand selection and show brand page
        document.getElementById('brandSelection').style.display = 'none';
        document.getElementById('brandPageSection').style.display = 'block';
        
        // Update brand page header
        const logoPath = brandLogos[brand];
        const brandLogoElement = document.getElementById('brandLogoLarge');
        
        if (logoPath) {
            brandLogoElement.innerHTML = `<img src="${logoPath}" alt="${brand} logo" class="brand-logo-img">`;
        } else {
            brandLogoElement.textContent = brand.charAt(0);
        }
        
        document.getElementById('brandNameLarge').textContent = brand;
        document.getElementById('brandLaptopCount').textContent = `${brandLaptops.length} laptops available`;
        
        // Reset filters
        resetFilters();
        
        // Render laptops
        renderBrandLaptops();
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Go back to brand selection
    function showBrandSelection() {
        document.getElementById('brandPageSection').style.display = 'none';
        document.getElementById('brandSelection').style.display = 'block';
        currentBrand = null;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Render laptops for current brand
    function renderBrandLaptops() {
        const container = document.getElementById('brandLaptopsContainer');
        
        if (filteredLaptops.length === 0) {
            container.innerHTML = '<div class="no-results">No laptops found matching your criteria.</div>';
            return;
        }

        const laptopCards = filteredLaptops.map(laptop => createLaptopCard(laptop)).join('');
        container.innerHTML = `<div class="brand-laptops-grid">${laptopCards}</div>`;
    }

    // Create laptop card HTML
    function createLaptopCard(laptop) {
        const price = laptop.price || 0;
        const discountPrice = laptop.discountPrice;
        const displayPrice = discountPrice || price;
        const image = laptop.image || laptop.images?.[0] || 'images/ASUS ROG STRIX G16.webp';
        
        const brand = laptop.brand || 'Other';
        const model = laptop.series || laptop.modelNumber || 'Model';

        const categoryEmojis = {
            'gaming': '🎮',
            'professional': '💼',
            'student': '🎓',
            'business': '🏢',
            'creator': '✏️',
            'ultrabook': '💻'
        };
        const categoryEmoji = categoryEmojis[laptop.category] || '💻';
        const logoPath = brandLogos[brand];

        return `
            <div class="product-card" onclick="viewLaptopDetails('${laptop.id}')">
                <div class="card-bg" style="background-image: url('${image}')"></div>
                <div class="card-overlay"></div>
                
                ${logoPath ? `
                    <div class="card-logo-container">
                        <img src="${logoPath}" alt="${brand} logo">
                    </div>
                ` : ''}

                <div class="card-content">
                    <div class="card-details">
                        <div class="card-subtitle">${categoryEmoji} ${brand} ${laptop.category || 'Laptop'}</div>
                        <h3 class="card-title">${model}</h3>
                        <div style="margin-top: 15px;">
                            <h4 class="card-overview-label">OVERVIEW</h4>
                            <p class="card-overview">
                                ${laptop.cpuBrand || 'CPU'} ${laptop.cpuModel || ''} | 
                                ${laptop.ramCapacity || 'RAM'}GB RAM | 
                                ${laptop.storageCap || 'Storage'}GB ${laptop.storageType || 'Storage'} | 
                                ${laptop.gpuModel || laptop.gpuType || 'Graphics'}
                            </p>
                        </div>
                    </div>

                    <div class="card-footer">
                        <div class="card-price-container">
                            <span class="card-price">₹${displayPrice.toLocaleString()}</span>
                            ${discountPrice ? `<span class="card-price-period" style="text-decoration: line-through;">Was ₹${price.toLocaleString()}</span>` : '<span class="card-price-period">Final Price (Inc. GST)</span>'}
                        </div>
                        <button class="card-btn">
                            Details 
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // Apply filters to current brand laptops
    function applyFilters() {
        if (!currentBrand) return;
        
        const categoryFilter = document.querySelector('.filter-tab.active')?.dataset.category || '';
        const priceFilter = document.getElementById('priceFilter').value;
        const searchFilter = document.getElementById('searchFilter').value.toLowerCase();
        
        const brandLaptops = allLaptops.filter(laptop => laptop.brand === currentBrand);
        
        filteredLaptops = brandLaptops.filter(laptop => {
            // Category filter
            if (categoryFilter && laptop.category !== categoryFilter) {
                return false;
            }

            // Price filter
            if (priceFilter) {
                const [min, max] = priceFilter.split('-').map(Number);
                const price = laptop.discountPrice || laptop.price || 0;
                if (price < min || price > max) {
                    return false;
                }
            }

            // Search filter
            if (searchFilter) {
                const searchText = `${laptop.brand} ${laptop.series} ${laptop.modelNumber} ${laptop.cpuModel} ${laptop.gpuModel}`.toLowerCase();
                if (!searchText.includes(searchFilter)) {
                    return false;
                }
            }

            return true;
        });

        renderBrandLaptops();
    }

    // Reset all filters
    function resetFilters() {
        // Reset category tabs
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector('.filter-tab[data-category=""]').classList.add('active');
        
        // Reset other filters
        document.getElementById('priceFilter').value = '';
        document.getElementById('searchFilter').value = '';
    }

    // Clear all filters
    function clearFilters() {
        resetFilters();
        applyFilters();
    }

    // Navigate to laptop details with state preservation
    function viewLaptopDetails(laptopId) {
        if (window.navigationStateManager) {
            window.navigationStateManager.navigateToProduct(laptopId, 'laptop');
        } else {
            window.location.href = `product.html?id=${laptopId}`;
        }
    }

    // Make function globally available
    window.viewLaptopDetails = viewLaptopDetails;
    
    // Expose functions for state restoration
    window.showBrandPage = showBrandPage;
    window.showBrandSelection = showBrandSelection;
    document.getElementById('backToBrands').addEventListener('click', showBrandSelection);
    document.getElementById('clearFilters').addEventListener('click', clearFilters);

    // Category tab listeners
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('filter-tab')) {
            // Remove active class from all tabs
            document.querySelectorAll('.filter-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Add active class to clicked tab
            e.target.classList.add('active');
            
            // Apply filters
            applyFilters();
        }
    });

    // Load data on page load
    await loadLaptops();
});