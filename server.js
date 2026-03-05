const express = require('express');
const path = require('path');
const figurinesRouter = require('./src/routes/figurines');
const authRouter = require('./src/routes/auth');
const ordersRouter = require('./src/routes/orders');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes API
app.use('/api/figurines', figurinesRouter);
app.use('/api/auth', authRouter);
app.use('/api/orders', ordersRouter);

// Route URLs propres (SEO)
app.get('/figurines/:nom', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'figurine.html'));
});
app.get('/boutique', (req, res) => res.sendFile(path.join(__dirname, 'public', 'boutique.html')));
app.get('/lore', (req, res) => res.sendFile(path.join(__dirname, 'public', 'lore.html')));
app.get('/faq', (req, res) => res.sendFile(path.join(__dirname, 'public', 'faq.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/checkout', (req, res) => res.sendFile(path.join(__dirname, 'public', 'checkout.html')));

// Fallback: serve index.html for any unknown route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

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
