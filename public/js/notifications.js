/**
 * Quantéra Global Notifications
 * Logic for Shadcn-inspired Alerts
 */

window.QuanteraUI = window.QuanteraUI || {};

(function() {
    // Standard Lucide/Feather stroke-based icons
    const ICONS = {
        default: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
        info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
        success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
        error: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
        warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
        terminal: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>`
    };

    let container = null;

    function ensureContainer() {
        if (!container) {
            container = document.createElement('div');
            container.className = 'qa-alert-container';
            document.body.appendChild(container);
        }
        return container;
    }

    /**
     * Show a premium alert notification
     * @param {Object|string} options - Calculation options or just a message string
     */
    window.QuanteraUI.showAlert = function(options = {}) {
        // Handle string-only message for backward compatibility (treat as title)
        if (typeof options === 'string') {
            options = { title: options };
        }

        let {
            title = '',
            description = '',
            variant = 'default', // default, info, success, error, warning
            duration = 4000,
            icon = null
        } = options;

        // Auto-fix: If there's only a title and no description, 
        // and we want to enforce the Title + Description pattern:
        if (title && !description) {
            // Treat the provided string as the description, 
            // and generate a standard Title based on the variant.
            description = title;
            const defaultTitles = {
                success: 'Success',
                error: 'Error',
                warning: 'Warning',
                info: 'Notice',
                default: 'Notice'
            };
            title = defaultTitles[variant] || 'Notice';
        }

        const parent = ensureContainer();
        
        // Create Alert Element
        const alert = document.createElement('div');
        alert.className = `qa-alert qa-alert-${variant}`;
        alert.setAttribute('role', 'alert');

        // Icon mapping
        const iconName = icon || variant;
        const iconSvg = ICONS[iconName] || ICONS.default;
        
        alert.innerHTML = `
            <div class="qa-alert-icon">${iconSvg}</div>
            <div class="qa-alert-content">
                <div class="qa-alert-title">${title}</div>
                <div class="qa-alert-description">${description || ''}</div>
            </div>
            <button class="qa-alert-close" aria-label="Close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px;"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
        `;

        // Handle Close
        const closeBtn = alert.querySelector('.qa-alert-close');
        const dismiss = () => {
            if (alert.parentElement) {
                alert.classList.add('exit');
                setTimeout(() => alert.remove(), 400);
            }
        };

        closeBtn.onclick = (e) => {
            e.stopPropagation();
            dismiss();
        };

        // Auto Dismiss
        if (duration > 0) {
            setTimeout(dismiss, duration);
        }

        // Click to dismiss anywhere
        alert.onclick = dismiss;

        // Add to DOM
        if (window.innerWidth > 600) {
            parent.appendChild(alert);
        } else {
            parent.prepend(alert);
        }

        return alert;
    };

    /**
     * Global Legacy Redirection
     */
    window.showGlobalNotification = function(message, type = 'info') {
        const variant = type === 'error' ? 'error' : (type === 'success' ? 'success' : 'info');
        return window.QuanteraUI.showAlert({
            description: message,
            variant: variant
        });
    };

})();
