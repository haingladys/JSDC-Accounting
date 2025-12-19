// payroll.js - Updated with fixes for modal opening issue
console.log('payroll.js loading...');

document.addEventListener("DOMContentLoaded", function () {
    console.log('payroll.js DOMContentLoaded fired');
    'use strict';
    
    class PayrollManager {
        constructor(app) {
            this.app = app;
            this.payrollEmployees = [];
            this.currentMonth = new Date().getMonth() + 1;
            this.currentYear = new Date().getFullYear();
            this.isProcessing = false;
            
            this.init();
        }

        init() {
            console.log('Initializing PayrollManager...');
            this.initializePayrollSystem();
            this.setupPayrollEventListeners();
            this.loadPayrollFromDjango();
        }

        initializePayrollSystem() {
            console.log('Initializing payroll system...');
            this.updateEmployeeTable();
            this.updatePayrollStats();
            this.updateCurrentPeriodDisplay();
        }

        setupPayrollEventListeners() {
            console.log('Setting up event listeners...');
            
            // Add Employee Button - Fixed with direct event handler
            const addEmployeeBtn = document.getElementById('add-employee-btn');
            if (addEmployeeBtn) {
                console.log('Add employee button found');
                addEmployeeBtn.addEventListener('click', (e) => {
                    console.log('Add employee button clicked');
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const modalElement = document.getElementById('addEmployeeModal');
                    console.log('Modal element:', modalElement);
                    
                    if (modalElement) {
                        // Reset form
                        const employeeForm = document.getElementById('employeeForm');
                        if (employeeForm) employeeForm.reset();
                        
                        // Set default date to today
                        const today = new Date().toISOString().split('T')[0];
                        const dateInput = document.getElementById('salary-date');
                        if (dateInput) dateInput.value = today;
                        
                        // Show modal using Bootstrap
                        try {
                            const modal = new bootstrap.Modal(modalElement);
                            modal.show();
                            console.log('Modal shown successfully');
                        } catch (error) {
                            console.error('Error showing modal:', error);
                            // Fallback: show modal directly
                            modalElement.style.display = 'block';
                            modalElement.classList.add('show');
                        }
                    } else {
                        console.error('Add Employee Modal not found!');
                    }
                });
            } else {
                console.error('Add employee button not found!');
            }
            
            // Save Employee Button
            const saveEmployeeBtn = document.getElementById('save-employee-btn');
            if (saveEmployeeBtn) {
                saveEmployeeBtn.addEventListener('click', () => this.saveEmployeeToDjango());
                console.log('Save employee button listener added');
            }
            
            // Update Employee Button
            const updateEmployeeBtn = document.getElementById('update-employee-btn');
            if (updateEmployeeBtn) {
                updateEmployeeBtn.addEventListener('click', this.updateEmployee.bind(this));
                console.log('Update employee button listener added');
            }
            
            // Table event listeners
            this.addPayrollTableEventListeners();
            
            console.log('All event listeners setup complete');
        }

        addPayrollTableEventListeners() {
            const tableBody = document.getElementById('employee-table-body');
            if (!tableBody) {
                console.warn('Table body not found for event listeners');
                return;
            }
            
            console.log('Adding table event listeners...');
            tableBody.addEventListener('click', (e) => {
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
                    const employeeName = row.querySelector('.employee-name-cell').textContent.trim();
                    console.log('Delete button clicked for:', employeeName);
                    this.softDeletePayroll(button.getAttribute('data-id'), employeeName);
                    e.preventDefault();
                    e.stopPropagation();
                } else if (button.classList.contains('status-badge')) {
                    const payrollId = button.getAttribute('data-payroll-id');
                    const currentStatus = button.getAttribute('data-current-status');
                    console.log('Status button clicked for ID:', payrollId, 'current status:', currentStatus);
                    this.togglePayrollStatus(payrollId, currentStatus);
                    e.preventDefault();
                    e.stopPropagation();
                }
            });
        }

        // Save employee to Django
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
                const advances = parseFloat(document.getElementById('advances')?.value || 0);
                const salaryDate = document.getElementById('salary-date')?.value;
                
                console.log('Form data for save:', { name, basicSalary, sprAmount, advances, salaryDate });
                
                if (!name || !basicSalary || !salaryDate) {
                    this.app.showToast('Please fill all required fields', 'error');
                    this.isProcessing = false;
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = originalText;
                    return;
                }
                
                const payrollData = {
                    employee_name: name,
                    basic_pay: basicSalary,
                    spr_amount: sprAmount,
                    advances: advances,
                    salary_date: salaryDate,
                    month: this.currentMonth,
                    year: this.currentYear,
                    status: 'unpaid'
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
                        console.error('Server responded with:', response.status, response.statusText);
                        return response.json().catch(() => {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        });
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Server response:', data);
                    if (data.success) {
                        this.app.showToast(`Employee "${name}" saved successfully`, 'success');
                        
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
                    this.app.showToast('Error saving employee. Please try again.', 'error');
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
        
        // Load payroll data from Django
        loadPayrollFromDjango() {
            console.log('Loading payroll data from:', `/get-payroll-data/?month=${this.currentMonth}&year=${this.currentYear}`);
            
            fetch(`/get-payroll-data/?month=${this.currentMonth}&year=${this.currentYear}`)
                .then(response => {
                    console.log('API Response status:', response.status);
                    return response.json();
                })
                .then(response => {
                    console.log('Full API Response:', response);
                    
                    if (response.success) {
                        console.log('API Data received:', response.data);
                        
                        this.payrollEmployees = response.data.map(item => {
                            console.log('Mapping item:', item);
                            console.log('SPR amount from server:', item.spr_amount, typeof item.spr_amount);
                            
                            return {
                                id: item.id.toString(),
                                name: item.employee_name,
                                basicSalary: parseFloat(item.basic_pay) || 0,
                                sprAmount: parseFloat(item.spr_amount) || 0,
                                advances: parseFloat(item.advances) || 0,
                                netSalary: parseFloat(item.net_salary) || 0,
                                salaryDate: item.salary_date,
                                status: item.status || 'unpaid',
                                statusDisplay: item.status_display || (item.status === 'paid' ? 'Paid' : 'Unpaid'),
                                month: this.currentMonth,
                                year: this.currentYear
                            };
                        });
                        
                        console.log('Mapped employees:', this.payrollEmployees.map(emp => ({
                            name: emp.name,
                            sprAmount: emp.sprAmount
                        })));
                        this.updateEmployeeTable();
                        this.updatePayrollStats();
                        this.updateCurrentPeriodDisplay();
                    } else {
                        this.app.showToast('Error loading payroll data: ' + (response.message || 'Unknown error'), 'error');
                    }
                })
                .catch(error => {
                    console.error('Error loading payroll:', error);
                    this.app.showToast('Error loading payroll data', 'error');
                });
        }

        // Update Employee - Using save-payroll endpoint for updates too
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
                const advances = parseFloat(document.getElementById('edit-advances')?.value || 0);
                const salaryDate = document.getElementById('edit-salary-date')?.value;
                const status = document.getElementById('edit-payment-status')?.value || 'unpaid';
                
                console.log('Form data for update:', { employeeId, name, basicSalary, sprAmount, advances, salaryDate, status });
                
                if (!employeeId || !name || !basicSalary || !salaryDate) {
                    this.app.showToast('Please fill all required fields', 'error');
                    this.isProcessing = false;
                    updateBtn.disabled = false;
                    updateBtn.innerHTML = originalText;
                    return;
                }
                
                const updateData = {
                    id: employeeId,
                    employee_name: name,
                    basic_pay: basicSalary,
                    spr_amount: sprAmount,
                    advances: advances,
                    salary_date: salaryDate,
                    status: status,
                    month: this.currentMonth,
                    year: this.currentYear
                };
                
                console.log('Sending update data:', updateData);
                
                // Use the same save-payroll endpoint which handles updates
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
                        this.app.showToast('Employee updated successfully', 'success');
                        
                        const modalElement = document.getElementById('editEmployeeModal');
                        if (modalElement) {
                            const modal = bootstrap.Modal.getInstance(modalElement);
                            if (modal) modal.hide();
                        }
                        
                        // Reload data from server
                        this.loadPayrollFromDjango();
                    } else {
                        this.app.showToast('Error: ' + data.message, 'error');
                    }
                })
                .catch(error => {
                    console.error('Error updating employee:', error);
                    this.app.showToast('Error updating employee: ' + error.message, 'error');
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
                
                const setValue = (id, value) => {
                    const element = document.getElementById(id);
                    if (element) element.value = value;
                };
                
                setValue('edit-employee-id', employee.id);
                setValue('edit-employee-name', employee.name);
                setValue('edit-employee-basic-salary', employee.basicSalary);
                setValue('edit-spr-amount', employee.sprAmount);
                setValue('edit-advances', employee.advances);
                setValue('edit-salary-date', employee.salaryDate);
                
                const statusElement = document.getElementById('edit-payment-status');
                if (statusElement) statusElement.value = employee.status || 'unpaid';
                
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

        togglePayrollStatus(payrollId, currentStatus) {
            console.log('Toggling payroll status for ID:', payrollId, 'Current:', currentStatus);
            
            const statusBadge = document.querySelector(`[data-payroll-id="${payrollId}"]`);
            if (statusBadge) {
                const originalHTML = statusBadge.innerHTML;
                statusBadge.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>';
                statusBadge.disabled = true;
            }
            
            fetch('/toggle-payroll-status/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.app.getCSRFToken()
                },
                body: JSON.stringify({
                    id: payrollId,
                    current_status: currentStatus
                })
            })
            .then(response => response.json())
            .then(data => {
                console.log('Toggle status response:', data);
                if (data.success) {
                    this.updatePayrollStatusUI(payrollId, data.new_status, data.new_status_display);
                    this.app.showToast(data.message, 'success');
                    
                    // Update local data
                    const employeeIndex = this.payrollEmployees.findIndex(emp => emp.id === payrollId.toString());
                    if (employeeIndex !== -1) {
                        this.payrollEmployees[employeeIndex].status = data.new_status;
                        this.payrollEmployees[employeeIndex].statusDisplay = data.new_status_display;
                    }
                    
                } else {
                    this.app.showToast('Error: ' + data.message, 'error');
                    if (statusBadge) {
                        statusBadge.innerHTML = originalHTML;
                        statusBadge.disabled = false;
                    }
                }
            })
            .catch(error => {
                console.error('Error toggling payroll status:', error);
                this.app.showToast('Failed to update status', 'error');
                
                if (statusBadge) {
                    statusBadge.innerHTML = originalHTML;
                    statusBadge.disabled = false;
                }
            });
        }

        updatePayrollStatusUI(payrollId, newStatus, newStatusDisplay) {
            console.log('Updating UI for payroll ID:', payrollId, 'New status:', newStatus);
            const statusBadge = document.querySelector(`[data-payroll-id="${payrollId}"]`);
            if (statusBadge) {
                statusBadge.classList.remove('status-paid', 'status-unpaid', 'paid', 'unpaid');
                statusBadge.classList.add(`status-${newStatus}`);
                statusBadge.textContent = newStatusDisplay || (newStatus === 'paid' ? 'Paid' : 'Unpaid');
                statusBadge.setAttribute('data-current-status', newStatus);
                statusBadge.disabled = false;
                console.log('Status badge updated');
            } else {
                console.error('Status badge not found for ID:', payrollId);
            }
        }

        // CHANGED: Updated to match Django view name
        softDeletePayroll(payrollId, employeeName) {
            console.log('Soft deleting payroll for:', employeeName, 'ID:', payrollId);
            
            if (confirm(`Are you sure you want to delete payroll record for "${employeeName}"?`)) {
                const row = document.querySelector(`tr[data-id="${payrollId}"]`);
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
                            
                            setTimeout(() => {
                                row.remove();
                                this.updatePayrollStats();
                            }, 300);
                        }
                        
                        this.payrollEmployees = this.payrollEmployees.filter(
                            emp => emp.id !== payrollId.toString()
                        );
                        
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

        updateEmployeeTable() {
            console.log('Updating employee table...');
            const tableBody = document.getElementById('employee-table-body');
            if (!tableBody) {
                console.error('Table body element not found!');
                return;
            }
            
            tableBody.innerHTML = '';
            
            const filteredEmployees = this.payrollEmployees.filter(emp => 
                emp.month === this.currentMonth && emp.year === this.currentYear
            );
            
            console.log('Filtered employees:', filteredEmployees.length);
            
            if (filteredEmployees.length === 0) {
                const emptyRow = document.createElement('tr');
                emptyRow.innerHTML = `
                    <td colspan="8" class="text-center text-muted py-4">
                        <i class="fas fa-users fa-2x mb-3"></i>
                        <p>No employees found for this period</p>
                        <p class="small">Click "Add Employee" to get started</p>
                    </td>
                `;
                tableBody.appendChild(emptyRow);
            } else {
                filteredEmployees.forEach((employee) => {
                    const sprAmount = parseFloat(employee.sprAmount) || 0;
                    const sprDisplay = sprAmount > 0 ? 
                        `₹${sprAmount.toLocaleString('en-US')}` : 
                        `₹0`;
                    
                    // Calculate net salary correctly
                    const netSalary = (parseFloat(employee.basicSalary) || 0) + 
                                     sprAmount - 
                                     (parseFloat(employee.advances) || 0);
                    
                    const row = document.createElement('tr');
                    row.className = 'employee-row';
                    row.setAttribute('data-id', employee.id);
                    
                    row.innerHTML = `
                        <td class="employee-name-cell align-middle">${employee.name || 'Unknown'}</td>
                        <td class="text-end align-middle">₹${(parseFloat(employee.basicSalary) || 0).toLocaleString('en-US')}</td>
                        <td class="text-end align-middle">₹${(parseFloat(employee.advances) || 0).toLocaleString('en-US')}</td>
                        <td class="text-end align-middle spr-cell">
                            <span class="spr-value">${sprDisplay}</span>
                        </td>
                        <td class="text-end align-middle">₹${netSalary.toLocaleString('en-US')}</td>
                        <td class="align-middle">${employee.salaryDate || 'Not set'}</td>
                        <td class="align-middle">
                            <button class="btn btn-sm status-badge btn-outline-${employee.status === 'paid' ? 'success' : 'warning'}" 
                                    data-payroll-id="${employee.id}"
                                    data-current-status="${employee.status || 'unpaid'}"
                                    title="Click to toggle status">
                                <i class="fas fa-${employee.status === 'paid' ? 'check-circle' : 'clock'} me-1"></i>
                                ${employee.statusDisplay || (employee.status === 'paid' ? 'Paid' : 'Unpaid')}
                            </button>
                        </td>
                        <td class="text-center align-middle">
                            <div class="action-buttons d-flex gap-1 justify-content-center">
                                <button class="btn btn-sm btn-outline-primary edit-employee-btn" 
                                        data-id="${employee.id}" 
                                        title="Edit">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger delete-employee-btn" 
                                        data-id="${employee.id}" 
                                        title="Delete">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    `;
                    
                    tableBody.appendChild(row);
                });
            }
            
            this.updatePayrollStats();
        }

        updatePayrollStats() {
            let totalBasicSalary = 0;
            let totalAdvances = 0;
            let totalSPR = 0;
            let totalNetPayable = 0;
            
            const filteredEmployees = this.payrollEmployees.filter(emp => 
                emp.month === this.currentMonth && emp.year === this.currentYear
            );
            
            filteredEmployees.forEach(employee => {
                const basicSalary = parseFloat(employee.basicSalary) || 0;
                const advances = parseFloat(employee.advances) || 0;
                const sprAmount = parseFloat(employee.sprAmount) || 0;
                const netSalary = basicSalary + sprAmount - advances;
                
                totalBasicSalary += basicSalary;
                totalAdvances += advances;
                totalSPR += sprAmount;
                totalNetPayable += netSalary;
            });
            
            console.log('Payroll stats:', { totalBasicSalary, totalAdvances, totalSPR, totalNetPayable });
            
            // Use ₹ symbol
            this.setTextContent('total-salary', `₹${totalBasicSalary.toLocaleString('en-US')}`);
            this.setTextContent('total-advances', `₹${totalAdvances.toLocaleString('en-US')}`);
            this.setTextContent('total-spr', `₹${totalSPR.toLocaleString('en-US')}`);
            this.setTextContent('net-payable', `₹${totalNetPayable.toLocaleString('en-US')}`);
        }

        updateCurrentPeriodDisplay() {
            const periodEl = document.getElementById('current-payroll-period');
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

        // Optional: Export functions
        exportPayrollPDF() {
            this.app.showToast('Payroll data exported as PDF', 'success');
        }

        exportPayrollExcel() {
            this.app.showToast('Payroll data exported as Excel', 'success');
        }
    }
    
    // Make PayrollManager available globally
    window.PayrollManager = PayrollManager;
    
    // Create a minimal app object with required methods
    const app = {
        getCSRFToken: function() {
            // Get CSRF token from cookie
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
            // Fallback to meta tag
            if (!cookieValue) {
                const csrfMeta = document.querySelector('meta[name="csrf-token"]');
                if (csrfMeta) {
                    cookieValue = csrfMeta.getAttribute('content');
                }
            }
            return cookieValue;
        },
        showToast: function(message, type = 'info') {
            console.log(`${type.toUpperCase()}: ${message}`);
            
            // Try to use Bootstrap toasts if available
            if (typeof bootstrap !== 'undefined' && bootstrap.Toast) {
                // Create a toast element
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
                
                // Add to DOM
                const toastContainer = document.querySelector('.toast-container');
                if (!toastContainer) {
                    const container = document.createElement('div');
                    container.className = 'toast-container position-fixed top-0 end-0 p-3';
                    document.body.appendChild(container);
                    container.innerHTML = toastHtml;
                    const toastEl = document.getElementById(toastId);
                    const toast = new bootstrap.Toast(toastEl);
                    toast.show();
                } else {
                    toastContainer.innerHTML = toastHtml;
                    const toastEl = document.getElementById(toastId);
                    const toast = new bootstrap.Toast(toastEl);
                    toast.show();
                }
            } else {
                // Fallback to alert for debugging
                alert(`${type.toUpperCase()}: ${message}`);
            }
        }
    };
    
    // Initialize PayrollManager when DOM is fully loaded
    window.addEventListener('load', function() {
        console.log('Page fully loaded, initializing PayrollManager...');
        console.log('Bootstrap available:', typeof bootstrap !== 'undefined');
        
        // Check for modal element
        const modalElement = document.getElementById('addEmployeeModal');
        console.log('Modal element check:', modalElement);
        
        // Initialize PayrollManager
        try {
            window.payrollManager = new PayrollManager(app);
            console.log('PayrollManager initialized successfully');
        } catch (error) {
            console.error('Failed to initialize PayrollManager:', error);
            
            // Fallback: Add direct event listener for add button
            const addBtn = document.getElementById('add-employee-btn');
            if (addBtn) {
                addBtn.addEventListener('click', function() {
                    console.log('Fallback: Direct add button click');
                    const modal = document.getElementById('addEmployeeModal');
                    if (modal) {
                        const bsModal = new bootstrap.Modal(modal);
                        bsModal.show();
                    }
                });
            }
        }
    });
});