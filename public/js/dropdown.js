/**
 * Premium Dropdown Controller (Vanilla JS)
 * Mimics Shadcn / Radix Select behavior
 */

class PremiumSelect {
    constructor(container) {
        this.container = container;
        this.trigger = container.querySelector('.q-select-trigger');
        this.content = container.querySelector('.q-select-content');
        this.valueDisplay = container.querySelector('.q-select-value');
        this.hiddenInput = container.querySelector('input[type="hidden"]');
        this.items = container.querySelectorAll('.q-select-item');
        
        this.isOpen = false;
        this.init();
    }

    init() {
        // Toggle dropdown on trigger click
        this.trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });

        // Handle item selection
        this.items.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectItem(item);
                this.close();
            });
        });

        // Close on outside click
        document.addEventListener('click', () => {
            if (this.isOpen) this.close();
        });

        // Prevent dropdown click from closing itself
        this.content.addEventListener('click', (e) => e.stopPropagation());
    }

    toggle() {
        this.isOpen ? this.close() : this.open();
    }

    open() {
        // Close other open selects
        document.querySelectorAll('.q-select-content.show').forEach(el => el.classList.remove('show'));
        document.querySelectorAll('.q-select-trigger.active').forEach(el => el.classList.remove('active'));

        this.isOpen = true;
        this.content.classList.add('show');
        this.trigger.classList.add('active');
        this.trigger.setAttribute('aria-expanded', 'true');
    }

    close() {
        this.isOpen = false;
        this.content.classList.remove('show');
        this.trigger.classList.remove('active');
        this.trigger.setAttribute('aria-expanded', 'false');
    }

    selectItem(item) {
        const value = item.getAttribute('data-value');
        const label = item.querySelector('.q-select-item-text').textContent;

        // Update display and hidden input
        this.valueDisplay.textContent = label;
        this.hiddenInput.value = value;
        
        // Update visual state of items
        this.items.forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');

        // Trigger 'change' event on hidden input for form listeners
        const event = new Event('change', { bubbles: true });
        this.hiddenInput.dispatchEvent(event);
    }
}

/**
 * Premium Combobox Controller (Vanilla JS)
 * Hybrid Input + Dropdown for datalists
 */
class PremiumCombobox {
    constructor(container) {
        this.container = container;
        this.input = container.querySelector('.q-combobox-input');
        this.content = container.querySelector('.q-select-content');
        this.items = container.querySelectorAll('.q-select-item');
        
        this.isOpen = false;
        this.init();
    }

    init() {
        this.input.addEventListener('focus', () => this.open());
        
        this.input.addEventListener('input', (e) => {
            this.filterItems(e.target.value);
            if (!this.isOpen) this.open();
        });

        this.items.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectItem(item);
                this.close();
            });
        });

        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target) && this.isOpen) {
                this.close();
            }
        });
    }

    filterItems(search) {
        const term = search.toLowerCase();
        this.items.forEach(item => {
            const text = item.querySelector('.q-select-item-text').textContent.toLowerCase();
            if (text.includes(term)) {
                item.classList.remove('hidden');
            } else {
                item.classList.add('hidden');
            }
        });
    }

    open() {
        // Close others
        document.querySelectorAll('.q-select-content.show').forEach(el => el.classList.remove('show'));
        this.isOpen = true;
        this.content.classList.add('show');
    }

    close() {
        this.isOpen = false;
        this.content.classList.remove('show');
    }

    selectItem(item) {
        const value = item.getAttribute('data-value');
        this.input.value = value;
        
        // Trigger input event to update datalist listeners if any
        this.input.dispatchEvent(new Event('input', { bubbles: true }));
        this.input.dispatchEvent(new Event('change', { bubbles: true }));
    }
}

// Initialize all premium components on page load
document.addEventListener('DOMContentLoaded', () => {
    initializePremiumUI();
});

function initializePremiumUI() {
    const selects = document.querySelectorAll('.q-select-container');
    selects.forEach(select => {
        if (!select.dataset.initialized) {
            new PremiumSelect(select);
            select.dataset.initialized = "true";
        }
    });

    const comboboxes = document.querySelectorAll('.q-combobox-container');
    comboboxes.forEach(cb => {
        if (!cb.dataset.initialized) {
            new PremiumCombobox(cb);
            cb.dataset.initialized = "true";
        }
    });
}

/**
 * Helper to dynamically create a premium select from original data
 * (Useful for dynamic brand/category lists)
 */
function createPremiumSelect(originalSelect) {
    const name = originalSelect.name;
    const required = originalSelect.required ? 'required' : '';
    const id = originalSelect.id || `select_${Math.random().toString(36).substr(2, 9)}`;
    const placeholder = originalSelect.getAttribute('data-placeholder') || 'Select an option...';
    
    // Extract options
    const options = Array.from(originalSelect.options).map(opt => ({
        label: opt.text,
        value: opt.value,
        selected: opt.selected
    }));

    const container = document.createElement('div');
    container.className = 'q-select-container';
    container.style.position = 'relative';

    container.innerHTML = `
        <div class="q-select-trigger" tabindex="0" role="combobox" aria-expanded="false" aria-haspopup="listbox">
            <span class="q-select-value">${placeholder}</span>
            <svg class="q-select-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 9l6 6 6-6" />
            </svg>
        </div>
        <div class="q-select-content">
            <div class="q-select-viewport" role="listbox">
                ${options.map(opt => `
                    <div class="q-select-item ${opt.selected ? 'selected' : ''}" data-value="${opt.value}" role="option">
                        <span class="q-select-item-text">${opt.label}</span>
                        <svg class="q-select-item-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 6L9 17l-5-5" />
                        </svg>
                    </div>
                `).join('')}
            </div>
        </div>
        <input type="hidden" name="${name}" value="${options.find(o => o.selected)?.value || ''}" ${required} id="${id}">
    `;

    // Replace old select
    originalSelect.parentNode.replaceChild(container, originalSelect);

    // Initialize new select
    new PremiumSelect(container);
}

/**
 * Helper to dynamically create a premium combobox from original datalist input
 */
function createPremiumCombobox(originalInput) {
    const listId = originalInput.getAttribute('list');
    if (!listId) return;

    const datalist = document.getElementById(listId);
    if (!datalist) return;

    const name = originalInput.name;
    const placeholder = originalInput.placeholder || 'Type or select...';
    const required = originalInput.required ? 'required' : '';
    const id = originalInput.id || `combo_${Math.random().toString(36).substr(2, 9)}`;

    // Extract options from datalist
    const options = Array.from(datalist.options).map(opt => ({
        label: opt.text || opt.value,
        value: opt.value
    }));

    const container = document.createElement('div');
    container.className = 'q-combobox-container';

    container.innerHTML = `
        <input type="text" name="${name}" class="q-input q-combobox-input" 
               placeholder="${placeholder}" autocomplete="off" ${required} id="${id}"
               value="${originalInput.value}">
        <svg class="q-select-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 9l6 6 6-6" />
        </svg>
        <div class="q-select-content">
            <div class="q-select-viewport" role="listbox">
                ${options.map(opt => `
                    <div class="q-select-item" data-value="${opt.value}" role="option">
                        <span class="q-select-item-text">${opt.label}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    // Replace old input
    originalInput.parentNode.replaceChild(container, originalInput);

    // Initialize new combobox
    new PremiumCombobox(container);
}
