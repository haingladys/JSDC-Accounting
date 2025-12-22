// expenses.js
class ExpenseManager {
    static initialize() {
        console.log('Initializing expense system');
        
        // Load data
        this.loadExpenseData();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Render table
        this.renderExpenses();
        
        console.log('Expense System Initialized');
    }
    
    static loadExpenseData() {
        const savedData = localStorage.getItem('expensesData');
        if (savedData) {
            window.jsdcApp.AppState.expenses = JSON.parse(savedData);
        } else {
            // Load sample expense data
            window.jsdcApp.AppState.expenses = [
                {
                    id: 1,
                    date: new Date().toISOString().split('T')[0],
                    category: 'ELECTRICITY',
                    description: 'Monthly Bill',
                    unitPrice: 2500,
                    quantity: 1,
                    unit: 'pcs',
                    total: 2500,
                    paymentMethod: 'Bank Transfer'
                },
                {
                    id: 2,
                    date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // yesterday
                    category: 'PETROL & DIESEL',
                    description: 'Vehicle Fuel',
                    unitPrice: 1200,
                    quantity: 1,
                    unit: 'pcs',
                    total: 1200,
                    paymentMethod: 'Cash'
                }
            ];
        }
    }
    
    static saveExpenseData() {
        localStorage.setItem('expensesData', JSON.stringify(window.jsdcApp.AppState.expenses));
    }
    
    static setupEventListeners() {
        const addExpenseBtn = document.getElementById('addExpenseBtn');
        const saveExpenseBtn = document.getElementById('saveExpenseBtn');
        const exportExpensesBtn = document.getElementById('exportExpensesBtn');
        const filterExpensesBtn = document.getElementById('filterExpensesBtn');

        if (addExpenseBtn) {
            addExpenseBtn.addEventListener('click', () => {
                this.resetExpenseForm();
                new bootstrap.Modal(document.getElementById('addExpenseModalDetailed')).show();
            });
        }

        if (saveExpenseBtn) {
            saveExpenseBtn.addEventListener('click', () => {
                if (document.getElementById('expenseFormDetailed').checkValidity()) {
                    this.saveExpense();
                } else {
                    document.getElementById('expenseFormDetailed').reportValidity();
                }
            });
        }

        if (exportExpensesBtn) {
            exportExpensesBtn.addEventListener('click', () => {
                this.exportExpenses();
            });
        }

        if (filterExpensesBtn) {
            filterExpensesBtn.addEventListener('click', () => {
                this.showFilterOptions();
            });
        }
        
        // Total calculation listeners
        this.setupTotalCalculation();
    }
    
    static setupTotalCalculation() {
        const expenseUnitPrice = document.getElementById('expenseUnitPrice');
        const expenseQuantity = document.getElementById('expenseQuantity');

        if (expenseUnitPrice && expenseQuantity) {
            const calculateExpenseTotal = () => {
                const price = parseFloat(expenseUnitPrice.value) || 0;
                const qty = parseFloat(expenseQuantity.value) || 0;
                console.log('Expense Total:', (price * qty).toFixed(2));
            };
            expenseUnitPrice.addEventListener('input', calculateExpenseTotal);
            expenseQuantity.addEventListener('input', calculateExpenseTotal);
        }
    }
    
    static saveExpense() {
        const expenseData = {
            date: document.getElementById('expenseDate').value,
            category: document.getElementById('expenseCategory').value,
            unitPrice: parseFloat(document.getElementById('expenseUnitPrice').value),
            quantity: parseInt(document.getElementById('expenseQuantity').value),
            unit: document.getElementById('expenseUnit').value,
            paymentMethod: document.getElementById('expensePaymentMethod') ? document.getElementById('expensePaymentMethod').value : 'Cash',
            description: document.getElementById('expenseDescription').value
        };
        
        // Calculate total
        expenseData.total = expenseData.unitPrice * expenseData.quantity;
        
        if (window.jsdcApp.AppState.editingExpenseId) {
            // Update existing expense
            const index = window.jsdcApp.AppState.expenses.findIndex(exp => exp.id === window.jsdcApp.AppState.editingExpenseId);
            if (index !== -1) {
                expenseData.id = window.jsdcApp.AppState.editingExpenseId;
                window.jsdcApp.AppState.expenses[index] = expenseData;
                window.jsdcApp.showToast(`✓ Expense updated successfully! Total: ₹${expenseData.total.toLocaleString()}`);
            }
            window.jsdcApp.AppState.editingExpenseId = null;
        } else {
            // Add new expense
            expenseData.id = Date.now();
            window.jsdcApp.AppState.expenses.push(expenseData);
            window.jsdcApp.showToast(`✓ Expense saved successfully! Category: ${expenseData.category} | Total: ₹${expenseData.total.toLocaleString()}`);
        }
        
        // Close modal and refresh table
        const modal = bootstrap.Modal.getInstance(document.getElementById('addExpenseModalDetailed'));
        modal.hide();
        
        this.renderExpenses();
        this.resetExpenseForm();
        this.saveExpenseData();
    }
    
    static renderExpenses() {
        const tbody = document.getElementById('expensesTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (window.jsdcApp.AppState.expenses.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4">No expenses recorded yet</td></tr>';
            return;
        }
        
        window.jsdcApp.AppState.expenses.forEach(expense => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${window.jsdcApp.formatDate(expense.date)}</td>
                <td>${expense.category}</td>
                <td>${expense.description || ''}</td>
                <td>₹${expense.unitPrice.toLocaleString()}</td>
                <td>${expense.quantity} ${expense.unit}</td>
                <td>₹${expense.total.toLocaleString()}</td>
                <td>${expense.paymentMethod}</td>
                <td>
                    <button class="btn btn-sm btn-outline-warning edit-expense" data-id="${expense.id}">Edit</button>
                    <button class="btn btn-sm btn-outline-danger delete-expense" data-id="${expense.id}">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        // Add event listeners for edit and delete buttons
        document.querySelectorAll('.edit-expense').forEach(btn => {
            btn.addEventListener('click', () => {
                const expenseId = parseInt(btn.getAttribute('data-id'));
                this.editExpense(expenseId);
            });
        });
        
        document.querySelectorAll('.delete-expense').forEach(btn => {
            btn.addEventListener('click', () => {
                const expenseId = parseInt(btn.getAttribute('data-id'));
                this.deleteExpense(expenseId);
            });
        });
    }
    
    static editExpense(id) {
        const expense = window.jsdcApp.AppState.expenses.find(exp => exp.id === id);
        if (expense) {
            // Fill the form with expense data
            document.getElementById('expenseDate').value = expense.date;
            document.getElementById('expenseCategory').value = expense.category;
            document.getElementById('expenseUnitPrice').value = expense.unitPrice;
            document.getElementById('expenseQuantity').value = expense.quantity;
            document.getElementById('expenseUnit').value = expense.unit;
            document.getElementById('expensePaymentMethod').value = expense.paymentMethod;
            document.getElementById('expenseDescription').value = expense.description || '';
            
            // Set editing state
            window.jsdcApp.AppState.editingExpenseId = id;
            
            // Show the modal
            new bootstrap.Modal(document.getElementById('addExpenseModalDetailed')).show();
        }
    }
    
    static deleteExpense(id) {
        if (confirm('Are you sure you want to delete this expense?')) {
            window.jsdcApp.AppState.expenses = window.jsdcApp.AppState.expenses.filter(exp => exp.id !== id);
            this.renderExpenses();
            this.saveExpenseData();
            window.jsdcApp.showToast('Expense deleted successfully');
        }
    }
    
    static resetExpenseForm() {
        const form = document.getElementById('expenseFormDetailed');
        if (form) {
            form.reset();
            window.jsdcApp.AppState.editingExpenseId = null;
            // Set default date to today
            document.getElementById('expenseDate').valueAsDate = new Date();
        }
    }
    
    static exportExpenses() {
        const data = window.jsdcApp.AppState.expenses;
        let csvContent = "data:text/csv;charset=utf-8,";
        
        // Add headers
        csvContent += "Date,Category,Description,Unit Price,Quantity,Unit,Total,Payment Method\n";
        
        // Add rows
        data.forEach(expense => {
            const row = [
                expense.date,
                expense.category,
                expense.description || '',
                expense.unitPrice,
                expense.quantity,
                expense.unit,
                expense.total,
                expense.paymentMethod
            ].join(",");
            csvContent += row + "\n";
        });
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `expenses_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        window.jsdcApp.showToast('Expenses exported to CSV successfully!', 'success');
    }
    
    static showFilterOptions() {
        const categories = [...new Set(window.jsdcApp.AppState.expenses.map(e => e.category))];
        const paymentMethods = [...new Set(window.jsdcApp.AppState.expenses.map(e => e.paymentMethod))];
        
        const filterHtml = `
            <div class="row g-3">
                <div class="col-md-6">
                    <label class="form-label">Category</label>
                    <select class="form-select" id="filter-expense-category">
                        <option value="">All Categories</option>
                        ${categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                    </select>
                </div>
                <div class="col-md-6">
                    <label class="form-label">Payment Method</label>
                    <select class="form-select" id="filter-payment-method">
                        <option value="">All Methods</option>
                        ${paymentMethods.map(method => `<option value="${method}">${method}</option>`).join('')}
                    </select>
                </div>
                <div class="col-md-6">
                    <label class="form-label">Date Range</label>
                    <input type="date" class="form-control" id="filter-expense-date">
                </div>
                <div class="col-md-6">
                    <label class="form-label">Min Amount</label>
                    <input type="number" class="form-control" id="filter-min-amount" placeholder="Min amount">
                </div>
            </div>
            <div class="mt-3">
                <button class="btn btn-primary btn-sm" onclick="ExpenseManager.applyFilters()">Apply Filters</button>
                <button class="btn btn-outline-secondary btn-sm" onclick="ExpenseManager.clearFilters()">Clear</button>
            </div>
        `;
        
        this.showCustomModal('Filter Expenses', filterHtml);
    }
    
    static showCustomModal(title, content) {
        let modal = document.querySelector('.custom-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'modal fade custom-modal';
            modal.innerHTML = `
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title"></h5>
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
    
    static applyFilters() {
        const category = document.getElementById('filter-expense-category')?.value;
        const paymentMethod = document.getElementById('filter-payment-method')?.value;
        const date = document.getElementById('filter-expense-date')?.value;
        const minAmount = document.getElementById('filter-min-amount')?.value;
        
        let filteredData = [...window.jsdcApp.AppState.expenses];
        
        if (category) {
            filteredData = filteredData.filter(e => e.category === category);
        }
        
        if (paymentMethod) {
            filteredData = filteredData.filter(e => e.paymentMethod === paymentMethod);
        }
        
        if (date) {
            filteredData = filteredData.filter(e => e.date === date);
        }
        
        if (minAmount) {
            filteredData = filteredData.filter(e => e.total >= parseFloat(minAmount));
        }
        
        this.renderFilteredTable(filteredData);
        bootstrap.Modal.getInstance(document.querySelector('.custom-modal')).hide();
    }
    
    static renderFilteredTable(data) {
        const tbody = document.getElementById('expensesTableBody');
        tbody.innerHTML = '';
        
        data.forEach(expense => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${window.jsdcApp.formatDate(expense.date)}</td>
                <td>${expense.category}</td>
                <td>${expense.description || ''}</td>
                <td>₹${expense.unitPrice.toLocaleString()}</td>
                <td>${expense.quantity} ${expense.unit}</td>
                <td>₹${expense.total.toLocaleString()}</td>
                <td>${expense.paymentMethod}</td>
                <td>
                    <button class="btn btn-sm btn-outline-warning edit-expense" data-id="${expense.id}">Edit</button>
                    <button class="btn btn-sm btn-outline-danger delete-expense" data-id="${expense.id}">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4">No matching expenses found</td></tr>';
        }
    }
    
    static clearFilters() {
        this.renderExpenses();
        bootstrap.Modal.getInstance(document.querySelector('.custom-modal')).hide();
    }
}

function editExpense(id, date, cat, price, qty, unit, pay, desc) {
    document.getElementById('modalTitle').innerText = "Edit Expense Record";
    document.getElementById('modal_expense_id').value = id;
    document.getElementById('modal_date').value = date;
    document.getElementById('modal_category').value = cat;
    document.getElementById('modal_price').value = price;
    document.getElementById('modal_qty').value = qty;
    document.getElementById('modal_unit').value = unit;
    document.getElementById('modal_payment').value = pay;
    document.getElementById('modal_desc').value = desc;
}

function resetForm() {
    document.getElementById('modalTitle').innerText = "Record New Expense";
    document.getElementById('modal_expense_id').value = "";
    document.getElementById('modal_date').value = "{{ today_date }}";
    document.getElementById('modal_price').value = "";
    document.getElementById('modal_qty').value = "";
    document.getElementById('modal_desc').value = "";
}
