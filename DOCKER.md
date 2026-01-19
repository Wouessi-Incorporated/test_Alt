# ALTURA Docker Deployment Guide

## Quick Start (Local)

### Build and Run with Docker Compose
```bash
docker-compose up --build
```

Server runs on: `http://localhost:8080`

### Run without Docker Compose
```bash
docker build -t altura .
docker run -p 8080:8080 \
  -e STRIPE_SECRET_KEY=sk_test_... \
  -e PAYPAL_CLIENT_ID=... \
  -e MJ_APIKEY_PUBLIC=... \
  altura
```

## Docker Configuration

### Files
- **Dockerfile** - Multi-stage production-ready image
- **docker-compose.yml** - Local development setup
- **docker-compose.prod.yml** - Production setup for Coolify
- **.dockerignore** - Optimized image size

### Image Details
- **Base:** `node:22-alpine` (minimal, ~150MB)
- **Port:** 8080
- **Health Check:** Built-in HTTP health check
- **Data Volume:** `/app/ALTURA_SERVER/server/data`

## Environment Variables

### Required for Production
```bash
STRIPE_SECRET_KEY=sk_test_...
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
MJ_APIKEY_PUBLIC=...
MJ_APIKEY_PRIVATE=...
BASE_URL=https://your-domain.com
```

### Optional
```bash
FX_EURUSD=1.10
MJ_SENDER_EMAIL=no-reply@altura.com
MJ_SENDER_NAME=ALTURA
WA_TOKEN=...
WA_PHONE_NUMBER_ID=...
```

## Production Deployment (Coolify)

1. **Push to Repository**
   ```bash
   git push origin main
   ```

2. **Set Environment Variables in Coolify**
   - Add all required variables (see above)

3. **Deploy**
   - Coolify will detect `Dockerfile` and deploy automatically
   - Image will use `node:22-alpine` base
   - Runs on exposed port 8080

4. **Health Checks**
   - Container health check is built-in
   - Coolify will monitor HTTP status

## Docker Commands

### Build
```bash
docker build -t altura:latest .
```

### Run
```bash
docker run -d -p 8080:8080 \
  --name altura \
  --restart unless-stopped \
  -e PORT=8080 \
  -e STRIPE_SECRET_KEY=sk_test_... \
  altura:latest
```

### Compose (Development)
```bash
docker-compose up -d          # Start
docker-compose logs -f        # View logs
docker-compose stop           # Stop
docker-compose down           # Remove
```

### Compose (Production)
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Inspect
```bash
docker ps                      # List running containers
docker logs altura-store       # View logs
docker exec -it altura-store bash   # Shell access
```

## Volume Management

### Local Development
```bash
docker-compose up
# Data is stored in: ./ALTURA_SERVER/server/data
```

### Production (Coolify)
```bash
# Named volume: altura-data
docker volume ls
docker volume inspect altura-data
```

## Performance

- **Image Size:** ~450MB (with Node.js + dependencies)
- **Memory:** ~50-100MB runtime
- **Cold Start:** ~2-3 seconds
- **Health Check:** Every 30 seconds

## Troubleshooting

### Port already in use
```bash
docker run -p 3000:8080 altura  # Map to different port
```

### Container exits immediately
```bash
docker logs altura-store
# Check for missing environment variables
```

### Rebuild image
```bash
docker-compose up --build
```

### Clean everything
```bash
docker-compose down -v          # Remove volumes
docker system prune             # Remove unused images
```

## Security Notes

-  No credentials in Dockerfile
-  Alpine image (minimal attack surface)
-  Non-root user recommended
-  Health check enabled
-  Environment variables for secrets

## Multi-Stage Build (Future Optimization)

For production, consider:
```dockerfile
FROM node:22-alpine AS builder
# Copy and build

FROM node:22-alpine AS runtime
# Copy only necessary files
```

Current single-stage is fine for Node.js applications with no build step.
