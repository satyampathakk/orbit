# Orbit Power Website - Data Driven Structure

## Project Structure
```
orbit-website/
├── index.html (main page)
├── careers.html (jobs page)
├── admin.html (content management interface)
├── data/
│   ├── services.json
│   ├── gallery.json
│   ├── jobs.json
│   └── company.json
├── images/
│   ├── services/
│   ├── gallery/
│   └── team/
├── js/
│   ├── main.js
│   └── admin.js
├── css/
│   ├── styles.css
│   └── admin.css
└── BACKEND_IMPLEMENTATION.md
```

## Admin Panel Features

### Current Implementation
The admin panel displays content from JSON data files and allows management of:
- Dashboard with content statistics
- Service management (view/add/edit/delete)
- Gallery management (view/add/edit/delete)
- Job posting management (view/add/edit/delete)
- Company information viewing/editing

### Image Upload Feature
The admin panel supports image upload functionality:

1. **Frontend Implementation**: Allows users to select images and see previews
2. **Backend Requirement**: In a production environment, a server-side script is needed to:
   - Receive uploaded images
   - Save images to the appropriate directories
   - Update JSON data files with new image paths
   - Manage image storage and naming conventions

### Image Storage Convention
Images are organized by category (on the server):
- `/images/services/` - Service card images
- `/images/gallery/` - Gallery project images
- `/images/team/` - Team member profile pictures

## JSON Data Files
The site loads content from these JSON files:
- `services.json` - All service offerings with titles, descriptions, and image paths
- `gallery.json` - Gallery items with titles, descriptions, and image paths
- `jobs.json` - Job postings with titles, descriptions, requirements, etc.
- `company.json` - Company information including team members

## Dynamic Content Loading
All content is loaded dynamically from JSON files using JavaScript's `fetch()` API with fallbacks for local file access.

## Backend Requirements
**Important**: The current implementation demonstrates the frontend functionality only. For a fully functional system that persists data changes made through the admin panel, a backend server is required.

Please see `BACKEND_IMPLEMENTATION.md` for details about:
- Required API endpoints
- Backend implementation examples (PHP, Node.js)
- File structure for backend integration
- Deployment considerations

## Development Notes
- The site works both locally (opening files directly) and when served via HTTP
- Frontend demonstrates full admin functionality with real data from JSON files
- CORS errors are handled gracefully with fallback data mechanisms
- All interactive features are fully functional
- Responsive design works on all screen sizes