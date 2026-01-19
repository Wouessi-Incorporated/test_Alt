/* ALTURA Funnel Store — Vanilla JS (EN/FR), cart + checkout */

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
    badge.textContent = String(cart.items.reduce((a, i) => a + i.qty, 0));
  });

  // Reveal animations
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  qsa('section, .card, h1, h2').forEach(el => observer.observe(el));
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
  const sizeLine = sizes.length ? (lang === 'fr' ? `Tailles: ${sizes[0]}–${sizes[sizes.length - 1]}` : `Sizes: ${sizes[0]}–${sizes[sizes.length - 1]}`) : (lang === 'fr' ? 'Accessoire' : 'Accessory');

  return `
    <a class="card" href="${href}">
      <div class="img-container">
        <img src="${product.image}" loading="lazy" alt="${name}">
      </div>
      <div class="pad">
        <div class="row" style="gap:8px;margin-bottom:12px">
          <div class="chip">${product.category}</div>
          <div class="chip">${product.gender}</div>
        </div>
        <h3 style="font-size:1.5rem;margin-bottom:8px;font-weight:400">${name}</h3>
        <div class="muted" style="font-size:0.9rem;margin-bottom:20px;line-height:1.4">${tagline}</div>
        <div class="row" style="justify-content:space-between;align-items:flex-end;margin-top:auto">
          <div>
            <div style="font-weight:700;font-size:1.1rem;color:var(--gold)">${money(priceCents, currency)}</div>
            <div class="muted" style="font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em">${sizeLine}</div>
          </div>
          <span class="btn btn-primary btn-small">${lang === 'fr' ? 'Découvrir' : 'Explore'}</span>
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
    <div class="sp"></div>
    <label class="muted" style="display:block;margin-bottom:12px;font-size:0.8rem;text-transform:uppercase;letter-spacing:0.1em;font-weight:700">${lang === 'fr' ? 'Choisir la taille (EU)' : 'Select Size (EU)'}</label>
    <select id="sizeSel" class="input" aria-label="Size">
      <option value="">${lang === 'fr' ? 'Sélectionner' : 'Select'}</option>
      ${sizeOptions}
    </select>
  ` : '';

  root.innerHTML = `
    <div class="container" style="padding:100px 0 160px">
      <div class="grid2" style="align-items:start">
        <div class="card" style="border:none;border-radius:var(--radius-md);overflow:hidden;box-shadow:var(--shadow-lg)">
          <img src="${product.image}" alt="${name}" style="width:100%;display:block">
        </div>
        <div>
          <div class="row" style="gap:12px;margin-bottom:24px">
            <span class="chip">${product.gender}</span>
            <span class="chip">${product.category}</span>
          </div>
          <h1 style="font-size:4rem;margin-bottom:16px;line-height:1.1">${name}</h1>
          <div class="muted" style="font-size:1.5rem;margin-bottom:40px;font-weight:300">${tagline}</div>

          <div style="font-size:2.5rem;font-weight:400;margin-bottom:40px;color:var(--gold);font-family:'Playfair Display', serif">${money(priceCents, currency)}</div>

          ${sizePicker}

          <div class="sp"></div>
          <div class="row" style="gap:20px">
            <button id="buyNow" class="btn btn-primary" style="flex:1">${lang === 'fr' ? 'ACHETER MAINTENANT' : 'BUY NOW'}</button>
            <button id="addCart" class="btn btn-ghost" style="flex:1">${lang === 'fr' ? 'Ajouter au panier' : 'Add to cart'}</button>
          </div>

          <div class="sp"></div>
          <div style="display:grid;gap:24px">
            <div class="card pad" style="background:rgba(255,255,255,0.03)">
              <div style="font-family:'Playfair Display',serif;font-size:1.5rem;margin-bottom:12px">${lang === 'fr' ? 'L’Essence du Design' : 'Design Philosophy'}</div>
              <div class="muted" style="line-height:1.8">${why}</div>
            </div>

            <div class="card pad" style="background:rgba(255,255,255,0.03)">
              <div style="font-family:'Playfair Display',serif;font-size:1.5rem;margin-bottom:12px">${lang === 'fr' ? 'Détails & Craft' : 'Details & Craft'}</div>
              <div class="muted" style="line-height:1.8">${desc}</div>
              <ul style="margin:24px 0 0;padding-left:1.5rem;display:grid;gap:12px">
                ${features.map(f => `<li class="muted" style="font-size:0.95rem">${f}</li>`).join('')}
              </ul>
            </div>

            <div class="card pad" style="background:rgba(255,255,255,0.03)">
              <div style="font-family:'Playfair Display',serif;font-size:1.5rem;margin-bottom:20px">${lang === 'fr' ? 'Vision ALTURA' : 'ALTURA Vision'}</div>
              <div class="muted" style="margin-bottom:24px;line-height:1.8">${lang === 'fr' ? 'Repenser la silhouette pour les plus grands.' : 'Engineering the silhouette for the tallest presence.'}</div>
              <div class="grid4" style="gap:15px">
                <img src="/assets/models/m1.jpg" alt="Model" style="aspect-ratio:1/1;object-fit:cover;border-radius:var(--radius-sm)">
                <img src="/assets/models/m2.jpg" alt="Model" style="aspect-ratio:1/1;object-fit:cover;border-radius:var(--radius-sm)">
                <img src="/assets/models/m3.jpg" alt="Model" style="aspect-ratio:1/1;object-fit:cover;border-radius:var(--radius-sm)">
                <img src="/assets/models/m4.jpg" alt="Model" style="aspect-ratio:1/1;object-fit:cover;border-radius:var(--radius-sm)">
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  function requireSize() {
    if (product.category !== 'shoes') return '';
    const s = qs('#sizeSel')?.value || '';
    if (!s) {
      alert(lang === 'fr' ? 'Veuillez sélectionner une taille.' : 'Please select a size.');
      return null;
    }
    return s;
  }

  function addToCart(skipGo) {
    const size = requireSize();
    if (size === null) return;
    const cart = getCart();
    const existing = cart.items.find(i => i.slug === product.slug && i.size === size && i.currency === currency);
    if (existing) existing.qty += 1;
    else cart.items.push({ slug: product.slug, code: product.code, name_en: product.name_en, name_fr: product.name_fr, size, qty: 1, currency, unit_amount: priceCents });
    setCart(cart);
    if (!skipGo) location.href = `/${lang}/cart/`;
  }

  qs('#addCart').addEventListener('click', () => addToCart(false));
  qs('#buyNow').addEventListener('click', () => {
    const size = requireSize();
    if (size === null) return;
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
    root.innerHTML = `<div class="card pad" style="text-align:center;padding:120px 40px;background:var(--surface)"><h2 style="font-size:3rem;margin-bottom:24px">${lang === 'fr' ? 'Votre panier est vide' : 'Your cart is empty'}</h2><p class="muted" style="font-size:1.2rem;margin-bottom:48px;max-width:500px;margin-left:auto;margin-right:auto">${lang === 'fr' ? 'Découvrez notre collection pensée pour la stature.' : 'Explore our collection engineered for presence.'}</p><a class="btn btn-primary" href="/${lang}/">${lang === 'fr' ? 'Retour à l’Atelier' : 'Explore Collection'}</a></div>`;
    return;
  }
  const pref = getPref();
  const currency = pref.currency || 'EUR';
  const itemRows = cart.items.map((it, idx) => {
    const p = catalog.products.find(x => x.slug === it.slug);
    const name = lang === 'fr' ? it.name_fr : it.name_en;
    const priceCents = p ? calcItemPrice(p, currency) : it.unit_amount || 0;
    return `
      <div class="card" style="padding:24px;display:flex;gap:24px;align-items:center;background:var(--surface)">
        <img style="width:100px;height:120px;object-fit:cover;border-radius:var(--radius-sm)" src="${p?.image || '/assets/products/' + it.code + '.jpg'}" alt="${name}">
        <div style="flex:1">
          <div style="font-weight:400;font-size:1.5rem;font-family:'Playfair Display',serif">${name}</div>
          <div class="muted" style="font-size:0.8rem;text-transform:uppercase;letter-spacing:0.1em;margin-top:4px">${it.size ? ('Size: EU ' + it.size) : ''}</div>
          <div style="font-weight:600;margin-top:12px;color:var(--gold)">${money(priceCents, currency)} × ${it.qty}</div>
        </div>
        <button class="btn btn-ghost btn-small" style="font-size:0.7rem" data-remove="${idx}">${lang === 'fr' ? 'Retirer' : 'Remove'}</button>
      </div>
    `;
  }).join('');

  const subtotalCents = cart.items.reduce((sum, it) => {
    const p = catalog.products.find(x => x.slug === it.slug);
    const pr = p ? calcItemPrice(p, currency) : it.unit_amount || 0;
    return sum + pr * it.qty;
  }, 0);

  root.innerHTML = `
    <div class="grid2" style="align-items:start;gap:40px">
      <div style="display:grid;gap:20px">${itemRows}</div>
      <div class="card pad" style="position:sticky;top:120px;background:var(--surface)">
        <h2 style="font-size:2rem;margin-bottom:32px">${lang === 'fr' ? 'Récapitulatif' : 'Order Summary'}</h2>
        <div class="row" style="justify-content:space-between;margin-bottom:20px"><span class="muted">${lang === 'fr' ? 'Sous-total' : 'Subtotal'}</span><strong style="font-size:1.5rem;font-family:'Playfair Display',serif">${money(subtotalCents, currency)}</strong></div>
        <div style="border-top:1px solid var(--border);padding-top:32px;margin-top:32px">
          <div class="trust" style="grid-template-columns:1fr;gap:16px;margin-bottom:32px">
            <div class="trust-item"><span>🔒</span> <span style="font-size:0.8rem;text-transform:uppercase;letter-spacing:0.1em">${lang === 'fr' ? 'Paiement SSL Sécurisé' : 'SSL Secured Checkout'}</span></div>
            <div class="trust-item"><span>↔️</span> <span style="font-size:0.8rem;text-transform:uppercase;letter-spacing:0.1em">${lang === 'fr' ? 'Échanges Prioritaires' : 'Priority Exchanges'}</span></div>
          </div>
          <a class="btn btn-primary" href="/${lang}/checkout/" style="width:100%">${lang === 'fr' ? 'Confirmer la Commande' : 'Proceed to Checkout'}</a>
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

  const subtotalCents = cart.items.reduce((sum, it) => {
    const p = catalog.products.find(x => x.slug === it.slug);
    const pr = p ? calcItemPrice(p, currency) : it.unit_amount || 0;
    return sum + pr * it.qty;
  }, 0);

  const itemsHtml = cart.items.map(it => {
    const p = catalog.products.find(x => x.slug === it.slug);
    const name = lang === 'fr' ? it.name_fr : it.name_en;
    const pr = p ? calcItemPrice(p, currency) : it.unit_amount || 0;
    return `
      <div class="row" style="justify-content:space-between;margin-bottom:12px">
        <span class="muted" style="font-size:0.9rem">${name}${it.size ? (' (EU ' + it.size + ')') : ''} × ${it.qty}</span>
        <strong style="font-size:0.9rem">${money(pr * it.qty, currency)}</strong>
      </div>`;
  }).join('');

  root.innerHTML = `
    <div class="grid2" style="align-items:start;gap:40px">
      <div class="card pad" style="background:var(--surface)">
        <h2 style="font-size:2.5rem;margin-bottom:12px">${lang === 'fr' ? 'Finaliser' : 'Checkout'}</h2>
        <div class="trust" style="grid-template-columns:1fr 1fr;gap:12px;margin-bottom:40px">
          <div class="trust-item" style="font-size:0.75rem;text-transform:uppercase;letter-spacing:0.1em"><span>🔒</span> <span>SSL SECURE</span></div>
          <div class="trust-item" style="font-size:0.75rem;text-transform:uppercase;letter-spacing:0.1em"><span>✅</span> <span>ENCRYPTED</span></div>
        </div>

        <div style="display:grid;gap:24px">
          <div>
            <label class="muted" style="display:block;margin-bottom:12px;font-size:0.8rem;text-transform:uppercase;letter-spacing:0.1em;font-weight:700">Email</label>
            <input id="email" class="input" placeholder="you@email.com" value="${cart.email || ''}">
          </div>
          <div>
            <label class="muted" style="display:block;margin-bottom:12px;font-size:0.8rem;text-transform:uppercase;letter-spacing:0.1em;font-weight:700">${lang === 'fr' ? 'Téléphone' : 'Phone'}</label>
            <input id="phone" class="input" placeholder="+33...">
          </div>
          <label class="row" style="gap:12px;align-items:center;cursor:pointer">
            <input id="waOpt" type="checkbox" style="width:20px;height:20px;accent-color:var(--gold)"> 
            <span class="muted" style="font-size:0.9rem">${lang === 'fr' ? 'Recevoir les actualités sur WhatsApp' : 'Get order updates on WhatsApp'}</span>
          </label>
        </div>

        <div style="margin-top:48px;padding-top:48px;border-top:1px solid var(--border)">
          <div style="font-weight:700;font-size:0.9rem;text-transform:uppercase;letter-spacing:0.2em;margin-bottom:24px;color:var(--gold)">Method of Payment</div>
          <div style="display:grid;gap:16px">
            <button id="payStripe" class="btn btn-primary" style="width:100%">${lang === 'fr' ? 'CARTE BANCAIRE (STRIPE)' : 'PAY BY CARD (STRIPE)'}</button>
            <button id="payPaypal" class="btn btn-ghost" style="width:100%">${lang === 'fr' ? 'PAYER AVEC PAYPAL' : 'PAY WITH PAYPAL'}</button>
          </div>
          <div class="muted" style="font-size:0.75rem;margin-top:24px;text-align:center;line-height:1.6">
            ${lang === 'fr' ? 'Transactions cryptées 256-bit. Aucune donnée n’est conservée.' : '256-bit encrypted transactions. No sensitive data is stored on our servers.'}
          </div>
        </div>
      </div>

      <div class="card pad" style="background:rgba(255,255,255,0.03);border:none">
        <h3 style="font-size:1.5rem;margin-bottom:32px;font-family:'Playfair Display',serif">${lang === 'fr' ? 'Votre Sélection' : 'Your Selection'}</h3>
        <div style="display:grid;gap:8px;margin-bottom:32px">
          ${itemsHtml}
        </div>
        <div style="border-top:1px solid var(--border);padding-top:24px;margin-top:24px">
          <div class="row" style="justify-content:space-between"><span style="font-weight:400;text-transform:uppercase;letter-spacing:0.1em;font-size:0.8rem">Total Due</span><strong style="font-size:2rem;font-family:'Playfair Display',serif;color:var(--gold)">${money(subtotalCents, currency)}</strong></div>
          <div class="muted" style="font-size:0.8rem;margin-top:16px">${lang === 'fr' ? 'Livraison et taxes calculées à l’étape suivante.' : 'Shipping and taxes will be finalized at the next step.'} </div>
        </div>
      </div>
    </div>
  `;

  function persistEmail() {
    const c = getCart();
    c.email = qs('#email').value.trim();
    setCart(c);
  }

  async function callPay(gateway) {
    persistEmail();
    const email = qs('#email').value.trim();
    if (!email) {
      alert(lang === 'fr' ? 'Veuillez saisir votre email.' : 'Please enter your email.');
      return;
    }

    const payload = {
      customer_email: email,
      currency: currency,
      items: cart.items.map(it => {
        const p = catalog.products.find(x => x.slug === it.slug);
        const name = lang === 'fr' ? it.name_fr : it.name_en;
        const amount = p ? calcItemPrice(p, currency) : it.unit_amount || 0;
        return {
          name: name + (it.size ? ` (EU ${it.size})` : ''),
          unit_amount: amount,
          quantity: it.qty
        };
      }),
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
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t);
      }
      const data = await res.json();
      if (gateway === 'stripe' && data.url) {
        location.href = data.url;
      } else if (gateway === 'paypal' && data.approve_url) {
        location.href = data.approve_url;
      } else {
        throw new Error('Invalid payment response');
      }
    } catch (err) {
      console.error(err);
      alert((lang === 'fr' ? 'Erreur de paiement: ' : 'Payment Error: ') + err.message);
    }
  }

  qs('#payStripe')?.addEventListener('click', () => callPay('stripe'));
  qs('#payPaypal')?.addEventListener('click', () => callPay('paypal'));
}

window.addEventListener('DOMContentLoaded', () => {
  route().catch(err => {
    console.error(err);
    const box = document.createElement('div');
    box.className = 'container';
    box.style.padding = '100px 24px';
    box.innerHTML = `<div class="card pad" style="border-color:var(--error);max-width:600px;margin:0 auto;text-align:center;background:var(--surface)">
      <h2 style="font-family:'Playfair Display',serif;margin-bottom:16px">System Encountered an Error</h2>
      <div class="muted" style="margin-bottom:32px">${err.message}</div>
      <a class="btn btn-primary" href="/">Return to Boutique</a>
    </div>`;
    qs('main')?.appendChild(box) || document.body.appendChild(box);
  });
});
