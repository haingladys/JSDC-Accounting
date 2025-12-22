// purchases.js
class PurchaseManager {
    static initialize() {
        console.log('Initializing purchase system');
        
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
            // Load sample data
            window.jsdcApp.AppState.purchases = [
                {
                    id: 1,
                    date: new Date().toISOString().split('T')[0],
                    vendor: 'Local Vendor',
                    category: 'VEGETABLE',
                    unitPrice: 150,
                    quantity: 10,
                    unit: 'kg',
                    gst: 'Yes',
                    total: 1765,
                    status: 'Paid',
                    description: 'Fresh vegetables for restaurant',
                    billNo: 'B-001'
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
        
        // Total calculation listeners
        this.setupTotalCalculation();
    }
    
    static setupTotalCalculation() {
        const purchaseUnitPrice = document.getElementById('purchaseUnitPrice');
        const purchaseQuantity = document.getElementById('purchaseQuantity');
        const purchaseTotal = document.getElementById('purchaseTotal');
        
        if (purchaseUnitPrice && purchaseQuantity && purchaseTotal) {
            const calculatePurchaseTotal = () => {
                const price = parseFloat(purchaseUnitPrice.value) || 0;
                const qty = parseFloat(purchaseQuantity.value) || 0;
                purchaseTotal.value = (price * qty).toFixed(2);
            };
            purchaseUnitPrice.addEventListener('input', calculatePurchaseTotal);
            purchaseQuantity.addEventListener('input', calculatePurchaseTotal);
        }
    }
    
    static savePurchase() {
        const purchaseData = {
            date: document.getElementById('purchaseDate').value,
            vendor: document.getElementById('purchaseVendor').value,
            category: document.getElementById('purchaseCategory').value,
            billNo: document.getElementById('purchaseBillNo').value,
            unitPrice: parseFloat(document.getElementById('purchaseUnitPrice').value),
            quantity: parseInt(document.getElementById('purchaseQuantity').value),
            unit: document.getElementById('purchaseUnit').value,
            gst: document.querySelector('input[name="gstApplicable"]:checked').value === 'yes' ? 'Yes' : 'No',
            total: parseFloat(document.getElementById('purchaseTotal').value),
            status: document.getElementById('purchaseStatus').value,
            description: document.getElementById('purchaseDescription') ? document.getElementById('purchaseDescription').value : ''
        };
        
        if (window.jsdcApp.AppState.editingPurchaseId) {
            // Update existing purchase
            const index = window.jsdcApp.AppState.purchases.findIndex(pur => pur.id === window.jsdcApp.AppState.editingPurchaseId);
            if (index !== -1) {
                purchaseData.id = window.jsdcApp.AppState.editingPurchaseId;
                window.jsdcApp.AppState.purchases[index] = purchaseData;
                window.jsdcApp.showToast(`✓ Purchase updated successfully! Total: ₹${purchaseData.total.toLocaleString()}`);
            }
            window.jsdcApp.AppState.editingPurchaseId = null;
        } else {
            // Add new purchase
            purchaseData.id = Date.now();
            window.jsdcApp.AppState.purchases.push(purchaseData);
            window.jsdcApp.showToast(`✓ Purchase saved successfully! Vendor: ${purchaseData.vendor} | Total: ₹${purchaseData.total.toLocaleString()}`);
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
                <td>₹${purchase.unitPrice.toLocaleString()}</td>
                <td>${purchase.gst}</td>
                <td>${purchase.quantity} ${purchase.unit}</td>
                <td>₹${purchase.total.toLocaleString()}</td>
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
            document.getElementById('purchaseUnitPrice').value = purchase.unitPrice;
            document.getElementById('purchaseQuantity').value = purchase.quantity;
            document.getElementById('purchaseUnit').value = purchase.unit;
            document.getElementById('purchaseTotal').value = purchase.total;
            document.getElementById('purchaseStatus').value = purchase.status;
            
            if (document.getElementById('purchaseDescription')) {
                document.getElementById('purchaseDescription').value = purchase.description || '';
            }
            
            // Set GST radio button
            if (purchase.gst === 'Yes') {
                document.getElementById('gstYes').checked = true;
            } else {
                document.getElementById('gstNo').checked = true;
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
            // Set default date to today and GST to Yes
            document.getElementById('purchaseDate').valueAsDate = new Date();
            document.getElementById('gstYes').checked = true;
        }
    }
    
    static exportPurchases() {
        const data = window.jsdcApp.AppState.purchases;
        let csvContent = "data:text/csv;charset=utf-8,";
        
        // Add headers
        csvContent += "Date,Vendor,Category,Unit Price,GST,Quantity,Unit,Total,Status,Bill No\n";
        
        // Add rows
        data.forEach(purchase => {
            const row = [
                purchase.date,
                purchase.vendor,
                purchase.category,
                purchase.unitPrice,
                purchase.gst,
                purchase.quantity,
                purchase.unit,
                purchase.total,
                purchase.status,
                purchase.billNo || ''
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
                <td>₹${purchase.unitPrice.toLocaleString()}</td>
                <td>${purchase.gst}</td>
                <td>${purchase.quantity} ${purchase.unit}</td>
                <td>₹${purchase.total.toLocaleString()}</td>
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