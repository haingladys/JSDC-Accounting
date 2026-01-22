// purchases.js - Updated for new purchase fields
class PurchaseManager {
    static initialize() {
        console.log('Initializing purchase system with new fields');

        // Load data
        this.loadPurchaseData();

        // Setup event listeners
        this.setupEventListeners();

        // Render table
        this.renderPurchases();

        console.log('Purchase System Initialized');
    }

    static loadPurchaseData() {
        // Try to load from localStorage
        const savedData = localStorage.getItem('purchasesData');
        if (savedData) {
            window.jsdcApp.AppState.purchases = JSON.parse(savedData);
        } else {
            // Load sample data with new fields
            window.jsdcApp.AppState.purchases = [
                {
                    id: 1,
                    date: new Date().toISOString().split('T')[0],
                    vendor: 'Local Vendor',
                    category: 'RAW MATERIALS',
                    billNo: 'B-001',
                    totalAmount: 15000,
                    gstAmount: 2700,
                    paymentMode: 'Cash',
                    status: 'Paid',
                    description: 'Raw materials purchase for production'
                }
            ];
        }
    }

    static savePurchaseData() {
        localStorage.setItem('purchasesData', JSON.stringify(window.jsdcApp.AppState.purchases));
    }

    static setupEventListeners() {
        // Add Purchase Button
        const addPurchaseBtn = document.getElementById('addPurchaseBtn');
        if (addPurchaseBtn) {
            addPurchaseBtn.addEventListener('click', () => {
                this.resetPurchaseForm();
                new bootstrap.Modal(document.getElementById('addPurchaseModal')).show();
            });
        }

        // Save Purchase Button
        const savePurchaseBtn = document.getElementById('savePurchaseBtn');
        if (savePurchaseBtn) {
            savePurchaseBtn.addEventListener('click', () => {
                if (document.getElementById('purchaseForm').checkValidity()) {
                    this.savePurchase();
                } else {
                    document.getElementById('purchaseForm').reportValidity();
                }
            });
        }

        // Export Button
        const exportPurchasesBtn = document.getElementById('exportPurchasesBtn');
        if (exportPurchasesBtn) {
            exportPurchasesBtn.addEventListener('click', () => {
                this.exportPurchases();
            });
        }

        // Filter Button
        const filterPurchasesBtn = document.getElementById('filterPurchasesBtn');
        if (filterPurchasesBtn) {
            filterPurchasesBtn.addEventListener('click', () => {
                this.showFilterOptions();
            });
        }
    }

    static savePurchase() {
        const purchaseData = {
            date: document.getElementById('purchaseDate').value,
            vendor: document.getElementById('purchaseVendor').value,
            category: document.getElementById('purchaseCategory').value,
            billNo: document.getElementById('purchaseBillNo').value,
            totalAmount: parseFloat(document.getElementById('purchaseTotalAmount').value),
            gstAmount: parseFloat(document.getElementById('purchaseGstAmount').value) || 0,
            paymentMode: document.getElementById('purchasePaymentMode').value,
            status: document.getElementById('purchaseStatus').value,
            description: document.getElementById('purchaseDescription') ? document.getElementById('purchaseDescription').value : ''
        };

        if (window.jsdcApp.AppState.editingPurchaseId) {
            // Update existing purchase
            const index = window.jsdcApp.AppState.purchases.findIndex(pur => pur.id === window.jsdcApp.AppState.editingPurchaseId);
            if (index !== -1) {
                purchaseData.id = window.jsdcApp.AppState.editingPurchaseId;
                window.jsdcApp.AppState.purchases[index] = purchaseData;
                window.jsdcApp.showToast(`✓ Purchase updated successfully! Total: ₹${purchaseData.totalAmount.toLocaleString()}`);
            }
            window.jsdcApp.AppState.editingPurchaseId = null;
        } else {
            // Add new purchase
            purchaseData.id = Date.now();
            window.jsdcApp.AppState.purchases.push(purchaseData);
            window.jsdcApp.showToast(`✓ Purchase saved successfully! Vendor: ${purchaseData.vendor} | Total: ₹${purchaseData.totalAmount.toLocaleString()}`);
        }

        // Close modal and refresh table
        const modal = bootstrap.Modal.getInstance(document.getElementById('addPurchaseModal'));
        modal.hide();

        this.renderPurchases();
        this.resetPurchaseForm();
        this.savePurchaseData();
    }

    static renderPurchases() {
        const tbody = document.getElementById('purchasesTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (window.jsdcApp.AppState.purchases.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="text-center py-4">No purchases recorded yet</td></tr>';
            return;
        }

        window.jsdcApp.AppState.purchases.forEach(purchase => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${window.jsdcApp.formatDate(purchase.date)}</td>
                <td>${purchase.vendor}</td>
                <td>${purchase.category}</td>
                <td>${purchase.billNo}</td>
                <td>₹${purchase.totalAmount.toLocaleString()}</td>
                <td>₹${purchase.gstAmount.toLocaleString()}</td>
                <td><span class="badge ${purchase.paymentMode === 'Cash' ? 'bg-success' : 
                                          purchase.paymentMode === 'UPI' ? 'bg-primary' : 
                                          purchase.paymentMode === 'Card' ? 'bg-warning' : 'bg-info'}">${purchase.paymentMode}</span></td>
                <td><span class="badge ${purchase.status === 'Paid' ? 'bg-success' : purchase.status === 'Pending' ? 'bg-warning' : 'bg-secondary'}">${purchase.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-warning edit-purchase" data-id="${purchase.id}">Edit</button>
                    <button class="btn btn-sm btn-outline-danger delete-purchase" data-id="${purchase.id}">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Add event listeners for edit and delete buttons
        document.querySelectorAll('.edit-purchase').forEach(btn => {
            btn.addEventListener('click', () => {
                const purchaseId = parseInt(btn.getAttribute('data-id'));
                this.editPurchase(purchaseId);
            });
        });

        document.querySelectorAll('.delete-purchase').forEach(btn => {
            btn.addEventListener('click', () => {
                const purchaseId = parseInt(btn.getAttribute('data-id'));
                this.deletePurchase(purchaseId);
            });
        });
    }

    static editPurchase(id) {
        const purchase = window.jsdcApp.AppState.purchases.find(pur => pur.id === id);
        if (purchase) {
            // Fill the form with purchase data
            document.getElementById('purchaseDate').value = purchase.date;
            document.getElementById('purchaseVendor').value = purchase.vendor;
            document.getElementById('purchaseCategory').value = purchase.category;
            document.getElementById('purchaseBillNo').value = purchase.billNo || '';
            document.getElementById('purchaseTotalAmount').value = purchase.totalAmount;
            document.getElementById('purchaseGstAmount').value = purchase.gstAmount || 0;
            document.getElementById('purchasePaymentMode').value = purchase.paymentMode;
            document.getElementById('purchaseStatus').value = purchase.status;

            if (document.getElementById('purchaseDescription')) {
                document.getElementById('purchaseDescription').value = purchase.description || '';
            }

            // Set editing state
            window.jsdcApp.AppState.editingPurchaseId = id;

            // Show the modal
            new bootstrap.Modal(document.getElementById('addPurchaseModal')).show();
        }
    }

    static deletePurchase(id) {
        if (confirm('Are you sure you want to delete this purchase?')) {
            window.jsdcApp.AppState.purchases = window.jsdcApp.AppState.purchases.filter(pur => pur.id !== id);
            this.renderPurchases();
            this.savePurchaseData();
            window.jsdcApp.showToast('Purchase deleted successfully');
        }
    }

    static resetPurchaseForm() {
        const form = document.getElementById('purchaseForm');
        if (form) {
            form.reset();
            window.jsdcApp.AppState.editingPurchaseId = null;
            // Set default date to today and default values
            document.getElementById('purchaseDate').valueAsDate = new Date();
            document.getElementById('purchasePaymentMode').value = 'Cash';
            document.getElementById('purchaseStatus').value = 'Paid';
            document.getElementById('purchaseGstAmount').value = 0;
        }
    }

    static exportPurchases() {
        const data = window.jsdcApp.AppState.purchases;
        let csvContent = "data:text/csv;charset=utf-8,";

        // Add headers with new fields
        csvContent += "Date,Vendor,Category,Bill No,Total Amount,GST Amount,Payment Mode,Status,Description\n";

        // Add rows
        data.forEach(purchase => {
            const row = [
                purchase.date,
                purchase.vendor,
                purchase.category,
                purchase.billNo || '',
                purchase.totalAmount,
                purchase.gstAmount || 0,
                purchase.paymentMode,
                purchase.status,
                `"${(purchase.description || '').replace(/"/g, '""')}"`
            ].join(",");
            csvContent += row + "\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `purchases_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        window.jsdcApp.showToast('Purchases exported to CSV successfully!', 'success');
    }

    static showFilterOptions() {
        const categories = [...new Set(window.jsdcApp.AppState.purchases.map(p => p.category))];
        const vendors = [...new Set(window.jsdcApp.AppState.purchases.map(p => p.vendor))];
        const statuses = [...new Set(window.jsdcApp.AppState.purchases.map(p => p.status))];
        const paymentModes = [...new Set(window.jsdcApp.AppState.purchases.map(p => p.paymentMode))];

        const filterHtml = `
            <div class="row g-3">
                <div class="col-md-6">
                    <label class="form-label">Category</label>
                    <select class="form-select" id="filter-category">
                        <option value="">All Categories</option>
                        ${categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                    </select>
                </div>
                <div class="col-md-6">
                    <label class="form-label">Vendor</label>
                    <select class="form-select" id="filter-vendor">
                        <option value="">All Vendors</option>
                        ${vendors.map(vendor => `<option value="${vendor}">${vendor}</option>`).join('')}
                    </select>
                </div>
                <div class="col-md-6">
                    <label class="form-label">Status</label>
                    <select class="form-select" id="filter-status">
                        <option value="">All Status</option>
                        ${statuses.map(status => `<option value="${status}">${status}</option>`).join('')}
                    </select>
                </div>
                <div class="col-md-6">
                    <label class="form-label">Payment Mode</label>
                    <select class="form-select" id="filter-payment-mode">
                        <option value="">All Payment Modes</option>
                        ${paymentModes.map(mode => `<option value="${mode}">${mode}</option>`).join('')}
                    </select>
                </div>
                <div class="col-md-6">
                    <label class="form-label">Date Range</label>
                    <input type="date" class="form-control" id="filter-date">
                </div>
            </div>
            <div class="mt-3">
                <button class="btn btn-primary btn-sm" onclick="PurchaseManager.applyFilters()">Apply Filters</button>
                <button class="btn btn-outline-secondary btn-sm" onclick="PurchaseManager.clearFilters()">Clear</button>
            </div>
        `;

        this.showCustomModal('Filter Purchases', filterHtml);
    }

    static showCustomModal(title, content) {
        let modal = document.querySelector('.custom-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'modal fade custom-modal';
            modal.innerHTML = `
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title"></h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body"></div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        modal.querySelector('.modal-title').textContent = title;
        modal.querySelector('.modal-body').innerHTML = content;

        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }

    static applyFilters() {
        const category = document.getElementById('filter-category')?.value;
        const vendor = document.getElementById('filter-vendor')?.value;
        const status = document.getElementById('filter-status')?.value;
        const paymentMode = document.getElementById('filter-payment-mode')?.value;
        const date = document.getElementById('filter-date')?.value;

        let filteredData = [...window.jsdcApp.AppState.purchases];

        if (category) {
            filteredData = filteredData.filter(p => p.category === category);
        }

        if (vendor) {
            filteredData = filteredData.filter(p => p.vendor === vendor);
        }

        if (status) {
            filteredData = filteredData.filter(p => p.status === status);
        }

        if (paymentMode) {
            filteredData = filteredData.filter(p => p.paymentMode === paymentMode);
        }

        if (date) {
            filteredData = filteredData.filter(p => p.date === date);
        }

        this.renderFilteredTable(filteredData);
        bootstrap.Modal.getInstance(document.querySelector('.custom-modal')).hide();
    }

    static renderFilteredTable(data) {
        const tbody = document.getElementById('purchasesTableBody');
        tbody.innerHTML = '';

        data.forEach(purchase => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${window.jsdcApp.formatDate(purchase.date)}</td>
                <td>${purchase.vendor}</td>
                <td>${purchase.category}</td>
                <td>${purchase.billNo}</td>
                <td>₹${purchase.totalAmount.toLocaleString()}</td>
                <td>₹${purchase.gstAmount.toLocaleString()}</td>
                <td><span class="badge ${purchase.paymentMode === 'Cash' ? 'bg-success' : 
                                          purchase.paymentMode === 'UPI' ? 'bg-primary' : 
                                          purchase.paymentMode === 'Card' ? 'bg-warning' : 'bg-info'}">${purchase.paymentMode}</span></td>
                <td><span class="badge ${purchase.status === 'Paid' ? 'bg-success' : purchase.status === 'Pending' ? 'bg-warning' : 'bg-secondary'}">${purchase.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-warning edit-purchase" data-id="${purchase.id}">Edit</button>
                    <button class="btn btn-sm btn-outline-danger delete-purchase" data-id="${purchase.id}">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="text-center py-4">No matching purchases found</td></tr>';
        }
    }
    
    static clearFilters() {
        this.renderPurchases();
        bootstrap.Modal.getInstance(document.querySelector('.custom-modal')).hide();
    }
}