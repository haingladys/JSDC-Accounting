// payroll.js - Updated to display worked days in table
console.log('=== PAYROLL.JS LOADING ===');
console.log('Document readyState:', document.readyState);

document.addEventListener("DOMContentLoaded", function () {
    console.log('payroll.js DOMContentLoaded fired');
    'use strict';
    
    class PayrollManager {
        constructor(app) {
            this.app = app;
            this.payrollEmployees = [];
            
            // Get selected period from URL or use current month
            const urlParams = new URLSearchParams(window.location.search);
            const periodParam = urlParams.get('period');
            
            if (periodParam) {
                const [year, month] = periodParam.split('-').map(Number);
                this.currentYear = year;
                this.currentMonth = month;
            } else {
                // Default to current month
                const now = new Date();
                this.currentMonth = now.getMonth() + 1;
                this.currentYear = now.getFullYear();
            }
            
            this.isProcessing = false;
            console.log('PayrollManager initialized with:', {
                currentMonth: this.currentMonth,
                currentYear: this.currentYear
            });
            this.init();
        }
        
        init() {
            console.log('Initializing PayrollManager...');
            this.initializePayrollSystem();
            this.setupPayrollEventListeners();
            
            // Show loading state immediately
            this.showLoadingState();
            
            // Load from Django
            this.loadPayrollFromDjango();
        }

        initializePayrollSystem() {
            console.log('Initializing payroll system...');
            this.updateCurrentPeriodDisplay();
        }

        showLoadingState() {
            const tableBody = document.getElementById('employee-table-body');
            if (tableBody) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="9" class="text-center py-4">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                            <p class="mt-2 text-muted">Loading payroll data...</p>
                        </td>
                    </tr>`;
            }
        }

        setupPayrollEventListeners() {
            console.log('Setting up event listeners...');
    
            // Add Employee Button
            const addEmployeeBtn = document.getElementById('add-employee-btn');
            if (addEmployeeBtn) {
                addEmployeeBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const modalElement = document.getElementById('addEmployeeModal');
                    if (modalElement) {
                        const employeeForm = document.getElementById('employeeForm');
                        if (employeeForm) employeeForm.reset();
                        
                        const today = new Date().toISOString().split('T')[0];
                        const dateInput = document.getElementById('salary-date');
                        if (dateInput) dateInput.value = today;
                        
                        // Set default month and year
                        const monthInput = document.getElementById('employee-month');
                        const yearInput = document.getElementById('employee-year');
                        if (monthInput) monthInput.value = this.currentMonth;
                        if (yearInput) yearInput.value = this.currentYear;
                        
                        // Reset payment split
                        document.getElementById('payment-split-type').value = 'full_cash';
                        
                        // Reset incentives
                        document.getElementById('spr-amount').value = '0';
                        
                        this.toggleSplitPaymentDetails('add');
                        this.calculatePaymentAmounts('add');
                        
                        const modal = new bootstrap.Modal(modalElement, {
                            backdrop: 'static',
                            keyboard: true
                        });
                        modal.show();
                    }
                });
            }
            
            // Payment split type change for Add modal
            const paymentSplitType = document.getElementById('payment-split-type');
            if (paymentSplitType) {
                paymentSplitType.addEventListener('change', () => {
                    this.toggleSplitPaymentDetails('add');
                    this.calculatePaymentAmounts('add');
                });
            }
            
            // Payment split type change for Edit modal
            const editPaymentSplitType = document.getElementById('edit-payment-split-type');
            if (editPaymentSplitType) {
                editPaymentSplitType.addEventListener('change', () => {
                    this.toggleSplitPaymentDetails('edit');
                    this.calculatePaymentAmounts('edit');
                });
            }
            
            // Percentage inputs for Add modal
            ['cash-percentage', 'employee-basic-salary', 'spr-amount'].forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    element.addEventListener('input', () => {
                        this.calculatePaymentAmounts('add');
                        this.syncPercentages('add');
                    });
                }
            });
            
            // Percentage inputs for Edit modal
            ['edit-cash-percentage', 'edit-employee-basic-salary', 'edit-spr-amount'].forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    element.addEventListener('input', () => {
                        this.calculatePaymentAmounts('edit');
                        this.syncPercentages('edit');
                    });
                }
            });
            
            // Save Employee Button
            const saveEmployeeBtn = document.getElementById('save-employee-btn');
            if (saveEmployeeBtn) {
                saveEmployeeBtn.addEventListener('click', () => this.saveEmployeeToDjango());
                console.log('Save employee button listener added');
            }
            
            // Update Employee Button
            const updateEmployeeBtn = document.getElementById('update-employee-btn');
            if (updateEmployeeBtn) {
                updateEmployeeBtn.addEventListener('click', () => this.updateEmployee());
                console.log('Update employee button listener added');
            }
            
            // Period dropdown changes
            this.setupPeriodDropdownListener();
            
            console.log('All event listeners setup complete');
        }

        setupPeriodDropdownListener() {
            const dropdownItems = document.querySelectorAll('.period-dropdown .dropdown-item');
            dropdownItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const href = item.getAttribute('href');
                    if (href && href.includes('period=')) {
                        const period = href.split('period=')[1];
                        if (period) {
                            const [year, month] = period.split('-').map(Number);
                            this.currentYear = year;
                            this.currentMonth = month;
                            this.loadPayrollFromDjango();
                            this.updateCurrentPeriodDisplay();
                        }
                    }
                });
            });
        }

        toggleSplitPaymentDetails(formType = 'add') {
            const prefix = formType === 'add' ? '' : 'edit-';
            const splitType = document.getElementById(`${prefix}payment-split-type`).value;
            const detailsDiv = document.getElementById(`${prefix}split-payment-details`);
            const alertDiv = document.getElementById(`${prefix}percentage-alert`);
            
            if (splitType === 'split') {
                if (detailsDiv) detailsDiv.style.display = 'block';
                if (alertDiv) alertDiv.style.display = 'block';
            } else {
                if (detailsDiv) detailsDiv.style.display = 'none';
                if (alertDiv) alertDiv.style.display = 'none';
            }
        }

        calculatePaymentAmounts(formType = 'add') {
            const prefix = formType === 'add' ? '' : 'edit-';
            const basicSalary = parseFloat(document.getElementById(`${prefix}employee-basic-salary`)?.value) || 0;
            const sprAmount = parseFloat(document.getElementById(`${prefix}spr-amount`)?.value) || 0;
            const netSalary = basicSalary + sprAmount;
            
            const splitType = document.getElementById(`${prefix}payment-split-type`)?.value || 'full_cash';
            const cashPercent = parseFloat(document.getElementById(`${prefix}cash-percentage`)?.value) || 0;
            const bankPercent = parseFloat(document.getElementById(`${prefix}bank-percentage`)?.value) || 0;
            
            let cashAmount = 0;
            let bankAmount = 0;
            
            if (splitType === 'full_cash') {
                cashAmount = netSalary;
                bankAmount = 0;
            } else if (splitType === 'full_bank') {
                cashAmount = 0;
                bankAmount = netSalary;
            } else if (splitType === 'split') {
                const totalPercent = cashPercent + bankPercent;
                const alertDiv = document.getElementById(`${prefix}percentage-alert`);
                
                if (alertDiv) {
                    if (totalPercent !== 100) {
                        alertDiv.className = 'alert alert-warning mt-2 py-1';
                        alertDiv.innerHTML = 
                            `<small><i class="fas fa-exclamation-triangle me-1"></i> Total is ${totalPercent}%. Must be 100%</small>`;
                    } else {
                        alertDiv.className = 'alert alert-success mt-2 py-1';
                        alertDiv.innerHTML = 
                            `<small><i class="fas fa-check-circle me-1"></i> Total is 100%</small>`;
                    }
                }
                
                cashAmount = (netSalary * cashPercent) / 100;
                bankAmount = (netSalary * bankPercent) / 100;
            }
            
            const cashPreview = document.getElementById(`${prefix}cash-amount-preview`);
            const bankPreview = document.getElementById(`${prefix}bank-amount-preview`);
            
            if (cashPreview) cashPreview.value = this.formatCurrency(cashAmount);
            if (bankPreview) bankPreview.value = this.formatCurrency(bankAmount);
        }

        syncPercentages(formType = 'add') {
            const prefix = formType === 'add' ? '' : 'edit-';
            const splitType = document.getElementById(`${prefix}payment-split-type`)?.value || 'full_cash';
            
            if (splitType === 'split') {
                const cashPercent = parseFloat(document.getElementById(`${prefix}cash-percentage`)?.value) || 0;
                const bankPercent = 100 - cashPercent;
                const bankPercentageInput = document.getElementById(`${prefix}bank-percentage`);
                if (bankPercentageInput) bankPercentageInput.value = bankPercent.toFixed(2);
            }
        }

        saveEmployeeToDjango() {
            if (this.isProcessing) {
                console.log('Save already in progress');
                return;
            }
            
            this.isProcessing = true;
            
            const saveBtn = document.getElementById('save-employee-btn');
            const originalText = saveBtn.innerHTML;
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            
            try {
                const name = document.getElementById('employee-name')?.value.trim();
                const basicSalary = parseFloat(document.getElementById('employee-basic-salary')?.value || 0);
                const sprAmount = parseFloat(document.getElementById('spr-amount')?.value || 0);
                const salaryDate = document.getElementById('salary-date')?.value;
                const paymentSplitType = document.getElementById('payment-split-type')?.value;
                const cashPercentage = parseFloat(document.getElementById('cash-percentage')?.value || 0);
                const bankPercentage = parseFloat(document.getElementById('bank-percentage')?.value || 0);
                
                console.log('Form data for save:', { 
                    name, basicSalary, sprAmount, salaryDate, 
                    paymentSplitType, cashPercentage, bankPercentage,
                    month: this.currentMonth,
                    year: this.currentYear
                });
                
                if (!name || !basicSalary || !salaryDate) {
                    this.app.showToast('Please fill all required fields', 'error');
                    this.isProcessing = false;
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = originalText;
                    return;
                }
                
                if (paymentSplitType === 'split') {
                    const totalPercent = cashPercentage + bankPercentage;
                    if (Math.abs(totalPercent - 100) > 0.01) {
                        this.app.showToast('Payment percentages must total 100%', 'error');
                        this.isProcessing = false;
                        saveBtn.disabled = false;
                        saveBtn.innerHTML = originalText;
                        return;
                    }
                }
                
                const payrollData = {
                    employee_name: name,
                    basic_pay: basicSalary,
                    spr_amount: sprAmount,
                    salary_date: salaryDate,
                    month: this.currentMonth,
                    year: this.currentYear,
                    payment_split_type: paymentSplitType,
                    cash_percentage: cashPercentage,
                    bank_transfer_percentage: bankPercentage
                };
                
                console.log('Sending data to server:', payrollData);
                
                fetch('/save-payroll/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': this.app.getCSRFToken()
                    },
                    body: JSON.stringify(payrollData)
                })
                .then(response => {
                    console.log('Response status:', response.status);
                    if (!response.ok) {
                        return response.json().catch(() => {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        });
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Server response:', data);
                    if (data.success) {
                        this.app.showToast(`Payroll for "${name}" saved successfully`, 'success');
                        
                        // Close modal
                        const modalElement = document.getElementById('addEmployeeModal');
                        if (modalElement) {
                            const modal = bootstrap.Modal.getInstance(modalElement);
                            if (modal) modal.hide();
                        }
                        
                        // Reset form
                        const employeeForm = document.getElementById('employeeForm');
                        if (employeeForm) employeeForm.reset();
                        
                        // Reload data from server
                        this.loadPayrollFromDjango();
                        
                    } else {
                        console.error('Server returned error:', data);
                        this.app.showToast('Error: ' + data.message, 'error');
                    }
                })
                .catch(error => {
                    console.error('Error saving employee:', error);
                    this.app.showToast('Error saving payroll. Please try again.', 'error');
                })
                .finally(() => {
                    this.isProcessing = false;
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = originalText;
                });
                
            } catch (error) {
                console.error('Error in saveEmployeeToDjango:', error);
                this.app.showToast('Error: ' + error.message, 'error');
                this.isProcessing = false;
                saveBtn.disabled = false;
                saveBtn.innerHTML = originalText;
            }
        }
        
        loadPayrollFromDjango() {
            console.log('Loading payroll data from:', `/get-payroll-data/?month=${this.currentMonth}&year=${this.currentYear}`);
            
            fetch(`/get-payroll-data/?month=${this.currentMonth}&year=${this.currentYear}`)
                .then(response => {
                    console.log('API Response status:', response.status);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(response => {
                    console.log('Full API Response:', response);
                    
                    if (response.success) {
                        console.log('API Data received:', response.data);
                        
                                            // Inside loadPayrollFromDjango() method, update the mapping section:
                    this.payrollEmployees = response.data.map(item => {
                        return {
                            id: item.id.toString(),
                            name: item.employee_name,
                            basicSalary: parseFloat(item.basic_pay) || 0,
                            sprAmount: parseFloat(item.spr_amount) || 0,
                            netSalary: parseFloat(item.net_salary) || 0,
                            paymentSplitType: item.payment_split_type,
                            cashAmount: parseFloat(item.cash_amount) || 0,
                            bankTransferAmount: parseFloat(item.bank_transfer_amount) || 0,
                            salaryDate: item.salary_date,
                            isPaid: item.is_paid,
                            expensesCreated: item.expenses_created,
                            workedDays: parseFloat(item.worked_days) || 0,  // Add this line
                            month: this.currentMonth,
                            year: this.currentYear
                        };
                    });
                        
                        console.log('Mapped employees:', this.payrollEmployees);
                        this.updateEmployeeTable();
                        this.updatePayrollStats(response.summary);
                    } else {
                        this.app.showToast('Error loading payroll data: ' + (response.message || 'Unknown error'), 'error');
                        this.showEmptyTable();
                    }
                })
                .catch(error => {
                    console.error('Error loading payroll:', error);
                    this.app.showToast('Error loading payroll data: ' + error.message, 'error');
                    this.showEmptyTable();
                });
        }
        
        showEmptyTable() {
            const tableBody = document.getElementById('employee-table-body');
            if (tableBody) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="9" class="text-center text-muted py-4">
                            No payroll records found
                        </td>
                    </tr>`;
            }
        }
        
        updateEmployee() {
            if (this.isProcessing) {
                console.log('Update already in progress');
                return;
            }
            
            this.isProcessing = true;
            
            const updateBtn = document.getElementById('update-employee-btn');
            const originalText = updateBtn.innerHTML;
            updateBtn.disabled = true;
            updateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
            
            try {
                const employeeId = document.getElementById('edit-employee-id')?.value;
                const name = document.getElementById('edit-employee-name')?.value.trim();
                const basicSalary = parseFloat(document.getElementById('edit-employee-basic-salary')?.value || 0);
                const sprAmount = parseFloat(document.getElementById('edit-spr-amount')?.value || 0);
                const salaryDate = document.getElementById('edit-salary-date')?.value;
                const paymentSplitType = document.getElementById('edit-payment-split-type')?.value;
                const cashPercentage = parseFloat(document.getElementById('edit-cash-percentage')?.value || 0);
                const bankPercentage = parseFloat(document.getElementById('edit-bank-percentage')?.value || 0);
                
                console.log('Form data for update:', { 
                    employeeId, name, basicSalary, sprAmount, salaryDate, 
                    paymentSplitType, cashPercentage, bankPercentage,
                    month: this.currentMonth,
                    year: this.currentYear
                });
                
                if (!employeeId || !name || !basicSalary || !salaryDate) {
                    this.app.showToast('Please fill all required fields', 'error');
                    this.isProcessing = false;
                    updateBtn.disabled = false;
                    updateBtn.innerHTML = originalText;
                    return;
                }
                
                if (paymentSplitType === 'split') {
                    const totalPercent = cashPercentage + bankPercentage;
                    if (Math.abs(totalPercent - 100) > 0.01) {
                        this.app.showToast('Payment percentages must total 100%', 'error');
                        this.isProcessing = false;
                        updateBtn.disabled = false;
                        updateBtn.innerHTML = originalText;
                        return;
                    }
                }
                
                const updateData = {
                    id: employeeId,
                    employee_name: name,
                    basic_pay: basicSalary,
                    spr_amount: sprAmount,
                    salary_date: salaryDate,
                    payment_split_type: paymentSplitType,
                    cash_percentage: cashPercentage,
                    bank_transfer_percentage: bankPercentage,
                    month: this.currentMonth,
                    year: this.currentYear
                };
                
                console.log('Sending update data:', updateData);
                
                fetch('/save-payroll/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': this.app.getCSRFToken()
                    },
                    body: JSON.stringify(updateData)
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        this.app.showToast('Payroll updated successfully', 'success');
                        
                        const modalElement = document.getElementById('editEmployeeModal');
                        if (modalElement) {
                            const modal = bootstrap.Modal.getInstance(modalElement);
                            if (modal) modal.hide();
                        }
                        
                        this.loadPayrollFromDjango();
                    } else {
                        this.app.showToast('Error: ' + data.message, 'error');
                    }
                })
                .catch(error => {
                    console.error('Error updating employee:', error);
                    this.app.showToast('Error updating payroll: ' + error.message, 'error');
                })
                .finally(() => {
                    this.isProcessing = false;
                    updateBtn.disabled = false;
                    updateBtn.innerHTML = originalText;
                });
                
            } catch (error) {
                console.error('Error in updateEmployee:', error);
                this.app.showToast('Error: ' + error.message, 'error');
                this.isProcessing = false;
                if (updateBtn) {
                    updateBtn.disabled = false;
                    updateBtn.innerHTML = originalText;
                }
            }
        }

        editEmployee(employeeId) {
            console.log('Editing employee with ID:', employeeId);
            const employee = this.payrollEmployees.find(emp => emp.id === employeeId);
            if (employee) {
                console.log('Found employee:', employee);
                
                // Calculate percentages from amounts for display
                const netSalary = Number(employee.netSalary) || 0;
                let cashPercentage = 0;
                let bankPercentage = 0;
                
                if (netSalary > 0) {
                    cashPercentage = Math.round((Number(employee.cashAmount) / netSalary) * 100);
                    bankPercentage = Math.round((Number(employee.bankTransferAmount) / netSalary) * 100);
                }
                
                const setValue = (id, value) => {
                    const element = document.getElementById(id);
                    if (element) element.value = value;
                };
                
                setValue('edit-employee-id', employee.id);
                setValue('edit-employee-name', employee.name);
                setValue('edit-employee-basic-salary', employee.basicSalary);
                setValue('edit-spr-amount', employee.sprAmount);
                setValue('edit-salary-date', employee.salaryDate);
                setValue('edit-payment-split-type', employee.paymentSplitType);
                setValue('edit-cash-percentage', cashPercentage);
                setValue('edit-bank-percentage', bankPercentage);
                
                // Calculate and display amounts
                this.toggleSplitPaymentDetails('edit');
                this.calculatePaymentAmounts('edit');
                
                const modalElement = document.getElementById('editEmployeeModal');
                if (modalElement) {
                    try {
                        const modal = new bootstrap.Modal(modalElement);
                        modal.show();
                        console.log('Edit modal shown');
                    } catch (error) {
                        console.error('Error showing edit modal:', error);
                    }
                } else {
                    console.error('Edit Employee Modal not found!');
                }
            } else {
                console.error('Employee not found with ID:', employeeId);
            }
        }

        formatSalaryDate(dateStr) {
            if (!dateStr) return '-';

            try {
                const date = new Date(dateStr);
                const day = date.getDate().toString().padStart(2, '0');
                const month = date.toLocaleString('en-US', { month: 'short' });
                const year = date.getFullYear();
                return `${day}-${month}-${year}`;
            } catch (e) {
                return dateStr;
            }
        }

        formatCurrency(amount) {
            return `₹${Math.abs(amount).toLocaleString('en-IN', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            })}`;
        }

        formatCurrencyWithDecimal(amount) {
            return `₹${Math.abs(amount).toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}`;
        }

        updateEmployeeTable() {
    const tableBody = document.getElementById('employee-table-body');
    if (!tableBody) {
        console.error('Table body not found!');
        return;
    }
    
    tableBody.innerHTML = '';

    if (!this.payrollEmployees || this.payrollEmployees.length === 0) {
        this.showEmptyTable();
        return;
    }

    this.payrollEmployees.forEach(employee => {
        // Format the salary date
        const formattedDate = this.formatSalaryDate(employee.salaryDate);
        
        // Get payment split type
        const splitType = employee.paymentSplitType || 'full_cash';
        
        // Get amounts
        const netSalary = Number(employee.netSalary) || 0;
        const cashAmount = Number(employee.cashAmount) || 0;
        const bankAmount = Number(employee.bankTransferAmount) || 0;
        
        // Get worked days (added to the employee object in loadPayrollFromDjango)
        const workedDays = Number(employee.workedDays) || 0;
        
        // Calculate percentages from amounts
        let cashPercentage = 0;
        let bankPercentage = 0;
        
        if (netSalary > 0) {
            cashPercentage = Math.round((cashAmount / netSalary) * 100);
            bankPercentage = Math.round((bankAmount / netSalary) * 100);
        }
        
        // Format display for cash and bank columns - single line
        let cashDisplay = '';
        let bankDisplay = '';
        
        const formatAmountWithPercentage = (amount, percentage, isEmphasized = false) => {
            const formattedAmount = this.formatCurrency(amount);
            const percentageText = percentage > 0 ? `(${percentage}%)` : '(0%)';
            const emphasisClass = isEmphasized ? 'fw-medium' : '';
            
            return `
                <div class="d-flex flex-column align-items-end ${emphasisClass}">
                    <div class="amount-value">${formattedAmount}</div>
                    <div class="percentage-text small text-muted">${percentageText}</div>
                </div>
            `;
        };
        
        // Determine emphasis based on split type
        if (splitType === 'full_cash') {
            cashDisplay = formatAmountWithPercentage(cashAmount, 100, true);
            bankDisplay = formatAmountWithPercentage(bankAmount, 0, false);
        } else if (splitType === 'full_bank') {
            cashDisplay = formatAmountWithPercentage(cashAmount, 0, false);
            bankDisplay = formatAmountWithPercentage(bankAmount, 100, true);
        } else if (splitType === 'split') {
            cashDisplay = formatAmountWithPercentage(cashAmount, cashPercentage, cashAmount > 0);
            bankDisplay = formatAmountWithPercentage(bankAmount, bankPercentage, bankAmount > 0);
        }
        
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${employee.name}</td>
            <td class="text-center">
                <div class="worked-days-display">
                    ${workedDays.toFixed(1)}
                </div>
            </td>
            <td class="text-end">${this.formatCurrency(Number(employee.basicSalary))}</td>
            <td class="text-end">${this.formatCurrency(Number(employee.sprAmount))}</td>
            <td class="text-end fw-bold">${this.formatCurrency(netSalary)}</td>
            <td class="text-end align-middle">${cashDisplay}</td>
            <td class="text-end align-middle">${bankDisplay}</td>
            <td class="align-middle">${formattedDate}</td>
            <td class="text-center align-middle">
                <button class="btn btn-sm btn-outline-primary edit-employee-btn" data-id="${employee.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger delete-employee-btn" data-id="${employee.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;

        tableBody.appendChild(row);
    });
    
    // Add event listeners to the new buttons
    this.addPayrollTableEventListeners();
}

        updatePayrollStats(summaryData) {
            console.log('Updating payroll stats with:', summaryData);
            
            if (!summaryData) {
                console.warn('No summary data provided');
                return;
            }
            
            // Use the summary data from the API response
            const formatCurrency = (amount) => {
                return `₹${Math.abs(amount).toLocaleString('en-IN', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                })}`;
            };
            
            // Update the summary cards
            this.setTextContent('total-salary', formatCurrency(summaryData.total_basic_pay || 0));
            this.setTextContent('total-spr', formatCurrency(summaryData.total_spr || 0));
            this.setTextContent('total-net', formatCurrency(summaryData.total_net_payable || 0));
            
            console.log('Stats updated:', {
                total_salary: summaryData.total_basic_pay,
                total_spr: summaryData.total_spr,
                total_net: summaryData.total_net_payable
            });
        }

        addPayrollTableEventListeners() {
            const tableBody = document.getElementById('employee-table-body');
            if (!tableBody) {
                console.warn('Table body not found for event listeners');
                return;
            }
            
            // Remove existing listeners first
            const newTableBody = tableBody.cloneNode(true);
            tableBody.parentNode.replaceChild(newTableBody, tableBody);
            
            newTableBody.addEventListener('click', (e) => {
                const target = e.target;
                const button = target.closest('button');
                
                if (!button) return;
                
                if (button.classList.contains('edit-employee-btn')) {
                    const employeeId = button.getAttribute('data-id');
                    console.log('Edit button clicked for ID:', employeeId);
                    this.editEmployee(employeeId);
                    e.preventDefault();
                    e.stopPropagation();
                } else if (button.classList.contains('delete-employee-btn')) {
                    const row = button.closest('tr');
                    const employeeName = row.querySelector('td:first-child').textContent.trim();
                    console.log('Delete button clicked for:', employeeName);
                    this.deletePayroll(button.getAttribute('data-id'), employeeName);
                    e.preventDefault();
                    e.stopPropagation();
                }
            });
        }

        restorePayroll(payrollId, employeeName) {
            if (confirm(`Are you sure you want to restore payroll record for "${employeeName}"?`)) {
                fetch('/restore-payroll/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': this.app.getCSRFToken()
                    },
                    body: JSON.stringify({ id: payrollId })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        this.app.showToast('Payroll record restored successfully', 'success');
                        this.loadPayrollFromDjango();
                    } else {
                        this.app.showToast('Error: ' + data.message, 'error');
                    }
                })
                .catch(error => {
                    console.error('Error restoring payroll:', error);
                    this.app.showToast('Failed to restore payroll record', 'error');
                });
            }
        }
        
        deletePayroll(payrollId, employeeName) {
            console.log('Deleting payroll for:', employeeName, 'ID:', payrollId);
            
            if (confirm(`Are you sure you want to delete payroll record for "${employeeName}"? This will also delete related expenses.`)) {
                // Find the row by the data-id attribute on the delete button
                const deleteButton = document.querySelector(`button.delete-employee-btn[data-id="${payrollId}"]`);
                const row = deleteButton ? deleteButton.closest('tr') : null;
                
                if (row) {
                    row.style.opacity = '0.5';
                    row.style.backgroundColor = '#fff5f5';
                }
                
                fetch('/delete-payroll/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': this.app.getCSRFToken()
                    },
                    body: JSON.stringify({ id: payrollId })
                })
                .then(response => response.json())
                .then(data => {
                    console.log('Delete response:', data);
                    if (data.success) {
                        if (row) {
                            row.style.transition = 'all 0.3s ease';
                            row.style.opacity = '0';
                            row.style.height = '0';
                            row.style.padding = '0';
                            row.style.margin = '0';
                            row.style.overflow = 'hidden';
                            row.style.border = 'none';
                            
                            setTimeout(() => {
                                row.remove();
                                // Remove from payrollEmployees array
                                this.payrollEmployees = this.payrollEmployees.filter(
                                    emp => emp.id !== payrollId.toString()
                                );
                                // Reload data to update stats
                                this.loadPayrollFromDjango();
                            }, 300);
                        }
                        
                        this.app.showToast(data.message, 'success');
                    } else {
                        this.app.showToast('Error: ' + data.message, 'error');
                        if (row) {
                            row.style.opacity = '1';
                            row.style.backgroundColor = '';
                        }
                    }
                })
                .catch(error => {
                    console.error('Error deleting payroll:', error);
                    this.app.showToast('Failed to delete payroll record', 'error');
                    if (row) {
                        row.style.opacity = '1';
                        row.style.backgroundColor = '';
                    }
                });
            }
        }

        updateCurrentPeriodDisplay() {
            const periodEl = document.querySelector('.period-display');
            if (periodEl) {
                const monthYear = `${this.getMonthName(this.currentMonth)} ${this.currentYear}`;
                periodEl.textContent = monthYear;
                console.log('Updated period display:', monthYear);
            } else {
                console.warn('Period display element not found');
            }
        }

        getMonthName(monthNumber) {
            const months = [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
            ];
            return months[monthNumber - 1] || 'Unknown';
        }

        setTextContent(id, text) {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = text;
            } else {
                console.warn(`Element with id "${id}" not found`);
            }
        }
    }
    
    // Make PayrollManager available globally
    window.PayrollManager = PayrollManager;
    
    // Create a minimal app object with required methods
    const app = {
        getCSRFToken: function() {
            // Try to get CSRF token from cookie
            const name = 'csrftoken';
            let cookieValue = null;
            if (document.cookie && document.cookie !== '') {
                const cookies = document.cookie.split(';');
                for (let i = 0; i < cookies.length; i++) {
                    const cookie = cookies[i].trim();
                    if (cookie.substring(0, name.length + 1) === (name + '=')) {
                        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                        break;
                    }
                }
            }
            
            // If not found in cookie, try meta tag
            if (!cookieValue) {
                const csrfMeta = document.querySelector('meta[name="csrf-token"]');
                if (csrfMeta) {
                    cookieValue = csrfMeta.getAttribute('content');
                }
            }
            
            // If still not found, try hidden input
            if (!cookieValue) {
                const csrfInput = document.querySelector('[name="csrfmiddlewaretoken"]');
                if (csrfInput) {
                    cookieValue = csrfInput.value;
                }
            }
            
            return cookieValue;
        },
        showToast: function(message, type = 'info') {
            console.log(`${type.toUpperCase()}: ${message}`);
            
            // Try to use Bootstrap toast if available
            if (typeof bootstrap !== 'undefined' && bootstrap.Toast) {
                const toastId = 'toast-' + Date.now();
                const toastHtml = `
                    <div id="${toastId}" class="toast align-items-center text-bg-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'primary'} border-0" role="alert" aria-live="assertive" aria-atomic="true">
                        <div class="d-flex">
                            <div class="toast-body">
                                ${message}
                            </div>
                            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                        </div>
                    </div>
                `;
                
                let toastContainer = document.querySelector('.toast-container');
                if (!toastContainer) {
                    toastContainer = document.createElement('div');
                    toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
                    document.body.appendChild(toastContainer);
                }
                
                toastContainer.innerHTML += toastHtml;
                const toastEl = document.getElementById(toastId);
                const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
                toast.show();
                
                // Remove toast after it's hidden
                toastEl.addEventListener('hidden.bs.toast', function () {
                    toastEl.remove();
                });
            } else {
                // Fallback to alert
                alert(`${type.toUpperCase()}: ${message}`);
            }
        }
    };
    
    // Initialize PayrollManager when DOM is fully loaded
    window.addEventListener('load', function() {
        console.log('Page fully loaded, initializing PayrollManager...');
        
        try {
            window.payrollManager = new PayrollManager(app);
            console.log('PayrollManager initialized successfully');
        } catch (error) {
            console.error('Failed to initialize PayrollManager:', error);
            
            // Fallback: Direct modal handling
            const addBtn = document.getElementById('add-employee-btn');
            if (addBtn) {
                addBtn.addEventListener('click', function() {
                    console.log('Fallback: Direct add button click');
                    const modal = document.getElementById('addEmployeeModal');
                    if (modal) {
                        const bsModal = new bootstrap.Modal(modal);
                        bsModal.show();
                        
                        // Set default date
                        const today = new Date().toISOString().split('T')[0];
                        const dateInput = modal.querySelector('#salary-date');
                        if (dateInput) dateInput.value = today;
                    }
                });
            }
        }
    });
});

console.log('=== PAYROLL.JS LOADED ===');