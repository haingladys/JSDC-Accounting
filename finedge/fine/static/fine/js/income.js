// income.js
// Income Manager Class
class IncomeManager {
    constructor() {
        this.incomeData = this.loadIncomeData();
        this.currentEditingId = null;
        this.currentDate = new Date().toISOString().split('T')[0];
        this.init();
    }

    init() {
        this.initializeEventListeners();
        this.setupDateControls();
        this.updateAllDisplays();
    }

    // Enable or disable the Save button based on form validity
    updateSaveButtonState() {
        const form = document.getElementById('incomeForm');
        const saveBtn = document.getElementById('save-income-btn');
        if (!form || !saveBtn) return;
        try {
            saveBtn.disabled = !form.checkValidity();
        } catch (e) {
            const requiredFields = form.querySelectorAll('[required]');
            let allFilled = true;
            requiredFields.forEach(f => {
                if (!f.value || f.value.toString().trim() === '') allFilled = false;
            });
            saveBtn.disabled = !allFilled;
        }
    }

    // FIXED: Event Listeners
    initializeEventListeners() {
        // Add Income Button
        const addIncomeBtn = document.getElementById('add-income-btn');
        if (addIncomeBtn) {
            addIncomeBtn.addEventListener('click', () => {
                this.openAddIncomeModal();
            });
        }

        // Save Income Button
        const saveIncomeBtn = document.getElementById('save-income-btn');
        if (saveIncomeBtn) {
            saveIncomeBtn.addEventListener('click', () => {
                this.saveIncome();
            });
        }

        // Filter Button
        const filterBtn = document.getElementById('filter-btn');
        if (filterBtn) {
            filterBtn.addEventListener('click', () => {
                this.showFilterOptions();
            });
        }

        // Modal close events
        const modalEl = document.getElementById('addIncomeModal');
        if (modalEl) {
            modalEl.addEventListener('hidden.bs.modal', () => {
                this.resetForm();
            });
        }

        // Table action buttons (delegated)
        const incomeTableBody = document.getElementById('income-table-body');
        if (incomeTableBody) {
            incomeTableBody.addEventListener('click', (e) => {
                this.handleTableAction(e);
            });
        }

        // Form validation
        const form = document.getElementById('incomeForm');
        if (form) {
            form.addEventListener('input', (e) => {
                this.validateField(e.target);
                this.updateSaveButtonState();
            });
        }

        // Single date selector change event
        const dateSelector = document.getElementById('dateSelector');
        if (dateSelector) {
            dateSelector.addEventListener('change', () => {
                this.currentDate = dateSelector.value;
                this.updateAllDisplays();
            });
        }
    }

    setupDateControls() {
        // Set default date to today
        const today = new Date().toISOString().split('T')[0];
        const dateSelector = document.getElementById('dateSelector');
        if (dateSelector) {
            dateSelector.value = today;
            this.currentDate = today;
        }
    }

    // FIXED: Data Management
    loadIncomeData() {
        const saved = localStorage.getItem('incomeData');
        if (saved) {
            const parsedData = JSON.parse(saved);
            
            // Check if data is in old format (array) and convert to new format (object)
            if (Array.isArray(parsedData)) {
                console.log('Converting old data format to new date-based format...');
                return this.convertOldDataToNewFormat(parsedData);
            }
            
            return parsedData;
        }

        // Default sample data organized by date
        return {
            '2024-04-15': [
                {
                    id: '1',
                    date: '2024-04-15',
                    displayDate: '15-Apr-2024',
                    description: 'Dine-in Service',
                    paymentMethod: 'Credit Card',
                    amount: 4250,
                    status: 'Received',
                }
            ],
            '2024-04-14': [
                {
                    id: '2',
                    date: '2024-04-14',
                    displayDate: '14-Apr-2024',
                    description: 'Food Delivery Swiggy',
                    paymentMethod: 'UPI Payment',
                    amount: 1850,
                    status: 'Pending',
                }
            ],
            '2024-04-12': [
                {
                    id: '3',
                    date: '2024-04-12',
                    displayDate: '12-Apr-2024',
                    description: 'Corporate Catering',
                    paymentMethod: 'Bank Transfer',
                    amount: 35000,
                    status: 'Pending',
                }
            ],
            '2024-04-10': [
                {
                    id: '4',
                    date: '2024-04-10',
                    displayDate: '10-Apr-2024',
                    description: 'Takeaway Order',
                    paymentMethod: 'Cash',
                    amount: 1200,
                    status: 'Received',
                }
            ]
        };
    }

    // FIXED: Convert old array format to new date-based object format
    convertOldDataToNewFormat(oldDataArray) {
        const newData = {};
        
        oldDataArray.forEach(income => {
            const date = income.date;
            if (!newData[date]) {
                newData[date] = [];
            }
            newData[date].push(income);
        });
        
        // Save the converted data back to localStorage
        localStorage.setItem('incomeData', JSON.stringify(newData));
        console.log('Data conversion completed successfully!');
        
        return newData;
    }

    saveIncomeData() {
        localStorage.setItem('incomeData', JSON.stringify(this.incomeData));
    }

    // FIXED: Get income records for specific date
    getIncomeForDate(date) {
        if (!this.incomeData[date]) {
            this.incomeData[date] = [];
        }
        return this.incomeData[date];
    }

    // FIXED: Get all income records flattened for calculations
    getAllIncomeRecords() {
        const allRecords = [];
        for (const date in this.incomeData) {
            if (Array.isArray(this.incomeData[date])) {
                allRecords.push(...this.incomeData[date]);
            }
        }
        return allRecords;
    }

    // FIXED: Modal Functions
    openAddIncomeModal(income = null) {
        const modal = new bootstrap.Modal(document.getElementById('addIncomeModal'));
        const modalTitle = document.querySelector('#addIncomeModal .modal-title');
        
        // Set default date to current selected date
        const dateInput = document.querySelector('input[name="date"]');
        if (dateInput) {
            dateInput.value = this.currentDate;
        }
        
        if (income) {
            modalTitle.textContent = 'Edit Income Transaction';
            this.populateForm(income);
            this.currentEditingId = income.id;
        } else {
            modalTitle.textContent = 'Record New Income';
            this.currentEditingId = null;
        }
        
        // Update save button state (enable only when form valid)
        this.updateSaveButtonState();

        modal.show();
    }

    populateForm(income) {
        const form = document.getElementById('incomeForm');
        if (!form) return;
        
        form.querySelector('input[name="description"]').value = income.description || '';
        form.querySelector('input[name="date"]').value = income.date || '';
        form.querySelector('input[name="amount"]').value = income.amount || '';
        form.querySelector('select[name="paymentMode"]').value = income.paymentMethod || '';
        form.querySelector('select[name="status"]').value = income.status || '';
    }

    resetForm() {
        const form = document.getElementById('incomeForm');
        if (form) {
            form.reset();
            this.clearValidation();
            this.currentEditingId = null;
            
            // Reset modal title
            const modalTitle = document.querySelector('#addIncomeModal .modal-title');
            if (modalTitle) {
                modalTitle.textContent = 'Record New Income';
            }
            
            // Reset date to current selected date
            const dateInput = document.querySelector('input[name="date"]');
            if (dateInput) {
                dateInput.value = this.currentDate;
            }
        }
    }

    // FIXED: Form Handling
    validateField(field) {
        const value = field.value.trim();
        
        if (field.hasAttribute('required') && !value) {
            field.classList.add('is-invalid');
            return false;
        }
        
        if (field.type === 'number' && value && parseFloat(value) <= 0) {
            field.classList.add('is-invalid');
            return false;
        }
        
        field.classList.remove('is-invalid');
        return true;
    }

    clearValidation() {
        const form = document.getElementById('incomeForm');
        if (form) {
            const invalidFields = form.querySelectorAll('.is-invalid');
            invalidFields.forEach(field => field.classList.remove('is-invalid'));
        }
    }

    validateForm() {
        const form = document.getElementById('incomeForm');
        if (!form) return false;
        
        const fields = form.querySelectorAll('[required]');
        let isValid = true;

        fields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    }

    saveIncome() {
        if (!this.validateForm()) {
            this.showToast('Please fill all required fields correctly', 'error');
            return;
        }

        const form = document.getElementById('incomeForm');
        if (!form) return;
        
        const formData = new FormData(form);
        
        const incomeDate = formData.get('date');
        const incomeData = {
            id: this.currentEditingId || this.generateId(),
            date: incomeDate,
            displayDate: this.formatDisplayDate(incomeDate),
            description: formData.get('description'),
            paymentMethod: formData.get('paymentMode'),
            amount: parseFloat(formData.get('amount')) || 0,
            status: formData.get('status')
        };

        console.log('Saving income data:', incomeData);

        // Ensure date array exists
        if (!this.incomeData[incomeDate]) {
            this.incomeData[incomeDate] = [];
        }

        if (this.currentEditingId) {
            // Update existing - find and update in correct date array
            let found = false;
            for (const date in this.incomeData) {
                const index = this.incomeData[date].findIndex(item => item.id === this.currentEditingId);
                if (index !== -1) {
                    // Remove from old date if date changed
                    if (date !== incomeDate) {
                        this.incomeData[date].splice(index, 1);
                        this.incomeData[incomeDate].unshift(incomeData);
                    } else {
                        this.incomeData[date][index] = incomeData;
                    }
                    found = true;
                    break;
                }
            }
            if (found) {
                this.showToast('Income transaction updated successfully!');
            }
        } else {
            // Add new to current date array
            this.incomeData[incomeDate].unshift(incomeData);
            this.showToast('Income transaction added successfully!');
        }

        this.saveIncomeData();
        this.updateAllDisplays();
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('addIncomeModal'));
        if (modal) {
            modal.hide();
        }
    }

    // FIXED: Table Actions
    handleTableAction(event) {
        const actionBtn = event.target.closest('.table-action-btn');
        if (!actionBtn) return;

        const row = actionBtn.closest('tr');
        const incomeId = row.dataset.incomeId;
        
        // Find income record across all dates
        let income = null;
        let incomeDate = null;
        for (const date in this.incomeData) {
            const foundIncome = this.incomeData[date].find(item => item.id === incomeId);
            if (foundIncome) {
                income = foundIncome;
                incomeDate = date;
                break;
            }
        }

        if (!income) return;

        const actionType = actionBtn.classList[1]; // view, edit, or delete

        // Add active state
        actionBtn.classList.add('active');
        setTimeout(() => actionBtn.classList.remove('active'), 150);

        switch (actionType) {
            case 'view':
                this.viewIncome(income);
                break;
            case 'edit':
                this.editIncome(income);
                break;
            case 'delete':
                this.deleteIncome(income, incomeDate);
                break;
        }
    }

    viewIncome(income) {
        const modalContent = `
            <div class="income-details">
                <div class="row mb-3">
                    <div class="col-6"><strong>Date:</strong></div>
                    <div class="col-6">${income.displayDate}</div>
                </div>
                <div class="row mb-3">
                    <div class="col-6"><strong>Description:</strong></div>
                    <div class="col-6">${income.description}</div>
                </div>
                <div class="row mb-3">
                    <div class="col-6"><strong>Payment Method:</strong></div>
                    <div class="col-6">${income.paymentMethod}</div>
                </div>
                <div class="row mb-3">
                    <div class="col-6"><strong>Amount:</strong></div>
                    <div class="col-6"><strong>₹${income.amount.toLocaleString()}</strong></div>
                </div>
                <div class="row mb-3">
                    <div class="col-6"><strong>Status:</strong></div>
                    <div class="col-6"><span class="status-badge status-${income.status.toLowerCase()}">${income.status}</span></div>
                </div>
            </div>
        `;

        this.showCustomModal('Income Details', modalContent);
    }

    editIncome(income) {
        this.openAddIncomeModal(income);
    }

    deleteIncome(income, incomeDate) {
        if (confirm(`Are you sure you want to delete "${income.description}"?`)) {
            this.incomeData[incomeDate] = this.incomeData[incomeDate].filter(item => item.id !== income.id);
            
            // Remove empty date arrays
            if (this.incomeData[incomeDate].length === 0) {
                delete this.incomeData[incomeDate];
            }
            
            this.saveIncomeData();
            this.updateAllDisplays();
            this.showToast('Income transaction deleted successfully!');
        }
    }

    // FIXED: UI Updates
    updateAllDisplays() {
        this.updateIncomeCards();
        this.renderIncomeTable();
    }

    // FIXED: Get data for current selected date
    getCurrentDateData() {
        return this.getIncomeForDate(this.currentDate);
    }

    updateIncomeCards() {
        const allRecords = this.getAllIncomeRecords();
        const currentDateRecords = this.getCurrentDateData();
        const selectedDate = new Date(this.currentDate);
        
        // Calculate current period totals
        const currentTotal = allRecords.reduce((sum, item) => sum + (item.amount || 0), 0);
        const currentDaily = currentDateRecords.reduce((sum, item) => sum + (item.amount || 0), 0);
        const currentWeekly = this.calculateWeeklyIncome(selectedDate);
        const currentMonthly = this.calculateMonthlyIncome(selectedDate);
        
        // Calculate previous period totals for comparison
        const previousTotal = 0; // Total doesn't have a previous period comparison
        const previousDaily = this.calculatePreviousDailyIncome(selectedDate);
        const previousWeekly = this.calculatePreviousWeeklyIncome(selectedDate);
        const previousMonthly = this.calculatePreviousMonthlyIncome(selectedDate);

        // Update card values
        const totalIncomeEl = document.getElementById('total-income');
        const dailyIncomeEl = document.getElementById('daily-income');
        const weeklyIncomeEl = document.getElementById('weekly-income');
        const monthlyIncomeEl = document.getElementById('monthly-income');
        
        if (totalIncomeEl) totalIncomeEl.textContent = `₹${currentTotal.toLocaleString()}`;
        if (dailyIncomeEl) dailyIncomeEl.textContent = `₹${currentDaily.toLocaleString()}`;
        if (weeklyIncomeEl) weeklyIncomeEl.textContent = `₹${currentWeekly.toLocaleString()}`;
        if (monthlyIncomeEl) monthlyIncomeEl.textContent = `₹${currentMonthly.toLocaleString()}`;

        // Update trend indicators
        this.updateTrendIndicator('total-income', currentTotal, previousTotal, 'from overall');
        this.updateTrendIndicator('daily-income', currentDaily, previousDaily, 'from yesterday');
        this.updateTrendIndicator('weekly-income', currentWeekly, previousWeekly, 'from last week');
        this.updateTrendIndicator('monthly-income', currentMonthly, previousMonthly, 'from last month');
    }

    calculateWeeklyIncome(selectedDate) {
        const startOfWeek = new Date(selectedDate);
        startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        
        return this.getAllIncomeRecords()
            .filter(item => {
                const itemDate = new Date(item.date);
                return itemDate >= startOfWeek && itemDate <= endOfWeek;
            })
            .reduce((sum, item) => sum + (item.amount || 0), 0);
    }

    calculateMonthlyIncome(selectedDate) {
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth();
        
        return this.getAllIncomeRecords()
            .filter(item => {
                const itemDate = new Date(item.date);
                return itemDate.getFullYear() === year && itemDate.getMonth() === month;
            })
            .reduce((sum, item) => sum + (item.amount || 0), 0);
    }

    calculatePreviousDailyIncome(selectedDate) {
        const yesterday = new Date(selectedDate);
        yesterday.setDate(selectedDate.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        return this.getIncomeForDate(yesterdayStr).reduce((sum, item) => sum + (item.amount || 0), 0);
    }

    calculatePreviousWeeklyIncome(selectedDate) {
        const prevWeekStart = new Date(selectedDate);
        prevWeekStart.setDate(selectedDate.getDate() - selectedDate.getDay() - 7);
        const prevWeekEnd = new Date(prevWeekStart);
        prevWeekEnd.setDate(prevWeekStart.getDate() + 6);
        
        return this.getAllIncomeRecords()
            .filter(item => {
                const itemDate = new Date(item.date);
                return itemDate >= prevWeekStart && itemDate <= prevWeekEnd;
            })
            .reduce((sum, item) => sum + (item.amount || 0), 0);
    }

    calculatePreviousMonthlyIncome(selectedDate) {
        const prevMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1);
        const nextMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        
        return this.getAllIncomeRecords()
            .filter(item => {
                const itemDate = new Date(item.date);
                return itemDate >= prevMonth && itemDate < nextMonth;
            })
            .reduce((sum, item) => sum + (item.amount || 0), 0);
    }

    updateTrendIndicator(cardId, currentValue, previousValue, text) {
        const card = document.getElementById(cardId)?.closest('.income-summary-card');
        if (!card) return;
        
        const trendIndicator = card.querySelector('.trend-indicator');
        const trendText = card.querySelector('.trend-text');
        
        let trendPercentage = 0;
        if (previousValue > 0) {
            trendPercentage = ((currentValue - previousValue) / previousValue) * 100;
        } else if (currentValue > 0 && previousValue === 0) {
            trendPercentage = 100; // New income
        }

        if (trendIndicator) {
            if (trendPercentage > 0) {
                trendIndicator.className = 'trend-indicator trend-up';
                trendIndicator.innerHTML = `<i class="fas fa-arrow-up me-1"></i>${Math.abs(trendPercentage).toFixed(1)}%`;
            } else if (trendPercentage < 0) {
                trendIndicator.className = 'trend-indicator trend-down';
                trendIndicator.innerHTML = `<i class="fas fa-arrow-down me-1"></i>${Math.abs(trendPercentage).toFixed(1)}%`;
            } else {
                trendIndicator.className = 'trend-indicator trend-neutral';
                trendIndicator.innerHTML = `<i class="fas fa-minus me-1"></i>0%`;
            }
        }
        
        if (trendText) {
            trendText.textContent = text;
        }
    }

    renderIncomeTable() {
        const tbody = document.getElementById('income-table-body');
        if (!tbody) return;
        
        const currentDateData = this.getCurrentDateData();
        
        // Clear the table body
        tbody.innerHTML = '';

        console.log('Rendering table for date:', this.currentDate, 'Data:', currentDateData);

        // Create and append rows for current date data
        currentDateData.forEach(income => {
            const row = this.createTableRow(income);
            tbody.appendChild(row);
        });

        // Show message if no data
        if (currentDateData.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `
                <td colspan="6" class="text-center py-4 text-muted">
                    <i class="fas fa-inbox fa-2x mb-2"></i>
                    <p>No income transactions found for ${this.formatDisplayDate(this.currentDate)}</p>
                    <small class="text-muted">Click "Add Income" to create your first transaction for this date</small>
                </td>
            `;
            tbody.appendChild(emptyRow);
        }
    }

    createTableRow(income) {
        const row = document.createElement('tr');
        row.dataset.incomeId = income.id;
        const paymentIconClass = this.getPaymentIconClass(income.paymentMethod);

        row.innerHTML = `
            <td>
                <div class="date-cell">${income.displayDate}</div>
            </td>
            <td>
                <div class="description-cell" title="${income.description}">
                    ${income.description}
                </div>
            </td>
            <td>
                <div class="payment-method-cell">
                    <div class="payment-icon-sm ${paymentIconClass}">
                        <i class="${this.getPaymentIcon(income.paymentMethod)}"></i>
                    </div>
                    <span>${income.paymentMethod}</span>
                </div>
            </td>
            <td>
                <div class="amount-cell amount-positive">₹${(income.amount || 0).toLocaleString()}</div>
            </td>
            <td>
                <span class="status-badge status-${income.status.toLowerCase()}">${income.status}</span>
            </td>
            <td>
                <div class="table-actions">
                    <button class="table-action-btn view" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="table-action-btn edit" title="Edit Transaction">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="table-action-btn delete" title="Delete Transaction">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;

        return row;
    }

    getPaymentIconClass(paymentMethod) {
        const icons = {
            'Credit Card': 'card',
            'UPI Payment': 'upi',
            'Bank Transfer': 'bank',
            'Cash': 'cash',
            'Bank Cheque': 'bank',
            'Swiggy': 'digital',
            'Zomato': 'digital'
        };
        return icons[paymentMethod] || 'card';
    }

    getPaymentIcon(paymentMethod) {
        const icons = {
            'Credit Card': 'fas fa-credit-card',
            'UPI Payment': 'fas fa-mobile-alt',
            'Bank Transfer': 'fas fa-university',
            'Cash': 'fas fa-money-bill-wave',
            'Bank Cheque': 'fas fa-university',
            'Swiggy': 'fas fa-shopping-bag',
            'Zomato': 'fas fa-utensils'
        };
        return icons[paymentMethod] || 'fas fa-credit-card';
    }

    // FIXED: Utility Functions
    generateId() {
        return Date.now().toString() + Math.random().toString(36).substr(2, 9);
    }

    formatDisplayDate(dateString) {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return 'Invalid Date';
            }
            const options = { day: '2-digit', month: 'short', year: 'numeric' };
            return date.toLocaleDateString('en-IN', options);
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Invalid Date';
        }
    }

    showFilterOptions() {
        const allRecords = this.getAllIncomeRecords();
        const categories = [...new Set(allRecords.map(item => item.category))];
        const statuses = [...new Set(allRecords.map(item => item.status))];
        
        const filterHtml = `
            <div class="row">
                <div class="col-md-6">
                    <h6>Filter by Category</h6>
                    ${categories.map(cat => 
                        `<div class="form-check">
                            <input class="form-check-input" type="checkbox" value="${cat}" id="filter-cat-${cat}">
                            <label class="form-check-label" for="filter-cat-${cat}">
                                ${cat}
                            </label>
                        </div>`
                    ).join('')}
                </div>
                <div class="col-md-6">
                    <h6>Filter by Status</h6>
                    ${statuses.map(status => 
                        `<div class="form-check">
                            <input class="form-check-input" type="checkbox" value="${status}" id="filter-status-${status}">
                            <label class="form-check-label" for="filter-status-${status}">
                                ${status}
                            </label>
                        </div>`
                    ).join('')}
                </div>
            </div>
            <div class="mt-3">
                <button class="btn btn-primary btn-sm" onclick="window.jsdcApp.incomeManager.applyFilters()">Apply Filters</button>
                <button class="btn btn-outline-secondary btn-sm" onclick="window.jsdcApp.incomeManager.clearFilters()">Clear</button>
            </div>
        `;

        this.showCustomModal('Filter Income', filterHtml);
    }

    applyFilters() {
        const checkedCategories = Array.from(document.querySelectorAll('.form-check-input:checked'))
            .filter(checkbox => checkbox.id.startsWith('filter-cat-'))
            .map(checkbox => checkbox.value);
            
        const checkedStatuses = Array.from(document.querySelectorAll('.form-check-input:checked'))
            .filter(checkbox => checkbox.id.startsWith('filter-status-'))
            .map(checkbox => checkbox.value);
        
        let filteredData = this.getCurrentDateData();
        
        if (checkedCategories.length > 0) {
            filteredData = filteredData.filter(item => 
                checkedCategories.includes(item.category)
            );
        }
        
        if (checkedStatuses.length > 0) {
            filteredData = filteredData.filter(item => 
                checkedStatuses.includes(item.status)
            );
        }
        
        this.renderFilteredTable(filteredData);
        const modal = document.querySelector('.custom-modal');
        if (modal) {
            bootstrap.Modal.getInstance(modal).hide();
        }
    }

    clearFilters() {
        this.renderIncomeTable();
        const modal = document.querySelector('.custom-modal');
        if (modal) {
            bootstrap.Modal.getInstance(modal).hide();
        }
    }

    renderFilteredTable(data) {
        const tbody = document.getElementById('income-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = '';

        data.forEach(income => {
            const row = this.createTableRow(income);
            tbody.appendChild(row);
        });

        if (data.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `
                <td colspan="6" class="text-center py-4 text-muted">
                    <i class="fas fa-search fa-2x mb-2"></i>
                    <p>No matching transactions found for ${this.formatDisplayDate(this.currentDate)}</p>
                </td>
            `;
            tbody.appendChild(emptyRow);
        }
    }

    showCustomModal(title, content) {
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

    showToast(message, type = 'success') {
        const toastElement = document.getElementById('successToast');
        const toastBody = toastElement?.querySelector('.toast-body');
        
        if (toastElement && toastBody) {
            // Update message and style based on type
            toastBody.innerHTML = `
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-triangle'} me-2"></i>
                <span>${message}</span>
            `;
            
            if (type === 'error') {
                toastElement.classList.remove('bg-success');
                toastElement.classList.add('bg-danger');
            } else {
                toastElement.classList.remove('bg-danger');
                toastElement.classList.add('bg-success');
            }

            const toast = new bootstrap.Toast(toastElement);
            toast.show();
        }
    }

    // FIXED: Debug method to check data
    debugData() {
        console.log('Current income data:', this.incomeData);
        console.log('All records:', this.getAllIncomeRecords());
        console.log('Current date data:', this.getCurrentDateData());
    }
}