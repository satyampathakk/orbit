# Docker Setup Guide for Orbit Power Website

This guide explains how to run the Orbit Power website using Docker with full email service functionality.

## Prerequisites

- Docker and Docker Compose installed
- Email service credentials (Gmail app password recommended)

## Quick Start

1. **Clone and Setup Environment**
   ```bash
   git clone <repository-url>
   cd orbit-power-website
   cp .env.docker .env
   ```

2. **Configure Email Service**
   Edit `.env` file with your email credentials:
   ```env
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   BUSINESS_EMAIL=your-business@gmail.com
   FROM_EMAIL=your-email@gmail.com
   ```

3. **Run Production Setup**
   ```bash
   docker-compose up -d
   ```

4. **Access the Application**
   - Website: http://localhost
   - Admin Panel: http://localhost/admin.html
   - API: http://localhost:3000/api

## Email Service Configuration

### Gmail Setup (Recommended)
1. Enable 2-factor authentication on your Gmail account
2. Generate an app password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. Use the app password in `SMTP_PASS` (not your regular password)

### Other Email Providers
Update SMTP settings in `.env`:
```env
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_SECURE=false
```

## Development Mode

For development with hot reload:
```bash
docker-compose -f docker-compose.dev.yml up -d
```
- Website: http://localhost:8080
- API: http://localhost:3000

## Environment Variables

### Required for Email Service
- `SMTP_USER`: Email address for sending emails
- `SMTP_PASS`: Email password or app password
- `BUSINESS_EMAIL`: Email to receive contact form submissions
- `FROM_EMAIL`: Email address shown as sender

### Optional Email Settings
- `SMTP_HOST`: SMTP server (default: smtp.gmail.com)
- `SMTP_PORT`: SMTP port (default: 587)
- `SMTP_SECURE`: Use SSL/TLS (default: false)
- `FROM_NAME`: Sender name (default: Orbit Power)

### Application Settings
- `ADMIN_USER`: Admin panel username
- `ADMIN_PASSWORD`: Admin panel password
- `AUTH_SECRET`: JWT secret for authentication
- `PORT`: Server port (default: 3000)

## Testing Email Service

1. **Test Contact Form**
   - Visit http://localhost/index.html#contact
   - Fill out and submit the contact form
   - Check both user and business email inboxes

2. **API Test**
   ```bash
   curl -X POST http://localhost:3000/api/contact \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test User",
       "email": "test@example.com",
       "phone": "+1234567890",
       "message": "Test message"
     }'
   ```

## Docker Commands

### Production
```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

### Development
```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# View backend logs
docker-compose -f docker-compose.dev.yml logs -f backend

# Stop development environment
docker-compose -f docker-compose.dev.yml down
```

## Troubleshooting

### Email Service Issues
1. **Authentication Failed**
   - Verify SMTP credentials
   - For Gmail, ensure app password is used
   - Check 2-factor authentication is enabled

2. **Connection Timeout**
   - Verify SMTP_HOST and SMTP_PORT
   - Check firewall settings
   - Ensure network connectivity

3. **Rate Limiting**
   - Contact form has rate limiting (5 submissions per hour per IP)
   - For testing, rate limiting is disabled for localhost

### Container Issues
1. **Port Already in Use**
   ```bash
   # Check what's using the port
   netstat -tulpn | grep :80
   netstat -tulpn | grep :3000
   
   # Stop conflicting services
   sudo systemctl stop apache2  # or nginx
   ```

2. **Permission Issues**
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER ./data ./uploads ./images
   ```

## Health Checks

The application includes health checks:
- Backend: Checks API endpoint availability
- Frontend: Checks Nginx server status

View health status:
```bash
docker-compose ps
```

## Data Persistence

The following directories are persisted:
- `./data`: Application data (JSON files)
- `./uploads`: User uploaded files
- `./images`: Static images

## Security Notes

1. **Environment Variables**
   - Never commit `.env` file to version control
   - Use strong passwords for admin access
   - Rotate email passwords regularly

2. **Production Deployment**
   - Use HTTPS in production
   - Configure proper firewall rules
   - Regular security updates

## Architecture

```
┌─────────────────────────────────────┐
│         Client Browser              │
└───────────────┬─────────────────────┘
                │ HTTP (Port 80)
                ▼
┌─────────────────────────────────────┐
│    Nginx Container (Frontend)       │
│  - Serves static files              │
│  - Proxies /api/* to backend        │
│  - Handles caching & compression    │
└───────────────┬─────────────────────┘
                │ Internal network
                ▼
┌─────────────────────────────────────┐
│   Node.js Container (Backend)       │
│  - REST API server                  │
│  - Email service integration        │
│  - Contact form processing          │
│  - Authentication & file uploads    │
└─────────────────────────────────────┘
```

## Support

For issues or questions:
1. Check the logs: `docker-compose logs -f`
2. Verify environment configuration
3. Test email service separately
4. Check network connectivity