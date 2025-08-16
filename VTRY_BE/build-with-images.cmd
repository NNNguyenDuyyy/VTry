@echo off
REM VTRY Backend - Docker Build with Images Script
REM This script builds the Docker image including the upload/images folder

echo [INFO] Building Docker image with images...

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running. Please start Docker and try again.
    pause
    exit /b 1
)

REM Check if .env exists and load Docker Hub config
if exist .env (
    for /f "tokens=1,* delims==" %%a in (.env) do (
        set "%%a=%%b"
    )
) else (
    echo [WARNING] .env file not found. Using default values.
    set "DOCKER_USERNAME=your_username"
    set "DOCKER_IMAGE_NAME=vtry-backend"
    set "DOCKER_TAG=latest"
)

REM Set default values if not defined
if not defined DOCKER_USERNAME set "DOCKER_USERNAME=your_username"
if not defined DOCKER_IMAGE_NAME set "DOCKER_IMAGE_NAME=vtry-backend"
if not defined DOCKER_TAG set "DOCKER_TAG=latest"

echo [INFO] Building image: %DOCKER_USERNAME%/%DOCKER_IMAGE_NAME%:%DOCKER_TAG%
echo [INFO] Including upload/images folder in build...

REM Build the Docker image
docker build -t %DOCKER_USERNAME%/%DOCKER_IMAGE_NAME%:%DOCKER_TAG% .

if errorlevel 1 (
    echo [ERROR] Docker build failed!
    pause
    exit /b 1
)

echo [SUCCESS] Docker image built successfully!
echo [INFO] Image: %DOCKER_USERNAME%/%DOCKER_IMAGE_NAME%:%DOCKER_TAG%
echo.
echo [INFO] To push to Docker Hub, run:
echo [INFO] docker push %DOCKER_USERNAME%/%DOCKER_IMAGE_NAME%:%DOCKER_TAG%
echo.
echo [INFO] To run the container:
echo [INFO] docker run -p 4000:4000 %DOCKER_USERNAME%/%DOCKER_IMAGE_NAME%:%DOCKER_TAG%

pause 