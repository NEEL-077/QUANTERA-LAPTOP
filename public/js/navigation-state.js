// =====================================================
// NAVIGATION STATE MANAGEMENT SYSTEM
// =====================================================

class NavigationStateManager {
    constructor() {
        this.stateKey = 'quantera_navigation_state';
        this.currentState = this.loadState();
        this.setupEventListeners();
    }

    // Load state from sessionStorage
    loadState() {
        try {
            const saved = sessionStorage.getItem(this.stateKey);
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.warn('Failed to load navigation state:', error);
            return {};
        }
    }

    // Save state to sessionStorage
    saveState() {
        try {
            sessionStorage.setItem(this.stateKey, JSON.stringify(this.currentState));
        } catch (error) {
            console.warn('Failed to save navigation state:', error);
        }
    }

    // Save page state before navigation
    savePageState(pageKey, state) {
        this.currentState[pageKey] = {
            ...this.currentState[pageKey],
            ...state,
            timestamp: Date.now()
        };
        this.saveState();
    }

    // Get saved page state
    getPageState(pageKey) {
        return this.currentState[pageKey] || {};
    }

    // Clear old states (older than 1 hour)
    cleanupOldStates() {
        const oneHour = 60 * 60 * 1000;
        const now = Date.now();
        
        Object.keys(this.currentState).forEach(key => {
            const state = this.currentState[key];
            if (state.timestamp && (now - state.timestamp) > oneHour) {
                delete this.currentState[key];
            }
        });
        
        this.saveState();
    }

    // Setup event listeners for automatic state saving
    setupEventListeners() {
        // Save scroll position periodically
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.saveCurrentScrollPosition();
            }, 100);
        });

        // Save state before page unload
        window.addEventListener('beforeunload', () => {
            this.saveCurrentPageState();
        });

        // Clean up old states on page load
        this.cleanupOldStates();
    }

    // Save current scroll position
    saveCurrentScrollPosition() {
        const pageKey = this.getCurrentPageKey();
        if (pageKey) {
            this.savePageState(pageKey, {
                scrollY: window.scrollY,
                scrollX: window.scrollX
            });
        }
    }

    // Save current page state (filters, search, etc.)
    saveCurrentPageState() {
        const pageKey = this.getCurrentPageKey();
        if (!pageKey) return;

        const state = {
            scrollY: window.scrollY,
            scrollX: window.scrollX,
            url: window.location.href,
            timestamp: Date.now()
        };

        // Save page-specific state
        if (pageKey === 'laptops') {
            state.filters = this.getLaptopPageState();
        } else if (pageKey === 'accessories') {
            state.filters = this.getAccessoryPageState();
        }

        this.savePageState(pageKey, state);
    }

    // Get current page key
    getCurrentPageKey() {
        const path = window.location.pathname;
        if (path.includes('laptops')) return 'laptops';
        if (path.includes('accessories')) return 'accessories';
        if (path.includes('product')) return 'product';
        if (path.includes('accessory-product')) return 'accessory-product';
        return null;
    }

    // Get laptop page state
    getLaptopPageState() {
        const state = {};
        
        // Get filter values
        const priceFilter = document.getElementById('priceFilter');
        const searchFilter = document.getElementById('searchFilter');
        
        if (priceFilter) state.priceFilter = priceFilter.value;
        if (searchFilter) state.searchFilter = searchFilter.value;

        // Get active brand/category
        const activeBrandTab = document.querySelector('.brand-tab.active');
        if (activeBrandTab) {
            state.activeBrand = activeBrandTab.dataset.brand;
        }

        // Get current view (brand selection vs brand page)
        const brandSelection = document.getElementById('brandSelection');
        const brandPageSection = document.getElementById('brandPageSection');
        
        if (brandSelection && brandPageSection) {
            state.currentView = brandSelection.style.display === 'none' ? 'brandPage' : 'brandSelection';
        }

        // Get active category tab
        const activeCategoryTab = document.querySelector('.category-tab.active');
        if (activeCategoryTab) {
            state.activeCategory = activeCategoryTab.dataset.category;
        }

        return state;
    }

    // Get accessory page state
    getAccessoryPageState() {
        const state = {};
        
        // Get filter values
        const priceFilter = document.getElementById('priceFilter');
        const searchFilter = document.getElementById('searchFilter');
        
        if (priceFilter) state.priceFilter = priceFilter.value;
        if (searchFilter) state.searchFilter = searchFilter.value;

        // Get active device type
        const activeDeviceTab = document.querySelector('.device-tab.active');
        if (activeDeviceTab) {
            state.activeDevice = activeDeviceTab.dataset.device;
        }

        // Get current view
        const deviceSelection = document.getElementById('deviceSelection');
        const devicePageSection = document.getElementById('devicePageSection');
        
        if (deviceSelection && devicePageSection) {
            state.currentView = deviceSelection.style.display === 'none' ? 'devicePage' : 'deviceSelection';
        }

        return state;
    }

    // Restore page state
    restorePageState(pageKey) {
        const state = this.getPageState(pageKey);
        if (!state) return false;

        // Restore scroll position (with delay to ensure page is loaded)
        if (typeof state.scrollY === 'number') {
            setTimeout(() => {
                window.scrollTo(state.scrollX || 0, state.scrollY);
            }, 100);
        }

        // Restore page-specific state
        if (pageKey === 'laptops' && state.filters) {
            this.restoreLaptopPageState(state.filters);
        } else if (pageKey === 'accessories' && state.filters) {
            this.restoreAccessoryPageState(state.filters);
        }

        return true;
    }

    // Restore laptop page state
    restoreLaptopPageState(filters) {
        // Restore filters with visual feedback
        if (filters.priceFilter) {
            const priceFilter = document.getElementById('priceFilter');
            if (priceFilter) {
                priceFilter.value = filters.priceFilter;
                priceFilter.classList.add('filter-restored');
                setTimeout(() => priceFilter.classList.remove('filter-restored'), 1000);
            }
        }

        if (filters.searchFilter) {
            const searchFilter = document.getElementById('searchFilter');
            if (searchFilter) {
                searchFilter.value = filters.searchFilter;
                searchFilter.classList.add('filter-restored');
                setTimeout(() => searchFilter.classList.remove('filter-restored'), 1000);
            }
        }

        // Restore view and brand selection
        if (filters.currentView === 'brandPage' && filters.activeBrand) {
            // Wait for page to load, then restore brand view
            setTimeout(() => {
                if (window.showBrandPage && typeof window.showBrandPage === 'function') {
                    window.showBrandPage(filters.activeBrand);
                    
                    // Highlight restored brand tab
                    setTimeout(() => {
                        const brandTab = document.querySelector(`[data-brand="${filters.activeBrand}"]`);
                        if (brandTab) {
                            brandTab.classList.add('restored');
                            setTimeout(() => brandTab.classList.remove('restored'), 800);
                        }
                    }, 100);
                    
                    // Restore category tab
                    if (filters.activeCategory) {
                        setTimeout(() => {
                            const categoryTab = document.querySelector(`[data-category="${filters.activeCategory}"]`);
                            if (categoryTab) {
                                categoryTab.click();
                                categoryTab.classList.add('restored');
                                setTimeout(() => categoryTab.classList.remove('restored'), 800);
                            }
                        }, 200);
                    }
                }
            }, 300);
        }
    }

    // Restore accessory page state
    restoreAccessoryPageState(filters) {
        // Restore filters with visual feedback
        if (filters.priceFilter) {
            const priceFilter = document.getElementById('priceFilter');
            if (priceFilter) {
                priceFilter.value = filters.priceFilter;
                priceFilter.classList.add('filter-restored');
                setTimeout(() => priceFilter.classList.remove('filter-restored'), 1000);
            }
        }

        if (filters.searchFilter) {
            const searchFilter = document.getElementById('searchFilter');
            if (searchFilter) {
                searchFilter.value = filters.searchFilter;
                searchFilter.classList.add('filter-restored');
                setTimeout(() => searchFilter.classList.remove('filter-restored'), 1000);
            }
        }

        // Restore view and device selection
        if (filters.currentView === 'devicePage' && filters.activeDevice) {
            setTimeout(() => {
                if (window.showDevicePage && typeof window.showDevicePage === 'function') {
                    window.showDevicePage(filters.activeDevice);
                    
                    // Highlight restored device tab
                    setTimeout(() => {
                        const deviceTab = document.querySelector(`[data-device="${filters.activeDevice}"]`);
                        if (deviceTab) {
                            deviceTab.classList.add('restored');
                            setTimeout(() => deviceTab.classList.remove('restored'), 800);
                        }
                    }, 100);
                }
            }, 300);
        }
    }

    // Create back navigation with state preservation
    createBackButton(targetPage, customText = null) {
        const backBtn = document.createElement('button');
        backBtn.className = 'back-navigation-btn';
        backBtn.innerHTML = `
            <span class="back-icon">←</span>
            ${customText || `Back to ${targetPage.charAt(0).toUpperCase() + targetPage.slice(1)}`}
        `;
        
        backBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.navigateBack(targetPage);
        });

        return backBtn;
    }

    // Navigate back with state restoration
    navigateBack(targetPage) {
        // Save current page state before leaving
        this.saveCurrentPageState();
        
        // Navigate to target page
        const targetUrl = `${targetPage}.html`;
        window.location.href = targetUrl;
    }

    // Enhanced navigation for product links
    navigateToProduct(productId, productType = 'laptop') {
        // Save current page state
        this.saveCurrentPageState();
        
        // Navigate to product page
        const productUrl = productType === 'accessory' ? 
            `accessory-product.html?id=${productId}` : 
            `product.html?id=${productId}`;
            
        window.location.href = productUrl;
    }

    // Get referrer information for back navigation
    getReferrerInfo() {
        const referrer = document.referrer;
        if (!referrer) return null;

        const url = new URL(referrer);
        const path = url.pathname;

        if (path.includes('laptops')) return { page: 'laptops', hasState: !!this.getPageState('laptops').timestamp };
        if (path.includes('accessories')) return { page: 'accessories', hasState: !!this.getPageState('accessories').timestamp };
        
        return null;
    }

    // Initialize page with state restoration
    initializePage() {
        const pageKey = this.getCurrentPageKey();
        if (!pageKey) return;

        // Check if we should restore state (coming from a product page)
        const referrerInfo = this.getReferrerInfo();
        const shouldRestore = referrerInfo || this.shouldRestoreState();

        if (shouldRestore) {
            // Small delay to ensure page elements are loaded
            setTimeout(() => {
                this.restorePageState(pageKey);
            }, 100);
        }
    }

    // Check if we should restore state based on navigation timing
    shouldRestoreState() {
        const pageKey = this.getCurrentPageKey();
        const state = this.getPageState(pageKey);
        
        // Restore if state exists and is recent (within 5 minutes)
        if (state.timestamp) {
            const fiveMinutes = 5 * 60 * 1000;
            return (Date.now() - state.timestamp) < fiveMinutes;
        }
        
        return false;
    }
}

// Create global instance
window.navigationStateManager = new NavigationStateManager();

// Auto-initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    window.navigationStateManager.initializePage();
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NavigationStateManager;
}
// =====================================================
// NAVIGATION FEEDBACK AND VISUAL INDICATORS
// =====================================================

// Show navigation state indicator
NavigationStateManager.prototype.showStateIndicator = function(message, duration = 2000) {
    // Remove existing indicator
    const existing = document.querySelector('.navigation-state-indicator');
    if (existing) existing.remove();
    
    // Create new indicator
    const indicator = document.createElement('div');
    indicator.className = 'navigation-state-indicator';
    indicator.textContent = message;
    
    document.body.appendChild(indicator);
    
    // Show with animation
    setTimeout(() => indicator.classList.add('show'), 100);
    
    // Hide after duration
    setTimeout(() => {
        indicator.classList.remove('show');
        setTimeout(() => indicator.remove(), 300);
    }, duration);
};

// Show navigation loading bar
NavigationStateManager.prototype.showNavigationLoading = function() {
    let loader = document.querySelector('.navigation-loading');
    if (!loader) {
        loader = document.createElement('div');
        loader.className = 'navigation-loading';
        document.body.appendChild(loader);
    }
    loader.classList.add('active');
    return loader;
};

// Hide navigation loading bar
NavigationStateManager.prototype.hideNavigationLoading = function() {
    const loader = document.querySelector('.navigation-loading');
    if (loader) {
        loader.classList.remove('active');
    }
};

// Enhanced navigate back with visual feedback
NavigationStateManager.prototype.navigateBackWithFeedback = function(targetPage) {
    // Show loading
    const loader = this.showNavigationLoading();
    
    // Save current state
    this.saveCurrentPageState();
    
    // Show feedback
    this.showStateIndicator('Returning to previous page...', 1000);
    
    // Navigate after brief delay for UX
    setTimeout(() => {
        window.location.href = `${targetPage}.html`;
    }, 300);
};

// Enhanced navigate to product with visual feedback
NavigationStateManager.prototype.navigateToProductWithFeedback = function(productId, productType = 'laptop') {
    // Show loading
    const loader = this.showNavigationLoading();
    
    // Save current state
    this.saveCurrentPageState();
    
    // Show feedback
    this.showStateIndicator('Loading product details...', 1000);
    
    // Navigate after brief delay
    setTimeout(() => {
        const productUrl = productType === 'accessory' ? 
            `accessory-product.html?id=${productId}` : 
            `product.html?id=${productId}`;
        window.location.href = productUrl;
    }, 200);
};

// Enhanced restore with visual feedback
NavigationStateManager.prototype.restorePageStateWithFeedback = function(pageKey) {
    const state = this.getPageState(pageKey);
    if (!state) return false;

    // Show restoration indicator
    this.showStateIndicator('Restoring previous state...', 1500);
    
    // Add restoration animation class to body
    document.body.classList.add('state-restoring');
    setTimeout(() => document.body.classList.remove('state-restoring'), 600);
    
    // Restore state
    return this.restorePageState(pageKey);
};

// Browser back button handling
NavigationStateManager.prototype.setupBrowserBackHandling = function() {
    // Listen for popstate events (browser back/forward)
    window.addEventListener('popstate', (event) => {
        const pageKey = this.getCurrentPageKey();
        if (pageKey && event.state) {
            // Restore state if available
            setTimeout(() => {
                this.restorePageStateWithFeedback(pageKey);
            }, 100);
        }
    });
    
    // Push initial state
    if (window.history.state === null) {
        const pageKey = this.getCurrentPageKey();
        if (pageKey) {
            window.history.replaceState({ page: pageKey }, '', window.location.href);
        }
    }
};

// Initialize enhanced navigation on page load
document.addEventListener('DOMContentLoaded', () => {
    if (window.navigationStateManager) {
        window.navigationStateManager.setupBrowserBackHandling();
        
        // Override the default navigation methods with feedback versions
        window.navigationStateManager.navigateBack = window.navigationStateManager.navigateBackWithFeedback;
        window.navigationStateManager.navigateToProduct = window.navigationStateManager.navigateToProductWithFeedback;
        
        // Enhanced initialization with feedback
        setTimeout(() => {
            const restored = window.navigationStateManager.restorePageStateWithFeedback(
                window.navigationStateManager.getCurrentPageKey()
            );
            
            if (restored) {
                console.log('Navigation state restored successfully');
            }
        }, 150);
    }
});