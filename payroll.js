// payroll.js - JSDC Payroll Management Module
document.addEventListener("DOMContentLoaded", function () {
    'use strict';
    
    // Payroll Application Class
    class PayrollManager {
        constructor() {
            this.payrollEmployees = [];
            this.currentMonth = new Date().getMonth() + 1; // Current month (1-12)
            this.currentYear = new Date().getFullYear();
            this.isProcessing = false;
            
            // Initialize
            this.init();
        }
        
        init() {
            this.initializePayrollSystem();
            this.setupEventListeners();
            this.setupModals();
            this.updatePayrollPeriodDisplay();
            this.updateDashboardPeriod();
        }
        
        initializePayrollSystem() {
            try {
                // Load employees from localStorage
                this.payrollEmployees = JSON.parse(localStorage.getItem('payrollEmployees')) || [];
                
                // Update all UI components
                this.updateEmployeeTable();
                this.updatePayrollStats();
                
                // Setup datepicker
                this.initializeDatePicker();
                
                console.log('Payroll system initialized');
            } catch (error) {
                console.error('Error initializing payroll system:', error);
                this.payrollEmployees = [];
                this.showToast('Error loading payroll data', 'error');
            }
        }
        
        initializeDatePicker() {
            const dateInputs = ['salary-date', 'edit-salary-date'];
            
            dateInputs.forEach(id => {
                const input = document.getElementById(id);
                if (input) {
                    // Set default to today's date
                    const today = new Date();
                    const formattedDate = today.toISOString().split('T')[0];
                    input.value = formattedDate;
                    
                    // Add change event
                    input.addEventListener('change', () => {
                        this.validateDateInput(input);
                    });
                }
            });
        }
        
        validateDateInput(input) {
            const selectedDate = new Date(input.value);
            const today = new Date();
            
            if (selectedDate > today) {
                this.showToast('Salary date cannot be in the future', 'error');
                input.value = today.toISOString().split('T')[0];
            }
        }
        
        setupEventListeners() {
            // Add Employee Button
            const addEmployeeBtn = document.getElementById('add-employee-btn');
            if (addEmployeeBtn) {
                addEmployeeBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.openAddEmployeeModal();
                });
            }
            
            // Save Employee Button
            const saveEmployeeBtn = document.getElementById('save-employee-btn');
            if (saveEmployeeBtn) {
                saveEmployeeBtn.addEventListener('click', () => {
                    this.saveEmployee();
                });
            }
            
            // Update Employee Button
            const updateEmployeeBtn = document.getElementById('update-employee-btn');
            if (updateEmployeeBtn) {
                updateEmployeeBtn.addEventListener('click', () => {
                    this.updateEmployee();
                });
            }
            
            // Table click events (delegated)
            const tableBody = document.getElementById('employee-table-body');
            if (tableBody) {
                tableBody.addEventListener('click', (e) => {
                    this.handleTableClick(e);
                });
            }
            
            // Form validation
            const employeeForm = document.getElementById('employeeForm');
            if (employeeForm) {
                employeeForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.saveEmployee();
                });
            }
            
            const editEmployeeForm = document.getElementById('editEmployeeForm');
            if (editEmployeeForm) {
                editEmployeeForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.updateEmployee();
                });
            }
            
            // Setup auto-update for payroll period
            this.setupAutoUpdate();
        }
        
        setupModals() {
            // Add Employee Modal
            const addEmployeeModal = document.getElementById('addEmployeeModal');
            if (addEmployeeModal) {
                addEmployeeModal.addEventListener('show.bs.modal', () => {
                    this.resetAddEmployeeForm();
                });
                
                addEmployeeModal.addEventListener('shown.bs.modal', () => {
                    const nameInput = document.getElementById('employee-name');
                    if (nameInput) nameInput.focus();
                });
            }
            
            // Edit Employee Modal
            const editEmployeeModal = document.getElementById('editEmployeeModal');
            if (editEmployeeModal) {
                editEmployeeModal.addEventListener('hidden.bs.modal', () => {
                    this.resetEditEmployeeForm();
                });
            }
        }
        
        setupAutoUpdate() {
            // Check for month change every minute
            setInterval(() => {
                const now = new Date();
                const currentMonth = now.getMonth() + 1;
                const currentYear = now.getFullYear();
                
                if (currentMonth !== this.currentMonth || currentYear !== this.currentYear) {
                    this.currentMonth = currentMonth;
                    this.currentYear = currentYear;
                    
                    this.updatePayrollPeriodDisplay();
                    this.updateEmployeeTable();
                    this.updatePayrollStats();
                    
                    this.showToast(`Payroll period changed to ${this.getMonthName(currentMonth)} ${currentYear}`, 'info');
                }
            }, 60000);
        }
        
        openAddEmployeeModal() {
            const modalElement = document.getElementById('addEmployeeModal');
            if (modalElement) {
                const modal = new bootstrap.Modal(modalElement);
                modal.show();
            }
        }
        
        openEditEmployeeModal(employeeId) {
            const employee = this.payrollEmployees.find(emp => emp.id === employeeId);
            if (!employee) {
                this.showToast('Employee not found', 'error');
                return;
            }
            
            // Populate form fields
            document.getElementById('edit-employee-id')?.value = employee.id;
            document.getElementById('edit-employee-name')?.value = employee.name || '';
            document.getElementById('edit-employee-basic-salary')?.value = employee.basicSalary || '';
            document.getElementById('edit-spr-amount')?.value = employee.sprAmount || '';
            document.getElementById('edit-advances')?.value = employee.advances || '';
            document.getElementById('edit-salary-date')?.value = employee.salaryDate || '';
            document.getElementById('edit-payment-status')?.value = employee.status || 'unpaid';
            
            const modalElement = document.getElementById('editEmployeeModal');
            if (modalElement) {
                const modal = new bootstrap.Modal(modalElement);
                modal.show();
            }
        }
        
        resetAddEmployeeForm() {
            const form = document.getElementById('employeeForm');
            if (form) {
                form.reset();
                const dateInput = document.getElementById('salary-date');
                if (dateInput) {
                    dateInput.value = new Date().toISOString().split('T')[0];
                }
            }
        }
        
        resetEditEmployeeForm() {
            const form = document.getElementById('editEmployeeForm');
            if (form) {
                form.reset();
            }
        }
        
        handleTableClick(e) {
            const target = e.target;
            const button = target.closest('button');
            
            if (!button) return;
            
            if (button.classList.contains('edit-employee-btn')) {
                const employeeId = button.getAttribute('data-id');
                if (employeeId) {
                    this.openEditEmployeeModal(employeeId);
                }
            } else if (button.classList.contains('delete-employee-btn')) {
                const row = button.closest('tr');
                const employeeName = row.cells[0].textContent.trim();
                this.deleteEmployee(employeeName);
            }
        }
        
        saveEmployee() {
            if (this.isProcessing) return;
            this.isProcessing = true;
            
            const saveBtn = document.getElementById('save-employee-btn');
            if (!saveBtn) {
                this.isProcessing = false;
                return;
            }
            
            const originalText = saveBtn.innerHTML;
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            
            try {
                // Get form values
                const name = document.getElementById('employee-name')?.value.trim();
                const basicSalary = parseFloat(document.getElementById('employee-basic-salary')?.value || 0);
                const sprAmount = parseFloat(document.getElementById('spr-amount')?.value || 0);
                const advances = parseFloat(document.getElementById('advances')?.value || 0);
                const salaryDate = document.getElementById('salary-date')?.value;
                
                // Validation
                if (!name) {
                    this.showToast('Please enter employee name', 'error');
                    return;
                }
                
                if (!basicSalary || basicSalary <= 0) {
                    this.showToast('Please enter valid basic salary', 'error');
                    return;
                }
                
                if (!salaryDate) {
                    this.showToast('Please select salary date', 'error');
                    return;
                }
                
                // Check for duplicate employee name for current month/year
                const existingEmployee = this.payrollEmployees.find(emp => 
                    emp.name.trim().toLowerCase() === name.toLowerCase() && 
                    emp.month === this.currentMonth && 
                    emp.year === this.currentYear
                );
                
                if (existingEmployee) {
                    this.showToast(`Employee "${name}" already exists for ${this.getMonthName(this.currentMonth)} ${this.currentYear}`, 'error');
                    return;
                }
                
                // Create employee object
                const employee = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    name: name,
                    basicSalary: basicSalary,
                    sprAmount: sprAmount || 0,
                    advances: advances || 0,
                    salaryDate: salaryDate,
                    status: 'unpaid',
                    month: this.currentMonth,
                    year: this.currentYear
                };
                
                // Add to array and save
                this.payrollEmployees.push(employee);
                this.savePayrollData();
                
                // Update UI
                this.updateEmployeeTable();
                this.updatePayrollStats();
                
                // Close modal
                const modalElement = document.getElementById('addEmployeeModal');
                if (modalElement) {
                    const modal = bootstrap.Modal.getInstance(modalElement);
                    if (modal) modal.hide();
                }
                
                this.showToast(`Employee "${name}" added successfully`, 'success');
                
                // Reset form
                this.resetAddEmployeeForm();
                
            } catch (error) {
                console.error('Error saving employee:', error);
                this.showToast('Error saving employee: ' + error.message, 'error');
            } finally {
                // Reset button state
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = originalText;
                }
                this.isProcessing = false;
            }
        }
        
        updateEmployee() {
            if (this.isProcessing) return;
            this.isProcessing = true;
            
            const updateBtn = document.getElementById('update-employee-btn');
            if (!updateBtn) {
                this.isProcessing = false;
                return;
            }
            
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
                
                // Validation
                if (!name) {
                    this.showToast('Please enter employee name', 'error');
                    return;
                }
                
                if (!basicSalary || basicSalary <= 0) {
                    this.showToast('Please enter valid basic salary', 'error');
                    return;
                }
                
                if (!salaryDate) {
                    this.showToast('Please select salary date', 'error');
                    return;
                }
                
                const employeeIndex = this.payrollEmployees.findIndex(emp => emp.id === employeeId);
                if (employeeIndex === -1) {
                    this.showToast('Employee not found', 'error');
                    return;
                }
                
                // Check for name conflict with other employees
                const nameConflict = this.payrollEmployees.find(emp => 
                    emp.id !== employeeId && 
                    emp.name.toLowerCase() === name.toLowerCase() &&
                    emp.month === this.currentMonth && 
                    emp.year === this.currentYear
                );
                
                if (nameConflict) {
                    this.showToast(`Employee name "${name}" already exists for this period`, 'error');
                    return;
                }
                
                // Update employee
                this.payrollEmployees[employeeIndex].name = name;
                this.payrollEmployees[employeeIndex].basicSalary = basicSalary;
                this.payrollEmployees[employeeIndex].sprAmount = sprAmount;
                this.payrollEmployees[employeeIndex].advances = advances;
                this.payrollEmployees[employeeIndex].salaryDate = salaryDate;
                this.payrollEmployees[employeeIndex].status = status;
                
                // Save and update
                this.savePayrollData();
                this.updateEmployeeTable();
                this.updatePayrollStats();
                
                // Close modal
                const modalElement = document.getElementById('editEmployeeModal');
                if (modalElement) {
                    const modal = bootstrap.Modal.getInstance(modalElement);
                    if (modal) modal.hide();
                }
                
                this.showToast('Employee updated successfully', 'success');
                
            } catch (error) {
                console.error('Error updating employee:', error);
                this.showToast('Error updating employee: ' + error.message, 'error');
            } finally {
                if (updateBtn) {
                    updateBtn.disabled = false;
                    updateBtn.innerHTML = originalText;
                }
                this.isProcessing = false;
            }
        }
        
        deleteEmployee(employeeName) {
            if (!confirm(`Are you sure you want to remove employee "${employeeName}"?`)) {
                return;
            }
            
            const originalCount = this.payrollEmployees.length;
            
            // Filter out the employee
            this.payrollEmployees = this.payrollEmployees.filter(emp => 
                emp.name.trim().toLowerCase() !== employeeName.trim().toLowerCase()
            );
            
            if (this.payrollEmployees.length < originalCount) {
                this.savePayrollData();
                this.updateEmployeeTable();
                this.updatePayrollStats();
                this.showToast('Employee removed successfully', 'success');
            } else {
                this.showToast('Employee not found', 'error');
            }
        }
        
        savePayrollData() {
            try {
                localStorage.setItem('payrollEmployees', JSON.stringify(this.payrollEmployees));
            } catch (error) {
                console.error('Error saving payroll data:', error);
                this.showToast('Error saving payroll data', 'error');
            }
        }
        
        updateEmployeeTable() {
            const tableBody = document.getElementById('employee-table-body');
            if (!tableBody) return;
            
            tableBody.innerHTML = '';
            
            // Filter employees for current month/year
            const filteredEmployees = this.payrollEmployees.filter(emp => 
                emp.month === this.currentMonth && emp.year === this.currentYear
            );
            
            if (filteredEmployees.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="8" class="text-center text-muted py-4">
                            No payroll employees found for ${this.getMonthName(this.currentMonth)} ${this.currentYear}. 
                            Click "Add Employee" to get started.
                        </td>
                    </tr>
                `;
                return;
            }
            
            // Create rows for each employee
            filteredEmployees.forEach(employee => {
                const netSalary = this.calculateNetSalary(employee);
                
                const row = document.createElement('tr');
                row.className = 'employee-row';
                row.innerHTML = `
                    <td>${employee.name || ''}</td>
                    <td>₹${(employee.basicSalary || 0).toLocaleString()}</td>
                    <td>₹${(employee.advances || 0).toLocaleString()}</td>
                    <td>
                        <span class="badge spr-badge">₹${(employee.sprAmount || 0).toLocaleString()}</span>
                    </td>
                    <td>₹${netSalary.toLocaleString()}</td>
                    <td>${employee.salaryDate || ''}</td>
                    <td>
                        <span class="badge status-badge ${employee.status || 'unpaid'}">
                            ${this.formatStatusText(employee.status || 'unpaid')}
                        </span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-outline-primary edit-employee-btn" data-id="${employee.id}" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger delete-employee-btn" data-id="${employee.id}" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        }
        
        calculateNetSalary(employee) {
            const basicSalary = employee.basicSalary || 0;
            const sprAmount = employee.sprAmount || 0;
            const advances = employee.advances || 0;
            
            return basicSalary + sprAmount - advances;
        }
        
        formatStatusText(status) {
            const statusMap = {
                'unpaid': 'Unpaid',
                'paid': 'Paid'
            };
            return statusMap[status] || status;
        }
        
        updatePayrollStats() {
            const filteredEmployees = this.payrollEmployees.filter(emp => 
                emp.month === this.currentMonth && emp.year === this.currentYear
            );
            
            let totalBasicSalary = 0;
            let totalAdvances = 0;
            let totalSPR = 0;
            let totalNetPayable = 0;
            
            filteredEmployees.forEach(employee => {
                const basicSalary = employee.basicSalary || 0;
                const advances = employee.advances || 0;
                const sprAmount = employee.sprAmount || 0;
                const netSalary = this.calculateNetSalary(employee);
                
                totalBasicSalary += basicSalary;
                totalAdvances += advances;
                totalSPR += sprAmount;
                totalNetPayable += netSalary;
            });
            
            // Update UI elements
            this.updateTextContent('total-salary', `₹${totalBasicSalary.toLocaleString()}`);
            this.updateTextContent('total-advances', `₹${totalAdvances.toLocaleString()}`);
            this.updateTextContent('total-spr', `₹${totalSPR.toLocaleString()}`);
            this.updateTextContent('net-payable', `₹${totalNetPayable.toLocaleString()}`);
        }
        
        updatePayrollPeriodDisplay() {
            const monthName = this.getMonthName(this.currentMonth);
            
            // Update main display
            const displayElement = document.getElementById('current-payroll-period');
            if (displayElement) {
                displayElement.textContent = `${monthName} ${this.currentYear}`;
            }
            
            // Update dashboard period display
            const dashboardDisplay = document.getElementById('payroll-month-year-display');
            if (dashboardDisplay) {
                const span = dashboardDisplay.querySelector('span');
                if (span) {
                    span.textContent = `${monthName} ${this.currentYear}`;
                }
            }
        }
        
        updateDashboardPeriod() {
            const monthName = this.getMonthName(this.currentMonth);
            const displayElement = document.getElementById('current-payroll-period');
            if (displayElement) {
                displayElement.textContent = `${monthName} ${this.currentYear}`;
            }
        }
        
        getMonthName(monthNumber) {
            const months = [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
            ];
            return months[monthNumber - 1] || 'Unknown';
        }
        
        updateTextContent(id, text) {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = text;
            }
        }
        
        showToast(message, type = 'success') {
            // Check if toast element exists in the page
            let toastEl = document.getElementById('successToast');
            
            if (!toastEl) {
                // Create a temporary toast if none exists
                toastEl = document.createElement('div');
                toastEl.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : 'success'} border-0`;
                toastEl.setAttribute('role', 'alert');
                toastEl.innerHTML = `
                    <div class="d-flex">
                        <div class="toast-body">
                            ${message}
                        </div>
                        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                    </div>
                `;
                document.body.appendChild(toastEl);
                
                const toast = new bootstrap.Toast(toastEl);
                toast.show();
                
                // Remove after hiding
                toastEl.addEventListener('hidden.bs.toast', () => {
                    toastEl.remove();
                });
            } else {
                const toastBody = toastEl.querySelector('.toast-body');
                if (toastBody) {
                    toastBody.textContent = message;
                }
                
                if (type === 'error') {
                    toastEl.classList.remove('bg-success');
                    toastEl.classList.add('bg-danger');
                } else {
                    toastEl.classList.remove('bg-danger');
                    toastEl.classList.add('bg-success');
                }
                
                const toast = new bootstrap.Toast(toastEl);
                toast.show();
            }
        }
    }
    
    // Initialize Payroll Manager when DOM is loaded
    let payrollManager;
    
    // Only initialize on payroll page
    if (document.getElementById('payroll-page')) {
        payrollManager = new PayrollManager();
        console.log('Payroll Manager initialized');
        
        // Make available globally if needed (optional)
        window.payrollManager = payrollManager;
    }
});