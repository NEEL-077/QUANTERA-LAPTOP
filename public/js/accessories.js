document.addEventListener('DOMContentLoaded', async () => {
    let allAccessories = [];
    let currentDevice = null;
    let filteredAccessories = [];

    // Device categories mapping
    const deviceCategories = {
        'laptop': { icon: '💻', name: 'Laptop Accessories' },
        'mobile': { icon: '📱', name: 'Mobile Accessories' },
        'tablet': { icon: '📱', name: 'Tablet Accessories' },
        'gaming': { icon: '🎮', name: 'Gaming Accessories' }
    };

    // Load accessories data
    async function loadAccessories() {
        try {
            const response = await fetch('/api/accessories');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            allAccessories = await response.json();
            renderDeviceSelection();
        } catch (error) {
            console.error('Error loading accessories:', error);
            document.getElementById('deviceGrid').innerHTML = 
                '<div class="no-results">Failed to load categories. Please try again.</div>';
        }
    }

    // Map accessory types to device categories
    function getDeviceCategory(accessory) {
        const type = (accessory.type || '').toLowerCase();
        const name = (accessory.name || '').toLowerCase();
        
        if (type.includes('mouse') || type.includes('keyboard') || type.includes('webcam') || 
            type.includes('dock') || name.includes('laptop') || name.includes('notebook')) {
            return 'laptop';
        }
        if (type.includes('phone') || type.includes('mobile') || name.includes('phone') || 
            name.includes('mobile') || type.includes('charger')) {
            return 'mobile';
        }
        if (type.includes('tablet') || name.includes('tablet') || name.includes('ipad')) {
            return 'tablet';
        }
        if (type.includes('gaming') || type.includes('controller') || type.includes('headset') || 
            name.includes('gaming') || name.includes('controller')) {
            return 'gaming';
        }
        
        return 'laptop'; // Default to laptop accessories
    }

    // Group accessories by device category and get counts
    function getDeviceData() {
        const deviceData = {
            laptop: [],
            mobile: [],
            tablet: [],
            gaming: []
        };
        
        allAccessories.forEach(accessory => {
            const category = getDeviceCategory(accessory);
            deviceData[category].push(accessory);
        });
        
        return deviceData;
    }

    // Render device selection grid
    function renderDeviceSelection() {
        const deviceData = getDeviceData();
        const deviceGrid = document.getElementById('deviceGrid');
        
        const deviceCards = Object.entries(deviceData)
            .filter(([_, accessories]) => accessories.length > 0)
            .map(([device, accessories]) => createDeviceCard(device, accessories.length))
            .join('');

        deviceGrid.innerHTML = deviceCards;
        
        // Add click listeners to device cards
        document.querySelectorAll('.device-card').forEach(card => {
            card.addEventListener('click', () => {
                const device = card.dataset.device;
                showDevicePage(device);
            });
        });
    }

    // Create device card HTML
    function createDeviceCard(device, count) {
        const deviceInfo = deviceCategories[device];
        
        return `
            <div class="device-card" data-device="${device}">
                <div class="device-icon">${deviceInfo.icon}</div>
                <div class="device-name">${deviceInfo.name}</div>
                <div class="device-count">${count} accessories</div>
            </div>
        `;
    }

    // Show device-specific page
    function showDevicePage(device) {
        currentDevice = device;
        const deviceAccessories = allAccessories.filter(accessory => getDeviceCategory(accessory) === device);
        filteredAccessories = [...deviceAccessories];
        
        // Hide device selection and show device page
        document.getElementById('deviceSelection').style.display = 'none';
        document.getElementById('devicePageSection').style.display = 'block';
        
        // Update device page header
        const deviceInfo = deviceCategories[device];
        document.getElementById('deviceIconLarge').textContent = deviceInfo.icon;
        document.getElementById('deviceNameLarge').textContent = deviceInfo.name;
        document.getElementById('deviceAccessoryCount').textContent = `${deviceAccessories.length} accessories available`;
        
        // Populate brand filters
        populateBrandFilters(deviceAccessories);
        
        // Reset filters
        resetFilters();
        
        // Render accessories
        renderDeviceAccessories();
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Go back to device selection
    function showDeviceSelection() {
        document.getElementById('devicePageSection').style.display = 'none';
        document.getElementById('deviceSelection').style.display = 'block';
        currentDevice = null;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Populate brand filter tabs
    function populateBrandFilters(accessories) {
        const brands = [...new Set(accessories.map(acc => acc.brand).filter(Boolean))].sort();
        const brandTabs = document.getElementById('brandTabs');
        
        // Keep "All Brands" tab and add brand-specific tabs
        const allBrandsTab = brandTabs.querySelector('[data-brand=""]');
        brandTabs.innerHTML = '';
        brandTabs.appendChild(allBrandsTab);
        
        brands.forEach(brand => {
            const tab = document.createElement('button');
            tab.className = 'filter-tab';
            tab.dataset.brand = brand;
            tab.textContent = brand;
            brandTabs.appendChild(tab);
        });
    }

    // Render accessories for current device
    function renderDeviceAccessories() {
        const container = document.getElementById('deviceAccessoriesContainer');
        
        if (filteredAccessories.length === 0) {
            container.innerHTML = '<div class="no-results">No accessories found matching your criteria.</div>';
            return;
        }

        const accessoryCards = filteredAccessories.map(accessory => createAccessoryCard(accessory)).join('');
        container.innerHTML = `<div class="device-accessories-grid">${accessoryCards}</div>`;
    }

    // Create accessory card HTML
    function createAccessoryCard(accessory) {
        const price = accessory.price || 0;
        const discountPrice = accessory.discountPrice;
        const displayPrice = discountPrice || price;
        const image = accessory.image || accessory.image_url || 'images/ASUS ROG STRIX G16.webp';
        
        const name = accessory.name || 'Accessory';
        const type = accessory.type || 'Official Accessory';

        return `
            <div class="product-card" onclick="viewAccessoryDetails('${accessory.id || accessory._id}')">
                <div class="card-bg" style="background-image: url('${image}')"></div>
                <div class="card-overlay"></div>
                
                <div class="card-content">
                    <div class="card-details">
                        <div class="card-subtitle">${type}</div>
                        <h3 class="card-title">${name}</h3>
                        <div style="margin-top: 15px;">
                            <h4 class="card-overview-label">OVERVIEW</h4>
                            <p class="card-overview">${accessory.description || 'Premium accessory for your devices.'}</p>
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

    // Apply filters to current device accessories
    function applyFilters() {
        if (!currentDevice) return;
        
        const brandFilter = document.querySelector('.brand-filters .filter-tab.active')?.dataset.brand || '';
        const priceFilter = document.getElementById('priceFilter').value;
        const searchFilter = document.getElementById('searchFilter').value.toLowerCase();
        
        const deviceAccessories = allAccessories.filter(accessory => getDeviceCategory(accessory) === currentDevice);
        
        filteredAccessories = deviceAccessories.filter(accessory => {
            // Brand filter
            if (brandFilter && accessory.brand !== brandFilter) {
                return false;
            }

            // Price filter
            if (priceFilter) {
                const [min, max] = priceFilter.split('-').map(Number);
                const price = accessory.discountPrice || accessory.price || 0;
                if (price < min || price > max) {
                    return false;
                }
            }

            // Search filter
            if (searchFilter) {
                const searchText = `${accessory.name} ${accessory.brand} ${accessory.type} ${accessory.description}`.toLowerCase();
                if (!searchText.includes(searchFilter)) {
                    return false;
                }
            }

            return true;
        });

        renderDeviceAccessories();
    }

    // Reset all filters
    function resetFilters() {
        // Reset brand tabs
        document.querySelectorAll('.brand-filters .filter-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector('.brand-filters .filter-tab[data-brand=""]').classList.add('active');
        
        // Reset other filters
        document.getElementById('priceFilter').value = '';
        document.getElementById('searchFilter').value = '';
    }

    // Clear all filters
    function clearFilters() {
        resetFilters();
        applyFilters();
    }

    // Navigate to accessory details with state preservation
    function viewAccessoryDetails(accessoryId) {
        if (window.navigationStateManager) {
            window.navigationStateManager.navigateToProduct(accessoryId, 'accessory');
        } else {
            window.location.href = `accessory-product.html?id=${accessoryId}`;
        }
    }

    // Make function globally available
    window.viewAccessoryDetails = viewAccessoryDetails;
    
    // Expose functions for state restoration
    window.showDevicePage = showDevicePage;
    window.showDeviceSelection = showDeviceSelection;

    // Event listeners
    document.getElementById('backToDevices').addEventListener('click', showDeviceSelection);
    document.getElementById('priceFilter').addEventListener('change', applyFilters);
    document.getElementById('searchFilter').addEventListener('input', applyFilters);
    document.getElementById('clearFilters').addEventListener('click', clearFilters);

    // Brand tab listeners
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('filter-tab') && e.target.closest('.brand-filters')) {
            // Remove active class from all brand tabs
            document.querySelectorAll('.brand-filters .filter-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Add active class to clicked tab
            e.target.classList.add('active');
            
            // Apply filters
            applyFilters();
        }
    });

    // Load data on page load
    await loadAccessories();
});