# ALTURA - Node.js Funnel Store
# Lightweight, production-ready Docker image

FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package.json first for better caching
COPY package.json .

# Copy application files
COPY start.js .
COPY setup.js .
COPY ALTURA_SERVER ./ALTURA_SERVER
COPY ALTURA_DOCS ./ALTURA_DOCS
COPY ALTURA_SITE ./ALTURA_SITE
COPY ALTURA_ADDONS ./ALTURA_ADDONS

# Create data directory for persistence
RUN mkdir -p /app/ALTURA_SERVER/server/data

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

# Start the application
CMD ["node", "start.js"]
