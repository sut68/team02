@echo off
REM Usage: push-image.bat <docker-username> <local-image> <remote-repo> [tag]
REM Example: push-image.bat myuser next-app:latest myuser/next-app latest

if "%1"=="" (
  echo Usage: %~nx0 ^<docker-username^> ^<local-image^> ^<remote-repo^> [tag]
  exit /b 1
)
set DOCKER_USER=%1
set LOCAL_IMAGE=%2
set REMOTE_REPO=%3
set TAG=%4
if "%TAG%"=="" set TAG=latest

echo Tagging %LOCAL_IMAGE% -> %REMOTE_REPO%:%TAG%
docker tag %LOCAL_IMAGE% %REMOTE_REPO%:%TAG%

echo Pushing %REMOTE_REPO%:%TAG% to Docker Hub
docker push %REMOTE_REPO%:%TAG%

echo Push complete: %REMOTE_REPO%:%TAG%
