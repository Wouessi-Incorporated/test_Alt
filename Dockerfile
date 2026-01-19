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

# Set default port (can be overridden by environment variable)
ENV PORT=3000

# Expose port - uses PORT variable
EXPOSE 3000

# Health check - checks against dynamic port
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "const p = process.env.PORT || 3000; require('http').get('http://localhost:' + p, (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

# Start the application
CMD ["node", "start.js"]
