require('dotenv').config();

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const fsSync = require('fs');
const rateLimit = require('express-rate-limit');
const EmailService = require('./emailService');

// ========== CONFIGURATION ==========
const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'change-me';
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const DATA_DIR = path.join(__dirname, 'data');

// Initialize email service
const emailService = new EmailService();

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

// ========== RATE LIMITING ==========
// Rate limiting middleware for contact form endpoint
const contactRateLimit = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: 5, // Maximum 5 requests per hour per IP
    message: {
        success: false,
        error: 'Too many contact form submissions',
        details: 'You have exceeded the maximum number of contact form submissions. Please wait 1 hour before submitting again.'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
        console.log(`Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            success: false,
            error: 'Too many contact form submissions',
            details: 'You have exceeded the maximum number of contact form submissions. Please wait 1 hour before submitting again.'
        });
    },
    skip: (req, res) => {
        // Skip rate limiting for localhost during development (comment out for testing)
        const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
        return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
        // return false; // Enable rate limiting for all IPs during testing
    }
});

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

// ========== CONTACT FORM API ==========

// Input validation functions
function validateContactForm(data) {
    const errors = [];
    
    // Name validation
    if (!data.name || typeof data.name !== 'string') {
        errors.push('Name is required');
    } else if (data.name.trim().length < 2) {
        errors.push('Name must be at least 2 characters long');
    } else if (data.name.trim().length > 100) {
        errors.push('Name must be less than 100 characters');
    } else if (containsSuspiciousContent(data.name)) {
        errors.push('Name contains invalid characters');
    }
    
    // Email validation
    if (!data.email || typeof data.email !== 'string') {
        errors.push('Email is required');
    } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email.trim())) {
            errors.push('Please provide a valid email address');
        }
    }
    
    // Phone validation
    if (!data.phone || typeof data.phone !== 'string') {
        errors.push('Phone number is required');
    } else if (data.phone.trim().length < 10) {
        errors.push('Phone number must be at least 10 characters long');
    } else if (data.phone.trim().length > 15) {
        errors.push('Phone number must be less than 15 characters');
    }
    
    // Message validation
    if (!data.message || typeof data.message !== 'string') {
        errors.push('Message is required');
    } else if (data.message.trim().length < 10) {
        errors.push('Message must be at least 10 characters long');
    } else if (data.message.trim().length > 1000) {
        errors.push('Message must be less than 1000 characters');
    } else if (containsSuspiciousContent(data.message)) {
        errors.push('Message contains invalid content');
    }
    
    return errors;
}

// Check for suspicious content (XSS, SQL injection, etc.)
function containsSuspiciousContent(str) {
    if (typeof str !== 'string') return false;
    
    const suspiciousPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /drop\s+table/i,
        /select\s+\*/i,
        /union\s+select/i,
        /insert\s+into/i,
        /delete\s+from/i,
        /update\s+\w+\s+set/i,
        /<iframe/i,
        /<object/i,
        /<embed/i,
        /eval\s*\(/i,
        /expression\s*\(/i
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(str));
}

// Input sanitization function
function sanitizeInput(str) {
    if (typeof str !== 'string') return str;
    return str
        .trim()
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, ''); // Remove event handlers
}

// Contact form endpoint with rate limiting
app.post('/api/contact', contactRateLimit, async (req, res) => {
    try {
        // Validate request body
        const validationErrors = validateContactForm(req.body);
        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: validationErrors.join(', ')
            });
        }
        
        // Sanitize input data
        const sanitizedData = {
            name: sanitizeInput(req.body.name),
            email: sanitizeInput(req.body.email),
            phone: sanitizeInput(req.body.phone),
            message: sanitizeInput(req.body.message)
        };
        
        // Log the contact form submission
        console.log('Contact form submission received:', {
            name: sanitizedData.name,
            email: sanitizedData.email,
            phone: sanitizedData.phone,
            timestamp: new Date().toISOString()
        });
        
        // Send emails using email service
        try {
            if (!emailService.isReady()) {
                console.log('Email service not ready, attempting to initialize...');
                const initialized = await emailService.initializeTransporter();
                if (!initialized) {
                    throw new Error('Failed to initialize email service');
                }
            }
            
            // Prepare metadata for email template
            const metadata = {
                clientIP: req.ip || req.connection.remoteAddress || 'Unknown',
                userAgent: req.get('User-Agent') || 'Unknown'
            };
            
            const emailResult = await emailService.sendContactEmail(sanitizedData, metadata);
            
            // Check if at least one email was sent successfully
            const userEmailSent = emailResult.userEmail.success;
            const businessEmailSent = emailResult.businessEmail.success;
            
            if (!userEmailSent && !businessEmailSent) {
                // Both emails failed
                console.error('Both emails failed to send:', {
                    userError: emailResult.userEmail.error,
                    businessError: emailResult.businessEmail.error
                });
                
                return res.status(500).json({
                    success: false,
                    error: 'Email delivery failed',
                    details: 'Unable to send confirmation emails. Please try again or contact us directly.'
                });
            }
            
            // At least one email was sent successfully
            let message = 'Contact form submitted successfully';
            let warnings = [];
            
            if (!userEmailSent) {
                warnings.push('Confirmation email could not be sent');
                console.warn('User confirmation email failed:', emailResult.userEmail.error);
            }
            
            if (!businessEmailSent) {
                warnings.push('Business notification could not be sent');
                console.warn('Business notification email failed:', emailResult.businessEmail.error);
            }
            
            if (warnings.length > 0) {
                message += '. Note: ' + warnings.join(', ');
            }
            
            res.json({
                success: true,
                message: message,
                emailStatus: {
                    userEmail: userEmailSent,
                    businessEmail: businessEmailSent
                }
            });
            
        } catch (emailError) {
            console.error('Email service error:', emailError);
            
            // Return success for form submission but indicate email issue
            res.json({
                success: true,
                message: 'Contact form submitted successfully, but confirmation email could not be sent. We will still respond to your inquiry.',
                emailStatus: {
                    userEmail: false,
                    businessEmail: false,
                    error: 'Email service temporarily unavailable'
                }
            });
        }
        
    } catch (error) {
        console.error('Error processing contact form:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: 'Failed to process contact form submission'
        });
    }
});

// Static files
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(express.static(path.join(__dirname, '.')));

// ========== SERVER STARTUP ==========
app.listen(PORT, async () => {
    console.log(`\n🚀 Orbit Power Server running on http://localhost:${PORT}\n`);
    
    // Initialize email service
    console.log('📧 Initializing email service...');
    const emailInitialized = await emailService.initializeTransporter();
    if (emailInitialized) {
        console.log('✅ Email service ready');
    } else {
        console.log('⚠️  Email service initialization failed - contact form will work but emails may not be sent');
    }
    
    console.log('\n📡 Available API Endpoints:');
    console.log('   Services:      GET/POST/PUT/DELETE /api/services');
    console.log('   Gallery:       GET/POST/PUT/DELETE /api/gallery');
    console.log('   Jobs:          GET/POST/PUT/DELETE /api/jobs');
    console.log('   Clients:       GET/POST/PUT/DELETE /api/clients');
    console.log('   Team:          GET/POST/PUT/DELETE /api/team');
    console.log('   Certificates:  GET/POST/PUT/DELETE /api/certificates');
    console.log('   Testimonials:  GET/POST/PUT/DELETE /api/testimonials');
    console.log('   Company:       GET/PUT /api/company');
    console.log('   Contact:       POST /api/contact');
    console.log('   Auth:          POST /api/auth/login, POST /api/auth/logout, GET /api/auth/status\n');
});
