# Orbit Power - Electrical Engineering Services Website

A professional, data-driven website for Orbit Power, an A-Class electrical license holder providing integrated utility services across India.

## Project Structure

```
orbit-website/
├── index.html                 # Main landing page
├── careers.html               # Career/jobs page  
├── admin.html                 # Admin content management panel
├── data/                      # JSON data files
│   ├── services.json          # Service offerings
│   ├── gallery.json           # Gallery images/projects
│   ├── jobs.json              # Job listings
│   └── company.json           # Company info and team
├── images/                    # Image assets
│   ├── services/              # Service card images
│   ├── gallery/               # Gallery project images
│   └── team/                  # Team member photos
├── js/                        # JavaScript files
│   ├── main.js                # Main site functionality
│   └── admin.js               # Admin panel functionality
├── css/                       # Stylesheets
│   ├── styles.css             # Main site styles
│   └── admin.css              # Admin panel styles
├── server.js                  # Backend server
├── package.json               # Project dependencies
└── README.md                  # This file
```

## Prerequisites

- **Node.js** (v14 or higher recommended)
- **npm** (comes with Node.js)
- Modern web browser (Chrome, Firefox, Safari, Edge)

## Installation

### 1. Clone or download the project

If you downloaded as a zip, extract it to your desired location.

### 2. Navigate to the project directory

```bash
cd path/to/orbit-website
```

### 3. Install dependencies

```bash
npm install
```

This will install all required packages listed in `package.json`:
- express: Web server framework
- cors: Cross-origin resource sharing middleware
- multer: File upload middleware
- Other development dependencies

## Running the Application

### Option 1: Development Mode (Recommended)

```bash
npm run dev
```

This will start the server with auto-restart on file changes using nodemon.

### Option 2: Production Mode

```bash
npm start
```

This will start the server using node.

### Option 3: Direct Node Execution

```bash
node server.js
```

## Accessing the Application

Once the server is running:

- **Website Frontend**: Open your browser and go to `http://localhost:3000`
- **Admin Panel**: Go to `http://localhost:3000/admin.html`
- **API Endpoints**: Available at `http://localhost:3000/api/*`

## Backend API Endpoints

### Services Management
- `GET /api/services` - Get all services
- `POST /api/services` - Add new service (supports image upload)
- `PUT /api/services/:id` - Update service
- `DELETE /api/services/:id` - Delete service

### Gallery Management
- `GET /api/gallery` - Get all gallery items
- `POST /api/gallery` - Add new gallery item (supports image upload)
- `PUT /api/gallery/:id` - Update gallery item
- `DELETE /api/gallery/:id` - Delete gallery item

### Jobs Management
- `GET /api/jobs` - Get all job listings
- `POST /api/jobs` - Add new job listing
- `PUT /api/jobs/:id` - Update job listing
- `DELETE /api/jobs/:id` - Delete job listing

### Company Information
- `GET /api/company` - Get company information and team
- `PUT /api/company` - Update company information

## Admin Panel Features

1. **Dashboard** - View content statistics
2. **Services Management** - Add/edit/delete services with image uploads
3. **Gallery Management** - Add/edit/delete gallery items with image uploads
4. **Jobs Management** - Add/edit/delete job listings
5. **Company Info** - Update company details and team information

## File Structure for Uploaded Images

When uploading images via the admin panel:
- Service images: `/images/services/`
- Gallery images: `/images/gallery/`
- Team images: `/images/team/`

## Data Files

All content is stored in JSON format in the `/data/` directory:
- `services.json` - Contains all service offerings
- `gallery.json` - Contains gallery items with descriptions
- `jobs.json` - Contains job listings
- `company.json` - Contains company info, mission, and team details

## Troubleshooting

### Common Issues:

1. **Port already in use**:
   - Error: "EADDRINUSE: address already in use"
   - Solution: Change the port in `server.js` or stop other applications using port 3000

2. **Permission errors**:
   - Error: "EPERM: operation not permitted"
   - Solution: Run terminal as administrator or check file permissions

3. **Missing dependencies**:
   - Error: "Cannot find module"
   - Solution: Run `npm install` again

4. **Image upload fails**:
   - Check that the `/images` directory and subdirectories exist
   - Verify correct folder permissions

### Checking Server Status:
The server will output API endpoint information when successfully running.

## Environment Variables

The server uses the following environment configuration:
- Port: Controlled by `PORT` environment variable (defaults to 3000)

To run on a different port:
```bash
PORT=4000 npm start
```

## Updating Content

1. Via Admin Panel (Recommended):
   - Access `http://localhost:3000/admin.html`
   - Log in and navigate to the section you want to update
   - Add, edit, or delete content as needed

2. Direct JSON Modification:
   - Edit files in `/data/` directory directly
   - Restart server to see changes in some cases

## Production Deployment

For production deployment:
1. Ensure all environment variables are set appropriately
2. Set NODE_ENV=production
3. Use a process manager like PM2
4. Configure reverse proxy (nginx/Apache) if needed
5. Set up SSL certificate for HTTPS

## Support

For technical issues:
- Check the console in your browser's developer tools
- Review server logs in terminal/command prompt
- Ensure all prerequisites are correctly installed

This website requires a backend server to enable the admin functionality and image uploads. Without the Node.js server running, the frontend will still work but with limited admin panel functionality.