/**
 * Docker Configuration Validation Script
 * Validates that all necessary files and configurations are in place for Docker deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🐳 Validating Docker Configuration for Orbit Power Website...\n');

// Files that should exist for Docker deployment
const requiredFiles = [
    'Dockerfile',
    'docker-compose.yml',
    'docker-compose.dev.yml',
    '.dockerignore',
    'server.js',
    'emailService.js',
    'package.json',
    'nginx.conf'
];

// Directories that should exist
const requiredDirectories = [
    'css',
    'js',
    'images',
    'data',
    'templates',
    'uploads'
];

// HTML files that should exist
const htmlFiles = [
    'index.html',
    'admin.html',
    'careers.html'
];

let allValid = true;

// Check required files
console.log('📁 Checking required files...');
requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - MISSING`);
        allValid = false;
    }
});

// Check required directories
console.log('\n📂 Checking required directories...');
requiredDirectories.forEach(dir => {
    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
        console.log(`✅ ${dir}/`);
    } else {
        console.log(`❌ ${dir}/ - MISSING`);
        allValid = false;
    }
});

// Check HTML files
console.log('\n🌐 Checking HTML files...');
htmlFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - MISSING`);
        allValid = false;
    }
});

// Check package.json dependencies
console.log('\n📦 Checking package.json dependencies...');
try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const requiredDeps = [
        'express',
        'cors',
        'dotenv',
        'express-rate-limit',
        'nodemailer',
        'multer'
    ];
    
    requiredDeps.forEach(dep => {
        if (packageJson.dependencies && packageJson.dependencies[dep]) {
            console.log(`✅ ${dep} - ${packageJson.dependencies[dep]}`);
        } else {
            console.log(`❌ ${dep} - MISSING`);
            allValid = false;
        }
    });
} catch (error) {
    console.log('❌ Error reading package.json:', error.message);
    allValid = false;
}

// Check Dockerfile content
console.log('\n🐳 Checking Dockerfile content...');
try {
    const dockerfile = fs.readFileSync('Dockerfile', 'utf8');
    const dockerfileChecks = [
        { check: 'Uses Node.js base image', test: /FROM node:18-alpine/i },
        { check: 'Copies emailService.js', test: /COPY emailService\.js/ },
        { check: 'Copies templates directory', test: /COPY templates/ },
        { check: 'Exposes port 3000', test: /EXPOSE 3000/ },
        { check: 'Sets NODE_ENV', test: /NODE_ENV=production/ }
    ];
    
    dockerfileChecks.forEach(({ check, test }) => {
        if (test.test(dockerfile)) {
            console.log(`✅ ${check}`);
        } else {
            console.log(`❌ ${check}`);
            allValid = false;
        }
    });
} catch (error) {
    console.log('❌ Error reading Dockerfile:', error.message);
    allValid = false;
}

// Check docker-compose.yml content
console.log('\n🐙 Checking docker-compose.yml content...');
try {
    const dockerCompose = fs.readFileSync('docker-compose.yml', 'utf8');
    const composeChecks = [
        { check: 'Has backend service', test: /backend:/ },
        { check: 'Has frontend service', test: /frontend:/ },
        { check: 'Has email environment variables', test: /SMTP_USER/ },
        { check: 'Has health checks', test: /healthcheck:/ },
        { check: 'Has volume mounts', test: /volumes:/ }
    ];
    
    composeChecks.forEach(({ check, test }) => {
        if (test.test(dockerCompose)) {
            console.log(`✅ ${check}`);
        } else {
            console.log(`❌ ${check}`);
            allValid = false;
        }
    });
} catch (error) {
    console.log('❌ Error reading docker-compose.yml:', error.message);
    allValid = false;
}

// Check email templates
console.log('\n📧 Checking email templates...');
const templateFiles = [
    'templates/userConfirmation.html',
    'templates/businessNotification.html'
];

templateFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - MISSING`);
        allValid = false;
    }
});

// Check .env.docker example
console.log('\n⚙️  Checking environment configuration...');
if (fs.existsSync('.env.docker')) {
    console.log('✅ .env.docker example file exists');
    
    try {
        const envExample = fs.readFileSync('.env.docker', 'utf8');
        const envChecks = [
            'SMTP_USER',
            'SMTP_PASS',
            'BUSINESS_EMAIL',
            'FROM_EMAIL',
            'ADMIN_USER',
            'ADMIN_PASSWORD'
        ];
        
        envChecks.forEach(envVar => {
            if (envExample.includes(envVar)) {
                console.log(`✅ ${envVar} documented`);
            } else {
                console.log(`❌ ${envVar} not documented`);
                allValid = false;
            }
        });
    } catch (error) {
        console.log('❌ Error reading .env.docker:', error.message);
        allValid = false;
    }
} else {
    console.log('❌ .env.docker example file missing');
    allValid = false;
}

// Final validation result
console.log('\n' + '='.repeat(50));
if (allValid) {
    console.log('🎉 Docker configuration is valid!');
    console.log('\n📝 Next steps:');
    console.log('1. Copy .env.docker to .env and configure your email settings');
    console.log('2. Run: docker-compose up -d');
    console.log('3. Test the contact form at http://localhost');
} else {
    console.log('❌ Docker configuration has issues that need to be fixed');
    console.log('\n📝 Please fix the missing files/configurations above');
}

console.log('\n🔗 For more information, see DOCKER_GUIDE.md');