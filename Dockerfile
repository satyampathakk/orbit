# Dockerfile for Orbit Power Website with Email Service
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies and clean cache
RUN npm ci --only=production && \
    npm cache clean --force

# Create uploads directory in builder stage
RUN mkdir -p uploads

# Production stage - use distroless for minimal size and security
FROM gcr.io/distroless/nodejs18-debian11

WORKDIR /app

# Copy node_modules from builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/uploads ./uploads

# Copy application files
COPY server.js ./
COPY emailService.js ./

# Copy static assets and templates
COPY css/ ./css/
COPY js/ ./js/
COPY images/ ./images/
COPY video/ ./video/
COPY data/ ./data/
COPY templates/ ./templates/

# Copy HTML files
COPY index.html ./
COPY admin.html ./
COPY careers.html ./

# Expose port
EXPOSE 3000

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Health check to ensure the service is running
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD ["node", "-e", "require('http').get('http://localhost:3000/api/company', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"]

# Start the server (distroless uses direct CMD, no shell)
CMD ["server.js"]
