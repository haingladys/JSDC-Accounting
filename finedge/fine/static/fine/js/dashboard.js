// dashboard.js
class DashboardManager {
    static initialize() {
        console.log('Initializing dashboard');
        
        // Chart period buttons
        const chartPeriodBtns = document.querySelectorAll('#chart-period button');
        chartPeriodBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                chartPeriodBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.updateChartPeriod(btn.getAttribute('data-period'));
            });
        });
        
        // Quick action buttons
        this.setupQuickActions();
        
        console.log('Dashboard initialized');
    }
    
    static setupQuickActions() {
        // Record Income Button
        const recordIncomeBtn = document.querySelector('[data-bs-target="#addIncomeModal"]');
        if (recordIncomeBtn) {
            recordIncomeBtn.addEventListener('click', () => {
                console.log('Opening income modal from dashboard');
            });
        }
        
        // Record Expense Button
        const recordExpenseBtn = document.querySelector('[data-bs-target="#addExpenseModal"]');
        if (recordExpenseBtn) {
            recordExpenseBtn.addEventListener('click', () => {
                console.log('Opening expense modal from dashboard');
            });
        }
        
        // Record Purchase Button
        const recordPurchaseBtn = document.querySelector('[data-bs-target="#addPurchaseModal"]');
        if (recordPurchaseBtn) {
            recordPurchaseBtn.addEventListener('click', () => {
                console.log('Opening purchase modal from dashboard');
            });
        }
    }
    
    static updateChartPeriod(period) {
        console.log('Chart period updated to:', period);
        // Implement chart data update based on period
        if (window.jsdcApp) {
            window.jsdcApp.showToast(`Chart view changed to ${period} view`);
        }
    }
}