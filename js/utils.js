// ========== SHARED UTILITY FUNCTIONS ==========
// Centralized utilities for the Orbit Power website frontend

// ========== API CONFIGURATION ==========

/**
 * API endpoint configuration
 * Maps resource names to their REST API paths
 */
const API_ENDPOINTS = {
    services: '/api/services',
    gallery: '/api/gallery',
    jobs: '/api/jobs',
    company: '/api/company',
    clients: '/api/clients',
    team: '/api/team',
    certificates: '/api/certificates',
    testimonials: '/api/testimonials'
};

/**
 * Default data structures for fallback
 * Used when API/files fail to load
 */
const DEFAULT_DATA = {
    services: { services: [] },
    gallery: { gallery: [] },
    jobs: { jobs: [] },
    clients: { clients: [] },
    team: { team: [] },
    certificates: { certificates: [] },
    testimonials: { testimonials: [] },
    company: {
        company: {
            name: "Orbit Power",
            description: "",
            founded: "",
            employees: "",
            projects: "",
            statesCovered: "",
            clientRetention: "",
            license: "",
            location: "",
            mission: "",
            values: [],
            contact: { address: "", phone: "", email: "" }
        },
        team: []
    }
};

// ========== DATA LOADING FUNCTIONS ==========

/**
 * Universal data loading function with API fallback
 * @param {string} url - URL to fetch data from (can be file path or API endpoint)
 * @returns {Promise<Object>} - Parsed JSON data or default data
 */
function loadData(url) {
    return new Promise((resolve, reject) => {
        if (!window.fetch) {
            resolve(getDemoData(url));
            return;
        }

        fetch(url)
            .then(response => {
                if (response.ok) {
                    return response.json();
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            })
            .then(data => resolve(data))
            .catch(err => {
                console.warn(`Fetch failed for ${url}:`, err.message);
                resolve(getDemoData(url));
            });
    });
}

/**
 * Get default/demo data based on URL
 * @param {string} url - The URL that failed to load
 * @returns {Object} - Default data structure
 */
function getDemoData(url) {
    const fileName = url.split('/').pop().replace('.json', '');
    return DEFAULT_DATA[fileName] || {};
}

/**
 * Helper to safely get nested object properties
 * @param {Object} obj - The object to query
 * @param {string} path - Dot-separated path (e.g., 'company.name')
 * @param {*} defaultValue - Value to return if path not found
 * @returns {*} - The value at path or defaultValue
 */
function getNestedValue(obj, path, defaultValue = '') {
    return path.split('.').reduce((current, prop) => 
        current && current[prop] !== undefined ? current[prop] : defaultValue, obj
    );
}

/**
 * Debounce function to limit function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Milliseconds to wait
 * @returns {Function} - Debounced function
 */
function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Show a temporary toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type of notification (success, error, info)
 * @param {number} duration - Duration in ms (default 3000)
 */
function showToast(message, type = 'info', duration = 3000) {
    // Create toast element if it doesn't exist
    let toast = document.getElementById('app-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'app-toast';
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        document.body.appendChild(toast);
    }

    // Set background color based on type
    const colors = {
        success: '#00A86B',
        error: '#DC3545',
        info: '#0D6EFD',
        warning: '#FFC107'
    };
    toast.style.backgroundColor = colors[type] || colors.info;
    toast.textContent = message;
    toast.style.opacity = '1';

    // Auto-hide after duration
    setTimeout(() => {
        toast.style.opacity = '0';
    }, duration);
}

/**
 * Format date to readable string
 * @param {string|Date} date - Date to format
 * @returns {string} - Formatted date string
 */
function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

/**
 * Sanitize HTML to prevent XSS
 * @param {string} str - String to sanitize
 * @returns {string} - Sanitized string
 */
function sanitizeHTML(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

/**
 * Generate star rating HTML
 * @param {number} rating - Rating from 1-5
 * @returns {string} - HTML string with star icons
 */
function generateStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        stars += i <= rating 
            ? '<i class="fas fa-star"></i>' 
            : '<i class="fas fa-star-half-alt"></i>';
    }
    return stars;
}
