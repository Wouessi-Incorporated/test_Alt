/* ALTURA Funnel Store — Vanilla JS (EN/FR), cart + checkout */

const qs = (sel, el=document) => el.querySelector(sel);
const qsa = (sel, el=document) => Array.from(el.querySelectorAll(sel));

const STORAGE_KEY = 'altura_cart_v1';
const PREF_KEY = 'altura_pref_v1';

function getPref(){
  try{return JSON.parse(localStorage.getItem(PREF_KEY) || '{"currency":"EUR"}');}catch{ return {currency:'EUR'}; }
}
function setPref(pref){ localStorage.setItem(PREF_KEY, JSON.stringify(pref)); }

function getCart(){
  try{return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"items":[],"email":"","lang":"en"}');}
  catch{ return {items:[], email:'', lang:'en'}; }
}
function setCart(cart){ localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); }

function money(amountCents, currency){
  const v = (amountCents/100);
  return new Intl.NumberFormat(undefined, {style:'currency', currency}).format(v);
}

async function loadCatalog(){
  const res = await fetch('/products.json', {cache:'no-store'});
  if(!res.ok) throw new Error('Failed to load products');
  return res.json();
}

function langFromPath(){
  const p = location.pathname;
  if(p.startsWith('/fr')) return 'fr';
  return 'en';
}

function route(){
  const page = document.body.getAttribute('data-page');
  if(page === 'list') return initListing();
  if(page === 'product') return initProduct();
  if(page === 'cart') return initCart();
  if(page === 'checkout') return initCheckout();
  return initGlobal();
}

function initGlobal(){
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
  // currency toggle
  const curSel = qs('[data-currency]');
  if(curSel){
    const pref = getPref();
    curSel.value = pref.currency || 'EUR';
    curSel.addEventListener('change', () => {
      setPref({currency: curSel.value});
      location.reload();
    });
  }
  // cart badge
  const badge = qs('[data-cart-count]');
  if(badge){
    badge.textContent = String(cart.items.reduce((a,i)=>a+i.qty,0));
  }
}

function calcItemPrice(product, currency){
  if(currency === 'USD') return product.price_usd;
  return product.price_eur;
}

function renderProductCard(product, catalog, lang){
  const pref = getPref();
  const currency = pref.currency || 'EUR';
  const name = lang==='fr' ? product.name_fr : product.name_en;
  const tagline = lang==='fr' ? product.tagline_fr : product.tagline_en;
  const priceCents = calcItemPrice(product, currency);
  const href = `/${lang}/p/${product.slug}.html`;
  const sizeLine = product.sizes_eu?.length ? (lang==='fr' ? `Tailles: ${product.sizes_eu.join(' · ')}` : `Sizes: ${product.sizes_eu.join(' · ')}`) : (lang==='fr' ? 'Accessoire' : 'Accessory');
  return `
    <a class="card" href="${href}">
      <img class="img" src="/assets/products/${product.code}.jpg" alt="${name}">
      <div class="pad">
        <div class="row"><div class="chip">${product.category}</div><div class="chip">${product.gender}</div></div>
        <h3 class="h3" style="margin:10px 0 6px">${name}</h3>
        <div class="muted">${tagline}</div>
        <div class="sp"></div>
        <div class="row" style="justify-content:space-between;align-items:center">
          <div>
            <div style="font-weight:700">${money(priceCents, currency)}</div>
            <div class="muted" style="font-size:12px">${sizeLine}</div>
          </div>
          <span class="btn">${lang==='fr' ? 'Voir' : 'View'}</span>
        </div>
      </div>
    </a>
  `;
}

async function initListing(){
  initGlobal();
  const lang = langFromPath();
  const pageFilter = document.body.getAttribute('data-filter') || 'all';
  const grid = qs('#productGrid');
  const catalog = await loadCatalog();
  const products = catalog.products.filter(p => {
    if(pageFilter === 'women') return p.gender === 'women';
    if(pageFilter === 'men') return p.gender === 'men';
    return true;
  });
  grid.innerHTML = products.map(p => renderProductCard(p, catalog, lang)).join('');
}

async function initProduct(){
  initGlobal();
  const lang = langFromPath();
  const slug = document.body.getAttribute('data-slug');
  const catalog = await loadCatalog();
  const product = catalog.products.find(p => p.slug === slug);
  if(!product){
    qs('#productRoot').innerHTML = `<div class="container"><h2>Not found</h2></div>`;
    return;
  }
  const pref = getPref();
  const currency = pref.currency || 'EUR';
  const name = lang==='fr' ? product.name_fr : product.name_en;
  const tagline = lang==='fr' ? product.tagline_fr : product.tagline_en;
  const why = lang==='fr' ? product.why_fr : product.why_en;
  const desc = lang==='fr' ? product.description_fr : product.description_en;
  const features = (lang==='fr' ? product.features_fr : product.features_en) || [];
  const priceCents = calcItemPrice(product, currency);

  const sizeOptions = (product.sizes_eu || []).map(s => `<option value="${s}">${s}</option>`).join('');
  const sizePicker = product.category==='shoes' ? `
    <div class="sp"></div>
    <label class="muted" style="display:block;margin-bottom:6px">${lang==='fr' ? 'Choisissez votre taille (EU)' : 'Choose your size (EU)'}</label>
    <select id="sizeSel" class="input" aria-label="Size">
      <option value="">${lang==='fr' ? 'Sélectionnez' : 'Select'}</option>
      ${sizeOptions}
    </select>
  ` : '';

  qs('#productRoot').innerHTML = `
    <div class="container" style="padding:18px 0 40px">
      <div class="trustbar">
        <span class="trust">🔒 ${lang==='fr' ? 'Paiement sécurisé' : 'Secure checkout'}</span>
        <span class="trust">↔️ ${lang==='fr' ? 'Échanges faciles' : 'Easy exchanges'}</span>
        <span class="trust">📏 ${lang==='fr' ? 'Garantie grande taille' : 'Tall-fit guarantee'}</span>
        <span class="trust">💬 WhatsApp</span>
      </div>

      <div class="grid2" style="margin-top:14px">
        <div class="card">
          <img class="img" src="/assets/products/${product.code}.jpg" alt="${name}">
        </div>
        <div>
          <div class="row"><span class="chip">${product.gender}</span><span class="chip">${product.category}</span></div>
          <h1 class="h1" style="margin:10px 0 8px">${name}</h1>
          <div class="muted" style="font-size:16px">${tagline}</div>

          <div class="sp"></div>
          <div style="font-size:24px;font-weight:800">${money(priceCents, currency)}</div>

          ${sizePicker}

          <div class="sp"></div>
          <div class="row">
            <button id="buyNow" class="btn btnPrimary" style="flex:1">${lang==='fr' ? 'ACHETER MAINTENANT' : 'BUY NOW'}</button>
            <button id="addCart" class="btn" style="flex:1">${lang==='fr' ? 'Ajouter au panier' : 'Add to cart'}</button>
          </div>

          <div class="sp"></div>
          <div class="card" style="padding:14px">
            <div style="font-weight:800;margin-bottom:6px">${lang==='fr' ? 'Pourquoi il existe' : 'Why it exists'}</div>
            <div class="muted">${why}</div>
          </div>

          <div class="sp"></div>
          <div class="card" style="padding:14px">
            <div style="font-weight:800;margin-bottom:6px">${lang==='fr' ? 'Détails' : 'Details'}</div>
            <div class="muted">${desc}</div>
            <ul style="margin:10px 0 0;padding-left:18px">
              ${features.map(f=>`<li>${f}</li>`).join('')}
            </ul>
          </div>

          <div class="sp"></div>
          <div class="card" style="padding:14px">
            <div style="font-weight:800;margin-bottom:6px">${lang==='fr' ? 'Inclusivité' : 'Inclusivity'}</div>
            <div class="muted">${lang==='fr' ? 'ALTURA est conçu pour les personnes grandes, de toutes origines.' : 'ALTURA is built for tall people of all backgrounds.'}</div>
            <div class="sp"></div>
            <div class="products" style="grid-template-columns:repeat(4,1fr)">
              <img class="img" src="/assets/models/m1.jpg" alt="Tall model">
              <img class="img" src="/assets/models/m2.jpg" alt="Tall model">
              <img class="img" src="/assets/models/m3.jpg" alt="Tall model">
              <img class="img" src="/assets/models/m4.jpg" alt="Tall model">
            </div>
          </div>

        </div>
      </div>
    </div>
  `;

  function requireSize(){
    if(product.category !== 'shoes') return '';
    const s = qs('#sizeSel')?.value || '';
    if(!s){
      alert(lang==='fr' ? 'Veuillez sélectionner une taille.' : 'Please select a size.');
      return null;
    }
    return s;
  }

  function addToCart(skipGo){
    const size = requireSize();
    if(size === null) return;
    const cart = getCart();
    const existing = cart.items.find(i => i.slug===product.slug && i.size===size && i.currency===currency);
    if(existing) existing.qty += 1;
    else cart.items.push({slug: product.slug, code: product.code, name_en: product.name_en, name_fr: product.name_fr, size, qty:1, currency});
    setCart(cart);
    if(!skipGo) location.href = `/${lang}/cart.html`;
  }

  qs('#addCart').addEventListener('click', ()=> addToCart(false));
  qs('#buyNow').addEventListener('click', ()=> {
    addToCart(true);
    location.href = `/${lang}/checkout.html`;
  });
}

async function initCart(){
  initGlobal();
  const lang = langFromPath();
  const catalog = await loadCatalog();
  const cart = getCart();
  const root = qs('#cartRoot');
  if(cart.items.length===0){
    root.innerHTML = `<div class="card" style="padding:16px"><div style="font-weight:800">${lang==='fr' ? 'Votre panier est vide' : 'Your cart is empty'}</div><div class="sp"></div><a class="btn btnPrimary" href="/${lang}/">${lang==='fr' ? 'Retour à la boutique' : 'Back to shop'}</a></div>`;
    return;
  }
  const pref = getPref();
  const currency = pref.currency || 'EUR';
  const itemRows = cart.items.map((it, idx) => {
    const p = catalog.products.find(x => x.slug===it.slug);
    const name = lang==='fr' ? it.name_fr : it.name_en;
    const priceCents = p ? calcItemPrice(p, currency) : 0;
    return `
      <div class="card" style="padding:12px;display:flex;gap:12px;align-items:center">
        <img style="width:82px;height:82px;object-fit:cover;border-radius:14px" src="/assets/products/${it.code}.jpg" alt="${name}">
        <div style="flex:1">
          <div style="font-weight:800">${name}</div>
          <div class="muted">${it.size ? ('EU '+it.size) : ''}</div>
          <div class="muted">${money(priceCents, currency)} × ${it.qty}</div>
        </div>
        <button class="btn" data-remove="${idx}">${lang==='fr' ? 'Retirer' : 'Remove'}</button>
      </div>
    `;
  }).join('');

  const subtotalCents = cart.items.reduce((sum,it)=>{
    const p = catalog.products.find(x=>x.slug===it.slug);
    const pr = p?calcItemPrice(p, currency):0;
    return sum + pr*it.qty;
  },0);

  root.innerHTML = `
    <div class="grid2">
      <div style="display:grid;gap:10px">${itemRows}</div>
      <div class="card" style="padding:16px;height:fit-content">
        <div style="font-weight:900;font-size:18px">${lang==='fr' ? 'Résumé' : 'Summary'}</div>
        <div class="sp"></div>
        <div class="row" style="justify-content:space-between"><span class="muted">${lang==='fr' ? 'Sous-total' : 'Subtotal'}</span><strong>${money(subtotalCents,currency)}</strong></div>
        <div class="sp"></div>
        <div class="trustbar" style="margin:0">
          <span class="trust">🔒 ${lang==='fr' ? 'Paiement sécurisé' : 'Secure checkout'}</span>
          <span class="trust">↔️ ${lang==='fr' ? 'Échanges faciles' : 'Easy exchanges'}</span>
          <span class="trust">📏 ${lang==='fr' ? 'Garantie grande taille' : 'Tall-fit guarantee'}</span>
        </div>
        <div class="sp"></div>
        <a class="btn btnPrimary" href="/${lang}/checkout.html" style="display:block;text-align:center">${lang==='fr' ? 'Passer au paiement' : 'Proceed to checkout'}</a>
      </div>
    </div>
  `;

  qsa('[data-remove]').forEach(btn => {
    btn.addEventListener('click', ()=>{
      const i = parseInt(btn.getAttribute('data-remove'),10);
      const c = getCart();
      c.items.splice(i,1);
      setCart(c);
      location.reload();
    });
  });
}

async function initCheckout(){
  initGlobal();
  const lang = langFromPath();
  const catalog = await loadCatalog();
  const pref = getPref();
  const currency = pref.currency || 'EUR';
  const cart = getCart();
  const root = qs('#checkoutRoot');
  if(cart.items.length===0){
    root.innerHTML = `<div class="card" style="padding:16px"><div style="font-weight:800">${lang==='fr' ? 'Panier vide' : 'Cart empty'}</div><div class="sp"></div><a class="btn btnPrimary" href="/${lang}/">${lang==='fr' ? 'Retour' : 'Back'}</a></div>`;
    return;
  }

  const subtotalCents = cart.items.reduce((sum,it)=>{
    const p = catalog.products.find(x=>x.slug===it.slug);
    const pr = p?calcItemPrice(p, currency):0;
    return sum + pr*it.qty;
  },0);

  const itemsHtml = cart.items.map(it => {
    const p = catalog.products.find(x=>x.slug===it.slug);
    const name = lang==='fr' ? it.name_fr : it.name_en;
    const pr = p?calcItemPrice(p, currency):0;
    return `<div class="row" style="justify-content:space-between"><span class="muted">${name}${it.size?(' (EU '+it.size+')'):''} × ${it.qty}</span><strong>${money(pr*it.qty,currency)}</strong></div>`;
  }).join('');

  root.innerHTML = `
    <div class="grid2">
      <div class="card" style="padding:16px">
        <h2 style="margin:0 0 8px">${lang==='fr' ? 'Paiement' : 'Checkout'}</h2>
        <div class="trustbar" style="margin-top:0">
          <span class="trust">🔒 ${lang==='fr' ? 'SSL sécurisé' : 'SSL secure'}</span>
          <span class="trust">✅ ${lang==='fr' ? 'Paiement chiffré' : 'Encrypted payments'}</span>
          <span class="trust">↔️ ${lang==='fr' ? 'Échanges faciles' : 'Easy exchanges'}</span>
          <span class="trust">📏 ${lang==='fr' ? 'Garantie grande taille' : 'Tall-fit guarantee'}</span>
        </div>

        <div class="sp"></div>
        <label class="muted">Email</label>
        <input id="email" class="input" placeholder="you@email.com" value="${cart.email||''}">

        <div class="sp"></div>
        <label class="muted">${lang==='fr' ? 'Téléphone (WhatsApp optionnel)' : 'Phone (WhatsApp optional)'}</label>
        <input id="phone" class="input" placeholder="+33...">
        <div class="sp"></div>
        <label class="row" style="gap:8px;align-items:center">
          <input id="waOpt" type="checkbox"> <span class="muted">${lang==='fr' ? 'Je souhaite recevoir les mises à jour sur WhatsApp' : 'Send me updates on WhatsApp'}</span>
        </label>

        <div class="sp"></div>
        <div class="card" style="padding:12px;background:#fff">
          <div style="font-weight:800">${lang==='fr' ? 'Choisir un mode de paiement' : 'Choose a payment method'}</div>
          <div class="sp"></div>
          <button id="payStripe" class="btn btnPrimary" style="width:100%">${lang==='fr' ? 'Payer par carte (Stripe)' : 'Pay by Card (Stripe)'}</button>
          <div class="sp"></div>
          <button id="payPaypal" class="btn" style="width:100%">${lang==='fr' ? 'Payer avec PayPal' : 'Pay with PayPal'}</button>
          <div class="sp"></div>
          <div class="muted" style="font-size:12px">
            ${lang==='fr' ? 'Aucune donnée de carte n’est stockée sur nos serveurs.' : 'No card data is stored on our servers.'}
          </div>
        </div>

      </div>

      <div class="card" style="padding:16px;height:fit-content">
        <div style="font-weight:900;font-size:18px">${lang==='fr' ? 'Votre commande' : 'Your order'}</div>
        <div class="sp"></div>
        ${itemsHtml}
        <div class="sp"></div>
        <div class="row" style="justify-content:space-between"><span class="muted">${lang==='fr' ? 'Total' : 'Total'}</span><strong style="font-size:18px">${money(subtotalCents,currency)}</strong></div>
        <div class="sp"></div>
        <div class="muted" style="font-size:12px">${lang==='fr' ? 'Livraison et taxes calculées après paiement (v1).': 'Shipping & taxes calculated after payment (v1).'} </div>
      </div>
    </div>
  `;

  function persistEmail(){
    const c = getCart();
    c.email = qs('#email').value.trim();
    setCart(c);
  }

  async function callPay(endpoint){
    persistEmail();
    const email = qs('#email').value.trim();
    if(!email){
      alert(lang==='fr' ? 'Veuillez saisir un email.' : 'Please enter your email.');
      return;
    }
    const payload = {
      lang,
      currency,
      email,
      phone: qs('#phone').value.trim(),
      whatsapp_opt_in: qs('#waOpt').checked,
      items: cart.items.map(it => ({
        slug: it.slug,
        code: it.code,
        qty: it.qty,
        size: it.size
      }))
    };
    const res = await fetch(endpoint, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    if(!res.ok){
      const t = await res.text();
      alert((lang==='fr' ? 'Erreur: ' : 'Error: ') + t);
      return;
    }
    const data = await res.json();
    if(data.url) location.href = data.url;
    else alert(lang==='fr' ? 'Réponse de paiement invalide.' : 'Invalid payment response.');
  }

  qs('#payStripe').addEventListener('click', ()=> callPay('/api/stripe/checkout'));
  qs('#payPaypal').addEventListener('click', ()=> callPay('/api/paypal/order'));
}

window.addEventListener('DOMContentLoaded', ()=>{
  route().catch(err=>{
    console.error(err);
    const box = document.createElement('div');
    box.className='container';
    box.style.padding='24px';
    box.innerHTML = `<div class="card" style="padding:16px"><strong>ALTURA</strong><div class="sp"></div><div class="muted">${err.message}</div></div>`;
    document.body.appendChild(box);
  });
});
