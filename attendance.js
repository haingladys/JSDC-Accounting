// attendance.js - Attendance page specific logic
document.addEventListener("DOMContentLoaded", function () {
    // Check if we're on attendance page
    const attendancePage = document.getElementById('attendance-page');
    if (!attendancePage) return;
    
    // Initialize WeeklyAttendanceManager class
    class WeeklyAttendanceManager {
        constructor(app) {
            this.app = app;
            this.employees = [];
            this.attendanceRecords = {};
            this.currentWeekStart = this.getWeekStartDate(new Date());
            this.currentWeekDates = this.generateWeekDates(this.currentWeekStart);
            this.today = new Date().toISOString().split('T')[0];
            
            this.init();
        }

        init() {
            this.loadEmployees();
            this.loadAttendanceRecords();
            this.setupEventListeners();
            this.renderWeeklyTable();
            this.updateSummaryCards();
            this.setupAutoWeekUpdate();
        }

        setupAutoWeekUpdate() {
            const now = new Date();
            const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
            const timeToMidnight = tomorrow - now;
            
            setTimeout(() => {
                this.currentWeekStart = this.getWeekStartDate(new Date());
                this.currentWeekDates = this.generateWeekDates(this.currentWeekStart);
                this.renderWeeklyTable();
                this.setupAutoWeekUpdate();
            }, timeToMidnight);
            
            window.addEventListener('focus', () => {
                const newToday = new Date().toISOString().split('T')[0];
                if (newToday !== this.today) {
                    this.today = newToday;
                    this.currentWeekStart = this.getWeekStartDate(new Date());
                    this.currentWeekDates = this.generateWeekDates(this.currentWeekStart);
                    this.renderWeeklyTable();
                    this.updateSummaryCards();
                }
            });
        }

        loadEmployees() {
            const saved = localStorage.getItem('attendanceEmployeesV2');
            if (saved) {
                this.employees = JSON.parse(saved);
            }
        }

        saveEmployees() {
            localStorage.setItem('attendanceEmployeesV2', JSON.stringify(this.employees));
        }

        loadAttendanceRecords() {
            const saved = localStorage.getItem('attendanceRecordsV3');
            if (saved) {
                this.attendanceRecords = JSON.parse(saved);
            }
        }

        saveAttendanceRecords() {
            localStorage.setItem('attendanceRecordsV3', JSON.stringify(this.attendanceRecords));
        }

        getWeekStartDate(date) {
            const d = new Date(date);
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            return new Date(d.setDate(diff));
        }

        generateWeekDates(startDate) {
            const dates = [];
            const start = new Date(startDate);
            
            for (let i = 0; i < 7; i++) {
                const date = new Date(start);
                date.setDate(start.getDate() + i);
                dates.push({
                    date: date,
                    dateString: date.toISOString().split('T')[0],
                    display: date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
                });
            }
            return dates;
        }

        isToday(date) {
            const today = new Date();
            return date.toDateString() === today.toDateString();
        }

        addEmployeeWithDuplicateCheck(name) {
            const trimmedName = name.trim();
            
            const existing = this.employees.find(emp => 
                emp.name.toLowerCase() === trimmedName.toLowerCase()
            );
            
            if (existing) {
                const surname = prompt(`Employee "${trimmedName}" already exists. Please enter surname to distinguish:`);
                if (!surname || surname.trim() === '') {
                    this.app.showToast('Surname is required for duplicate names', 'error');
                    return null;
                }
                return `${trimmedName} ${surname.trim()}`;
            }
            return trimmedName;
        }

        addEmployee(name) {
            const employee = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                name: name,
                joinDate: new Date().toISOString().split('T')[0],
                active: true
            };

            this.employees.push(employee);
            this.saveEmployees();
            
            this.attendanceRecords[employee.id] = {};
            this.saveAttendanceRecords();

            return employee;
        }

        updateAttendance(employeeId, date, status, notes = '') {
            if (!this.attendanceRecords[employeeId]) {
                this.attendanceRecords[employeeId] = {};
            }
            
            this.attendanceRecords[employeeId][date] = {
                status: status,
                notes: notes,
                updatedAt: new Date().toISOString()
            };
            
            this.saveAttendanceRecords();
            
            if (date === this.today) {
                this.updateSummaryCards();
            }
            
            return true;
        }

        getAttendance(employeeId, date) {
            if (!this.attendanceRecords[employeeId]) {
                return null;
            }
            return this.attendanceRecords[employeeId][date] || null;
        }

        saveAllAttendance() {
            let savedCount = 0;
            
            const attendanceSelects = document.querySelectorAll('.attendance-select');
            
            attendanceSelects.forEach(select => {
                const employeeId = select.dataset.employee;
                const date = select.dataset.date;
                const status = select.value;
                
                if (status && employeeId) {
                    if (this.updateAttendance(employeeId, date, status)) {
                        savedCount++;
                    }
                }
            });
            
            this.app.showToast(`Attendance saved for ${savedCount} entries`, 'success');
            return savedCount;
        }

        calculateTodaysSummary() {
            let todayPresent = 0;
            let todayAbsent = 0;
            let todayHalfDay = 0;

            this.employees.forEach(employee => {
                const todayAttendance = this.getAttendance(employee.id, this.today);
                if (todayAttendance) {
                    if (todayAttendance.status === '1') todayPresent++;
                    else if (todayAttendance.status === '0') todayAbsent++;
                    else if (todayAttendance.status === '0.5') todayHalfDay++;
                }
            });

            return {
                totalEmployees: this.employees.length,
                todayPresent,
                todayAbsent,
                todayHalfDay
            };
        }

        updateSummaryCards() {
            const summary = this.calculateTodaysSummary();
            
            const totalEmployeesEl = document.getElementById('total-employees-count');
            const todayPresentEl = document.getElementById('today-present-count');
            const todayAbsentEl = document.getElementById('today-absent-count');
            const todayHalfdayEl = document.getElementById('today-halfday-count');
            
            if (totalEmployeesEl) totalEmployeesEl.textContent = summary.totalEmployees;
            if (todayPresentEl) todayPresentEl.textContent = summary.todayPresent;
            if (todayAbsentEl) todayAbsentEl.textContent = summary.todayAbsent;
            if (todayHalfdayEl) todayHalfdayEl.textContent = summary.todayHalfDay;
        }

        renderWeeklyTable() {
            this.renderTableHeaders();
            this.renderEmployeeRows();
        }

        renderTableHeaders() {
            const table = document.getElementById('weekly-attendance-table');
            if (!table) return;

            const thead = table.querySelector('thead tr');
            while (thead.children.length > 2) {
                thead.removeChild(thead.children[1]);
            }

            this.currentWeekDates.forEach((dateInfo, index) => {
                const th = document.createElement('th');
                th.className = 'week-day-header';
                
                if (this.isToday(dateInfo.date)) {
                    th.classList.add('today-header');
                }
                
                th.innerHTML = `
                    <div class="day-name">${dateInfo.display.split(' ')[0]}</div>
                    <div class="day-date">${dateInfo.display.split(' ').slice(1).join(' ')}</div>
                `;
                
                thead.insertBefore(th, thead.children[thead.children.length - 1]);
            });
        }

        renderEmployeeRows() {
            const tbody = document.getElementById('weekly-attendance-body');
            if (!tbody) return;

            tbody.innerHTML = '';

            if (this.employees.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="9" class="text-center text-muted py-5">
                            <i class="fas fa-users fa-2x mb-3"></i>
                            <p>No employees added yet</p>
                            <p class="small">Click "Add Employee" to get started</p>
                        </td>
                    </tr>
                `;
                return;
            }

            this.employees.forEach(employee => {
                const row = this.createEmployeeRow(employee);
                tbody.appendChild(row);
            });
        }

        createEmployeeRow(employee) {
            const row = document.createElement('tr');
            
            const nameCell = document.createElement('td');
            nameCell.className = 'employee-name-cell';
            nameCell.innerHTML = `
                <div class="employee-name">${employee.name}</div>
            `;
            row.appendChild(nameCell);

            this.currentWeekDates.forEach(dateInfo => {
                const cell = document.createElement('td');
                cell.className = 'attendance-cell';
                
                if (this.isToday(dateInfo.date)) {
                    cell.classList.add('today-cell');
                }

                const attendance = this.getAttendance(employee.id, dateInfo.dateString);
                const currentStatus = attendance ? attendance.status : '';
                
                cell.innerHTML = `
                    <select class="form-select attendance-select" 
                            data-date="${dateInfo.dateString}"
                            data-employee="${employee.id}">
                        <option value="">-</option>
                        <option value="1" ${currentStatus === '1' ? 'selected' : ''}>Present (1)</option>
                        <option value="0.5" ${currentStatus === '0.5' ? 'selected' : ''}>Half Day (0.5)</option>
                        <option value="0" ${currentStatus === '0' ? 'selected' : ''}>Absent (0)</option>
                    </select>
                `;
                row.appendChild(cell);
            });

            const actionsCell = document.createElement('td');
            actionsCell.className = 'actions-column';
            actionsCell.innerHTML = `
                <div class="attendance-actions">
                    <button class="btn btn-sm btn-warning edit-attendance-btn" 
                            data-employee-id="${employee.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger delete-attendance-btn" 
                            data-employee-id="${employee.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            row.appendChild(actionsCell);

            return row;
        }

        openViewRecordsModal() {
            this.populateFilterOptions();
            this.renderRecordsTable();
            
            const modalElement = document.getElementById('viewRecordsModal');
            if (modalElement) {
                const modal = new bootstrap.Modal(modalElement);
                modal.show();
            }
        }

        populateFilterOptions() {
            const employeeSelect = document.getElementById('filter-employee');
            if (employeeSelect) {
                employeeSelect.innerHTML = '<option value="">All Employees</option>';
                
                this.employees.forEach(employee => {
                    const option = document.createElement('option');
                    option.value = employee.id;
                    option.textContent = employee.name;
                    employeeSelect.appendChild(option);
                });
            }

            const dateFilter = document.getElementById('filter-date');
            if (dateFilter) {
                dateFilter.value = this.today;
            }
        }

        renderRecordsTable(filters = {}) {
            const tbody = document.getElementById('records-table-body');
            if (!tbody) return;

            tbody.innerHTML = '';

            let allRecords = [];
            
            for (const employeeId in this.attendanceRecords) {
                const employee = this.employees.find(e => e.id === employeeId);
                if (!employee) continue;
                
                for (const date in this.attendanceRecords[employeeId]) {
                    const record = this.attendanceRecords[employeeId][date];
                    
                    if (filters.date && date !== filters.date) continue;
                    if (filters.employeeId && employeeId !== filters.employeeId) continue;
                    
                    allRecords.push({
                        employeeId: employeeId,
                        employeeName: employee.name,
                        date: date,
                        displayDate: this.formatDisplayDate(date),
                        status: record.status,
                        notes: record.notes
                    });
                }
            }

            allRecords.sort((a, b) => new Date(b.date) - new Date(a.date));

            if (allRecords.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="4" class="text-center py-4 text-muted">
                            No attendance records found
                        </td>
                    </tr>
                `;
                return;
            }

            allRecords.forEach(record => {
                const row = document.createElement('tr');
                
                const statusText = record.status === '1' ? 'Present' : 
                                 record.status === '0.5' ? 'Half Day' : 'Absent';
                const statusClass = record.status === '1' ? 'status-present' : 
                                  record.status === '0.5' ? 'status-halfday' : 'status-absent';
                
                row.innerHTML = `
                    <td>${record.employeeName}</td>
                    <td>${record.displayDate}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary edit-record-btn" 
                                data-employee-id="${record.employeeId}"
                                data-date="${record.date}">
                            <i class="fas fa-edit me-1"></i> Edit
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }

        openEditAttendanceModal(employeeId, date = null) {
            const employee = this.employees.find(e => e.id === employeeId);
            if (!employee) return;

            const editDate = date || new Date().toISOString().split('T')[0];
            const attendance = this.getAttendance(employeeId, editDate) || { status: '1', notes: '' };
            
            document.getElementById('edit-employee-id').value = employeeId;
            document.getElementById('edit-date').value = editDate;
            document.getElementById('edit-attendance-employee-name').value = employee.name;
            document.getElementById('edit-attendance-date').value = editDate;
            document.getElementById('edit-attendance-status').value = attendance.status;
            document.getElementById('edit-attendance-notes').value = attendance.notes || '';
            
            const modalElement = document.getElementById('editAttendanceModal');
            if (modalElement) {
                const modal = new bootstrap.Modal(modalElement);
                modal.show();
            }
        }

        updateAttendanceRecord() {
            const employeeId = document.getElementById('edit-employee-id').value;
            const date = document.getElementById('edit-attendance-date').value;
            const status = document.getElementById('edit-attendance-status').value;
            const notes = document.getElementById('edit-attendance-notes').value;
            
            if (!employeeId || !date || !status) {
                this.app.showToast('Please fill all required fields', 'error');
                return;
            }
            
            if (this.updateAttendance(employeeId, date, status, notes)) {
                this.app.showToast('Attendance updated successfully', 'success');
                
                const recordDate = new Date(date);
                const weekStart = this.currentWeekStart;
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);
                
                if (recordDate >= weekStart && recordDate <= weekEnd) {
                    this.renderWeeklyTable();
                }
                
                if (document.getElementById('viewRecordsModal').classList.contains('show')) {
                    this.renderRecordsTable();
                }
                
                const editModal = bootstrap.Modal.getInstance(document.getElementById('editAttendanceModal'));
                if (editModal) editModal.hide();
            }
        }

        deleteAttendanceRecord() {
            const employeeId = document.getElementById('edit-employee-id').value;
            const date = document.getElementById('edit-attendance-date').value;
            
            if (!confirm('Are you sure you want to delete this attendance record?')) {
                return;
            }
            
            if (this.attendanceRecords[employeeId] && this.attendanceRecords[employeeId][date]) {
                delete this.attendanceRecords[employeeId][date];
                
                if (Object.keys(this.attendanceRecords[employeeId]).length === 0) {
                    delete this.attendanceRecords[employeeId];
                }
                
                this.saveAttendanceRecords();
                
                this.app.showToast('Attendance record deleted', 'success');
                this.renderWeeklyTable();
                this.updateSummaryCards();
                
                if (document.getElementById('viewRecordsModal').classList.contains('show')) {
                    this.renderRecordsTable();
                }
                
                const editModal = bootstrap.Modal.getInstance(document.getElementById('editAttendanceModal'));
                if (editModal) editModal.hide();
            }
        }

        setupEventListeners() {
            const newAddEmployeeBtn = document.getElementById('new-add-employee-btn');
            if (newAddEmployeeBtn) {
                newAddEmployeeBtn.addEventListener('click', () => {
                    const modalElement = document.getElementById('newAddEmployeeModal');
                    if (modalElement) {
                        const modal = new bootstrap.Modal(modalElement);
                        modal.show();
                    }
                });
            }

            const saveNewEmployeeBtn = document.getElementById('saveNewEmployeeBtn');
            if (saveNewEmployeeBtn) {
                saveNewEmployeeBtn.addEventListener('click', () => {
                    const nameInput = document.getElementById('newEmployeeName');
                    const name = nameInput?.value.trim();
                    
                    if (!name) {
                        this.app.showToast('Please enter employee name', 'error');
                        return;
                    }

                    let fullName = name;
                    const duplicateCheck = this.addEmployeeWithDuplicateCheck(name);
                    
                    if (duplicateCheck === null) {
                        return;
                    }
                    
                    if (typeof duplicateCheck === 'string') {
                        fullName = duplicateCheck;
                    }

                    const exactDuplicate = this.employees.find(emp => 
                        emp.name.toLowerCase() === fullName.toLowerCase()
                    );
                    
                    if (exactDuplicate) {
                        this.app.showToast(`Employee "${fullName}" already exists`, 'error');
                        return;
                    }

                    const employee = this.addEmployee(fullName);
                    if (employee) {
                        nameInput.value = '';
                        const modal = bootstrap.Modal.getInstance(document.getElementById('newAddEmployeeModal'));
                        if (modal) modal.hide();
                        this.renderWeeklyTable();
                        this.updateSummaryCards();
                        this.app.showToast(`Employee "${fullName}" added successfully`, 'success');
                    }
                });
            }

            const saveAttendanceBtn = document.getElementById('save-attendance-btn');
            if (saveAttendanceBtn) {
                saveAttendanceBtn.addEventListener('click', () => {
                    this.saveAllAttendance();
                });
            }

            const viewRecordsBtn = document.getElementById('view-records-btn');
            if (viewRecordsBtn) {
                viewRecordsBtn.addEventListener('click', () => {
                    this.openViewRecordsModal();
                });
            }

            const applyFiltersBtn = document.getElementById('apply-filters-btn');
            if (applyFiltersBtn) {
                applyFiltersBtn.addEventListener('click', () => {
                    const filters = {
                        date: document.getElementById('filter-date')?.value || '',
                        employeeId: document.getElementById('filter-employee')?.value || ''
                    };
                    this.renderRecordsTable(filters);
                });
            }

            const weeklyTableBody = document.getElementById('weekly-attendance-body');
            if (weeklyTableBody) {
                weeklyTableBody.addEventListener('click', (e) => {
                    if (e.target.closest('.edit-attendance-btn')) {
                        const employeeId = e.target.closest('.edit-attendance-btn').dataset.employeeId;
                        this.openEditAttendanceModal(employeeId);
                    }
                    
                    if (e.target.closest('.delete-attendance-btn')) {
                        const employeeId = e.target.closest('.delete-attendance-btn').dataset.employeeId;
                        const employee = this.employees.find(e => e.id === employeeId);
                        
                        if (employee && confirm(`Delete employee "${employee.name}" and all their attendance records?`)) {
                            this.employees = this.employees.filter(e => e.id !== employeeId);
                            this.saveEmployees();
                            
                            delete this.attendanceRecords[employeeId];
                            this.saveAttendanceRecords();
                            
                            this.app.showToast('Employee deleted', 'success');
                            this.renderWeeklyTable();
                            this.updateSummaryCards();
                        }
                    }
                });
                
                weeklyTableBody.addEventListener('change', (e) => {
                    if (e.target.classList.contains('attendance-select')) {
                        const employeeId = e.target.dataset.employee;
                        const date = e.target.dataset.date;
                        const status = e.target.value;
                        
                        this.updateAttendance(employeeId, date, status);
                    }
                });
            }

            const recordsTableBody = document.getElementById('records-table-body');
            if (recordsTableBody) {
                recordsTableBody.addEventListener('click', (e) => {
                    if (e.target.closest('.edit-record-btn')) {
                        const button = e.target.closest('.edit-record-btn');
                        const employeeId = button.dataset.employeeId;
                        const date = button.dataset.date;
                        
                        const viewRecordsModal = bootstrap.Modal.getInstance(document.getElementById('viewRecordsModal'));
                        if (viewRecordsModal) {
                            viewRecordsModal.hide();
                            
                            setTimeout(() => {
                                this.openEditAttendanceModal(employeeId, date);
                            }, 300);
                        }
                    }
                });
            }

            const updateAttendanceBtn = document.getElementById('update-attendance-btn');
            if (updateAttendanceBtn) {
                updateAttendanceBtn.addEventListener('click', () => {
                    this.updateAttendanceRecord();
                });
            }

            const deleteAttendanceBtn = document.getElementById('delete-attendance-btn');
            if (deleteAttendanceBtn) {
                deleteAttendanceBtn.addEventListener('click', () => {
                    this.deleteAttendanceRecord();
                });
            }
        }

        formatDisplayDate(dateString) {
            try {
                const date = new Date(dateString);
                if (isNaN(date.getTime())) return 'Invalid Date';
                return date.toLocaleDateString('en-IN', { 
                    day: '2-digit', 
                    month: 'short', 
                    year: 'numeric' 
                });
            } catch (error) {
                console.error('Error formatting date:', error);
                return 'Invalid Date';
            }
        }
    }

    // Initialize attendance page if it exists
    if (window.jsdcApp) {
        window.attendanceManager = new WeeklyAttendanceManager(window.jsdcApp);
    }
});