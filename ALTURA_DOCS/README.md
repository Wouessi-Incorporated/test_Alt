# ALTURA.com — Proprietary Funnel Store (Turnkey v1)

This is a **no-Shopify**, self-hosted funnel store for **ALTURA**, built for **maximum conversion + trust**.

## Features (locked)
- Responsive, mobile-first UX
- Bilingual routing: `/en` and `/fr` (auto-detect at `/`)
- 10 hero products (p1–p10) with individual funnel pages
- Cart (localStorage) + high-trust checkout UI
- Multi-currency display: **EUR + USD** (toggle on pages)
- Payments: **Stripe** + **PayPal** (via direct HTTPS calls)
- Email: **Mailjet** (via direct HTTPS calls)
- WhatsApp: Cloud API endpoint stub (opt-in)
- Trust stack: SSL, encrypted payments, easy exchanges, tall-fit guarantee
- Inclusive tall models gallery integrated

## Folder structure
- `site/`  — static website (EN/FR pages, assets, JS)
- `server/` — pure Node.js server (static + API endpoints)

## Run locally
```bash
cd server
cp .env.example .env
# edit .env with real keys (Stripe/PayPal/Mailjet/WhatsApp)
node server.js
# open http://localhost:8080
```

## API Endpoints
- `POST /api/stripe/checkout-session`  create Stripe Checkout Session (redirect URL)
- `POST /api/paypal/create-order`      create PayPal Order (approve URL)
- `POST /api/order/record`             record order + trigger Mailjet transactional
- `POST /api/mailjet/send`             send any email
- `POST /api/whatsapp/send`            send WhatsApp message (opt-in required)

## Why this converts
1. **7-second clarity**: The homepage instantly states who ALTURA is for.
2. **One-product pages**: Every product has a dedicated funnel page that removes choice overload.
3. **Trust everywhere**: Trust blocks appear at decision points (product + cart + checkout).
4. **Low friction checkout**: Stripe + PayPal are presented as fast, familiar options.
5. **EUR + USD**: Users see pricing in their comfortable currency without mental math.

## Deployment (production)
- Put this behind NGINX with HTTPS
- Set `BASE_URL=https://altura.com`
- Use real Mailjet SPF/DKIM/DMARC on `mail.altura.com`

