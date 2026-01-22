/**
 * reports.js - Financial Reports & Analytics
 */

class ReportsManager {
    constructor() {
        this.currentReportData = null; // Store current report data for export
        this.initElements();
        this.initEventListeners();
        this.setDefaultDates();
    }

    initElements() {
        // Form elements
        this.reportFromDate = document.getElementById('reportFromDate');
        this.reportToDate = document.getElementById('reportToDate');
        this.reportType = document.getElementById('reportType');
        this.viewReportBtn = document.getElementById('viewReportBtn');
        this.exportExcelBtn = document.getElementById('exportExcelBtn');
        this.exportPdfBtn = document.getElementById('exportPdfBtn');

        // Period radio buttons
        this.periodRadios = document.querySelectorAll('input[name="period"]');

        // Display elements
        this.reportLoading = document.getElementById('reportLoading');
        this.reportSummaryCards = document.getElementById('reportSummaryCards');
        this.reportResults = document.getElementById('reportResults');
        this.reportContent = document.getElementById('reportContent');

        // Templates
        this.templates = {
            income: document.getElementById('incomeReportTemplate').content,
            expense: document.getElementById('expenseReportTemplate').content,
            purchase: document.getElementById('purchaseReportTemplate').content,
            payroll: document.getElementById('payrollReportTemplate').content,
            attendance: document.getElementById('attendanceReportTemplate').content
        };
    }

    initEventListeners() {
        // View Report button
        if (this.viewReportBtn) {
            this.viewReportBtn.addEventListener('click', () => this.generateReport());
        }

        // Export buttons - FIXED
        if (this.exportExcelBtn) {
            this.exportExcelBtn.addEventListener('click', () => this.exportReport('excel'));
        }
        if (this.exportPdfBtn) {
            this.exportPdfBtn.addEventListener('click', () => this.exportReport('pdf'));
        }

        // Period radio buttons
        this.periodRadios.forEach(radio => {
            radio.addEventListener('change', () => this.handlePeriodChange(radio.id));
        });

        // Date inputs - auto-update when changed
        if (this.reportFromDate && this.reportToDate) {
            this.reportFromDate.addEventListener('change', () => this.validateDateRange());
            this.reportToDate.addEventListener('change', () => this.validateDateRange());
        }
    }

    setDefaultDates() {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        if (this.reportFromDate && !this.reportFromDate.value) {
            this.reportFromDate.value = firstDay.toISOString().split('T')[0];
        }

        if (this.reportToDate && !this.reportToDate.value) {
            this.reportToDate.value = lastDay.toISOString().split('T')[0];
        }
    }

    handlePeriodChange(period) {
        const today = new Date();
        let startDate, endDate;

        switch (period) {
            case 'daily':
                startDate = endDate = today;
                break;
            case 'weekly':
                const startOfWeek = new Date(today);
                startOfWeek.setDate(today.getDate() - today.getDay());
                startDate = startOfWeek;
                endDate = new Date(startOfWeek);
                endDate.setDate(startOfWeek.getDate() + 6);
                break;
            case 'monthly':
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                break;
            case 'yearly':
                startDate = new Date(today.getFullYear(), 0, 1);
                endDate = new Date(today.getFullYear(), 11, 31);
                break;
        }

        if (this.reportFromDate) {
            this.reportFromDate.value = startDate.toISOString().split('T')[0];
        }
        if (this.reportToDate) {
            this.reportToDate.value = endDate.toISOString().split('T')[0];
        }
    }

    validateDateRange() {
        const startDate = new Date(this.reportFromDate.value);
        const endDate = new Date(this.reportToDate.value);

        if (startDate > endDate) {
            alert('Start date cannot be after end date');
            this.reportToDate.value = this.reportFromDate.value;
        }
    }

    async generateReport() {
        try {
            // Validate inputs
            if (!this.reportFromDate.value || !this.reportToDate.value) {
                alert('Please select both start and end dates');
                return;
            }

            // Show loading indicator
            this.showLoading(true);

            // Get selected period
            let period = 'daily';
            this.periodRadios.forEach(radio => {
                if (radio.checked) {
                    period = radio.id;
                }
            });

            // Build API URL
            const params = new URLSearchParams({
                type: this.reportType.value,
                period: period,
                start_date: this.reportFromDate.value,
                end_date: this.reportToDate.value
            });

            const apiEndpoint = '/reports/api/get-report-data/';
            console.log('Fetching report from:', apiEndpoint + '?' + params.toString());

            const response = await fetch(apiEndpoint + '?' + params);

            // Check if response is JSON
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const text = await response.text();
                console.error('Server returned non-JSON response:', text.substring(0, 200));
                throw new Error(`Server returned ${response.status} ${response.statusText}. Please check the API endpoint.`);
            }

            const data = await response.json();

            if (data.success) {
                this.currentReportData = data; // Store for export
                this.displayReport(data);
                this.enableExportButtons();
            } else {
                throw new Error(data.error || 'Failed to generate report');
            }
        } catch (error) {
            console.error('Error generating report:', error);
            alert(`Error: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    displayReport(data) {
        // Clear previous content
        this.reportSummaryCards.innerHTML = '';
        this.reportContent.innerHTML = '';
        this.reportSummaryCards.style.display = 'none';
        this.reportResults.style.display = 'none';

        const reportType = this.reportType.value;
        const reportData = data.data;

        // Show summary cards
        if (reportType === 'all') {
            this.displayOverallSummary(reportData.summary, data.period_type);
        }

        // Generate report sections based on type
        if (reportType === 'all' || reportType === 'income') {
            this.displayIncomeReport(reportData.income, data.period_type);
        }

        if (reportType === 'all' || reportType === 'expense') {
            this.displayExpenseReport(reportData.expense, data.period_type);
        }

        if (reportType === 'all' || reportType === 'purchase') {
            this.displayPurchaseReport(reportData.purchase, data.period_type);
        }

        if (reportType === 'all' || reportType === 'payroll') {
            this.displayPayrollReport(reportData.payroll, data.period_type);
        }

        if (reportType === 'all' || reportType === 'attendance') {
            this.displayAttendanceReport(reportData.attendance, data.period_type);
        }

        // Show results
        this.reportResults.style.display = 'block';
        if (this.reportSummaryCards.innerHTML.trim() !== '') {
            this.reportSummaryCards.style.display = 'flex';
        }
    }

    displayOverallSummary(summary, periodType) {
        const cardHtml = `
            <div class="col-12">
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title mb-3">Overall Financial Summary</h5>
                        <div class="row">
                            <div class="col-md-3">
                                <div class="summary-item">
                                    <h6>Total Income</h6>
                                    <h3 class="text-success">₹${this.formatNumber(summary.total_income)}</h3>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="summary-item">
                                    <h6>Total Expenses</h6>
                                    <h3 class="text-danger">₹${this.formatNumber(summary.total_expense)}</h3>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="summary-item">
                                    <h6>Total Purchases</h6>
                                    <h3 class="text-primary">₹${this.formatNumber(summary.total_purchase)}</h3>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="summary-item">
                                    <h6>Net Profit/Loss</h6>
                                    <h3 class="${summary.net_profit >= 0 ? 'text-success' : 'text-danger'}">
                                        ₹${this.formatNumber(summary.net_profit)}
                                    </h3>
                                </div>
                            </div>
                        </div>
                        <div class="mt-3 text-muted small">
                            Period: ${periodType.charAt(0).toUpperCase() + periodType.slice(1)} | 
                            Days: ${summary.days_in_period} | 
                            Daily Avg Income: ₹${this.formatNumber(summary.daily_avg_income)} | 
                            Daily Avg Expense: ₹${this.formatNumber(summary.daily_avg_expense)}
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.reportSummaryCards.innerHTML = cardHtml;
    }

    displayIncomeReport(incomeData, periodType) {
        if (!incomeData) return;

        const template = this.templates.income.cloneNode(true);
        const periodLabel = template.querySelector('.period-label');
        if (periodLabel) {
            periodLabel.textContent = periodType.charAt(0).toUpperCase() + periodType.slice(1);
        }

        const tableBody = template.querySelector('#incomeTableBody');
        if (tableBody && incomeData.records) {
            incomeData.records.forEach(record => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${new Date(record.date).toLocaleDateString('en-IN')}</td>
                    <td>${record.description}</td>
                    <td>${record.payment_mode}</td>
                    <td class="text-end fw-bold">₹${this.formatNumber(record.amount)}</td>
                    <td>
                        <span class="badge ${record.status === 'Received' ? 'bg-success' : 'bg-warning'}">
                            ${record.status}
                        </span>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        }

        this.reportContent.appendChild(template);
    }

    displayExpenseReport(expenseData, periodType) {
        if (!expenseData) return;

        const template = this.templates.expense.cloneNode(true);
        const periodLabel = template.querySelector('.period-label');
        if (periodLabel) {
            periodLabel.textContent = periodType.charAt(0).toUpperCase() + periodType.slice(1);
        }

        const tableBody = template.querySelector('#expenseTableBody');
        if (tableBody && expenseData.records) {
            expenseData.records.forEach(record => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${new Date(record.date).toLocaleDateString('en-IN')}</td>
                    <td>
                        <span class="badge bg-info-subtle text-info-emphasis px-2">
                            ${record.category}
                        </span>
                    </td>
                    <td>${record.description || '-'}</td>
                    <td class="text-end fw-bold">₹${this.formatNumber(record.total_amount)}</td>
                    <td>${record.payment_method}</td>
                `;
                tableBody.appendChild(row);
            });
        }

        this.reportContent.appendChild(template);
    }

    displayPurchaseReport(purchaseData, periodType) {
        if (!purchaseData) return;

        const template = this.templates.purchase.cloneNode(true);
        const periodLabel = template.querySelector('.period-label');
        if (periodLabel) {
            periodLabel.textContent = periodType.charAt(0).toUpperCase() + periodType.slice(1);
        }

        const tableBody = template.querySelector('#purchaseTableBody');
        if (tableBody && purchaseData.records) {
            purchaseData.records.forEach(record => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${new Date(record.date).toLocaleDateString('en-IN')}</td>
                    <td class="fw-semibold">${record.vendor}</td>
                    <td>${record.cat__name || '-'}</td>
                    <td>#${record.bill_no}</td>
                    <td class="text-end fw-bold">₹${this.formatNumber(record.total_amount)}</td>
                    <td>
                        <span class="badge ${record.status === 'Paid' ? 'bg-success-subtle text-success' : 
                            record.status === 'Pending' ? 'bg-warning-subtle text-warning' : 
                            'bg-danger-subtle text-danger'}">
                            ${record.status}
                        </span>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        }

        this.reportContent.appendChild(template);
    }

    displayPayrollReport(payrollData, periodType) {
        if (!payrollData) return;

        const template = this.templates.payroll.cloneNode(true);
        const periodLabel = template.querySelector('.period-label');
        if (periodLabel) {
            periodLabel.textContent = periodType.charAt(0).toUpperCase() + periodType.slice(1);
        }

        const tableBody = template.querySelector('#payrollTableBody');
        if (tableBody && payrollData.records) {
            payrollData.records.forEach(record => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="fw-semibold">${record.employee_name}</td>
                    <td>${new Date(record.salary_date).toLocaleDateString('en-IN')}</td>
                    <td class="text-end">₹${this.formatNumber(record.basic_pay)}</td>
                    <td class="text-end">₹${this.formatNumber(record.spr_amount)}</td>
                    <td class="text-end fw-bold text-primary">₹${this.formatNumber(record.net_salary)}</td>
                    <td>
                        <span class="badge ${record.payment_split_type === 'full_cash' ? 'bg-success-subtle text-success' : 
                            record.payment_split_type === 'full_bank' ? 'bg-primary-subtle text-primary' : 
                            'bg-warning-subtle text-warning'}">
                            ${record.payment_split_type.replace('_', ' ')}
                        </span>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        }

        this.reportContent.appendChild(template);
    }

    displayAttendanceReport(attendanceData, periodType) {
        if (!attendanceData) return;

        const template = this.templates.attendance.cloneNode(true);
        const periodLabel = template.querySelector('.period-label');
        if (periodLabel) {
            periodLabel.textContent = periodType.charAt(0).toUpperCase() + periodType.slice(1);
        }

        const tableBody = template.querySelector('#attendanceTableBody');
        if (tableBody && attendanceData.records) {
            attendanceData.records.forEach(record => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="fw-semibold">${record.employee_name}</td>
                    <td class="text-center text-success">${record.present_days}</td>
                    <td class="text-center text-warning">${record.half_days}</td>
                    <td class="text-center text-danger">${record.absent_days}</td>
                    <td class="text-center">${this.formatNumber(record.full_days)}</td>
                    <td class="text-center">
                        <span class="badge ${record.attendance_percentage >= 90 ? 'bg-success' : 
                            record.attendance_percentage >= 75 ? 'bg-warning' : 'bg-danger'}">
                            ${this.formatNumber(record.attendance_percentage)}%
                        </span>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        }

        this.reportContent.appendChild(template);
    }

    createStatusDistributionChart(statusData) {
        if (!statusData || statusData.length === 0) return 'No data';

        let html = '<div class="d-flex flex-column gap-1">';

        statusData.forEach(item => {
            const totalAmount = statusData.reduce((sum, s) => sum + s.amount, 0);
            const percentage = totalAmount > 0 ? Math.round((item.amount / totalAmount) * 100) : 0;

            html += `
                <div class="d-flex justify-content-between align-items-center">
                    <small>${item.status}</small>
                    <div class="d-flex align-items-center gap-2">
                        <small>${percentage}%</small>
                        <div class="progress" style="width: 100px; height: 8px;">
                            <div class="progress-bar ${item.status === 'Received' ? 'bg-success' : 'bg-warning'}" 
                                 style="width: ${percentage}%"></div>
                        </div>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        return html;
    }

    showLoading(show) {
        if (this.reportLoading) {
            this.reportLoading.style.display = show ? 'block' : 'none';
        }

        if (this.viewReportBtn) {
            this.viewReportBtn.disabled = show;
            this.viewReportBtn.innerHTML = show ?
                '<i class="fas fa-spinner fa-spin me-1"></i> Generating...' :
                '<i class="fas fa-chart-bar me-1"></i> Generate Report';
        }
    }

    enableExportButtons() {
        if (this.exportExcelBtn) {
            this.exportExcelBtn.disabled = false;
        }
        if (this.exportPdfBtn) {
            this.exportPdfBtn.disabled = false;
        }
    }

    // FIXED EXPORT FUNCTION - This is the working version
    async exportReport(format) {
        try {
            if (!this.currentReportData) {
                alert('Please generate a report first before exporting');
                return;
            }

            // Disable button and show loading state
            const button = format === 'excel' ? this.exportExcelBtn : this.exportPdfBtn;
            const originalText = button.innerHTML;
            button.disabled = true;
            button.innerHTML = `<i class="fas fa-spinner fa-spin me-1"></i> Exporting...`;

            // Get selected period
            let period = 'daily';
            this.periodRadios.forEach(radio => {
                if (radio.checked) {
                    period = radio.id;
                }
            });

            // Build export URL
            const params = new URLSearchParams({
                type: this.reportType.value,
                period: period,
                start_date: this.reportFromDate.value,
                end_date: this.reportToDate.value,
                format: format
            });

            const exportUrl = `/reports/api/export/?${params.toString()}`;
            console.log('Exporting report from:', exportUrl);

            // Fetch the file
            const response = await fetch(exportUrl);

            if (!response.ok) {
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    const error = await response.json();
                    throw new Error(error.error || 'Export failed');
                } else {
                    throw new Error(`Export failed: ${response.status} ${response.statusText}`);
                }
            }

            // Get the blob
            const blob = await response.blob();
            
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            
            // Set filename from Content-Disposition header or create default
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = `Financial_Report_${this.reportType.value}_${this.reportFromDate.value}_${this.reportToDate.value}`;
            
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="(.+)"/);
                if (filenameMatch) {
                    filename = filenameMatch[1];
                }
            } else {
                filename += format === 'excel' ? '.xlsx' : '.pdf';
            }
            
            a.download = filename;
            
            // Trigger download
            document.body.appendChild(a);
            a.click();
            
            // Cleanup
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            // Show success message
            console.log(`Successfully exported ${format.toUpperCase()} file: ${filename}`);
            alert(`Report exported successfully as ${format.toUpperCase()}!`);

        } catch (error) {
            console.error('Export error:', error);
            alert(`Export failed: ${error.message}`);
        } finally {
            // Re-enable button
            const button = format === 'excel' ? this.exportExcelBtn : this.exportPdfBtn;
            button.disabled = false;
            button.innerHTML = format === 'excel' ? 
                '<i class="fas fa-file-excel me-1"></i> Excel' : 
                '<i class="fas fa-file-pdf me-1"></i> PDF';
        }
    }

    formatNumber(num) {
        if (num === null || num === undefined) return '0';

        const number = parseFloat(num);
        if (isNaN(number)) return '0';

        // Format with Indian number formatting
        return number.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.reportsManager = new ReportsManager();
});