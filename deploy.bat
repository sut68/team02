@echo off
REM Windows Deployment Script for SUT Alumni Connect

setlocal enabledelayedexpansion

echo.
echo ====== SUT Alumni Connect Deployment Script ======
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo Error: Docker is not installed or not in PATH
    pause
    exit /b 1
)

echo ^✓ Docker found
echo.

REM Check if .env file exists
if not exist .env (
    echo ^⚠ .env file not found
    echo Creating .env from .env.example...
    copy .env.example .env
    echo ^⚠ Please update .env with production values
    pause
    exit /b 1
)

echo ^✓ .env file found
echo.

echo Select deployment action:
echo 1) Build and start all services
echo 2) Start services (use existing images)
echo 3) Stop services
echo 4) View logs
echo 5) Run database migrations
echo 6) Restart specific service
echo 7) Full cleanup and rebuild
echo.

set /p choice="Enter choice (1-7): "

if "%choice%"=="1" (
    echo.
    echo Building and starting services...
    echo.
    docker-compose up -d --build
    echo.
    echo ^✓ Services started!
    timeout /t 3 /nobreak
    echo.
    echo Service Status:
    docker-compose ps
) else if "%choice%"=="2" (
    echo.
    echo Starting services...
    echo.
    docker-compose up -d
    echo.
    echo ^✓ Services started!
    timeout /t 3 /nobreak
    docker-compose ps
) else if "%choice%"=="3" (
    echo.
    echo Stopping services...
    echo.
    docker-compose down
    echo.
    echo ^✓ Services stopped!
) else if "%choice%"=="4" (
    echo.
    echo Showing logs (press Ctrl+C to exit):
    echo.
    docker-compose logs -f
) else if "%choice%"=="5" (
    echo.
    echo Running database migrations...
    echo.
    docker-compose exec api npx prisma migrate deploy
    echo.
    echo ^✓ Migrations completed!
) else if "%choice%"=="6" (
    set /p service="Enter service name (api/web/db): "
    echo.
    echo Restarting !service!...
    echo.
    docker-compose restart !service!
    echo ^✓ Service restarted!
) else if "%choice%"=="7" (
    echo.
    echo Full cleanup and rebuild...
    echo.
    docker-compose down -v
    docker-compose up -d --build
    timeout /t 5 /nobreak
    echo.
    echo ^✓ Full rebuild completed!
    docker-compose ps
) else (
    echo Invalid choice
    pause
    exit /b 1
)

echo.
echo ====== Deployment Complete ======
echo.
echo Useful commands:
echo   View logs:      docker-compose logs -f [service]
echo   Check status:   docker-compose ps
echo   SSH to container: docker-compose exec [service] sh
echo   View config:    docker-compose config
echo.
pause
