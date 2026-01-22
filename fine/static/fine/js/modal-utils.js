// modal-utils.js
class ModalManager {
    static init() {
        // Prevent multiple backdrops
        this.setupBackdropCleanup();
    }
    
    static setupBackdropCleanup() {
        document.addEventListener('show.bs.modal', (e) => {
            // Remove extra backdrops
            const backdrops = document.querySelectorAll('.modal-backdrop');
            if (backdrops.length > 1) {
                for (let i = 1; i < backdrops.length; i++) {
                    backdrops[i].remove();
                }
            }
        });
        
        document.addEventListener('hidden.bs.modal', (e) => {
            // Clean up when all modals are closed
            const openModals = document.querySelectorAll('.modal.show');
            if (openModals.length === 0) {
                document.body.classList.remove('modal-open');
                const backdrops = document.querySelectorAll('.modal-backdrop');
                backdrops.forEach(backdrop => backdrop.remove());
            }
        });
    }
    
    static showModal(modalId, options = {}) {
        const modalElement = document.getElementById(modalId);
        if (!modalElement) {
            console.error(`Modal with id ${modalId} not found`);
            return null;
        }
        
        // Hide any open modals first
        const openModals = document.querySelectorAll('.modal.show');
        openModals.forEach(modal => {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) bsModal.hide();
        });
        
        // Show the requested modal
        const modal = new bootstrap.Modal(modalElement, {
            backdrop: 'static',
            keyboard: true,
            ...options
        });
        
        modal.show();
        return modal;
    }
    
    static closeAllModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) bsModal.hide();
        });
        
        // Clean up
        document.body.classList.remove('modal-open');
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(backdrop => backdrop.remove());
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    ModalManager.init();
});

// Make available globally
window.ModalManager = ModalManager;