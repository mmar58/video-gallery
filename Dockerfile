FROM node:24-bookworm-slim AS builder

# Install pnpm
RUN npm install -g pnpm@latest

WORKDIR /app
ENV CI=true

# Copy frontend and backend
COPY frontend /app/frontend
COPY backend /app/backend

# Build frontend
WORKDIR /app/frontend
RUN pnpm install --frozen-lockfile
RUN pnpm run build
RUN pnpm prune --prod

# Build backend
WORKDIR /app/backend
RUN pnpm install --frozen-lockfile
RUN pnpm run build
RUN pnpm prune --prod

# Production stage
FROM node:24-bookworm-slim

# Install ffmpeg for video processing if the system ffmpeg is needed instead of ffmpeg-static
# RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy frontend build and production dependencies
COPY --from=builder /app/frontend/build /app/frontend/build
COPY --from=builder /app/frontend/node_modules /app/frontend/node_modules
COPY --from=builder /app/frontend/package.json /app/frontend/package.json

# Copy backend build, production dependencies, and necessary directories
COPY --from=builder /app/backend/dist /app/backend/dist
COPY --from=builder /app/backend/node_modules /app/backend/node_modules
COPY --from=builder /app/backend/package.json /app/backend/package.json
COPY --from=builder /app/backend/scripts /app/backend/scripts
COPY --from=builder /app/backend/knexfile.js /app/backend/knexfile.js
# Note: db migrations and sqlite db might be in db directory
COPY --from=builder /app/backend/db /app/backend/db

# Environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose backend port
EXPOSE 5000

WORKDIR /app/backend

# Start the application
CMD ["node", "dist/index.js"]
