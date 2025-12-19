// reports.js - Reports page specific logic
document.addEventListener("DOMContentLoaded", function () {
    // Check if we're on reports page
    const reportsPage = document.getElementById('reports-page');
    if (!reportsPage) return;
    
    // reports.js - JSDC Reports Module
    class ReportGenerator {
        constructor(config = {}) {
            this.config = {
                dataSources: config.dataSources || {},
                defaultDateFormat: 'DD-MMM-YYYY',
                currencySymbol: '₹',
                apiEndpoints: {
                    payroll: '/api/reports/payroll/',
                    attendance: '/api/reports/attendance/',
                    combined: '/api/reports/combined/',
                    // Note: expense, purchase, income endpoints don't exist in urls.py yet
                },
                ...config
            };
            
            this.elements = {
                reportCards: document.querySelectorAll('.report-card'),
                startDateInput: document.getElementById('report-start-date'),
                endDateInput: document.getElementById('report-end-date'),
                reportPlaceholder: document.querySelector('.report-placeholder'),
                reportDisplayActions: document.querySelector('.report-display-actions'),
                reportTitle: document.querySelector('.report-title'),
                printBtn: document.getElementById('print-report-btn'),
                pdfBtn: document.getElementById('export-report-pdf-btn'),
                excelBtn: document.getElementById('export-report-excel-btn'),
                profitLossReport: document.getElementById('profit-loss-report'),
                cashFlowReport: document.getElementById('cash-flow-report'),
                plDateRange: document.getElementById('pl-date-range'),
                plGeneratedDate: document.getElementById('pl-generated-date'),
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
            console.log('ReportGenerator initializing...');
            
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
            
            console.log('API Endpoints configured:', this.config.apiEndpoints);
            
            this.bindEvents();
            this.initCharts();
            console.log('ReportGenerator initialized successfully');
        }
        
        bindEvents() {
            console.log('Binding events to', this.elements.reportCards?.length || 0, 'report cards');
            
            if (this.elements.reportCards && this.elements.reportCards.length > 0) {
                this.elements.reportCards.forEach(card => {
                    // Add click event to the entire card
                    card.addEventListener('click', (e) => {
                        // Don't trigger if clicking on buttons inside
                        if (!e.target.closest('button')) {
                            const reportType = card.dataset.report;
                            console.log('Card clicked for report:', reportType);
                            this.generateReport(reportType);
                        }
                    });
                    
                    const viewBtn = card.querySelector('.view-report-btn');
                    const exportBtn = card.querySelector('.export-report-btn');
                    
                    if (viewBtn) {
                        viewBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            const reportType = card.dataset.report;
                            console.log('View Report clicked for:', reportType);
                            this.generateReport(reportType);
                        });
                    }
                    
                    if (exportBtn) {
                        exportBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            const reportType = card.dataset.report;
                            console.log('Export clicked for:', reportType);
                            this.quickExport(reportType);
                        });
                    }
                });
            } else {
                console.error('No report cards found!');
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
            
            console.log('Filters updated:', {
                start: this.state.filters.startDate?.toISOString().split('T')[0],
                end: this.state.filters.endDate?.toISOString().split('T')[0]
            });
            
            if (this.state.currentReport) {
                this.generateReport(this.state.currentReport);
            }
        }
        
        async generateReport(reportType) {
            console.log('=== GENERATE REPORT ===');
            console.log('Report type:', reportType);
            console.log('Filters:', this.state.filters);
            
            try {
                this.showLoading();
                this.state.currentReport = reportType;
                
                const data = await this.fetchReportData(reportType);
                console.log('Data received:', data?.length || 0, 'items');
                
                this.state.currentData = data;
                
                // Hide placeholder and show actions
                if (this.elements.reportPlaceholder) {
                    console.log('Hiding placeholder');
                    this.elements.reportPlaceholder.style.display = 'none';
                }
                if (this.elements.reportDisplayActions) {
                    console.log('Showing display actions');
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
            console.log('=== FETCH REPORT DATA ===');
            console.log('Report type:', reportType);
            console.log('Available API endpoints:', this.config.apiEndpoints);
            
            // Check if we have a backend API for this report
            if (this.config.apiEndpoints && this.config.apiEndpoints[reportType]) {
                console.log('Using backend API for:', reportType);
                return await this.fetchFromBackend(reportType);
            }
            
            // Fallback to configured data sources
            if (this.config.dataSources[reportType]) {
                const dataSource = this.config.dataSources[reportType];
                if (typeof dataSource === 'function') {
                    return await dataSource(this.state.filters);
                } else if (Array.isArray(dataSource)) {
                    return this.filterData(dataSource, this.state.filters);
                }
            }
            
            // Generate mock data as last resort
            console.log('Generating mock data for:', reportType);
            return this.generateMockData(reportType);
        }
        
        async fetchFromBackend(reportType) {
            try {
                console.log('=== FETCH FROM BACKEND ===');
                console.log('Report type:', reportType);
                
                const endpoint = this.config.apiEndpoints[reportType];
                if (!endpoint) {
                    console.error('No endpoint found for report type:', reportType);
                    throw new Error(`No API endpoint configured for ${reportType}`);
                }
                
                console.log('Using endpoint:', endpoint);
                
                const url = new URL(endpoint, window.location.origin);
                
                // Add filter parameters
                if (this.state.filters.startDate) {
                    url.searchParams.append('start_date', 
                        this.state.filters.startDate.toISOString().split('T')[0]);
                }
                if (this.state.filters.endDate) {
                    url.searchParams.append('end_date', 
                        this.state.filters.endDate.toISOString().split('T')[0]);
                }
                
                console.log('Request URL:', url.toString());
                
                const response = await fetch(url.toString(), {
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });
                
                console.log('Response status:', response.status);
                console.log('Response headers:', Object.fromEntries(response.headers.entries()));
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                console.log('Response data structure:', {
                    success: data.success,
                    hasData: !!data.data,
                    dataLength: data.data?.length || 0,
                    message: data.message
                });
                
                if (data.success && data.data) {
                    console.log('Data items sample:', data.data.slice(0, 3));
                    return data.data;
                } else {
                    throw new Error(data.message || 'Failed to fetch report data');
                }
                
            } catch (error) {
                console.error(`Error fetching ${reportType} report:`, error);
                // Fallback to mock data
                return this.generateMockData(reportType);
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
            console.log('Generating mock data for:', reportType);
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
            console.log('=== RENDER REPORT ===');
            console.log('Report type:', reportType);
            console.log('Data length:', data?.length || 0);
            
            // Hide all report contents first (including profit-loss)
            document.querySelectorAll('.report-content').forEach(el => {
                el.style.display = 'none';
            });
            
            // Hide placeholder
            if (this.elements.reportPlaceholder) {
                this.elements.reportPlaceholder.style.display = 'none';
            }
            
            // Show report actions
            if (this.elements.reportDisplayActions) {
                this.elements.reportDisplayActions.style.display = 'flex';
            }
            
            // Update report title
            if (this.elements.reportTitle) {
                this.elements.reportTitle.textContent = `${this.formatReportName(reportType)} Report`;
            }
            
            switch(reportType) {
                case 'expense':
                    console.log('Rendering expense report');
                    this.renderExpenseReport(data);
                    break;
                case 'purchase':
                    console.log('Rendering purchase report');
                    this.renderPurchaseReport(data);
                    break;
                case 'income':
                    console.log('Rendering income report');
                    this.renderIncomeReport(data);
                    break;
                case 'payroll':
                    console.log('Rendering payroll report');
                    this.renderPayrollReport(data);
                    break;
                case 'attendance':
                    console.log('Rendering attendance report');
                    this.renderAttendanceReport(data);
                    break;
                default:
                    console.log('Rendering generic report');
                    this.renderGenericReport(reportType, data);
            }
        }
        
        renderExpenseReport(data) {
            if (this.elements.profitLossReport) {
                console.log('Showing profit loss report');
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
            console.log('=== RENDER PAYROLL REPORT ===');
            console.log('Data received:', data);
            
            if (!data || !Array.isArray(data) || data.length === 0) {
                console.log('No payroll data, showing empty report');
                this.createDynamicReport('payroll', [], [
                    { key: 'employee_name', label: 'Employee' },
                    { key: 'display_date', label: 'Date' },
                    { key: 'basic_pay', label: 'Basic Pay' },
                    { key: 'net_salary', label: 'Net Salary' },
                    { key: 'status_display', label: 'Status' }
                ]);
                return;
            }
            
            console.log('Processing payroll data:', data.length, 'items');
            
            // Transform data for display - handle both backend and mock data structures
            const displayData = data.map(item => {
                const employeeName = item.employee_name || item.employee;
                const basicPay = item.basic_pay || item.basicPay || 0;
                const netSalary = item.net_salary || item.netSalary || 0;
                const statusDisplay = item.status_display || item.status || 'N/A';
                const displayDate = item.display_date || item.salary_date || 'N/A';
                
                return {
                    employee_name: employeeName,
                    basic_pay: `${this.config.currencySymbol}${parseFloat(basicPay).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    advances: item.advances ? `${this.config.currencySymbol}${parseFloat(item.advances).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-',
                    net_salary: `${this.config.currencySymbol}${parseFloat(netSalary).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    status_display: statusDisplay,
                    display_date: displayDate
                };
            });
            
            console.log('Display data sample:', displayData.slice(0, 2));
            
            this.createDynamicReport('payroll', displayData, [
                { key: 'employee_name', label: 'Employee' },
                { key: 'display_date', label: 'Date' },
                { key: 'basic_pay', label: 'Basic Pay' },
                { key: 'advances', label: 'Advances' },
                { key: 'net_salary', label: 'Net Salary' },
                { key: 'status_display', label: 'Status' }
            ]);
        }
        
        renderAttendanceReport(data) {
            console.log('=== RENDER ATTENDANCE REPORT ===');
            console.log('Data received:', data);
            
            if (!data || !Array.isArray(data) || data.length === 0) {
                console.log('No attendance data, showing empty report');
                this.createDynamicReport('attendance', [], [
                    { key: 'employee_name', label: 'Employee' },
                    { key: 'display_date', label: 'Date' },
                    { key: 'status_display', label: 'Status' },
                    { key: 'notes', label: 'Notes' }
                ]);
                return;
            }
            
            console.log('Processing attendance data:', data.length, 'items');
            console.log('First item structure:', data[0]);
            
            // DEBUG: Check what fields are available
            if (data.length > 0) {
                console.log('Available fields in data:', Object.keys(data[0]));
            }
            
            // Transform data for display - handle both backend and mock data structures
            const displayData = data.map(item => {
                const employeeName = item.employee_name || item.employee || item.employeeName || '';
                const dateStr = item.date || item.attendance_date || '';
                const displayDate = item.display_date || this.formatDate(new Date(dateStr));
                const status = item.status || '';
                const statusDisplay = item.status_display || 
                    (status === 'present' ? 'Present' : 
                     status === 'absent' ? 'Absent' : 
                     status === 'half_day' ? 'Half Day' : status);
                // Get notes from API response - backend now sends 'notes' field
                const notes = item.notes || item.note || item.remarks || '';
                
                console.log(`Notes for ${employeeName}: "${notes}"`); // DEBUG
                
                return {
                    employee_name: employeeName,
                    display_date: displayDate,
                    status_display: statusDisplay,
                    notes: notes
                };
            });
            
            console.log('Display data sample:', displayData.slice(0, 2));
            
            this.createDynamicReport('attendance', displayData, [
                { key: 'employee_name', label: 'Employee' },
                { key: 'display_date', label: 'Date' },
                { key: 'status_display', label: 'Status' },
                { key: 'notes', label: 'Notes' }
            ]);
        }
        
        renderGenericReport(reportType, data) {
            console.log('Rendering generic report for:', reportType);
            this.createDynamicReport(reportType, data, [
                { key: 'date', label: 'Date' },
                { key: 'description', label: 'Description' },
                { key: 'amount', label: 'Amount' },
                { key: 'status', label: 'Status' }
            ]);
        }
        
        createDynamicReport(reportType, data, columns) {
            console.log('=== CREATE DYNAMIC REPORT ===');
            console.log('Report type:', reportType);
            console.log('Data length:', data?.length || 0);
            console.log('Columns:', columns);
            
            // First hide ALL report contents
            document.querySelectorAll('.report-content').forEach(el => {
                el.style.display = 'none';
            });
            
            // Use specific container for this report
            let container = document.getElementById(`${reportType}-report`);
            
            if (!container) {
                console.error(`Container for ${reportType}-report not found!`);
                
                // Create a fallback container
                container = document.createElement('div');
                container.id = `${reportType}-report`;
                container.className = 'report-content';
                container.style.cssText = `
                    display: block;
                    border: 1px solid #dee2e6;
                    border-radius: 0.375rem;
                    padding: 1rem;
                    margin-top: 1rem;
                    background: white;
                `;
                
                // Append to the main card body
                const cardBody = document.querySelector('.report-display-container .card-body');
                if (cardBody) {
                    // Insert before the placeholder
                    const placeholder = cardBody.querySelector('.report-placeholder');
                    if (placeholder) {
                        cardBody.insertBefore(container, placeholder);
                    } else {
                        cardBody.appendChild(container);
                    }
                } else {
                    console.error('Could not find card body to append report!');
                    return;
                }
            }
            
            // Show the container
            container.style.display = 'block';
            
            // Calculate summary
            const summary = this.calculateReportSummary(data, reportType);
            
            // Create the report HTML
            const html = `
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
                
                
                <div class="report-body">
                    <div class="card">
                        <div class="card-body p-0">
                            ${data.length > 0 ? `
                            <div class="table-responsive">
                                <table class="table table-hover report-table mb-0">
                                    <thead class="table-light">
                                        <tr>
                                            ${columns.map(col => `<th>${col.label}</th>`).join('')}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${data.slice(0, 100).map(item => `
                                        <tr>
                                            ${columns.map(col => `<td>${item[col.key] !== undefined && item[col.key] !== null ? item[col.key] : '-'}</td>`).join('')}
                                        </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                                ${data.length > 100 ? `
                                <div class="alert alert-info m-3">
                                    <i class="fas fa-info-circle me-2"></i>
                                    Showing 100 of ${data.length} records. Export to CSV to see all data.
                                </div>
                                ` : ''}
                            </div>
                            ` : `
                            <div class="text-center py-5">
                                <i class="fas fa-database fa-3x text-muted mb-3"></i>
                                <h5 class="text-muted">No Data Available</h5>
                                <p class="text-muted">No records found for the selected date range</p>
                            </div>
                            `}
                        </div>
                    </div>
                </div>
            `;
            
            console.log('Setting container HTML, length:', html.length);
            container.innerHTML = html;
            
            // Add event listener to the export button
            const exportBtn = container.querySelector('.export-csv-btn');
            if (exportBtn) {
                exportBtn.addEventListener('click', () => {
                    this.exportAsCSV(reportType);
                });
            }
            
            console.log('Report rendered successfully in container:', container.id);
            
            // Scroll to report
            setTimeout(() => {
                container.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
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
            if (!data || !data.length) {
                console.log('No data for summary calculation');
                return [];
            }
            
            console.log('Calculating summary for:', reportType, 'with', data.length, 'items');
            
            switch(reportType) {
                case 'income':
                    const totalIncome = data.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
                    return [
                        { label: 'TOTAL INCOME', value: `${this.config.currencySymbol}${totalIncome.toLocaleString()}` },
                        { label: 'AVG DAILY', value: `${this.config.currencySymbol}${Math.round(totalIncome / 30).toLocaleString()}` },
                        { label: 'TRANSACTIONS', value: data.length }
                    ];
                    
                case 'expense':
                    const totalExpense = data.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
                    return [
                        { label: 'TOTAL EXPENSE', value: `${this.config.currencySymbol}${totalExpense.toLocaleString()}` },
                        { label: 'AVG DAILY', value: `${this.config.currencySymbol}${Math.round(totalExpense / 30).toLocaleString()}` },
                        { label: 'CATEGORIES', value: new Set(data.map(item => item.category)).size }
                    ];
                    
                case 'purchase':
                    const totalPurchase = data.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
                    return [
                        { label: 'TOTAL PURCHASE', value: `${this.config.currencySymbol}${totalPurchase.toLocaleString()}` },
                        { label: 'VENDORS', value: new Set(data.map(item => item.vendor)).size },
                        { label: 'ITEMS', value: data.length }
                    ];
                    
                case 'payroll':
                    const totalPayroll = data.reduce((sum, item) => {
                        const netSalary = parseFloat(item.net_salary || item.netSalary || 0);
                        return sum + netSalary;
                    }, 0);
                    const totalEmployees = new Set(data.map(item => 
                        item.employee_name || item.employee || '')).size;
                    return [
                        { label: 'TOTAL PAYROLL', value: `${this.config.currencySymbol}${totalPayroll.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
                        { label: 'EMPLOYEES', value: totalEmployees },
                        { label: 'RECORDS', value: data.length }
                    ];
                    
                case 'attendance':
                    const presentCount = data.filter(item => {
                        const status = item.status || item.status_display?.toLowerCase();
                        return status === 'present' || status === 'Present';
                    }).length;
                    const attendanceRate = data.length > 0 ? 
                        Math.round((presentCount / data.length) * 100) : 0;
                    return [
                        { label: 'TOTAL RECORDS', value: data.length },
                        { label: 'PRESENT COUNT', value: presentCount },
                        { label: 'ATTENDANCE %', value: `${attendanceRate}%` }
                    ];
                    
                default:
                    return [];
            }
        }
        
        quickExport(reportType) {
            console.log('Quick export for:', reportType);
            this.exportAsCSV(reportType);
        }
        
        exportAsCSV(reportType = null) {
            const type = reportType || this.state.currentReport;
            let data = this.state.currentData;
            
            console.log('Exporting CSV for:', type);
            
            // If no data but we have a report type, generate mock data for export
            if ((!data || !data.length) && type) {
                console.log('No current data, generating mock data for export');
                data = this.generateMockData(type);
            }
            
            if (!data || !data.length) {
                this.showError('No data to export');
                return;
            }
            
            console.log('Exporting', data.length, 'items');
            
            try {
                // Get headers from the first object
                const headers = Object.keys(data[0]);
                const csvRows = [
                    headers.join(','),
                    ...data.map(row => headers.map(header => {
                        const value = row[header] || '';
                        // Handle special characters and wrap in quotes
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
                
                setTimeout(() => URL.revokeObjectURL(url), 100);
                
                this.showToast(`${this.formatReportName(type)} report exported as CSV`);
                
            } catch (error) {
                console.error('Export error:', error);
                this.showError('Failed to export CSV: ' + error.message);
            }
        }
        
        exportAsExcel() {
            console.log('Exporting as Excel');
            this.exportAsCSV(this.state.currentReport);
        }
        
        exportAsPDF() {
            console.log('Exporting as PDF');
            this.showToast('PDF export requires additional libraries. Using CSV instead.');
            this.exportAsCSV();
        }
        
        printReport() {
            console.log('Printing report');
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
                this.elements.reportPlaceholder.style.flexDirection = 'column';
                this.elements.reportPlaceholder.style.alignItems = 'center';
                this.elements.reportPlaceholder.style.justifyContent = 'center';
                this.elements.reportPlaceholder.style.minHeight = '200px';
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
                this.elements.reportPlaceholder.style.flexDirection = 'column';
                this.elements.reportPlaceholder.style.alignItems = 'center';
                this.elements.reportPlaceholder.style.justifyContent = 'center';
                if (this.elements.reportDisplayActions) {
                    this.elements.reportDisplayActions.style.display = 'none';
                }
            }
        }
        
        showToast(message) {
            console.log('Toast message:', message);
            const toastEl = document.getElementById('successToast');
            const toastMsg = document.getElementById('toast-message');
            
            if (toastEl && toastMsg) {
                toastMsg.textContent = message;
                const toast = new bootstrap.Toast(toastEl);
                toast.show();
            } else {
                // Fallback alert
                alert(message);
            }
        }
        
        showError(message) {
            console.error('Error:', message);
            const errorToast = document.getElementById('errorToast');
            const errorMsg = document.getElementById('error-message');
            
            if (errorToast && errorMsg) {
                errorMsg.textContent = message;
                const toast = new bootstrap.Toast(errorToast);
                toast.show();
            } else {
                alert(`Error: ${message}`);
            }
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
            return reportType.charAt(0).toUpperCase() + reportType.slice(1).replace(/_/g, ' ');
        }
        
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
                    display_date: this.formatDate(date),
                    employee_name: employees[Math.floor(Math.random() * employees.length)],
                    month: date.getMonth() + 1,
                    month_name: date.toLocaleString('default', { month: 'long' }),
                    year: date.getFullYear(),
                    basic_pay: (Math.random() * 50000 + 20000).toFixed(2),
                    allowances: (Math.random() * 10000 + 2000).toFixed(2),
                    advances: (Math.random() * 5000 + 1000).toFixed(2),
                    net_salary: (Math.random() * 45000 + 25000).toFixed(2),
                    status: ['paid', 'pending'][Math.floor(Math.random() * 2)],
                    status_display: ['Paid', 'Pending'][Math.floor(Math.random() * 2)]
                });
            }
            
            return data;
        }
        
        generateAttendanceData() {
            const employees = ['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Brown'];
            const statuses = ['present', 'absent', 'half_day', 'present'];
            const notesOptions = ['On time', 'Late arrival', 'Early leave', 'Work from home', 'Medical leave', 'Personal leave', 'Meeting', 'Training'];
            
            const data = [];
            
            for (let i = 0; i < 50; i++) {
                const date = new Date();
                date.setDate(date.getDate() - Math.floor(Math.random() * 30));
                
                const status = statuses[Math.floor(Math.random() * statuses.length)];
                const statusDisplay = status === 'present' ? 'Present' : 
                                    status === 'absent' ? 'Absent' : 'Half Day';
                const notes = notesOptions[Math.floor(Math.random() * notesOptions.length)];
                
                data.push({
                    id: `ATT-${6000 + i}`,
                    date: date.toISOString().split('T')[0],
                    display_date: this.formatDate(date),
                    employee_name: employees[Math.floor(Math.random() * employees.length)],
                    status: status,
                    status_display: statusDisplay,
                    notes: notes
                });
            }
            
            return data;
        }
        
        // Debug function to check DOM
        debugReportDisplay() {
            console.group('=== REPORT DISPLAY DEBUG ===');
            
            // Check visibility
            const visibleReports = Array.from(document.querySelectorAll('.report-content'))
                .filter(el => el.style.display !== 'none');
            
            console.log('Visible report containers:', visibleReports.length);
            visibleReports.forEach(el => {
                console.log(`- ${el.id}:`, {
                    display: el.style.display,
                    offsetHeight: el.offsetHeight,
                    innerHTML: el.innerHTML.substring(0, 100) + '...',
                    tables: el.querySelectorAll('table').length
                });
            });
            
            // Check if tables exist
            const tables = document.querySelectorAll('table');
            console.log('Total tables in DOM:', tables.length);
            tables.forEach((table, i) => {
                console.log(`Table ${i}:`, {
                    id: table.id || '(no id)',
                    parent: table.parentElement?.className,
                    visible: table.offsetParent !== null,
                    rows: table.querySelectorAll('tr').length
                });
            });
            
            console.groupEnd();
        }
        
        
    }
    
    // Initialize the report generator
    try {
        window.reportGenerator = new ReportGenerator();
        console.log('ReportGenerator initialized successfully');
        
        // Add debug functions to window for easy access
        window.debugReports = () => {
            if (window.reportGenerator) {
                window.reportGenerator.debugReportDisplay();
            } else {
                console.error('ReportGenerator not initialized');
            }
        };
        
    } catch (error) {
        console.error('Failed to initialize ReportGenerator:', error);
    }
});