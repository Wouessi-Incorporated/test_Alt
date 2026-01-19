/* ALTURA Store — Standard Modern UI (Vanilla JS) */

const qs = (sel, el = document) => el.querySelector(sel);
const qsa = (sel, el = document) => Array.from(el.querySelectorAll(sel));

const STORAGE_KEY = 'altura_cart_v1';
const PREF_KEY = 'altura_pref_v1';

function getPref() {
  try { return JSON.parse(localStorage.getItem(PREF_KEY) || '{"currency":"EUR"}'); } catch { return { currency: 'EUR' }; }
}
function setPref(pref) { localStorage.setItem(PREF_KEY, JSON.stringify(pref)); }

function getCart() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"items":[],"email":"","lang":"en"}'); }
  catch { return { items: [], email: '', lang: 'en' }; }
}
function setCart(cart) { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); }

function money(amountCents, currency) {
  const v = (amountCents / 100);
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(v);
}

async function loadCatalog() {
  const res = await fetch('/products.json', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load products');
  return res.json();
}

function langFromPath() {
  const p = location.pathname;
  if (p.startsWith('/fr')) return 'fr';
  return 'en';
}

function route() {
  const page = document.body.getAttribute('data-page');
  console.log('Routing page:', page);
  if (page === 'list' || page === 'collection' || page === 'home') return initListing();
  if (page === 'product') return initProduct();
  if (page === 'cart') return initCart();
  if (page === 'checkout') return initCheckout();
  return initGlobal();
}

function initGlobal() {
  const lang = langFromPath();
  const cart = getCart();
  cart.lang = lang;
  setCart(cart);

  // language switch
  qsa('[data-lang-switch]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-lang-switch');
      const newPath = location.pathname.replace(/^\/(en|fr)/, '/' + target);
      location.href = newPath + location.search;
    });
  });

  // language toggle (special pill in some headers)
  qsa('[data-lang-toggle]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const current = langFromPath();
      const next = current === 'en' ? 'fr' : 'en';
      const newPath = location.pathname.replace(/^\/(en|fr)/, '/' + next);
      location.href = newPath + location.search;
    });
  })

  // currency toggle
  const curToggle = qs('[data-currency-toggle]');
  if (curToggle) {
    const pref = getPref();
    curToggle.textContent = pref.currency || 'EUR';
    curToggle.addEventListener('click', () => {
      const next = pref.currency === 'EUR' ? 'USD' : 'EUR';
      setPref({ currency: next });
      location.reload();
    });
  }

  // cart badge
  qsa('[data-cart-count]').forEach(badge => {
    const count = cart.items.reduce((a, i) => a + i.qty, 0);
    badge.textContent = String(count);
    badge.style.display = count > 0 ? 'inline-block' : 'none';
  });
}

function calcItemPrice(product, currency) {
  if (product.price && product.price[currency]) return product.price[currency];
  if (currency === 'USD') return product.price_usd || 0;
  return product.price_eur || 0;
}

function renderProductCard(product, catalog, lang) {
  const pref = getPref();
  const currency = pref.currency || 'EUR';
  const name = lang === 'fr' ? product.name_fr : product.name_en;
  const tagline = lang === 'fr' ? product.tagline_fr : product.tagline_en;
  const priceCents = calcItemPrice(product, currency);
  const href = `/${lang}/p/${product.slug}/`;
  const sizes = product.sizes || [];
  const sizeLine = sizes.length ? (lang === 'fr' ? `Pointures: ${sizes[0]}–${sizes[sizes.length - 1]}` : `Sizes: ${sizes[0]}–${sizes[sizes.length - 1]}`) : (lang === 'fr' ? 'Accessoire' : 'Accessory');

  return `
    <a class="card" href="${href}">
      <div class="img-container">
        <img src="${product.image}" loading="lazy" alt="${name}">
      </div>
      <div class="pad">
        <div class="row" style="gap:8px;margin-bottom:8px">
          <span class="chip">${product.gender}</span>
          <span class="chip" style="background:#eef2ff;color:#4f46e5">${product.category}</span>
        </div>
        <h3 style="font-size:1.1rem;margin-bottom:4px;font-weight:600">${name}</h3>
        <p class="muted" style="font-size:0.875rem;margin-bottom:12px;color:var(--ink-muted);line-height:1.2;height:32px;overflow:hidden">${tagline}</p>
        <div class="row" style="justify-content:space-between;align-items:center">
          <div>
            <div style="font-weight:700;font-size:1rem">${money(priceCents, currency)}</div>
            <div style="font-size:0.75rem;color:var(--ink-subtle)">${sizeLine}</div>
          </div>
          <span class="btn btn-ghost btn-small" style="padding:6px 12px">${lang === 'fr' ? 'Voir' : 'View'}</span>
        </div>
      </div>
    </a>
  `;
}

async function initListing() {
  initGlobal();
  const lang = langFromPath();
  const pageFilter = document.body.getAttribute('data-gender') || 'all';
  const grid = qs('[data-products-grid]') || qs('#products') || qs('.products');
  if (!grid) return;

  const catalog = await loadCatalog();
  const products = catalog.products.filter(p => {
    if (pageFilter === 'women') return p.gender === 'women';
    if (pageFilter === 'men') return p.gender === 'men';
    return true;
  });
  grid.innerHTML = products.map(p => renderProductCard(p, catalog, lang)).join('');
}

async function initProduct() {
  initGlobal();
  const lang = langFromPath();
  const slug = document.body.getAttribute('data-slug');
  if (!slug) {
    const parts = location.pathname.split('/');
    const pIdx = parts.indexOf('p');
    if (pIdx !== -1 && parts[pIdx + 1]) {
      document.body.setAttribute('data-slug', parts[pIdx + 1]);
    } else {
      return;
    }
  }
  const currentSlug = document.body.getAttribute('data-slug');
  const catalog = await loadCatalog();
  const product = catalog.products.find(p => p.slug === currentSlug);

  const root = qs('#productRoot') || qs('#main');
  if (!product || !root) return;

  const pref = getPref();
  const currency = pref.currency || 'EUR';
  const name = lang === 'fr' ? product.name_fr : product.name_en;
  const tagline = lang === 'fr' ? product.tagline_fr : product.tagline_en;
  const why = lang === 'fr' ? product.why_fr : product.why_en;
  const desc = lang === 'fr' ? product.description_fr || product.why_fr : product.description_en || product.why_en;
  const features = (lang === 'fr' ? product.features_fr : product.features_en) || [];
  const priceCents = calcItemPrice(product, currency);

  const sizeOptions = (product.sizes || []).map(s => `<option value="${s}">${s}</option>`).join('');
  const sizePicker = product.category === 'shoes' ? `
    <div style="margin-bottom:24px">
      <label style="display:block;margin-bottom:8px;font-size:0.875rem;font-weight:600">${lang === 'fr' ? 'Pointure (EU)' : 'Size (EU)'}</label>
      <select id="sizeSel" class="input" style="max-width:200px">
        <option value="">${lang === 'fr' ? 'Sélectionner' : 'Select size'}</option>
        ${sizeOptions}
      </select>
    </div>
  ` : '';

  root.innerHTML = `
    <div class="container" style="padding:60px 0 100px">
      <div class="grid2" style="align-items:start">
        <div class="card" style="border:none">
          <img src="${product.image}" alt="${name}" style="width:100%;display:block;border:1px solid var(--border)">
        </div>
        <div>
          <div class="row" style="gap:8px;margin-bottom:16px">
            <span class="chip">${product.gender}</span>
            <span class="chip">${product.category}</span>
          </div>
          <h1 style="font-size:2.5rem;margin-bottom:12px">${name}</h1>
          <p class="muted" style="font-size:1.25rem;margin-bottom:24px;color:var(--ink-muted)">${tagline}</p>

          <div style="font-size:2rem;font-weight:700;margin-bottom:32px">${money(priceCents, currency)}</div>

          ${sizePicker}

          <div class="row" style="gap:16px;margin-bottom:48px">
            <button id="addCart" class="btn btn-primary" style="flex:1">${lang === 'fr' ? 'AJOUTER AU PANIER' : 'ADD TO BAG'}</button>
            <button id="buyNow" class="btn btn-ghost" style="flex:1">${lang === 'fr' ? 'ACHETER MAINTENANT' : 'BUY NOW'}</button>
          </div>

          <div style="display:grid;gap:24px;border-top:1px solid var(--border);padding-top:32px">
            <div>
              <h3 style="font-size:1rem;margin-bottom:8px">${lang === 'fr' ? 'Pourquoi ce modèle' : 'Design Philosophy'}</h3>
              <p class="muted" style="font-size:0.95rem;line-height:1.6">${why}</p>
            </div>
            <div>
              <h3 style="font-size:1rem;margin-bottom:8px">${lang === 'fr' ? 'Détails' : 'Product Details'}</h3>
              <p class="muted" style="font-size:0.95rem;line-height:1.6">${desc}</p>
              <ul style="margin:16px 0 0;padding-left:1.5rem;display:grid;gap:8px">
                ${features.map(f => `<li class="muted" style="font-size:0.9rem">${f}</li>`).join('')}
              </ul>
            </div>
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:24px">
              <img src="/assets/models/m1.jpg" style="aspect-ratio:1;object-fit:cover;border:1px solid var(--border)">
              <img src="/assets/models/m2.jpg" style="aspect-ratio:1;object-fit:cover;border:1px solid var(--border)">
              <img src="/assets/models/m3.jpg" style="aspect-ratio:1;object-fit:cover;border:1px solid var(--border)">
              <img src="/assets/models/m4.jpg" style="aspect-ratio:1;object-fit:cover;border:1px solid var(--border)">
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  function requireSize() {
    if (product.category === 'shoes') {
      const s = qs('#sizeSel')?.value || '';
      if (!s) {
        alert(lang === 'fr' ? 'Veuillez sélectionner une pointure.' : 'Please select a size.');
        return null;
      }
      return s;
    }
    return '';
  }

  function addToCart(skipRedirect) {
    const size = requireSize();
    if (size === null) return;
    const cart = getCart();
    const existing = cart.items.find(i => i.slug === product.slug && i.size === size && i.currency === currency);
    if (existing) existing.qty += 1;
    else cart.items.push({
      slug: product.slug,
      code: product.code,
      name_en: product.name_en,
      name_fr: product.name_fr,
      size,
      qty: 1,
      currency,
      unit_amount: priceCents
    });
    setCart(cart);
    if (!skipRedirect) location.href = `/${lang}/cart/`;
  }

  qs('#addCart').addEventListener('click', () => addToCart(false));
  qs('#buyNow').addEventListener('click', () => {
    addToCart(true);
    location.href = `/${lang}/checkout/`;
  });
}

async function initCart() {
  initGlobal();
  const lang = langFromPath();
  const catalog = await loadCatalog();
  const cart = getCart();
  const root = qs('#cartRoot');
  if (!root) return;

  if (cart.items.length === 0) {
    root.innerHTML = `
      <div style="text-align:center;padding:100px 24px;border:1px solid var(--border);background:#f9fafb">
        <h2 style="margin-bottom:16px">${lang === 'fr' ? 'Votre panier est vide' : 'Your bag is empty'}</h2>
        <p class="muted" style="margin-bottom:32px">${lang === 'fr' ? 'Parcourez notre collection pour trouver vos articles.' : 'Explore our collections to add some items.'}</p>
        <a class="btn btn-primary" href="/${lang}/">${lang === 'fr' ? 'Retour à la boutique' : 'Back to Shop'}</a>
      </div>
    `;
    return;
  }
  const pref = getPref();
  const currency = pref.currency || 'EUR';

  const itemRows = cart.items.map((it, idx) => {
    const p = catalog.products.find(x => x.slug === it.slug);
    const name = lang === 'fr' ? it.name_fr : it.name_en;
    const priceCents = it.unit_amount || (p ? calcItemPrice(p, currency) : 0);
    return `
      <div class="row" style="padding:24px;gap:24px;border:1px solid var(--border);margin-bottom:16px">
        <img style="width:100px;height:100px;object-fit:cover;border:1px solid var(--border)" src="${p?.image || '/assets/products/' + it.code + '.jpg'}" alt="${name}">
        <div style="flex:1">
          <div style="font-weight:600;font-size:1.1rem">${name}</div>
          <div class="muted" style="font-size:0.875rem;margin-top:4px">${it.size ? ('Size: EU ' + it.size) : ''}</div>
          <div style="font-weight:700;margin-top:12px">${money(priceCents, currency)} × ${it.qty}</div>
        </div>
        <button class="btn btn-ghost btn-small" data-remove="${idx}">${lang === 'fr' ? 'Supprimer' : 'Remove'}</button>
      </div>
    `;
  }).join('');

  const subtotalCents = cart.items.reduce((sum, it) => sum + (it.unit_amount * it.qty), 0);

  root.innerHTML = `
    <div class="grid2" style="align-items:start;gap:40px">
      <div style="display:grid">${itemRows}</div>
      <div class="card pad" style="position:sticky;top:100px;border:1px solid var(--border)">
        <h2 style="font-size:1.25rem;margin-bottom:24px">${lang === 'fr' ? 'Résumé' : 'Order Summary'}</h2>
        <div class="row" style="justify-content:space-between;margin-bottom:12px">
          <span class="muted">${lang === 'fr' ? 'Sous-total' : 'Subtotal'}</span>
          <strong style="font-size:1.25rem">${money(subtotalCents, currency)}</strong>
        </div>
        <div style="font-size:0.875rem;color:var(--ink-muted);margin-bottom:24px">
          ${lang === 'fr' ? 'Expédition et taxes calculées au paiement.' : 'Shipping and taxes calculated at checkout.'}
        </div>
        <a class="btn btn-primary" href="/${lang}/checkout/" style="width:100%">${lang === 'fr' ? 'PAYER' : 'CHECKOUT'}</a>
        <div class="sp"></div>
        <div class="trust" style="margin-top:0;gap:16px">
          <div class="trust-item"><span style="font-size:1rem">🔒</span> <span>SECURE</span></div>
          <div class="trust-item"><span style="font-size:1rem">↔️</span> <span>EASY RETURNS</span></div>
        </div>
      </div>
    </div>
  `;

  qsa('[data-remove]').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.getAttribute('data-remove'), 10);
      const c = getCart();
      c.items.splice(i, 1);
      setCart(c);
      location.reload();
    });
  });
}

async function initCheckout() {
  initGlobal();
  const lang = langFromPath();
  const catalog = await loadCatalog();
  const pref = getPref();
  const currency = pref.currency || 'EUR';
  const cart = getCart();
  const root = qs('#checkoutRoot');
  if (!root) return;

  if (cart.items.length === 0) {
    location.href = `/${lang}/cart/`;
    return;
  }

  const subtotalCents = cart.items.reduce((sum, it) => sum + (it.unit_amount * it.qty), 0);
  const itemsHtml = cart.items.map(it => {
    const name = lang === 'fr' ? it.name_fr : it.name_en;
    return `
      <div class="row" style="justify-content:space-between;margin-bottom:12px;font-size:0.875rem">
        <span class="muted">${name}${it.size ? (' (EU ' + it.size + ')') : ''} × ${it.qty}</span>
        <strong>${money(it.unit_amount * it.qty, currency)}</strong>
      </div>`;
  }).join('');

  root.innerHTML = `
    <div class="grid2" style="align-items:start;gap:40px">
      <div class="card pad" style="border:1px solid var(--border)">
        <h2 style="font-size:1.5rem;margin-bottom:32px">${lang === 'fr' ? 'Paiement' : 'Checkout'}</h2>
        
        <div style="display:grid;gap:20px">
          <div>
            <label style="display:block;margin-bottom:8px;font-size:0.875rem;font-weight:600">Email Address</label>
            <input id="email" class="input" placeholder="you@example.com" value="${cart.email || ''}">
          </div>
          <div>
            <label style="display:block;margin-bottom:8px;font-size:0.875rem;font-weight:600">${lang === 'fr' ? 'Téléphone' : 'Phone Number'}</label>
            <input id="phone" class="input" placeholder="+33...">
          </div>
          <label class="row" style="gap:10px;align-items:center;cursor:pointer">
            <input id="waOpt" type="checkbox" style="width:18px;height:18px"> 
            <span style="font-size:0.875rem;color:var(--ink-muted)">${lang === 'fr' ? 'Recevoir les mises à jour sur WhatsApp' : 'Keep me updated on WhatsApp'}</span>
          </label>
        </div>

        <div style="margin-top:40px;padding-top:40px;border-top:1px solid var(--border)">
          <h3 style="font-size:1rem;margin-bottom:20px">${lang === 'fr' ? 'Choisir le mode de paiement' : 'Select Payment Method'}</h3>
          <div style="display:grid;gap:12px">
            <button id="payStripe" class="btn btn-primary" style="width:100%">${lang === 'fr' ? 'CARTE BANCAIRE (STRIPE)' : 'PAY BY CARD (STRIPE)'}</button>
            <button id="payPaypal" class="btn btn-ghost" style="width:100%">${lang === 'fr' ? 'PAYPAL' : 'PAYPAL'}</button>
          </div>
          <p class="muted" style="font-size:0.75rem;margin-top:20px;text-align:center">
            ${lang === 'fr' ? 'Paiement sécurisé et crypté.' : 'Secure 256-bit encrypted checkout.'}
          </p>
        </div>
      </div>

      <div class="card pad" style="background:#f9fafb;border:1px solid var(--border)">
        <h3 style="font-size:1.1rem;margin-bottom:24px">${lang === 'fr' ? 'Votre commande' : 'Order Recap'}</h3>
        <div style="display:grid;margin-bottom:24px">
          ${itemsHtml}
        </div>
        <div style="border-top:1px solid var(--border);padding-top:20px">
          <div class="row" style="justify-content:space-between">
            <span style="font-weight:600">${lang === 'fr' ? 'Total à payer' : 'Total Due'}</span>
            <strong style="font-size:1.5rem">${money(subtotalCents, currency)}</strong>
          </div>
          <div class="muted" style="font-size:0.75rem;margin-top:12px">
            ${lang === 'fr' ? 'Expédition calculée à l’étape suivante.' : 'Free global shipping on orders over 150€.'}
          </div>
        </div>
      </div>
    </div>
  `;

  async function callPay(gateway) {
    const email = qs('#email').value.trim();
    if (!email) {
      alert(lang === 'fr' ? 'Veuillez entrer votre email.' : 'Please enter your email.');
      return;
    }
    const c = getCart();
    c.email = email;
    setCart(c);

    const payload = {
      customer_email: email,
      currency: currency,
      items: cart.items.map(it => ({
        name: (lang === 'fr' ? it.name_fr : it.name_en) + (it.size ? ` (EU ${it.size})` : ''),
        unit_amount: it.unit_amount,
        quantity: it.qty
      })),
      success_path: `/${lang}/order/success/`,
      cancel_path: `/${lang}/order/failed/`
    };

    const endpoint = gateway === 'stripe' ? '/api/checkout/stripe' : '/api/checkout/paypal';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const url = data.url || data.approve_url;
      if (url) location.href = url;
      else throw new Error('Invalid server response');
    } catch (err) {
      alert((lang === 'fr' ? 'Erreur: ' : 'Error: ') + err.message);
    }
  }

  qs('#payStripe')?.addEventListener('click', () => callPay('stripe'));
  qs('#payPaypal')?.addEventListener('click', () => callPay('paypal'));
}

window.addEventListener('DOMContentLoaded', route);
