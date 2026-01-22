// dashboard.js - FULLY FIXED VERSION
class DashboardManager {
    static chartInstances = {
        financialChart: null,
        cashFlowChart: null
    };
    
    static chartConfigs = {
        lineChartPeriod: 'monthly', // weekly, monthly, yearly
    };
    
    static chartData = {
        weekly: { labels: [], income: [], expenses: [], purchases: [] },
        monthly: { labels: [], income: [], expenses: [], purchases: [] },
        yearly: { labels: [], income: [], expenses: [], purchases: [] },
        custom: { labels: [], income: [], expenses: [], purchases: [] }
    };
    
    static monthlyOverviewData = {
        income: { labels: [], data: [], total: 0 },
        expense: { labels: [], data: [], total: 0 },
        purchase: { labels: [], data: [], total: 0 }
    };
    
    static currentPeriod = ''; // Store current period from page
    
    static initialize() {
        console.log('Initializing dashboard with chart controls');
        
        // Get current period from hidden field or URL
        this.getCurrentPeriod();
        
        // Initialize period handling
        this.initializePeriod();
        
        // Initialize charts
        this.initializeCharts();
        
        // Setup chart controls (only for line chart now)
        this.setupLineChartControls();
        
        // Quick action buttons
        this.setupQuickActions();

        // Initialize date range picker for period selection
        this.setupDateRangePicker();
        
        console.log('Dashboard initialized');
    }
    
    static getCurrentPeriod() {
        // Try to get period from URL
        const urlParams = new URLSearchParams(window.location.search);
        this.currentPeriod = urlParams.get('period') || '';
        
        // Or get from page data if available
        const periodElement = document.querySelector('[data-current-period]');
        if (periodElement) {
            this.currentPeriod = periodElement.getAttribute('data-current-period') || this.currentPeriod;
        }
        
        console.log('Current period:', this.currentPeriod);
    }
    
    static initializeCharts() {
        console.log('Initializing dashboard charts');
        
        // Check if Chart.js is loaded
        if (typeof Chart === 'undefined') {
            console.error('Chart.js is not loaded');
            setTimeout(() => this.initializeCharts(), 100);
            return;
        }
        
        // Initialize financial chart (new design)
        this.initFinancialChart();
        
        // Initialize cash flow chart (month overview)
        this.initCashFlowChart();
        
        // Load initial data
        this.loadChartData();
    }
    
    static initFinancialChart() {
        const ctx = document.getElementById('financialChart');
        if (!ctx) {
            console.error('Financial chart canvas not found');
            return;
        }
        
        try {
            // Destroy existing chart
            if (this.chartInstances.financialChart) {
                this.chartInstances.financialChart.destroy();
            }
            
            const chartContext = ctx.getContext('2d');
            
            // Create gradient for each dataset
            const createGradient = (ctx, color) => {
                const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                gradient.addColorStop(0, color + '40');
                gradient.addColorStop(1, color + '10');
                return gradient;
            };
            
            this.chartInstances.financialChart = new Chart(chartContext, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [
                        {
                            label: 'Income',
                            data: [],
                            borderColor: '#10b981',
                            backgroundColor: createGradient(chartContext, '#10b981'),
                            borderWidth: 3,
                            tension: 0.4,
                            fill: true,
                            pointBackgroundColor: '#10b981',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                            pointRadius: 6,
                            pointHoverRadius: 8,
                            pointHoverBackgroundColor: '#fff',
                            pointHoverBorderColor: '#10b981',
                            pointHoverBorderWidth: 3
                        },
                        {
                            label: 'Expenses',
                            data: [],
                            borderColor: '#ef4444',
                            backgroundColor: createGradient(chartContext, '#ef4444'),
                            borderWidth: 3,
                            tension: 0.4,
                            fill: true,
                            pointBackgroundColor: '#ef4444',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                            pointRadius: 6,
                            pointHoverRadius: 8,
                            pointHoverBackgroundColor: '#fff',
                            pointHoverBorderColor: '#ef4444',
                            pointHoverBorderWidth: 3
                        },
                        {
                            label: 'Purchases',
                            data: [],
                            borderColor: '#f59e0b',
                            backgroundColor: createGradient(chartContext, '#f59e0b'),
                            borderWidth: 3,
                            tension: 0.4,
                            fill: true,
                            pointBackgroundColor: '#f59e0b',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                            pointRadius: 6,
                            pointHoverRadius: 8,
                            pointHoverBackgroundColor: '#fff',
                            pointHoverBorderColor: '#f59e0b',
                            pointHoverBorderWidth: 3
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                            align: 'end',
                            labels: {
                                padding: 20,
                                usePointStyle: true,
                                pointStyle: 'circle',
                                pointRadius: 6,
                                font: {
                                    size: 11,
                                    family: "'Inter', sans-serif"
                                },
                                color: '#4b5563'
                            }
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            backgroundColor: 'rgba(17, 24, 39, 0.95)',
                            titleColor: '#f3f4f6',
                            bodyColor: '#f3f4f6',
                            borderColor: '#374151',
                            borderWidth: 1,
                            padding: 12,
                            boxPadding: 6,
                            cornerRadius: 8,
                            displayColors: true,
                            usePointStyle: true,
                            callbacks: {
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    label += '₹' + context.parsed.y.toLocaleString();
                                    return label;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                display: true,
                                color: 'rgba(229, 231, 235, 0.5)',
                                drawBorder: false
                            },
                            ticks: {
                                color: '#6b7280',
                                font: {
                                    size: 11,
                                    family: "'Inter', sans-serif"
                                },
                                padding: 10
                            }
                        },
                        y: {
                            beginAtZero: true,
                            grid: {
                                display: true,
                                color: 'rgba(229, 231, 235, 0.5)',
                                drawBorder: false
                            },
                            ticks: {
                                color: '#6b7280',
                                callback: function(value) {
                                    if (value >= 1000) {
                                        return '₹' + (value / 1000).toFixed(0) + 'k';
                                    }
                                    return '₹' + value;
                                },
                                font: {
                                    size: 11,
                                    family: "'Inter', sans-serif"
                                },
                                padding: 10
                            }
                        }
                    },
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    },
                    animation: {
                        duration: 1000,
                        easing: 'easeOutQuart'
                    },
                    elements: {
                        line: {
                            borderCapStyle: 'round'
                        }
                    }
                }
            });
            
            console.log('Financial chart initialized');
        } catch (error) {
            console.error('Error initializing financial chart:', error);
        }
    }
    
    static initCashFlowChart() {
        const ctx = document.getElementById('cashFlowChart');
        if (!ctx) {
            console.error('Cash flow chart canvas not found');
            return;
        }
        
        try {
            // Destroy existing chart
            if (this.chartInstances.cashFlowChart) {
                this.chartInstances.cashFlowChart.destroy();
            }
            
            const chartContext = ctx.getContext('2d');
            
            this.chartInstances.cashFlowChart = new Chart(chartContext, {
                type: 'doughnut',
                data: {
                    labels: ['Income', 'Expenses', 'Purchases'],
                    datasets: [{
                        data: [0, 0, 0],
                        backgroundColor: ['#10b981', '#ef4444', '#f59e0b'],
                        borderWidth: 3,
                        borderColor: '#fff',
                        hoverOffset: 10,
                        hoverBorderWidth: 3,
                        hoverBackgroundColor: ['#0ea271', '#dc2626', '#d97706']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '75%',
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.raw || 0;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                    return `${label}: ₹${value.toLocaleString()} (${percentage}%)`;
                                }
                            },
                            backgroundColor: 'rgba(17, 24, 39, 0.95)',
                            titleColor: '#f3f4f6',
                            bodyColor: '#f3f4f6',
                            borderColor: '#374151',
                            borderWidth: 1
                        }
                    },
                    animation: {
                        animateScale: true,
                        animateRotate: true,
                        duration: 1000
                    }
                }
            });
            
            console.log('Cash flow chart initialized');
        } catch (error) {
            console.error('Error initializing cash flow chart:', error);
        }
    }
    
    static setupLineChartControls() {
        // Line chart period controls (Weekly, Monthly, Yearly)
        const linePeriodButtons = document.querySelectorAll('#lineChartPeriod button');
        linePeriodButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Remove active class from all buttons
                linePeriodButtons.forEach(btn => btn.classList.remove('active'));
                
                // Add active class to clicked button
                button.classList.add('active');
                
                // FIXED: Reset date range picker display
                const rangeDisplay = document.getElementById('range-display');
                if (rangeDisplay) {
                    rangeDisplay.textContent = 'Select Custom Range';
                }
                
                // Update chart period
                const period = button.getAttribute('data-period');
                this.updateLineChartPeriod(period);
                
                // Show toast notification
                this.showToast(`Financial chart updated to ${period} view`, 'success');
            });
        });
    }
    
    static updateLineChartPeriod(period) {
        console.log('Updating line chart period to:', period);
        
        // Update configuration
        this.chartConfigs.lineChartPeriod = period;
        
        // Fetch new data for the selected period
        this.fetchChartData(period);
    }
    
    static fetchChartData(period) {
        console.log('Fetching chart data for period:', period);
        
        // Build API URL with current period
        let apiUrl = `/api/dashboard-charts/?period=${period}`;
        if (this.currentPeriod) {
            apiUrl += `&selected_period=${this.currentPeriod}`;
        }
        
        fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    // Update line chart data
                    this.updateLineChartWithData(data.line_chart, period);
                    
                    // Update month overview data
                    this.updateMonthOverviewWithData(data.month_overview);
                    
                    // Update statistics
                    this.updateLineChartStats(period);
                    
                    this.showToast(`Loaded ${period} data successfully`, 'success');
                } else {
                    throw new Error('Invalid response format');
                }
            })
            .catch(error => {
                console.error('Error fetching chart data:', error);
                this.showToast('Failed to load chart data', 'error');
                // Fallback to empty data
                this.updateLineChartWithData({
                    labels: [],
                    income: [],
                    expenses: [],
                    purchases: []
                }, period);
            });
    }
    
    static updateLineChartWithData(data, period) {
        if (!this.chartInstances.financialChart) return;

        const chart = this.chartInstances.financialChart;
        this.chartData[period] = data;

        const canvas = chart.canvas;
        const container = canvas.parentElement;

        // FIXED: Remove existing no-data overlay
        const existingOverlay = container.querySelector('.no-data-overlay');
        if (existingOverlay) existingOverlay.remove();

        if (data.labels && data.labels.length > 0) {
            // Show chart with data
            canvas.style.opacity = '1';
            chart.data.labels = data.labels;
            chart.data.datasets[0].data = data.income;
            chart.data.datasets[1].data = data.expenses;
            chart.data.datasets[2].data = data.purchases;
        } else {
            // FIXED: Show no-data overlay with proper styling
            chart.data.labels = [];
            chart.data.datasets.forEach(d => d.data = []);
            canvas.style.opacity = '0.1';
            
            const overlay = document.createElement('div');
            overlay.className = 'no-data-overlay position-absolute top-50 start-50 translate-middle text-center';
            overlay.style.zIndex = '10';
            overlay.innerHTML = `
                <div class="text-muted">
                    <i class="fas fa-chart-line fa-3x mb-3 opacity-25"></i>
                    <p class="mb-0 fw-bold">No data available</p>
                    <small>Try selecting a different period</small>
                </div>
            `;
            container.style.position = 'relative';
            container.appendChild(overlay);
        }

        chart.update();
    }

    static updateMonthOverviewWithData(overviewData) {
        if (!this.chartInstances.cashFlowChart) return;
        
        // Store overview data
        this.monthlyOverviewData = overviewData;
        
        // Update doughnut chart with totals
        const incomeTotal = overviewData.income?.total || 0;
        const expenseTotal = overviewData.expense?.total || 0;
        const purchaseTotal = overviewData.purchase?.total || 0;
        
        const chartCanvas = document.getElementById('cashFlowChart');
        const container = chartCanvas.parentElement;
        
        // FIXED: Remove existing no-data message
        const oldMsg = container.querySelector('.no-data-message');
        if (oldMsg) oldMsg.remove();

        // Check if we have any data
        if (incomeTotal === 0 && expenseTotal === 0 && purchaseTotal === 0) {
            this.showNoDataMessage('cashFlowChart', 'No data available for this period');
            // FIXED: Dim the chart when no data
            chartCanvas.style.opacity = '0.1';
            // Still update with zeros
            this.chartInstances.cashFlowChart.data.datasets[0].data = [0, 0, 0];
        } else {
            // FIXED: Show the chart normally
            chartCanvas.style.opacity = '1';
            this.chartInstances.cashFlowChart.data.datasets[0].data = [
                incomeTotal,
                expenseTotal,
                purchaseTotal
            ];
        }
        
        this.chartInstances.cashFlowChart.update();
        
        // Update breakdown display
        this.updateBreakdownDisplay(overviewData);
        
        console.log('Month overview updated with real data');
    }
    
    static showNoDataMessage(chartId, message) {
        const chartCanvas = document.getElementById(chartId);
        if (!chartCanvas) return;
        
        const container = chartCanvas.parentElement;
        
        // Remove existing message if any
        const existingMsg = container.querySelector('.no-data-message');
        if (existingMsg) existingMsg.remove();
        
        // Create message element
        const msgDiv = document.createElement('div');
        msgDiv.className = 'no-data-message position-absolute top-50 start-50 translate-middle text-center';
        msgDiv.style.zIndex = '10';
        msgDiv.innerHTML = `
            <div class="text-muted">
                <i class="fas fa-chart-pie fa-2x mb-2"></i>
                <p class="mb-0">${message}</p>
            </div>
        `;
        container.style.position = 'relative';
        container.appendChild(msgDiv);
    }
    
    static updateBreakdownDisplay(overviewData) {
        // Update the breakdown display with month's data
        const incomeTotal = overviewData.income?.total || 0;
        const expenseTotal = overviewData.expense?.total || 0;
        const purchaseTotal = overviewData.purchase?.total || 0;
        
        document.getElementById('pie-income-total').textContent = 
            '₹' + incomeTotal.toLocaleString('en-IN', { 
                minimumFractionDigits: 0,
                maximumFractionDigits: 0 
            });
        
        document.getElementById('pie-expense-total').textContent = 
            '₹' + expenseTotal.toLocaleString('en-IN', { 
                minimumFractionDigits: 0,
                maximumFractionDigits: 0 
            });
        
        document.getElementById('pie-purchase-total').textContent = 
            '₹' + purchaseTotal.toLocaleString('en-IN', { 
                minimumFractionDigits: 0,
                maximumFractionDigits: 0 
            });
    }
    
    static updateLineChartStats(period) {
        const data = this.chartData[period] || this.chartData.monthly;
        
        // FIXED: Add return statement to getAvg function
        const getAvg = (arr) => {
            return arr && arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
        };

        const avgIncome = getAvg(data.income);
        const avgExpense = getAvg(data.expenses);
        const avgPurchase = getAvg(data.purchases);

        // Format and update UI
        const format = (v) => '₹' + Math.round(v).toLocaleString('en-IN');
        
        document.getElementById('avg-income').textContent = format(avgIncome);
        document.getElementById('avg-expense').textContent = format(avgExpense);
        document.getElementById('avg-purchase').textContent = format(avgPurchase);
    }
    
    static loadChartData() {
        console.log('Loading initial chart data');
        
        // Fetch initial data for the default period (monthly)
        this.fetchChartData(this.chartConfigs.lineChartPeriod);
    }
    
    static initializePeriod() {
        console.log('Initializing period handling');
        
        // Get current period from URL
        const urlParams = new URLSearchParams(window.location.search);
        const period = urlParams.get('period');
        
        if (period) {
            // Parse period (format: "2025-12")
            const [year, month] = period.split('-').map(Number);
            
            // Update UI elements that should show the period
            this.updatePeriodDisplay(year, month);
        } else {
            // Use current month
            const now = new Date();
            this.updatePeriodDisplay(now.getFullYear(), now.getMonth() + 1);
        }
    }
    
    static updatePeriodDisplay(year, month) {
        // Format the period display
        const date = new Date(year, month - 1, 1);
        const formattedPeriod = date.toLocaleString('default', { 
            month: 'long', 
            year: 'numeric' 
        });
        
        // Update any period display elements
        const periodElements = document.querySelectorAll('.period-display');
        periodElements.forEach(el => {
            el.textContent = formattedPeriod;
        });
    }
    
    static setupQuickActions() {
        // Update quick action links to preserve period parameter
        this.updateQuickActionLinks();
    }
    
    static updateQuickActionLinks() {
        const urlParams = new URLSearchParams(window.location.search);
        const currentPeriod = urlParams.get('period');
        
        if (currentPeriod) {
            // Update all quick action links to preserve period
            const quickActionLinks = document.querySelectorAll('.quick-action-link');
            quickActionLinks.forEach(link => {
                const href = link.getAttribute('href');
                if (href && !href.includes('period=')) {
                    const separator = href.includes('?') ? '&' : '?';
                    link.setAttribute('href', `${href}${separator}period=${currentPeriod}`);
                }
            });
        }
    }
    
    static showToast(message, type = 'info') {
        // Use the global app's toast function if available
        if (window.jsdcApp && typeof window.jsdcApp.showToast === 'function') {
            window.jsdcApp.showToast(message, type);
        } else {
            // Fallback to console
            console.log(`[${type.toUpperCase()}] ${message}`);
            
            // Create a simple notification
            const toast = document.createElement('div');
            toast.className = `position-fixed bottom-0 end-0 m-3 p-3 rounded bg-${type} text-white`;
            toast.style.zIndex = '9999';
            toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            toast.innerHTML = `
                <div class="d-flex align-items-center">
                    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} me-2"></i>
                    <span>${message}</span>
                </div>
            `;
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transition = 'opacity 0.3s';
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }
    }

    // FIXED: Date range picker setup with proper clear behavior
    static setupDateRangePicker() {
        if (typeof $ === 'undefined' || !$.fn.daterangepicker) {
            console.warn('DateRangePicker not loaded');
            return;
        }
        
        const picker = $('#dateRangePicker');
        if (picker.length) {
            picker.daterangepicker({
                opens: 'left',
                autoUpdateInput: false,
                locale: {
                    format: 'YYYY-MM-DD',
                    cancelLabel: 'Clear'
                }
            }, (start, end) => {
                // Update the specific span element
                $('#range-display').text(start.format('MMM D, YYYY') + ' - ' + end.format('MMM D, YYYY'));
                
                // Remove active state from period buttons
                const periodButtons = document.querySelectorAll('#lineChartPeriod button');
                periodButtons.forEach(btn => btn.classList.remove('active'));
                
                // Trigger the data fetch
                this.fetchCustomRangeData(start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD'));
            });
            
            // FIXED: Handle cancel/clear - reset to monthly period
            picker.on('cancel.daterangepicker', () => {
                // Reset display text
                $('#range-display').text('Select Custom Range');
                
                // Reactivate Monthly button
                const periodButtons = document.querySelectorAll('#lineChartPeriod button');
                periodButtons.forEach(btn => {
                    btn.classList.remove('active');
                    if (btn.getAttribute('data-period') === 'monthly') {
                        btn.classList.add('active');
                    }
                });
                
                // Reset to monthly period data
                this.chartConfigs.lineChartPeriod = 'monthly';
                this.fetchChartData('monthly');
                
                this.showToast('Returned to monthly view', 'info');
            });
        }
    }

    static async fetchCustomRangeData(start, end) {
        this.showToast("Updating charts...", "info");
        this.chartConfigs.lineChartPeriod = 'custom';

        const apiUrl = `/api/dashboard-charts/?start_date=${start}&end_date=${end}`;
        
        try {
            const response = await fetch(apiUrl);
            const data = await response.json();
            
            if (data.success) {
                // Update the Line Chart
                this.updateLineChartWithData(data.line_chart, 'custom');
                
                // Update the Doughnut Chart/Overview
                this.updateMonthOverviewWithData(data.month_overview);

                // This recalculates the averages for the new 'custom' period
                this.updateLineChartStats('custom');
                
                // Force a refresh of the chart UI
                this.chartInstances.financialChart.update('none');
                this.chartInstances.cashFlowChart.update('none');

                this.showToast("Data synced for selected range", "success");
            }
        } catch (error) {
            console.error("Fetch Error:", error);
            this.showToast("Error updating range", "danger");
        }
    }
    
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - initializing dashboard manager');
    
    // Check if we're on the dashboard page
    if (document.querySelector('.dashboard-page') || window.location.pathname.includes('dashboard')) {
        DashboardManager.initialize();
    }
});