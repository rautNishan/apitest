FROM node:22.11-alpine AS builder

# Create app directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm@9.12.2 && \
    pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm run build

# Production stage
FROM node:22.11-alpine AS production

# Create app directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nodejs:nodejs /app/pnpm-lock.yaml ./pnpm-lock.yaml

# Copy built application and source files (needed for seed)
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/src ./src
COPY --from=builder --chown=nodejs:nodejs /app/tsconfig.json ./tsconfig.json

# Install pnpm and dependencies (including dev dependencies for ts-node)
RUN npm install -g pnpm@9.12.2 && \
    pnpm install --frozen-lockfile

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Start the application with migrations and seed
CMD npx typeorm --dataSource=dist/database/app.data-source.js migration:run && \
    node dist/database/seed/orders.seed.js && \
    node dist/database/seed/orders-massive.seed.js && \
    node dist/database/triggers/index.js && \
    node dist/app.js