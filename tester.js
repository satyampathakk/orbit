/**
 * End-to-End Email Flow Testing Script
 * Tests the complete contact form email functionality
 */

require('dotenv').config();
const EmailService = require('./emailService');
const https = require('https');
const http = require('http');

// Test configuration
const TEST_CONFIG = {
    serverUrl: 'http://localhost:3000',
    testEmail: 'test@example.com',
    testData: {
        name: 'John Doe Test',
        email: 'test@example.com',
        phone: '+1234567890',
        message: 'This is a test message for the email flow validation. Testing complete functionality including both user confirmation and business notification emails.'
    }
};

class EmailFlowTester {
    constructor() {
        this.emailService = new EmailService();
        this.testResults = {
            emailServiceInit: false,
            userConfirmationEmail: false,
            businessNotificationEmail: false,
            apiEndpoint: false,
            emailContent: false,
            errorHandling: false
        };
    }

    /**
     * Make HTTP request (replacement for fetch)
     */
    makeRequest(url, options = {}) {
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
                        resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, json: () => Promise.resolve(jsonData) });
                    } catch (e) {
                        resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, text: () => Promise.resolve(data) });
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

    /**
     * Make HTTP request (replacement for fetch)
     */
    makeRequest(url, options = {}) {
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
                        resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, json: () => Promise.resolve(jsonData) });
                    } catch (e) {
                        resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, text: () => Promise.resolve(data) });
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
    async runAllTests() {
        console.log('🧪 Starting Email Flow End-to-End Testing...\n');
        
        try {
            // Test 1: Email Service Initialization
            await this.testEmailServiceInitialization();
            
            // Test 2: Email Template Generation
            await this.testEmailTemplateGeneration();
            
            // Test 3: Individual Email Sending
            await this.testIndividualEmailSending();
            
            // Test 4: Complete Contact Email Flow
            await this.testCompleteContactEmailFlow();
            
            // Test 5: API Endpoint Integration
            await this.testAPIEndpointIntegration();
            
            // Test 6: Email Content Validation
            await this.testEmailContentValidation();
            
            // Generate test report
            this.generateTestReport();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error);
        }
    }

    /**
     * Test email service initialization
     */
    async testEmailServiceInitialization() {
        console.log('📧 Testing Email Service Initialization...');
        
        try {
            const initialized = await this.emailService.initializeTransporter();
            
            if (initialized && this.emailService.isReady()) {
                console.log('✅ Email service initialized successfully');
                console.log('✅ SMTP connection verified');
                this.testResults.emailServiceInit = true;
            } else {
                console.log('❌ Email service initialization failed');
                console.log('   - Check SMTP configuration in .env file');
                console.log('   - Verify network connectivity');
            }
        } catch (error) {
            console.log('❌ Email service initialization error:', error.message);
        }
        
        console.log('');
    }

    /**
     * Test email template generation
     */
    async testEmailTemplateGeneration() {
        console.log('📝 Testing Email Template Generation...');
        
        try {
            // Test user confirmation template
            const userTemplate = this.emailService.generateUserConfirmationTemplate(TEST_CONFIG.testData);
            
            if (userTemplate && userTemplate.subject && userTemplate.html) {
                console.log('✅ User confirmation template generated');
                console.log(`   Subject: ${userTemplate.subject}`);
            } else {
                console.log('❌ User confirmation template generation failed');
            }
            
            // Test business notification template
            const businessTemplate = await this.emailService.generateBusinessNotificationTemplate(
                TEST_CONFIG.testData,
                { clientIP: '127.0.0.1', userAgent: 'Test Agent' }
            );
            
            if (businessTemplate && businessTemplate.subject && businessTemplate.html) {
                console.log('✅ Business notification template generated');
                console.log(`   Subject: ${businessTemplate.subject}`);
                this.testResults.emailContent = true;
            } else {
                console.log('❌ Business notification template generation failed');
            }
            
        } catch (error) {
            console.log('❌ Template generation error:', error.message);
        }
        
        console.log('');
    }

    /**
     * Test individual email sending functions
     */
    async testIndividualEmailSending() {
        console.log('📤 Testing Individual Email Sending...');
        
        if (!this.emailService.isReady()) {
            console.log('❌ Email service not ready, skipping email sending tests');
            console.log('');
            return;
        }
        
        try {
            // Test user confirmation email
            console.log('   Testing user confirmation email...');
            const userResult = await this.emailService.sendUserConfirmation(TEST_CONFIG.testData);
            
            if (userResult && userResult.messageId) {
                console.log('✅ User confirmation email sent successfully');
                console.log(`   Message ID: ${userResult.messageId}`);
                this.testResults.userConfirmationEmail = true;
            } else {
                console.log('❌ User confirmation email failed');
            }
            
            // Wait a moment between emails
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Test business notification email
            console.log('   Testing business notification email...');
            const businessResult = await this.emailService.sendBusinessNotification(
                TEST_CONFIG.testData,
                { clientIP: '127.0.0.1', userAgent: 'Test Agent' }
            );
            
            if (businessResult && businessResult.messageId) {
                console.log('✅ Business notification email sent successfully');
                console.log(`   Message ID: ${businessResult.messageId}`);
                this.testResults.businessNotificationEmail = true;
            } else {
                console.log('❌ Business notification email failed');
            }
            
        } catch (error) {
            console.log('❌ Individual email sending error:', error.message);
        }
        
        console.log('');
    }

    /**
     * Test complete contact email flow
     */
    async testCompleteContactEmailFlow() {
        console.log('🔄 Testing Complete Contact Email Flow...');
        
        if (!this.emailService.isReady()) {
            console.log('❌ Email service not ready, skipping complete flow test');
            console.log('');
            return;
        }
        
        try {
            const result = await this.emailService.sendContactEmail(
                TEST_CONFIG.testData,
                { clientIP: '127.0.0.1', userAgent: 'Test Agent' }
            );
            
            console.log('📊 Complete flow results:');
            console.log(`   Overall success: ${result.success}`);
            console.log(`   User email success: ${result.userEmail.success}`);
            console.log(`   Business email success: ${result.businessEmail.success}`);
            
            if (result.userEmail.error) {
                console.log(`   User email error: ${result.userEmail.error}`);
            }
            
            if (result.businessEmail.error) {
                console.log(`   Business email error: ${result.businessEmail.error}`);
            }
            
            if (result.success && result.userEmail.success && result.businessEmail.success) {
                console.log('✅ Complete contact email flow successful');
            } else {
                console.log('⚠️  Complete contact email flow partially successful');
            }
            
        } catch (error) {
            console.log('❌ Complete contact email flow error:', error.message);
        }
        
        console.log('');
    }

    /**
     * Test API endpoint integration
     */
    async testAPIEndpointIntegration() {
        console.log('🌐 Testing API Endpoint Integration...');
        
        try {
            // Check if server is running
            const healthCheck = await this.makeRequest(`${TEST_CONFIG.serverUrl}/api/company`)
                .then(res => res.ok)
                .catch(() => false);
            
            if (!healthCheck) {
                console.log('❌ Server not running on localhost:3000');
                console.log('   Please start the server with: node server.js');
                console.log('');
                return;
            }
            
            // Test contact form API endpoint
            const response = await this.makeRequest(`${TEST_CONFIG.serverUrl}/api/contact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(TEST_CONFIG.testData)
            });
            
            const result = await response.json();
            
            console.log(`   Response status: ${response.status}`);
            console.log(`   Response success: ${result.success}`);
            console.log(`   Response message: ${result.message}`);
            
            if (result.emailStatus) {
                console.log(`   User email sent: ${result.emailStatus.userEmail}`);
                console.log(`   Business email sent: ${result.emailStatus.businessEmail}`);
            }
            
            if (response.ok && result.success) {
                console.log('✅ API endpoint integration successful');
                this.testResults.apiEndpoint = true;
            } else {
                console.log('❌ API endpoint integration failed');
                console.log(`   Error: ${result.error || 'Unknown error'}`);
            }
            
        } catch (error) {
            console.log('❌ API endpoint integration error:', error.message);
        }
        
        console.log('');
    }

    /**
     * Test email content validation
     */
    async testEmailContentValidation() {
        console.log('🔍 Testing Email Content Validation...');
        
        try {
            // Test user confirmation template content
            const userTemplate = this.emailService.generateUserConfirmationTemplate(TEST_CONFIG.testData);
            
            const userContentChecks = [
                { check: 'Contains customer name', pass: userTemplate.html.includes(TEST_CONFIG.testData.name) },
                { check: 'Contains company branding', pass: userTemplate.html.includes('ORBIT POWER') },
                { check: 'Contains next steps', pass: userTemplate.html.includes('What happens next') },
                { check: 'Contains contact information', pass: userTemplate.html.includes('orbitenginer@gmail.com') || userTemplate.html.includes('contact us') },
                { check: 'Is valid HTML', pass: userTemplate.html.includes('<!DOCTYPE html>') }
            ];
            
            console.log('   User Confirmation Email Content:');
            userContentChecks.forEach(({ check, pass }) => {
                console.log(`   ${pass ? '✅' : '❌'} ${check}`);
            });
            
            // Test business notification template content
            const businessTemplate = await this.emailService.generateBusinessNotificationTemplate(
                TEST_CONFIG.testData,
                { clientIP: '127.0.0.1', userAgent: 'Test Agent' }
            );
            
            const businessContentChecks = [
                { check: 'Contains customer name', pass: businessTemplate.html.includes(TEST_CONFIG.testData.name) },
                { check: 'Contains customer email', pass: businessTemplate.html.includes(TEST_CONFIG.testData.email) },
                { check: 'Contains customer phone', pass: businessTemplate.html.includes(TEST_CONFIG.testData.phone) },
                { check: 'Contains customer message', pass: businessTemplate.html.includes(TEST_CONFIG.testData.message) },
                { check: 'Contains timestamp', pass: businessTemplate.html.includes('Received on:') },
                { check: 'Contains reference ID', pass: businessTemplate.html.includes('ORB-') },
                { check: 'Is valid HTML', pass: businessTemplate.html.includes('<!DOCTYPE html>') }
            ];
            
            console.log('   Business Notification Email Content:');
            businessContentChecks.forEach(({ check, pass }) => {
                console.log(`   ${pass ? '✅' : '❌'} ${check}`);
            });
            
            const allUserChecks = userContentChecks.every(c => c.pass);
            const allBusinessChecks = businessContentChecks.every(c => c.pass);
            
            if (allUserChecks && allBusinessChecks) {
                console.log('✅ Email content validation successful');
                this.testResults.emailContent = true;
            } else {
                console.log('❌ Email content validation failed');
            }
            
        } catch (error) {
            console.log('❌ Email content validation error:', error.message);
        }
        
        console.log('');
    }

    /**
     * Generate comprehensive test report
     */
    generateTestReport() {
        console.log('📋 TEST REPORT');
        console.log('='.repeat(50));
        
        const tests = [
            { name: 'Email Service Initialization', result: this.testResults.emailServiceInit },
            { name: 'User Confirmation Email', result: this.testResults.userConfirmationEmail },
            { name: 'Business Notification Email', result: this.testResults.businessNotificationEmail },
            { name: 'API Endpoint Integration', result: this.testResults.apiEndpoint },
            { name: 'Email Content Validation', result: this.testResults.emailContent }
        ];
        
        tests.forEach(({ name, result }) => {
            console.log(`${result ? '✅' : '❌'} ${name}`);
        });
        
        const passedTests = tests.filter(t => t.result).length;
        const totalTests = tests.length;
        
        console.log('='.repeat(50));
        console.log(`📊 Results: ${passedTests}/${totalTests} tests passed`);
        
        if (passedTests === totalTests) {
            console.log('🎉 All tests passed! Email flow is working correctly.');
        } else {
            console.log('⚠️  Some tests failed. Please check the configuration and try again.');
        }
        
        console.log('\n📝 Next Steps:');
        console.log('1. Check your email inbox for test emails');
        console.log('2. Verify email formatting and content');
        console.log('3. Test the contact form on the website');
        console.log('4. Monitor email delivery in production');
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const tester = new EmailFlowTester();
    tester.runAllTests().catch(console.error);
}

module.exports = EmailFlowTester;