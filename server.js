const express = require('express');
const path = require('path');
const fs = require('fs');
const figurinesRouter = require('./src/routes/figurines');
const authRouter = require('./src/routes/auth');
const ordersRouter = require('./src/routes/orders');

const app = express();
const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

// ── Middleware ────────────────────────────────────────────────
app.use(express.json());

// ── En-têtes de sécurité ──────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self'; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data:; " +
    "frame-src https://www.youtube.com; " +
    "connect-src 'self';"
  );
  next();
});

// ── Fichiers statiques ────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── Routes API ────────────────────────────────────────────────
app.use('/api/figurines', figurinesRouter);
app.use('/api/auth', authRouter);
app.use('/api/orders', ordersRouter);

// ── Utilitaires ───────────────────────────────────────────────
function slugify(text) {
  return text.toString().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-').replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-').replace(/^-+/, '').replace(/-+$/, '');
}

function getFigurines() {
  const dbPath = path.join(__dirname, 'data', 'db.json');
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  return db.figurines || [];
}

function starsHtml(avg, count, lang) {
  if (!avg) return '';
  const full = Math.round(avg);
  const stars = '★'.repeat(full) + '☆'.repeat(5 - full);
  const label = lang === 'en'
    ? `${avg.toFixed(1)}/5 — ${count} review${count > 1 ? 's' : ''}`
    : `${avg.toFixed(1)}/5 — ${count} avis`;
  return `<div class="card-rating-wrap"><span class="card-rating" title="${label}" aria-label="${label}">${stars} <small>${avg.toFixed(1)}</small></span></div>`;
}

function renderFigurineCard(fig, lang) {
  const slug = slugify(fig.nom);
  const avgNote = fig.commentaires && fig.commentaires.length > 0
    ? fig.commentaires.reduce((s, c) => s + c.note, 0) / fig.commentaires.length
    : null;
  const count = fig.commentaires ? fig.commentaires.length : 0;
  const isLowStock = fig.stock <= 5;
  const detailUrl = `/${lang}/figurines/${slug}`;
  const addLabel = lang === 'en'
    ? `Add ${fig.nom} to Drop Pod`
    : `Ajouter ${fig.nom} au Drop Pod`;

  return `
  <article class="card" role="listitem" aria-label="${fig.nom}" data-fig-id="${fig.id}">
    <a href="${detailUrl}" class="card-img-wrap" aria-label="Voir les détails de ${fig.nom}">
      <img src="${fig.image_url}" alt="${fig.nom} — figurine Warhammer 40K Space Maids" loading="lazy" />
      <span class="card-stock-badge ${isLowStock ? 'badge-low' : 'badge-ok'}" aria-label="Stock: ${fig.stock}">
        ${isLowStock ? '⚠ ' + fig.stock + ' restants' : '✦ En stock'}
      </span>
    </a>
    <div class="card-body">
      <h3 class="card-title"><a href="${detailUrl}" style="color:inherit;text-decoration:none;">${fig.nom}</a></h3>
      ${starsHtml(avgNote, count, lang)}
      <p class="card-lore">${fig.description_lore}</p>
      <div class="card-footer">
        <div class="card-price">
          <span class="currency">₵</span>
          <span>${fig.prix_credits.toLocaleString('fr-FR')}</span>
          <span class="unit">crédits imp.</span>
        </div>
        <button
          class="btn-add"
          data-id="${fig.id}"
          data-nom="${fig.nom}"
          data-image="${fig.image_url}"
          data-prix="${fig.prix_credits}"
          aria-label="${addLabel}"
          type="button"
        >
          🐾 Drop Pod
        </button>
      </div>
    </div>
  </article>`;
}

// ── Template HTML commun ──────────────────────────────────────
function navHtml(lang, activePage) {
  const pages = {
    accueil: { fr: '/', en: '/en/', label: lang === 'en' ? 'Home' : 'Accueil' },
    figurines: { fr: '/fr/figurines', en: '/en/figurines', label: lang === 'en' ? 'Miniatures' : 'Figurines' },
    faq: { fr: '/fr/faq', en: '/en/faq', label: 'FAQ' },
    lore: { fr: '/fr/lore', en: '/en/lore', label: 'Lore' },
    login: { fr: '/fr/login', en: '/en/login', label: lang === 'en' ? 'Login' : 'Connexion' },
  };

  const links = Object.entries(pages).map(([key, p]) => {
    const href = lang === 'en' ? p.en : p.fr;
    const active = activePage === key ? ' class="active"' : '';
    return `<li><a href="${href}" id="nav-${key}"${active}>${p.label}</a></li>`;
  }).join('\n        ');

  const otherLang = lang === 'en' ? 'fr' : 'en';
  const otherHref = lang === 'en' ? '/fr/' : '/en/';
  const langLabel = lang === 'en' ? '🇫🇷 FR' : '🇬🇧 EN';

  return `<nav class="nav" role="navigation" aria-label="Navigation principale">
    <div class="nav-inner">
      <a href="/${lang === 'en' ? 'en' : 'fr'}/" class="nav-logo" aria-label="Accueil Armurerie Impériale">
        <span class="logo-sigil" aria-hidden="true">⚙</span>
        <span>
          ARMURERIE IMPÉRIALE
          <span class="subtitle">Space Maids Division ✦ 40.000</span>
        </span>
      </a>
      <ul class="nav-links" role="list">
        ${links}
        <li><a href="#orders-section" id="nav-orders" style="display:none">${lang === 'en' ? 'My Orders' : 'Mes Commandes'}</a></li>
      </ul>
      <a href="${otherHref}" class="btn-lang" aria-label="Changer de langue" title="Switch to ${otherLang.toUpperCase()}">${langLabel}</a>
      <button class="nav-cart" id="nav-cart-btn" type="button" aria-label="Mon Drop Pod (panier)" aria-expanded="false" aria-controls="mini-cart">
        🐾 Drop Pod
        <span class="cart-badge" id="cart-badge" aria-live="polite">0</span>
      </button>
    </div>
  </nav>`;
}

function miniCartHtml() {
  return `<div id="mini-cart-overlay" aria-hidden="true"></div>
  <aside id="mini-cart" role="dialog" aria-modal="true" aria-label="Aperçu du Drop Pod" aria-hidden="true">
    <div class="mini-cart-header">
      <h2>🐾 Drop Pod</h2>
      <button class="mini-cart-close" id="mini-cart-close" type="button" aria-label="Fermer le panier">✕</button>
    </div>
    <div class="mini-cart-body" id="mini-cart-body"></div>
    <div class="mini-cart-footer" id="mini-cart-footer">
      <div class="mini-cart-total"><span>Total :</span><span id="mini-cart-total">0 ₵</span></div>
      <a href="/checkout" class="btn btn-strike" id="mini-cart-go">☄️ Voir le Drop Pod complet</a>
    </div>
  </aside>
  <div class="toast" id="toast" role="alert" aria-live="assertive">
    <span class="toast-icon" id="toast-icon"></span>
    <span id="toast-msg"></span>
  </div>`;
}

function footerHtml() {
  return `<footer class="footer" role="contentinfo">
    <div class="container">
      <span class="footer-sigil" aria-hidden="true">⚙</span>
      <div class="footer-divider"><span>✦</span></div>
      <p class="footer-title">ADEPTUS MECHANICUS — ARMURERIE IMPÉRIALE</p>
      <p class="footer-copy">© M41.000 — Tous droits réservés par l'Omnissiah.</p>
    </div>
  </footer>`;
}

function hreflangLinks(path_fr, path_en) {
  return `
  <link rel="canonical" href="${BASE_URL}${path_fr}" />
  <link rel="alternate" hreflang="fr" href="${BASE_URL}${path_fr}" />
  <link rel="alternate" hreflang="en" href="${BASE_URL}${path_en}" />
  <link rel="alternate" hreflang="x-default" href="${BASE_URL}${path_fr}" />`;
}

// ── PAGE : Accueil ────────────────────────────────────────────
function renderIndex(lang) {
  const title = lang === 'en'
    ? 'Imperial Armory Space Maids — Warhammer 40K Miniatures'
    : 'Armurerie Impériale Space Maids — Figurines Warhammer 40K';
  const desc = lang === 'en'
    ? 'Discover the Imperial Armory Space Maids: elite Warhammer 40K miniatures with roses and bows. Apothecaries, Terminators, Primarch Nekona and more. Imperial credits accepted.'
    : 'Découvrez l\'Armurerie Impériale Space Maids : boutique de figurines Warhammer 40K d\'élite ornées de roses et de nœuds. Apothicaires, Terminators, Primarch Nekona et bien plus. Crédits impériaux acceptés.';

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <meta name="description" content="${desc}" />
  <meta name="keywords" content="figurines Warhammer 40K, Space Maids, figurines collection, Primarch Nekona, Adeptus Mechanicus" />
  ${hreflangLinks('/fr/', '/en/')}
  <link rel="stylesheet" href="/css/style.css" />
</head>
<body>
  ${navHtml(lang, 'accueil')}
  <header class="hero" role="banner">
    <div class="container">
      <p class="hero-tag">✦ Archives de l'Adeptus Figurinae ✦</p>
      <h1>ARMURERIE <span class="pink">SPACE MAIDS</span></h1>
      <p class="hero-sub">Terminal de Commande Impériale — Secteur : Figurines d'Élite<br><em>Que l'Empereur guide vos acquisitions</em></p>
      <blockquote class="hero-lore" aria-label="Citation du lore">
        "Elles combattent avec une grâce implacable, leurs tabliers immaculés résistant à tout plasma bolt.
        On murmure dans les ruches que leurs nœuds contiennent des micro-réacteurs à fusion. L'Inquisition a cessé d'enquêter. Par prudence."
        <br>— Extrait du Codex Astartes Adorabilis, Tome VII
      </blockquote>
    </div>
  </header>
  <hr class="gold-rule" />
  <main id="main-content" class="shop-section">
    <div class="container">
      <div class="section-header">
        <h2>⚜ LE PRIMARCH PERDU ⚜</h2>
        <p>Hérésie selon l'Inquisition, Révélation selon d'autres. L'histoire de Nekona l'Éternelle.</p>
      </div>
      <div style="background: var(--bg-card); border: 1px solid rgba(244, 167, 195, 0.3); border-radius: var(--radius-md); padding: 2.5rem; max-width: 800px; margin: 0 auto;">
        <p style="color: var(--text-secondary); margin-bottom: 1.5rem; line-height: 1.8;">
          Les archives impériales officielles comptent 18 légions de Space Marines. Toutefois, des rumeurs persistantes dans les bas-fonds des cités-ruches évoquent une mystérieuse 19ème Légion, composée exclusivement de redoutables guerrières en armures énergétiques pastel.
        </p>
        <h3 style="font-family: var(--font-girly); font-size: 2.5rem; color: var(--accent-pink); margin-bottom: 1rem; text-align: center; text-shadow: 0 0 15px var(--glow-pink);">Nekona, la Gracieuse</h3>
        <p style="color: var(--text-secondary); margin-bottom: 1.5rem; line-height: 1.8;">
          Aujourd'hui, son Chapitre non-sanctionné — les <strong>Space Maids</strong> — repousse vaillamment les ténèbres du Chaos à grands coups d'escouades ornées de nœuds et de laçages en ceramite.
        </p>
        <div style="margin: 2.5rem 0; text-align: center;">
          <iframe width="100%" height="400" src="https://www.youtube.com/embed/_2VmThXeSjY?si=TagIS4XULDYTE-Cu"
            title="Transmission Vox des Archives de Nekona" frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerpolicy="strict-origin-when-cross-origin" allowfullscreen
            style="max-width: 100%; border-radius: var(--radius-md); border: 1px solid var(--border-pink);"></iframe>
        </div>
        <div style="text-align: center; margin-top: 2rem;">
          <a href="/${lang}/figurines" class="btn btn-pink">${lang === 'en' ? 'View Miniature Catalogue' : 'Voir le Catalogue des figurines'}</a>
        </div>
      </div>
    </div>
  </main>
  ${footerHtml()}
  ${miniCartHtml()}
  <script src="/js/shop.js"></script>
</body>
</html>`;
}

// ── PAGE : Catalogue figurines (SSR) ─────────────────────────
function renderCatalogue(lang) {
  const figurines = getFigurines();
  const title = lang === 'en'
    ? 'Warhammer 40K Space Maids Miniatures Catalogue — Imperial Armory'
    : 'Catalogue de Figurines Space Maids Warhammer 40K — Armurerie Impériale';
  const desc = lang === 'en'
    ? 'Browse the complete Space Maids Warhammer 40K miniatures catalogue: Apothecaries, Terminators, Primarch Nekona, Drop Pod Restaurant and more. Buy with imperial credits.'
    : 'Parcourez le catalogue complet des figurines Space Maids Warhammer 40K : Apothicaires, Terminators, Primarch Nekona, Drop Pod Restaurant et bien plus. Achetez avec des crédits impériaux.';

  const cardsHtml = figurines.map(fig => renderFigurineCard(fig, lang)).join('\n');
  const h1 = lang === 'en' ? 'MINIATURES <span class="pink">CATALOGUE</span>' : 'CATALOGUE DE <span class="pink">FIGURINES</span>';
  const h2 = lang === 'en' ? '⚜ MINIATURES CATALOGUE ⚜' : '⚜ CATALOGUE DE FIGURINES ⚜';
  const sub = lang === 'en'
    ? 'Each unit is blessed by the Mechanicus. Limited stock. The Emperor protects... latecomers will not be refunded.'
    : 'Chaque unité est bénie par le Mécanicus. Stock limité. L\'Empereur protège... les retardataires ne seront pas remboursés.';

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <meta name="description" content="${desc}" />
  <meta name="keywords" content="figurines Space Maids, catalogue Warhammer 40K, acheter figurines 40K, Primarch Nekona, collection Space Marines" />
  ${hreflangLinks('/fr/figurines', '/en/figurines')}
  <link rel="stylesheet" href="/css/style.css" />
  <style>
    .card-img-wrap { cursor: pointer; display: block; }
    .card-rating-wrap { margin: 0.3rem 0 0.5rem; }
    .card-rating { font-size: 0.85rem; color: var(--accent-pink); }
    .card-rating small { color: var(--text-secondary); font-size: 0.75rem; margin-left: 0.25rem; }
  </style>
</head>
<body>
  ${navHtml(lang, 'figurines')}
  <header class="hero" role="banner">
    <div class="container">
      <p class="hero-tag">✦ Archives de l'Adeptus Figurinae ✦</p>
      <h1>${h1}</h1>
      <p class="hero-sub">Terminal de Commande Impériale — Secteur : Figurines d'Élite<br><em>Que l'Empereur guide vos acquisitions</em></p>
    </div>
  </header>
  <hr class="gold-rule" />
  <main id="main-content" class="shop-section">
    <div class="container">
      <div class="section-header">
        <h2>${h2}</h2>
        <p>${sub}</p>
      </div>
      <div class="figurine-grid" id="figurine-grid" role="list" aria-label="Grille de figurines">
        ${cardsHtml}
      </div>
    </div>
  </main>
  <div>
    <blockquote class="hero-lore" aria-label="Citation du lore">
      "Elles combattent avec une grâce implacable, leurs tabliers immaculés résistant à tout plasma bolt.
      On murmure dans les ruches que leurs nœuds contiennent des micro-réacteurs à fusion. L'Inquisition a cessé d'enquêter. Par prudence."
      <br>— Extrait du Codex Astartes Adorabilis, Tome VII
    </blockquote>
  </div>
  ${footerHtml()}
  ${miniCartHtml()}
  <script src="/js/shop.js"></script>
</body>
</html>`;
}

// ── PAGE : Détail figurine (SSR) ──────────────────────────────
function renderFigurineDetail(lang, slug) {
  const figurines = getFigurines();
  const fig = figurines.find(f => slugify(f.nom) === slug);

  if (!fig) return null;

  const avg = fig.commentaires && fig.commentaires.length > 0
    ? fig.commentaires.reduce((s, c) => s + c.note, 0) / fig.commentaires.length
    : null;
  const count = fig.commentaires ? fig.commentaires.length : 0;
  const fullStars = avg !== null ? Math.round(avg) : 0;
  const starsDisplay = '★'.repeat(fullStars) + '☆'.repeat(5 - fullStars);

  const reviewsHtml = fig.commentaires && fig.commentaires.length > 0
    ? fig.commentaires.map(c => {
      const cStars = '★'.repeat(c.note) + '☆'.repeat(5 - c.note);
      const dateStr = new Date(c.date).toLocaleDateString(lang === 'en' ? 'en-GB' : 'fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
      return `<div class="review-item">
          <div class="review-header">
            <span class="review-author">${c.auteur}</span>
            <span class="review-stars" aria-label="Note : ${c.note}/5">${cStars}</span>
            <span class="review-date">${dateStr}</span>
          </div>
          <p class="review-text">${c.texte}</p>
        </div>`;
    }).join('\n')
    : `<p class="no-reviews">${lang === 'en' ? 'No reviews yet.' : 'Aucun avis pour cette figurine.'}</p>`;

  const summaryLabel = lang === 'en'
    ? `Collector reviews (${count})`
    : `Avis des collectionneurs (${count})`;

  const title = lang === 'en'
    ? `${fig.nom} — Warhammer 40K Space Maids Miniature | Imperial Armory`
    : `${fig.nom} — Figurine Warhammer 40K Space Maids | Armurerie Impériale`;
  const desc = lang === 'en'
    ? `Buy the ${fig.nom} Space Maids Warhammer 40K miniature. ${fig.description_lore.substring(0, 120)}... Price: ${fig.prix_credits.toLocaleString()} imperial credits.`
    : `Achetez la figurine ${fig.nom} Space Maids Warhammer 40K. ${fig.description_lore.substring(0, 120)}... Prix : ${fig.prix_credits.toLocaleString('fr-FR')} crédits impériaux.`;

  const ratingHtml = avg !== null
    ? `<p id="detail-global-rating" aria-label="Note globale : ${avg.toFixed(1)}/5">
        <span style="color:var(--accent-pink); font-size:1.1rem; letter-spacing:1px;">${starsDisplay}</span>
        ${avg.toFixed(1)}/5 <small style="color:var(--text-secondary);">(${count} ${lang === 'en' ? 'reviews' : 'avis'})</small>
       </p>`
    : `<p id="detail-global-rating" style="color:var(--text-secondary); font-size:0.85rem;">${lang === 'en' ? 'No ratings yet.' : 'Pas encore de notes.'}</p>`;

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <meta name="description" content="${desc}" />
  <meta name="keywords" content="${fig.nom} Warhammer 40K, figurine Space Maids, collection 40K" />
  <link rel="canonical" href="${BASE_URL}/${lang}/figurines/${slug}" />
  <link rel="alternate" hreflang="fr" href="${BASE_URL}/fr/figurines/${slug}" />
  <link rel="alternate" hreflang="en" href="${BASE_URL}/en/figurines/${slug}" />
  <link rel="alternate" hreflang="x-default" href="${BASE_URL}/fr/figurines/${slug}" />
  <link rel="stylesheet" href="/css/style.css" />
  <style>
    .reviews-details { margin-top: 2rem; border-top: 1px solid rgba(201,168,76,0.2); padding-top: 1.5rem; }
    .reviews-summary { font-family: var(--font-gothic); font-size: 1rem; color: var(--text-gold); cursor: pointer; list-style: none; display: flex; align-items: center; gap: 0.6rem; padding: 0.5rem 0; user-select: none; }
    .reviews-summary::-webkit-details-marker { display: none; }
    .reviews-summary::before { content: '▶'; font-size: 0.7rem; transition: transform 0.25s ease; color: var(--accent-pink); }
    details[open] .reviews-summary::before { transform: rotate(90deg); }
    .reviews-list { margin-top: 1rem; display: flex; flex-direction: column; gap: 0.85rem; }
    .review-item { background: rgba(201,168,76,0.04); border: 1px solid rgba(201,168,76,0.15); border-radius: 6px; padding: 0.9rem 1.1rem; }
    .review-header { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.4rem; flex-wrap: wrap; }
    .review-author { font-family: var(--font-gothic); font-size: 0.85rem; color: var(--text-gold); }
    .review-stars { color: #f4a7c3; font-size: 0.9rem; letter-spacing: 1px; }
    .review-date { font-size: 0.72rem; color: var(--text-secondary); margin-left: auto; }
    .review-text { font-size: 0.85rem; color: var(--text-secondary); line-height: 1.55; }
    .no-reviews { color: var(--text-secondary); font-size: 0.85rem; font-style: italic; }
  </style>
</head>
<body>
  ${navHtml(lang, 'figurines')}
  <main id="main-content" class="shop-section">
    <div class="container" style="max-width: 900px;">
      <div style="background: var(--bg-card); border: 1px solid var(--border-gold); border-radius: var(--radius-md); overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.5);">
        <div style="display: flex; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 300px; background: var(--bg-void); border-right: 1px solid rgba(201,168,76,0.2);">
            <img src="${fig.image_url}" alt="${fig.nom} — figurine Warhammer 40K Space Maids" style="width: 100%; height: 100%; object-fit: contain;" />
          </div>
          <div style="flex: 1; min-width: 300px; padding: 3rem 2.5rem; display: flex; flex-direction: column;">
            <h1 id="detail-title" style="font-family: var(--font-gothic); font-size: 2.2rem; color: var(--text-gold); margin-bottom: 0.5rem; line-height: 1.2;">${fig.nom}</h1>
            <p id="detail-price" style="font-family: var(--font-girly); font-size: 2.2rem; color: var(--accent-pink); margin-bottom: 0.25rem;">${fig.prix_credits.toLocaleString('fr-FR')} ₵</p>
            ${ratingHtml}
            <p id="detail-desc" style="color: var(--text-secondary); font-size: 0.95rem; line-height: 1.7; flex-grow: 1; margin-bottom: 1.5rem;">${fig.description_lore}</p>
            <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
              <button class="btn btn-strike" id="detail-buy-btn" type="button"
                data-id="${fig.id}" data-nom="${fig.nom}" data-image="${fig.image_url}" data-prix="${fig.prix_credits}">
                🐾 ${lang === 'en' ? 'Add to Drop Pod' : 'Ajouter au Drop Pod'}
              </button>
              <a href="/${lang}/figurines" class="btn btn-outline" style="font-size: 0.95rem; padding: 0.4rem 1rem;">← ${lang === 'en' ? 'Continue shopping' : 'Continuer les achats'}</a>
            </div>
            <details class="reviews-details">
              <summary class="reviews-summary">${summaryLabel}</summary>
              <div class="reviews-list">${reviewsHtml}</div>
            </details>
          </div>
        </div>
      </div>
    </div>
  </main>
  ${footerHtml()}
  ${miniCartHtml()}
  <script src="/js/shop.js"></script>
  <script src="/js/figurine-ssr.js"></script>
</body>
</html>`;
}

// ── PAGE : FAQ ────────────────────────────────────────────────
function renderFaq(lang) {
  const title = lang === 'en'
    ? 'FAQ — Questions about Space Maids Warhammer 40K Miniatures | Imperial Armory'
    : 'FAQ — Questions sur les Figurines Space Maids Warhammer 40K | Armurerie Impériale';
  const desc = lang === 'en'
    ? 'All answers to your questions about Space Maids Warhammer 40K miniatures: orbital delivery, painting, loyalty to the Emperor, and more. Inquisition-approved answers.'
    : 'Toutes les réponses à vos questions sur les figurines Space Maids Warhammer 40K : livraison par frappe orbitale, peinture, fidélité à l\'Empereur, et bien plus. Réponses approuvées par l\'Inquisition.';

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <meta name="description" content="${desc}" />
  <meta name="keywords" content="FAQ figurines Warhammer, Space Maids questions, peinture figurines 40K" />
  ${hreflangLinks('/fr/faq', '/en/faq')}
  <link rel="stylesheet" href="/css/style.css" />
  <style>
    .faq-item { background: rgba(201,168,76,0.05); border: 1px solid rgba(201,168,76,0.2); border-radius: var(--radius-md); margin-bottom: 1rem; padding: 1.5rem; }
    .faq-q { font-family: var(--font-gothic); font-size: 1.2rem; color: var(--text-gold); margin-bottom: 0.5rem; }
    .faq-a { font-size: 0.9rem; color: var(--text-secondary); line-height: 1.6; }
  </style>
</head>
<body>
  ${navHtml(lang, 'faq')}
  <header style="padding: 2.5rem 1.5rem 0; text-align:center">
    <div class="container">
      <p class="hero-tag">✦ Registre des Interrogations Fréquentes ✦</p>
      <h1 style="font-size: clamp(1.5rem,3vw,2.5rem); margin-bottom: 0.5rem;">FOIRE AUX <span class="pink">QUESTIONS</span></h1>
      <h2 style="font-size: clamp(1rem,1.5vw,1.3rem); font-weight:normal; color:var(--text-secondary); margin-bottom:1rem;">
        ${lang === 'en' ? 'Inquisition-approved answers about our Warhammer 40K miniatures' : 'Les réponses agréées par l\'Inquisition sur nos figurines Warhammer 40K'}
      </h2>
    </div>
    <hr class="gold-rule" style="max-width:600px; margin:0 auto 1rem;">
  </header>
  <main id="main-content" class="shop-section">
    <div class="container" style="max-width: 800px;">
      <div style="margin-bottom: 2rem;">
        <div class="faq-item">
          <h3 class="faq-q">Où vont l'argent de mes crédits impériaux ?</h3>
          <p class="faq-a">Directement dans l'effort de guerre impérial ! Et accessoirement dans la production de tabliers de combat en cera-tissus renforcés et de nouvelles recettes de cookies réconfortants.</p>
        </div>
        <div class="faq-item">
          <h3 class="faq-q">Sont-elles fidèles à l'Empereur ?</h3>
          <p class="faq-a">Absolument ! Leur loyauté est sans faille. Toute rumeur prétendant qu'un primarch nommé Nekona aurait des oreilles de chat pour séduire les hérétiques est purement séditieuse et farouchement démentie.</p>
        </div>
        <div class="faq-item">
          <h3 class="faq-q">Comment fonctionne la frappe orbitale de livraison ?</h3>
          <p class="faq-a">Après validation du paiement (purement symbolique sur notre domaine test), un croiseur léger de classe "Tea Time" lance un drop pod renforcé qui s'écrase exactement aux coordonnées fournies. Les dommages collatéraux sur la voirie sont à votre charge.</p>
        </div>
        <div class="faq-item">
          <h3 class="faq-q">Où puis-je peindre mes figurines Space Maids ?</h3>
          <p class="faq-a">Partout, mais il est recommandé d'utiliser des teintes "Purity Pink" et "Clean White" pour l'approbation du Chapitre. L'ajout de marquages de Hello Kitty nécessite cependant une dérogation du Magos concerné.</p>
        </div>
      </div>
    </div>
  </main>
  ${footerHtml()}
  ${miniCartHtml()}
  <script src="/js/shop.js"></script>
</body>
</html>`;
}

// ── PAGE : Lore ───────────────────────────────────────────────
function renderLore(lang) {
  const title = lang === 'en'
    ? 'Warhammer 40K Lore — The Heresy of Nekona and the Space Maids | Imperial Armory'
    : 'Lore Warhammer 40K — L\'Hérésie de Nekona et les Space Maids | Armurerie Impériale';
  const desc = lang === 'en'
    ? 'Discover the lore of Warhammer 40K and the secret history of Primarch Nekona, founder of the Space Maids. Chronicles from the Great Crusade to the Indomitus Era.'
    : 'Découvrez le lore de Warhammer 40K et l\'histoire secrète du Primarch Nekona, fondatrice des Space Maids. Chroniques de la Grande Croisade à l\'Ère Indomitus, la légion oubliée révélée.';

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <meta name="description" content="${desc}" />
  <meta name="keywords" content="lore Warhammer 40K, Primarch Nekona, Space Maids histoire, Grande Croisade, Hérésie Horus, Ère Indomitus" />
  ${hreflangLinks('/fr/lore', '/en/lore')}
  <link rel="stylesheet" href="/css/style.css" />
</head>
<body>
  ${navHtml(lang, 'lore')}
  <section id="lore-universe" style="background: var(--bg-void); padding: 5rem 1rem; border-top: 1px solid var(--border-gold);">
    <div class="container" style="max-width: 900px;">
      <div class="section-header">
        <h1>⚜ CHRONIQUES D'UN PRIMARCH OUBLIÉ ⚜</h1>
        <h2 style="font-size: 1.2rem; font-weight:normal; color:var(--text-secondary);">Comprendre l'univers de <a href="https://omnis-bibliotheca.com/index.php/Accueil" target="_blank" rel="noopener noreferrer" style="color:var(--text-gold);text-decoration:underline;">Warhammer 40,000</a> et l'hérésie de Nekona l'Éternelle</h2>
      </div>
      <p style="color: var(--text-secondary); line-height: 1.8; margin-bottom: 3rem; text-align: justify;">
        L'univers de <a href="https://omnis-bibliotheca.com/index.php/Accueil" target="_blank" rel="noopener noreferrer" style="color: var(--text-gold); text-decoration: underline;">Warhammer 40,000</a>
        (ou WH40K) est un futur sombre et gothique où l'humanité, dirigée par la figure divine et cadavérique de l'<a
          href="https://omnis-bibliotheca.com/index.php/L%27Empereur_de_l%27Humanit%C3%A9" target="_blank"
          rel="noopener noreferrer" style="color: var(--text-gold); text-decoration: underline;">Empereur</a>, lutte
        perpétuellement pour sa survie face à des extraterrestres hostiles et aux dieux maléfiques du <a
          href="https://omnis-bibliotheca.com/index.php/Cat%C3%A9gorie:L%27Immaterium" target="_blank" rel="noopener noreferrer"
          style="color: var(--accent-pink); text-decoration: underline;">Warp</a>. L'histoire officielle a effacé toute
        trace de deux des vingt Primarchs originels. Nekona est souvent murmurée comme l'une d'entre eux...
      </p>
      <div style="border-left: 3px solid var(--accent-pink); padding-left: 2rem; margin-left: 1rem;">
        <div style="margin-bottom: 2.5rem; position: relative;">
          <span style="position: absolute; left: -2.85rem; top: 0; background: var(--bg-void); color: var(--accent-pink); font-size: 1.5rem;">✦</span>
          <h3 style="font-family: var(--font-gothic); color: var(--text-gold); margin-bottom: 0.5rem; font-size: 1.5rem;">M30 - La Grande Croisade et l'Effacement</h3>
          <p style="color: var(--text-secondary); line-height: 1.6; font-size: 0.95rem;">
            Lors de la <a href="https://omnis-bibliotheca.com/index.php/Grande_Croisade" target="_blank"
              rel="noopener noreferrer" style="color: var(--accent-pink); text-decoration: underline;">Grande Croisade</a>,
            visant à réunifier la galaxie, la Légion II menée par Nekona fut purgée des archives impériales. Les raisons officielles évoquent une déviance tactique grave impliquant de la dentelle et du thé parfumé en pleine zone d'assaut orbital.
          </p>
        </div>
        <div style="margin-bottom: 2.5rem; position: relative;">
          <span style="position: absolute; left: -2.85rem; top: 0; background: var(--bg-void); color: var(--accent-pink); font-size: 1.5rem;">✦</span>
          <h3 style="font-family: var(--font-gothic); color: var(--text-gold); margin-bottom: 0.5rem; font-size: 1.5rem;">M31 - L'Hérésie d'Horus : La neutralité silencieuse</h3>
          <p style="color: var(--text-secondary); line-height: 1.6; font-size: 0.95rem;">
            Durant la gigantesque guerre civile connue sous le nom d'<a
              href="https://omnis-bibliotheca.com/index.php/Cat%C3%A9gorie:H%C3%A9r%C3%A9sie_d%27Horus" target="_blank"
              rel="noopener noreferrer" style="color: var(--accent-pink); text-decoration: underline;">Hérésie d'Horus</a>,
            Nekona et ses guerrières sont restées introuvables. Des rumeurs stipulent qu'elles officiaient dans les ombres pour nettoyer littéralement les champs de bataille après les massacres des légionnaires renégats.
          </p>
        </div>
        <div style="position: relative;">
          <span style="position: absolute; left: -2.85rem; top: 0; background: var(--bg-void); color: var(--accent-pink); font-size: 1.5rem;">✦</span>
          <h3 style="font-family: var(--font-gothic); color: var(--text-gold); margin-bottom: 0.5rem; font-size: 1.5rem;">M41 - L'Ère Indomitus : Le Retour du Service</h3>
          <p style="color: var(--text-secondary); line-height: 1.6; font-size: 0.95rem;">
            Alors que la galaxie est fracturée en deux par la <a
              href="https://omnis-bibliotheca.com/index.php/Cat%C3%A9gorie:L%27Immaterium#La_Grande_Faille" target="_blank" rel="noopener noreferrer"
              style="color: var(--accent-pink); text-decoration: underline;">Grande Faille (Cicatrix Maledictum)</a>,
            Nekona réapparaît mystérieusement. Fondant officieusement son commandement de "Space Maids", elle déploie la colère de l'Imperium avec une propreté implacable aux côtés de la Croisade Indomitus.
          </p>
        </div>
      </div>
    </div>
  </section>
  ${footerHtml()}
  ${miniCartHtml()}
  <script src="/js/shop.js"></script>
</body>
</html>`;
}

// ── PAGE : Login ──────────────────────────────────────────────
function renderLogin(lang) {
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${lang === 'en' ? 'Login — Imperial Archives Space Maids Account' : 'Connexion aux Archives Impériales — Espace Compte Space Maids'}</title>
  <meta name="description" content="${lang === 'en' ? 'Log in to your Imperial Armory Space Maids account to access your Warhammer 40K miniature orders, history and imperial benefits.' : 'Connectez-vous à votre compte Armurerie Impériale Space Maids pour accéder à vos commandes de figurines Warhammer 40K, votre historique et vos avantages impériaux.'}" />
  <link rel="canonical" href="${BASE_URL}/${lang}/login" />
  <link rel="stylesheet" href="/css/style.css" />
</head>
<body>
  <nav class="nav" role="navigation" aria-label="Navigation principale">
    <div class="nav-inner">
      <a href="/${lang}/" class="nav-logo" aria-label="Retour à la boutique">
        <span class="logo-sigil" aria-hidden="true">⚙</span>
        <span>ARMURERIE IMPÉRIALE<span class="subtitle">Space Maids Division ✦ 40.000</span></span>
      </a>
      <a href="/${lang}/figurines" class="btn btn-outline" style="font-size:0.75rem;">← ${lang === 'en' ? 'Miniatures' : 'Figurines'}</a>
    </div>
  </nav>
  <main class="auth-page" id="main-content">
    <div class="auth-card fade-in">
      <div class="auth-header">
        <span class="auth-sigil" aria-hidden="true">🎀</span>
        <h1>ARCHIVES IMPÉRIALES</h1>
        <p>Identifiez-vous pour accéder aux archives de l'Adeptus Figurinae</p>
      </div>
      <div class="auth-tabs" role="tablist" aria-label="Connexion ou inscription">
        <button class="auth-tab active" id="tab-login" role="tab" aria-selected="true" aria-controls="panel-login" type="button">Connexion</button>
        <button class="auth-tab" id="tab-register" role="tab" aria-selected="false" aria-controls="panel-register" type="button">S'enrôler</button>
      </div>
      <div class="auth-form-panel active" id="panel-login" role="tabpanel" aria-labelledby="tab-login">
        <div class="auth-error" id="login-error" role="alert"></div>
        <div class="auth-success" id="login-success" role="status"></div>
        <form id="login-form" novalidate>
          <div class="form-group">
            <label class="form-label" for="login-email">Identifiant Imperial (Email)</label>
            <input class="form-input" type="email" id="login-email" name="email" placeholder="soldat@imperium.terra" autocomplete="email" required />
          </div>
          <div class="form-group">
            <label class="form-label" for="login-password">Code d'Accès</label>
            <input class="form-input" type="password" id="login-password" name="mot_de_passe" placeholder="••••••••" autocomplete="current-password" required />
          </div>
          <button class="btn btn-gold" type="submit" id="login-btn" style="width:100%; justify-content:center; margin-top:0.5rem;">SE CONNECTER AUX ARCHIVES</button>
        </form>
        <p style="text-align:center; font-size:0.75rem; color:var(--text-secondary); margin-top:1rem;">Pas encore enrôlé ? <a href="#" id="goto-register" style="color:var(--text-pink)">Rejoindre les rangs</a></p>
      </div>
      <div class="auth-form-panel" id="panel-register" role="tabpanel" aria-labelledby="tab-register">
        <div class="auth-error" id="register-error" role="alert"></div>
        <div class="auth-success" id="register-success" role="status"></div>
        <form id="register-form" novalidate>
          <div class="form-grid-2">
            <div class="form-group"><label class="form-label" for="reg-nom">Nom</label><input class="form-input" type="text" id="reg-nom" name="nom" placeholder="Ex: Chevalière" autocomplete="family-name" required /></div>
            <div class="form-group"><label class="form-label" for="reg-prenom">Prénom</label><input class="form-input" type="text" id="reg-prenom" name="prenom" placeholder="Ex: Nekona" autocomplete="given-name" required /></div>
          </div>
          <div class="form-group"><label class="form-label" for="reg-email">Email Impérial</label><input class="form-input" type="email" id="reg-email" name="email" placeholder="soldat@imperium.terra" autocomplete="email" required /></div>
          <div class="form-group"><label class="form-label" for="reg-adresse">Adresse de la Ruche</label><input class="form-input" type="text" id="reg-adresse" name="adresse_postale" placeholder="Niveau 42, Tour Est, Hive Primus..." autocomplete="street-address" /></div>
          <div class="form-group"><label class="form-label" for="reg-password">Code d'Accès</label><input class="form-input" type="password" id="reg-password" name="mot_de_passe" placeholder="Min. 6 caractères" autocomplete="new-password" required minlength="6" /></div>
          <button class="btn btn-pink" type="submit" id="register-btn" style="width:100%; justify-content:center; margin-top:0.5rem;">🌸 S'ENRÔLER DANS LES ARCHIVES</button>
        </form>
        <p style="text-align:center; font-size:0.75rem; color:var(--text-secondary); margin-top:1rem;">Déjà enrôlé ? <a href="#" id="goto-login" style="color:var(--text-gold)">Se connecter</a></p>
      </div>
    </div>
  </main>
  <div class="toast" id="toast" role="alert" aria-live="assertive"><span class="toast-icon" id="toast-icon"></span><span id="toast-msg"></span></div>
  <script src="/js/auth.js"></script>
</body>
</html>`;
}

// ── Routes ────────────────────────────────────────────────────

// Redirections root vers /fr/
app.get('/', (req, res) => res.redirect(301, '/fr/'));
app.get('/figurines', (req, res) => res.redirect(301, '/fr/figurines'));
app.get('/boutique', (req, res) => res.redirect(301, '/fr/figurines'));
app.get('/lore', (req, res) => res.redirect(301, '/fr/lore'));
app.get('/faq', (req, res) => res.redirect(301, '/fr/faq'));
app.get('/login', (req, res) => res.redirect(301, '/fr/login'));
app.get('/checkout', (req, res) => res.sendFile(path.join(__dirname, 'public', 'checkout.html')));
app.get('/fr/boutique', (req, res) => res.redirect(301, '/fr/figurines'));
app.get('/en/boutique', (req, res) => res.redirect(301, '/en/figurines'));

// Routes /fr/ et /en/
['fr', 'en'].forEach(lang => {
  app.get(`/${lang}/`, (req, res) => res.send(renderIndex(lang)));
  app.get(`/${lang}`, (req, res) => res.redirect(301, `/${lang}/`));
  app.get(`/${lang}/figurines`, (req, res) => res.send(renderCatalogue(lang)));
  app.get(`/${lang}/figurines/:slug`, (req, res) => {
    const html = renderFigurineDetail(lang, req.params.slug);
    if (!html) return res.status(404).send('<h1>Figurine introuvable</h1>');
    res.send(html);
  });
  app.get(`/${lang}/faq`, (req, res) => res.send(renderFaq(lang)));
  app.get(`/${lang}/lore`, (req, res) => res.send(renderLore(lang)));
  app.get(`/${lang}/login`, (req, res) => res.send(renderLogin(lang)));
  app.get(`/${lang}/checkout`, (req, res) => res.sendFile(path.join(__dirname, 'public', 'checkout.html')));
});

// Fallback
app.get('*', (req, res) => res.redirect(301, '/fr/'));

app.listen(PORT, () => {
  console.log(`
  █████████████████████████████████████████████████
  █                                               █
  █   ADEPTUS MECHANICUS — SERVEUR ACTIF          █
  █   Port: ${PORT}  ✦  WARHAMMER SPACE MAIDS ✦  █
  █   SSR: ACTIVÉ ✦ Hreflang: CORRIGÉ ✦          █
  █                                               █
  █████████████████████████████████████████████████
  `);
});
