// dashboard.js - Dashboard page specific logic
document.addEventListener("DOMContentLoaded", function () {
    // Check if we're on dashboard page
    const dashboardPage = document.getElementById('dashboard-page');
    if (!dashboardPage) return;
    
    // Initialize DashboardPage class
    class DashboardPage {
        constructor(app) {
            this.app = app;
            const now = new Date();
            this.dashboardMonth = now.getMonth() + 1;
            this.dashboardYear = now.getFullYear();
            this.financialChart = null;
            this.cashFlowChart = null;
            this.isInitialized = false;
        }

        initialize() {
            console.log('DashboardPage initializing...');
            
            if (this.isInitialized) {
                this.updateDashboardData();
                return;
            }

            const now = new Date();
            this.dashboardMonth = now.getMonth() + 1;
            this.dashboardYear = now.getFullYear();
            
            this.updatePeriodDisplay();
            this.initializeEmptyCharts();
            this.setupChartPeriodButtons();
            
            setTimeout(() => {
                this.updateDashboardData();
            }, 100);

            this.isInitialized = true;
        }

        updatePeriodDisplay() {
            const monthName = this.getMonthName(this.dashboardMonth);
            
            const currentPeriodLabel = document.getElementById('current-period-label');
            if (currentPeriodLabel) {
                currentPeriodLabel.textContent = `${monthName} ${this.dashboardYear}`;
            }
            
            const periodText = document.getElementById('dashboard-period-text');
            if (periodText) {
                periodText.textContent = `${monthName} ${this.dashboardYear}`;
            }
        }

        setupChartPeriodButtons() {
            const chartPeriodBtns = document.querySelectorAll('#chart-period button');
            chartPeriodBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    chartPeriodBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    
                    const period = btn.getAttribute('data-period');
                    const dashboardData = this.getDashboardData();
                    this.updateFinancialChart(period, dashboardData);
                });
            });
            
            if (!document.querySelector('#chart-period button.active')) {
                const firstBtn = chartPeriodBtns[0];
                if (firstBtn) {
                    firstBtn.classList.add('active');
                }
            }
        }

        updateDashboardData() {
            console.log('Updating dashboard data...');
            const dashboardData = this.getDashboardData();
            this.updateDashboardSummaryCards(dashboardData);
            this.updateDashboardCharts(dashboardData);
        }

        getDashboardData() {
            try {
                if (!window.jsdcApp) {
                    return this.getEmptyData();
                }
                
                const incomeData = this.getIncomeDataForPeriod();
                const expenseData = this.getExpenseDataForPeriod();
                const purchaseData = this.getPurchaseDataForPeriod();
                const payrollData = this.getPayrollDataForPeriod();
                
                const hasAnyData = incomeData.length > 0 || expenseData.length > 0 || 
                                   purchaseData.length > 0 || payrollData.length > 0;
                
                if (!hasAnyData) {
                    return this.getEmptyData();
                }
                
                const totalIncome = incomeData.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
                const totalExpenses = expenseData.reduce((sum, item) => sum + (parseFloat(item.total || item.amount) || 0), 0);
                const totalPurchases = purchaseData.reduce((sum, item) => sum + (parseFloat(item.total || item.amount) || 0), 0);
                const totalPayroll = payrollData.reduce((sum, emp) => sum + (window.jsdcApp.calculateNetSalary ? window.jsdcApp.calculateNetSalary(emp) : 0), 0);
                const netBalance = totalIncome - totalExpenses - totalPurchases - totalPayroll;
                
                return {
                    hasData: true,
                    totalIncome,
                    totalExpenses,
                    totalPurchases,
                    totalPayroll,
                    netBalance,
                    incomeData,
                    expenseData,
                    purchaseData,
                    payrollData
                };
            } catch (error) {
                console.error('Error getting dashboard data:', error);
                return this.getEmptyData();
            }
        }

        getEmptyData() {
            return {
                hasData: false,
                totalIncome: 0,
                totalExpenses: 0,
                totalPurchases: 0,
                totalPayroll: 0,
                netBalance: 0,
                incomeData: [],
                expenseData: [],
                purchaseData: [],
                payrollData: []
            };
        }

        getIncomeDataForPeriod() {
            if (!window.jsdcApp?.incomeManager?.getAllIncomeRecords) {
                return [];
            }
            
            try {
                const allIncome = window.jsdcApp.incomeManager.getAllIncomeRecords();
                if (!Array.isArray(allIncome)) return [];
                
                return allIncome.filter(item => {
                    if (!item || !item.date) return false;
                    try {
                        const itemDate = new Date(item.date);
                        return itemDate.getMonth() + 1 === this.dashboardMonth && 
                               itemDate.getFullYear() === this.dashboardYear;
                    } catch (e) {
                        return false;
                    }
                });
            } catch (error) {
                console.error('Error getting income data:', error);
                return [];
            }
        }

        getExpenseDataForPeriod() {
            if (!window.jsdcApp?.AppState?.expenses) return [];
            
            try {
                const expenses = window.jsdcApp.AppState.expenses;
                if (!Array.isArray(expenses)) return [];
                
                return expenses.filter(item => {
                    if (!item || !item.date) return false;
                    try {
                        const itemDate = new Date(item.date);
                        return itemDate.getMonth() + 1 === this.dashboardMonth && 
                               itemDate.getFullYear() === this.dashboardYear;
                    } catch (e) {
                        return false;
                    }
                });
            } catch (error) {
                console.error('Error getting expense data:', error);
                return [];
            }
        }

        getPurchaseDataForPeriod() {
            if (!window.jsdcApp?.AppState?.purchases) return [];
            
            try {
                const purchases = window.jsdcApp.AppState.purchases;
                if (!Array.isArray(purchases)) return [];
                
                return purchases.filter(item => {
                    if (!item || !item.date) return false;
                    try {
                        const itemDate = new Date(item.date);
                        return itemDate.getMonth() + 1 === this.dashboardMonth && 
                               itemDate.getFullYear() === this.dashboardYear;
                    } catch (e) {
                        return false;
                    }
                });
            } catch (error) {
                console.error('Error getting purchase data:', error);
                return [];
            }
        }

        getPayrollDataForPeriod() {
            if (!window.jsdcApp?.payrollEmployees) return [];
            
            try {
                const payrollData = window.jsdcApp.payrollEmployees;
                if (!Array.isArray(payrollData)) return [];
                
                return payrollData.filter(emp => {
                    return emp.month === this.dashboardMonth && emp.year === this.dashboardYear;
                });
            } catch (error) {
                console.error('Error getting payroll data:', error);
                return [];
            }
        }

        updateDashboardSummaryCards(data) {
            console.log('Updating summary cards with data:', data);
            
            const incomeCard = document.querySelector('.summary-card.income h3');
            const incomeSmall = document.querySelector('.summary-card.income small');
            const incomeCardElement = document.querySelector('.summary-card.income');
            
            if (incomeCard) {
                if (data.hasData && data.totalIncome > 0) {
                    incomeCard.textContent = `₹${data.totalIncome.toLocaleString()}`;
                    incomeCardElement.classList.remove('no-data');
                } else {
                    incomeCard.textContent = 'No Data';
                    incomeCardElement.classList.add('no-data');
                }
            }
            
            const expenseCard = document.querySelector('.summary-card.expense h3');
            const expenseSmall = document.querySelector('.summary-card.expense small');
            const expenseCardElement = document.querySelector('.summary-card.expense');
            
            if (expenseCard) {
                if (data.hasData && data.totalExpenses !== 0) {
                    expenseCard.textContent = `₹${data.totalExpenses.toLocaleString()}`;
                    expenseCardElement.classList.remove('no-data');
                } else {
                    expenseCard.textContent = 'No Data';
                    expenseCardElement.classList.add('no-data');
                }
            }
            
            const purchaseCard = document.querySelector('.summary-card.purchase h3');
            const purchaseSmall = document.querySelector('.summary-card.purchase small');
            const purchaseCardElement = document.querySelector('.summary-card.purchase');
            
            if (purchaseCard) {
                if (data.hasData && data.totalPurchases > 0) {
                    purchaseCard.textContent = `₹${data.totalPurchases.toLocaleString()}`;
                    purchaseCardElement.classList.remove('no-data');
                } else {
                    purchaseCard.textContent = 'No Data';
                    purchaseCardElement.classList.add('no-data');
                }
            }
            
            const netBalanceCard = document.querySelector('.summary-card:not(.income):not(.expense):not(.purchase) h3');
            const netBalanceCardElement = document.querySelector('.summary-card:not(.income):not(.expense):not(.purchase)');
            
            if (netBalanceCard) {
                if (data.hasData) {
                    netBalanceCard.textContent = `₹${data.netBalance.toLocaleString()}`;
                    if (data.netBalance > 0) {
                        netBalanceCardElement.classList.remove('negative-balance');
                        netBalanceCardElement.classList.add('positive-balance');
                    } else if (data.netBalance < 0) {
                        netBalanceCardElement.classList.remove('positive-balance');
                        netBalanceCardElement.classList.add('negative-balance');
                    } else {
                        netBalanceCardElement.classList.remove('positive-balance', 'negative-balance');
                    }
                    netBalanceCardElement.classList.remove('no-data');
                } else {
                    netBalanceCard.textContent = 'No Data';
                    netBalanceCardElement.classList.add('no-data');
                    netBalanceCardElement.classList.remove('positive-balance', 'negative-balance');
                }
            }
        }

        updateDashboardCharts(data) {
            const activeBtn = document.querySelector('#chart-period button.active');
            const period = activeBtn ? activeBtn.getAttribute('data-period') : 'Weekly';
            this.updateFinancialChart(period, data);
            this.updateCashFlowChart(data);
        }

        initializeEmptyCharts() {
            const financialCtx = document.getElementById('financialChart');
            if (financialCtx) {
                const existingChart = Chart.getChart(financialCtx);
                if (existingChart) {
                    existingChart.destroy();
                }
                
                this.financialChart = new Chart(financialCtx, {
                    type: 'line',
                    data: {
                        labels: ['No Data'],
                        datasets: [
                            {
                                label: 'Income',
                                data: [0],
                                borderColor: '#10b981',
                                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                borderWidth: 2,
                                tension: 0.4,
                                fill: true
                            },
                            {
                                label: 'Expenses',
                                data: [0],
                                borderColor: '#ef4444',
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                borderWidth: 2,
                                tension: 0.4,
                                fill: true
                            },
                            {
                                label: 'Purchases',
                                data: [0],
                                borderColor: '#f59e0b',
                                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                                borderWidth: 2,
                                tension: 0.4,
                                fill: true
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'top'
                            },
                            tooltip: {
                                mode: 'index',
                                intersect: false,
                                callbacks: {
                                    label: function(context) {
                                        let label = context.dataset.label || '';
                                        if (label) {
                                            label += ': ';
                                        }
                                        const value = context.raw || 0;
                                        label += '₹' + value.toLocaleString();
                                        return label;
                                    }
                                }
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
            }
            
            const cashFlowCtx = document.getElementById('cashFlowChart');
            if (cashFlowCtx) {
                const existingChart = Chart.getChart(cashFlowCtx);
                if (existingChart) {
                    existingChart.destroy();
                }
                
                this.cashFlowChart = new Chart(cashFlowCtx, {
                    type: 'doughnut',
                    data: {
                        labels: ['No Data Available'],
                        datasets: [{
                            data: [100],
                            backgroundColor: ['#e2e8f0'],
                            borderColor: ['#cbd5e1'],
                            borderWidth: 2,
                            hoverOffset: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: { enabled: false }
                        },
                        cutout: '65%'
                    }
                });
            }
        }

        updateFinancialChart(period, data) {
            if (!this.financialChart) return;
            
            try {
                if (data.hasData) {
                    const chartData = this.getFinancialChartData(period, data);
                    
                    this.financialChart.data.labels = chartData.labels;
                    this.financialChart.data.datasets[0].data = chartData.income;
                    this.financialChart.data.datasets[1].data = chartData.expenses;
                    this.financialChart.data.datasets[2].data = chartData.purchases;
                    
                    this.financialChart.data.datasets.forEach(dataset => {
                        dataset.hidden = false;
                    });
                    
                    this.financialChart.update('none');
                } else {
                    this.financialChart.data.labels = ['No Data'];
                    this.financialChart.data.datasets[0].data = [0];
                    this.financialChart.data.datasets[1].data = [0];
                    this.financialChart.data.datasets[2].data = [0];
                    
                    this.financialChart.data.datasets.forEach(dataset => {
                        dataset.hidden = true;
                    });
                    
                    this.financialChart.update('none');
                }
            } catch (error) {
                console.error('Error updating financial chart:', error);
            }
        }

        getFinancialChartData(period, dashboardData) {
            const labels = [];
            const income = [];
            const expenses = [];
            const purchases = [];
            
            try {
                if (period === 'Weekly') {
                    const daysInMonth = new Date(this.dashboardYear, this.dashboardMonth, 0).getDate();
                    const weeksCount = Math.min(4, Math.ceil(daysInMonth / 7));
                    
                    for (let week = 1; week <= weeksCount; week++) {
                        labels.push(`Week ${week}`);
                        
                        const weekStart = (week - 1) * 7 + 1;
                        const weekEnd = Math.min(week * 7, daysInMonth);
                        
                        const weekIncome = dashboardData.incomeData
                            ?.filter(item => {
                                try {
                                    const day = new Date(item.date).getDate();
                                    return day >= weekStart && day <= weekEnd;
                                } catch (e) {
                                    return false;
                                }
                            })
                            ?.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0) || 0;
                        
                        const weekExpenses = dashboardData.expenseData
                            ?.filter(item => {
                                try {
                                    const day = new Date(item.date).getDate();
                                    return day >= weekStart && day <= weekEnd;
                                } catch (e) {
                                    return false;
                                }
                            })
                            ?.reduce((sum, item) => sum + (parseFloat(item.total || item.amount) || 0), 0) || 0;
                        
                        const weekPurchases = dashboardData.purchaseData
                            ?.filter(item => {
                                try {
                                    const day = new Date(item.date).getDate();
                                    return day >= weekStart && day <= weekEnd;
                                } catch (e) {
                                    return false;
                                }
                            })
                            ?.reduce((sum, item) => sum + (parseFloat(item.total || item.amount) || 0), 0) || 0;
                        
                        income.push(weekIncome);
                        expenses.push(weekExpenses);
                        purchases.push(weekPurchases);
                    }
                } else if (period === 'Monthly') {
                    const daysInMonth = new Date(this.dashboardYear, this.dashboardMonth, 0).getDate();
                    const step = Math.max(1, Math.floor(daysInMonth / 10));
                    
                    for (let day = 1; day <= daysInMonth; day += step) {
                        labels.push(`Day ${day}`);
                        
                        const dayIncome = dashboardData.incomeData
                            ?.filter(item => {
                                try {
                                    return new Date(item.date).getDate() === day;
                                } catch (e) {
                                    return false;
                                }
                            })
                            ?.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0) || 0;
                        
                        const dayExpenses = dashboardData.expenseData
                            ?.filter(item => {
                                try {
                                    return new Date(item.date).getDate() === day;
                                } catch (e) {
                                    return false;
                                }
                            })
                            ?.reduce((sum, item) => sum + (parseFloat(item.total || item.amount) || 0), 0) || 0;
                        
                        const dayPurchases = dashboardData.purchaseData
                            ?.filter(item => {
                                try {
                                    return new Date(item.date).getDate() === day;
                                } catch (e) {
                                    return false;
                                }
                            })
                            ?.reduce((sum, item) => sum + (parseFloat(item.total || item.amount) || 0), 0) || 0;
                        
                        income.push(dayIncome);
                        expenses.push(dayExpenses);
                        purchases.push(dayPurchases);
                    }
                } else if (period === 'yearly') {
                    for (let month = 1; month <= 12; month++) {
                        labels.push(this.getMonthName(month).substring(0, 3));
                        
                        const monthStart = new Date(this.dashboardYear, month - 1, 1);
                        const monthEnd = new Date(this.dashboardYear, month, 0);
                        
                        const monthIncome = dashboardData.incomeData
                            ?.filter(item => {
                                try {
                                    const itemDate = new Date(item.date);
                                    return itemDate >= monthStart && itemDate <= monthEnd;
                                } catch (e) {
                                    return false;
                                }
                            })
                            ?.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0) || 0;
                        
                        const monthExpenses = dashboardData.expenseData
                            ?.filter(item => {
                                try {
                                    const itemDate = new Date(item.date);
                                    return itemDate >= monthStart && itemDate <= monthEnd;
                                } catch (e) {
                                    return false;
                                }
                            })
                            ?.reduce((sum, item) => sum + (parseFloat(item.total || item.amount) || 0), 0) || 0;
                        
                        const monthPurchases = dashboardData.purchaseData
                            ?.filter(item => {
                                try {
                                    const itemDate = new Date(item.date);
                                    return itemDate >= monthStart && itemDate <= monthEnd;
                                } catch (e) {
                                    return false;
                                }
                            })
                            ?.reduce((sum, item) => sum + (parseFloat(item.total || item.amount) || 0), 0) || 0;
                        
                        income.push(monthIncome);
                        expenses.push(monthExpenses);
                        purchases.push(monthPurchases);
                    }
                }
                
                const hasChartData = income.some(val => val > 0) || 
                                     expenses.some(val => val > 0) || 
                                     purchases.some(val => val > 0);
                
                if (!hasChartData) {
                    return {
                        labels: ['No Data'],
                        income: [0],
                        expenses: [0],
                        purchases: [0]
                    };
                }
                
                return { labels, income, expenses, purchases };
            } catch (error) {
                console.error('Error generating chart data:', error);
                return {
                    labels: ['No Data'],
                    income: [0],
                    expenses: [0],
                    purchases: [0]
                };
            }
        }

        updateCashFlowChart(data) {
            if (!this.cashFlowChart) return;
            
            try {
                const cashFlowCtx = document.getElementById('cashFlowChart');
                
                if (data.hasData && (data.totalIncome > 0 || data.totalExpenses > 0 || data.totalPurchases > 0)) {
                    this.cashFlowChart.data.labels = ['Income', 'Expenses', 'Purchases'];
                    this.cashFlowChart.data.datasets[0].data = [
                        data.totalIncome,
                        data.totalExpenses,
                        data.totalPurchases
                    ];
                    this.cashFlowChart.data.datasets[0].backgroundColor = [
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(239, 68, 68, 0.8)',
                        'rgba(245, 158, 11, 0.8)'
                    ];
                    this.cashFlowChart.data.datasets[0].borderColor = [
                        'rgb(16, 185, 129)',
                        'rgb(239, 68, 68)',
                        'rgb(245, 158, 11)'
                    ];
                    this.cashFlowChart.data.datasets[0].hoverOffset = 15;
                    
                    this.cashFlowChart.options.plugins.legend.display = true;
                    this.cashFlowChart.options.plugins.tooltip.enabled = true;
                    
                    this.cashFlowChart.update('none');
                } else {
                    this.cashFlowChart.data.labels = ['No Data Available'];
                    this.cashFlowChart.data.datasets[0].data = [100];
                    this.cashFlowChart.data.datasets[0].backgroundColor = ['#e2e8f0'];
                    this.cashFlowChart.data.datasets[0].borderColor = ['#cbd5e1'];
                    this.cashFlowChart.data.datasets[0].hoverOffset = 0;
                    
                    this.cashFlowChart.options.plugins.legend.display = false;
                    this.cashFlowChart.options.plugins.tooltip.enabled = false;
                    
                    this.cashFlowChart.update('none');
                }
            } catch (error) {
                console.error('Error updating cash flow chart:', error);
            }
        }

        getMonthName(monthNumber) {
            const months = [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
            ];
            return months[monthNumber - 1] || 'Unknown';
        }
    }

    // Initialize dashboard page if it exists
    if (window.jsdcApp) {
        window.dashboardPage = new DashboardPage(window.jsdcApp);
        window.dashboardPage.initialize();
    }
});