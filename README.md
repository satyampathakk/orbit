## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Project Overview](#project-overview)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [Docker Deployment](#docker-deployment)
- [Features](#features)
- [Project Structure](#project-structure)
- [Available API Endpoints](#available-api-endpoints)
- [Admin Panel](#admin-panel)
- [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

```bash
# Clone/download and navigate to the project
cd orbit

# Install dependencies
npm install

# Start the development server
npm run dev

# Access the website
# Frontend: http://localhost:3000
# Admin Panel: http://localhost:3000/admin.html
```

---

## 📖 Project Overview

This is a full-stack website with:

- **Frontend**: Responsive HTML/CSS/JavaScript site with dynamic content loading
- **Backend**: Express.js API server with authentication and file uploads
- **Data Storage**: JSON-based file storage with automatic CRUD operations
- **Admin Panel**: Secure content management interface for updating all website content

### Tech Stack
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Middleware**: CORS, Multer (file uploads), dotenv (configuration)
- **Data**: JSON files stored in `/data` directory
- **Authentication**: Token-based session management

---

## 💾 Installation

### Prerequisites
- **Node.js** v14 or higher
- **npm** (included with Node.js)
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Setup Steps

1. **Navigate to project directory**:
   ```bash
   cd path/to/orbit
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```
   This installs: express, cors, multer, dotenv, and nodemon (dev)

3. **Configure environment (optional)**:
   - Copy `.env.example` to `.env`
   - Update admin credentials if desired:
     ```
     ADMIN_USER=admin
     ADMIN_PASSWORD=your-secure-password
     PORT=3000
     ```

---

## 🎯 Running the Application

### Development Mode (with auto-restart)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Direct Node Execution
```bash
node server.js
```

### Custom Port
```bash
PORT=4000 npm start
```

Once running, the server will display available endpoints in the console.

---

## 🐳 Docker Deployment

### Quick Start with Docker

**Using the start script (recommended):**
```bash
# Windows
docker-start.bat

# Linux/Mac
./docker-start.sh
```

**Manual deployment:**
```bash
# Build and start all containers
docker-compose up -d --build

# Access the website
# Frontend: http://localhost
# Admin Panel: http://localhost/admin.html
# API: http://localhost:3000/api
```

### Docker Architecture

The Docker setup includes:
- **Nginx Container**: Serves static frontend files and proxies API requests
- **Node.js Container**: Runs the Express backend API
- **Docker Network**: Internal network for container communication
- **Persistent Volumes**: Data, images, and uploads persist across restarts

### Docker Commands

```bash
# View logs
docker-compose logs -f

# Stop containers
docker-compose down

# Restart containers
docker-compose restart

# View container status
docker-compose ps

# Rebuild after changes
docker-compose up -d --build
```

### Development with Docker

For development with hot-reload:
```bash
docker-compose -f docker-compose.dev.yml up -d
```

**📚 See [DOCKER_GUIDE.md](DOCKER_GUIDE.md) for complete Docker documentation including:**
- Production deployment
- SSL/HTTPS setup
- Scaling and performance
- Troubleshooting
- Backup and restore

---

## ✨ Features

### Frontend Features
- ✅ Fully responsive design for all screen sizes
- ✅ Dynamic content loading from JSON files
- ✅ Image sliders and project galleries
- ✅ Career/job listings with application support
- ✅ Client testimonials and certifications display
- ✅ Mobile navigation menu
- ✅ Smooth animations and transitions
- ✅ Contact forms and submission handling

### Backend Features
- ✅ Complete REST API for all content types
- ✅ Token-based authentication system
- ✅ Image upload with validation
- ✅ CRUD operations (Create, Read, Update, Delete)
- ✅ CORS enabled for cross-origin requests
- ✅ Automatic data file creation with defaults
- ✅ File size and type validation

### Admin Panel Features
- ✅ Secure login with session management
- ✅ Dashboard with content statistics
- ✅ Service management (add/edit/delete with images)
- ✅ Gallery management with categorization
- ✅ Job listing management
- ✅ Team and company info editing
- ✅ Client logos management
- ✅ Testimonials and certificates management
- ✅ Real-time form validation

---

## 📁 Project Structure

```
orbit/
├── index.html                 # Main landing page
├── careers.html               # Career/jobs page
├── admin.html                 # Admin panel
├── server.js                  # Express backend API
├── package.json               # Dependencies
├── .env.example               # Environment template
│
├── css/
│   ├── styles.css             # Main site styling
│   └── admin.css              # Admin panel styling
│
├── js/
│   ├── main.js                # Frontend functionality
│   ├── admin.js               # Admin panel logic
│   └── utils.js               # Shared utility functions
│
├── data/                      # JSON data files (auto-created)
│   ├── services.json          # Service offerings
│   ├── gallery.json           # Gallery projects
│   ├── jobs.json              # Job openings
│   ├── clients.json           # Client logos
│   ├── team.json              # Team members
│   ├── certificates.json      # Certifications
│   ├── testimonials.json      # Client testimonials
│   └── company.json           # Company information
│
├── images/                    # Image assets
│   ├── logo/                  # Logo files
│   ├── hero/                  # Hero section images
│   ├── services/              # Service images
│   ├── gallery/               # Gallery project images
│   ├── team/                  # Team member photos
│   ├── clients/               # Client logos
│   ├── certificates/          # Certificate images
│   ├── testimonials/          # Testimonial images
│   ├── icons/                 # Icon assets
│   └── general/               # General images
│
├── video/                     # Video assets
│   └── hero-video.mp4         # Hero section video
│
└── uploads/                   # User uploads (auto-created)
```

---

## 🔌 Available API Endpoints

### Authentication
- `POST /api/auth/login` - Login with username/password
- `POST /api/auth/logout` - Logout (requires valid token)
- `GET /api/auth/status` - Check current session status

### Services
- `GET /api/services` - Get all services
- `POST /api/services` - Add new service (auth required, supports image upload)
- `PUT /api/services/:id` - Update service (auth required)
- `DELETE /api/services/:id` - Delete service (auth required)

### Gallery
- `GET /api/gallery` - Get all gallery items
- `POST /api/gallery` - Add gallery item (auth required, supports image upload)
- `PUT /api/gallery/:id` - Update gallery item (auth required)
- `DELETE /api/gallery/:id` - Delete gallery item (auth required)

### Jobs
- `GET /api/jobs` - Get all job listings
- `POST /api/jobs` - Add new job (auth required)
- `PUT /api/jobs/:id` - Update job (auth required)
- `DELETE /api/jobs/:id` - Delete job (auth required)

### Company Information
- `GET /api/company` - Get company info and team
- `PUT /api/company` - Update company info (auth required)

### Other Resources
Similar CRUD endpoints available for:
- `/api/clients` - Client logos and information
- `/api/team` - Team members
- `/api/certificates` - Certifications
- `/api/testimonials` - Client testimonials

---

## 🛠️ Admin Panel

### Accessing the Admin Panel
1. Navigate to `http://localhost:3000/admin.html`
2. Login with credentials (default: admin/admin)
3. Update credentials in `.env` file for security

### Main Sections

**Dashboard**: Overview of all content types with item counts

**Services Management**: 
- View, add, edit, and delete services
- Upload service images
- Manage descriptions and pricing

**Gallery Management**:
- Manage portfolio/project images
- Add project descriptions
- Organize by categories

**Jobs Management**:
- Post new job listings
- Edit requirements and descriptions
- Manage application process

**Company Information**:
- Update mission and vision
- Manage team members
- Update company details

**Additional Sections**:
- Client logos management
- Testimonials and reviews
- Certifications and awards

---

## 📊 Data File Structure

All content is stored in `/data/` as JSON files. Each file has a specific structure:

### services.json
```json
{
  "services": [
    {
      "id": "unique-id",
      "title": "Service Name",
      "description": "Service description",
      "image": "services/image.jpg"
    }
  ]
}
```

### gallery.json
```json
{
  "gallery": [
    {
      "id": "unique-id",
      "title": "Project Name",
      "description": "Project description",
      "image": "gallery/image.jpg",
      "category": "Category"
    }
  ]
}
```

### jobs.json
```json
{
  "jobs": [
    {
      "id": "unique-id",
      "title": "Job Title",
      "description": "Job description",
      "requirements": ["Requirement 1", "Requirement 2"],
      "salary": "Amount"
    }
  ]
}
```

See other data files in the `/data` directory for complete structure of each resource type.

---

## 🖼️ Image Management

### Image Upload via Admin Panel
When uploading images through the admin panel, they are automatically saved to the appropriate directory:

- **Services**: `/images/services/`
- **Gallery**: `/images/gallery/`
- **Team**: `/images/team/`
- **Clients**: `/images/clients/`
- **Certificates**: `/images/certificates/`
- **Testimonials**: `/images/testimonials/`

### Image Requirements
- Maximum file size: 5MB
- Supported formats: JPG, PNG, GIF, WebP
- Recommended dimensions: See specific section requirements
- File names are automatically sanitized

### Optimizing Images
For best performance:
1. Compress images before uploading
2. Use appropriate dimensions
3. Convert to WebP format when possible
4. Use descriptive file names

---

## 🔐 Security Considerations

⚠️ **Important Security Notes**:

1. **Change Default Credentials**: 
   - Update admin username/password in `.env` file
   - Use strong, unique passwords

2. **Environment Variables**:
   - Never commit `.env` file to version control
   - Keep sensitive data in environment variables only

3. **Production Deployment**:
   - Enable HTTPS/SSL certificate
   - Restrict CORS to specific domains
   - Use proper authentication system
   - Implement rate limiting
   - Add input validation and sanitization
   - Keep Node.js and packages updated

4. **File Uploads**:
   - All uploads are validated for type and size
   - Only specific MIME types are accepted
   - Files are stored outside web root when possible

---

## 🐛 Troubleshooting

### Port Already in Use
**Error**: `EADDRINUSE: address already in use :::3000`

**Solution**:
- Change port in `.env` file: `PORT=4000`
- Or stop other applications using port 3000
- Windows: `netstat -ano | find "3000"` then `taskkill /PID <pid> /F`

### Missing Dependencies
**Error**: `Cannot find module`

**Solution**:
```bash
npm install
```

### Permission Errors
**Error**: `EPERM: operation not permitted`

**Solution**:
- Run terminal/command prompt as Administrator
- Check file and directory permissions
- Ensure `/uploads` and `/images` directories are writable

### Images Not Uploading
**Error**: Images fail to upload through admin panel

**Troubleshoot**:
- Verify file size < 5MB
- Check file format is supported (JPG, PNG, GIF, WebP)
- Ensure `/images/` directory exists and has write permissions
- Check browser console for detailed error messages

### Admin Panel Won't Load
**Error**: Admin panel shows error or won't load content

**Troubleshoot**:
- Verify server is running: Check terminal for errors
- Clear browser cache (Ctrl+Shift+Del)
- Check network tab in browser DevTools
- Verify authentication token is valid
- Restart the server: Stop and run `npm start` again

### Data Files Not Found
**Error**: 404 errors for data files

**Solution**:
- Data files are auto-created on first server start
- If missing, restart the server
- Check `/data` directory exists
- Verify file permissions

### Server Crashes on Startup
**Common causes**:
- Port already in use
- Corrupted `.env` file
- Missing node_modules: Run `npm install`
- Syntax error in `server.js`

**Solution**:
1. Check terminal error message
2. Verify `.env` file syntax
3. Delete `node_modules` and `package-lock.json`
4. Run `npm install` again
5. Try starting with a different port

---

## 📝 Content Updates

### Via Admin Panel (Recommended)
1. Go to `http://localhost:3000/admin.html`
2. Login with admin credentials
3. Navigate to desired section
4. Add, edit, or delete content
5. Upload images as needed
6. Changes are saved immediately

### Direct File Editing
You can also edit JSON files directly:
1. Edit files in `/data/` directory
2. Maintain proper JSON format
3. Restart server for changes to take effect

### Batch Data Import
To import data from external sources:
1. Format data to match JSON structure
2. Edit data files directly with proper formatting
3. Restart server

---

## 📦 Dependencies

The project uses the following npm packages:

| Package | Purpose |
|---------|---------|
| express | Web framework for Node.js |
| cors | Enable cross-origin requests |
| multer | Handle file uploads |
| dotenv | Load environment variables |
| nodemon | Auto-restart on file changes (dev) |

Install all with: `npm install`

---

## 🌐 Deployment

### Local Development
Simply run `npm run dev` and access at `http://localhost:3000`

### Production Server
1. Set environment variables properly
2. Set `NODE_ENV=production`
3. Use a process manager (PM2, forever, etc.)
4. Configure reverse proxy (nginx, Apache)
5. Set up SSL/HTTPS certificate
6. Optimize static file caching

Example with PM2:
```bash
npm install -g pm2
pm2 start server.js --name "orbit-website"
pm2 save
pm2 startup
```

---

## 📞 Support & Maintenance

### Regular Maintenance
- Keep Node.js and npm updated
- Review and update dependencies: `npm update`
- Monitor server logs for errors
- Regular backups of data files
- Test all features after updates

### Monitoring
- Check server uptime and performance
- Review error logs regularly
- Monitor disk space for uploads
- Check for security updates

### Backup Strategy
- Regularly backup `/data/` directory
- Backup `/images/` and `/uploads/` directories
- Keep version control history
- Document any custom modifications

---

## 📄 License & Credits

This website was created for Orbit Power, an electrical services company.

For development information, refer to the [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) file.
