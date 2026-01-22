// login.js
class LoginManager {
    constructor() {
        this.currentUser = this.loadCurrentUser();
        this.users = this.loadUsers();
        this.init();
    }

    init() {
        // Check if user is already logged in
        if (this.currentUser) {
            this.showDashboard();
        } else {
            this.showLoginPage();
        }
        
        // Setup event listeners
        this.setupEventListeners();
    }

    loadCurrentUser() {
        const saved = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
        return saved ? JSON.parse(saved) : null;
    }

    loadUsers() {
        const saved = localStorage.getItem('filedgeUsers');
        if (saved) return JSON.parse(saved);
        
        // Default admin user
        return [
            {
                id: 1,
                username: 'admin',
                password: 'admin123',
                role: 'admin',
                email: 'admin@filedge.com',
                fullName: 'Administrator',
                department: 'Management',
                createdDate: new Date().toISOString()
            },
            {
                id: 2,
                username: 'user',
                password: 'user123',
                role: 'user',
                email: 'user@filedge.com',
                fullName: 'Regular User',
                department: 'Operations',
                createdDate: new Date().toISOString()
            }
        ];
    }

    saveUsers() {
        localStorage.setItem('filedgeUsers', JSON.stringify(this.users));
    }

    setupEventListeners() {
        // Login form submission
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLoginFormSubmit(e);
            });
        }

        // Logout buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('[data-action="logout"]')) {
                e.preventDefault();
                this.handleLogout();
            }
        });

        // Password toggle
        const passwordToggle = document.getElementById('password-toggle');
        if (passwordToggle) {
            passwordToggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.togglePasswordVisibility();
            });
        }

        // Remember me checkbox
        const rememberMe = document.getElementById('remember-me');
        if (rememberMe) {
            rememberMe.addEventListener('change', (e) => {
                this.saveRememberMePreference(e.target.checked);
            });
        }
    }

    handleLoginFormSubmit(e) {
        const form = e.target;
        const username = form.querySelector('input[name="username"]').value.trim();
        const password = form.querySelector('input[name="password"]').value;
        const rememberMe = form.querySelector('#remember-me')?.checked || false;

        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
        submitBtn.disabled = true;

        // Simulate network delay
        setTimeout(() => {
            const result = this.login(username, password, rememberMe);
            
            if (result.success) {
                this.showDashboard();
            } else {
                this.showLoginError(result.message);
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        }, 500);
    }

    login(username, password, rememberMe = false) {
        // Validate inputs
        if (!username || !password) {
            return { success: false, message: 'Please enter username and password' };
        }

        // Find user
        const user = this.users.find(u => 
            u.username.toLowerCase() === username.toLowerCase() && 
            u.password === password
        );

        if (!user) {
            return { success: false, message: 'Invalid username or password' };
        }

        // Set current user
        this.currentUser = user;
        
        // Save to storage based on remember me preference
        if (rememberMe) {
            localStorage.setItem('currentUser', JSON.stringify(user));
        } else {
            sessionStorage.setItem('currentUser', JSON.stringify(user));
        }

        return { success: true, message: 'Login successful' };
    }

    logout() {
        this.currentUser = null;
        sessionStorage.removeItem('currentUser');
        localStorage.removeItem('currentUser');
        this.showLoginPage();
    }

    handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            this.logout();
        }
    }

    showLoginPage() {
        const loginPage = document.getElementById('login-page');
        const mainApp = document.getElementById('main-app');
        
        if (loginPage) loginPage.style.display = 'block';
        if (mainApp) mainApp.style.display = 'none';
        
        // Clear form fields
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.reset();
        }
    }

    showDashboard() {
        const loginPage = document.getElementById('login-page');
        const mainApp = document.getElementById('main-app');
        
        if (loginPage) loginPage.style.display = 'none';
        if (mainApp) mainApp.style.display = 'block';
        
        // Update user display
        this.updateUserDisplay();
        
        // Initialize main application if not already initialized
        if (!window.jsdcApp && typeof JSDCApplication !== 'undefined') {
            window.jsdcApp = new JSDCApplication();
        }
    }

    updateUserDisplay() {
        if (!this.currentUser) return;
        
        const userDisplayElements = document.querySelectorAll('.user-display, #current-user-display');
        userDisplayElements.forEach(element => {
            element.textContent = `${this.currentUser.fullName || this.currentUser.username} (${this.currentUser.role})`;
        });
    }

    showLoginError(message) {
        let errorDiv = document.getElementById('login-error');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.id = 'login-error';
            errorDiv.className = 'alert alert-danger alert-dismissible fade show mt-3';
            errorDiv.innerHTML = `
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
            const loginForm = document.getElementById('login-form');
            if (loginForm) {
                loginForm.appendChild(errorDiv);
            }
        } else {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (errorDiv) {
                errorDiv.style.display = 'none';
            }
        }, 5000);
    }

    togglePasswordVisibility() {
        const passwordInput = document.getElementById('login-password');
        const toggleIcon = document.getElementById('password-toggle-icon');
        
        if (passwordInput && toggleIcon) {
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                toggleIcon.className = 'fas fa-eye-slash';
            } else {
                passwordInput.type = 'password';
                toggleIcon.className = 'fas fa-eye';
            }
        }
    }

    saveRememberMePreference(remember) {
        localStorage.setItem('rememberMe', remember);
    }

    loadRememberMePreference() {
        return localStorage.getItem('rememberMe') === 'true';
    }

    // User management methods (for admin)
    addUser(userData) {
        // Check if username already exists
        if (this.users.some(u => u.username === userData.username)) {
            return { success: false, message: 'Username already exists' };
        }
        
        // Check if email already exists
        if (userData.email && this.users.some(u => u.email === userData.email)) {
            return { success: false, message: 'Email already exists' };
        }
        
        const newUser = {
            id: Math.max(...this.users.map(u => u.id), 0) + 1,
            ...userData,
            createdDate: new Date().toISOString()
        };
        
        this.users.push(newUser);
        this.saveUsers();
        
        return { success: true, message: 'User added successfully', user: newUser };
    }

    updateUser(userId, userData) {
        const userIndex = this.users.findIndex(u => u.id === userId);
        if (userIndex === -1) {
            return { success: false, message: 'User not found' };
        }
        
        // Check if username is being changed and already exists
        if (userData.username && userData.username !== this.users[userIndex].username) {
            if (this.users.some(u => u.username === userData.username && u.id !== userId)) {
                return { success: false, message: 'Username already exists' };
            }
        }
        
        // Check if email is being changed and already exists
        if (userData.email && userData.email !== this.users[userIndex].email) {
            if (this.users.some(u => u.email === userData.email && u.id !== userId)) {
                return { success: false, message: 'Email already exists' };
            }
        }
        
        this.users[userIndex] = { ...this.users[userIndex], ...userData };
        this.saveUsers();
        
        // Update current user if it's the same user
        if (this.currentUser && this.currentUser.id === userId) {
            this.currentUser = this.users[userIndex];
            sessionStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        }
        
        return { success: true, message: 'User updated successfully' };
    }

    deleteUser(userId) {
        // Prevent deleting current user
        if (this.currentUser && this.currentUser.id === userId) {
            return { success: false, message: 'Cannot delete your own account' };
        }
        
        const userIndex = this.users.findIndex(u => u.id === userId);
        if (userIndex === -1) {
            return { success: false, message: 'User not found' };
        }
        
        this.users.splice(userIndex, 1);
        this.saveUsers();
        
        return { success: true, message: 'User deleted successfully' };
    }

    getAllUsers() {
        return [...this.users];
    }

    getUserById(userId) {
        return this.users.find(u => u.id === userId);
    }

    isAdmin() {
        return this.currentUser && this.currentUser.role === 'admin';
    }

    hasPermission(permission) {
        if (!this.currentUser) return false;
        
        const permissions = {
            admin: ['manage_users', 'view_reports', 'manage_settings', 'view_all_data'],
            user: ['view_reports', 'view_own_data']
        };
        
        return permissions[this.currentUser.role]?.includes(permission) || false;
    }
}