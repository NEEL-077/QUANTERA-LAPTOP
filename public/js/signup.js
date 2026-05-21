// Signup form functionality
class SignupForm {
    constructor() {
        this.form = document.getElementById('signupForm');
        this.emailInput = document.getElementById('email');
        this.passwordInput = document.getElementById('password');
        this.emailError = document.getElementById('email-error');
        this.passwordError = document.getElementById('password-error');
        this.submitBtn = this.form.querySelector('.submit-btn');
        
        this.init();
    }
    
    init() {
        this.form.addEventListener('submit', this.handleSubmit.bind(this));
        this.emailInput.addEventListener('blur', this.validateEmail.bind(this));
        this.passwordInput.addEventListener('blur', this.validatePassword.bind(this));
        this.emailInput.addEventListener('input', this.clearEmailError.bind(this));
        this.passwordInput.addEventListener('input', this.clearPasswordError.bind(this));
    }
    
    validateEmail(showError = true) {
        const email = this.emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValid = emailRegex.test(email);
        
        if (!isValid && email && showError) {
            this.showError(this.emailInput, this.emailError, 'Please enter a valid email address.');
            return false;
        } else if (!email && showError) {
            this.showError(this.emailInput, this.emailError, 'Email is required.');
            return false;
        } else {
            this.clearError(this.emailInput, this.emailError);
            return true;
        }
    }
    
    validatePassword(showError = true) {
        const password = this.passwordInput.value;
        const isValid = password.length >= 8;
        
        if (!isValid && password && showError) {
            this.showError(this.passwordInput, this.passwordError, 'Password must be at least 8 characters.');
            return false;
        } else if (!password && showError) {
            this.showError(this.passwordInput, this.passwordError, 'Password is required.');
            return false;
        } else {
            this.clearError(this.passwordInput, this.passwordError);
            return true;
        }
    }
    
    showError(input, errorElement, message) {
        input.classList.add('error', 'shake');
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        
        // Remove shake animation after it completes
        setTimeout(() => {
            input.classList.remove('shake');
        }, 300);
    }
    
    clearError(input, errorElement) {
        input.classList.remove('error');
        errorElement.style.display = 'none';
        errorElement.textContent = '';
    }
    
    clearEmailError() {
        if (this.emailInput.value.trim()) {
            this.clearError(this.emailInput, this.emailError);
        }
    }
    
    clearPasswordError() {
        if (this.passwordInput.value) {
            this.clearError(this.passwordInput, this.passwordError);
        }
    }
    
    async handleSubmit(e) {
        e.preventDefault();
        
        // Validate all fields
        const isEmailValid = this.validateEmail();
        const isPasswordValid = this.validatePassword();
        
        if (!isEmailValid || !isPasswordValid) {
            return;
        }
        
        // Show loading state
        this.submitBtn.classList.add('loading');
        this.submitBtn.disabled = true;
        
        try {
            // Simulate API call
            await this.submitForm();
            
            // Success handling
            this.showSuccess();
            this.resetForm();
            
        } catch (error) {
            console.error('Submission error:', error);
            this.showSubmissionError();
        } finally {
            // Remove loading state
            this.submitBtn.classList.remove('loading');
            this.submitBtn.disabled = false;
        }
    }
    
    async submitForm() {
        const formData = {
            email: this.emailInput.value.trim(),
            password: this.passwordInput.value
        };
        
        console.log('Form submitted!', formData);
        
        // Simulate API delay
        return new Promise((resolve) => {
            setTimeout(resolve, 1500);
        });
    }
    
    showSuccess() {
        if (window.QuanteraUI?.showAlert) {
            window.QuanteraUI.showAlert({
                title: 'Account Created',
                description: '✓ Your account has been created successfully!',
                variant: 'success',
                duration: 4000
            });
        } else {
            console.log('✓ Account created successfully!');
        }
    }
    
    showSubmissionError() {
        if (window.QuanteraUI?.showAlert) {
            window.QuanteraUI.showAlert({
                title: 'Registration Error',
                description: 'There was an error creating your account. Please try again.',
                variant: 'error'
            });
        } else {
            alert('There was an error creating your account. Please try again.');
        }
    }
    
    resetForm() {
        this.form.reset();
        this.clearError(this.emailInput, this.emailError);
        this.clearError(this.passwordInput, this.passwordError);
    }
}

// Initialize the form when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SignupForm();
});

// Add some visual enhancements
document.addEventListener('DOMContentLoaded', () => {
    // Add subtle animations to form elements
    const formInputs = document.querySelectorAll('.form-input');
    
    formInputs.forEach(input => {
        input.addEventListener('focus', () => {
            input.style.transform = 'scale(1.02)';
        });
        
        input.addEventListener('blur', () => {
            input.style.transform = 'scale(1)';
        });
    });
    
    // Add hover effect to submit button
    const submitBtn = document.querySelector('.submit-btn');
    submitBtn.addEventListener('mouseenter', () => {
        submitBtn.style.transform = 'translateY(-2px)';
        submitBtn.style.boxShadow = '0 4px 12px rgba(249, 115, 22, 0.3)';
    });
    
    submitBtn.addEventListener('mouseleave', () => {
        submitBtn.style.transform = 'translateY(0)';
        submitBtn.style.boxShadow = 'none';
    });
});