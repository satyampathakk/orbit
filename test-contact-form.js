/**
 * Simple test script to verify contact form functionality
 */

const https = require('https');
const http = require('http');

// Test data
const testData = {
    name: 'Test User',
    email: 'test@example.com',
    phone: '+1234567890',
    message: 'This is a test message from the contact form test script.'
};

// Make HTTP request
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const isHttps = urlObj.protocol === 'https:';
        const lib = isHttps ? https : http;
        
        const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port || (isHttps ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: options.headers || {}
        };
        
        const req = lib.request(requestOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({ 
                        ok: res.statusCode >= 200 && res.statusCode < 300, 
                        status: res.statusCode, 
                        data: jsonData 
                    });
                } catch (e) {
                    resolve({ 
                        ok: res.statusCode >= 200 && res.statusCode < 300, 
                        status: res.statusCode, 
                        data: data 
                    });
                }
            });
        });
        
        req.on('error', reject);
        
        if (options.body) {
            req.write(options.body);
        }
        
        req.end();
    });
}

async function testContactForm() {
    console.log('🧪 Testing Contact Form Functionality...\n');
    
    try {
        // Test server availability
        console.log('1. Checking server availability...');
        const healthCheck = await makeRequest('http://localhost:3000/api/company')
            .then(res => res.ok)
            .catch(() => false);
        
        if (!healthCheck) {
            console.log('❌ Server not running on localhost:3000');
            console.log('   Please start the server with: node server.js');
            return;
        }
        console.log('✅ Server is running');
        
        // Test contact form submission
        console.log('\n2. Testing contact form submission...');
        const response = await makeRequest('http://localhost:3000/api/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData)
        });
        
        console.log(`   Status: ${response.status}`);
        console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
        
        if (response.ok && response.data.success) {
            console.log('✅ Contact form submission successful!');
            console.log(`   User email sent: ${response.data.emailStatus?.userEmail || 'Unknown'}`);
            console.log(`   Business email sent: ${response.data.emailStatus?.businessEmail || 'Unknown'}`);
        } else {
            console.log('❌ Contact form submission failed');
            console.log(`   Error: ${response.data.error || response.data.message || 'Unknown error'}`);
        }
        
        // Test form validation
        console.log('\n3. Testing form validation...');
        const invalidData = { name: '', email: 'invalid-email', phone: '', message: '' };
        const validationResponse = await makeRequest('http://localhost:3000/api/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(invalidData)
        });
        
        console.log(`   Validation Status: ${validationResponse.status}`);
        if (validationResponse.status === 400) {
            console.log('✅ Form validation working correctly');
        } else {
            console.log('⚠️  Form validation may not be working as expected');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
    
    console.log('\n📝 Test completed. Check your email for test messages.');
}

// Run the test
testContactForm();