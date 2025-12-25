# Docker Deployment Guide - Orbit Power

This guide explains how to deploy the Orbit Power website using Docker and Docker Compose with Nginx serving the frontend and Node.js running the backend.

---

## 📋 Architecture

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
│  - Authentication                   │
│  - File uploads                     │
│  - Data management                  │
└─────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Docker Engine 20.10+
- Docker Compose 2.0+
- Git (optional)

### 1. Production Deployment

```bash
# Clone/navigate to project
cd orbit

# Build and start containers
docker-compose up -d

# View logs
docker-compose logs -f

# Access the website
# Frontend: http://localhost
# Admin: http://localhost/admin.html
```

### 2. Development Deployment

```bash
# Use development compose file
docker-compose -f docker-compose.dev.yml up -d

# Access the website
# Frontend: http://localhost:8080
# Backend API: http://localhost:3000
```

---

## 📦 Project Files

### Docker Files Created

| File | Purpose |
|------|---------|
| `Dockerfile` | Builds Node.js backend image |
| `docker-compose.yml` | Production orchestration |
| `docker-compose.dev.yml` | Development orchestration |
| `nginx.conf` | Nginx configuration |
| `.dockerignore` | Excludes files from Docker build |

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Admin credentials
ADMIN_USER=admin
ADMIN_PASSWORD=your-secure-password

# Optional: Change ports
# FRONTEND_PORT=80
# BACKEND_PORT=3000
```

### Customizing Ports

Edit `docker-compose.yml`:

```yaml
services:
  frontend:
    ports:
      - "8080:80"  # Change 8080 to your desired port
  
  backend:
    ports:
      - "3001:3000"  # Change 3001 to your desired port
```

---

## 🛠️ Docker Commands

### Starting Services

```bash
# Start all services in background
docker-compose up -d

# Start with build (if you made changes)
docker-compose up -d --build

# Start specific service
docker-compose up -d frontend
docker-compose up -d backend
```

### Stopping Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (deletes data!)
docker-compose down -v

# Stop specific service
docker-compose stop frontend
```

### Viewing Logs

```bash
# View all logs
docker-compose logs

# Follow logs in real-time
docker-compose logs -f

# View specific service logs
docker-compose logs frontend
docker-compose logs backend

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Rebuilding Containers

```bash
# Rebuild all images
docker-compose build

# Rebuild specific service
docker-compose build backend

# Rebuild and restart
docker-compose up -d --build
```

### Accessing Containers

```bash
# Execute command in backend container
docker-compose exec backend sh

# Execute command in frontend container
docker-compose exec frontend sh

# View running containers
docker-compose ps

# View resource usage
docker stats
```

---

## 📁 Volume Management

### Data Persistence

Docker volumes persist data across container restarts:

```yaml
volumes:
  - ./data:/app/data          # JSON data files
  - ./images:/app/images      # Images directory
  - ./uploads:/app/uploads    # User uploads
```

### Backup Data

```bash
# Backup data directory
docker-compose exec backend tar czf /tmp/backup.tar.gz /app/data /app/uploads
docker cp orbit-backend:/tmp/backup.tar.gz ./backup-$(date +%Y%m%d).tar.gz

# Or simply copy the directories
cp -r data data-backup-$(date +%Y%m%d)
cp -r uploads uploads-backup-$(date +%Y%m%d)
```

### Restore Data

```bash
# Extract backup
tar xzf backup-20251226.tar.gz

# Restart containers to pick up changes
docker-compose restart
```

---

## 🔍 Troubleshooting

### Container Won't Start

**Check logs:**
```bash
docker-compose logs backend
docker-compose logs frontend
```

**Common issues:**
- Port already in use: Change ports in `docker-compose.yml`
- Permission errors: Ensure directories are readable
- Missing `.env` file: Create from `.env.example`

### Connection Refused

**Check container status:**
```bash
docker-compose ps
```

**Check network:**
```bash
docker network ls
docker network inspect orbit_orbit-network
```

### Images Not Loading

**Verify volume mounts:**
```bash
docker-compose exec backend ls -la /app/images
docker-compose exec frontend ls -la /usr/share/nginx/html/images
```

### API Requests Failing

**Test backend directly:**
```bash
# From host
curl http://localhost:3000/api/services

# From frontend container
docker-compose exec frontend wget -O- http://backend:3000/api/services
```

### High Memory Usage

**Check container stats:**
```bash
docker stats

# Limit memory in docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
```

---

## 🚀 Production Deployment

### 1. Security Hardening

**Update `.env` with strong credentials:**
```env
ADMIN_USER=complex_username_here
ADMIN_PASSWORD=very_strong_password_123!@#
```

**Restrict CORS in `server.js`:**
```javascript
const corsOptions = {
  origin: 'https://yourdomain.com',
  credentials: true
};
app.use(cors(corsOptions));
```

### 2. HTTPS/SSL Setup

Create `nginx-ssl.conf`:
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    # ... rest of nginx.conf
}

server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

Update `docker-compose.yml`:
```yaml
frontend:
  volumes:
    - ./nginx-ssl.conf:/etc/nginx/conf.d/default.conf:ro
    - ./ssl:/etc/nginx/ssl:ro
  ports:
    - "80:80"
    - "443:443"
```

### 3. Use Docker Secrets

For sensitive data:
```bash
echo "mysecretpassword" | docker secret create admin_password -

# In docker-compose.yml (swarm mode)
secrets:
  admin_password:
    external: true
```

### 4. Monitoring

**Add healthchecks:**
Already configured in `docker-compose.yml`

**Check health status:**
```bash
docker-compose ps
docker inspect orbit-backend | grep Health
```

### 5. Auto-restart on Failure

Already configured:
```yaml
restart: unless-stopped
```

---

## 🔄 Updates & Maintenance

### Updating the Application

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Or rolling update (no downtime)
docker-compose up -d --no-deps --build backend
docker-compose up -d --no-deps --build frontend
```

### Updating Dependencies

```bash
# Update npm packages
npm update

# Rebuild backend image
docker-compose build backend
docker-compose up -d backend
```

### Cleaning Up

```bash
# Remove unused images
docker image prune

# Remove unused volumes (careful!)
docker volume prune

# Remove everything unused
docker system prune -a
```

---

## 📊 Scaling

### Horizontal Scaling

Scale backend instances:
```bash
docker-compose up -d --scale backend=3
```

Add load balancing in `nginx.conf`:
```nginx
upstream backend_servers {
    server backend:3000;
    # Add more backend servers
}

location /api/ {
    proxy_pass http://backend_servers;
}
```

---

## 🔗 Useful Commands Cheat Sheet

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Restart
docker-compose restart

# Rebuild
docker-compose up -d --build

# Logs
docker-compose logs -f

# Shell access
docker-compose exec backend sh

# Check status
docker-compose ps

# View resource usage
docker stats

# Clean up
docker system prune -a
```

---

## 📝 Notes

- **Development**: Use `docker-compose.dev.yml` with hot-reload enabled
- **Production**: Use `docker-compose.yml` for optimized production setup
- **Data**: All data persists in mounted volumes (survives container restarts)
- **Networking**: Containers communicate via internal `orbit-network`
- **Ports**: Frontend on 80, Backend on 3000 (customizable)

---

## 🆘 Getting Help

If you encounter issues:

1. Check logs: `docker-compose logs -f`
2. Verify containers are running: `docker-compose ps`
3. Check healthchecks: `docker inspect orbit-backend`
4. Review nginx config: `docker-compose exec frontend nginx -t`
5. Test backend directly: `curl http://localhost:3000/api/services`

For more information, see the main [README.md](README.md) and [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md).
