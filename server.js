const express = require('express');
const path = require('path');
const figurinesRouter = require('./src/routes/figurines');
const authRouter = require('./src/routes/auth');
const ordersRouter = require('./src/routes/orders');

const app = express();
const PORT = 3000;
const BASE_DOMAIN = 'https://armurerie-space-maids.com';

// ── Middleware ────────────────────────────────────────────────
app.use(express.json());

// ── En-têtes de sécurité (SEO + protection) ──────────────────
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

// ── Helper : envoyer un fichier HTML ─────────────────────────
const sendPage = (file) => (req, res) =>
  res.sendFile(path.join(__dirname, 'public', file));

// ── Redirection 301 : /boutique → /figurines ─────────────────
app.get('/boutique', (req, res) => res.redirect(301, '/figurines'));
app.get('/fr/boutique', (req, res) => res.redirect(301, '/fr/figurines'));
app.get('/en/boutique', (req, res) => res.redirect(301, '/en/figurines'));

// ── Routes sans préfixe de langue (défaut = fr) ──────────────
app.get('/', sendPage('index.html'));
app.get('/figurines', sendPage('boutique.html'));
app.get('/figurines/:slug', sendPage('figurine.html'));
app.get('/lore', sendPage('lore.html'));
app.get('/faq', sendPage('faq.html'));
app.get('/login', sendPage('login.html'));
app.get('/checkout', sendPage('checkout.html'));

// ── Routes avec préfixe /fr ───────────────────────────────────
app.get('/fr', sendPage('index.html'));
app.get('/fr/', sendPage('index.html'));
app.get('/fr/figurines', sendPage('boutique.html'));
app.get('/fr/figurines/:slug', sendPage('figurine.html'));
app.get('/fr/lore', sendPage('lore.html'));
app.get('/fr/faq', sendPage('faq.html'));
app.get('/fr/login', sendPage('login.html'));
app.get('/fr/checkout', sendPage('checkout.html'));

// ── Routes avec préfixe /en ───────────────────────────────────
app.get('/en', sendPage('index.html'));
app.get('/en/', sendPage('index.html'));
app.get('/en/figurines', sendPage('boutique.html'));
app.get('/en/figurines/:slug', sendPage('figurine.html'));
app.get('/en/lore', sendPage('lore.html'));
app.get('/en/faq', sendPage('faq.html'));
app.get('/en/login', sendPage('login.html'));
app.get('/en/checkout', sendPage('checkout.html'));

// ── Fallback ──────────────────────────────────────────────────
app.get('*', sendPage('index.html'));

app.listen(PORT, () => {
  console.log(`
  █████████████████████████████████████████████████
  █                                               █
  █   ADEPTUS MECHANICUS — SERVEUR ACTIF          █
  █   Port: ${PORT}  ✦  WARHAMMER SPACE MAIDS ✦  █
  █                                               █
  █████████████████████████████████████████████████
  `);
});
