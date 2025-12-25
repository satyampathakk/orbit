# Developer Guide - Orbit Power Website

This guide explains how to extend, modify, and maintain the Orbit Power website. It covers architecture, adding new features, code patterns, and common development tasks.

---

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [How It Works](#how-it-works)
- [Adding New Features](#adding-new-features)
- [Utility Functions](#utility-functions)
- [Code Patterns & Best Practices](#code-patterns--best-practices)
- [Common Development Tasks](#common-development-tasks)
- [Debugging & Testing](#debugging--testing)
- [Performance Optimization](#performance-optimization)

---

## 🏗️ Architecture Overview

The project follows a **Data-Driven Architecture** with separation of concerns:

```
┌─────────────────────────────────────────────┐
│          Frontend (HTML/CSS/JS)             │
│  - index.html, careers.html, admin.html     │
│  - main.js, admin.js, utils.js              │
│  - styles.css, admin.css                    │
└──────────────────┬──────────────────────────┘
                   │
                   │ HTTP/AJAX
                   │
┌──────────────────▼──────────────────────────┐
│   Backend (Node.js/Express)                 │
│  - server.js (REST API)                     │
│  - Authentication middleware                │
│  - File upload handling                     │
│  - CRUD operations                          │
└──────────────────┬──────────────────────────┘
                   │
                   │ Read/Write
                   │
┌──────────────────▼──────────────────────────┐
│   Data Storage (JSON Files)                 │
│  - /data/*.json                             │
│  - /images/* (uploaded files)               │
└─────────────────────────────────────────────┘
```

### Core Principles
1. **Data-Driven**: All content stored in JSON files
2. **RESTful API**: Standard HTTP methods for CRUD
3. **Stateless**: Backend doesn't maintain state (token-based auth)
4. **Modular**: Utility functions in separate files
5. **Responsive**: All UI adapts to screen size

---

## 🔄 How It Works

### Request Flow

1. **Frontend Request**:
   ```javascript
   fetch('/api/services')
     .then(res => res.json())
     .then(data => displayServices(data))
   ```

2. **Backend Processing**:
   - Express routes request to appropriate handler
   - Handler reads/writes JSON file
   - Response returned as JSON

3. **Frontend Update**:
   - JavaScript updates DOM with new data
   - CSS animations trigger automatically
   - Page updates without reload

### Authentication Flow

1. **Login**:
   - User submits credentials to `POST /api/auth/login`
   - Backend validates and returns token
   - Token stored in browser localStorage

2. **Authenticated Request**:
   - Token sent in request header: `Authorization: Bearer <token>`
   - Backend validates token on protected routes
   - Request processed if valid, rejected if invalid

3. **Logout**:
   - Token deleted from localStorage
   - Session invalidated on backend

---

## ➕ Adding New Features

### Adding a New Resource Type

The system is designed to make adding new content types extremely simple.

#### Example: Adding a "News" Resource

**Step 1: Update server.js**

In the `DATA_FILES` object, add:
```javascript
const DATA_FILES = {
    // ... existing entries
    news: path.join(DATA_DIR, 'news.json')
};
```

In the `DEFAULT_DATA` object, add:
```javascript
const DEFAULT_DATA = {
    // ... existing entries
    news: { news: [] }
};
```

Then create the routes (just 1 line!):
```javascript
// At the bottom, with other route definitions
createCRUDRoutes('news', DATA_FILES.news, 'news');
```

**Step 2: Create Data File**

Create `data/news.json`:
```json
{
  "news": []
}
```

**Step 3: Update Frontend**

Add to `main.js`:
```javascript
// Load and display news
async function loadNews() {
    try {
        const data = await loadData('./data/news.json');
        displayNews(data.news);
    } catch (error) {
        console.error('Error loading news:', error);
    }
}

function displayNews(newsItems) {
    const newsContainer = document.getElementById('news-container');
    newsContainer.innerHTML = newsItems.map(item => `
        <div class="news-item">
            <h3>${item.title}</h3>
            <p>${item.description}</p>
            <span class="date">${formatDate(item.date)}</span>
        </div>
    `).join('');
}

// Call on page load
loadNews();
```

**That's It!** You now have:
- ✅ GET /api/news (read all)
- ✅ POST /api/news (create with optional image)
- ✅ PUT /api/news/:id (update)
- ✅ DELETE /api/news/:id (delete)

### Adding a New HTML Page

1. Create new `.html` file
2. Copy header/footer from existing pages for consistency
3. Create corresponding section in CSS
4. Add JavaScript file to load and display data
5. Include navigation link in header

Example for new page `services-detail.html`:
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Service Details - Orbit Power</title>
    <link rel="stylesheet" href="css/styles.css">
    <style>
        /* Service detail specific styles */
        .service-detail { /* ... */ }
    </style>
</head>
<body>
    <header><!-- Include header from index.html --></header>
    
    <main id="service-detail-container">
        <!-- Content will be loaded here -->
    </main>
    
    <footer><!-- Include footer from index.html --></footer>
    
    <script src="js/utils.js"></script>
    <script>
        // Load and display specific service
        async function loadServiceDetail() {
            const serviceId = new URLSearchParams(location.search).get('id');
            const data = await loadData('./data/services.json');
            const service = data.services.find(s => s.id === serviceId);
            
            document.getElementById('service-detail-container').innerHTML = `
                <h1>${service.title}</h1>
                <img src="${service.image}" alt="${service.title}">
                <p>${service.description}</p>
            `;
        }
        loadServiceDetail();
    </script>
</body>
</html>
```

---

## 🛠️ Utility Functions

### Core Utilities in utils.js

#### Data Loading
```javascript
// Load data from JSON file or API
loadData(url)
// Returns Promise<data>
// Example:
const data = await loadData('./data/services.json');
```

#### Date Formatting
```javascript
// Convert date to readable format
formatDate(dateString)
// Example:
formatDate('2025-01-15') // → "Jan 15, 2025"
```

#### Notifications
```javascript
// Show toast message
showToast(message, type, duration)
// type: 'success', 'error', 'info'
// duration: milliseconds (default 3000)
// Example:
showToast('Service added successfully!', 'success');
showToast('Error saving data', 'error', 5000);
```

#### HTML Sanitization
```javascript
// Prevent XSS attacks by escaping HTML
sanitizeHTML(userInput)
// Example:
const safeName = sanitizeHTML(userProvidedName);
element.innerHTML = safeName;
```

#### Star Ratings
```javascript
// Generate HTML for star ratings
generateStars(rating, maxStars = 5)
// Returns HTML string with stars
// Example:
element.innerHTML = generateStars(4.5); // Shows 4.5 stars
```

#### Debouncing
```javascript
// Prevent function from being called too frequently
debounce(function, waitMs)
// Example:
window.addEventListener('resize', debounce(() => {
    // Only called once every 300ms
    updateLayout();
}, 300));
```

#### Safe Property Access
```javascript
// Get nested object properties safely
getNestedValue(object, path, defaultValue)
// Example:
const city = getNestedValue(company, 'address.city', 'Unknown');
```

---

## 📝 Code Patterns & Best Practices

### Template Literals (Preferred Method)

**✅ Good - Clean and readable**:
```javascript
// DOM updates using template literals
const html = data.services.map(service => `
    <div class="service-card">
        <img src="${service.image}" alt="${service.title}">
        <h3>${service.title}</h3>
        <p>${service.description}</p>
        <button onclick="viewService('${service.id}')">Learn More</button>
    </div>
`).join('');

container.innerHTML = html;
```

**❌ Avoid - Verbose and error-prone**:
```javascript
// Don't use appendChild for large lists
services.forEach(service => {
    const div = document.createElement('div');
    div.className = 'service-card';
    const img = document.createElement('img');
    img.src = service.image;
    // ... many more lines
    container.appendChild(div);
});
```

### Async/Await Pattern

**✅ Good - Clean error handling**:
```javascript
async function loadAndDisplay() {
    try {
        const data = await loadData('./data/services.json');
        displayServices(data.services);
    } catch (error) {
        console.error('Error loading services:', error);
        showToast('Failed to load services', 'error');
    }
}
```

**❌ Avoid - Callback hell**:
```javascript
loadData('./data/services.json')
    .then(data => {
        loadImages(data)
            .then(imageData => {
                loadComments(imageData)
                    .then(comments => {
                        // deeply nested
                    });
            });
    })
    .catch(error => {
        // error handling
    });
```

### Event Delegation

**✅ Good - Single listener for multiple elements**:
```javascript
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-btn')) {
        const id = e.target.dataset.id;
        deleteItem(id);
    }
    if (e.target.classList.contains('edit-btn')) {
        const id = e.target.dataset.id;
        editItem(id);
    }
});
```

**❌ Avoid - Listener on each element**:
```javascript
document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        deleteItem(btn.dataset.id);
    });
});
```

### Data Validation

**✅ Good - Validate before processing**:
```javascript
async function saveService(service) {
    // Validate required fields
    if (!service.title || !service.description) {
        throw new Error('Title and description are required');
    }
    
    // Validate types
    if (typeof service.title !== 'string') {
        throw new Error('Title must be a string');
    }
    
    // Validate file size if image provided
    if (service.image && service.image.size > 5 * 1024 * 1024) {
        throw new Error('Image must be less than 5MB');
    }
    
    return await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(service)
    });
}
```

### Error Handling

**✅ Good - User-friendly error messages**:
```javascript
async function updateService(id, data) {
    try {
        const response = await fetch(`/api/services/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Authentication failed. Please login again.');
            }
            if (response.status === 404) {
                throw new Error('Service not found.');
            }
            throw new Error(`Server error: ${response.statusText}`);
        }
        
        const result = await response.json();
        showToast('Service updated successfully!', 'success');
        return result;
    } catch (error) {
        console.error('Update failed:', error);
        showToast(error.message || 'Failed to update service', 'error');
        throw error;
    }
}
```

### API Calls with Fetch

**✅ Good - Complete error handling**:
```javascript
async function apiCall(endpoint, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
        defaultOptions.headers.Authorization = `Bearer ${token}`;
    }
    
    try {
        const response = await fetch(endpoint, { ...defaultOptions, ...options });
        
        if (response.status === 401) {
            // Token expired, clear and redirect to login
            localStorage.removeItem('authToken');
            location.href = '/admin.html';
            return;
        }
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}
```

---

## 🔧 Common Development Tasks

### Task: Update Admin Panel to Add New Section

**Goal**: Add a "Partners" section to the admin panel

**Steps**:

1. **Create HTML form** in `admin.html`:
```html
<section id="partners-section" class="admin-section">
    <h2>Partners Management</h2>
    
    <form id="partner-form">
        <input type="text" id="partner-name" placeholder="Partner name" required>
        <textarea id="partner-description" placeholder="Description" required></textarea>
        <input type="file" id="partner-image" accept="image/*">
        <button type="submit">Add Partner</button>
    </form>
    
    <div id="partners-list"></div>
</section>
```

2. **Add styles** in `css/admin.css`:
```css
#partners-section .partner-item {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    border: 1px solid #ddd;
    margin: 0.5rem 0;
    border-radius: 4px;
}

#partners-section .partner-item img {
    width: 100px;
    height: 100px;
    object-fit: cover;
}
```

3. **Add JavaScript handler** in `admin.js`:
```javascript
// Load partners on page load
async function loadPartners() {
    const data = await apiCall('/api/partners');
    const container = document.getElementById('partners-list');
    container.innerHTML = data.partners.map(partner => `
        <div class="partner-item">
            <img src="${partner.image}" alt="${partner.name}">
            <div>
                <h3>${partner.name}</h3>
                <p>${partner.description}</p>
                <button onclick="editPartner('${partner.id}')">Edit</button>
                <button onclick="deletePartner('${partner.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

// Handle form submission
document.getElementById('partner-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('name', document.getElementById('partner-name').value);
    formData.append('description', document.getElementById('partner-description').value);
    
    const file = document.getElementById('partner-image').files[0];
    if (file) {
        formData.append('image', file);
    }
    
    try {
        await fetch('/api/partners', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: formData
        });
        
        showToast('Partner added successfully!', 'success');
        document.getElementById('partner-form').reset();
        loadPartners();
    } catch (error) {
        showToast('Error adding partner', 'error');
    }
});

// Delete function
async function deletePartner(id) {
    if (!confirm('Delete this partner?')) return;
    
    try {
        await apiCall(`/api/partners/${id}`, { method: 'DELETE' });
        showToast('Partner deleted', 'success');
        loadPartners();
    } catch (error) {
        showToast('Error deleting partner', 'error');
    }
}
```

4. **Update server.js** (add to DATA_FILES and DEFAULT_DATA):
```javascript
partners: path.join(DATA_DIR, 'partners.json')
// and
partners: { partners: [] }

// Create CRUD routes
createCRUDRoutes('partners', DATA_FILES.partners, 'partners');
```

5. **Create data file** `data/partners.json`:
```json
{
  "partners": []
}
```

### Task: Modify Layout for Mobile

**Goal**: Make gallery cards stack on mobile devices

**Approach**:
1. Use CSS media queries
2. Test on multiple screen sizes
3. Use flexible layouts (flexbox, grid)

**Example**:
```css
/* Desktop layout */
.gallery-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
}

/* Tablet layout */
@media (max-width: 768px) {
    .gallery-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

/* Mobile layout */
@media (max-width: 480px) {
    .gallery-grid {
        grid-template-columns: 1fr;
    }
}
```

### Task: Add Form Validation

**Goal**: Validate user input before submission

**Example**:
```javascript
function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function validatePhone(phone) {
    const regex = /^\d{10}$/;
    return regex.test(phone.replace(/\D/g, ''));
}

function validateForm(formData) {
    const errors = [];
    
    if (!formData.name || formData.name.trim() === '') {
        errors.push('Name is required');
    }
    
    if (!validateEmail(formData.email)) {
        errors.push('Valid email is required');
    }
    
    if (formData.phone && !validatePhone(formData.phone)) {
        errors.push('Phone must be 10 digits');
    }
    
    if (formData.message && formData.message.length < 10) {
        errors.push('Message must be at least 10 characters');
    }
    
    return errors;
}

// Usage
const errors = validateForm(formData);
if (errors.length > 0) {
    showToast(errors.join(', '), 'error');
    return;
}
```

---

## 🐛 Debugging & Testing

### Browser DevTools

**Console Logging** - Debug your JavaScript:
```javascript
// In your code
console.log('Variable value:', variable);
console.error('Error occurred:', error);
console.warn('Warning:', message);

// Group related logs
console.group('Service Data');
console.log('ID:', service.id);
console.log('Title:', service.title);
console.groupEnd();

// Table format for arrays
console.table(servicesArray);
```

**Network Tab** - Check API calls:
1. Open DevTools → Network tab
2. Perform action that makes API call
3. Check request/response headers and body
4. Verify response status (200, 401, 404, 500, etc.)

**Application Tab** - Check storage:
1. Open DevTools → Application tab
2. Check localStorage for authToken
3. Check sessionStorage
4. Check cookies if any

### Testing Endpoints Locally

**Using cURL** (in terminal):
```bash
# GET request
curl http://localhost:3000/api/services

# POST request
curl -X POST http://localhost:3000/api/services \
  -H "Content-Type: application/json" \
  -d '{"title":"New Service","description":"Description"}'

# With authentication
curl http://localhost:3000/api/services \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Using Postman**:
1. Download Postman (postman.com)
2. Create collection for API endpoints
3. Test each endpoint with different data
4. Save requests for future use
5. Share collection with team

### Common Issues & Solutions

**Issue**: API returns 401 Unauthorized
```javascript
// Check if token exists
if (!localStorage.getItem('authToken')) {
    console.log('Not logged in');
    // Redirect to login
}

// Check token format
const token = localStorage.getItem('authToken');
console.log('Token:', token); // Should be a string

// Check token expiration
// Decode JWT to see expiry
const parts = token.split('.');
const decoded = JSON.parse(atob(parts[1]));
console.log('Expires:', new Date(decoded.exp * 1000));
```

**Issue**: Images not loading
```javascript
// Check image path
console.log('Image URL:', imageElement.src);

// Verify image exists
fetch(imageElement.src, { method: 'HEAD' })
    .then(resp => console.log('Image exists:', resp.ok))
    .catch(() => console.log('Image not found'));

// Check CORS headers
// If cross-origin, ensure server has proper CORS headers
```

**Issue**: Data not updating
```javascript
// Clear cache and reload
cache.clear();
location.reload(true);

// Or force fetch without cache
fetch(url, { cache: 'no-store' });

// Check if data file exists
fetch('./data/services.json')
    .then(r => r.json())
    .then(d => console.log('Data:', d))
    .catch(e => console.error('File not found or invalid JSON'));
```

---

## ⚡ Performance Optimization

### Image Optimization

**1. Compress Images**:
```bash
# Using ImageMagick (if installed)
convert input.jpg -quality 85 -resize 1200x output.jpg

# Using free online tools
# tinypng.com, compressor.io, etc.
```

**2. Use Appropriate Formats**:
```javascript
// Serve WebP with fallback
<picture>
    <source srcset="image.webp" type="image/webp">
    <img src="image.jpg" alt="Description">
</picture>
```

**3. Lazy Load Images**:
```javascript
// Native lazy loading
<img src="image.jpg" loading="lazy" alt="Description">

// Or implement custom lazy loading
const images = document.querySelectorAll('img[data-src]');
const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.src = entry.target.dataset.src;
            imageObserver.unobserve(entry.target);
        }
    });
});
images.forEach(img => imageObserver.observe(img));
```

### JavaScript Optimization

**1. Debounce Expensive Functions**:
```javascript
// Resize handling
window.addEventListener('resize', debounce(() => {
    updateLayout();
}, 300));
```

**2. Code Splitting**:
```javascript
// Load scripts conditionally
if (document.getElementById('admin-section')) {
    // Only load admin.js on admin page
    import('./js/admin.js');
}
```

**3. Cache API Responses**:
```javascript
const cache = {};

async function loadDataCached(url) {
    if (cache[url]) {
        return cache[url];
    }
    
    const data = await fetch(url).then(r => r.json());
    cache[url] = data;
    return data;
}
```

### CSS Optimization

**1. Minimize CSS**:
- Use shorthand properties: `padding: 10px 20px` instead of separate properties
- Combine selectors: `.card, .card-item` instead of duplicating styles
- Remove unused styles

**2. Critical CSS**:
```html
<!-- Inline critical CSS in head -->
<style>
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
    .hero { min-height: 100vh; background: linear-gradient(...); }
</style>

<!-- Defer non-critical CSS -->
<link rel="preload" href="css/styles.css" as="style">
<link rel="stylesheet" href="css/styles.css">
```

### Network Optimization

**1. Minimize Bundle Size**:
```javascript
// Use small utility libraries
// ✅ lodash-es (tree-shakeable)
// ❌ lodash (large)

// Only import what you need
import debounce from 'lodash-es/debounce';
```

**2. Enable Compression**:
```javascript
// In server.js
const compression = require('compression');
app.use(compression());
```

**3. Set Caching Headers**:
```javascript
// In server.js
app.use(express.static('public', {
    maxAge: '1d', // Cache static files for 1 day
    etag: false
}));
```

---

## 📚 Additional Resources

- [JavaScript MDN Docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript/)
- [Express.js Documentation](https://expressjs.com/)
- [REST API Best Practices](https://restfulapi.net/)
- [CSS-Tricks Guides](https://css-tricks.com/)
- [Web Performance Optimization](https://web.dev/performance/)

---

## 🔗 Related Documentation

For more information:
- See [README.md](README.md) for project overview and deployment
- Check `.env.example` for configuration options
- Review `server.js` for API endpoint implementations
- Examine `data/*.json` files for data structure examples
