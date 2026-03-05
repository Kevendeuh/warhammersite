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

// Fallback: serve index.html for any unknown route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`
  ██████████████████████████████████████████
  █                                        █
  █   ADEPTUS MECHANICUS — SERVEUR ACTIF   █
  █   Port: ${PORT}  ✦  WARHAMMER SPACE MAIDS ✦  █
  █                                        █
  ██████████████████████████████████████████
  `);
});
