#!/bin/bash

# Stop on first error
set -e

# Build frontend in the background
(cd frontend && pnpm build) &
FRONTEND_PID=$!

# Build backend in the background
(cd backend && pnpm build) &
BACKEND_PID=$!

# Wait for both builds to finish
wait $FRONTEND_PID
wait $BACKEND_PID

pm2 reload video_service;