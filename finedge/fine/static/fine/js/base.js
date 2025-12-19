// base.js - Global application initialization
document.addEventListener("DOMContentLoaded", function() {
    'use strict';
    
    console.log('base.js loaded - Initializing global app');
    
    // Create global app object if it doesn't exist
    window.jsdcApp = window.jsdcApp || {};
    
    // Initialize app methods
    window.jsdcApp.getCSRFToken = function() {
        return document.querySelector('[name=csrfmiddlewaretoken]')?.value || '';
    };
    
    window.jsdcApp.showToast = function(message, type = 'success') {
        const toastEl = document.getElementById('successToast');
        if (!toastEl) return;
        
        const toastMessage = document.getElementById('toast-message');
        if (toastMessage) {
            toastMessage.textContent = message;
        }
        
        // Update toast color based on type
        toastEl.classList.remove('bg-success', 'bg-danger', 'bg-warning');
        if (type === 'error') {
            toastEl.classList.add('bg-danger');
        } else if (type === 'warning') {
            toastEl.classList.add('bg-warning');
        } else {
            toastEl.classList.add('bg-success');
        }
        
        const toast = new bootstrap.Toast(toastEl);
        toast.show();
    };
    
    window.jsdcApp.getMonthName = function(monthNumber) {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return months[monthNumber - 1] || 'Unknown';
    };
    
    console.log('Global app initialized:', window.jsdcApp);
});