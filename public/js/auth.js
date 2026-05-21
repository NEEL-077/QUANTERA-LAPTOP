/* =========================================
   auth.js — Quantéra Authentication Client
   ========================================= */

const API = '/api/auth';
const RETURN_KEY = 'q_returnTo';

// ---------- helpers ----------
const $ = id => document.getElementById(id);
const show = el => el && (el.style.display = '');
const hide = el => el && (el.style.display = 'none');

function showAlert(el, msg, type = 'error') {
    el.textContent = msg;
    el.className = `auth-alert ${type}`;
}

function clearAlert(el) {
    el.className = 'auth-alert';
    el.textContent = '';
}

function setLoading(btn, loading) {
    btn.classList.toggle('loading', loading);
    btn.disabled = loading;
}

// ---------- Token helpers ----------
function saveTokens(accessToken, refreshToken, remember) {
    const store = remember ? localStorage : sessionStorage;
    store.setItem('q_access', accessToken);
    store.setItem('q_refresh', refreshToken);
    if (remember) localStorage.setItem('q_remember', '1');
}

function getAccessToken() {
    return localStorage.getItem('q_access') || sessionStorage.getItem('q_access');
}

function getRefreshToken() {
    return localStorage.getItem('q_refresh') || sessionStorage.getItem('q_refresh');
}

function clearTokens() {
    ['q_access', 'q_refresh', 'q_remember', 'q_user'].forEach(k => {
        localStorage.removeItem(k);
        sessionStorage.removeItem(k);
    });
}

function getUser() {
    try {
        const raw = localStorage.getItem('q_user') || sessionStorage.getItem('q_user');
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

function saveUser(user, remember) {
    const store = remember ? localStorage : sessionStorage;
    store.setItem('q_user', JSON.stringify(user));
}

// ─────────────────────────────────────────────────────────
// SMART REDIRECT HELPERS
// Strategy: capture → validate (same-origin, not blacklisted)
//           → consume (read-once, then delete)
// ─────────────────────────────────────────────────────────

/** Pages that should NEVER be a redirect destination */
const REDIRECT_BLACKLIST = ['/login', '/login.html'];

/**
 * Validates a URL: must be same-origin and not blacklisted.
 * Returns the safe URL or '/' as fallback.
 */
function getSafeReturnUrl(url) {
    if (!url) return '/';
    try {
        // Allow relative URLs and same-origin absolute URLs only
        const parsed = new URL(url, window.location.origin);
        if (parsed.origin !== window.location.origin) return '/';  // block open redirects
        const path = parsed.pathname.toLowerCase();
        if (REDIRECT_BLACKLIST.some(b => path.startsWith(b))) return '/';
        return parsed.pathname + parsed.search + parsed.hash;
    } catch {
        return '/';
    }
}

/**
 * Saves the current page URL as the post-login destination.
 * Call this BEFORE navigating away to /login.
 */
function captureReturnTo(url) {
    const safe = getSafeReturnUrl(url || window.location.href);
    if (safe !== '/') sessionStorage.setItem(RETURN_KEY, safe);
}

/**
 * Reads and clears the stored return URL.
 * Priority: sessionStorage → ?redirect= URL param → '/'
 */
function consumeReturnUrl() {
    // 1. Check sessionStorage (set when redirected from a protected page)
    const stored = sessionStorage.getItem(RETURN_KEY);
    if (stored) {
        sessionStorage.removeItem(RETURN_KEY);
        return getSafeReturnUrl(stored);
    }
    // 2. Fall back to ?redirect= query param (e.g. /login?redirect=%2Fabout.html)
    const param = new URLSearchParams(window.location.search).get('redirect');
    return getSafeReturnUrl(param);
}

/** Navigates to the appropriate destination after auth, with brief success delay */
function redirectAfterAuth(alertEl, message, delay = 1200) {
    showAlert(alertEl, message, 'success');
    const dest = consumeReturnUrl();
    setTimeout(() => { window.location.href = dest; }, delay);
}

// ---------- Panel switcher ----------
let currentPanel = 'login';

function showPanel(name) {
    // Remove active from all panels
    document.querySelectorAll('.auth-panel').forEach(p => {
        p.classList.remove('active', 'panel-entering');
    });

    const target = document.querySelector(`.auth-panel[data-panel="${name}"]`);
    if (target) {
        target.classList.add('active');
        // Trigger entrance animation via a separate class (removed after animation finishes)
        // so re-activating the same panel never sticks at opacity:0
        requestAnimationFrame(() => {
            target.classList.add('panel-entering');
            target.addEventListener('animationend', () => {
                target.classList.remove('panel-entering');
            }, { once: true });
        });
    }

    // Show/hide tabs only on login + register
    const tabs = $('authTabs');
    tabs && (tabs.style.display = (name === 'login' || name === 'register') ? '' : 'none');
    currentPanel = name;
}

// ---------- Tabs ----------
document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        showPanel(tab.dataset.target);
    });
});

// ---------- Password visibility toggles ----------
document.querySelectorAll('.pw-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
        const input = btn.previousElementSibling;
        const isText = input.type === 'text';
        input.type = isText ? 'password' : 'text';
        btn.textContent = isText ? '👁' : '🙈';
    });
});

// ---------- Password strength meter ----------
function calcStrength(pw) {
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score; // 0-5
}

const regPassword = $('regPassword');
if (regPassword) {
    regPassword.addEventListener('input', () => {
        const score = calcStrength(regPassword.value);
        const segments = document.querySelectorAll('#strengthBar .strength-segment');
        const label = $('strengthLabel');
        const colors = ['#ff4444', '#ff4444', '#ff9900', '#ffd700', '#00ff91', '#00ff91'];
        const labels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'];
        segments.forEach((seg, i) => {
            seg.style.background = i < score ? colors[score] : 'rgba(255,255,255,0.1)';
        });
        if (label) label.textContent = regPassword.value ? labels[score] : '';
    });
}


// ---------- LOGIN ----------
const loginForm = $('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async e => {
        e.preventDefault();
        const alert = $('loginAlert');
        clearAlert(alert);

        const email = $('loginEmail').value.trim();
        const password = $('loginPassword').value;
        const remember = $('rememberMe')?.checked || false;
        const btn = $('loginBtn');

        if (!email || !password) {
            showAlert(alert, 'Please fill in all fields.'); return;
        }

        setLoading(btn, true);

        try {
            const res = await fetch(`${API}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, remember })
            });

            const data = await res.json();

            if (!res.ok) {
                showAlert(alert, data.error || 'Invalid email or password.');
                return;
            }

            // Success
            saveTokens(data.accessToken, data.refreshToken, remember);
            saveUser(data.user, remember);

            if (data.mfaRequired) {
                // Proceed to MFA step — returnTo URL is preserved in sessionStorage
                showPanel('mfa');
                showAlert($('mfaAlert'), 'Enter the 6-digit code from your authenticator app.', 'info');
            } else {
                redirectAfterAuth(alert, '✅ Login successful! Redirecting...');
            }
        } catch (err) {
            showAlert(alert, 'Network error. Please try again.');
        } finally {
            setLoading(btn, false);
        }
    });
}

// ---------- REGISTER ----------
const registerForm = $('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async e => {
        e.preventDefault();
        const alert = $('registerAlert');
        clearAlert(alert);

        const name = $('regName').value.trim();
        const email = $('regEmail').value.trim();
        const password = $('regPassword').value;
        const confirm = $('regConfirm').value;
        const terms = $('regTerms')?.checked;
        const btn = $('registerBtn');

        // Client-side validation
        if (!name || !email || !password || !confirm) {
            showAlert(alert, 'Please fill in all fields.'); return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showAlert(alert, 'Please enter a valid email address.'); return;
        }
        if (calcStrength(password) < 2) {
            showAlert(alert, 'Password is too weak. Use 8+ characters with numbers and uppercase.'); return;
        }
        if (password !== confirm) {
            showAlert(alert, 'Passwords do not match.'); return;
        }
        if (!terms) {
            showAlert(alert, 'Please accept the terms and conditions.'); return;
        }

        setLoading(btn, true);

        try {
            const res = await fetch(`${API}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });

            const data = await res.json();

            if (!res.ok) {
                showAlert(alert, data.error || 'Registration failed.'); return;
            }

            showAlert(alert, '🎉 Account created! Signing you in...', 'success');

            // Auto-login after successful registration
            try {
                const loginRes = await fetch(`${API}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password, remember: false })
                });

                const loginData = await loginRes.json();

                if (loginRes.ok) {
                    saveTokens(loginData.accessToken, loginData.refreshToken, false);
                    saveUser(loginData.user, false);
                    redirectAfterAuth(alert, '✅ Registration successful! Redirecting...', 1000);
                } else {
                    // Fallback if auto-login fails for some reason
                    setTimeout(() => {
                        document.querySelector('.auth-tab[data-target="login"]')?.click();
                        $('loginEmail').value = email;
                    }, 1200);
                }
            } catch (loginErr) {
                // Fallback on network error
                setTimeout(() => {
                    document.querySelector('.auth-tab[data-target="login"]')?.click();
                    $('loginEmail').value = email;
                }, 1200);
            }
        } catch (err) {
            showAlert(alert, 'Network error. Please try again.');
        } finally {
            setLoading(btn, false);
        }
    });
}

// ---------- MFA VERIFY ----------
const mfaForm = $('mfaForm');
if (mfaForm) {
    mfaForm.addEventListener('submit', async e => {
        e.preventDefault();
        const alert = $('mfaAlert');
        const code = $('mfaCode').value.trim();
        const btn = $('mfaBtn');

        if (!code || code.length !== 6) {
            showAlert(alert, 'Enter a valid 6-digit code.'); return;
        }

        setLoading(btn, true);
        try {
            const res = await fetch(`${API}/verify-mfa`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getAccessToken()}`
                },
                body: JSON.stringify({ code })
            });

            const data = await res.json();
            if (!res.ok) { showAlert(alert, data.error || 'Invalid code.'); return; }

            redirectAfterAuth(alert, '✅ Verified! Redirecting...');
        } catch { showAlert(alert, 'Network error.'); }
        finally { setLoading(btn, false); }
    });
}

// ---------- FORGOT PASSWORD ----------
const forgotForm = $('forgotForm');
if (forgotForm) {
    forgotForm.addEventListener('submit', async e => {
        e.preventDefault();
        const alert = $('forgotAlert');
        clearAlert(alert);
        const email = $('forgotEmail').value.trim();
        const btn = $('forgotBtn');

        if (!email) { showAlert(alert, 'Please enter your email.'); return; }

        setLoading(btn, true);
        try {
            const res = await fetch(`${API}/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();

            // Always show success (prevent enumeration)
            if (data.resetToken) {
                showAlert(alert,
                    `📬 Reset token (demo mode):\n${data.resetToken}\n\nCopy it to use on the reset page.`,
                    'info');
            } else {
                showAlert(alert, '📬 If that email exists, a reset link has been sent.', 'success');
            }
        } catch { showAlert(alert, 'Network error.'); }
        finally { setLoading(btn, false); }
    });
}

// ---------- RESET PASSWORD ----------
const resetForm = $('resetForm');
if (resetForm) {
    // Pre-fill token from URL param
    const urlToken = new URLSearchParams(window.location.search).get('token');
    if (urlToken) $('resetToken').value = urlToken;

    resetForm.addEventListener('submit', async e => {
        e.preventDefault();
        const alert = $('resetAlert');
        clearAlert(alert);
        const token = $('resetToken').value.trim();
        const password = $('resetPassword').value;
        const confirm = $('resetConfirm').value;
        const btn = $('resetBtn');

        if (!token || !password || !confirm) { showAlert(alert, 'All fields are required.'); return; }
        if (password !== confirm) { showAlert(alert, 'Passwords do not match.'); return; }
        if (calcStrength(password) < 2) { showAlert(alert, 'New password is too weak.'); return; }

        setLoading(btn, true);
        try {
            const res = await fetch(`${API}/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password })
            });
            const data = await res.json();
            if (!res.ok) { showAlert(alert, data.error || 'Reset failed.'); return; }

            showAlert(alert, '✅ Password reset! Redirecting to login...', 'success');
            setTimeout(() => showPanel('login'), 2000);
        } catch { showAlert(alert, 'Network error.'); }
        finally { setLoading(btn, false); }
    });
}

// ---------- Back buttons ----------
document.querySelectorAll('[data-back]').forEach(btn => {
    btn.addEventListener('click', () => showPanel(btn.dataset.back));
});

// ---------- Already logged in? ----------
function checkAlreadyLoggedIn() {
    const token = getAccessToken();
    const isResetFlow = new URLSearchParams(window.location.search).has('token');
    if (token && !isResetFlow) {
        // Already authenticated: go to returnTo or home
        // Don't consume — just peek (user navigated to /login while logged in)
        const dest = consumeReturnUrl();
        window.location.replace(dest); // Use replace to prevent back-button loops
        return true; // redirecting — body stays hidden (user won't see it)
    }
    return false;
}

// Run immediately on script load.
// If NOT redirecting, reveal the body right away — the <style> in <head> keeps it
// hidden until this point so there's zero flash if we ARE redirecting.
if (!checkAlreadyLoggedIn()) {
    document.body.style.visibility = 'visible';
}

// Also run on 'pageshow' to catch Back-Forward Cache (BFCache) navigations
window.addEventListener('pageshow', (event) => {
    // Only re-check if the page was restored from cache
    if (event.persisted) {
        checkAlreadyLoggedIn();
    }
});

// ---------- Show panel based on URL ----------
(function initPanel() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('token')) {
        showPanel('reset');
    } else if (params.get('panel')) {
        showPanel(params.get('panel'));
        const tab = document.querySelector(`.auth-tab[data-target="${params.get('panel')}"]`);
        if (tab) {
            document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        }
    }
})();
