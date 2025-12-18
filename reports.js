// reports.js - Reports page specific logic
document.addEventListener("DOMContentLoaded", function () {
    // Check if we're on reports page
    const reportsPage = document.getElementById('reports-page');
    if (!reportsPage) return;
    
    // ReportGenerator class - for reports page only
    class ReportGenerator {
        constructor(config = {}) {
            this.config = {
                dataSources: config.dataSources || {},
                defaultDateFormat: 'DD-MMM-YYYY',
                currencySymbol: '₹',
                ...config
            };
            
            this.elements = {
                reportCards: document.querySelectorAll('.report-card'),
                startDateInput: document.getElementById('report-start-date'),
                endDateInput: document.getElementById('report-end-date'),
                reportPlaceholder: document.querySelector('.report-placeholder'),
                reportDisplayActions: document.querySelector('.report-display-actions'),
                reportTitle: document.querySelector('.report-title'),
                reportContent: document.querySelector('.report-content'),
                printBtn: document.getElementById('print-report-btn'),
                pdfBtn: document.getElementById('export-report-pdf-btn'),
                excelBtn: document.getElementById('export-report-excel-btn'),
                profitLossReport: document.getElementById('profit-loss-report'),
                cashFlowReport: document.getElementById('cash-flow-report'),
                plDateRange: document.getElementById('pl-date-range'),
                plGeneratedDate: document.getElementById('pl-generated-date'),
                plPeriod: document.getElementById('pl-period'),
                plTotalIncome: document.getElementById('pl-total-income'),
                plTotalExpenses: document.getElementById('pl-total-expenses'),
                plNetProfit: document.getElementById('pl-net-profit'),
                plBreakdownTable: document.getElementById('pl-breakdown-table'),
                expensePieChart: document.getElementById('expensePieChart')
            };
            
            this.state = {
                currentReport: null,
                currentData: [],
                filters: {
                    startDate: null,
                    endDate: null,
                    sector: null
                },
                charts: {}
            };
            
            this.init();
        }
        
        init() {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 30);
            
            if (this.elements.startDateInput) {
                this.elements.startDateInput.valueAsDate = startDate;
            }
            if (this.elements.endDateInput) {
                this.elements.endDateInput.valueAsDate = endDate;
            }
            
            this.state.filters.startDate = startDate;
            this.state.filters.endDate = endDate;
            
            this.bindEvents();
            this.initCharts();
        }
        
        bindEvents() {
            if (this.elements.reportCards && this.elements.reportCards.length > 0) {
                this.elements.reportCards.forEach(card => {
                    const viewBtn = card.querySelector('.view-report-btn');
                    const exportBtn = card.querySelector('.export-report-btn');
                    
                    if (viewBtn) {
                        viewBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            const reportType = card.dataset.report;
                            this.generateReport(reportType);
                        });
                    }
                    
                    if (exportBtn) {
                        exportBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            const reportType = card.dataset.report;
                            this.quickExport(reportType);
                        });
                    }
                });
            }
            
            if (this.elements.startDateInput) {
                this.elements.startDateInput.addEventListener('change', () => this.updateFilters());
            }
            
            if (this.elements.endDateInput) {
                this.elements.endDateInput.addEventListener('change', () => this.updateFilters());
            }
            
            if (this.elements.printBtn) {
                this.elements.printBtn.addEventListener('click', () => this.printReport());
            }
            
            if (this.elements.pdfBtn) {
                this.elements.pdfBtn.addEventListener('click', () => this.exportAsPDF());
            }
            
            if (this.elements.excelBtn) {
                this.elements.excelBtn.addEventListener('click', () => this.exportAsExcel());
            }
        }
        
        initCharts() {
            if (this.elements.expensePieChart) {
                const ctx = this.elements.expensePieChart.getContext('2d');
                this.state.charts.expensePie = new Chart(ctx, {
                    type: 'pie',
                    data: {
                        labels: ['Loading...'],
                        datasets: [{
                            data: [100],
                            backgroundColor: ['#e2e8f0']
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                position: 'bottom',
                            },
                            tooltip: {
                                callbacks: {
                                    label: (context) => {
                                        const label = context.label || '';
                                        const value = context.raw || 0;
                                        return `${label}: ${this.config.currencySymbol}${value}`;
                                    }
                                }
                            }
                        }
                    }
                });
            }
        }
        
        updateFilters() {
            this.state.filters.startDate = this.elements.startDateInput.value ?
                new Date(this.elements.startDateInput.value) : null;
            this.state.filters.endDate = this.elements.endDateInput.value ?
                new Date(this.elements.endDateInput.value) : null;
            
            if (this.state.currentReport) {
                this.generateReport(this.state.currentReport);
            }
        }
        
        async generateReport(reportType) {
            try {
                this.showLoading();
                this.state.currentReport = reportType;
                
                const data = await this.fetchReportData(reportType);
                this.state.currentData = data;
                
                if (this.elements.reportPlaceholder) {
                    this.elements.reportPlaceholder.style.display = 'none';
                }
                if (this.elements.reportDisplayActions) {
                    this.elements.reportDisplayActions.style.display = 'flex';
                }
                
                if (this.elements.reportTitle) {
                    this.elements.reportTitle.textContent = `${this.formatReportName(reportType)} Report`;
                }
                
                this.renderReport(reportType, data);
                this.showToast(`${this.formatReportName(reportType)} report generated successfully`);
                
            } catch (error) {
                console.error('Error generating report:', error);
                this.showError('Failed to generate report. Please try again.');
                this.showPlaceholder();
            }
        }
        
        async fetchReportData(reportType) {
            if (!this.config.dataSources[reportType]) {
                return this.generateMockData(reportType);
            }
            
            const dataSource = this.config.dataSources[reportType];
            
            if (typeof dataSource === 'function') {
                return await dataSource(this.state.filters);
            } else if (Array.isArray(dataSource)) {
                return this.filterData(dataSource, this.state.filters);
            } else {
                throw new Error(`Invalid data source for ${reportType} report`);
            }
        }
        
        filterData(data, filters) {
            return data.filter(item => {
                if (filters.startDate && filters.endDate && item.date) {
                    const itemDate = new Date(item.date);
                    if (itemDate < filters.startDate || itemDate > filters.endDate) {
                        return false;
                    }
                }
                
                if (filters.sector && item.sector !== filters.sector) {
                    return false;
                }
                
                return true;
            });
        }
        
        generateMockData(reportType) {
            const mockData = {
                expense: this.generateExpenseData(),
                purchase: this.generatePurchaseData(),
                income: this.generateIncomeData(),
                payroll: this.generatePayrollData(),
                attendance: this.generateAttendanceData()
            };
            
            return mockData[reportType] || [];
        }
        
        renderReport(reportType, data) {
            const reportContents = document.querySelectorAll('.report-content');
            reportContents.forEach(el => {
                el.style.display = 'none';
            });
            
            switch(reportType) {
                case 'expense':
                    this.renderExpenseReport(data);
                    break;
                case 'purchase':
                    this.renderPurchaseReport(data);
                    break;
                case 'income':
                    this.renderIncomeReport(data);
                    break;
                case 'payroll':
                    this.renderPayrollReport(data);
                    break;
                case 'attendance':
                    this.renderAttendanceReport(data);
                    break;
                default:
                    this.renderGenericReport(reportType, data);
            }
        }
        
        renderExpenseReport(data) {
            if (this.elements.profitLossReport) {
                this.elements.profitLossReport.style.display = 'block';
                
                const totals = this.calculateExpenseTotals(data);
                
                if (this.elements.plTotalIncome) {
                    this.elements.plTotalIncome.textContent = `${this.config.currencySymbol}${totals.totalIncome.toLocaleString()}`;
                }
                if (this.elements.plTotalExpenses) {
                    this.elements.plTotalExpenses.textContent = `${this.config.currencySymbol}${totals.totalExpenses.toLocaleString()}`;
                }
                if (this.elements.plNetProfit) {
                    this.elements.plNetProfit.textContent = `${this.config.currencySymbol}${totals.netProfit.toLocaleString()}`;
                }
                
                const startDate = this.formatDate(this.state.filters.startDate);
                const endDate = this.formatDate(this.state.filters.endDate);
                if (this.elements.plDateRange) {
                    this.elements.plDateRange.textContent = `Date Range: ${startDate} to ${endDate}`;
                }
                if (this.elements.plGeneratedDate) {
                    this.elements.plGeneratedDate.textContent = this.formatDate(new Date());
                }
                if (this.elements.plPeriod) {
                    this.elements.plPeriod.textContent = `${startDate} - ${endDate}`;
                }
                
                this.renderExpenseBreakdownTable(data);
                this.updateExpensePieChart(totals.categoryBreakdown);
            }
        }
        
        renderPurchaseReport(data) {
            this.createDynamicReport('purchase', data, [
                { key: 'date', label: 'Date' },
                { key: 'vendor', label: 'Vendor' },
                { key: 'category', label: 'Category' },
                { key: 'amount', label: 'Amount' },
                { key: 'status', label: 'Status' }
            ]);
        }
        
        renderIncomeReport(data) {
            this.createDynamicReport('income', data, [
                { key: 'date', label: 'Date' },
                { key: 'source', label: 'Source' },
                { key: 'category', label: 'Category' },
                { key: 'amount', label: 'Amount' },
                { key: 'paymentMethod', label: 'Payment Method' }
            ]);
        }
        
        renderPayrollReport(data) {
            this.createDynamicReport('payroll', data, [
                { key: 'employee', label: 'Employee' },
                { key: 'basicPay', label: 'Basic Pay' },
                { key: 'deductions', label: 'Deductions' },
                { key: 'netSalary', label: 'Net Salary' },
                { key: 'status', label: 'Status' }
            ]);
        }
        
        renderAttendanceReport(data) {
            this.createDynamicReport('attendance', data, [
                { key: 'employee', label: 'Employee' },
                { key: 'date', label: 'Date' },
                { key: 'status', label: 'Status' },
                { key: 'hours', label: 'Hours' },
                { key: 'remarks', label: 'Remarks' }
            ]);
        }
        
        createDynamicReport(reportType, data, columns) {
            let container = document.getElementById(`${reportType}-report`);
            
            if (!container) {
                container = document.createElement('div');
                container.id = `${reportType}-report`;
                container.className = 'report-content';
                if (this.elements.reportContent) {
                    this.elements.reportContent.parentNode.appendChild(container);
                }
            }
            
            container.style.display = 'block';
            
            const summary = this.calculateReportSummary(data, reportType);
            
            container.innerHTML = `
                <div class="report-header mb-4">
                    <div class="row">
                        <div class="col-md-6">
                            <h3>${this.formatReportName(reportType)} Report</h3>
                            <p class="text-muted">Date Range: ${this.formatDate(this.state.filters.startDate)} to ${this.formatDate(this.state.filters.endDate)}</p>
                        </div>
                        <div class="col-md-6 text-end">
                            <p class="mb-1">Generated on: ${this.formatDate(new Date())}</p>
                            <p class="mb-0">Total Records: ${data.length}</p>
                        </div>
                    </div>
                </div>
                
                ${summary ? `
                <div class="report-summary-cards mb-4">
                    <div class="row g-3">
                        ${summary.map((item, index) => `
                        <div class="col-md-${12 / summary.length}">
                            <div class="card summary-card">
                                <div class="card-body">
                                    <h6 class="text-muted mb-2">${item.label}</h6>
                                    <h3>${this.config.currencySymbol}${item.value.toLocaleString()}</h3>
                                </div>
                            </div>
                        </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                <div class="report-body">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">${this.formatReportName(reportType)} Details</h5>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-hover report-table">
                                    <thead>
                                        <tr>
                                            ${columns.map(col => `<th>${col.label}</th>`).join('')}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${data.slice(0, 50).map(item => `
                                        <tr>
                                            ${columns.map(col => `<td>${item[col.key] || '-'}</td>`).join('')}
                                        </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        renderGenericReport(reportType, data) {
            if (data.length > 0) {
                const sampleItem = data[0];
                const columns = Object.keys(sampleItem).map(key => ({
                    key,
                    label: this.formatColumnName(key)
                }));
                this.createDynamicReport(reportType, data, columns);
            } else {
                this.createDynamicReport(reportType, data, [
                    { key: 'noData', label: 'No Data Available' }
                ]);
            }
        }
        
        renderExpenseBreakdownTable(data) {
            if (!this.elements.plBreakdownTable) return;
            
            const breakdown = this.calculateExpenseTotals(data).categoryBreakdown;
            const totalExpenses = breakdown.reduce((sum, item) => sum + item.amount, 0);
            
            this.elements.plBreakdownTable.innerHTML = breakdown.map(item => `
                <tr>
                    <td>${item.category}</td>
                    <td>${this.config.currencySymbol}${item.amount.toLocaleString()}</td>
                    <td>${totalExpenses > 0 ? ((item.amount / totalExpenses) * 100).toFixed(1) : 0}%</td>
                    <td>
                        <span class="trend-indicator ${item.trend}">
                            <i class="fas fa-${item.trend === 'trend-up' ? 'arrow-up' : 'arrow-down'} me-1"></i>
                            ${item.percentage}%
                        </span>
                    </td>
                </tr>
            `).join('');
        }
        
        updateExpensePieChart(breakdown) {
            if (!this.state.charts.expensePie) return;
            
            const colors = [
                '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
                '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9'
            ];
            
            this.state.charts.expensePie.data.labels = breakdown.map(item => item.category);
            this.state.charts.expensePie.data.datasets[0].data = breakdown.map(item => item.amount);
            this.state.charts.expensePie.data.datasets[0].backgroundColor = colors.slice(0, breakdown.length);
            
            this.state.charts.expensePie.update();
        }
        
        calculateExpenseTotals(data) {
            const categoryBreakdown = {};
            let totalIncome = 0;
            let totalExpenses = 0;
            
            data.forEach(item => {
                if (item.type === 'income') {
                    totalIncome += parseFloat(item.amount) || 0;
                } else {
                    totalExpenses += parseFloat(item.amount) || 0;
                    const category = item.category || 'Uncategorized';
                    
                    if (!categoryBreakdown[category]) {
                        categoryBreakdown[category] = 0;
                    }
                    categoryBreakdown[category] += parseFloat(item.amount) || 0;
                }
            });
            
            const breakdownArray = Object.entries(categoryBreakdown).map(([category, amount]) => ({
                category,
                amount,
                percentage: Math.round((amount / totalExpenses) * 100),
                trend: Math.random() > 0.5 ? 'trend-up' : 'trend-down'
            })).sort((a, b) => b.amount - a.amount);
            
            return {
                totalIncome,
                totalExpenses,
                netProfit: totalIncome - totalExpenses,
                categoryBreakdown: breakdownArray
            };
        }
        
        calculateReportSummary(data, reportType) {
            if (!data.length) return [];
            
            switch(reportType) {
                case 'income':
                    const totalIncome = data.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
                    return [
                        { label: 'TOTAL INCOME', value: totalIncome },
                        { label: 'AVG DAILY', value: totalIncome / 30 },
                        { label: 'TRANSACTIONS', value: data.length }
                    ];
                    
                case 'expense':
                    const totalExpense = data.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
                    return [
                        { label: 'TOTAL EXPENSE', value: totalExpense },
                        { label: 'AVG DAILY', value: totalExpense / 30 },
                        { label: 'CATEGORIES', value: new Set(data.map(item => item.category)).size }
                    ];
                    
                case 'purchase':
                    const totalPurchase = data.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
                    return [
                        { label: 'TOTAL PURCHASE', value: totalPurchase },
                        { label: 'VENDORS', value: new Set(data.map(item => item.vendor)).size },
                        { label: 'ITEMS', value: data.length }
                    ];
                    
                default:
                    return [];
            }
        }
        
        quickExport(reportType) {
            this.exportAsCSV(reportType);
        }
        
        exportAsCSV(reportType = null) {
            const data = this.state.currentData;
            const type = reportType || this.state.currentReport;
            
            if (!data || !data.length) {
                this.showError('No data to export');
                return;
            }
            
            try {
                const headers = Object.keys(data[0]);
                const csvRows = [
                    headers.join(','),
                    ...data.map(row => headers.map(header => {
                        const value = row[header] || '';
                        return `"${String(value).replace(/"/g, '""')}"`;
                    }).join(','))
                ];
                
                const csvString = csvRows.join('\n');
                const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                
                link.setAttribute("href", url);
                link.setAttribute("download", `${type}_report_${new Date().toISOString().split('T')[0]}.csv`);
                link.style.visibility = 'hidden';
                
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                this.showToast(`${this.formatReportName(type)} report exported as CSV`);
                
            } catch (error) {
                console.error('Export error:', error);
                this.showError('Failed to export CSV');
            }
        }
        
        exportAsExcel() {
            this.exportAsCSV(this.state.currentReport);
        }
        
        exportAsPDF() {
            this.showToast('PDF export requires additional libraries. Using CSV instead.');
            this.exportAsCSV();
        }
        
        printReport() {
            window.print();
        }
        
        showLoading() {
            if (this.elements.reportPlaceholder) {
                this.elements.reportPlaceholder.innerHTML = `
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <h5 class="mt-3">Generating Report...</h5>
                `;
                this.elements.reportPlaceholder.style.display = 'flex';
            }
        }
        
        showPlaceholder() {
            if (this.elements.reportPlaceholder) {
                this.elements.reportPlaceholder.innerHTML = `
                    <i class="fas fa-chart-bar fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">No Report Selected</h5>
                    <p class="text-muted">Choose a report from the options above to view detailed analysis</p>
                `;
                this.elements.reportPlaceholder.style.display = 'flex';
                if (this.elements.reportDisplayActions) {
                    this.elements.reportDisplayActions.style.display = 'none';
                }
            }
        }
        
        showToast(message) {
            const toastEl = document.getElementById('successToast');
            const toastMsg = document.getElementById('toast-message');
            
            if (toastEl && toastMsg) {
                toastMsg.textContent = message;
                const toast = new bootstrap.Toast(toastEl);
                toast.show();
            } else {
                alert(message);
            }
        }
        
        showError(message) {
            alert(`Error: ${message}`);
        }
        
        formatDate(date) {
            if (!date) return 'N/A';
            
            const d = new Date(date);
            return d.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        }
        
        formatReportName(reportType) {
            return reportType.charAt(0).toUpperCase() + reportType.slice(1);
        }
        
        formatColumnName(key) {
            return key.split(/(?=[A-Z])/).map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
        }
        
        // Mock data generators for demonstration
        generateExpenseData() {
            const categories = ['Office Supplies', 'Travel', 'Utilities', 'Marketing', 'Maintenance'];
            const data = [];
            
            for (let i = 0; i < 50; i++) {
                const date = new Date();
                date.setDate(date.getDate() - Math.floor(Math.random() * 60));
                
                data.push({
                    id: `EXP-${1000 + i}`,
                    date: date.toISOString().split('T')[0],
                    category: categories[Math.floor(Math.random() * categories.length)],
                    description: `Expense item ${i + 1}`,
                    amount: (Math.random() * 1000 + 50).toFixed(2),
                    paymentMethod: ['Cash', 'Card', 'UPI', 'Bank Transfer'][Math.floor(Math.random() * 4)],
                    type: 'expense'
                });
            }
            
            for (let i = 0; i < 20; i++) {
                const date = new Date();
                date.setDate(date.getDate() - Math.floor(Math.random() * 60));
                
                data.push({
                    id: `INC-${2000 + i}`,
                    date: date.toISOString().split('T')[0],
                    category: 'Sales',
                    description: `Income item ${i + 1}`,
                    amount: (Math.random() * 5000 + 1000).toFixed(2),
                    type: 'income'
                });
            }
            
            return data;
        }
        
        generatePurchaseData() {
            const vendors = ['Vendor A', 'Vendor B', 'Vendor C', 'Vendor D'];
            const categories = ['Inventory', 'Equipment', 'Services', 'Raw Materials'];
            const data = [];
            
            for (let i = 0; i < 30; i++) {
                const date = new Date();
                date.setDate(date.getDate() - Math.floor(Math.random() * 60));
                
                data.push({
                    id: `PUR-${3000 + i}`,
                    date: date.toISOString().split('T')[0],
                    vendor: vendors[Math.floor(Math.random() * vendors.length)],
                    category: categories[Math.floor(Math.random() * categories.length)],
                    item: `Item ${i + 1}`,
                    quantity: Math.floor(Math.random() * 100) + 1,
                    unitPrice: (Math.random() * 100 + 10).toFixed(2),
                    amount: (Math.random() * 10000 + 500).toFixed(2),
                    status: ['Paid', 'Pending', 'Credit'][Math.floor(Math.random() * 3)]
                });
            }
            
            return data;
        }
        
        generateIncomeData() {
            const sources = ['Product Sales', 'Service Fees', 'Consulting', 'License'];
            const paymentMethods = ['Cash', 'Credit Card', 'Bank Transfer', 'UPI', 'Cheque'];
            const data = [];
            
            for (let i = 0; i < 40; i++) {
                const date = new Date();
                date.setDate(date.getDate() - Math.floor(Math.random() * 60));
                
                data.push({
                    id: `INC-${4000 + i}`,
                    date: date.toISOString().split('T')[0],
                    source: sources[Math.floor(Math.random() * sources.length)],
                    category: 'Income',
                    description: `Income from ${sources[Math.floor(Math.random() * sources.length)]}`,
                    amount: (Math.random() * 5000 + 100).toFixed(2),
                    paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
                    status: 'Completed'
                });
            }
            
            return data;
        }
        
        generatePayrollData() {
            const employees = ['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Brown', 'Charlie Wilson'];
            const data = [];
            
            for (let i = 0; i < 15; i++) {
                const date = new Date();
                date.setDate(1);
                date.setMonth(date.getMonth() - Math.floor(Math.random() * 6));
                
                data.push({
                    id: `EMP-${5000 + i}`,
                    date: date.toISOString().split('T')[0],
                    employee: employees[Math.floor(Math.random() * employees.length)],
                    basicPay: (Math.random() * 50000 + 20000).toFixed(2),
                    allowances: (Math.random() * 10000 + 2000).toFixed(2),
                    deductions: (Math.random() * 8000 + 1000).toFixed(2),
                    netSalary: (Math.random() * 45000 + 25000).toFixed(2),
                    status: ['Paid', 'Pending'][Math.floor(Math.random() * 2)]
                });
            }
            
            return data;
        }
        
        generateAttendanceData() {
            const employees = ['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Brown'];
            const statuses = ['Present', 'Absent', 'Half Day', 'Leave'];
            const data = [];
            
            for (let i = 0; i < 50; i++) {
                const date = new Date();
                date.setDate(date.getDate() - Math.floor(Math.random() * 30));
                
                data.push({
                    id: `ATT-${6000 + i}`,
                    date: date.toISOString().split('T')[0],
                    employee: employees[Math.floor(Math.random() * employees.length)],
                    status: statuses[Math.floor(Math.random() * statuses.length)],
                    checkIn: '09:00',
                    checkOut: '18:00',
                    hours: 8,
                    remarks: Math.random() > 0.7 ? 'Late arrival' : ''
                });
            }
            
            return data;
        }
    }

    // Initialize ReportGenerator when reports page loads
    if (window.jsdcApp) {
        // Create data sources from existing application data
        const dataSources = {
            expense: () => window.jsdcApp.getExpenseReportData ? window.jsdcApp.getExpenseReportData() : [],
            purchase: () => window.jsdcApp.getPurchaseReportData ? window.jsdcApp.getPurchaseReportData() : [],
            income: () => window.jsdcApp.getIncomeReportData ? window.jsdcApp.getIncomeReportData() : [],
            payroll: () => window.jsdcApp.getPayrollReportData ? window.jsdcApp.getPayrollReportData() : [],
            attendance: () => window.jsdcApp.getAttendanceReportData ? window.jsdcApp.getAttendanceReportData() : []
        };
        
        const config = {
            dataSources: dataSources,
            currencySymbol: '₹',
            defaultDateFormat: 'DD-MMM-YYYY'
        };
        
        window.reportGenerator = new ReportGenerator(config);
    }
});