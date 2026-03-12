/* ============================================================
   SHOP.JS — Boutique Space Maids (Vanilla JS)
   Compatible SSR : les cartes sont en HTML statique,
   ce fichier gère uniquement le panier et le mini-drawer.
   ============================================================ */

// ── Langue détectée depuis l'URL ──────────────────────────────
const LANG = window.location.pathname.startsWith('/en') ? 'en' : 'fr';

// ── Shared Utilities ─────────────────────────────────────────
function showToast(msg, icon = '🎀') {
  const toast = document.getElementById('toast');
  const msgEl = document.getElementById('toast-msg');
  const iconEl = document.getElementById('toast-icon');
  if (!toast) return;
  msgEl.textContent = msg;
  iconEl.textContent = icon;
  toast.classList.add('show');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => toast.classList.remove('show'), 3200);
}

// ── Cart State ────────────────────────────────────────────────
const CART_KEY = 'sm_cart';

function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch { return []; }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateBadge();
  renderMiniCart();
}

function addToCart(figurine) {
  const cart = getCart();
  const existing = cart.find(i => i.id === figurine.id);
  if (existing) {
    existing.quantite += 1;
  } else {
    cart.push({
      id: figurine.id,
      nom: figurine.nom,
      image_url: figurine.image_url,
      prix_credits: figurine.prix_credits,
      quantite: 1
    });
  }
  saveCart(cart);
}

function getTotalItems() {
  return getCart().reduce((sum, i) => sum + i.quantite, 0);
}

function getTotalCredits() {
  return getCart().reduce((sum, i) => sum + i.prix_credits * i.quantite, 0);
}

function formatPrice(credits) {
  return credits.toLocaleString('fr-FR') + ' ₵';
}

function updateBadge() {
  const badge = document.getElementById('cart-badge');
  if (!badge) return;
  const total = getTotalItems();
  badge.textContent = total;
  if (total > 0) {
    badge.classList.add('visible');
    badge.classList.add('bump');
    setTimeout(() => badge.classList.remove('bump'), 300);
  } else {
    badge.classList.remove('visible');
  }
}

// ── Mini Cart Drawer ──────────────────────────────────────────
function renderMiniCart() {
  const body = document.getElementById('mini-cart-body');
  const totalEl = document.getElementById('mini-cart-total');
  const goBtn = document.getElementById('mini-cart-go');
  if (!body) return;

  const cart = getCart();
  body.innerHTML = '';

  if (cart.length === 0) {
    body.innerHTML = `
      <div class="mini-cart-empty">
        <span aria-hidden="true">🐾</span>
        <p>${LANG === 'en' ? 'The Drop Pod is empty.' : 'Le Drop Pod est vide.'}</p>
      </div>`;
    if (totalEl) totalEl.textContent = '0 ₵';
    if (goBtn) goBtn.style.display = 'none';
    return;
  }

  if (goBtn) goBtn.style.display = '';

  cart.forEach(item => {
    const row = document.createElement('div');
    row.className = 'mini-cart-item';
    row.innerHTML = `
      <img src="${item.image_url}" alt="${item.nom}" onerror="this.style.opacity='0.3'" />
      <div class="mini-cart-item-info">
        <p class="mini-cart-item-name">${item.nom}</p>
        <p class="mini-cart-item-detail">${item.quantite} × ${item.prix_credits.toLocaleString('fr-FR')} ₵</p>
      </div>
      <button class="mini-cart-remove" data-id="${item.id}" type="button" aria-label="Retirer ${item.nom}">✕</button>
    `;
    body.appendChild(row);
  });

  if (totalEl) totalEl.textContent = formatPrice(getTotalCredits());
}

function openMiniCart() {
  const drawer = document.getElementById('mini-cart');
  const overlay = document.getElementById('mini-cart-overlay');
  const btn = document.getElementById('nav-cart-btn');
  renderMiniCart();
  drawer?.classList.add('open');
  overlay?.classList.add('show');
  btn?.setAttribute('aria-expanded', 'true');
  drawer?.setAttribute('aria-hidden', 'false');
}

function closeMiniCart() {
  const drawer = document.getElementById('mini-cart');
  const overlay = document.getElementById('mini-cart-overlay');
  const btn = document.getElementById('nav-cart-btn');
  drawer?.classList.remove('open');
  overlay?.classList.remove('show');
  btn?.setAttribute('aria-expanded', 'false');
  drawer?.setAttribute('aria-hidden', 'true');
}

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  updateBadge();

  // Lien nav auth affiché si connecté
  const user = (() => { try { return JSON.parse(localStorage.getItem('sm_user')); } catch { return null; } })();
  if (user) {
    const navAuth = document.getElementById('nav-login');
    if (navAuth) { navAuth.textContent = `👤 ${user.prenom}`; }
  }

  // ── Boutons SSR "Ajouter au panier" dans la grille ────────
  document.querySelectorAll('.btn-add[data-id]').forEach(btn => {
    const fig = {
      id: btn.dataset.id,
      nom: btn.dataset.nom,
      image_url: btn.dataset.image,
      prix_credits: parseInt(btn.dataset.prix, 10)
    };

    const updateState = () => {
      const inCart = getCart().some(i => i.id === fig.id);
      btn.classList.toggle('added', inCart);
      btn.textContent = inCart ? '✓ Dans le Pod' : '🐾 Drop Pod';
      btn.setAttribute('aria-label', inCart
        ? (LANG === 'en' ? 'Already in Drop Pod' : 'Figurine déjà dans le Drop Pod')
        : (LANG === 'en' ? `Add ${fig.nom} to Drop Pod` : `Ajouter ${fig.nom} au Drop Pod`)
      );
    };

    updateState();

    btn.addEventListener('click', () => {
      addToCart(fig);
      updateState();
      showToast(`${fig.nom} ${LANG === 'en' ? 'added to Drop Pod!' : 'ajouté au Drop Pod !'}`, '🐾');
      openMiniCart();
    });
  });

  // ── Mini cart drawer events ───────────────────────────────
  document.getElementById('nav-cart-btn')?.addEventListener('click', () => {
    const drawer = document.getElementById('mini-cart');
    if (drawer?.classList.contains('open')) closeMiniCart();
    else openMiniCart();
  });

  document.getElementById('mini-cart-close')?.addEventListener('click', closeMiniCart);
  document.getElementById('mini-cart-overlay')?.addEventListener('click', closeMiniCart);

  document.getElementById('mini-cart-body')?.addEventListener('click', e => {
    const btn = e.target.closest('.mini-cart-remove');
    if (!btn) return;
    const id = btn.dataset.id;
    saveCart(getCart().filter(i => i.id !== id));
    // Re-sync le bouton dans la grille si présent
    const gridBtn = document.querySelector(`.btn-add[data-id="${id}"]`);
    if (gridBtn) { gridBtn.classList.remove('added'); gridBtn.textContent = '🐾 Drop Pod'; }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeMiniCart();
  });
});
