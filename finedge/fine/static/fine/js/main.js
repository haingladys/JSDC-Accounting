// main.js
// Enhanced JSDC Accounting Application - Main Entry Point
class JSDCApplication {
    constructor() {
        this.attendanceEmployees = [];
        this.payrollEmployees = [];
        this.currentMonth = 4; // April
        this.currentYear = 2024;
        this.isProcessing = false;
        this.incomeManager = null;
        
        // Chart instances
        this.financialChart = null;
        this.cashFlowChart = null;

        // Shift configuration
        this.SHIFT_CONFIG = {
            morning: { start: '06:00', end: '14:00' },
            afternoon: { start: '14:00', end: '22:00' },
            evening: { start: '22:00', end: '06:00' }
        };

        // Purchase and Expense Application State
        this.AppState = {
            purchases: [],
            editingPurchaseId: null,
            expenses: [],
            editingExpenseId: null
        };

        this.initializeApplication();
    }

    initializeApplication() {
        try {
            this.clearConflictingData();
            this.initializeBootstrapComponents();
            this.fixModalBackdrop();
            this.initializeDatePicker();
            
            // Generate forms with proper layout
            this.generateAddEmployeeForm();
            this.generateEditEmployeeForm();
            this.generateAttendanceEmployeeForm();

            this.setupEventListeners();
            this.setupNavigation();
            this.setupPayrollModals();
            this.initializeCharts();
            
            // Initialize systems
            this.initializePurchaseSystem();
            this.initializeExpenseSystem();
            
            // Initialize Income Manager
            this.incomeManager = new IncomeManager();
            
            // Initialize Category System
            CategoryManager.initialize();
            
            // Show dashboard by default
            this.navigateToPage('dashboard');
            
            console.log('Application initialized successfully');
        } catch (error) {
            console.error('Application initialization failed:', error);
            this.showToast('Application initialization failed. Please refresh the page.', 'error');
        }
    }

    clearConflictingData() {
        console.log('Cleared conflicting localStorage data');
    }

    initializeBootstrapComponents() {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function(tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
        console.log('Bootstrap components initialized');
    }

    fixModalBackdrop() {
        document.addEventListener('hidden.bs.modal', function(event) {
            const backdrops = document.querySelectorAll('.modal-backdrop');
            if (backdrops.length > 1) {
                backdrops.forEach((backdrop, index) => {
                    if (index > 0) {
                        backdrop.remove();
                    }
                });
            }
            
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        });
    }

    initializeDatePicker() {
        if (typeof $ !== 'undefined' && $.fn.datepicker) {
            $('.datepicker').datepicker({
                format: 'dd/mm/yyyy',
                autoclose: true,
                todayHighlight: true
            });
        }
    }

    initializeCharts() {
        this.financialChart = this.initFinancialChart();
        this.cashFlowChart = this.initCashFlowChart();
    }

    setupEventListeners() {
        console.log('Setting up event listeners');
        
        // Setup global event listeners
        this.setupPayrollEventListeners();
        this.setupAttendanceEventListeners();
        this.setupChartEventListeners();
        this.setupPurchaseEventListeners();
        this.setupExpenseEventListeners();
        this.setupGlobalEventListeners();
        this.setupTotalCalculationListeners();
    }

    setupGlobalEventListeners() {
        const quickAddBtn = document.getElementById('quick-add');
        if (quickAddBtn) {
            quickAddBtn.addEventListener('click', () => {
                this.showToast('Quick add functionality triggered');
            });
        }

        const dateRangeBtn = document.getElementById('date-range-btn');
        if (dateRangeBtn) {
            dateRangeBtn.addEventListener('click', () => {
                this.showToast('Date range selector opened');
            });
        }
    }

    setupNavigation() {
        console.log('Setting up navigation');
        
        // Navigation links
        const navLinks = document.querySelectorAll('.nav-link[data-page]');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const pageName = link.getAttribute('data-page');
                this.navigateToPage(pageName);
            });
        });
    }

    setupPayrollModals() {
        console.log('Setting up payroll modals');
        
        // Add Employee Modal
        const addEmployeeModal = document.getElementById('addEmployeeModal');
        if (addEmployeeModal) {
            addEmployeeModal.addEventListener('show.bs.modal', () => {
                console.log('Add Employee modal opening');
                this.updateTotalDays();
            });
        }
    }

    navigateToPage(pageName) {
        console.log(`Navigating to page: ${pageName}`);
        const pages = document.querySelectorAll('.page');
        const navLinks = document.querySelectorAll('.nav-link');
        
        // Hide all pages
        pages.forEach(page => {
            page.style.display = 'none';
        });
        
        // Show selected page
        const pageId = pageName + '-page';
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.style.display = 'block';
            targetPage.classList.add('animate-fade');
            
            // Initialize specific page functionality
            if (pageName === 'attendance') {
                AttendanceManager.initialize();
            } else if (pageName === 'payroll') {
                PayrollManager.initialize();
            } else if (pageName === 'purchases') {
                PurchaseManager.initialize();
            } else if (pageName === 'expenses') {
                ExpenseManager.initialize();
            } else if (pageName === 'income') {
                if (this.incomeManager) {
                    this.incomeManager.updateAllDisplays();
                }
            }
        }
        
        // Update active nav link
        navLinks.forEach(nav => {
            nav.classList.remove('active');
            if (nav.getAttribute('data-page') === pageName) {
                nav.classList.add('active');
            }
        });
    }

    // UTILITY FUNCTIONS
    getTotalDaysInMonth(month, year) {
        return new Date(year, month, 0).getDate();
    }

    getMonthName(monthNumber) {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return months[monthNumber - 1] || 'Unknown';
    }

    generateYearOptions() {
        const yearSelect = document.getElementById('yearSelect');
        if (!yearSelect) return;
        
        const currentYear = new Date().getFullYear();
        yearSelect.innerHTML = '';
        
        for (let year = 2020; year <= 2030; year++) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            if (year === currentYear) {
                option.selected = true;
            }
            yearSelect.appendChild(option);
        }
    }

    updateTotalDays() {
        const totalDays = this.getTotalDaysInMonth(this.currentMonth, this.currentYear);
        const monthTotalDaysEl = document.getElementById('month-total-days');
        const editMonthTotalDaysEl = document.getElementById('edit-month-total-days');
        
        if (monthTotalDaysEl) monthTotalDaysEl.textContent = totalDays;
        if (editMonthTotalDaysEl) editMonthTotalDaysEl.textContent = totalDays;
    }

    changePayrollPeriod(month, year) {
        this.currentMonth = month;
        this.currentYear = year;
        
        if (window.PayrollManager) {
            PayrollManager.updateEmployeeTable();
            PayrollManager.updatePayrollStats();
        }
        
        this.updateTotalDays();
        
        console.log(`Payroll period changed to: ${this.getMonthName(month)} ${year}`);
    }

    showToast(message, type = 'success') {
        const toastEl = document.getElementById('successToast');
        const toastMessage = document.getElementById('toast-message');
        
        if (toastEl && toastMessage) {
            const toastHeader = toastEl.querySelector('.toast-header');
            if (toastHeader) {
                toastHeader.className = 'toast-header';
                toastHeader.classList.add(`bg-${type}`, 'text-white');
            }
            
            toastMessage.textContent = message;
            const toast = new bootstrap.Toast(toastEl);
            toast.show();
        }
    }

    // CHART FUNCTIONS
    initFinancialChart() {
        const ctx = document.getElementById('financialChart');
        if (!ctx) return null;
        
        try {
            return new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [
                        {
                            label: 'Income',
                            data: [65000, 72000, 81000, 78000, 85000, 92000],
                            borderColor: '#4cc9f0',
                            backgroundColor: 'rgba(76, 201, 240, 0.1)',
                            tension: 0.4,
                            fill: true
                        },
                        {
                            label: 'Expenses',
                            data: [28000, 32000, 32700, 31000, 35000, 38000],
                            borderColor: '#f72585',
                            backgroundColor: 'rgba(247, 37, 133, 0.1)',
                            tension: 0.4,
                            fill: true
                        }
                    ]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return '₹' + value.toLocaleString();
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error initializing financial chart:', error);
            return null;
        }
    }

    initCashFlowChart() {
        const ctx = document.getElementById('cashFlowChart');
        if (!ctx) return null;
        
        try {
            return new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Income', 'Expenses', 'Investments'],
                    datasets: [{
                        data: [65, 25, 10],
                        backgroundColor: [
                            '#4cc9f0',
                            '#f72585',
                            '#f8961e'
                        ],
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error initializing cash flow chart:', error);
            return null;
        }
    }

    updateChartPeriod(period) {
        console.log('Chart period updated to:', period);
    }

    // Utility function for date formatting
    formatDate(dateString) {
        const options = { day: '2-digit', month: 'short', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-IN', options);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - initializing enhanced JSDC application');
    
    // Initialize the main application
    window.jsdcApp = new JSDCApplication();
    
    // Initialize Login Manager
    if (typeof LoginManager !== 'undefined') {
        window.loginManager = new LoginManager();
    }
});