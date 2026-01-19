# ALTURA - Quick Start Guide

## Single Entry Point Setup

This project is now configured as a single-entry Node.js application with `package.json` as the main configuration file.

## Quick Start (3 steps)

### 1. Initial Setup
```bash
npm run setup
```
This will:
- Create `.env` file from template
- Guide you through configuration
- Set up Stripe, PayPal, Mailjet keys

### 2. Start the Server
```bash
npm start
```
Or directly:
```bash
npm run server
```

### 3. Open in Browser
```
http://localhost:8080
```

## Available Commands

```bash
npm start          # Start the server (recommended)
npm run server     # Alternative: start server directly
npm run setup      # Configure environment variables
npm run generate   # Generate static pages
npm run dev        # Setup + start (combined)
```

## Configuration

Edit `ALTURA_SERVER/server/.env` with your credentials:

- **Stripe**: Get test keys from [dashboard.stripe.com](https://dashboard.stripe.com)
- **PayPal**: Get sandbox keys from [developer.paypal.com](https://developer.paypal.com)
- **Mailjet**: Get keys from [app.mailjet.com](https://app.mailjet.com)

## Project Structure

```
altura/
 package.json              # Main entry point config
 start.js                  # Single entry script
 setup.js                  # Configuration wizard
 ALTURA_SERVER/
    server/
       server.js        # Node.js HTTP server
       .env.example     # Environment template
       .env             # Your config (auto-created)
    site/                # Static files & pages
 ALTURA_SITE/             # Site assets
 ALTURA_DOCS/             # Documentation
 ALTURA_ADDONS/           # Additional modules
```

## Features

 Bilingual (EN/FR) with auto-detection  
 Product catalog with 10+ hero items  
 Shopping cart (localStorage)  
 Stripe & PayPal checkout  
 Email via Mailjet  
 WhatsApp integration (optional)  
 Mobile-first responsive design  

## Troubleshooting

**Port already in use?**
```bash
npm start -- --port 3000
```

**Missing dependencies?**
All dependencies are built-in (no npm install needed - pure Node.js)

**Can't find .env?**
Run `npm run setup` to create it automatically.

## Support

For issues, check:
- `ALTURA_ADDONS/docs/PRODUCTION_HARDENING.md`
- `ALTURA_DOCS/README.md`
