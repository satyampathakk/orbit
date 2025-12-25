# Dockerfile for Node.js Backend - Ultra-minimal using distroless
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./

# Install dependencies and clean cache
RUN npm ci --only=production && \
    npm cache clean --force

# Production stage - use distroless for minimal size
FROM gcr.io/distroless/nodejs18-debian11

WORKDIR /app

# Copy only node_modules and application code from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY server.js ./

EXPOSE 3000

ENV NODE_ENV=production

# Start the server (distroless uses direct CMD, no shell)
CMD ["server.js"]
