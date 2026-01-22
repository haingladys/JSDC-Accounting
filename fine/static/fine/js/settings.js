// settings.js
class SettingsManager {
    static initialize() {
        console.log('Initializing Settings Manager');
        
        // Load settings
        this.loadSettings();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize user management if admin
        if (window.loginManager && window.loginManager.isAdmin()) {
            this.initializeUserManagement();
        }
        
        console.log('Settings Manager initialized');
    }
    
    static loadSettings() {
        // Load application settings from localStorage
        this.settings = JSON.parse(localStorage.getItem('appSettings')) || {
            companyName: 'FinEdge Pro',
            currency: '₹',
            dateFormat: 'dd/mm/yyyy',
            timeFormat: '24h',
            language: 'en',
            theme: 'light',
            notifications: true,
            autoSave: true,
            backupInterval: 24,
            taxRate: 18,
            defaultPaymentMethod: 'Cash'
        };
        
        // Apply settings to UI
        this.applySettings();
    }
    
    static saveSettings() {
        try {
            localStorage.setItem('appSettings', JSON.stringify(this.settings));
            this.showToast('Settings saved successfully!', 'success');
            return true;
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showToast('Error saving settings', 'error');
            return false;
        }
    }
    
    static applySettings() {
        // Apply currency symbol
        const currencyElements = document.querySelectorAll('.currency-symbol');
        currencyElements.forEach(el => {
            el.textContent = this.settings.currency;
        });
        
        // Apply theme
        document.body.setAttribute('data-theme', this.settings.theme);
        
        // Apply company name
        const companyNameElements = document.querySelectorAll('.company-name');
        companyNameElements.forEach(el => {
            el.textContent = this.settings.companyName;
        });
    }
    
    static setupEventListeners() {
        // Settings form submission
        const settingsForm = document.getElementById('settings-form');
        if (settingsForm) {
            settingsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveSettingsForm();
            });
        }
        
        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('change', (e) => {
                this.toggleTheme(e.target.checked ? 'dark' : 'light');
            });
        }
        
        // Export data button
        const exportDataBtn = document.getElementById('export-data-btn');
        if (exportDataBtn) {
            exportDataBtn.addEventListener('click', () => {
                this.exportAllData();
            });
        }
        
        // Import data button
        const importDataBtn = document.getElementById('import-data-btn');
        if (importDataBtn) {
            importDataBtn.addEventListener('click', () => {
                this.showImportModal();
            });
        }
        
        // Backup now button
        const backupNowBtn = document.getElementById('backup-now-btn');
        if (backupNowBtn) {
            backupNowBtn.addEventListener('click', () => {
                this.createBackup();
            });
        }
        
        // Reset settings button
        const resetSettingsBtn = document.getElementById('reset-settings-btn');
        if (resetSettingsBtn) {
            resetSettingsBtn.addEventListener('click', () => {
                this.resetSettings();
            });
        }
    }
    
    static initializeUserManagement() {
        // Populate users table
        this.renderUsersTable();
        
        // Setup user management event listeners
        this.setupUserManagementListeners();
    }
    
    static setupUserManagementListeners() {
        // Add user button
        const addUserBtn = document.getElementById('add-user-btn');
        if (addUserBtn) {
            addUserBtn.addEventListener('click', () => {
                this.openAddUserModal();
            });
        }
        
        // User table event delegation
        const usersTable = document.getElementById('users-table');
        if (usersTable) {
            usersTable.addEventListener('click', (e) => {
                const target = e.target;
                const editBtn = target.closest('.edit-user-btn');
                const deleteBtn = target.closest('.delete-user-btn');
                const resetPasswordBtn = target.closest('.reset-password-btn');
                
                if (editBtn) {
                    const userId = parseInt(editBtn.dataset.userId);
                    this.openEditUserModal(userId);
                }
                
                if (deleteBtn) {
                    const userId = parseInt(deleteBtn.dataset.userId);
                    this.deleteUser(userId);
                }
                
                if (resetPasswordBtn) {
                    const userId = parseInt(resetPasswordBtn.dataset.userId);
                    this.resetUserPassword(userId);
                }
            });
        }
    }
    
    static renderUsersTable() {
        const tbody = document.getElementById('users-table-body');
        if (!tbody || !window.loginManager) return;
        
        const users = window.loginManager.getAllUsers();
        
        tbody.innerHTML = '';
        
        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.fullName || '-'}</td>
                <td>${user.email || '-'}</td>
                <td>${user.department || '-'}</td>
                <td><span class="badge ${user.role === 'admin' ? 'bg-danger' : 'bg-info'}">${user.role}</span></td>
                <td>${new Date(user.createdDate).toLocaleDateString()}</td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary edit-user-btn" data-user-id="${user.id}" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-warning reset-password-btn" data-user-id="${user.id}" title="Reset Password">
                            <i class="fas fa-key"></i>
                        </button>
                        ${user.id !== window.loginManager.currentUser?.id ? `
                            <button class="btn btn-outline-danger delete-user-btn" data-user-id="${user.id}" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }
    
    static openAddUserModal() {
        const modalContent = `
            <form id="add-user-form">
                <div class="row g-3">
                    <div class="col-md-6">
                        <label class="form-label">Username *</label>
                        <input type="text" class="form-control" id="new-username" required>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Full Name</label>
                        <input type="text" class="form-control" id="new-fullname">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Email</label>
                        <input type="email" class="form-control" id="new-email">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Department</label>
                        <input type="text" class="form-control" id="new-department">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Password *</label>
                        <input type="password" class="form-control" id="new-password" required minlength="6">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Confirm Password *</label>
                        <input type="password" class="form-control" id="new-confirm-password" required>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Role *</label>
                        <select class="form-select" id="new-role" required>
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                </div>
                <div class="mt-3">
                    <div id="add-user-error" class="alert alert-danger d-none"></div>
                    <button type="submit" class="btn btn-primary">Add User</button>
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                </div>
            </form>
        `;
        
        this.showModal('Add New User', modalContent);
        
        // Add form submit handler
        setTimeout(() => {
            const form = document.getElementById('add-user-form');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.addNewUser();
                });
            }
        }, 100);
    }
    
    static addNewUser() {
        const username = document.getElementById('new-username').value.trim();
        const fullName = document.getElementById('new-fullname').value.trim();
        const email = document.getElementById('new-email').value.trim();
        const department = document.getElementById('new-department').value.trim();
        const password = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('new-confirm-password').value;
        const role = document.getElementById('new-role').value;
        
        // Validate
        if (password !== confirmPassword) {
            this.showFormError('add-user-error', 'Passwords do not match');
            return;
        }
        
        if (password.length < 6) {
            this.showFormError('add-user-error', 'Password must be at least 6 characters');
            return;
        }
        
        const userData = {
            username,
            password,
            role,
            email: email || undefined,
            fullName: fullName || undefined,
            department: department || undefined
        };
        
        const result = window.loginManager.addUser(userData);
        
        if (result.success) {
            this.renderUsersTable();
            bootstrap.Modal.getInstance(document.querySelector('.user-management-modal')).hide();
            this.showToast('User added successfully!', 'success');
        } else {
            this.showFormError('add-user-error', result.message);
        }
    }
    
    static openEditUserModal(userId) {
        const user = window.loginManager.getUserById(userId);
        if (!user) return;
        
        const modalContent = `
            <form id="edit-user-form">
                <input type="hidden" id="edit-user-id" value="${user.id}">
                <div class="row g-3">
                    <div class="col-md-6">
                        <label class="form-label">Username *</label>
                        <input type="text" class="form-control" id="edit-username" value="${user.username}" required>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Full Name</label>
                        <input type="text" class="form-control" id="edit-fullname" value="${user.fullName || ''}">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Email</label>
                        <input type="email" class="form-control" id="edit-email" value="${user.email || ''}">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Department</label>
                        <input type="text" class="form-control" id="edit-department" value="${user.department || ''}">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">New Password</label>
                        <input type="password" class="form-control" id="edit-password" placeholder="Leave blank to keep current">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Confirm Password</label>
                        <input type="password" class="form-control" id="edit-confirm-password">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Role *</label>
                        <select class="form-select" id="edit-role" required>
                            <option value="user" ${user.role === 'user' ? 'selected' : ''}>User</option>
                            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                        </select>
                    </div>
                </div>
                <div class="mt-3">
                    <div id="edit-user-error" class="alert alert-danger d-none"></div>
                    <button type="submit" class="btn btn-primary">Update User</button>
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    ${user.id !== window.loginManager.currentUser?.id ? `
                        <button type="button" class="btn btn-danger float-end" onclick="SettingsManager.deleteUser(${user.id})">Delete User</button>
                    ` : ''}
                </div>
            </form>
        `;
        
        this.showModal('Edit User', modalContent);
        
        // Add form submit handler
        setTimeout(() => {
            const form = document.getElementById('edit-user-form');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.updateUser(userId);
                });
            }
        }, 100);
    }
    
    static updateUser(userId) {
        const username = document.getElementById('edit-username').value.trim();
        const fullName = document.getElementById('edit-fullname').value.trim();
        const email = document.getElementById('edit-email').value.trim();
        const department = document.getElementById('edit-department').value.trim();
        const password = document.getElementById('edit-password').value;
        const confirmPassword = document.getElementById('edit-confirm-password').value;
        const role = document.getElementById('edit-role').value;
        
        // Validate passwords if provided
        if (password && password !== confirmPassword) {
            this.showFormError('edit-user-error', 'Passwords do not match');
            return;
        }
        
        const userData = {
            username,
            role,
            email: email || undefined,
            fullName: fullName || undefined,
            department: department || undefined
        };
        
        // Only include password if provided
        if (password) {
            userData.password = password;
        }
        
        const result = window.loginManager.updateUser(userId, userData);
        
        if (result.success) {
            this.renderUsersTable();
            bootstrap.Modal.getInstance(document.querySelector('.user-management-modal')).hide();
            this.showToast('User updated successfully!', 'success');
        } else {
            this.showFormError('edit-user-error', result.message);
        }
    }
    
    static deleteUser(userId) {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }
        
        const result = window.loginManager.deleteUser(userId);
        
        if (result.success) {
            this.renderUsersTable();
            this.showToast('User deleted successfully!', 'success');
            
            // Close modal if open
            const modal = document.querySelector('.user-management-modal');
            if (modal) {
                bootstrap.Modal.getInstance(modal).hide();
            }
        } else {
            this.showToast(result.message, 'error');
        }
    }
    
    static resetUserPassword(userId) {
        const user = window.loginManager.getUserById(userId);
        if (!user) return;
        
        const newPassword = prompt(`Reset password for ${user.username}\nEnter new password:`);
        
        if (!newPassword) return;
        
        if (newPassword.length < 6) {
            alert('Password must be at least 6 characters');
            return;
        }
        
        const confirmPassword = prompt('Confirm new password:');
        
        if (newPassword !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        
        const result = window.loginManager.updateUser(userId, { password: newPassword });
        
        if (result.success) {
            this.showToast(`Password reset for ${user.username}`, 'success');
        } else {
            this.showToast(result.message, 'error');
        }
    }
    
    static saveSettingsForm() {
        const form = document.getElementById('settings-form');
        if (!form) return;
        
        const formData = new FormData(form);
        
        // Update settings object
        this.settings.companyName = formData.get('companyName') || this.settings.companyName;
        this.settings.currency = formData.get('currency') || this.settings.currency;
        this.settings.dateFormat = formData.get('dateFormat') || this.settings.dateFormat;
        this.settings.timeFormat = formData.get('timeFormat') || this.settings.timeFormat;
        this.settings.language = formData.get('language') || this.settings.language;
        this.settings.theme = formData.get('theme') || this.settings.theme;
        this.settings.notifications = formData.get('notifications') === 'on';
        this.settings.autoSave = formData.get('autoSave') === 'on';
        this.settings.backupInterval = parseInt(formData.get('backupInterval')) || this.settings.backupInterval;
        this.settings.taxRate = parseFloat(formData.get('taxRate')) || this.settings.taxRate;
        this.settings.defaultPaymentMethod = formData.get('defaultPaymentMethod') || this.settings.defaultPaymentMethod;
        
        // Save settings
        if (this.saveSettings()) {
            // Apply settings
            this.applySettings();
        }
    }
    
    static toggleTheme(theme) {
        this.settings.theme = theme;
        this.saveSettings();
        this.applySettings();
    }
    
    static exportAllData() {
        const data = {
            settings: this.settings,
            users: window.loginManager?.getAllUsers() || [],
            purchases: window.jsdcApp?.AppState?.purchases || [],
            expenses: window.jsdcApp?.AppState?.expenses || [],
            incomeData: window.jsdcApp?.incomeManager?.incomeData || {},
            payrollEmployees: window.jsdcApp?.payrollEmployees || [],
            attendanceEmployees: window.jsdcApp?.attendanceEmployees || [],
            purchaseCategories: CategoryManager?.getPurchaseCategories() || [],
            expenseCategories: CategoryManager?.getExpenseCategories() || [],
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `filedge_backup_${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        this.showToast('Data exported successfully!', 'success');
    }
    
    static showImportModal() {
        const modalContent = `
            <div class="alert alert-warning">
                <strong>Warning:</strong> Importing data will overwrite existing data. Make sure to export current data first.
            </div>
            <div class="mb-3">
                <label class="form-label">Select backup file</label>
                <input type="file" class="form-control" id="import-file" accept=".json">
            </div>
            <div class="form-check mb-3">
                <input class="form-check-input" type="checkbox" id="import-confirm">
                <label class="form-check-label" for="import-confirm">
                    I understand this will overwrite existing data
                </label>
            </div>
            <div id="import-error" class="alert alert-danger d-none"></div>
            <div class="mt-3">
                <button class="btn btn-primary" onclick="SettingsManager.importData()" id="import-btn" disabled>Import Data</button>
                <button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            </div>
        `;
        
        this.showModal('Import Data', modalContent);
        
        // Enable import button when file is selected and confirmed
        setTimeout(() => {
            const importFile = document.getElementById('import-file');
            const importConfirm = document.getElementById('import-confirm');
            const importBtn = document.getElementById('import-btn');
            
            if (importFile && importConfirm && importBtn) {
                const checkImportButton = () => {
                    importBtn.disabled = !(importFile.files.length > 0 && importConfirm.checked);
                };
                
                importFile.addEventListener('change', checkImportButton);
                importConfirm.addEventListener('change', checkImportButton);
            }
        }, 100);
    }
    
    static importData() {
        const fileInput = document.getElementById('import-file');
        if (!fileInput || !fileInput.files.length) return;
        
        const file = fileInput.files[0];
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                // Validate backup file
                if (!data.version || !data.exportDate) {
                    throw new Error('Invalid backup file format');
                }
                
                if (confirm('Are you sure you want to import this data? This will overwrite all current data.')) {
                    // Import data
                    if (data.settings) {
                        this.settings = data.settings;
                        localStorage.setItem('appSettings', JSON.stringify(this.settings));
                    }
                    
                    if (data.users && window.loginManager) {
                        localStorage.setItem('filedgeUsers', JSON.stringify(data.users));
                        window.loginManager.users = data.users;
                    }
                    
                    if (data.purchases && window.jsdcApp) {
                        window.jsdcApp.AppState.purchases = data.purchases;
                        localStorage.setItem('purchasesData', JSON.stringify(data.purchases));
                    }
                    
                    if (data.expenses && window.jsdcApp) {
                        window.jsdcApp.AppState.expenses = data.expenses;
                        localStorage.setItem('expensesData', JSON.stringify(data.expenses));
                    }
                    
                    if (data.incomeData && window.jsdcApp?.incomeManager) {
                        window.jsdcApp.incomeManager.incomeData = data.incomeData;
                        localStorage.setItem('incomeData', JSON.stringify(data.incomeData));
                    }
                    
                    if (data.purchaseCategories && CategoryManager) {
                        CategoryManager.purchaseCategories = data.purchaseCategories;
                        localStorage.setItem('purchaseCategories', JSON.stringify(data.purchaseCategories));
                    }
                    
                    if (data.expenseCategories && CategoryManager) {
                        CategoryManager.expenseCategories = data.expenseCategories;
                        localStorage.setItem('expenseCategories', JSON.stringify(data.expenseCategories));
                    }
                    
                    this.showToast('Data imported successfully!', 'success');
                    
                    // Close modal
                    bootstrap.Modal.getInstance(document.querySelector('.import-modal')).hide();
                    
                    // Refresh the page to apply changes
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                }
            } catch (error) {
                console.error('Error importing data:', error);
                this.showFormError('import-error', 'Error importing data: ' + error.message);
            }
        };
        
        reader.readAsText(file);
    }
    
    static createBackup() {
        this.exportAllData();
    }
    
    static resetSettings() {
        if (confirm('Are you sure you want to reset all settings to default values?')) {
            // Clear all localStorage data
            const keysToKeep = ['filedgeUsers', 'currentUser'];
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (!keysToKeep.includes(key)) {
                    localStorage.removeItem(key);
                }
            }
            
            this.showToast('Settings reset successfully! The page will reload.', 'success');
            
            // Reload the page
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        }
    }
    
    static showModal(title, content) {
        let modal = document.querySelector('.settings-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'modal fade settings-modal';
            modal.innerHTML = `
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${title}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body"></div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        
        modal.querySelector('.modal-title').textContent = title;
        modal.querySelector('.modal-body').innerHTML = content;
        
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }
    
    static showFormError(elementId, message) {
        const errorDiv = document.getElementById(elementId);
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.classList.remove('d-none');
        }
    }
    
    static showToast(message, type = 'success') {
        if (window.jsdcApp && window.jsdcApp.showToast) {
            window.jsdcApp.showToast(message, type);
        } else {
            // Fallback toast
            const toastEl = document.getElementById('successToast');
            if (toastEl) {
                const toast = new bootstrap.Toast(toastEl);
                const toastBody = toastEl.querySelector('.toast-body span');
                if (toastBody) {
                    toastBody.textContent = message;
                }
                toast.show();
            }
        }
    }
}