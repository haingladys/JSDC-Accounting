// category-manager.js
class CategoryManager {
    static purchaseCategories = [];
    static expenseCategories = [];
    
    static initialize() {
        console.log('Initializing Category Manager');
        
        // Load categories from localStorage
        this.loadCategories();
        
        // Setup event listeners for category management
        this.setupEventListeners();
        
        // Populate dropdowns with existing categories
        this.populateCategoryDropdowns();
        
        console.log('Category Manager initialized');
    }
    
    static loadCategories() {
        try {
            // Load purchase categories
            const savedPurchaseCategories = localStorage.getItem('purchaseCategories');
            if (savedPurchaseCategories) {
                this.purchaseCategories = JSON.parse(savedPurchaseCategories);
            } else {
                this.purchaseCategories = ['Beeda', 'Coconut', 'Milk', 'Vegetables'];
                this.savePurchaseCategories();
            }
            
            // Load expense categories
            const savedExpenseCategories = localStorage.getItem('expenseCategories');
            if (savedExpenseCategories) {
                this.expenseCategories = JSON.parse(savedExpenseCategories);
            } else {
                this.expenseCategories = ['Beta & OT', 'Daily Salary', 'Electricity', 'Petrol & Diesel', 'Phone Bill', 'Rental', 'Wages'];
                this.saveExpenseCategories();
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            // Reset to default categories
            this.purchaseCategories = ['Beeda', 'Coconut', 'Milk', 'Vegetables'];
            this.expenseCategories = ['Beta & OT', 'Daily Salary', 'Electricity', 'Petrol & Diesel', 'Phone Bill', 'Rental', 'Wages'];
        }
    }
    
    static savePurchaseCategories() {
        try {
            localStorage.setItem('purchaseCategories', JSON.stringify(this.purchaseCategories));
        } catch (error) {
            console.error('Error saving purchase categories:', error);
        }
    }
    
    static saveExpenseCategories() {
        try {
            localStorage.setItem('expenseCategories', JSON.stringify(this.expenseCategories));
        } catch (error) {
            console.error('Error saving expense categories:', error);
        }
    }
    
    static setupEventListeners() {
        // Purchase Category Add Button
        const addPurchaseCategoryBtn = document.getElementById('addPurchaseCategoryBtn');
        if (addPurchaseCategoryBtn) {
            addPurchaseCategoryBtn.addEventListener('click', () => {
                this.showPurchaseCategoryInput();
            });
        }
        
        // Purchase Category Save Button
        const savePurchaseCategoryBtn = document.getElementById('savePurchaseCategory');
        if (savePurchaseCategoryBtn) {
            savePurchaseCategoryBtn.addEventListener('click', () => {
                this.savePurchaseCategory();
            });
        }
        
        // Expense Category Add Button
        const addExpenseCategoryBtn = document.getElementById('addExpenseCategoryBtn');
        if (addExpenseCategoryBtn) {
            addExpenseCategoryBtn.addEventListener('click', () => {
                this.showExpenseCategoryInput();
            });
        }
        
        // Expense Category Save Button
        const saveExpenseCategoryBtn = document.getElementById('saveExpenseCategory');
        if (saveExpenseCategoryBtn) {
            saveExpenseCategoryBtn.addEventListener('click', () => {
                this.saveExpenseCategory();
            });
        }
        
        // Listen for Enter key in category input fields
        document.addEventListener('keypress', (e) => {
            if (e.target.id === 'newPurchaseCategory' && e.key === 'Enter') {
                this.savePurchaseCategory();
            }
            if (e.target.id === 'newExpenseCategory' && e.key === 'Enter') {
                this.saveExpenseCategory();
            }
        });
    }
    
    static showPurchaseCategoryInput() {
        const inputBox = document.getElementById('purchaseCategoryInputBox');
        if (inputBox) {
            inputBox.style.display = 'block';
            const input = document.getElementById('newPurchaseCategory');
            if (input) {
                input.value = '';
                input.focus();
            }
        }
    }
    
    static showExpenseCategoryInput() {
        const inputBox = document.getElementById('expenseCategoryInputBox');
        if (inputBox) {
            inputBox.style.display = 'block';
            const input = document.getElementById('newExpenseCategory');
            if (input) {
                input.value = '';
                input.focus();
            }
        }
    }
    
    static savePurchaseCategory() {
        const input = document.getElementById('newPurchaseCategory');
        if (!input) return;
        
        const categoryName = input.value.trim();
        
        if (!categoryName) {
            this.showToast('Please enter a category name', 'error');
            return;
        }
        
        // Check for duplicates (case-insensitive)
        const isDuplicate = this.purchaseCategories.some(cat => 
            cat.toLowerCase() === categoryName.toLowerCase()
        );
        
        if (isDuplicate) {
            this.showToast(`Category "${categoryName}" already exists!`, 'error');
            input.focus();
            return;
        }
        
        // Add category to array
        this.purchaseCategories.push(categoryName);
        this.savePurchaseCategories();
        
        // Add to dropdown
        this.addCategoryToDropdown('purchaseCategory', categoryName);
        
        // Select the new category
        const dropdown = document.getElementById('purchaseCategory');
        if (dropdown) {
            dropdown.value = categoryName;
        }
        
        // Hide input box
        const inputBox = document.getElementById('purchaseCategoryInputBox');
        if (inputBox) {
            inputBox.style.display = 'none';
        }
        
        // Show success message
        this.showToast(`Category "${categoryName}" added successfully!`, 'success');
        
        // Clear input
        input.value = '';
    }
    
    static saveExpenseCategory() {
        const input = document.getElementById('newExpenseCategory');
        if (!input) return;
        
        const categoryName = input.value.trim();
        
        if (!categoryName) {
            this.showToast('Please enter a category name', 'error');
            return;
        }
        
        // Check for duplicates (case-insensitive)
        const isDuplicate = this.expenseCategories.some(cat => 
            cat.toLowerCase() === categoryName.toLowerCase()
        );
        
        if (isDuplicate) {
            this.showToast(`Category "${categoryName}" already exists!`, 'error');
            input.focus();
            return;
        }
        
        // Add category to array
        this.expenseCategories.push(categoryName);
        this.saveExpenseCategories();
        
        // Add to dropdown
        this.addCategoryToDropdown('expenseCategory', categoryName);
        
        // Select the new category
        const dropdown = document.getElementById('expenseCategory');
        if (dropdown) {
            dropdown.value = categoryName;
        }
        
        // Hide input box
        const inputBox = document.getElementById('expenseCategoryInputBox');
        if (inputBox) {
            inputBox.style.display = 'none';
        }
        
        // Show success message
        this.showToast(`Category "${categoryName}" added successfully!`, 'success');
        
        // Clear input
        input.value = '';
    }
    
    static populateCategoryDropdowns() {
        // Populate purchase category dropdown
        const purchaseDropdown = document.getElementById('purchaseCategory');
        if (purchaseDropdown) {
            // Clear existing options except the first one
            const defaultOption = purchaseDropdown.options[0];
            purchaseDropdown.innerHTML = '';
            purchaseDropdown.appendChild(defaultOption);
            
            // Add all purchase categories
            this.purchaseCategories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                purchaseDropdown.appendChild(option);
            });
        }
        
        // Populate expense category dropdown
        const expenseDropdown = document.getElementById('expenseCategory');
        if (expenseDropdown) {
            // Clear existing options except the first one
            const defaultOption = expenseDropdown.options[0];
            expenseDropdown.innerHTML = '';
            expenseDropdown.appendChild(defaultOption);
            
            // Add all expense categories
            this.expenseCategories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                expenseDropdown.appendChild(option);
            });
        }
    }
    
    static addCategoryToDropdown(dropdownId, categoryName) {
        const dropdown = document.getElementById(dropdownId);
        if (dropdown) {
            // Check if category already exists in dropdown
            const existingOption = Array.from(dropdown.options).find(option => 
                option.value.toLowerCase() === categoryName.toLowerCase()
            );
            
            if (!existingOption) {
                const option = document.createElement('option');
                option.value = categoryName;
                option.textContent = categoryName;
                dropdown.appendChild(option);
            }
        }
    }
    
    static getPurchaseCategories() {
        return [...this.purchaseCategories];
    }
    
    static getExpenseCategories() {
        return [...this.expenseCategories];
    }
    
    static removePurchaseCategory(categoryName) {
        const index = this.purchaseCategories.findIndex(cat => cat === categoryName);
        if (index !== -1) {
            this.purchaseCategories.splice(index, 1);
            this.savePurchaseCategories();
            this.populateCategoryDropdowns();
            return true;
        }
        return false;
    }
    
    static removeExpenseCategory(categoryName) {
        const index = this.expenseCategories.findIndex(cat => cat === categoryName);
        if (index !== -1) {
            this.expenseCategories.splice(index, 1);
            this.saveExpenseCategories();
            this.populateCategoryDropdowns();
            return true;
        }
        return false;
    }
    
    static showToast(message, type = 'success') {
        // Use main app's toast if available
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
    
    // Category Management Modal Methods
    static openCategoryManager() {
        const modalContent = `
            <div class="category-manager">
                <div class="row">
                    <div class="col-md-6">
                        <h6>Purchase Categories</h6>
                        <div class="list-group mb-3" id="purchase-category-list">
                            ${this.purchaseCategories.map((cat, index) => `
                                <div class="list-group-item d-flex justify-content-between align-items-center">
                                    ${cat}
                                    <button class="btn btn-sm btn-outline-danger remove-category-btn" data-type="purchase" data-index="${index}">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                        <div class="input-group mb-3">
                            <input type="text" class="form-control" id="new-purchase-cat" placeholder="New purchase category">
                            <button class="btn btn-primary" onclick="CategoryManager.addPurchaseCategoryFromManager()">Add</button>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <h6>Expense Categories</h6>
                        <div class="list-group mb-3" id="expense-category-list">
                            ${this.expenseCategories.map((cat, index) => `
                                <div class="list-group-item d-flex justify-content-between align-items-center">
                                    ${cat}
                                    <button class="btn btn-sm btn-outline-danger remove-category-btn" data-type="expense" data-index="${index}">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                        <div class="input-group mb-3">
                            <input type="text" class="form-control" id="new-expense-cat" placeholder="New expense category">
                            <button class="btn btn-primary" onclick="CategoryManager.addExpenseCategoryFromManager()">Add</button>
                        </div>
                    </div>
                </div>
                <div class="mt-3">
                    <button class="btn btn-secondary" onclick="bootstrap.Modal.getInstance(document.querySelector('#categoryManagerModal')).hide()">Close</button>
                    <button class="btn btn-primary" onclick="CategoryManager.saveCategories()">Save Changes</button>
                </div>
            </div>
        `;
        
        this.showCategoryManagerModal('Category Management', modalContent);
    }
    
    static showCategoryManagerModal(title, content) {
        let modal = document.getElementById('categoryManagerModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'categoryManagerModal';
            modal.className = 'modal fade';
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
        
        // Add event listeners for remove buttons
        setTimeout(() => {
            document.querySelectorAll('.remove-category-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const type = e.target.closest('button').getAttribute('data-type');
                    const index = parseInt(e.target.closest('button').getAttribute('data-index'));
                    this.removeCategory(type, index);
                });
            });
        }, 100);
        
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }
    
    static addPurchaseCategoryFromManager() {
        const input = document.getElementById('new-purchase-cat');
        if (input && input.value.trim()) {
            const categoryName = input.value.trim();
            if (!this.purchaseCategories.includes(categoryName)) {
                this.purchaseCategories.push(categoryName);
                this.updateCategoryList('purchase');
                input.value = '';
            }
        }
    }
    
    static addExpenseCategoryFromManager() {
        const input = document.getElementById('new-expense-cat');
        if (input && input.value.trim()) {
            const categoryName = input.value.trim();
            if (!this.expenseCategories.includes(categoryName)) {
                this.expenseCategories.push(categoryName);
                this.updateCategoryList('expense');
                input.value = '';
            }
        }
    }
    
    static updateCategoryList(type) {
        if (type === 'purchase') {
            const listContainer = document.getElementById('purchase-category-list');
            if (listContainer) {
                listContainer.innerHTML = this.purchaseCategories.map((cat, index) => `
                    <div class="list-group-item d-flex justify-content-between align-items-center">
                        ${cat}
                        <button class="btn btn-sm btn-outline-danger remove-category-btn" data-type="purchase" data-index="${index}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `).join('');
            }
        } else {
            const listContainer = document.getElementById('expense-category-list');
            if (listContainer) {
                listContainer.innerHTML = this.expenseCategories.map((cat, index) => `
                    <div class="list-group-item d-flex justify-content-between align-items-center">
                        ${cat}
                        <button class="btn btn-sm btn-outline-danger remove-category-btn" data-type="expense" data-index="${index}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `).join('');
            }
        }
        
        // Reattach event listeners
        document.querySelectorAll('.remove-category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.target.closest('button').getAttribute('data-type');
                const index = parseInt(e.target.closest('button').getAttribute('data-index'));
                this.removeCategory(type, index);
            });
        });
    }
    
    static removeCategory(type, index) {
        if (type === 'purchase') {
            this.purchaseCategories.splice(index, 1);
            this.updateCategoryList('purchase');
        } else {
            this.expenseCategories.splice(index, 1);
            this.updateCategoryList('expense');
        }
    }
    
    static saveCategories() {
        this.savePurchaseCategories();
        this.saveExpenseCategories();
        this.populateCategoryDropdowns();
        this.showToast('Categories saved successfully!', 'success');
        bootstrap.Modal.getInstance(document.querySelector('#categoryManagerModal')).hide();
    }
}