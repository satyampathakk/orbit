# Orbit Power Website Backend Implementation

## Overview
The admin panel needs a backend to handle actual data persistence. The frontend communicates with the backend via REST API endpoints.

## Required Backend Endpoints

### GET Endpoints
- `GET /api/services` - Retrieve all services
- `GET /api/gallery` - Retrieve all gallery items
- `GET /api/jobs` - Retrieve all job listings
- `GET /api/company` - Retrieve company information

### POST/PUT/PATCH Endpoints
- `POST /api/services` - Add new service
- `PUT /api/services/:id` - Update existing service
- `DELETE /api/services/:id` - Delete service

- `POST /api/gallery` - Add new gallery item
- `PUT /api/gallery/:id` - Update existing gallery item
- `DELETE /api/gallery/:id` - Delete gallery item

- `POST /api/jobs` - Add new job listing
- `PUT /api/jobs/:id` - Update existing job listing
- `DELETE /api/jobs/:id` - Delete job listing

- `PUT /api/company` - Update company information

### File Upload Endpoint
- `POST /api/upload` - Upload images to server (for services, gallery, etc.)

## Backend Implementation Notes

### Node.js/Express Example
```javascript
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(multer().none());

// Configure storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = `public/images/${req.body.category}`;
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Routes would go here...
```

### PHP Example
```php
<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

// Get request method
$method = $_SERVER['REQUEST_METHOD'];

// Get requested resource
$request = explode('/', trim($_SERVER['PATH_INFO'], '/'));

// Process requests based on method and resource
switch($method) {
    case 'GET':
        // Handle GET requests
        break;
    case 'POST':
        // Handle POST requests
        break;
    case 'PUT':
        // Handle PUT requests
        break;
    case 'DELETE':
        // Handle DELETE requests
        break;
}
?>
```

## Frontend Modifications for Backend Integration

The admin.js file would need to be updated to use the backend endpoints:

```javascript
// Instead of loading from local JSON files
function loadData(url) {
    return fetch(`/api${url}`)  // Use backend endpoint
        .then(response => response.json())
        .catch(error => {
            console.error('Error loading data:', error);
            throw error;
        });
}

// For saving data
function saveData(endpoint, data) {
    return fetch(`/api${endpoint}`, {
        method: 'POST', // or PUT
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .catch(error => {
        console.error('Error saving data:', error);
        throw error;
    });
}
```

## File Structure Requirements for Backend
```
orbit-website/
├── public/ (or www/, htdocs/)
│   ├── index.html
│   ├── careers.html
│   ├── admin.html
│   ├── data/
│   │   ├── services.json
│   │   ├── gallery.json
│   │   ├── jobs.json
│   │   └── company.json
│   ├── images/
│   │   ├── services/
│   │   ├── gallery/
│   │   └── team/
│   └── ...
├── api/ (backend files)
│   ├── services.php (or services.js for Node.js)
│   ├── gallery.php
│   ├── jobs.php
│   ├── company.php
│   └── upload.php
└── ...
```

## Testing Backend Implementation Locally

To properly test the backend functionality:
1. Install a local server environment (like XAMPP for PHP or Node.js runtime)
2. Place the files in the server's document root
3. Configure the server to handle the API routes
4. Update the frontend to use the correct API endpoints

For local development, you can use:
- **PHP**: XAMPP, WAMP, MAMP, or built-in PHP server
- **Node.js**: Express with nodemon for auto-restart
- **Python**: Flask or Django
- **Other options**: Local dev servers like Vite, Webpack Dev Server, etc.

## Important Note
The current implementation works client-side only for demonstration purposes. In a production environment, a proper backend is required to persist data changes made through the admin panel.