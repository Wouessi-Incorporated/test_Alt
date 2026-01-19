const fs = require('fs');
const path = require('path');

const root = path.join('/mnt/data/altura_turnkey/site');
const data = JSON.parse(fs.readFileSync(path.join(root,'products.json'),'utf8'));
const products = data.products;

function ensure(p){fs.mkdirSync(p,{recursive:true});}

function layout({lang, title, body, desc}){
  const langAttr = lang === 'fr' ? 'fr' : 'en';
  return `<!doctype html>
<html lang="${langAttr}">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${escapeHtml(title)}</title>
  ${desc ? `<meta name="description" content="${escapeAttr(desc)}"/>` : ''}
  <link rel="stylesheet" href="/assets/styles.css"/>
  <script defer src="/assets/app.js"></script>
</head>
<body data-lang="${lang}">
${body}
</body>
</html>`;
}

function escapeHtml(s){return String(s).replace(/[&<>]/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;' }[m]));}
function escapeAttr(s){return String(s).replace(/"/g,'&quot;');}

for (const lang of ['en','fr']){
  for (const p of products){
    const dir = path.join(root, lang, 'p', p.slug);
    ensure(dir);
    const name = lang === 'fr' ? p.name_fr : p.name_en;
    const tagline = lang === 'fr' ? p.tagline_fr : p.tagline_en;
    const desc = lang === 'fr' ? p.description_fr : p.description_en;

    const navWomen = lang === 'fr' ? 'Femme' : 'Women';
    const navMen = lang === 'fr' ? 'Homme' : 'Men';
    const langSwitch = lang === 'fr' ? 'EN' : 'FR';
    const langTarget = lang === 'fr' ? '/en' : '/fr';

    const body = `
<header class="header">
  <div class="container inner">
    <a class="brand" href="/${lang}/">ALTURA</a>
    <nav class="nav">
      <a href="/${lang}/women/">Shop ${navWomen}</a>
      <a href="/${lang}/men/">Shop ${navMen}</a>
      <a class="pill" href="${langTarget}${p.path_root || '/'}" data-lang-toggle>${langSwitch}</a>
      <a class="pill" href="/${lang}/checkout/" data-cart-link>Cart (<span data-cart-count>0</span>)</a>
    </nav>
  </div>
</header>

<div class="container">
  <div class="sp"></div>
  <div class="grid" style="grid-template-columns:1.1fr .9fr;align-items:start">
    <div class="card">
      <div class="gallery">
        <img alt="${escapeAttr(name)}" src="/assets/products/${p.code}.jpg" />
      </div>
      <div style="padding:16px">
        <div class="kicker">${p.gender === 'women' ? (lang==='fr'?'Femme':'Women') : (lang==='fr'?'Homme':'Men')} • ${p.category === 'shoes' ? (lang==='fr'?'Chaussures':'Shoes') : (lang==='fr'?'Sacs':'Bags')}</div>
        <h1 class="h1">${escapeHtml(name)}</h1>
        <div class="muted" style="font-size:18px">${escapeHtml(tagline)}</div>
      </div>
    </div>

    <div class="card" style="padding:16px">
      <div class="trust">
        <div class="trust-item">🔒 ${lang==='fr'?'Paiement sécurisé':'Secure payment'}</div>
        <div class="trust-item">✅ ${lang==='fr'?'Échanges faciles':'Easy exchanges'}</div>
        <div class="trust-item">📏 ${lang==='fr'?'Garantie “Tall-fit”':'Tall-fit guarantee'}</div>
      </div>
      <div class="sp"></div>
      <div style="display:flex;justify-content:space-between;align-items:baseline">
        <div class="kicker">${lang==='fr'?'Prix':'Price'}</div>
        <div class="h2" data-price data-code="${p.code}"></div>
      </div>

      ${p.sizes && p.sizes.length ? `
      <div class="sp"></div>
      <div class="kicker">${lang==='fr'?'Tailles disponibles':'Available sizes'}</div>
      <div class="sizes" data-size-picker data-code="${p.code}">
        ${p.sizes.map(s=>`<button type="button" class="size" data-size="${s}">${s}</button>`).join('')}
      </div>
      ` : ''}

      <div class="sp"></div>
      <div class="cta-row">
        <button class="btn" data-buy-now data-code="${p.code}">${lang==='fr'?'Acheter maintenant':'Buy now'}</button>
        <button class="btn secondary" data-add-to-cart data-code="${p.code}">${lang==='fr'?'Ajouter au panier':'Add to cart'}</button>
      </div>

      <div class="sp"></div>
      <div class="card" style="padding:12px;background:#fff">
        <div class="kicker">${lang==='fr'?'Pourquoi il existe':'Why it exists'}</div>
        <div>${escapeHtml(lang==='fr'?p.why_fr:p.why_en)}</div>
      </div>

      <div class="sp"></div>
      <div class="kicker">${lang==='fr'?'Points clés':'Key features'}</div>
      <ul class="list">
        ${(lang==='fr'?p.features_fr:p.features_en).map(x=>`<li>✔ ${escapeHtml(x)}</li>`).join('')}
      </ul>

      <div class="sp"></div>
      <div class="kicker">${lang==='fr'?'Inclusivité':'Inclusivity'}</div>
      <div class="muted">${lang==='fr'?
        'Design pensé pour les personnes grandes — avec des modèles de différentes origines (africaines, européennes, arabes, chinoises, hispaniques).'
        :
        'Designed for tall bodies — featuring tall models across backgrounds (Black/African, White/European, Arab, Chinese/East Asian, Hispanic/Latino).'
      }</div>
    </div>
  </div>

  <div class="sp"></div>
  <div class="card" style="padding:16px">
    <div class="kicker">${lang==='fr'?'Porté par des modèles grands':'Worn by tall models'}</div>
    <div class="grid" style="grid-template-columns:repeat(4,1fr);gap:12px">
      <img class="img" alt="Tall model" src="/assets/models/m1.jpg" />
      <img class="img" alt="Tall model" src="/assets/models/m2.jpg" />
      <img class="img" alt="Tall model" src="/assets/models/m3.jpg" />
      <img class="img" alt="Tall model" src="/assets/models/m4.jpg" />
    </div>
  </div>

  <div class="sp"></div>
</div>
<footer class="footer">
  <div class="container">
    <div class="grid" style="grid-template-columns:repeat(4,1fr)">
      <div><strong>ALTURA</strong><div class="muted">${lang==='fr'?data.brand.tagline_fr:data.brand.tagline_en}</div></div>
      <div><a href="/${lang}/support/">${lang==='fr'?'Support':'Support'}</a></div>
      <div><a href="/${lang}/returns/">${lang==='fr'?'Retours':'Returns'}</a></div>
      <div><a href="/${lang}/privacy/">${lang==='fr'?'Confidentialité':'Privacy'}</a></div>
    </div>
  </div>
</footer>
`;

    const html = layout({lang, title: `${name} — ALTURA`, body, desc});
    fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
  }
}

console.log('Generated product pages.');
