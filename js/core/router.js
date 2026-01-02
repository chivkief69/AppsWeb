// SPA Navigation System
export class SPARouter {
    constructor() {
        this.currentPage = 'home';
        this.userRole = null;
    }

    init(role) {
        this.userRole = role;
        
        // Remove any existing listeners to avoid duplicates
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            // Clone and replace to remove all event listeners
            const newItem = item.cloneNode(true);
            item.parentNode.replaceChild(newItem, item);
        });
        
        // Set up navigation listeners
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.getAttribute('data-page');
                this.navigateTo(page);
            });
        });
    }

    navigateTo(page) {
        // Hide all pages
        document.querySelectorAll('[id^="page-"]').forEach(pageEl => {
            pageEl.classList.add('hidden');
        });

        // Show target page with fade-in
        const targetPage = document.getElementById(`page-${page}`);
        if (targetPage) {
            targetPage.classList.remove('hidden');
            targetPage.classList.add('page-content');
        }

        // Update active nav state
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        const activeNav = document.querySelector(`[data-page="${page}"]`);
        if (activeNav) {
            activeNav.classList.add('active');
        }

        this.currentPage = page;
    }
}

