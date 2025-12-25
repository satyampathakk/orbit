@echo off
REM Quick start script for Docker deployment (Windows)

echo Starting Orbit Power with Docker...
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo Docker is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo Docker Compose is not installed. Please install Docker Compose first.
    pause
    exit /b 1
)

REM Check if .env exists, create from example if not
if not exist .env (
    echo Creating .env file from .env.example...
    copy .env.example .env
    echo Please update .env with your credentials!
)

REM Build and start containers
echo Building and starting containers...
docker-compose up -d --build

REM Wait for containers to be healthy
echo Waiting for services to be ready...
timeout /t 5 /nobreak >nul

REM Check status
echo.
echo Container Status:
docker-compose ps

echo.
echo Deployment complete!
echo.
echo Access your application:
echo    Frontend: http://localhost
echo    Admin Panel: http://localhost/admin.html
echo    API: http://localhost:3000/api
echo.
echo Useful commands:
echo    View logs: docker-compose logs -f
echo    Stop: docker-compose down
echo    Restart: docker-compose restart
echo.
pause
