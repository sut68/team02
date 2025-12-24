#!/usr/bin/env bash
set -euo pipefail

# Usage: ./push-image.sh <docker-username> <local-image> <remote-repo> [tag]
# Example: ./push-image.sh myuser next-app:latest myuser/next-app latest

DOCKER_USER=${1:-}
LOCAL_IMAGE=${2:-}
REMOTE_REPO=${3:-}
TAG=${4:-latest}

if [ -z "$DOCKER_USER" ] || [ -z "$LOCAL_IMAGE" ] || [ -z "$REMOTE_REPO" ]; then
  echo "Usage: $0 <docker-username> <local-image> <remote-repo> [tag]"
  echo "Example: $0 myuser next-app:latest myuser/next-app latest"
  exit 1
fi

# Ensure docker login
if ! docker info > /dev/null 2>&1; then
  echo "Docker does not appear to be running or you are not permitted to run docker. Start Docker and try again."
  exit 1
fi

# Tag local image
echo "Tagging $LOCAL_IMAGE -> $REMOTE_REPO:$TAG"
docker tag "$LOCAL_IMAGE" "$REMOTE_REPO:$TAG"

# Push
echo "Pushing $REMOTE_REPO:$TAG to Docker Hub"
docker push "$REMOTE_REPO:$TAG"

echo "Push complete: $REMOTE_REPO:$TAG"
