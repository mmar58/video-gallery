#!/bin/bash

# Stop on first error
set -e

echo "Pulling latest changes..."
git pull

echo "Starting parallel builds for frontend and backend..."

# Build frontend in the background
(
  echo "Building frontend..."
  cd frontend
  pnpm install
  pnpm run build
  echo "Frontend build completed."
) &
FRONTEND_PID=$!

# Build backend in the background
(
  echo "Building backend..."
  cd backend
  pnpm install
  pnpm run build
  echo "Backend build completed."
) &
BACKEND_PID=$!

# Wait for both processes to complete
wait $FRONTEND_PID
FRONTEND_STATUS=$?

wait $BACKEND_PID
BACKEND_STATUS=$?

# Check if either build failed
if [ $FRONTEND_STATUS -ne 0 ] || [ $BACKEND_STATUS -ne 0 ]; then
  echo "Error: Build failed. Deployment aborted."
  exit 1
fi

echo "Both builds completed successfully."

echo "Restarting PM2 ecosystem..."
pm2 restart ecosystem.config.js

echo "Deployment finished successfully!"
