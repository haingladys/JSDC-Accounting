// base.js - Global controller and shared utilities for JSDC application
document.addEventListener("DOMContentLoaded", function () {
    'use strict';

    // Global Application Namespace
    window.App = {
        utils: {},
        ui: {},
        modal: {},
        ajax: {},
        notifications: {},
        state: {}
    };

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================
    
    App.utils = {
        /**
         * Safely select DOM element(s)
         * @param {string} selector - CSS selector
         * @param {HTMLElement} parent - Parent element to search within
         * @returns {HTMLElement|NodeList|null}
         */
        select: function(selector, parent = document) {
            try {
                const result = parent.querySelector(selector);
                return result;
            } catch (error) {
                console.error('Error selecting element:', error);
                return null;
            }
        },

        /**
         * Safely select all DOM elements matching selector
         * @param {string} selector - CSS selector
         * @param {HTMLElement} parent - Parent element to search within
         * @returns {NodeList|Array}
         */
        selectAll: function(selector, parent = document) {
            try {
                const result = parent.querySelectorAll(selector);
                return result;
            } catch (error) {
                console.error('Error selecting elements:', error);
                return [];
            }
        },

        /**
         * Check if element exists
         * @param {string} selector - CSS selector
         * @returns {boolean}
         */
        exists: function(selector) {
            return this.select(selector) !== null;
        },

        /**
         * Safely add/remove/toggle classes
         * @param {HTMLElement} element - Target element
         * @param {string} action - 'add', 'remove', or 'toggle'
         * @param {string} className - Class name(s)
         */
        classAction: function(element, action, className) {
            if (!element || !className) return;
            
            try {
                const classes = className.split(' ').filter(c => c.trim());
                classes.forEach(cls => {
                    if (action === 'add' && cls) element.classList.add(cls);
                    else if (action === 'remove' && cls) element.classList.remove(cls);
                    else if (action === 'toggle' && cls) element.classList.toggle(cls);
                });
            } catch (error) {
                console.error('Error performing class action:', error);
            }
        },

        /**
         * Debounce function for performance optimization
         * @param {Function} func - Function to debounce
         * @param {number} wait - Wait time in milliseconds
         * @returns {Function}
         */
        debounce: function(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        /**
         * Throttle function for performance optimization
         * @param {Function} func - Function to throttle
         * @param {number} limit - Time limit in milliseconds
         * @returns {Function}
         */
        throttle: function(func, limit) {
            let inThrottle;
            return function(...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },

        /**
         * Safe parse JSON with fallback
         * @param {string} str - JSON string
         * @param {*} defaultValue - Default value if parsing fails
         * @returns {*}
         */
        safeParse: function(str, defaultValue = null) {
            try {
                return JSON.parse(str);
            } catch (error) {
                console.error('Error parsing JSON:', error);
                return defaultValue;
            }
        },

        /**
         * Format currency
         * @param {number} amount - Amount to format
         * @param {string} currency - Currency symbol
         * @returns {string}
         */
        formatCurrency: function(amount, currency = '₹') {
            if (isNaN(amount)) return `${currency}0`;
            return `${currency}${parseFloat(amount).toLocaleString('en-IN')}`;
        },

        /**
         * Format date to Indian format
         * @param {Date|string} date - Date to format
         * @returns {string}
         */
        formatDate: function(date) {
            if (!date) return 'N/A';
            
            try {
                const d = new Date(date);
                if (isNaN(d.getTime())) return 'Invalid Date';
                
                return d.toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                });
            } catch (error) {
                console.error('Error formatting date:', error);
                return 'Invalid Date';
            }
        },

        /**
         * Get current page identifier
         * @returns {string|null}
         */
        getCurrentPage: function() {
            const pageElement = document.querySelector('[data-page]');
            if (pageElement) return pageElement.getAttribute('data-page');
            
            const bodyId = document.body.id;
            if (bodyId && bodyId.includes('-page')) {
                return bodyId.replace('-page', '');
            }
            
            return null;
        },

        /**
         * Check if we're on a specific page
         * @param {string} pageName - Page name to check
         * @returns {boolean}
         */
        isPage: function(pageName) {
            const currentPage = this.getCurrentPage();
            return currentPage === pageName;
        }
    };

    // ============================================
    // UI & LAYOUT CONTROL
    // ============================================
    
    App.ui = {
        /**
         * Initialize all UI components
         */
        init: function() {
            this.setupSidebar();
            this.setupNavbar();
            this.highlightActiveMenu();
            this.setupResponsiveHelpers();
        },

        /**
         * Setup sidebar toggle functionality
         */
        setupSidebar: function() {
            const sidebarToggle = App.utils.select('#sidebarToggle');
            const sidebar = App.utils.select('#sidebar');
            const mainContent = App.utils.select('#main-content');
            
            if (!sidebarToggle || !sidebar) return;
            
            sidebarToggle.addEventListener('click', () => {
                App.utils.classAction(sidebar, 'toggle', 'collapsed');
                App.utils.classAction(mainContent, 'toggle', 'expanded');
                
                // Save state
                const isCollapsed = sidebar.classList.contains('collapsed');
                localStorage.setItem('sidebarCollapsed', isCollapsed);
            });
            
            // Restore sidebar state
            const savedState = localStorage.getItem('sidebarCollapsed');
            if (savedState === 'true') {
                App.utils.classAction(sidebar, 'add', 'collapsed');
                App.utils.classAction(mainContent, 'add', 'expanded');
            }
        },

        /**
         * Setup navbar functionality
         */
        setupNavbar: function() {
            const navbarToggle = App.utils.select('.navbar-toggler');
            const navbarCollapse = App.utils.select('#navbarNav');
            
            if (navbarToggle && navbarCollapse) {
                navbarToggle.addEventListener('click', () => {
                    App.utils.classAction(navbarCollapse, 'toggle', 'show');
                });
                
                // Close navbar when clicking outside on mobile
                document.addEventListener('click', (e) => {
                    if (window.innerWidth < 992 && 
                        !navbarToggle.contains(e.target) && 
                        !navbarCollapse.contains(e.target) && 
                        navbarCollapse.classList.contains('show')) {
                        App.utils.classAction(navbarCollapse, 'remove', 'show');
                    }
                });
            }
        },

        /**
         * Highlight active menu item based on current page
         */
        highlightActiveMenu: function() {
            const currentPage = App.utils.getCurrentPage();
            if (!currentPage) return;
            
            // Remove active class from all menu items
            const menuItems = App.utils.selectAll('.nav-link');
            menuItems.forEach(item => {
                App.utils.classAction(item, 'remove', 'active');
            });
            
            // Find and activate current page's menu item
            const activeItem = App.utils.select(`[data-page-link="${currentPage}"]`);
            if (activeItem) {
                App.utils.classAction(activeItem, 'add', 'active');
            }
        },

        /**
         * Setup responsive layout helpers
         */
        setupResponsiveHelpers: function() {
            // Handle window resize with debounce
            const handleResize = App.utils.debounce(() => {
                this.updateResponsiveClasses();
            }, 250);
            
            window.addEventListener('resize', handleResize);
            this.updateResponsiveClasses(); // Initial call
        },

        /**
         * Update responsive CSS classes
         */
        updateResponsiveClasses: function() {
            const width = window.innerWidth;
            const body = document.body;
            
            // Remove existing responsive classes
            ['xs', 'sm', 'md', 'lg', 'xl'].forEach(size => {
                App.utils.classAction(body, 'remove', `viewport-${size}`);
            });
            
            // Add current viewport class
            if (width < 576) App.utils.classAction(body, 'add', 'viewport-xs');
            else if (width < 768) App.utils.classAction(body, 'add', 'viewport-sm');
            else if (width < 992) App.utils.classAction(body, 'add', 'viewport-md');
            else if (width < 1200) App.utils.classAction(body, 'add', 'viewport-lg');
            else App.utils.classAction(body, 'add', 'viewport-xl');
        },

        /**
         * Show loading spinner
         * @param {string} containerId - Container ID to show spinner in
         */
        showLoading: function(containerId = 'main-content') {
            const container = App.utils.select(`#${containerId}`);
            if (!container) return;
            
            const spinner = document.createElement('div');
            spinner.className = 'loading-spinner-overlay';
            spinner.innerHTML = `
                <div class="spinner-container">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
            `;
            spinner.id = 'global-loading-spinner';
            
            container.appendChild(spinner);
        },

        /**
         * Hide loading spinner
         */
        hideLoading: function() {
            const spinner = App.utils.select('#global-loading-spinner');
            if (spinner) {
                spinner.remove();
            }
        },

        /**
         * Scroll to element smoothly
         * @param {string} selector - Element selector
         * @param {object} options - Scroll options
         */
        scrollTo: function(selector, options = {}) {
            const element = App.utils.select(selector);
            if (!element) return;
            
            const defaultOptions = {
                behavior: 'smooth',
                block: 'start'
            };
            
            element.scrollIntoView({ ...defaultOptions, ...options });
        }
    };

    // ============================================
    // MODAL CONTROL
    // ============================================
    
    App.modal = {
        _activeModal: null,
        _modalBackdrop: null,

        /**
         * Open a modal
         * @param {string} modalId - ID of the modal element
         * @param {object} options - Modal options
         */
        open: function(modalId, options = {}) {
            // Close any active modal first
            if (this._activeModal) {
                this.close();
            }
            
            const modalElement = App.utils.select(`#${modalId}`);
            if (!modalElement) {
                console.error(`Modal #${modalId} not found`);
                return null;
            }
            
            const modal = new bootstrap.Modal(modalElement, {
                backdrop: options.backdrop !== undefined ? options.backdrop : true,
                keyboard: options.keyboard !== undefined ? options.keyboard : true,
                focus: options.focus !== undefined ? options.focus : true
            });
            
            modal.show();
            this._activeModal = modal;
            
            // Store reference to modal element
            modalElement._modalInstance = modal;
            
            // Set up event listeners
            modalElement.addEventListener('hidden.bs.modal', () => {
                this._activeModal = null;
                delete modalElement._modalInstance;
                
                if (options.onClose && typeof options.onClose === 'function') {
                    options.onClose();
                }
            });
            
            if (options.onOpen && typeof options.onOpen === 'function') {
                options.onOpen();
            }
            
            return modal;
        },

        /**
         * Close active modal
         */
        close: function() {
            if (this._activeModal) {
                this._activeModal.hide();
            }
            
            // Also close any modal via data attribute
            const openModals = App.utils.selectAll('.modal.show');
            openModals.forEach(modal => {
                const instance = bootstrap.Modal.getInstance(modal);
                if (instance) {
                    instance.hide();
                }
            });
            
            this._activeModal = null;
        },

        /**
         * Check if any modal is open
         * @returns {boolean}
         */
        isOpen: function() {
            return !!this._activeModal || App.utils.select('.modal.show') !== null;
        },

        /**
         * Create and show a confirmation modal
         * @param {string} title - Modal title
         * @param {string} message - Modal message
         * @param {object} options - Modal options
         * @returns {Promise}
         */
        confirm: function(title, message, options = {}) {
            return new Promise((resolve) => {
                const modalId = 'confirmation-modal-' + Date.now();
                const modalHtml = `
                    <div class="modal fade" id="${modalId}" tabindex="-1">
                        <div class="modal-dialog">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title">${title}</h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                </div>
                                <div class="modal-body">
                                    <p>${message}</p>
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                        ${options.cancelText || 'Cancel'}
                                    </button>
                                    <button type="button" class="btn btn-primary" id="${modalId}-confirm">
                                        ${options.confirmText || 'Confirm'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                // Add modal to DOM
                document.body.insertAdjacentHTML('beforeend', modalHtml);
                
                const modalElement = App.utils.select(`#${modalId}`);
                const modal = this.open(modalId, {
                    backdrop: 'static',
                    keyboard: false,
                    onClose: () => {
                        modalElement.remove();
                        resolve(false);
                    }
                });
                
                // Handle confirm button click
                App.utils.select(`#${modalId}-confirm`).addEventListener('click', () => {
                    modal.hide();
                    resolve(true);
                });
            });
        }
    };

    // ============================================
    // AJAX / FETCH HELPERS
    // ============================================
    
    App.ajax = {
        /**
         * Get CSRF token from cookies
         * @returns {string|null}
         */
        getCSRFToken: function() {
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
        },

        /**
         * CSRF-safe fetch wrapper
         * @param {string} url - Request URL
         * @param {object} options - Fetch options
         * @returns {Promise}
         */
        request: function(url, options = {}) {
            const csrfToken = this.getCSRFToken();
            const defaultOptions = {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin'
            };
            
            // Add CSRF token for non-GET requests
            if (csrfToken && options.method && options.method !== 'GET') {
                defaultOptions.headers['X-CSRFToken'] = csrfToken;
            }
            
            const mergedOptions = {
                ...defaultOptions,
                ...options,
                headers: {
                    ...defaultOptions.headers,
                    ...options.headers
                }
            };
            
            return fetch(url, mergedOptions)
                .then(response => this.handleResponse(response))
                .catch(error => this.handleError(error));
        },

        /**
         * Handle fetch response
         * @param {Response} response - Fetch response
         * @returns {Promise}
         */
        handleResponse: function(response) {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return response.json();
            }
            
            return response.text();
        },

        /**
         * Handle fetch errors
         * @param {Error} error - Error object
         * @returns {Promise}
         */
        handleError: function(error) {
            console.error('AJAX request failed:', error);
            
            App.notifications.show({
                type: 'error',
                message: 'Network error occurred. Please check your connection.',
                duration: 5000
            });
            
            return Promise.reject(error);
        },

        /**
         * GET request helper
         * @param {string} url - Request URL
         * @param {object} params - Query parameters
         * @returns {Promise}
         */
        get: function(url, params = {}) {
            const queryString = new URLSearchParams(params).toString();
            const fullUrl = queryString ? `${url}?${queryString}` : url;
            
            return this.request(fullUrl, {
                method: 'GET'
            });
        },

        /**
         * POST request helper
         * @param {string} url - Request URL
         * @param {object} data - Request data
         * @returns {Promise}
         */
        post: function(url, data = {}) {
            return this.request(url, {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },

        /**
         * PUT request helper
         * @param {string} url - Request URL
         * @param {object} data - Request data
         * @returns {Promise}
         */
        put: function(url, data = {}) {
            return this.request(url, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        },

        /**
         * DELETE request helper
         * @param {string} url - Request URL
         * @returns {Promise}
         */
        delete: function(url) {
            return this.request(url, {
                method: 'DELETE'
            });
        }
    };

    // ============================================
    // NOTIFICATION SYSTEM
    // ============================================
    
    App.notifications = {
        _container: null,
        _toastCount: 0,

        /**
         * Initialize notification container
         */
        initContainer: function() {
            if (this._container) return;
            
            this._container = document.createElement('div');
            this._container.id = 'app-notifications';
            this._container.className = 'toast-container position-fixed top-0 end-0 p-3';
            document.body.appendChild(this._container);
        },

        /**
         * Show notification/toast
         * @param {object} options - Notification options
         */
        show: function(options = {}) {
            this.initContainer();
            
            const toastId = 'toast-' + Date.now() + '-' + (++this._toastCount);
            const type = options.type || 'info';
            const duration = options.duration || 5000;
            
            const typeClasses = {
                success: 'bg-success text-white',
                error: 'bg-danger text-white',
                warning: 'bg-warning text-dark',
                info: 'bg-info text-white'
            };
            
            const toastHtml = `
                <div id="${toastId}" class="toast ${typeClasses[type] || typeClasses.info}" role="alert">
                    <div class="d-flex">
                        <div class="toast-body">
                            ${options.message || 'Notification'}
                        </div>
                        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                    </div>
                </div>
            `;
            
            this._container.insertAdjacentHTML('beforeend', toastHtml);
            
            const toastElement = App.utils.select(`#${toastId}`);
            const toast = new bootstrap.Toast(toastElement, {
                autohide: duration > 0,
                delay: duration
            });
            
            toast.show();
            
            // Remove from DOM after hiding
            toastElement.addEventListener('hidden.bs.toast', () => {
                toastElement.remove();
            });
            
            return toast;
        },

        /**
         * Show success notification
         * @param {string} message - Success message
         * @param {number} duration - Duration in ms
         */
        success: function(message, duration = 3000) {
            return this.show({
                type: 'success',
                message: message,
                duration: duration
            });
        },

        /**
         * Show error notification
         * @param {string} message - Error message
         * @param {number} duration - Duration in ms
         */
        error: function(message, duration = 5000) {
            return this.show({
                type: 'error',
                message: message,
                duration: duration
            });
        },

        /**
         * Show warning notification
         * @param {string} message - Warning message
         * @param {number} duration - Duration in ms
         */
        warning: function(message, duration = 4000) {
            return this.show({
                type: 'warning',
                message: message,
                duration: duration
            });
        },

        /**
         * Show info notification
         * @param {string} message - Info message
         * @param {number} duration - Duration in ms
         */
        info: function(message, duration = 3000) {
            return this.show({
                type: 'info',
                message: message,
                duration: duration
            });
        }
    };

    // ============================================
    // APPLICATION STATE MANAGEMENT
    // ============================================
    
    App.state = {
        _state: {},
        _listeners: {},

        /**
         * Set application state value
         * @param {string} key - State key
         * @param {*} value - State value
         * @param {boolean} notify - Whether to notify listeners
         */
        set: function(key, value, notify = true) {
            const oldValue = this._state[key];
            this._state[key] = value;
            
            if (notify && this._listeners[key]) {
                this._listeners[key].forEach(callback => {
                    callback(value, oldValue);
                });
            }
        },

        /**
         * Get application state value
         * @param {string} key - State key
         * @param {*} defaultValue - Default value if key doesn't exist
         * @returns {*}
         */
        get: function(key, defaultValue = null) {
            return this._state[key] !== undefined ? this._state[key] : defaultValue;
        },

        /**
         * Subscribe to state changes
         * @param {string} key - State key to watch
         * @param {Function} callback - Callback function
         */
        subscribe: function(key, callback) {
            if (!this._listeners[key]) {
                this._listeners[key] = [];
            }
            this._listeners[key].push(callback);
            
            // Return unsubscribe function
            return () => {
                if (this._listeners[key]) {
                    this._listeners[key] = this._listeners[key].filter(cb => cb !== callback);
                }
            };
        },

        /**
         * Clear application state
         */
        clear: function() {
            this._state = {};
            this._listeners = {};
        }
    };

    // ============================================
    // INITIALIZATION
    // ============================================
    
    /**
     * Initialize all base.js components
     */
    function initializeApp() {
        console.log('Initializing JSDC Base Application...');
        
        // Initialize UI components
        App.ui.init();
        
        // Initialize notifications container
        App.notifications.initContainer();
        
        // Set initial application state
        App.state.set('page', App.utils.getCurrentPage());
        App.state.set('sidebarCollapsed', localStorage.getItem('sidebarCollapsed') === 'true');
        
        // Listen for page changes (if using SPA-like navigation)
        window.addEventListener('popstate', () => {
            App.ui.highlightActiveMenu();
            App.state.set('page', App.utils.getCurrentPage());
        });
        
        // Expose global error handler
        window.addEventListener('error', function(event) {
            console.error('Global error:', event.error);
            App.notifications.error('An unexpected error occurred. Please refresh the page.');
        });
        
        // Global click handler for data attributes
        document.addEventListener('click', function(e) {
            // Handle data-modal-open attributes
            const modalOpenButton = e.target.closest('[data-modal-open]');
            if (modalOpenButton) {
                e.preventDefault();
                const modalId = modalOpenButton.getAttribute('data-modal-open');
                App.modal.open(modalId);
            }
            
            // Handle data-modal-close attributes
            const modalCloseButton = e.target.closest('[data-modal-close]');
            if (modalCloseButton) {
                e.preventDefault();
                App.modal.close();
            }
            
            // Handle data-scroll-to attributes
            const scrollButton = e.target.closest('[data-scroll-to]');
            if (scrollButton) {
                e.preventDefault();
                const target = scrollButton.getAttribute('data-scroll-to');
                App.ui.scrollTo(target);
            }
        });
        
        console.log('JSDC Base Application initialized successfully');
    }
    
    // Start the application
    initializeApp();
});