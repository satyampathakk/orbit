const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');
const fsSync = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors());
app.options('*', cors()); // Enable preflight requests

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Create necessary directories if they don't exist
const ensureDirectories = () => {
    const dirs = [
        path.join(__dirname, 'data'),
        path.join(__dirname, 'images', 'services'),
        path.join(__dirname, 'images', 'gallery'),
        path.join(__dirname, 'images', 'team'),
        path.join(__dirname, 'uploads')
    ];
    
    dirs.forEach(dir => {
        if (!fsSync.existsSync(dir)) {
            fsSync.mkdirSync(dir, { recursive: true });
        }
    });
};

ensureDirectories();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Determine destination based on the category
        let uploadPath = path.join(__dirname, 'images', 'general');
        
        // Determine the category from request headers/query/body
        // Prefer explicit header (set by client) or query param because
        // multipart/form-data fields may not be available yet in req.body
        const headerCategory = req.headers['x-category'] || req.headers['x_category'];
        if (headerCategory) {
            uploadPath = path.join(__dirname, 'images', headerCategory);
        } else if (req.query && req.query.category) {
            uploadPath = path.join(__dirname, 'images', req.query.category);
        } else if (req.body && req.body.category) {
            uploadPath = path.join(__dirname, 'images', req.body.category);
        } else if (req.headers.referer && req.headers.referer.includes('services')) {
            uploadPath = path.join(__dirname, 'images', 'services');
        } else if (req.headers.referer && req.headers.referer.includes('gallery')) {
            uploadPath = path.join(__dirname, 'images', 'gallery');
        } else if (req.headers.referer && req.headers.referer.includes('team')) {
            uploadPath = path.join(__dirname, 'images', 'team');
        }
        
        // Create directory if it doesn't exist
        if (!fsSync.existsSync(uploadPath)) {
            fsSync.mkdirSync(uploadPath, { recursive: true });
        }
        
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Generate unique filename
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        // Accept only image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

// Define data file paths
const DATA_DIR = path.join(__dirname, 'data');
const SERVICES_FILE = path.join(DATA_DIR, 'services.json');
const GALLERY_FILE = path.join(DATA_DIR, 'gallery.json');
const JOBS_FILE = path.join(DATA_DIR, 'jobs.json');
const COMPANY_FILE = path.join(DATA_DIR, 'company.json');

// Helper function to read JSON file
async function readJSONFile(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // If file doesn't exist, return appropriate empty structure
        if (error.code === 'ENOENT') {
            const fileName = path.basename(filePath);
            if (fileName === 'services.json') {
                return { services: [] };
            } else if (fileName === 'gallery.json') {
                return { gallery: [] };
            } else if (fileName === 'jobs.json') {
                return { jobs: [] };
            } else if (fileName === 'company.json') {
                return {
                    company: {
                        name: "Orbit Power",
                        description: "Leading provider of electrical and utility services",
                        founded: "2020",
                        employees: "50+",
                        projects: "100+",
                        statesCovered: "10+",
                        clientRetention: "95%",
                        license: "A-Class Electrical License",
                        location: "Hazratganj, Lucknow",
                        mission: "Providing reliable electrical solutions across India",
                        values: ["Excellence", "Integrity", "Safety", "Innovation"]
                    },
                    team: []
                };
            }
        }
        throw error;
    }
}

// Helper function to write JSON file
async function writeJSONFile(filePath, data) {
    const dir = path.dirname(filePath);
    if (!fsSync.existsSync(dir)) {
        fsSync.mkdirSync(dir, { recursive: true });
    }
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

// API Routes

// Services
app.get('/api/services', async (req, res) => {
    try {
        const data = await readJSONFile(SERVICES_FILE);
        res.json(data);
    } catch (error) {
        console.error('Error reading services:', error);
        res.status(500).json({ error: 'Failed to read services data' });
    }
});

app.post('/api/services', upload.single('image'), async (req, res) => {
    try {
        const servicesData = await readJSONFile(SERVICES_FILE);
        const services = servicesData.services || [];
        
        // Generate new ID (highest existing ID + 1)
        const newId = services.length > 0 ? Math.max(...services.map(s => s.id || 0)) + 1 : 1;
        
        const newService = {
            id: newId,
            title: req.body.title,
            description: req.body.description,
            image: req.file ? `/images/services/${req.file.filename}` : req.body.image || '',
            icon: req.body.icon || 'fas fa-bolt'
        };
        
        services.push(newService);
        await writeJSONFile(SERVICES_FILE, { services });
        
        res.json({ success: true, service: newService });
    } catch (error) {
        console.error('Error adding service:', error);
        res.status(500).json({ error: 'Failed to add service' });
    }
});

app.put('/api/services/:id', upload.single('image'), async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const servicesData = await readJSONFile(SERVICES_FILE);
        const services = servicesData.services || [];
        
        const index = services.findIndex(s => s.id === id);
        if (index === -1) {
            return res.status(404).json({ error: 'Service not found' });
        }
        
        // Update service properties
        services[index].title = req.body.title || services[index].title;
        services[index].description = req.body.description || services[index].description;
        services[index].icon = req.body.icon || services[index].icon;
        
        // Handle image update if provided
        if (req.file) {
            services[index].image = `/images/services/${req.file.filename}`;
        } else if (req.body.image) {
            services[index].image = req.body.image;
        }
        
        await writeJSONFile(SERVICES_FILE, { services });
        
        res.json({ success: true, service: services[index] });
    } catch (error) {
        console.error('Error updating service:', error);
        res.status(500).json({ error: 'Failed to update service' });
    }
});

app.delete('/api/services/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const servicesData = await readJSONFile(SERVICES_FILE);
        const services = servicesData.services || [];
        
        const newServices = services.filter(s => s.id !== id);
        
        if (services.length === newServices.length) {
            return res.status(404).json({ error: 'Service not found' });
        }
        
        await writeJSONFile(SERVICES_FILE, { services: newServices });
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting service:', error);
        res.status(500).json({ error: 'Failed to delete service' });
    }
});

// Gallery
app.get('/api/gallery', async (req, res) => {
    try {
        const data = await readJSONFile(GALLERY_FILE);
        res.json(data);
    } catch (error) {
        console.error('Error reading gallery:', error);
        res.status(500).json({ error: 'Failed to read gallery data' });
    }
});

app.post('/api/gallery', upload.single('image'), async (req, res) => {
    try {
        const galleryData = await readJSONFile(GALLERY_FILE);
        const gallery = galleryData.gallery || [];
        
        const newId = gallery.length > 0 ? Math.max(...gallery.map(g => g.id || 0)) + 1 : 1;
        
        const newGalleryItem = {
            id: newId,
            title: req.body.title,
            description: req.body.description,
            image: req.file ? `/images/gallery/${req.file.filename}` : req.body.image || '',
            category: req.body.category || 'general'
        };
        
        gallery.push(newGalleryItem);
        await writeJSONFile(GALLERY_FILE, { gallery });
        
        res.json({ success: true, item: newGalleryItem });
    } catch (error) {
        console.error('Error adding gallery item:', error);
        res.status(500).json({ error: 'Failed to add gallery item' });
    }
});

app.put('/api/gallery/:id', upload.single('image'), async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const galleryData = await readJSONFile(GALLERY_FILE);
        const gallery = galleryData.gallery || [];
        
        const index = gallery.findIndex(g => g.id === id);
        if (index === -1) {
            return res.status(404).json({ error: 'Gallery item not found' });
        }
        
        gallery[index].title = req.body.title || gallery[index].title;
        gallery[index].description = req.body.description || gallery[index].description;
        gallery[index].category = req.body.category || gallery[index].category;
        
        if (req.file) {
            gallery[index].image = `/images/gallery/${req.file.filename}`;
        } else if (req.body.image) {
            gallery[index].image = req.body.image;
        }
        
        await writeJSONFile(GALLERY_FILE, { gallery });
        
        res.json({ success: true, item: gallery[index] });
    } catch (error) {
        console.error('Error updating gallery:', error);
        res.status(500).json({ error: 'Failed to update gallery item' });
    }
});

app.delete('/api/gallery/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const galleryData = await readJSONFile(GALLERY_FILE);
        const gallery = galleryData.gallery || [];
        
        const newGallery = gallery.filter(g => g.id !== id);
        
        if (gallery.length === newGallery.length) {
            return res.status(404).json({ error: 'Gallery item not found' });
        }
        
        await writeJSONFile(GALLERY_FILE, { gallery: newGallery });
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting gallery item:', error);
        res.status(500).json({ error: 'Failed to delete gallery item' });
    }
});

// Jobs
app.get('/api/jobs', async (req, res) => {
    try {
        const data = await readJSONFile(JOBS_FILE);
        res.json(data);
    } catch (error) {
        console.error('Error reading jobs:', error);
        res.status(500).json({ error: 'Failed to read jobs data' });
    }
});

app.post('/api/jobs', async (req, res) => {
    try {
        const jobsData = await readJSONFile(JOBS_FILE);
        const jobs = jobsData.jobs || [];
        
        const newId = jobs.length > 0 ? Math.max(...jobs.map(j => j.id || 0)) + 1 : 1;
        
        const newJob = {
            id: newId,
            title: req.body.title,
            description: req.body.description,
            location: req.body.location,
            type: req.body.type || 'Full-time',
            salary: req.body.salary,
            requirements: req.body.requirements ? req.body.requirements.split(',').map(r => r.trim()) : [],
            // Ensure responsibilities exists for frontend rendering
            responsibilities: req.body.responsibilities ? req.body.responsibilities.split(',').map(r => r.trim()) : []
        };
        
        jobs.push(newJob);
        await writeJSONFile(JOBS_FILE, { jobs });
        
        res.json({ success: true, job: newJob });
    } catch (error) {
        console.error('Error adding job:', error);
        res.status(500).json({ error: 'Failed to add job' });
    }
});

app.put('/api/jobs/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const jobsData = await readJSONFile(JOBS_FILE);
        const jobs = jobsData.jobs || [];
        
        const index = jobs.findIndex(j => j.id === id);
        if (index === -1) {
            return res.status(404).json({ error: 'Job not found' });
        }
        
        jobs[index] = {
            ...jobs[index],
            title: req.body.title || jobs[index].title,
            description: req.body.description || jobs[index].description,
            location: req.body.location || jobs[index].location,
            type: req.body.type || jobs[index].type,
            salary: req.body.salary || jobs[index].salary,
            requirements: req.body.requirements ? req.body.requirements.split(',').map(r => r.trim()) : (jobs[index].requirements || []),
            responsibilities: req.body.responsibilities ? req.body.responsibilities.split(',').map(r => r.trim()) : (jobs[index].responsibilities || [])
        };
        
        await writeJSONFile(JOBS_FILE, { jobs });
        
        res.json({ success: true, job: jobs[index] });
    } catch (error) {
        console.error('Error updating job:', error);
        res.status(500).json({ error: 'Failed to update job' });
    }
});

app.delete('/api/jobs/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const jobsData = await readJSONFile(JOBS_FILE);
        const jobs = jobsData.jobs || [];
        
        const newJobs = jobs.filter(j => j.id !== id);
        
        if (jobs.length === newJobs.length) {
            return res.status(404).json({ error: 'Job not found' });
        }
        
        await writeJSONFile(JOBS_FILE, { jobs: newJobs });
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting job:', error);
        res.status(500).json({ error: 'Failed to delete job' });
    }
});

// Company Info
app.get('/api/company', async (req, res) => {
    try {
        const data = await readJSONFile(COMPANY_FILE);
        res.json(data);
    } catch (error) {
        console.error('Error reading company info:', error);
        res.status(500).json({ error: 'Failed to read company data' });
    }
});

app.put('/api/company', async (req, res) => {
    try {
        const companyData = await readJSONFile(COMPANY_FILE);
        
        companyData.company = {
            ...companyData.company,
            ...req.body
        };
        
        await writeJSONFile(COMPANY_FILE, companyData);
        
        res.json({ success: true, company: companyData.company });
    } catch (error) {
        console.error('Error updating company info:', error);
        res.status(500).json({ error: 'Failed to update company info' });
    }
});

// Static files
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(express.static(path.join(__dirname, '.')));

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('API Endpoints:');
    console.log('- GET /api/services - Get all services');
    console.log('- POST /api/services - Add new service (supports image upload)');
    console.log('- PUT /api/services/:id - Update service');
    console.log('- DELETE /api/services/:id - Delete service');
    console.log('');
    console.log('- GET /api/gallery - Get all gallery items');
    console.log('- POST /api/gallery - Add new gallery item (supports image upload)');
    console.log('- PUT /api/gallery/:id - Update gallery item');
    console.log('- DELETE /api/gallery/:id - Delete gallery item');
    console.log('');
    console.log('- GET /api/jobs - Get all jobs');
    console.log('- POST /api/jobs - Add new job');
    console.log('- PUT /api/jobs/:id - Update job');
    console.log('- DELETE /api/jobs/:id - Delete job');
    console.log('');
    console.log('- GET /api/company - Get company info');
    console.log('- PUT /api/company - Update company info');
});