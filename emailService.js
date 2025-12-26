const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');

class EmailService {
  constructor() {
    this.transporter = null;
    this.config = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    };
    this.businessEmail = process.env.BUSINESS_EMAIL;
    this.fromEmail = process.env.FROM_EMAIL;
    this.fromName = process.env.FROM_NAME || 'Orbit Power';
  }

  /**
   * Initialize the SMTP transporter with configuration validation
   * @returns {Promise<boolean>} Success status of initialization
   */
  async initializeTransporter() {
    try {
      // Validate required configuration
      if (!this.validateEmailConfig()) {
        throw new Error('Invalid SMTP configuration');
      }

      // Create transporter
      this.transporter = nodemailer.createTransport(this.config);

      // Verify SMTP connection
      await this.verifyConnection();
      
      console.log('Email service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize email service:', error.message);
      this.transporter = null;
      return false;
    }
  }

  /**
   * Validate SMTP configuration from environment variables
   * @returns {boolean} True if configuration is valid
   */
  validateEmailConfig() {
    const requiredFields = [
      'SMTP_HOST',
      'SMTP_PORT', 
      'SMTP_USER',
      'SMTP_PASS',
      'BUSINESS_EMAIL',
      'FROM_EMAIL'
    ];

    const missingFields = requiredFields.filter(field => !process.env[field]);
    
    if (missingFields.length > 0) {
      console.error('Missing required SMTP configuration:', missingFields.join(', '));
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.businessEmail) || !emailRegex.test(this.fromEmail)) {
      console.error('Invalid email format in configuration');
      return false;
    }

    return true;
  }

  /**
   * Verify SMTP connection
   * @returns {Promise<void>}
   */
  async verifyConnection() {
    if (!this.transporter) {
      throw new Error('Transporter not initialized');
    }

    try {
      await this.transporter.verify();
      console.log('SMTP connection verified successfully');
    } catch (error) {
      console.error('SMTP connection verification failed:', error.message);
      throw new Error(`SMTP connection failed: ${error.message}`);
    }
  }

  /**
   * Check if email service is ready to send emails
   * @returns {boolean} True if service is ready
   */
  isReady() {
    return this.transporter !== null;
  }

  /**
   * Get transporter instance (for testing purposes)
   * @returns {Object|null} Nodemailer transporter instance
   */
  getTransporter() {
    return this.transporter;
  }

  /**
   * Handle connection failures with retry logic
   * @param {Function} operation - The operation to retry
   * @param {number} maxRetries - Maximum number of retry attempts
   * @returns {Promise<any>} Result of the operation
   */
  async handleConnectionFailure(operation, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        console.warn(`Email operation failed (attempt ${attempt}/${maxRetries}):`, error.message);
        
        if (attempt < maxRetries) {
          // Wait before retry (exponential backoff)
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Try to reinitialize transporter
          await this.initializeTransporter();
        }
      }
    }
    
    throw new Error(`Email operation failed after ${maxRetries} attempts: ${lastError.message}`);
  }

  /**
   * Generate user confirmation email template
   * @param {Object} formData - Contact form data
   * @returns {Object} Email template with subject and HTML content
   */
  generateUserConfirmationTemplate(formData) {
    const { name } = formData;
    
    const subject = 'Thank you for contacting Orbit Power';
    
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Contact Confirmation - Orbit Power</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container {
                background-color: #ffffff;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 3px solid #007bff;
            }
            .logo {
                font-size: 28px;
                font-weight: bold;
                color: #007bff;
                margin-bottom: 10px;
            }
            .content {
                margin-bottom: 30px;
            }
            .highlight {
                background-color: #e7f3ff;
                padding: 15px;
                border-left: 4px solid #007bff;
                margin: 20px 0;
            }
            .footer {
                text-align: center;
                padding-top: 20px;
                border-top: 1px solid #eee;
                color: #666;
                font-size: 14px;
            }
            .contact-info {
                margin-top: 20px;
                padding: 15px;
                background-color: #f8f9fa;
                border-radius: 5px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">ORBIT POWER</div>
                <p>Engineering Excellence in Motion</p>
            </div>
            
            <div class="content">
                <h2>Thank you for reaching out, ${name}!</h2>
                
                <p>We have successfully received your inquiry and appreciate you taking the time to contact Orbit Power.</p>
                
                <div class="highlight">
                    <strong>What happens next?</strong>
                    <ul>
                        <li>Our team will review your message within 24 hours</li>
                        <li>A specialist will contact you to discuss your requirements</li>
                        <li>We'll provide you with a detailed consultation and proposal</li>
                    </ul>
                </div>
                
                <p>At Orbit Power, we're committed to delivering innovative engineering solutions that exceed expectations. Whether you need mechanical design, electrical systems, or project management services, our experienced team is ready to help bring your vision to life.</p>
                
                <div class="contact-info">
                    <strong>Need immediate assistance?</strong><br>
                    Feel free to call us directly or visit our website for more information about our services.
                </div>
            </div>
            
            <div class="footer">
                <p>This is an automated confirmation email from Orbit Power.<br>
                Please do not reply to this email address.</p>
                <p>&copy; ${new Date().getFullYear()} Orbit Power. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>`;

    return { subject, html };
  }

  /**
   * Generate business notification email template
   * @param {Object} formData - Contact form data
   * @param {Object} metadata - Additional metadata (IP, user agent, etc.)
   * @returns {Object} Email template with subject and HTML content
   */
  async generateBusinessNotificationTemplate(formData, metadata = {}) {
    const { name, email, phone, message } = formData;
    
    // Generate timestamp
    const now = new Date();
    const submissionDate = now.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const submissionTime = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZoneName: 'short'
    });
    
    // Generate reference ID
    const referenceId = `ORB-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    
    // Determine priority level based on message content
    const urgentKeywords = ['urgent', 'emergency', 'asap', 'immediately', 'critical'];
    const isUrgent = urgentKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );
    const priorityLevel = isUrgent ? 'HIGH PRIORITY' : 'NORMAL';
    const priorityClass = isUrgent ? 'priority-high' : 'priority-normal';
    
    const subject = `🔔 New Contact Inquiry - ${name} [${referenceId}]`;
    
    try {
      // Read the HTML template file
      const templatePath = path.join(__dirname, 'templates', 'businessNotification.html');
      let html = await fs.readFile(templatePath, 'utf8');
      
      // Replace placeholders with actual data
      const replacements = {
        '{{customerName}}': name,
        '{{customerEmail}}': email,
        '{{customerPhone}}': phone,
        '{{customerMessage}}': message.replace(/\n/g, '<br>'),
        '{{submissionDate}}': submissionDate,
        '{{submissionTime}}': submissionTime,
        '{{referenceId}}': referenceId,
        '{{clientIP}}': metadata.clientIP || 'Not available',
        '{{userAgent}}': metadata.userAgent || 'Not available',
        '{{priorityLevel}}': priorityLevel,
        '{{priorityClass}}': priorityClass
      };
      
      // Replace all placeholders
      Object.entries(replacements).forEach(([placeholder, value]) => {
        html = html.replace(new RegExp(placeholder, 'g'), value);
      });
      
      return { subject, html };
    } catch (error) {
      console.error('Error reading business notification template:', error);
      
      // Fallback to inline template if file reading fails
      return this.generateFallbackBusinessTemplate(formData, metadata);
    }
  }

  /**
   * Fallback business notification template (inline)
   * @param {Object} formData - Contact form data
   * @param {Object} metadata - Additional metadata
   * @returns {Object} Email template with subject and HTML content
   */
  generateFallbackBusinessTemplate(formData, metadata = {}) {
    const { name, email, phone, message } = formData;
    const timestamp = new Date().toLocaleString();
    
    const subject = `New Contact Form Submission from ${name}`;
    
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Contact Form Submission</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container {
                background-color: #ffffff;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
            .header {
                background-color: #007bff;
                color: white;
                padding: 20px;
                margin: -30px -30px 30px -30px;
                border-radius: 10px 10px 0 0;
                text-align: center;
            }
            .field-group {
                margin-bottom: 20px;
                padding: 15px;
                background-color: #f8f9fa;
                border-radius: 5px;
                border-left: 4px solid #007bff;
            }
            .field-label {
                font-weight: bold;
                color: #007bff;
                margin-bottom: 5px;
            }
            .field-value {
                color: #333;
                word-wrap: break-word;
            }
            .message-field {
                background-color: #fff3cd;
                border-left-color: #ffc107;
            }
            .contact-highlight {
                background-color: #d4edda;
                border-left-color: #28a745;
            }
            .timestamp {
                text-align: center;
                color: #666;
                font-size: 14px;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
            }
            .urgent {
                background-color: #f8d7da;
                border: 1px solid #f5c6cb;
                color: #721c24;
                padding: 10px;
                border-radius: 5px;
                margin-bottom: 20px;
                text-align: center;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔔 New Contact Form Submission</h1>
                <p>Orbit Power Website</p>
            </div>
            
            <div class="urgent">
                <strong>⚡ Action Required:</strong> New customer inquiry received
            </div>
            
            <div class="field-group contact-highlight">
                <div class="field-label">👤 Customer Name:</div>
                <div class="field-value">${name}</div>
            </div>
            
            <div class="field-group contact-highlight">
                <div class="field-label">📧 Email Address:</div>
                <div class="field-value"><a href="mailto:${email}">${email}</a></div>
            </div>
            
            <div class="field-group contact-highlight">
                <div class="field-label">📞 Phone Number:</div>
                <div class="field-value"><a href="tel:${phone}">${phone}</a></div>
            </div>
            
            <div class="field-group message-field">
                <div class="field-label">💬 Message:</div>
                <div class="field-value">${message.replace(/\n/g, '<br>')}</div>
            </div>
            
            <div class="field-group">
                <div class="field-label">🌐 Source:</div>
                <div class="field-value">Website Contact Form</div>
            </div>
            
            <div class="timestamp">
                <strong>Received:</strong> ${timestamp}
            </div>
        </div>
    </body>
    </html>`;

    return { subject, html };
  }

  /**
   * Send contact form emails (both user confirmation and business notification)
   * @param {Object} formData - Contact form data
   * @param {Object} metadata - Additional metadata (IP, user agent, etc.)
   * @returns {Promise<Object>} Result of email sending operation
   */
  async sendContactEmail(formData, metadata = {}) {
    if (!this.isReady()) {
      throw new Error('Email service not initialized');
    }

    try {
      const results = await Promise.allSettled([
        this.sendUserConfirmation(formData),
        this.sendBusinessNotification(formData, metadata)
      ]);

      const userResult = results[0];
      const businessResult = results[1];

      return {
        success: true,
        userEmail: {
          success: userResult.status === 'fulfilled',
          error: userResult.status === 'rejected' ? userResult.reason.message : null
        },
        businessEmail: {
          success: businessResult.status === 'fulfilled',
          error: businessResult.status === 'rejected' ? businessResult.reason.message : null
        }
      };
    } catch (error) {
      console.error('Error sending contact emails:', error);
      throw error;
    }
  }

  /**
   * Send user confirmation email
   * @param {Object} formData - Contact form data
   * @returns {Promise<Object>} Email sending result
   */
  async sendUserConfirmation(formData) {
    const template = this.generateUserConfirmationTemplate(formData);
    
    const mailOptions = {
      from: `"${this.fromName}" <${this.fromEmail}>`,
      to: formData.email,
      subject: template.subject,
      html: template.html
    };

    return await this.handleConnectionFailure(async () => {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('User confirmation email sent:', result.messageId);
      return result;
    });
  }

  /**
   * Send business notification email
   * @param {Object} formData - Contact form data
   * @param {Object} metadata - Additional metadata (IP, user agent, etc.)
   * @returns {Promise<Object>} Email sending result
   */
  async sendBusinessNotification(formData, metadata = {}) {
    const template = await this.generateBusinessNotificationTemplate(formData, metadata);
    
    const mailOptions = {
      from: `"${this.fromName}" <${this.fromEmail}>`,
      to: this.businessEmail,
      subject: template.subject,
      html: template.html,
      replyTo: formData.email
    };

    return await this.handleConnectionFailure(async () => {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('Business notification email sent:', result.messageId);
      return result;
    });
  }
}

module.exports = EmailService;