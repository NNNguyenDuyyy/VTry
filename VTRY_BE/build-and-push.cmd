@echo off
REM VTRY Backend - Docker Build and Push Script
REM Usage: build-and-push.cmd [build|push|build-push]

setlocal enabledelayedexpansion

REM Colors for output (Windows 10+)
set "BLUE=[94m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "NC=[0m"

REM Function to print colored output
:print_status
echo %BLUE%[INFO]%NC% %~1
goto :eof

:print_success
echo %GREEN%[SUCCESS]%NC% %~1
goto :eof

:print_warning
echo %YELLOW%[WARNING]%NC% %~1
goto :eof

:print_error
echo %RED%[ERROR]%NC% %~1
goto :eof

REM Check if Docker is running
:check_docker
docker info >nul 2>&1
if errorlevel 1 (
    call :print_error "Docker is not running. Please start Docker and try again."
    exit /b 1
)
goto :eof

REM Check if .env file exists and load variables
:check_env
if not exist .env (
    call :print_warning ".env file not found. Creating from template..."
    if exist env.example (
        copy env.example .env >nul
        call :print_warning "Please edit .env file with your configuration before building."
        call :print_warning "Make sure to set DOCKER_USERNAME and DOCKER_IMAGE_NAME in .env"
        exit /b 1
    ) else (
        call :print_error "env.example not found. Please create .env file manually."
        exit /b 1
    )
)

REM Load environment variables
for /f "tokens=1,* delims==" %%a in (.env) do (
    set "%%a=%%b"
)
goto :eof

REM Build Docker image
:build_image
call :print_status "Building Docker image..."
call :print_status "Image: %DOCKER_USERNAME%/%DOCKER_IMAGE_NAME%:%DOCKER_TAG%"

docker build -t %DOCKER_USERNAME%/%DOCKER_IMAGE_NAME%:%DOCKER_TAG% .
if errorlevel 1 (
    call :print_error "Docker build failed!"
    exit /b 1
)

call :print_success "Docker image built successfully!"
call :print_status "Image: %DOCKER_USERNAME%/%DOCKER_IMAGE_NAME%:%DOCKER_TAG%"
goto :eof

REM Push Docker image to Docker Hub
:push_image
call :print_status "Pushing Docker image to Docker Hub..."

REM Check if user is logged in to Docker Hub
docker info | findstr "Username" >nul
if errorlevel 1 (
    call :print_warning "Not logged in to Docker Hub. Please run 'docker login' first."
    call :print_status "Command: docker login"
    exit /b 1
)

docker push %DOCKER_USERNAME%/%DOCKER_IMAGE_NAME%:%DOCKER_TAG%
if errorlevel 1 (
    call :print_error "Docker push failed!"
    exit /b 1
)

call :print_success "Docker image pushed successfully!"
call :print_status "Image: %DOCKER_USERNAME%/%DOCKER_IMAGE_NAME%:%DOCKER_TAG%"
goto :eof

REM Build and push in one command
:build_and_push
call :build_image
if errorlevel 1 exit /b 1

call :push_image
if errorlevel 1 exit /b 1

call :print_success "Build and push completed successfully!"
goto :eof

REM Show help
:show_help
echo VTRY Backend - Docker Build and Push Script
echo.
echo Usage: %~nx0 [COMMAND]
echo.
echo Commands:
echo   build        Build Docker image only
echo   push         Push existing image to Docker Hub
echo   build-push   Build and push image (recommended)
echo   help         Show this help message
echo.
echo Examples:
echo   %~nx0 build        # Build image only
echo   %~nx0 push         # Push existing image
echo   %~nx0 build-push   # Build and push
echo.
echo Required environment variables in .env:
echo   DOCKER_USERNAME=your_dockerhub_username
echo   DOCKER_IMAGE_NAME=vtry-backend
echo   DOCKER_TAG=latest
echo.
echo Note: Make sure you're logged in to Docker Hub with 'docker login'
goto :eof

REM Main script logic
if "%1"=="" goto :show_help

REM Load environment variables first
call :check_env
if errorlevel 1 exit /b 1

REM Check Docker is running
call :check_docker
if errorlevel 1 exit /b 1

REM Set default values if not in .env
if not defined DOCKER_USERNAME set "DOCKER_USERNAME=your_username"
if not defined DOCKER_IMAGE_NAME set "DOCKER_IMAGE_NAME=vtry-backend"
if not defined DOCKER_TAG set "DOCKER_TAG=latest"

REM Process command
if "%1"=="build" (
    call :build_image
) else if "%1"=="push" (
    call :push_image
) else if "%1"=="build-push" (
    call :build_and_push
) else if "%1"=="help" (
    call :show_help
) else (
    call :print_error "Unknown command: %1"
    echo.
    call :show_help
    exit /b 1
)

call :print_success "Operation completed successfully!" 