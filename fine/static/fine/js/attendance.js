// attendance.js - Attendance page specific logic
document.addEventListener("DOMContentLoaded", function () {
    // Check if we're on attendance page
    const attendancePage = document.getElementById('attendance-page');
    if (!attendancePage) return;
    
    // Initialize attendance manager
    const attendanceManager = new WeeklyAttendanceManager();
    window.attendanceManager = attendanceManager; // Make it globally accessible for debugging
});

// attendance.js - JSDC Attendance Module
class WeeklyAttendanceManager {
    constructor() {
        this.employees = [];
        this.attendanceRecords = {};
        this.currentWeekStart = this.getWeekStartDate(new Date());
        this.currentWeekDates = this.generateWeekDates(this.currentWeekStart);
        this.today = new Date().toISOString().split('T')[0];
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupAutoWeekUpdate();
        this.setupAttendanceSelectListeners();
        this.loadAttendanceFromDjango();
    }

    getCSRFToken() {
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
        return cookieValue;
    }

showToast(message, type = 'info') {
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            max-width: 300px;
        `;
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast-message toast-${type}`;
    toast.style.cssText = `
        background-color: ${type === 'error' ? '#f8d7da' : type === 'success' ? '#d4edda' : '#d1ecf1'};
        color: ${type === 'error' ? '#721c24' : type === 'success' ? '#155724' : '#0c5460'};
        padding: 12px 16px;
        margin-bottom: 10px;
        border-radius: 4px;
        border: 1px solid ${type === 'error' ? '#f5c6cb' : type === 'success' ? '#c3e6cb' : '#bee5eb'};
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        justify-content: space-between;
        animation: slideIn 0.3s ease;
    `;
    
    // Add CSS animation for slide in
    if (!document.getElementById('toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;
    
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = `
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        color: inherit;
        margin-left: 10px;
    `;
    closeBtn.onclick = () => {
        toast.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    };
    
    toast.appendChild(messageSpan);
    toast.appendChild(closeBtn);
    toastContainer.appendChild(toast);
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }
    }, 3000);
    
    console.log(`${type.toUpperCase()}: ${message}`);
}

    setupAutoWeekUpdate() {
        const now = new Date();
        const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        const timeToMidnight = tomorrow - now;
        
        setTimeout(() => {
            this.currentWeekStart = this.getWeekStartDate(new Date());
            this.currentWeekDates = this.generateWeekDates(this.currentWeekStart);
            this.loadAttendanceFromDjango();
            this.setupAutoWeekUpdate();
        }, timeToMidnight);
        
        window.addEventListener('focus', () => {
            const newToday = new Date().toISOString().split('T')[0];
            if (newToday !== this.today) {
                this.today = newToday;
                this.currentWeekStart = this.getWeekStartDate(new Date());
                this.currentWeekDates = this.generateWeekDates(this.currentWeekStart);
                this.loadAttendanceFromDjango();
            }
        });
    }

    loadAttendanceFromDjango() {
        console.log('Loading attendance data...');
        fetch('/get-weekly-attendance/')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(response => {
                console.log('Attendance data loaded:', response);
                if (response.success) {
                    this.updateFromDjangoData(response);
                    this.renderWeeklyTable();
                    this.updateSummaryCards();
                } else {
                    this.showToast('Failed to load attendance data: ' + response.message, 'error');
                }
            })
            .catch(error => {
                console.error('Error loading attendance:', error);
                this.showToast('Error loading attendance data: ' + error.message, 'error');
            });
    }

    // attendance.js - Update the updateFromDjangoData method
updateFromDjangoData(djangoData) {
    if (!djangoData.success) {
        console.error('Django data error:', djangoData);
        return;
    }
    
    this.employees = [];
    this.attendanceRecords = {};
    
    if (djangoData.employees && Array.isArray(djangoData.employees)) {
        djangoData.employees.forEach(name => {
            const normalizedName = name.trim();
            if (normalizedName) {
                this.employees.push({
                    id: normalizedName.toLowerCase().replace(/\s+/g, '_'),
                    name: normalizedName,
                    joinDate: new Date().toISOString().split('T')[0],
                    active: true
                });
            }
        });
    }
    
    console.log('Processing attendance data:', djangoData.attendance_data);
    
    // Process attendance data
    if (djangoData.attendance_data) {
        for (const [key, value] of Object.entries(djangoData.attendance_data)) {
            // Key format: "EmployeeName_YYYY-MM-DD"
            const parts = key.split('_');
            if (parts.length >= 2) {
                const employeeName = parts[0];
                const date = parts.slice(1).join('_'); // Handle names with underscores
                
                console.log(`Processing: ${employeeName} on ${date} ->`, value);
                
                // Find the employee
                const employee = this.employees.find(e => e.name === employeeName);
                if (employee) {
                    if (!this.attendanceRecords[employee.id]) {
                        this.attendanceRecords[employee.id] = {};
                    }
                    
                    // Convert Django status to frontend format
                    let statusValue = '';
                    if (value.status === 'present') statusValue = '1';
                    else if (value.status === 'half_day') statusValue = '0.5';
                    else if (value.status === 'absent') statusValue = '0';
                    else statusValue = value.status || '';
                    
                    this.attendanceRecords[employee.id][date] = {
                        status: statusValue,
                        notes: value.notes || '',
                        id: value.id,
                        updatedAt: new Date().toISOString()
                    };
                    
                    console.log(`Set attendance for ${employee.name}: ${date} = ${statusValue}`);
                }
            }
        }
    }
    
    // Double-check that we have attendance data
    console.log('Final attendance records:', this.attendanceRecords);
    
    this.renderWeeklyTable();
    this.updateSummaryCards();
}

    // attendance.js - Update the processAttendanceRecord method
processAttendanceRecord(record) {
    const employee = this.employees.find(e => e.name === record.employee_name);
    if (employee) {
        if (!this.attendanceRecords[employee.id]) {
            this.attendanceRecords[employee.id] = {};
        }
        
        let statusValue = '';
        if (record.status === 'present') statusValue = '1';
        else if (record.status === 'half_day') statusValue = '0.5';
        else if (record.status === 'absent') statusValue = '0';
        else if (!record.status || record.status.trim() === '') {
            // Skip empty records
            return;
        }
        
        this.attendanceRecords[employee.id][record.date] = {
            status: statusValue,
            notes: record.notes || '',
            id: record.id,
            updatedAt: new Date().toISOString()
        };
    }
}

// attendance.js - Update the generateAttendanceSummary method
generateAttendanceSummary() {
    const fromDate = document.getElementById('filter-from-date').value;
    const toDate = document.getElementById('filter-to-date').value;
    
    if (!fromDate || !toDate) {
        this.showToast('Please select both from and to dates', 'error');
        return;
    }
    
    if (new Date(fromDate) > new Date(toDate)) {
        this.showToast('From date cannot be after to date', 'error');
        return;
    }
    
    const generateBtn = document.getElementById('generate-summary-btn');
    const originalText = generateBtn.innerHTML;
    generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
    generateBtn.disabled = true;
    
    // Fetch summary from Django
    fetch(`/get-attendance-summary/?from_date=${fromDate}&to_date=${toDate}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.renderAttendanceSummary(data);
                this.showToast('Summary generated successfully', 'success');
            } else {
                this.showToast('Error: ' + data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error generating summary:', error);
            this.showToast('Failed to generate summary', 'error');
        })
        .finally(() => {
            generateBtn.disabled = false;
            generateBtn.innerHTML = originalText;
        });
}

// attendance.js - Update the renderAttendanceSummary method
renderAttendanceSummary(data) {
    const tbody = document.getElementById('attendance-summary-body');
    const footer = document.getElementById('attendance-summary-footer');
    const dateRange = document.getElementById('summary-date-range');
    
    if (!tbody) return;
    
    
    // Clear existing rows
    tbody.innerHTML = '';
    
    if (!data.summary || data.summary.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4 text-muted">
                    <i class="fas fa-chart-bar fa-lg mb-2"></i>
                    <p>No attendance data found for selected period</p>
                </td>
            </tr>
        `;
        if (footer) footer.style.display = 'none';
        return;
    }
    
    // Render each employee's summary
    data.summary.forEach(item => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>
                <div class="fw-medium">${item.employee_name}</div>
            </td>
            <td class="text-center">
                <span class="badge bg-success">${item.present}</span>
            </td>
            <td class="text-center">
                <span class="badge bg-warning">${item.half_day}</span>
            </td>
            <td class="text-center">
                <span class="badge bg-danger">${item.absent}</span>
            </td>
            <td class="text-center fw-bold">
                ${item.full_days.toFixed(1)}
            </td>
            <td class="text-center">
                ${item.total_marked_days || 0} 
            </td>
        `;
        tbody.appendChild(row);
    });
    
}

    setupEventListeners() {
    console.log('Setting up event listeners...');

    // Add summary generation button listener
    const generateSummaryBtn = document.getElementById('generate-summary-btn');
    if (generateSummaryBtn) {
        generateSummaryBtn.addEventListener('click', () => {
            this.generateAttendanceSummary();
        });
    }
    
    // Set default dates (last 30 days)
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setDate(today.getDate() - 30);
    
    // Only set values if elements exist
    const fromDateInput = document.getElementById('filter-from-date');
    const toDateInput = document.getElementById('filter-to-date');
    
    if (fromDateInput) {
        fromDateInput.value = lastMonth.toISOString().split('T')[0];
    }
    if (toDateInput) {
        toDateInput.value = today.toISOString().split('T')[0];
    }
    
    // View Records Button
    const viewRecordsBtn = document.getElementById('view-records-btn');
    if (viewRecordsBtn) {
        console.log('Found view records button');
        viewRecordsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('View records button clicked');
            
            // Check which modal to open
            const summaryModal = document.getElementById('viewRecordsSummaryModal');
            const oldModal = document.getElementById('viewRecordsModal');
            
            if (summaryModal) {
                console.log('Opening summary modal');
                const modal = new bootstrap.Modal(summaryModal);
                modal.show();
                
                // Set default dates in the modal if they're not already set
                setTimeout(() => {
                    const modalFromDate = document.getElementById('filter-from-date');
                    const modalToDate = document.getElementById('filter-to-date');
                    
                    if (modalFromDate && !modalFromDate.value) {
                        modalFromDate.value = lastMonth.toISOString().split('T')[0];
                    }
                    if (modalToDate && !modalToDate.value) {
                        modalToDate.value = today.toISOString().split('T')[0];
                    }
                }, 100);
                
            } else if (oldModal) {
                console.log('Opening old records modal');
                this.openViewRecordsModal();
            } else {
                console.error('No records modal found!');
                this.showToast('Modal not found', 'error');
            }
        });
    } else {
        console.error('View records button not found!');
    }
    
    // Apply Filters in View Records
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

        // Setup update attendance button
        const updateAttendanceBtn = document.getElementById('update-attendance-btn');
        if (updateAttendanceBtn) {
            updateAttendanceBtn.addEventListener('click', () => {
                this.updateAttendance();
            });
        }

        // Setup delete attendance button
        const deleteAttendanceBtn = document.getElementById('delete-attendance-btn');
        if (deleteAttendanceBtn) {
            deleteAttendanceBtn.addEventListener('click', () => {
                this.deleteSingleAttendance();
            });
        }

        // Setup modal close handlers
        this.setupViewRecordsModalCloseHandlers();
        
        // Setup delete and edit handlers for dynamically created rows
        this.setupDynamicRowHandlers();
    }

    openAddEmployeeModal() {
        const modalElement = document.getElementById('newAddEmployeeModal');
        if (modalElement) {
            const newEmployeeForm = document.getElementById('newEmployeeForm');
            if (newEmployeeForm) newEmployeeForm.reset();
            
            // Try different ways to show modal
            try {
                // Method 1: Use vanilla Bootstrap
                const modal = new bootstrap.Modal(modalElement);
                modal.show();
                
                // Force focus to input after modal shows
                setTimeout(() => {
                    const nameInput = document.getElementById('newEmployeeName');
                    if (nameInput) nameInput.focus();
                }, 300);
                
            } catch (error) {
                console.error('Error showing modal:', error);
                // Method 2: Use jQuery if available
                if (typeof $ !== 'undefined') {
                    $(modalElement).modal('show');
                } else {
                    // Method 3: Manual show
                    modalElement.classList.add('show');
                    modalElement.style.display = 'block';
                    document.body.classList.add('modal-open');
                    
                    // Add backdrop
                    const backdrop = document.createElement('div');
                    backdrop.className = 'modal-backdrop fade show';
                    document.body.appendChild(backdrop);
                }
            }
        } else {
            console.error('Add employee modal not found!');
            this.showToast('Modal not found. Please check HTML structure.', 'error');
        }
    }

    saveNewAttendanceEmployee() {
        const nameInput = document.getElementById('newEmployeeName');
        const name = nameInput?.value.trim();
        
        if (!name) {
            this.showToast('Please enter employee name', 'error');
            return;
        }
        
        const saveBtn = document.getElementById('saveNewEmployeeBtn');
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
        saveBtn.disabled = true;
        
        fetch('/add-employee/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': this.getCSRFToken()
            },
            body: JSON.stringify({ employee_name: name })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.showToast(`Employee "${name}" added successfully`, 'success');
                
                const modalElement = document.getElementById('newAddEmployeeModal');
                if (modalElement) {
                    const modal = bootstrap.Modal.getInstance(modalElement);
                    if (modal) modal.hide();
                }
                
                nameInput.value = '';
                this.loadAttendanceFromDjango();
            } else {
                this.showToast('Error: ' + data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error adding employee:', error);
            this.showToast('Failed to add employee', 'error');
        })
        .finally(() => {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalText;
        });
    }

    setupAttendanceSelectListeners() {
        const tbody = document.getElementById('weekly-attendance-body');
        if (!tbody) return;
        
        // Use event delegation for dynamically created select elements
        tbody.addEventListener('change', (e) => {
            if (e.target.classList.contains('attendance-select')) {
                const select = e.target;
                const employeeId = select.dataset.employee;
                const date = select.dataset.date;
                const status = select.value;
                
                console.log('Attendance select changed:', {employeeId, date, status});
                if (employeeId && date && status) {
                    this.saveAttendanceToDjango(employeeId, date, status);
                }
            }
        });
    }

    setupDynamicRowHandlers() {
        const tbody = document.getElementById('weekly-attendance-body');
        if (!tbody) return;
        
        // Use event delegation for dynamically created edit/delete buttons
        tbody.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.edit-attendance-btn');
            const deleteBtn = e.target.closest('.delete-attendance-btn');
            const select = e.target.closest('.attendance-select');
            
            if (editBtn) {
                const employeeId = editBtn.dataset.employeeId;
                const row = editBtn.closest('tr');
                const todayCell = row.querySelector('.today-cell select');
                const date = todayCell ? todayCell.dataset.date : this.today;
                this.openEditAttendanceModal(employeeId, date);
            }
            
            if (deleteBtn) {
                const employeeId = deleteBtn.dataset.employeeId;
                const employeeName = deleteBtn.dataset.employeeName;
                this.deleteEmployeeAttendance(employeeId, employeeName);
            }
        });
    }

    // attendance.js - Update the saveAttendanceToDjango method
saveAttendanceToDjango(employeeId, date, status) {
    const employee = this.employees.find(e => e.id === employeeId);
    if (!employee) {
        console.error('Employee not found:', employeeId);
        this.showToast('Employee not found', 'error');
        return;
    }
    
    // Validate status
    if (!status || status.trim() === '') {
        console.log('Empty status, skipping save');
        return;
    }
    
    let djangoStatus = 'absent';
    if (status === '1') djangoStatus = 'present';
    else if (status === '0.5') djangoStatus = 'half_day';
    else if (status === '0') djangoStatus = 'absent';
    else {
        console.error('Invalid status:', status);
        this.showToast('Invalid attendance status', 'error');
        return;
    }
    
    // Get notes if available
    const attendanceRecord = this.getAttendance(employeeId, date);
    const notes = attendanceRecord ? attendanceRecord.notes : '';
    
    const attendanceData = {
        employee_name: employee.name,
        date: date,
        status: djangoStatus,
        notes: notes
    };
    
    console.log('Saving attendance:', attendanceData);
    
    fetch('/save-attendance/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': this.getCSRFToken()
        },
        body: JSON.stringify(attendanceData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (!this.attendanceRecords[employeeId]) {
                this.attendanceRecords[employeeId] = {};
            }
            this.attendanceRecords[employeeId][date] = {
                status: status,
                notes: data.notes || '',
                id: data.id,
                updatedAt: new Date().toISOString()
            };
            
            if (date === this.today) {
                this.updateSummaryCards();
            }
            
            this.showToast('Attendance saved successfully!', 'success');
        } else {
            this.showToast('Failed to save: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error saving attendance:', error);
        this.showToast('Network error saving attendance', 'error');
    });
}


    saveAllAttendance() {
        console.log('Saving all attendance...');
        let savedCount = 0;
        const attendanceSelects = document.querySelectorAll('.attendance-select');
        
        attendanceSelects.forEach(select => {
            const employeeId = select.dataset.employee;
            const date = select.dataset.date;
            const status = select.value;
            
            if (status && employeeId) {
                this.saveAttendanceToDjango(employeeId, date, status);
                savedCount++;
            }
        });
        
        this.showToast(`Attendance saved for ${savedCount} entries`, 'success');
        return savedCount;
    }

    getAttendance(employeeId, date) {
        if (!this.attendanceRecords[employeeId]) return null;
        return this.attendanceRecords[employeeId][date] || null;
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
        nameCell.innerHTML = `<div class="employee-name">${employee.name}</div>`;
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
                <select class="form-select form-select-sm attendance-select" 
                        data-date="${dateInfo.dateString}"
                        data-employee="${employee.id}">
                    <option value="">-</option>
                    <option value="1" ${currentStatus === '1' ? 'selected' : ''}>Present</option>
                    <option value="0.5" ${currentStatus === '0.5' ? 'selected' : ''}>Half-Day</option>
                    <option value="0" ${currentStatus === '0' ? 'selected' : ''}>Absent</option>
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
                        data-employee-id="${employee.id}"
                        data-employee-name="${employee.name}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        row.appendChild(actionsCell);
        
        return row;
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

    openEditAttendanceModal(employeeId, date = null) {
        const employee = this.employees.find(e => e.id === employeeId);
        if (!employee) {
            this.showToast('Employee not found', 'error');
            return;
        }

        const targetDate = date || this.today;
        const attendance = this.getAttendance(employeeId, targetDate);
        
        // Populate modal fields
        document.getElementById('edit-employee-id').value = employeeId;
        document.getElementById('edit-attendance-employee-name').value = employee.name;
        document.getElementById('edit-attendance-date').value = targetDate;
        
        // Set status (convert Django status to numeric value)
        let statusValue = '';
        if (attendance) {
            if (attendance.status === '1' || attendance.status === 'present') statusValue = '1';
            else if (attendance.status === '0.5' || attendance.status === 'half_day') statusValue = '0.5';
            else if (attendance.status === '0' || attendance.status === 'absent') statusValue = '0';
            else statusValue = attendance.status || '';
        } else {
            statusValue = '1'; // Default to present
        }
        
        document.getElementById('edit-attendance-status').value = statusValue;
        
        // Set notes if available
        const notesField = document.getElementById('edit-attendance-notes');
        if (notesField && attendance && attendance.notes) {
            notesField.value = attendance.notes;
        } else if (notesField) {
            notesField.value = '';
        }
        
        // Show modal
        const modalElement = document.getElementById('editAttendanceModal');
        if (modalElement) {
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
        }
    }

    updateAttendance() {
        const employeeId = document.getElementById('edit-employee-id').value;
        const employeeName = document.getElementById('edit-attendance-employee-name').value;
        const date = document.getElementById('edit-attendance-date').value;
        const statusSelect = document.getElementById('edit-attendance-status');
        const notes = document.getElementById('edit-attendance-notes')?.value || '';
        
        if (!employeeName || !date || !statusSelect) {
            this.showToast('Please fill all required fields', 'error');
            return;
        }
        
        const status = statusSelect.value;
        let djangoStatus = 'absent';
        if (status === '1') djangoStatus = 'present';
        else if (status === '0.5') djangoStatus = 'half_day';
        
        // Get the current attendance record to find its ID if exists
        const currentAttendance = this.getAttendance(employeeId, date);
        const attendanceId = currentAttendance ? currentAttendance.id : null;
        
        const updateBtn = document.getElementById('update-attendance-btn');
        const originalText = updateBtn.innerHTML;
        updateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
        updateBtn.disabled = true;
        
        const attendanceData = {
            id: attendanceId,
            employee_name: employeeName,
            date: date,
            status: djangoStatus,
            notes: notes
        };
        
        fetch('/edit-attendance/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': this.getCSRFToken()
            },
            body: JSON.stringify(attendanceData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.showToast('Attendance updated successfully!', 'success');
                
                // Update local data
                if (!this.attendanceRecords[employeeId]) {
                    this.attendanceRecords[employeeId] = {};
                }
                
                this.attendanceRecords[employeeId][date] = {
                    status: status,
                    notes: data.notes || '',
                    id: data.id,
                    updatedAt: new Date().toISOString()
                };
                
                // Update the UI immediately
                this.updateAttendanceInUI(employeeId, date, status);
                
                // Update summary if it's today
                if (date === this.today) {
                    this.updateSummaryCards();
                }
                
                // Close modal
                const modalElement = document.getElementById('editAttendanceModal');
                if (modalElement) {
                    const modal = bootstrap.Modal.getInstance(modalElement);
                    if (modal) modal.hide();
                }
            } else {
                this.showToast('Failed to update: ' + data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error updating attendance:', error);
            this.showToast('Network error updating attendance', 'error');
        })
        .finally(() => {
            updateBtn.disabled = false;
            updateBtn.innerHTML = originalText;
        });
    }

    updateAttendanceInUI(employeeId, date, status) {
        // Find the select element for this employee and date
        const select = document.querySelector(`.attendance-select[data-employee="${employeeId}"][data-date="${date}"]`);
        if (select) {
            select.value = status;
            
            // Add visual feedback
            select.classList.add('updated-cell');
            select.style.backgroundColor = '#d4edda';
            select.style.transition = 'background-color 0.5s ease';
            
            setTimeout(() => {
                select.style.backgroundColor = '';
                select.classList.remove('updated-cell');
            }, 1000);
        }
        
        // Also update the records table if it's open
        this.updateRecordsTableIfOpen();
    }

    updateRecordsTableIfOpen() {
        const modal = document.getElementById('viewRecordsModal');
        if (modal && modal.classList.contains('show')) {
            this.renderRecordsTable();
        }
    }

    deleteSingleAttendance() {
        const employeeId = document.getElementById('edit-employee-id').value;
        const employeeName = document.getElementById('edit-attendance-employee-name').value;
        const date = document.getElementById('edit-attendance-date').value;
        
        if (!confirm(`Are you sure you want to delete attendance for "${employeeName}" on ${date}?`)) {
            return;
        }
        
        // Find the current attendance record
        const currentAttendance = this.getAttendance(employeeId, date);
        if (!currentAttendance || !currentAttendance.id) {
            this.showToast('No attendance record found to delete', 'error');
            return;
        }
        
        fetch('/delete-attendance/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': this.getCSRFToken()
            },
            body: JSON.stringify({ id: currentAttendance.id })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.showToast('Attendance record deleted', 'success');
                
                // Remove from local data
                if (this.attendanceRecords[employeeId] && this.attendanceRecords[employeeId][date]) {
                    delete this.attendanceRecords[employeeId][date];
                }
                
                // Update UI
                const select = document.querySelector(`.attendance-select[data-employee="${employeeId}"][data-date="${date}"]`);
                if (select) {
                    select.value = '';
                }
                
                // Update summary if it's today
                if (date === this.today) {
                    this.updateSummaryCards();
                }
                
                // Update records table if open
                this.updateRecordsTableIfOpen();
                
                // Close modal
                const modalElement = document.getElementById('editAttendanceModal');
                if (modalElement) {
                    const modal = bootstrap.Modal.getInstance(modalElement);
                    if (modal) modal.hide();
                }
            } else {
                this.showToast('Error: ' + data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error deleting attendance:', error);
            this.showToast('Failed to delete attendance', 'error');
        });
    }

    deleteEmployeeAttendance(employeeId, employeeName) {
        if (confirm(`Are you sure you want to delete all attendance records for "${employeeName}"?`)) {
            const row = document.querySelector(`.delete-attendance-btn[data-employee-id="${employeeId}"]`)?.closest('tr');
            if (row) {
                row.style.opacity = '0.5';
                row.style.backgroundColor = '#fff5f5';
            }
            
            fetch('/delete-employee-attendance/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCSRFToken()
                },
                body: JSON.stringify({ employee_name: employeeName })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    if (row) {
                        row.style.transition = 'all 0.3s ease';
                        row.style.opacity = '0';
                        row.style.height = '0';
                        row.style.padding = '0';
                        row.style.margin = '0';
                        row.style.overflow = 'hidden';
                        
                        setTimeout(() => {
                            if (row.parentNode) {
                                row.remove();
                            }
                            this.updateSummaryCards();
                        }, 300);
                    }
                    
                    this.employees = this.employees.filter(e => e.id !== employeeId);
                    delete this.attendanceRecords[employeeId];
                    
                    this.showToast(data.message, 'success');
                } else {
                    this.showToast('Error: ' + data.message, 'error');
                    if (row) {
                        row.style.opacity = '1';
                        row.style.backgroundColor = '';
                    }
                }
            })
            .catch(error => {
                console.error('Error deleting employee attendance:', error);
                this.showToast('Failed to delete employee attendance', 'error');
                if (row) {
                    row.style.opacity = '1';
                    row.style.backgroundColor = '';
                }
            });
        }
    }

    openViewRecordsModal() {
        console.log('Opening view records modal...');
        this.populateFilterOptions();
        this.renderRecordsTable();
        
        const modalElement = document.getElementById('viewRecordsModal');
        if (!modalElement) {
            console.error('View Records Modal not found!');
            return;
        }
        
        const modal = new bootstrap.Modal(modalElement, {
            backdrop: true,
            keyboard: true,
            focus: true
        });
        
        modal.show();
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
            const today = new Date().toISOString().split('T')[0];
            dateFilter.value = today;
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
                
                // Skip if status is empty (not marked)
            if (!record.status || record.status.trim() === '') {
                continue;
            }

                if (filters.date && date !== filters.date) continue;
                if (filters.employeeId && employeeId !== filters.employeeId) continue;
                
                allRecords.push({
                    id: record.id || `${employeeId}_${date}`,
                    employeeId: employeeId,
                    employeeName: employee.name,
                    date: date,
                    displayDate: this.formatDisplayDate(date),
                    status: record.status,
                    notes: record.notes || ''
                });
            }
        }
        
        allRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (allRecords.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4 text-muted">
                        <i class="fas fa-search fa-lg mb-2"></i>
                        <p>No attendance records found</p>
                        ${filters.date || filters.employeeId ? 
                            '<small class="text-muted">Try changing your filter criteria</small>' : 
                            '<small class="text-muted">No attendance recorded yet</small>'}
                    </td>
                </tr>
            `;
            return;
        }
        
        allRecords.forEach(record => {
            const row = document.createElement('tr');
            row.setAttribute('data-record-id', record.id);
            
            const statusText = record.status === '1' ? 'Present' : 
                             record.status === '0.5' ? 'Half Day' : 'Absent';
            const statusClass = record.status === '1' ? 'status-present' : 
                              record.status === '0.5' ? 'status-halfday' : 'status-absent';
            
            // Add notes display with conditional visibility
            const notesDisplay = record.notes ? 
                `<div class="notes-preview" title="${record.notes}">
                    <i class="fas fa-sticky-note text-muted me-1"></i>
                    ${record.notes.length > 30 ? record.notes.substring(0, 30) + '...' : record.notes}
                </div>` : 
                '<span class="text-muted small">No notes</span>';
            
            row.innerHTML = `
                <td>${record.employeeName}</td>
                <td>${record.displayDate}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>${notesDisplay}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary edit-record-btn" 
                            data-employee-id="${record.employeeId}"
                            data-date="${record.date}">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        // Add event listeners for edit buttons in records table
        tbody.querySelectorAll('.edit-record-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const employeeId = btn.dataset.employeeId;
                const date = btn.dataset.date;
                this.openEditAttendanceModal(employeeId, date);
                
                // Close the records modal
                const recordsModal = bootstrap.Modal.getInstance(document.getElementById('viewRecordsModal'));
                if (recordsModal) {
                    recordsModal.hide();
                }
            });
        });
    }

    setupViewRecordsModalCloseHandlers() {
        const modalElement = document.getElementById('viewRecordsModal');
        if (modalElement) {
            const footerCloseBtn = document.getElementById('close-view-records-btn');
            if (footerCloseBtn) {
                footerCloseBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const modalInstance = bootstrap.Modal.getInstance(modalElement);
                    if (modalInstance) modalInstance.hide();
                });
            }
            
            modalElement.addEventListener('hidden.bs.modal', () => {
                const dateFilter = document.getElementById('filter-date');
                const employeeFilter = document.getElementById('filter-employee');
                if (dateFilter) dateFilter.value = '';
                if (employeeFilter) employeeFilter.value = '';
                
                const tbody = document.getElementById('records-table-body');
                if (tbody) tbody.innerHTML = '';
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