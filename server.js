require('dotenv').config();

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const fsSync = require('fs');

// ========== CONFIGURATION ==========
const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'change-me';
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const DATA_DIR = path.join(__dirname, 'data');

const REQUIRED_DIRS = [
    'data',
    'images/services',
    'images/gallery',
    'images/team',
    'images/clients',
    'images/certificates',
    'images/testimonials',
    'uploads'
];

const DATA_FILES = {
    services: path.join(DATA_DIR, 'services.json'),
    gallery: path.join(DATA_DIR, 'gallery.json'),
    jobs: path.join(DATA_DIR, 'jobs.json'),
    company: path.join(DATA_DIR, 'company.json'),
    clients: path.join(DATA_DIR, 'clients.json'),
    team: path.join(DATA_DIR, 'team.json'),
    certificates: path.join(DATA_DIR, 'certificates.json'),
    testimonials: path.join(DATA_DIR, 'testimonials.json')
};

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
            description: "Leading provider of electrical and utility services",
            founded: "2020",
            employees: "50+",
            projects: "100+",
            statesCovered: "10+",
            clientRetention: "95%",
            license: "A-Class Electrical License",
            location: "Hazratganj, Lucknow",
            mission: "Providing reliable electrical solutions across India"
        },
        team: []
    }
};

// ========== MIDDLEWARE ==========
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ========== FILE UPLOAD CONFIGURATION ==========
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const category = req.headers['x-category'] || req.query.category || req.body.category || 'general';
        const uploadPath = path.join(__dirname, 'images', category);
        
        if (!fsSync.existsSync(uploadPath)) {
            fsSync.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

// ========== AUTHENTICATION SYSTEM ==========
const activeTokens = new Map();

function generateToken() {
    return crypto.randomBytes(24).toString('hex');
}

function getTokenFromRequest(req) {
    const header = req.headers.authorization || '';
    return header.startsWith('Bearer ') ? header.slice(7) : null;
}

function requireAuth(req, res, next) {
    const token = getTokenFromRequest(req);

    if (!token || !activeTokens.has(token)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const expiresAt = activeTokens.get(token);
    if (Date.now() > expiresAt) {
        activeTokens.delete(token);
        return res.status(401).json({ error: 'Session expired' });
    }

    // Extend session sliding window
    activeTokens.set(token, Date.now() + TOKEN_TTL_MS);
    next();
}

// Auth routes
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body || {};
    if (username !== ADMIN_USER || password !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken();
    const expiresAt = Date.now() + TOKEN_TTL_MS;
    activeTokens.set(token, expiresAt);

    res.json({ token, expiresAt });
});

app.post('/api/auth/logout', requireAuth, (req, res) => {
    const token = getTokenFromRequest(req);
    if (token) {
        activeTokens.delete(token);
    }
    res.json({ success: true });
});

app.get('/api/auth/status', requireAuth, (req, res) => {
    const token = getTokenFromRequest(req);
    res.json({ authenticated: true, expiresAt: activeTokens.get(token) });
});

// ========== UTILITY FUNCTIONS ==========

/**
 * Ensure all required directories exist
 */
function ensureDirectories() {
    REQUIRED_DIRS.forEach(dir => {
        const fullPath = path.join(__dirname, dir);
        if (!fsSync.existsSync(fullPath)) {
            fsSync.mkdirSync(fullPath, { recursive: true });
        }
    });
}

/**
 * Read JSON file with fallback to default data
 */
async function readJSONFile(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            const fileName = path.basename(filePath, '.json');
            return DEFAULT_DATA[fileName] || {};
        }
        throw error;
    }
}

/**
 * Write JSON file with directory creation
 */
async function writeJSONFile(filePath, data) {
    const dir = path.dirname(filePath);
    if (!fsSync.existsSync(dir)) {
        fsSync.mkdirSync(dir, { recursive: true });
    }
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

/**
 * Generate next sequential ID
 */
function generateNextId(items) {
    return items.length > 0 ? Math.max(...items.map(item => item.id || 0)) + 1 : 1;
}

/**
 * Create CRUD routes for a resource type
 * Supports image uploads and custom plural forms
 */
function createCRUDRoutes(resourceName, dataFile, imageCategory = null, pluralName = `${resourceName}s`) {
    
    // GET all items
    app.get(`/api/${pluralName}`, async (req, res) => {
        try {
            const data = await readJSONFile(dataFile);
            res.json(data);
        } catch (error) {
            console.error(`Error reading ${pluralName}:`, error);
            res.status(500).json({ error: `Failed to read ${pluralName} data` });
        }
    });

    // POST new item
    app.post(`/api/${pluralName}`, requireAuth, upload.single('image'), async (req, res) => {
        try {
            const fileData = await readJSONFile(dataFile);
            const items = fileData[pluralName] || [];
            const newId = generateNextId(items);

            const newItem = { id: newId, ...req.body };
            
            if (req.file && imageCategory) {
                newItem.image = `/images/${imageCategory}/${req.file.filename}`;
            }

            items.push(newItem);
            await writeJSONFile(dataFile, { [pluralName]: items });

            res.json({ success: true, [resourceName]: newItem });
        } catch (error) {
            console.error(`Error adding ${resourceName}:`, error);
            res.status(500).json({ error: `Failed to add ${resourceName}` });
        }
    });

    // PUT (update) item
    app.put(`/api/${pluralName}/:id`, requireAuth, upload.single('image'), async (req, res) => {
        try {
            const id = parseInt(req.params.id);
            const fileData = await readJSONFile(dataFile);
            const items = fileData[pluralName] || [];

            const index = items.findIndex(item => item.id === id);
            if (index === -1) {
                return res.status(404).json({ error: `${resourceName} not found` });
            }

            items[index] = { ...items[index], ...req.body };
            
            if (req.file && imageCategory) {
                items[index].image = `/images/${imageCategory}/${req.file.filename}`;
            }

            await writeJSONFile(dataFile, { [pluralName]: items });
            res.json({ success: true, [resourceName]: items[index] });
        } catch (error) {
            console.error(`Error updating ${resourceName}:`, error);
            res.status(500).json({ error: `Failed to update ${resourceName}` });
        }
    });

    // DELETE item
    app.delete(`/api/${pluralName}/:id`, requireAuth, async (req, res) => {
        try {
            const id = parseInt(req.params.id);
            const fileData = await readJSONFile(dataFile);
            const items = fileData[pluralName] || [];

            const filteredItems = items.filter(item => item.id !== id);
            
            if (items.length === filteredItems.length) {
                return res.status(404).json({ error: `${resourceName} not found` });
            }

            await writeJSONFile(dataFile, { [pluralName]: filteredItems });
            res.json({ success: true });
        } catch (error) {
            console.error(`Error deleting ${resourceName}:`, error);
            res.status(500).json({ error: `Failed to delete ${resourceName}` });
        }
    });
}

// ========== API ROUTES ==========

// Initialize directories
ensureDirectories();

// Standard CRUD routes
createCRUDRoutes('service', DATA_FILES.services, 'services');
createCRUDRoutes('client', DATA_FILES.clients, 'clients');
createCRUDRoutes('team', DATA_FILES.team, 'team', 'team');
createCRUDRoutes('certificate', DATA_FILES.certificates, 'certificates');
createCRUDRoutes('testimonial', DATA_FILES.testimonials, 'testimonials');

// Gallery with custom category support
app.get('/api/gallery', async (req, res) => {
    try {
        const data = await readJSONFile(DATA_FILES.gallery);
        res.json(data);
    } catch (error) {
        console.error('Error reading gallery:', error);
        res.status(500).json({ error: 'Failed to read gallery data' });
    }
});

app.post('/api/gallery', requireAuth, upload.single('image'), async (req, res) => {
    try {
        const fileData = await readJSONFile(DATA_FILES.gallery);
        const gallery = fileData.gallery || [];
        
        const newItem = {
            id: generateNextId(gallery),
            title: req.body.title,
            description: req.body.description,
            category: req.body.category || 'general',
            image: req.file ? `/images/gallery/${req.file.filename}` : req.body.image || ''
        };

        gallery.push(newItem);
        await writeJSONFile(DATA_FILES.gallery, { gallery });
        res.json({ success: true, item: newItem });
    } catch (error) {
        console.error('Error adding gallery item:', error);
        res.status(500).json({ error: 'Failed to add gallery item' });
    }
});

app.put('/api/gallery/:id', requireAuth, upload.single('image'), async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const fileData = await readJSONFile(DATA_FILES.gallery);
        const gallery = fileData.gallery || [];
        const index = gallery.findIndex(g => g.id === id);
        
        if (index === -1) return res.status(404).json({ error: 'Gallery item not found' });

        gallery[index] = { ...gallery[index], ...req.body };
        if (req.file) gallery[index].image = `/images/gallery/${req.file.filename}`;

        await writeJSONFile(DATA_FILES.gallery, { gallery });
        res.json({ success: true, item: gallery[index] });
    } catch (error) {
        console.error('Error updating gallery:', error);
        res.status(500).json({ error: 'Failed to update gallery item' });
    }
});

app.delete('/api/gallery/:id', requireAuth, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const fileData = await readJSONFile(DATA_FILES.gallery);
        const gallery = fileData.gallery || [];
        const filtered = gallery.filter(g => g.id !== id);
        
        if (gallery.length === filtered.length) return res.status(404).json({ error: 'Gallery item not found' });

        await writeJSONFile(DATA_FILES.gallery, { gallery: filtered });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting gallery item:', error);
        res.status(500).json({ error: 'Failed to delete gallery item' });
    }
});

// Jobs with array field support (responsibilities, requirements)
app.get('/api/jobs', async (req, res) => {
    try {
        const data = await readJSONFile(DATA_FILES.jobs);
        res.json(data);
    } catch (error) {
        console.error('Error reading jobs:', error);
        res.status(500).json({ error: 'Failed to read jobs data' });
    }
});

app.post('/api/jobs', requireAuth, async (req, res) => {
    try {
        const fileData = await readJSONFile(DATA_FILES.jobs);
        const jobs = fileData.jobs || [];

        const newJob = {
            id: generateNextId(jobs),
            title: req.body.title,
            description: req.body.description,
            location: req.body.location,
            type: req.body.type || 'Full-time',
            salary: req.body.salary,
            requirements: Array.isArray(req.body.requirements) 
                ? req.body.requirements 
                : (req.body.requirements ? req.body.requirements.split(',').map(r => r.trim()) : []),
            responsibilities: Array.isArray(req.body.responsibilities) 
                ? req.body.responsibilities 
                : (req.body.responsibilities ? req.body.responsibilities.split(',').map(r => r.trim()) : [])
        };

        jobs.push(newJob);
        await writeJSONFile(DATA_FILES.jobs, { jobs });
        res.json({ success: true, job: newJob });
    } catch (error) {
        console.error('Error adding job:', error);
        res.status(500).json({ error: 'Failed to add job' });
    }
});

app.put('/api/jobs/:id', requireAuth, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const fileData = await readJSONFile(DATA_FILES.jobs);
        const jobs = fileData.jobs || [];
        const index = jobs.findIndex(j => j.id === id);

        if (index === -1) return res.status(404).json({ error: 'Job not found' });

        jobs[index] = {
            ...jobs[index],
            ...req.body,
            requirements: Array.isArray(req.body.requirements) 
                ? req.body.requirements 
                : (req.body.requirements ? req.body.requirements.split(',').map(r => r.trim()) : (jobs[index].requirements || [])),
            responsibilities: Array.isArray(req.body.responsibilities) 
                ? req.body.responsibilities 
                : (req.body.responsibilities ? req.body.responsibilities.split(',').map(r => r.trim()) : (jobs[index].responsibilities || []))
        };

        await writeJSONFile(DATA_FILES.jobs, { jobs });
        res.json({ success: true, job: jobs[index] });
    } catch (error) {
        console.error('Error updating job:', error);
        res.status(500).json({ error: 'Failed to update job' });
    }
});

app.delete('/api/jobs/:id', requireAuth, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const fileData = await readJSONFile(DATA_FILES.jobs);
        const jobs = fileData.jobs || [];
        const filtered = jobs.filter(j => j.id !== id);

        if (jobs.length === filtered.length) return res.status(404).json({ error: 'Job not found' });

        await writeJSONFile(DATA_FILES.jobs, { jobs: filtered });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting job:', error);
        res.status(500).json({ error: 'Failed to delete job' });
    }
});

// Company Info
app.get('/api/company', async (req, res) => {
    try {
        const data = await readJSONFile(DATA_FILES.company);
        res.json(data);
    } catch (error) {
        console.error('Error reading company info:', error);
        res.status(500).json({ error: 'Failed to read company data' });
    }
});

app.put('/api/company', requireAuth, async (req, res) => {
    try {
        const companyData = await readJSONFile(DATA_FILES.company);
        companyData.company = { ...companyData.company, ...req.body };
        await writeJSONFile(DATA_FILES.company, companyData);
        res.json({ success: true, company: companyData.company });
    } catch (error) {
        console.error('Error updating company info:', error);
        res.status(500).json({ error: 'Failed to update company info' });
    }
});

// Static files
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(express.static(path.join(__dirname, '.')));

// ========== SERVER STARTUP ==========
app.listen(PORT, () => {
    console.log(`\n🚀 Orbit Power Server running on http://localhost:${PORT}\n`);
    console.log('📡 Available API Endpoints:');
    console.log('   Services:      GET/POST/PUT/DELETE /api/services');
    console.log('   Gallery:       GET/POST/PUT/DELETE /api/gallery');
    console.log('   Jobs:          GET/POST/PUT/DELETE /api/jobs');
    console.log('   Clients:       GET/POST/PUT/DELETE /api/clients');
    console.log('   Team:          GET/POST/PUT/DELETE /api/team');
    console.log('   Certificates:  GET/POST/PUT/DELETE /api/certificates');
    console.log('   Testimonials:  GET/POST/PUT/DELETE /api/testimonials');
    console.log('   Company:       GET/PUT /api/company');
    console.log('   Auth:          POST /api/auth/login, POST /api/auth/logout, GET /api/auth/status\n');
});
