# Build stage - Full project
FROM node:18-alpine AS build
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY angular.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --silent

# Copy source code
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Build both frontend and backend
RUN npm run build

# Production stage
FROM node:18-alpine AS production
RUN apk add --no-cache dumb-init curl
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --production --silent && npm cache clean --force

# Copy built backend
COPY --from=build --chown=nodejs:nodejs /app/backend/dist ./backend/dist

# Copy built frontend
COPY --from=build --chown=nodejs:nodejs /app/dist/frontend ./public

# Create config directory for persistent storage
RUN mkdir -p /config && chown nodejs:nodejs /config

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT}/health || exit 1

# Start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "backend/dist/app.js"]