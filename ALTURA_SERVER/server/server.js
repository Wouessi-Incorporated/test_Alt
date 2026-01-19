/**
 * ALTURA Proprietary Funnel Store — Pure Node.js server (no external deps)
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SITE_DIR = path.join(__dirname, '..', 'site');
const DATA_DIR = path.join(__dirname, 'data');

fs.mkdirSync(DATA_DIR, { recursive: true });

const PORT = parseInt(process.env.PORT || '8080', 10);
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const PAYPAL_ENV = (process.env.PAYPAL_ENV || 'sandbox').toLowerCase();
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';

const MJ_APIKEY_PUBLIC = process.env.MJ_APIKEY_PUBLIC || '';
const MJ_APIKEY_PRIVATE = process.env.MJ_APIKEY_PRIVATE || '';
const MJ_SENDER_EMAIL = process.env.MJ_SENDER_EMAIL || 'no-reply@altura.com';
const MJ_SENDER_NAME = process.env.MJ_SENDER_NAME || 'ALTURA';

const WA_TOKEN = process.env.WA_TOKEN || '';
const WA_PHONE_NUMBER_ID = process.env.WA_PHONE_NUMBER_ID || '';

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store'
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1e6) {
        req.destroy();
        reject(new Error('Body too large'));
      }
    });
    req.on('end', () => {
      if (!data) return resolve(null);
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(new Error('Invalid JSON'));
      }
    });
  });
}

function safeJoin(base, target) {
  const targetPath = path.normalize(path.join(base, target));
  if (!targetPath.startsWith(base)) return null;
  return targetPath;
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml'
};

function serveStatic(req, res) {
  const url = new URL(req.url, BASE_URL);
  let pathname = url.pathname;
  if (pathname.endsWith('/')) pathname += 'index.html';
  const filePath = safeJoin(SITE_DIR, pathname);
  if (!filePath) {
    res.writeHead(400);
    return res.end('Bad request');
  }
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404);
      return res.end('Not found');
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'content-type': MIME[ext] || 'application/octet-stream',
      'cache-control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable'
    });
    fs.createReadStream(filePath).pipe(res);
  });
}

function httpsJson(method, urlStr, headers, bodyObj) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const body = bodyObj ? JSON.stringify(bodyObj) : '';
    const options = {
      method,
      hostname: url.hostname,
      path: url.pathname + url.search,
      headers: {
        'accept': 'application/json',
        ...headers,
        ...(bodyObj ? { 'content-type': 'application/json' } : {}),
        ...(bodyObj ? { 'content-length': Buffer.byteLength(body) } : {})
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        const ok = res.statusCode && res.statusCode >= 200 && res.statusCode < 300;
        try {
          const parsed = data ? JSON.parse(data) : {};
          if (!ok) return reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(parsed)}`));
          resolve(parsed);
        } catch {
          if (!ok) return reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    if (bodyObj) req.write(body);
    req.end();
  });
}

function httpsForm(method, urlStr, headers, formObj) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const body = new URLSearchParams(formObj).toString();
    const options = {
      method,
      hostname: url.hostname,
      path: url.pathname + url.search,
      headers: {
        'accept': 'application/json',
        'content-type': 'application/x-www-form-urlencoded',
        'content-length': Buffer.byteLength(body),
        ...headers
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        const ok = res.statusCode && res.statusCode >= 200 && res.statusCode < 300;
        try {
          const parsed = data ? JSON.parse(data) : {};
          if (!ok) return reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(parsed)}`));
          resolve(parsed);
        } catch {
          if (!ok) return reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function newId(prefix='ord') {
  return `${prefix}_${crypto.randomBytes(12).toString('hex')}`;
}

function appendJsonl(filename, obj) {
  fs.appendFileSync(filename, JSON.stringify(obj) + '\n', 'utf8');
}

async function handleApi(req, res) {
  const url = new URL(req.url, BASE_URL);

  if (req.method === 'GET' && url.pathname === '/api/health') {
    return sendJson(res, 200, { ok: true, name: 'ALTURA', time: new Date().toISOString() });
  }

  if (req.method === 'GET' && url.pathname === '/api/products') {
    const data = JSON.parse(fs.readFileSync(path.join(SITE_DIR, 'products.json'), 'utf8'));
    return sendJson(res, 200, data);
  }

  // Create Stripe Checkout Session (redirect)
  if (req.method === 'POST' && url.pathname === '/api/checkout/stripe') {
    const body = await readBody(req);
    if (!STRIPE_SECRET_KEY) return sendJson(res, 400, { error: 'STRIPE_SECRET_KEY not configured' });

    const { items, currency, customer_email, success_path, cancel_path } = body || {};
    if (!items || !Array.isArray(items) || items.length === 0) return sendJson(res, 400, { error: 'No items' });
    const cur = (currency || 'EUR').toLowerCase();

    // Stripe expects amounts in smallest unit.
    // We will use price_data per line item.
    const lineItems = items.map((it, idx) => {
      const name = String(it.name || `ALTURA Item ${idx + 1}`);
      const unit_amount = parseInt(it.unit_amount, 10);
      const quantity = parseInt(it.quantity || 1, 10);
      return { name, unit_amount, quantity };
    });

    const form = {
      mode: 'payment',
      success_url: `${BASE_URL}${success_path || '/en/order/success/'}?sid={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}${cancel_path || '/en/order/failed/'}?canceled=1`,
      ...(customer_email ? { customer_email } : {})
    };

    // line_items[0][price_data][currency], etc.
    lineItems.forEach((li, i) => {
      form[`line_items[${i}][quantity]`] = String(li.quantity);
      form[`line_items[${i}][price_data][currency]`] = cur;
      form[`line_items[${i}][price_data][unit_amount]`] = String(li.unit_amount);
      form[`line_items[${i}][price_data][product_data][name]`] = li.name;
    });

    try {
      const session = await httpsForm(
        'POST',
        'https://api.stripe.com/v1/checkout/sessions',
        { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
        form
      );
      return sendJson(res, 200, { id: session.id, url: session.url });
    } catch (e) {
      return sendJson(res, 500, { error: String(e.message || e) });
    }
  }

  // PayPal Create Order (redirect)
  if (req.method === 'POST' && url.pathname === '/api/checkout/paypal') {
    const body = await readBody(req);
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      return sendJson(res, 400, { error: 'PAYPAL credentials not configured' });
    }
    const { items, currency, success_path, cancel_path } = body || {};
    if (!items || !Array.isArray(items) || items.length === 0) return sendJson(res, 400, { error: 'No items' });

    const cur = (currency || 'EUR').toUpperCase();
    const totalCents = items.reduce((sum, it) => sum + (parseInt(it.unit_amount, 10) * parseInt(it.quantity || 1, 10)), 0);
    const total = (totalCents / 100).toFixed(2);

    const apiBase = PAYPAL_ENV === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

    try {
      // OAuth token
      const tokenRes = await new Promise((resolve, reject) => {
        const url = new URL(apiBase + '/v1/oauth2/token');
        const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
        const bodyStr = 'grant_type=client_credentials';
        const req2 = https.request({
          method: 'POST',
          hostname: url.hostname,
          path: url.pathname,
          headers: {
            Authorization: `Basic ${auth}`,
            'content-type': 'application/x-www-form-urlencoded',
            'content-length': Buffer.byteLength(bodyStr)
          }
        }, (res2) => {
          let data = '';
          res2.on('data', (c) => (data += c));
          res2.on('end', () => {
            const ok = res2.statusCode >= 200 && res2.statusCode < 300;
            try {
              const parsed = JSON.parse(data);
              if (!ok) return reject(new Error(`HTTP ${res2.statusCode}: ${JSON.stringify(parsed)}`));
              resolve(parsed);
            } catch {
              reject(new Error(`Bad token response: ${data}`));
            }
          });
        });
        req2.on('error', reject);
        req2.write(bodyStr);
        req2.end();
      });

      const order = await httpsJson('POST', apiBase + '/v2/checkout/orders', {
        Authorization: `Bearer ${tokenRes.access_token}`
      }, {
        intent: 'CAPTURE',
        purchase_units: [{
          amount: { currency_code: cur, value: total }
        }],
        application_context: {
          brand_name: 'ALTURA',
          user_action: 'PAY_NOW',
          return_url: `${BASE_URL}${success_path || '/en/order/success/'}?paypal=1`,
          cancel_url: `${BASE_URL}${cancel_path || '/en/order/failed/'}?canceled=1`
        }
      });

      const approve = (order.links || []).find(l => l.rel === 'approve');
      return sendJson(res, 200, { id: order.id, approve_url: approve ? approve.href : null });
    } catch (e) {
      return sendJson(res, 500, { error: String(e.message || e) });
    }
  }

  // Save order + send Mailjet confirmation (basic)
  if (req.method === 'POST' && url.pathname === '/api/order/confirm') {
    const body = await readBody(req);
    const orderId = newId('order');
    const record = {
      id: orderId,
      created_at: new Date().toISOString(),
      ...body
    };
    appendJsonl(path.join(DATA_DIR, 'orders.jsonl'), record);

    // Optional Mailjet send
    if (MJ_APIKEY_PUBLIC && MJ_APIKEY_PRIVATE && record.email) {
      try {
        const auth = Buffer.from(`${MJ_APIKEY_PUBLIC}:${MJ_APIKEY_PRIVATE}`).toString('base64');
        await httpsJson('POST', 'https://api.mailjet.com/v3.1/send', {
          Authorization: `Basic ${auth}`
        }, {
          Messages: [{
            From: { Email: MJ_SENDER_EMAIL, Name: MJ_SENDER_NAME },
            To: [{ Email: record.email }],
            Subject: record.lang === 'fr' ? 'Confirmation de commande ALTURA' : 'ALTURA Order Confirmation',
            TextPart: record.lang === 'fr'
              ? `Merci pour votre commande ALTURA. Commande: ${orderId}`
              : `Thanks for your ALTURA order. Order: ${orderId}`
          }]
        });
      } catch (e) {
        // Do not fail order if email fails
      }
    }

    return sendJson(res, 200, { ok: true, order_id: orderId });
  }

  // WhatsApp (Meta Cloud API)
  if (req.method === 'POST' && url.pathname === '/api/whatsapp/send') {
    const body = await readBody(req);
    if (!WA_TOKEN || !WA_PHONE_NUMBER_ID) return sendJson(res, 400, { error: 'WhatsApp not configured' });
    const { to, text } = body || {};
    if (!to || !text) return sendJson(res, 400, { error: 'Missing to/text' });

    try {
      const resp = await httpsJson(
        'POST',
        `https://graph.facebook.com/v20.0/${WA_PHONE_NUMBER_ID}/messages`,
        { Authorization: `Bearer ${WA_TOKEN}` },
        {
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body: text }
        }
      );
      return sendJson(res, 200, { ok: true, resp });
    } catch (e) {
      return sendJson(res, 500, { error: String(e.message || e) });
    }
  }

  return sendJson(res, 404, { error: 'Not found' });
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.url.startsWith('/api/')) {
      await handleApi(req, res);
      return;
    }
    serveStatic(req, res);
  } catch (e) {
    sendJson(res, 500, { error: String(e.message || e) });
  }
});

server.listen(PORT, () => {
  console.log(`ALTURA server running on ${BASE_URL}`);
});
