document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('q_access') || sessionStorage.getItem('q_access');
    if (!token) {
        window.location.href = '/auth.html';
        return;
    }

    const sections = document.querySelectorAll('.section');
    const navItems = document.querySelectorAll('.dash-nav-item');
    const mainContent = document.getElementById('mainContent');

    // --- State ---
    let userData = null;

    // --- Navigation ---
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const sectionId = item.getAttribute('data-section');
            switchSection(sectionId);
        });
    });

    // Dashboard shortcuts
    document.querySelectorAll('.item-card[data-section]').forEach(card => {
        card.addEventListener('click', () => {
            const sectionId = card.getAttribute('data-section');
            switchSection(sectionId);
        });
    });

    function switchSection(sectionId) {
        navItems.forEach(i => i.classList.remove('active'));
        sections.forEach(s => s.classList.remove('active'));

        document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');
        document.getElementById(`${sectionId}Section`).classList.add('active');

        // Refresh data based on section
        if (sectionId === 'orders') fetchOrders();
        if (sectionId === 'addresses') fetchAddresses();
        if (sectionId === 'security') fetchSessions();
        if (sectionId === 'wishlist') fetchWishlist();
    }

    // --- API Interactions ---
    async function apiFetch(url, options = {}) {
        const headers = { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers 
        };
        
        const response = await fetch(url, { ...options, headers });
        const data = await response.json();

        if (response.status === 401) {
            const refreshed = await refreshToken();
            if (refreshed) return apiFetch(url, options);
            localStorage.clear();
            window.location.href = '/auth.html';
            return;
        }

        if (!response.ok) {
            throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }
        
        return data;
    }

    async function refreshToken() {
        const refresh = localStorage.getItem('q_refresh') || sessionStorage.getItem('q_refresh');
        if (!refresh) return false;
        
        try {
            const res = await fetch('/api/auth/refresh', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: refresh })
            });
            const data = await res.json();
            if (res.ok) {
                const remember = localStorage.getItem('q_remember') === '1';
                const store = remember ? localStorage : sessionStorage;
                store.setItem('q_access', data.accessToken);
                store.setItem('q_refresh', data.refreshToken);
                return true;
            }
        } catch (e) { console.error('Refresh fail'); }
        return false;
    }

    // --- Profile Logic ---
    async function initProfile() {
        userData = await apiFetch('/api/auth/me');
        if (!userData) return;

        document.getElementById('userName').textContent = userData.name.split(' ')[0];
        document.getElementById('userFullName').textContent = userData.name;
        document.getElementById('userEmail').textContent = userData.email;
        document.getElementById('avatarImg').src = userData.profile?.avatar || '/images/default-avatar.png';
        
        // Completion bar
        const comp = userData.profile?.completionPercentage || 0;
        document.getElementById('completionFill').style.width = comp + '%';
        document.getElementById('completionValue').textContent = comp + '%';

        // Finance
        document.getElementById('pointsCount').textContent = userData.profile?.finance?.loyaltyPoints || 0;
        document.getElementById('walletBalance').textContent = `₹${(userData.profile?.finance?.walletBalance || 0).toLocaleString()}`;
        
        // Update Account Security Status Card
        const securityStatus = document.getElementById('securityStatus');
        const mfaStatusLink = document.getElementById('mfaStatusLink');
        if (userData.mfaEnabled) {
            securityStatus.textContent = 'MFA is Enabled';
            securityStatus.style.color = '#E50914'; // Accent color for active state
            mfaStatusLink.textContent = 'Manage MFA';
        } else {
            securityStatus.textContent = 'MFA is Disabled';
            securityStatus.style.color = '';
            mfaStatusLink.textContent = 'Enable MFA';
        }

        // Populate Contact Fields
        document.getElementById('displayEmail').textContent = userData.email;
        if (userData.googleId) {
            document.getElementById('changeEmailBtn').style.display = 'none'; // Google users can't change email
        }
        
        const phone = userData.profile?.phone;
        const phoneVerified = userData.profile?.phoneVerified;
        
        document.getElementById('displayPhone').textContent = phone || 'Not added';
        const phoneBadge = document.getElementById('phoneBadge');
        if (phone && phoneVerified) {
            phoneBadge.className = 'verify-badge verified';
            phoneBadge.innerHTML = '<i class="fas fa-check-circle"></i> Verified';
            document.getElementById('changePhoneBtn').textContent = 'Change';
        } else if (phone) {
            phoneBadge.className = 'verify-badge pending';
            phoneBadge.innerHTML = '<i class="fas fa-exclamation-circle"></i> Unverified';
            document.getElementById('changePhoneBtn').textContent = 'Verify';
        }

        // Populate Form
        const form = document.getElementById('profileForm');
        form.name.value = userData.name || '';
        form.dob.value = userData.profile?.dob ? userData.profile.dob.split('T')[0] : '';
        form.gender.value = userData.profile?.gender || 'Not specified';
        form.bio.value = userData.profile?.bio || '';

        // Populate Preferences Form
        const prefForm = document.getElementById('preferencesForm');
        if (prefForm && userData.profile?.preferences) {
            const prefs = userData.profile.preferences;
            prefForm.language.value = prefs.language || 'en';
            prefForm.currency.value = prefs.currency || 'INR';
            prefForm.timezone.value = prefs.timezone || 'IST';
            prefForm.newsletter.checked = !!prefs.newsletter;
            prefForm.notifications.checked = !!prefs.notifications;
            prefForm.smsNotifications.checked = !!prefs.smsNotifications;
        }
    }

    // --- Order Logic ---
    async function fetchOrders() {
        const data = await apiFetch('/api/user/orders');
        const container = document.getElementById('orderList');
        
        if (!data.orders || data.orders.length === 0) {
            container.innerHTML = '<div style="padding: 2rem; text-align: center;">No orders found.</div>';
            return;
        }

        container.innerHTML = data.orders.map(order => `
            <div style="padding: 1.5rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h4 style="color: var(--accent); font-family: monospace;">${order.orderId}</h4>
                    <p style="font-size: 0.9rem; color: var(--text-secondary); margin-top: 0.3rem;">
                        ${new Date(order.orderDate).toLocaleDateString()} • ₹${order.totalAmount.toLocaleString()}
                    </p>
                    <span class="badge badge-${order.status.toLowerCase()}" style="margin-top: 0.5rem; display: inline-block;">${order.status}</span>
                </div>
                <div style="display: flex; gap: 1rem;">
                    <button class="btn-primary" style="padding: 0.5rem 1rem; font-size: 0.8rem;" onclick="downloadInvoice('${order._id}')">Invoice</button>
                    <button class="btn-primary" style="padding: 0.5rem 1rem; font-size: 0.8rem; background: var(--text-secondary);" onclick="reorder('${order._id}')">Reorder</button>
                    <a href="/order-tracking?id=${order.orderId}" style="text-decoration: none; color: white; background: rgba(255,255,255,0.1); padding: 0.5rem 1rem; border-radius: 6px; font-size: 0.8rem;">Track</a>
                    <button class="btn-primary" style="padding: 0.5rem 1rem; font-size: 0.8rem; background: #ff4444;" onclick="deleteOrder('${order.orderId}')">Delete</button>
                </div>
            </div>
        `).join('');
    }

    // --- Address Logic ---
    async function fetchAddresses() {
        const data = await apiFetch('/api/user/addresses');
        const container = document.getElementById('addressGrid');
        
        container.innerHTML = data.map(addr => `
            <div class="item-card">
                ${addr.isDefaultShipping ? '<span class="badge badge-default" style="position: absolute; top:10px; right:10px;">Default</span>' : ''}
                <h4>${addr.label}</h4>
                <p style="margin-top: 0.5rem;">${addr.fullName}</p>
                <p style="font-size: 0.9rem; color: var(--text-secondary);">${addr.street}, ${addr.city}</p>
                <p style="font-size: 0.9rem; color: var(--text-secondary);">${addr.state}, ${addr.zipCode}</p>
                <div style="margin-top: 1rem; display: flex; gap: 1rem;">
                    <span style="color: var(--accent); cursor: pointer; font-size: 0.8rem;" onclick="deleteAddress('${addr._id}')">Delete</span>
                    ${!addr.isDefaultShipping ? `<span style="color: var(--text-secondary); cursor: pointer; font-size: 0.8rem;" onclick="setDefaultAddress('${addr._id}', 'shipping')">Set Default</span>` : ''}
                </div>
            </div>
        `).join('');
    }

    // --- Security Logic ---
    async function fetchSessions() {
        const data = await apiFetch('/api/user/sessions');
        const container = document.getElementById('sessionList');
        
        container.innerHTML = data.map(sess => `
            <div style="padding: 1rem; background: rgba(255,255,255,0.03); border-radius: 8px; margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong>${sess.deviceInfo?.browser || 'Unknown Browser'} on ${sess.deviceInfo?.os || 'Unknown OS'}</strong>
                    <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.2rem;">
                        IP: ${sess.ip} • Last Active: ${new Date(sess.lastUsed).toLocaleTimeString()}
                    </div>
                </div>
                ${sess.isValid ? `
                    <button style="background: none; border: 1px solid var(--error); color: var(--error); border-radius: 4px; padding: 4px 10px; font-size: 0.8rem; cursor: pointer;" onclick="logoutSession('${sess._id}')">Terminate</button>
                ` : '<span style="color: var(--text-secondary); font-size: 0.8rem;">Inactive</span>'}
            </div>
        `).join('');
    }

    // --- Global Helpers for Window ---
    window.downloadInvoice = (orderId) => {
        window.open(`/api/orders/${orderId}/invoice?token=${token}`, '_blank');
    };

    window.reorder = async (orderId) => {
        const res = await apiFetch(`/api/user/orders/${orderId}/reorder`, { method: 'POST' });
        if (res.orderId) {
            Swal.fire('Succcess', 'Reorder successful. redirected to tracking...', 'success');
            setTimeout(() => window.location.href = `/order-tracking?id=${res.orderId}`, 1500);
        }
    };

    window.deleteOrder = async (orderId) => {
        const result = await Swal.fire({
            title: 'Delete Order?',
            text: "Are you sure you want to delete this order? This action cannot be undone.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ff4444',
            cancelButtonColor: '#333',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                const res = await fetch(`/api/orders/${orderId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (res.ok) {
                    Swal.fire('Deleted!', 'Your order has been deleted.', 'success');
                    fetchOrders(); // Refresh the list
                } else {
                    const data = await res.json();
                    throw new Error(data.error || 'Failed to delete order');
                }
            } catch (err) {
                console.error('Delete order error:', err);
                Swal.fire('Error', err.message, 'error');
            }
        }
    };

    window.deleteAddress = async (id) => {
        await apiFetch(`/api/user/addresses/${id}`, { method: 'DELETE' });
        fetchAddresses();
    };

    window.setDefaultAddress = async (id, type) => {
        await apiFetch(`/api/user/addresses/${id}/default`, { 
            method: 'PUT', 
            body: JSON.stringify({ type }) 
        });
        fetchAddresses();
    };

    const addAddressBtn = document.getElementById('addAddressBtn');
    if (addAddressBtn) {
        addAddressBtn.addEventListener('click', async () => {
            const { value: formValues } = await Swal.fire({
                title: 'Add New Address',
                html: `
                    <div style="text-align: left; padding: 0 10px;">
                        <p style="margin-bottom: 0.5rem; font-size: 0.9rem; font-weight:700; color: #aaa;">Address Type:</p>
                        <div style="display: flex; gap: 2rem; margin-bottom: 1.5rem; justify-content: center;">
                            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size: 1rem;">
                                <input type="radio" name="swal-label-type" value="Home" checked style="width: 20px; height: 20px; accent-color: var(--accent);"> Home
                            </label>
                            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size: 1rem;">
                                <input type="radio" name="swal-label-type" value="Office" style="width: 20px; height: 20px; accent-color: var(--accent);"> Office
                            </label>
                        </div>
                        <input id="swal-label-name" class="swal2-input" placeholder="Label Name (e.g. My Apartment)" style="margin-top: 0;">
                        <input id="swal-name" class="swal2-input" placeholder="Full Name">
                        <input id="swal-phone" class="swal2-input" placeholder="Phone Number">
                        <input id="swal-street" class="swal2-input" placeholder="Street / House No.">
                        <input id="swal-landmark" class="swal2-input" placeholder="Landmark (Optional)">
                        <input id="swal-city" class="swal2-input" placeholder="City">
                        <input id="swal-state" class="swal2-input" placeholder="State">
                        <input id="swal-zip" class="swal2-input" placeholder="ZIP Code">
                    </div>
                `,
                focusConfirm: false,
                showCancelButton: true,
                preConfirm: () => {
                    const selectedType = document.querySelector('input[name="swal-label-type"]:checked').value;
                    const customLabel = document.getElementById('swal-label-name').value.trim();
                    const finalLabel = customLabel || selectedType;

                    const data = {
                        label: finalLabel,
                        fullName: document.getElementById('swal-name').value,
                        phoneNumber: document.getElementById('swal-phone').value,
                        street: document.getElementById('swal-street').value,
                        landmark: document.getElementById('swal-landmark').value,
                        city: document.getElementById('swal-city').value,
                        state: document.getElementById('swal-state').value,
                        zipCode: document.getElementById('swal-zip').value,
                        country: 'India'
                    };
                    if (!data.fullName || !data.phoneNumber || !data.street || !data.city || !data.state || !data.zipCode) {
                        Swal.showValidationMessage('Please fill in all required fields');
                        return false;
                    }
                    return data;
                }
            });

            if (formValues) {
                try {
                    const res = await apiFetch('/api/user/addresses', {
                        method: 'POST',
                        body: JSON.stringify(formValues)
                    });
                    if (res && res._id) {
                        Swal.fire('Success', 'Address added!', 'success');
                        fetchAddresses();
                    }
                } catch (err) {
                    console.error('Add address error:', err);
                    Swal.fire('Error', err.message || 'Failed to add address.', 'error');
                }
            }
        });
    }

    window.logoutSession = async (id) => {
        await apiFetch(`/api/user/sessions/${id}`, { method: 'DELETE' });
        fetchSessions();
    };

    // --- Avatar Management ---
    const avatarChangeBtn = document.getElementById('avatarChangeBtn');
    const avatarDeleteBtn = document.getElementById('avatarDeleteBtn');
    const avatarUpload = document.getElementById('avatarUpload');
    
    if (avatarChangeBtn && avatarUpload) {
        avatarChangeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            avatarUpload.click();
        });
        
        avatarUpload.addEventListener('change', async (e) => {
            if (!e.target.files[0]) return;
            
            const formData = new FormData();
            formData.append('avatar', e.target.files[0]);
            
            try {
                const res = await apiFetch('/api/user/avatar', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }, // apiFetch handles headers, but FormData needs manual handle
                    body: formData,
                    // Note: apiFetch was designed for JSON, but we can override
                });
                
                // Since apiFetch is tuned for JSON, let's use a raw fetch for FormData to avoid Content-Type collision
                const rawRes = await fetch('/api/user/avatar', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });
                const data = await rawRes.json();

                if (data.avatar) {
                    document.getElementById('avatarImg').src = data.avatar;
                    Swal.fire('Success', 'Avatar updated!', 'success');
                    initProfile(); // Refresh completion stats
                }
            } catch (err) {
                console.error('Avatar upload error:', err);
                Swal.fire('Error', 'Upload failed.', 'error');
            }
        });
    }

    if (avatarDeleteBtn) {
        avatarDeleteBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const result = await Swal.fire({
                title: 'Delete Avatar?',
                text: "Your profile picture will be reset to default.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#ff3d00',
                cancelButtonColor: '#1e1e1e',
                confirmButtonText: 'Yes, delete it!'
            });

            if (result.isConfirmed) {
                try {
                    const res = await apiFetch('/api/user/avatar', { method: 'DELETE' });
                    if (res.avatar) {
                        document.getElementById('avatarImg').src = res.avatar;
                        Swal.fire('Deleted', 'Avatar removed.', 'success');
                        initProfile();
                    }
                } catch (err) {
                    console.error('Avatar delete error:', err);
                    Swal.fire('Error', 'Failed to delete avatar.', 'error');
                }
            }
        });
    }

    // --- Event Handlers ---
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.clear();
        window.location.href = '/login';
    });

    document.getElementById('profileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        
        const res = await apiFetch('/api/user/profile', {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        
        if (res.user) {
            Swal.fire('Updated', 'Your profile has been saved.', 'success');
            initProfile();
        }
    });

    document.getElementById('preferencesForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const prefs = {
            language: e.target.language.value,
            currency: e.target.currency.value,
            timezone: e.target.timezone.value,
            newsletter: e.target.newsletter.checked,
            notifications: e.target.notifications.checked,
            smsNotifications: e.target.smsNotifications.checked
        };
        
        try {
            const res = await apiFetch('/api/user/profile', {
                method: 'PUT',
                body: JSON.stringify({ preferences: prefs })
            });
            
            if (res.user) {
                Swal.fire('Success', 'Preferences saved successfully.', 'success');
                userData = res.user;
                initProfile(); // Refresh UI
            }
        } catch (error) {
            console.error('Preferences save error:', error);
            Swal.fire('Error', 'Failed to save preferences.', 'error');
        }
    });

    // --- MFA Flow ---
    const mfaModal = document.getElementById('mfaModal');
    const mfaMasterToggle = document.getElementById('mfaMasterToggle');
    const mfaMethodsGrid = document.getElementById('mfaMethodsGrid');
    let mfaStatus = { enabled: false, methods: [], defaultMethod: 'app' };

    async function fetchMfaStatus() {
        try {
            const data = await apiFetch('/api/user/mfa/status');
            mfaStatus = data;
            updateMfaUI();
        } catch (e) { console.error('MFA status fetch fail:', e); }
    }

    function updateMfaUI() {
        if (!mfaMasterToggle) return;

        mfaMasterToggle.checked = mfaStatus.enabled;
        // REMOVED: grid-disabled dependency. Keep grid interactive for setup.
        // mfaMethodsGrid.classList.toggle('grid-disabled', !mfaStatus.enabled);

        ['app', 'email', 'sms'].forEach(m => {
            const isEnabled = mfaStatus.methods.includes(m);
            const check = document.getElementById(`check-${m}`);
            const badge = document.getElementById(`badge-${m}`);
            const defBtn = document.getElementById(`default-btn-${m}`);

            if (check) check.checked = isEnabled;
            if (badge) badge.style.display = isEnabled ? 'inline-block' : 'none';
            if (defBtn) {
                defBtn.style.display = isEnabled ? 'block' : 'none';
                if (isEnabled && mfaStatus.defaultMethod === m) {
                    defBtn.classList.add('active');
                    defBtn.textContent = 'Default Method';
                } else {
                    defBtn.classList.remove('active');
                    defBtn.textContent = 'Set as Default';
                }
            }
        });
    }

    // Toggle Master Switch
    if (mfaMasterToggle) {
        mfaMasterToggle.addEventListener('change', async (e) => {
            const enabled = e.target.checked;
            
            // Check locally if any method is verified before sending to server
            if (enabled && mfaStatus.methods.length === 0) {
                e.target.checked = false;
                return Swal.fire({
                    title: 'Verification Required',
                    text: 'Please verify at least one method (App, Email, or SMS) using the checkboxes below before turning on global Multi-Factor Authentication.',
                    icon: 'info',
                    confirmButtonColor: '#E50914'
                });
            }

            try {
                await apiFetch('/api/user/mfa/toggle', {
                    method: 'POST',
                    body: JSON.stringify({ enabled })
                });
                mfaStatus.enabled = enabled;
                updateMfaUI();
                Swal.fire('Success', `MFA is now ${enabled ? 'enabled' : 'disabled'} for your account.`, 'success');
            } catch (err) {
                e.target.checked = !enabled;
                Swal.fire('Error', err.message, 'error');
            }
        });
    }

    // Method Checkboxes
    document.querySelectorAll('[data-method]').forEach(check => {
        check.addEventListener('change', async (e) => {
            const method = e.target.getAttribute('data-method');
            const isCurrentlyEnabled = mfaStatus.methods.includes(method);

            if (e.target.checked && !isCurrentlyEnabled) {
                // Trigger verification flow
                e.target.checked = false; // Revert until verified
                startMethodVerification(method);
            } else if (!e.target.checked && isCurrentlyEnabled) {
                // Prevent disabling all methods if MFA is on
                if (mfaStatus.enabled && mfaStatus.methods.length === 1) {
                    e.target.checked = true;
                    return Swal.fire('Error', 'You must have at least one method enabled if MFA is ON.', 'error');
                }
                // Handle Disable (Simplified: just update UI for now, usually needs a prompt)
                Swal.fire('Note', 'Disabling individual methods will be implemented in the next patch. Please use the master toggle to turn off MFA.', 'info');
                e.target.checked = true;
            }
        });
    });

    async function startMethodVerification(method) {
        try {
            if (method === 'app') {
                const data = await apiFetch('/api/user/mfa/setup', { method: 'POST' });
                document.getElementById('mfaQrImage').src = data.qrCodeDataUri;
                document.getElementById('mfaSecretDisplay').textContent = data.secret;
                document.getElementById('mfaModalTitle').textContent = 'Link Authenticator App';
                document.getElementById('mfaModalDesc').textContent = 'Scan this QR code with Google Authenticator or Authy:';
                document.getElementById('qrContainer').style.display = 'flex';
                mfaModal.setAttribute('data-current-method', 'app');
            } else {
                // Email or SMS
                await apiFetch('/api/user/mfa/trigger-otp', {
                    method: 'POST',
                    body: JSON.stringify({ method })
                });
                document.getElementById('mfaModalTitle').textContent = `Verify ${method.toUpperCase()}`;
                document.getElementById('mfaModalDesc').textContent = `Please enter the 6-digit code we just sent to your ${method === 'email' ? 'registered email' : 'mobile'}.`;
                document.getElementById('qrContainer').style.display = 'none';
                mfaModal.setAttribute('data-current-method', method);
            }
            mfaModal.style.display = 'flex';
        } catch (err) {
            Swal.fire('Error', err.message, 'error');
        }
    }

    // Confirm MFA Button
    document.getElementById('confirmMfaBtn').addEventListener('click', async (e) => {
        const btn = e.target;
        const method = mfaModal.getAttribute('data-current-method');
        const input = document.getElementById('mfaTokenInput');
        const token = input.value.trim();

        if (token.length !== 6) {
            return Swal.fire('Error', 'Please enter the 6-digit code.', 'error');
        }

        btn.disabled = true;
        btn.textContent = 'Verifying...';

        try {
            const res = await apiFetch('/api/user/mfa/verify', {
                method: 'POST',
                body: JSON.stringify({ token, method })
            });
            
            if (res.message) {
                mfaModal.style.display = 'none';
                input.value = '';
                Swal.fire('Verified!', res.message, 'success');
                await fetchMfaStatus(); // Refresh everything
            }
        } catch (error) {
            Swal.fire('Error', error.message || 'Verification failed.', 'error');
            input.value = '';
        } finally {
            btn.disabled = false;
            btn.textContent = 'Verify & Activate';
        }
    });

    // Default Method Buttons
    document.querySelectorAll('.mfa-default-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const method = e.target.getAttribute('data-method');
            if (mfaStatus.defaultMethod === method) return;

            try {
                await apiFetch('/api/user/mfa/method/default', {
                    method: 'POST',
                    body: JSON.stringify({ method })
                });
                mfaStatus.defaultMethod = method;
                updateMfaUI();
                Swal.fire('Success', `${method.toUpperCase()} is now your primary login method.`, 'success');
            } catch (err) {
                Swal.fire('Error', err.message, 'error');
            }
        });
    });

    document.getElementById('closeMfaBtn').addEventListener('click', () => {
        mfaModal.style.display = 'none';
        document.getElementById('mfaTokenInput').value = '';
    });

    // Initialize MFA
    fetchMfaStatus();

    // --- Change Password Flow ---
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const currentPassword = e.target.currentPassword.value;
            const newPassword = e.target.newPassword.value;
            const confirmPassword = e.target.confirmPassword.value;

            if (newPassword !== confirmPassword) {
                return Swal.fire('Error', 'New passwords do not match!', 'error');
            }

            if (newPassword.length < 8) {
                return Swal.fire('Error', 'New password must be at least 8 characters.', 'error');
            }

            try {
                const res = await apiFetch('/api/user/change-password', {
                    method: 'POST',
                    body: JSON.stringify({ currentPassword, newPassword })
                });

                if (res.message) {
                    Swal.fire({
                        title: 'Success!',
                        text: res.message,
                        icon: 'success',
                        confirmButtonColor: '#E50914'
                    });
                    e.target.reset();
                }
            } catch (error) {
                console.error('Change password error:', error);
                Swal.fire({
                    title: 'Error',
                    text: error.message || 'Failed to update password.',
                    icon: 'error',
                    confirmButtonColor: '#ff3d00'
                });
            }
        });
    }

    // --- Account Deletion ---
    const deleteBtn = document.getElementById('deleteAccountBtn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            const { value: password } = await Swal.fire({
                title: 'Delete Account?',
                text: "This will schedule your account for permanent deletion in 14 days. You can restore it anytime during this window by logging back in.",
                icon: 'warning',
                input: 'password',
                inputPlaceholder: 'Enter your password to confirm',
                inputAttributes: {
                    autocapitalize: 'off',
                    autocorrect: 'off'
                },
                showCancelButton: true,
                confirmButtonColor: '#ff3d00',
                cancelButtonColor: '#333',
                confirmButtonText: 'Permanently Delete',
                preConfirm: (value) => {
                    if (!value) {
                        Swal.showValidationMessage('Password is required');
                    }
                    return value;
                }
            });

            if (password) {
                try {
                    const res = await apiFetch('/api/user/delete-account-request', { 
                        method: 'POST',
                        body: JSON.stringify({ password })
                    });
                    if (res.message) {
                        Swal.fire({
                            title: 'Scheduled',
                            text: res.message,
                            icon: 'info',
                            confirmButtonColor: '#E50914'
                        }).then(() => {
                            localStorage.clear();
                            sessionStorage.clear();
                            window.location.href = '/';
                        });
                    }
                } catch (err) {
                    Swal.fire('Error', err.message || 'Failed to initiate deletion.', 'error');
                }
            }
        });
    }

    // --- Email & Phone Verification Flows ---
    const btnChangeEmail = document.getElementById('changeEmailBtn');
    const emailWidget = document.getElementById('emailVerifyWidget');
    
    const btnChangePhone = document.getElementById('changePhoneBtn');
    const phoneWidget = document.getElementById('phoneVerifyWidget');

    // Reusable Resend Timer logic
    function startResendTimer(btnEl, containerEl, timerText) {
        let timeLeft = 60;
        btnEl.style.display = 'none';
        
        const timerSpan = document.createElement('span');
        timerSpan.className = 'resend-timer';
        timerSpan.innerHTML = `Wait <b style="color:var(--accent)">${timeLeft}s</b> to resend`;
        containerEl.appendChild(timerSpan);

        const countdown = setInterval(() => {
            timeLeft--;
            if (timeLeft <= 0) {
                clearInterval(countdown);
                timerSpan.remove();
                btnEl.style.display = 'inline-block';
                btnEl.textContent = timerText || 'Resend Code';
            } else {
                timerSpan.innerHTML = `Wait <b style="color:var(--accent)">${timeLeft}s</b> to resend`;
            }
        }, 1000);
    }

    // EMAIL FLOW
    btnChangeEmail.addEventListener('click', async () => {
        btnChangeEmail.disabled = true;
        btnChangeEmail.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

        try {
            const res = await apiFetch('/api/user/email/start-change', { method: 'POST' });
            if (res.message) {
                // Show Step 1 Widget
                emailWidget.style.display = 'block';
                emailWidget.innerHTML = `
                    <span class="step-indicator">Step 1 of 3</span>
                    <p style="font-size: 0.9rem;">We sent a code to your <b>current email</b> to verify it's you.</p>
                    <div class="otp-input-group">
                        <input type="text" id="emailOldCode" maxlength="6" placeholder="------" autocomplete="off" onkeypress="return event.charCode >= 48 && event.charCode <= 57">
                        <button class="btn-primary" id="verifyOldEmailBtn">Next</button>
                    </div>
                    <div id="emailResendContainer" style="margin-top: 1rem; display: flex; align-items: center; gap: 1rem;">
                        <button class="btn-text" id="resendOldEmailBtn" style="font-size: 0.85rem; display: none;">Resend Code</button>
                    </div>
                `;
                
                const btnResend = document.getElementById('resendOldEmailBtn');
                startResendTimer(btnResend, document.getElementById('emailResendContainer'));
                
                btnResend.onclick = () => btnChangeEmail.click(); // re-trigger start-change

                document.getElementById('verifyOldEmailBtn').onclick = async () => {
                    const code = document.getElementById('emailOldCode').value;
                    if (code.length !== 6) return Swal.fire('Error', 'Enter 6-digit code', 'error');
                    
                    try {
                        const step2 = await apiFetch('/api/user/email/verify-old', {
                            method: 'POST', body: JSON.stringify({ otp: code })
                        });
                        if (step2.step === 'verify_new') showNewEmailEntry();
                    } catch (err) {
                        Swal.fire('Error', err.message, 'error');
                    }
                };
            }
        } catch (err) {
            Swal.fire('Error', err.message, 'error');
        } finally {
            btnChangeEmail.disabled = false;
            btnChangeEmail.textContent = 'Cancel';
            btnChangeEmail.onclick = () => {
                emailWidget.style.display = 'none';
                btnChangeEmail.textContent = 'Change';
                location.reload(); // Quick reset
            };
        }
    });

    function showNewEmailEntry() {
        emailWidget.innerHTML = `
            <span class="step-indicator">Step 2 of 3</span>
            <p style="font-size: 0.9rem;">Current email verified. Enter your <b>new email address</b>.</p>
            <div class="otp-input-group">
                <input type="email" id="newEmailInput" placeholder="new@example.com">
                <button class="btn-primary" id="sendNewEmailBtn">Send Code</button>
            </div>
        `;
        document.getElementById('sendNewEmailBtn').onclick = async () => {
            const newEmail = document.getElementById('newEmailInput').value;
            if (!newEmail.includes('@')) return Swal.fire('Error', 'Enter valid email', 'error');
            
            try {
                const res = await apiFetch('/api/user/email/verify-new', {
                    method: 'POST', body: JSON.stringify({ newEmail })
                });
                if (res.message) showNewEmailConfirmation(newEmail);
            } catch (err) {
                Swal.fire('Error', err.message, 'error');
            }
        };
    }

    function showNewEmailConfirmation(newEmail) {
        emailWidget.innerHTML = `
            <span class="step-indicator">Step 3 of 3</span>
            <p style="font-size: 0.9rem;">Enter the code sent to <b>${newEmail}</b>.</p>
            <div class="otp-input-group">
                <input type="text" id="emailNewCode" maxlength="6" placeholder="------">
                <button class="btn-primary" id="confirmNewEmailBtn">Confirm & Save</button>
            </div>
        `;
        document.getElementById('confirmNewEmailBtn').onclick = async () => {
            const code = document.getElementById('emailNewCode').value;
            try {
                const res = await apiFetch('/api/user/email/confirm-new', {
                    method: 'POST', body: JSON.stringify({ otp: code })
                });
                if (res.token) {
                    localStorage.setItem('q_access', res.token); // update token
                    Swal.fire('Success', res.message, 'success');
                    emailWidget.style.display = 'none';
                    btnChangeEmail.textContent = 'Change';
                    initProfile();
                }
            } catch (err) {
                Swal.fire('Error', err.message, 'error');
            }
        };
    }

    // PHONE FLOW
    btnChangePhone.addEventListener('click', async () => {
        phoneWidget.style.display = phoneWidget.style.display === 'none' ? 'block' : 'none';
        if (phoneWidget.style.display === 'block') {
            phoneWidget.innerHTML = `
                <p style="font-size: 0.9rem;">Enter your mobile number to receive an SMS code.</p>
                <div class="otp-input-group">
                    <input type="tel" id="newPhoneInput" placeholder="+1234567890">
                    <button class="btn-primary" id="sendPhoneBtn">Send Code</button>
                </div>
            `;
            document.getElementById('sendPhoneBtn').onclick = async () => {
                const phone = document.getElementById('newPhoneInput').value;
                if (!phone) return Swal.fire('Error', 'Enter phone number', 'error');
                
                try {
                    const res = await apiFetch('/api/user/phone/send-otp', {
                        method: 'POST', body: JSON.stringify({ phone })
                    });
                    if (res.message) showPhoneVerification(phone);
                } catch (err) {
                    Swal.fire('Error', err.message, 'error');
                }
            };
        }
    });

    function showPhoneVerification(phone) {
        phoneWidget.innerHTML = `
            <p style="font-size: 0.9rem;">Enter the code sent to <b>${phone}</b>.</p>
            <div class="otp-input-group">
                <input type="text" id="phoneCode" maxlength="6" placeholder="------">
                <button class="btn-primary" id="verifyPhoneBtn">Verify</button>
            </div>
             <div id="phoneResendContainer" style="margin-top: 1rem; display: flex; align-items: center; gap: 1rem;">
                <button class="btn-text" id="resendPhoneBtn" style="font-size: 0.85rem; display: none;">Resend Code</button>
            </div>
        `;
        
        const resendBtn = document.getElementById('resendPhoneBtn');
        startResendTimer(resendBtn, document.getElementById('phoneResendContainer'));
        resendBtn.onclick = () => {
            document.getElementById('newPhoneInput') ? document.getElementById('sendPhoneBtn').click() : btnChangePhone.click();
        };

        document.getElementById('verifyPhoneBtn').onclick = async () => {
            const code = document.getElementById('phoneCode').value;
            try {
                const res = await apiFetch('/api/user/phone/verify-otp', {
                    method: 'POST', body: JSON.stringify({ otp: code })
                });
                if (res.message) {
                    Swal.fire('Verified!', res.message, 'success');
                    phoneWidget.style.display = 'none';
                    initProfile();
                }
            } catch (err) {
                Swal.fire('Error', err.message, 'error');
            }
        };
    }

    // --- Init ---
    initProfile();
});
