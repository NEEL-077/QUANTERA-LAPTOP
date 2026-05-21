// Authentication flow management
class AuthFlow {
    constructor() {
        this.loginForm = document.getElementById('loginForm');
        this.signupForm = document.getElementById('signupForm');
        this.showSignupBtn = document.getElementById('showSignup');
        this.showLoginBtn = document.getElementById('showLogin');
        
        // Login form elements
        this.loginFormElement = document.getElementById('loginFormElement');
        this.loginEmail = document.getElementById('loginEmail');
        this.loginPassword = document.getElementById('loginPassword');
        this.loginEmailError = document.getElementById('login-email-error');
        this.loginPasswordError = document.getElementById('login-password-error');
        
        // Signup form elements
        this.signupFormElement = document.getElementById('signupFormElement');
        this.signupName = document.getElementById('signupName');
        this.signupEmail = document.getElementById('signupEmail');
        this.signupPassword = document.getElementById('signupPassword');
        this.agreeTerms = document.getElementById('agreeTerms');
        this.signupNameError = document.getElementById('signup-name-error');
        this.signupEmailError = document.getElementById('signup-email-error');
        this.signupPasswordError = document.getElementById('signup-password-error');
        this.signupPasswordError = document.getElementById('signup-password-error');
        this.termsError = document.getElementById('terms-error');
        
        // MFA form elements
        this.mfaForm = document.getElementById('mfaForm');
        this.mfaFormElement = document.getElementById('mfaFormElement');
        this.mfaTokenInput = document.getElementById('mfaToken');
        this.mfaError = document.getElementById('mfa-error');
        this.cancelMfaBtn = document.getElementById('cancelMfa');
        this.mfaEmail = ''; // Store during flow
        
        this.currentForm = 'login'; // Start with login form
        this.init();
    }
    
    init() {
        // Form switching
        this.showSignupBtn.addEventListener('click', () => this.switchToSignup());
        this.showLoginBtn.addEventListener('click', () => this.switchToLogin());
        
        // Form submissions
        this.loginFormElement.addEventListener('submit', this.handleLogin.bind(this));
        this.signupFormElement.addEventListener('submit', this.handleSignup.bind(this));
        this.mfaFormElement.addEventListener('submit', this.handleMfaVerify.bind(this));
        
        // Cancel MFA
        this.cancelMfaBtn.addEventListener('click', () => this.switchToLogin());
        
        // Real-time validation
        this.setupValidation();
        
        // Check URL parameters for direct navigation
        this.checkUrlParams();
    }
    
    checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        
        // Handle Google Auth Success
        if (urlParams.get('google_success') === 'true') {
            const accessToken = urlParams.get('access');
            const refreshToken = urlParams.get('refresh');
            const userData = urlParams.get('user');
            
            if (accessToken && refreshToken && userData) {
                // Store tokens and user (default to localStorage for social login)
                localStorage.setItem('q_access', accessToken);
                localStorage.setItem('q_refresh', refreshToken);
                localStorage.setItem('q_user', decodeURIComponent(userData));
                
                this.showSuccess('Google Sign-In successful! Welcome to Quantéra.');
                
                // Clean URL
                window.history.replaceState({}, document.title, window.location.pathname);
                
                // Redirect after brief delay
                const returnTo = sessionStorage.getItem('q_returnTo') || '/';
                sessionStorage.removeItem('q_returnTo');
                setTimeout(() => { window.location.href = returnTo; }, 1500);
                return;
            }
        }
        
        // Handle Errors
        if (urlParams.get('error')) {
            const errorCode = urlParams.get('error');
            let message = 'An error occurred during authentication.';
            
            if (errorCode === 'google_failed') message = 'Google authentication failed. Please try again.';
            if (errorCode === 'token_issue_failed') message = 'Failed to issue security tokens. Please contact support.';
            
            // Special Handle for Deletion Pending (e.g. from Google Auth callback)
            if (errorCode === 'ACCOUNT_DELETION_PENDING') {
                const email = urlParams.get('email');
                const graceEnds = new Date(parseInt(urlParams.get('graceEnds')));
                
                Swal.fire({
                    title: 'Restore Account?',
                    text: `Your account is scheduled for deletion on ${graceEnds.toLocaleDateString()}. would you like to restore it and cancel the deletion?`,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#00e5ff',
                    cancelButtonColor: '#333',
                    confirmButtonText: 'Yes, Restore it!'
                }).then(async (result) => {
                    if (result.isConfirmed) {
                        try {
                            const res = await fetch('/api/user/restore-account', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ email: email, password: '' }) // Google users don't have password, but server needs another look
                                // Actually social restorative should be handled better, 
                                // but for now, we'll suggest manual login if needed or update server.
                            });
                            const data = await res.json();
                            if (res.ok) {
                                Swal.fire('Restored!', 'Welcome back! Please sign in again.', 'success');
                                window.history.replaceState({}, document.title, window.location.pathname);
                            } else {
                                Swal.fire('Error', data.error, 'error');
                            }
                        } catch (e) {
                            console.error(e);
                        }
                    }
                });
                return;
            }

            this.showError(null, this.loginPasswordError, message);
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        const form = urlParams.get('form');
        if (form === 'signup') {
            this.switchToSignup(false); // No animation on initial load
        }
    }
    
    switchToSignup(animate = true) {
        if (this.currentForm === 'signup') return;
        
        this.currentForm = 'signup';
        
        if (animate) {
            // Animate transition
            this.loginForm.classList.add('slide-out-left');
            
            setTimeout(() => {
                this.loginForm.classList.add('hidden');
                this.loginForm.classList.remove('slide-out-left');
                
                this.signupForm.classList.remove('hidden');
                this.signupForm.classList.add('slide-in-right');
                
                setTimeout(() => {
                    this.signupForm.classList.remove('slide-in-right');
                }, 400);
            }, 200);
        } else {
            this.loginForm.classList.add('hidden');
            this.signupForm.classList.remove('hidden');
        }
        
        // Update URL without page reload
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('form', 'signup');
        window.history.pushState({}, '', newUrl);
        
        // Update page title
        document.title = 'Sign Up | Quantéra';
        
        // Focus first input
        setTimeout(() => {
            this.signupName.focus();
        }, animate ? 400 : 0);
    }
    
    switchToLogin(animate = true) {
        if (this.currentForm === 'login') return;
        
        this.currentForm = 'login';
        
        if (animate) {
            // Animate transition
            this.signupForm.classList.add('slide-out-right');
            
            setTimeout(() => {
                this.signupForm.classList.add('hidden');
                this.signupForm.classList.remove('slide-out-right');
                
                this.loginForm.classList.remove('hidden');
                this.loginForm.classList.add('slide-in-left');
                
                setTimeout(() => {
                    this.loginForm.classList.remove('slide-in-left');
                }, 400);
            }, 200);
        } else {
            this.signupForm.classList.add('hidden');
            this.loginForm.classList.remove('hidden');
        }
        
        // Update URL without page reload
        const newUrl = new URL(window.location);
        newUrl.searchParams.delete('form');
        window.history.pushState({}, '', newUrl);
        
        // Update page title
        document.title = 'Sign In | Quantéra';
        
        // Focus first input
        setTimeout(() => {
            this.loginEmail.focus();
        }, animate ? 400 : 0);
    }
    
    setupValidation() {
        // Login form validation
        this.loginEmail.addEventListener('blur', () => this.validateLoginEmail());
        this.loginPassword.addEventListener('blur', () => this.validateLoginPassword());
        this.loginEmail.addEventListener('input', () => this.clearError(this.loginEmail, this.loginEmailError));
        this.loginPassword.addEventListener('input', () => this.clearError(this.loginPassword, this.loginPasswordError));
        
        // Signup form validation
        this.signupName.addEventListener('blur', () => this.validateSignupName());
        this.signupEmail.addEventListener('blur', () => this.validateSignupEmail());
        this.signupPassword.addEventListener('blur', () => this.validateSignupPassword());
        this.signupName.addEventListener('input', () => this.clearError(this.signupName, this.signupNameError));
        this.signupEmail.addEventListener('input', () => this.clearError(this.signupEmail, this.signupEmailError));
        this.signupPassword.addEventListener('input', () => this.clearError(this.signupPassword, this.signupPasswordError));
        this.agreeTerms.addEventListener('change', () => this.validateTerms());
    }
    
    // Validation methods
    validateLoginEmail() {
        const email = this.loginEmail.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!email) {
            this.showError(this.loginEmail, this.loginEmailError, 'Email is required.');
            return false;
        } else if (!emailRegex.test(email)) {
            this.showError(this.loginEmail, this.loginEmailError, 'Please enter a valid email address.');
            return false;
        } else {
            this.clearError(this.loginEmail, this.loginEmailError);
            return true;
        }
    }
    
    validateLoginPassword() {
        const password = this.loginPassword.value;
        
        if (!password) {
            this.showError(this.loginPassword, this.loginPasswordError, 'Password is required.');
            return false;
        } else {
            this.clearError(this.loginPassword, this.loginPasswordError);
            return true;
        }
    }
    
    validateSignupName() {
        const name = this.signupName.value.trim();
        
        if (!name) {
            this.showError(this.signupName, this.signupNameError, 'Full name is required.');
            return false;
        } else if (name.length < 2) {
            this.showError(this.signupName, this.signupNameError, 'Name must be at least 2 characters.');
            return false;
        } else {
            this.clearError(this.signupName, this.signupNameError);
            return true;
        }
    }
    
    validateSignupEmail() {
        const email = this.signupEmail.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!email) {
            this.showError(this.signupEmail, this.signupEmailError, 'Email is required.');
            return false;
        } else if (!emailRegex.test(email)) {
            this.showError(this.signupEmail, this.signupEmailError, 'Please enter a valid email address.');
            return false;
        } else {
            this.clearError(this.signupEmail, this.signupEmailError);
            return true;
        }
    }
    
    validateSignupPassword() {
        const password = this.signupPassword.value;
        
        if (!password) {
            this.showError(this.signupPassword, this.signupPasswordError, 'Password is required.');
            return false;
        } else if (password.length < 8) {
            this.showError(this.signupPassword, this.signupPasswordError, 'Password must be at least 8 characters.');
            return false;
        } else {
            this.clearError(this.signupPassword, this.signupPasswordError);
            return true;
        }
    }
    
    validateTerms() {
        if (!this.agreeTerms.checked) {
            this.showError(null, this.termsError, 'You must agree to the Terms of Service and Privacy Policy.');
            return false;
        } else {
            this.clearError(null, this.termsError);
            return true;
        }
    }
    
    showError(input, errorElement, message) {
        if (input) {
            input.classList.add('error', 'shake');
            setTimeout(() => {
                input.classList.remove('shake');
            }, 300);
        }
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
    
    clearError(input, errorElement) {
        if (input) {
            input.classList.remove('error');
        }
        errorElement.style.display = 'none';
        errorElement.textContent = '';
    }
    
    async handleLogin(e) {
        e.preventDefault();
        
        // Validate all fields
        const isEmailValid = this.validateLoginEmail();
        const isPasswordValid = this.validateLoginPassword();
        
        if (!isEmailValid || !isPasswordValid) {
            return;
        }
        
        const submitBtn = this.loginFormElement.querySelector('.submit-btn');
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        
        try {
            // Submit login
            await this.submitLogin();
            
            // Success - redirect to appropriate page
            this.showSuccess('Welcome back! Redirecting...');
            
            // Check if there's a return URL
            const returnTo = sessionStorage.getItem('q_returnTo');
            const redirectUrl = returnTo || '/';
            
            // Clear return URL
            sessionStorage.removeItem('q_returnTo');
            
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 1500);
            
        } catch (error) {
            console.error('Login error:', error);
            this.showError(this.loginPassword, this.loginPasswordError, error.message || 'Invalid email or password. Please try again.');
        } finally {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    }
    
    async handleSignup(e) {
        e.preventDefault();
        
        // Validate all fields
        const isNameValid = this.validateSignupName();
        const isEmailValid = this.validateSignupEmail();
        const isPasswordValid = this.validateSignupPassword();
        const isTermsValid = this.validateTerms();
        
        if (!isNameValid || !isEmailValid || !isPasswordValid || !isTermsValid) {
            return;
        }
        
        const submitBtn = this.signupFormElement.querySelector('.submit-btn');
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        
        try {
            // Step 1: Register the user
            await this.submitSignup();
            
            // Step 2: Automatically log them in
            const loginData = {
                email: this.signupEmail.value.trim(),
                password: this.signupPassword.value,
                remember: false
            };
            
            const loginResponse = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            });
            
            if (loginResponse.ok) {
                const data = await loginResponse.json();
                
                // Store tokens and user data
                sessionStorage.setItem('q_access', data.accessToken);
                sessionStorage.setItem('q_refresh', data.refreshToken);
                sessionStorage.setItem('q_user', JSON.stringify(data.user));
                
                // Success - redirect to home page
                this.showSuccess('Welcome to Quantéra! Redirecting to home page...');
                
                // Check if there's a return URL
                const returnTo = sessionStorage.getItem('q_returnTo');
                const redirectUrl = returnTo || '/';
                
                // Clear return URL
                sessionStorage.removeItem('q_returnTo');
                
                setTimeout(() => {
                    window.location.href = redirectUrl;
                }, 2000);
            } else {
                // Registration succeeded but login failed - show login form
                this.showSuccess('Account created successfully! Please sign in with your new account.');
                
                // Clear signup form and pre-fill login email
                this.signupFormElement.reset();
                setTimeout(() => {
                    this.loginEmail.value = this.signupEmail.value;
                    this.switchToLogin();
                }, 2000);
            }
            
        } catch (error) {
            console.error('Signup error:', error);
            if (error.message.includes('email already exists') || error.message.includes('account with this email')) {
                this.showError(this.signupEmail, this.signupEmailError, 'An account with this email already exists.');
            } else {
                this.showError(this.signupEmail, this.signupEmailError, error.message || 'Registration failed. Please try again.');
            }
        } finally {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    }
    
    async submitLogin() {
        const formData = {
            email: this.loginEmail.value.trim(),
            password: this.loginPassword.value,
            remember: document.getElementById('rememberMe')?.checked || false
        };
        
        console.log('Login attempt:', { email: formData.email });
        
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            const data = await response.json();
            
            // Handle Account Deletion Grace Period
            if (response.status === 403 && data.error === 'ACCOUNT_DELETION_PENDING') {
                const result = await Swal.fire({
                    title: 'Restore Account?',
                    text: data.message,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#00e5ff',
                    cancelButtonColor: '#333',
                    confirmButtonText: 'Yes, Restore it!'
                });

                if (result.isConfirmed) {
                    try {
                        const restoreRes = await fetch('/api/user/restore-account', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                email: formData.email, 
                                password: formData.password 
                            })
                        });
                        const restoreData = await restoreRes.json();
                        
                        if (restoreRes.ok) {
                            Swal.fire('Restored!', 'Your account has been reactivated. logging you in...', 'success');
                            return this.submitLogin(); // Recursively call to complete login
                        } else {
                            throw new Error(restoreData.error || 'Failed to restore account.');
                        }
                    } catch (err) {
                        throw new Error(err.message);
                    }
                }
                throw new Error('This account is scheduled for deletion. Please restore it to log in.');
            }
            
            throw new Error(data.error || 'Login failed');
        }
        
        const data = await response.json();

        // Handle MFA Required
        if (data.mfaRequired) {
            this.mfaEmail = data.email;
            // Persist remember preference for the MFA step
            const remember = document.getElementById('rememberMe')?.checked || false;
            sessionStorage.setItem('q_remember', remember);
            
            this.switchToMfa(data.method, data.message);
            return data;
        }
        
        // Store tokens and user data
        const storage = formData.remember ? localStorage : sessionStorage;
        storage.setItem('q_access', data.accessToken);
        storage.setItem('q_refresh', data.refreshToken);
        storage.setItem('q_user', JSON.stringify(data.user));
        
        return data;
    }
    
    async submitSignup() {
        const formData = {
            name: this.signupName.value.trim(),
            email: this.signupEmail.value.trim(),
            password: this.signupPassword.value
        };
        
        console.log('Signup attempt:', { name: formData.name, email: formData.email });
        
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Registration failed');
        }
        
        const data = await response.json();
        return { ...formData, ...data };
    }
    
    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            successDiv.remove();
        }, 4000);
    }

    switchToMfa(method = 'app', message = 'Enter the 6-digit code from your app') {
        if (this.currentForm === 'mfa') return;
        this.currentForm = 'mfa';
        
        // Update MFA Form UI based on method
        const mfaTitle = document.getElementById('mfaTitle');
        const mfaSubtitle = document.getElementById('mfaSubtitle');
        const resendContainer = document.getElementById('mfa-resend-container');
        
        mfaTitle.textContent = method === 'app' ? 'Authenticator App' : 'Verification Code';
        mfaSubtitle.textContent = message;
        resendContainer.style.display = (method === 'email' || method === 'sms') ? 'block' : 'none';

        this.loginForm.classList.add('slide-out-left');
        setTimeout(() => {
            this.loginForm.classList.add('hidden');
            this.loginForm.classList.remove('slide-out-left');
            
            this.mfaForm.classList.remove('hidden');
            this.mfaForm.classList.add('slide-in-right');
        }, 200);
        
        // Setup Resend Handler (one-time for the flow)
        const resendBtn = document.getElementById('resendMfaCode');
        if (resendBtn && (method === 'email' || method === 'sms')) {
            // Remove old listeners to avoid duplicates
            const newBtn = resendBtn.cloneNode(true);
            resendBtn.parentNode.replaceChild(newBtn, resendBtn);
            
            newBtn.addEventListener('click', async () => {
                newBtn.disabled = true;
                const originalText = newBtn.textContent;
                newBtn.textContent = 'Sending...';
                
                try {
                    // We reuse the login logic to trigger a fresh OTP
                    const res = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            email: this.mfaEmail, 
                            password: this.loginPassword.value,
                            remember: true 
                        })
                    });
                    const data = await res.json();
                    if (res.ok) {
                        mfaSubtitle.textContent = data.message;
                        Swal.fire('Sent!', 'A new code has been dispatched.', 'success');
                        
                        // Cooldown
                        let timeLeft = 60;
                        const timer = setInterval(() => {
                            newBtn.textContent = `Resend in ${timeLeft}s`;
                            timeLeft--;
                            if (timeLeft < 0) {
                                clearInterval(timer);
                                newBtn.disabled = false;
                                newBtn.textContent = originalText;
                            }
                        }, 1000);
                    }
                } catch (err) {
                    newBtn.disabled = false;
                    newBtn.textContent = originalText;
                    Swal.fire('Error', 'Failed to resend code.', 'error');
                }
            });
        }
        
        setTimeout(() => this.mfaTokenInput.focus(), 400);
    }
    
    async handleMfaVerify(e) {
        e.preventDefault();
        const token = this.mfaTokenInput.value.trim();
        if (token.length !== 6) return this.showError(this.mfaTokenInput, this.mfaError, 'Enter exactly 6 digits.');

        const submitBtn = this.mfaFormElement.querySelector('.submit-btn');
        submitBtn.classList.add('loading');
        
        try {
            const res = await fetch('/api/auth/login/mfa', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: this.mfaEmail, token })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'MFA failed');

            // Success - Store tokens based on original "Remember Me" preference
            const remember = sessionStorage.getItem('q_remember') === 'true';
            const storage = remember ? localStorage : sessionStorage;
            
            storage.setItem('q_access', data.accessToken);
            storage.setItem('q_refresh', data.refreshToken);
            storage.setItem('q_user', JSON.stringify(data.user));
            
            // Clean up temporary remember state
            sessionStorage.removeItem('q_remember');

            this.showSuccess('MFA Verified! Redirecting...');
            setTimeout(() => window.location.href = '/', 1500);

        } catch (error) {
            this.showError(this.mfaTokenInput, this.mfaError, error.message);
        } finally {
            submitBtn.classList.remove('loading');
        }
    }

    switchToSignup(updateUrl = true) {
        if (this.currentForm === 'signup') return;
        this.currentForm = 'signup';
        
        if (updateUrl) {
            const url = new URL(window.location);
            url.searchParams.set('form', 'signup');
            window.history.pushState({}, '', url);
        }

        this.loginForm.classList.add('slide-out-left');
        setTimeout(() => {
            this.loginForm.classList.add('hidden');
            this.loginForm.classList.remove('slide-out-left');
            
            this.signupForm.classList.remove('hidden');
            this.signupForm.classList.add('slide-in-right');
        }, 200);
    }

    switchToLogin(updateUrl = true) {
        if (this.currentForm === 'login') return;
        const previousForm = this.currentForm;
        this.currentForm = 'login';
        
        if (updateUrl) {
            const url = new URL(window.location);
            url.searchParams.set('form', 'login');
            window.history.pushState({}, '', url);
        }

        const fromForm = previousForm === 'signup' ? this.signupForm : this.mfaForm;
        
        fromForm.classList.add('slide-out-left');
        setTimeout(() => {
            fromForm.classList.add('hidden');
            fromForm.classList.remove('slide-out-left');
            
            this.loginForm.classList.remove('hidden');
            this.loginForm.classList.add('slide-in-right');
        }, 200);
    }
}

// Handle browser back/forward buttons
window.addEventListener('popstate', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const form = urlParams.get('form');
    
    if (window.authFlow) {
        if (form === 'signup') {
            window.authFlow.switchToSignup(false);
        } else {
            window.authFlow.switchToLogin(false);
        }
    }
});

// Store reference for popstate handler
document.addEventListener('DOMContentLoaded', () => {
    window.authFlow = new AuthFlow();
});