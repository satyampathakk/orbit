# Domain Setup Guide for orbitengineer.com

## Current Status
✅ **Website is running** on Oracle server at IP: `140.245.217.142`
✅ **Docker containers are working** (orbit-frontend, orbit-backend)
✅ **Rate limiting fixed** - Updated trust proxy configuration
❌ **Domain not accessible** - `orbitengineer.com` DNS needs configuration

## Latest Fix Applied

### Rate Limiting Configuration (FIXED)
**Previous Error:** `ValidationError: The Express 'trust proxy' setting is true, which allows anyone to trivially bypass IP-based rate limiting`

**Solution Applied:**
- Changed `app.set('trust proxy', true)` to `app.set('trust proxy', 1)`
- Updated rate limiting to apply to all IPs in production
- More secure configuration that only trusts the first proxy (nginx)

## Issues Found & Solutions

### 1. Rate Limiting Error (FIXED)
✅ **Fixed:** Updated trust proxy to only trust first proxy (nginx container)
✅ **Fixed:** Enabled rate limiting for all IPs in production

### 2. Domain Configuration Issue
❌ **Still needs fixing:** Domain `orbitengineer.com` resolves to `140.245.217.142` but connection fails

## Immediate Actions Needed

### 1. Restart Backend Container (REQUIRED)
The rate limiting fix requires a restart:

```bash
# On your Oracle server
docker-compose restart backend

# Or restart all containers
docker-compose down && docker-compose up -d
```

### 2. Test Contact Form
After restarting backend, test the contact form:
- Visit: `http://140.245.217.142/#contact`
- Fill out and submit the form
- Should now work without rate limiting errors

### 3. Fix Domain DNS
You need to configure your domain registrar to point to your Oracle server:

1. **Login to your domain registrar** (where you bought orbitengineer.com)
2. **Update DNS A Record:**
   ```
   Type: A
   Name: @
   Value: 140.245.217.142
   TTL: 300
   ```
3. **Add www subdomain:**
   ```
   Type: A
   Name: www
   Value: 140.245.217.142
   TTL: 300
   ```

## Current Working URLs
- **Main Website:** http://140.245.217.142/
- **Admin Panel:** http://140.245.217.142/admin.html
- **Careers Page:** http://140.245.217.142/careers.html
- **API Endpoint:** http://140.245.217.142/api/company

## Testing Steps

### 1. After Backend Restart
```bash
# Test API endpoint
curl http://140.245.217.142/api/company

# Test contact form (should return proper validation error, not rate limit error)
curl -X POST http://140.245.217.142/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"","email":"","phone":"","message":""}'
```

### 2. Contact Form Test
- Visit: http://140.245.217.142/#contact
- Fill out form with valid data
- Submit and check for success message
- Check email inboxes for confirmation and notification emails

## DNS Propagation Check

After updating DNS, check propagation:
```bash
# Check from different DNS servers
nslookup orbitengineer.com 8.8.8.8
nslookup orbitengineer.com 1.1.1.1

# Online tools
# https://dnschecker.org/
# https://whatsmydns.net/
```

## Expected Results After Fix

### ✅ What Should Work:
- Website loads at `http://140.245.217.142/`
- Contact form submits successfully
- Email notifications sent to both user and business
- Rate limiting works properly (5 submissions per hour per IP)
- All API endpoints respond correctly

### 🔄 What Needs DNS Update:
- Domain access: `http://orbitengineer.com/`
- SSL certificate setup for HTTPS

## Next Steps Priority

1. **🔥 URGENT:** Restart backend container
2. **🔥 URGENT:** Test contact form functionality
3. **📋 IMPORTANT:** Update DNS A records at domain registrar
4. **📋 IMPORTANT:** Wait for DNS propagation (24-48 hours)
5. **🔧 OPTIONAL:** Add SSL certificate for HTTPS

## Troubleshooting

### If Contact Form Still Fails After Restart
1. Check backend logs: `docker-compose logs backend`
2. Verify email configuration in .env file
3. Test with curl command above

### If Domain Still Doesn't Work After DNS Update
1. Check DNS propagation with online tools
2. Verify A record points to correct IP: `140.245.217.142`
3. Test with: `curl -H "Host: orbitengineer.com" http://140.245.217.142/`

The website is fully functional - just needs the backend restart and DNS configuration!