// dashboard.js - Dashboard page specific logic
document.addEventListener("DOMContentLoaded", function () {
    // Check if we're on dashboard page
    const dashboardPage = document.getElementById('dashboard-page');
    if (!dashboardPage) return;
    
    // dashboard.js - JSDC Dashboard Module
class DashboardManager {
    constructor(app) {
        this.app = app;
        this.financialChart = null;
        this.cashFlowChart = null;
        
        this.init();
    }

    init() {
        this.initializeCharts();
        this.setupChartEventListeners();
        this.setupNavigation();
        this.initializeDatePicker();
    }

    initializeCharts() {
        this.financialChart = this.initFinancialChart();
        this.cashFlowChart = this.initCashFlowChart();
    }

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

    setupChartEventListeners() {
        const chartPeriodBtns = document.querySelectorAll('#chart-period button');
        chartPeriodBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                chartPeriodBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.updateChartPeriod(btn.getAttribute('data-period'));
            });
        });
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link[data-page]');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const pageName = link.getAttribute('data-page');
                this.navigateToPage(pageName);
            });
        });
    }

    navigateToPage(pageName) {
        const pages = document.querySelectorAll('.page');
        const navLinks = document.querySelectorAll('.nav-link');
        
        pages.forEach(page => {
            page.style.display = 'none';
            page.classList.remove('active');
        });
        
        const pageId = pageName + '-page';
        const targetPage = document.getElementById(pageId);
        
        if (targetPage) {
            targetPage.style.display = 'block';
            targetPage.classList.add('active');
            targetPage.classList.add('animate-fade');
            
            switch (pageName) {
                case 'dashboard':
                    this.refreshDashboard();
                    break;
                case 'payroll':
                    if (window.payrollManager) {
                        window.payrollManager.loadPayrollFromDjango();
                    }
                    break;
                case 'attendance':
                    if (window.attendanceManager) {
                        window.attendanceManager.loadAttendanceFromDjango();
                    }
                    break;
                case 'reports':
                    this.initializeReports();
                    break;
            }
        }
        
        navLinks.forEach(nav => {
            nav.classList.remove('active');
            if (nav.getAttribute('data-page') === pageName) {
                nav.classList.add('active');
            }
        });
    }

    refreshDashboard() {
        if (this.financialChart) {
            this.financialChart.update();
        }
        if (this.cashFlowChart) {
            this.cashFlowChart.update();
        }
        
        this.updateDashboardStats();
    }

    updateDashboardStats() {
        // Update dashboard statistics here
        const stats = {
            totalIncome: 125000,
            totalExpenses: 75000,
            netProfit: 50000,
            activeEmployees: 15
        };
        
        this.setTextContent('dashboard-income', `₹${stats.totalIncome.toLocaleString()}`);
        this.setTextContent('dashboard-expenses', `₹${stats.totalExpenses.toLocaleString()}`);
        this.setTextContent('dashboard-profit', `₹${stats.netProfit.toLocaleString()}`);
        this.setTextContent('dashboard-employees', stats.activeEmployees.toString());
    }

    initializeReports() {
        if (!window.reportGenerator) {
            const dataSources = {
                expense: () => this.getExpenseReportData(),
                purchase: () => this.getPurchaseReportData(),
                income: () => this.getIncomeReportData(),
                payroll: () => this.getPayrollReportData(),
                attendance: () => this.getAttendanceReportData()
            };
            
            const config = {
                dataSources: dataSources,
                currencySymbol: '₹',
                defaultDateFormat: 'DD-MMM-YYYY'
            };
            
            try {
                window.reportGenerator = new ReportGenerator(config);
            } catch (error) {
                console.error('Failed to initialize ReportGenerator:', error);
                this.app.showToast('Failed to initialize reports module', 'error');
            }
        }
    }

    getExpenseReportData() {
        return []; // To be implemented with actual data
    }

    getPurchaseReportData() {
        return []; // To be implemented with actual data
    }

    getIncomeReportData() {
        if (window.incomeManager && window.incomeManager.getAllIncomeRecords) {
            return window.incomeManager.getAllIncomeRecords();
        }
        return [];
    }

    getPayrollReportData() {
        if (window.payrollManager) {
            return window.payrollManager.payrollEmployees.map(employee => ({
                id: employee.id,
                date: employee.salaryDate || new Date().toISOString().split('T')[0],
                employee: employee.name,
                basicPay: parseFloat(employee.basicSalary) || 0,
                sprAmount: parseFloat(employee.sprAmount) || 0,
                advances: parseFloat(employee.advances) || 0,
                netSalary: employee.basicSalary + employee.sprAmount - employee.advances,
                status: employee.status,
                month: this.getMonthName(employee.month),
                year: employee.year
            }));
        }
        return [];
    }

    getAttendanceReportData() {
        if (window.attendanceManager) {
            const records = [];
            
            for (const employeeId in window.attendanceManager.attendanceRecords) {
                const employee = window.attendanceManager.employees.find(e => e.id === employeeId);
                if (!employee) continue;
                
                for (const date in window.attendanceManager.attendanceRecords[employeeId]) {
                    const record = window.attendanceManager.attendanceRecords[employeeId][date];
                    
                    let statusDisplay = 'Unknown';
                    if (record.status === '1') statusDisplay = 'Present';
                    else if (record.status === '0.5') statusDisplay = 'Half Day';
                    else if (record.status === '0') statusDisplay = 'Absent';
                    
                    records.push({
                        employeeId: employeeId,
                        employee: employee.name,
                        date: date,
                        status: statusDisplay,
                        type: 'attendance'
                    });
                }
            }
            
            return records;
        }
        return [];
    }

    getMonthName(monthNumber) {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return months[monthNumber - 1] || 'Unknown';
    }

    updateChartPeriod(period) {
        console.log('Chart period updated to:', period);
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

    setTextContent(id, text) {
        const element = document.getElementById(id);
        if (element) element.textContent = text;
    }
}
});