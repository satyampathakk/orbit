# 🚀 Quick Start - Orbit Power Docker Deployment

## Option 1: Easy Start (Recommended)

### Windows
```cmd
docker-start.bat
```

### Linux/Mac
```bash
chmod +x docker-start.sh
./docker-start.sh
```

---

## Option 2: Manual Start

```bash
# 1. Start containers
docker-compose up -d

# 2. Access the website
# → Frontend: http://localhost
# → Admin: http://localhost/admin.html
```

---

## 📊 What Gets Deployed?

```
┌──────────────────────────────┐
│   Your Computer (Port 80)    │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│   Nginx (Frontend)           │
│   - HTML/CSS/JS files        │
│   - Proxies API requests     │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│   Node.js (Backend)          │
│   - REST API                 │
│   - File uploads             │
│   - Authentication           │
└──────────────────────────────┘
```

---

## 🛠️ Common Commands

| Task | Command |
|------|---------|
| **Start** | `docker-compose up -d` |
| **Stop** | `docker-compose down` |
| **View logs** | `docker-compose logs -f` |
| **Restart** | `docker-compose restart` |
| **Rebuild** | `docker-compose up -d --build` |
| **Check status** | `docker-compose ps` |

---

## 📁 Files Created

✅ `Dockerfile` - Backend container definition  
✅ `docker-compose.yml` - Production setup  
✅ `docker-compose.dev.yml` - Development setup  
✅ `nginx.conf` - Nginx web server config  
✅ `.dockerignore` - Exclude files from build  
✅ `DOCKER_GUIDE.md` - Complete documentation  
✅ `docker-start.bat` - Windows quick start  
✅ `docker-start.sh` - Linux/Mac quick start  

---

## 🔧 Configuration

**Admin credentials:** Edit `.env` file
```env
ADMIN_USER=admin
ADMIN_PASSWORD=your-secure-password
```

**Change ports:** Edit `docker-compose.yml`
```yaml
frontend:
  ports:
    - "8080:80"  # Change 8080 to desired port
```

---

## 🐛 Troubleshooting

### Port Already in Use?
Change ports in `docker-compose.yml`:
```yaml
ports:
  - "8080:80"  # Use different port
```

### Containers Not Starting?
```bash
# Check logs
docker-compose logs -f

# Check status
docker-compose ps
```

### Need Fresh Start?
```bash
# Stop and remove everything
docker-compose down

# Rebuild from scratch
docker-compose up -d --build
```

---

## 📖 Need More Help?

- **Docker details**: [DOCKER_GUIDE.md](DOCKER_GUIDE.md)
- **Development**: [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)
- **General info**: [README.md](README.md)

---

## ✅ Success!

If everything worked, you should see:
- ✅ Containers running: `docker-compose ps`
- ✅ Website accessible: http://localhost
- ✅ Admin panel: http://localhost/admin.html
- ✅ API working: http://localhost/api/services

**Default credentials:** admin / admin (change in `.env`!)

---

**That's it! You're running with Docker! 🎉**
