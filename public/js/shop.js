/* ============================================================
   SHOP.JS — Boutique Space Maids (Vanilla JS)
   - Grille de figurines + ajout au panier
   - Mini cart drawer (tiroir latéral)
   ============================================================ */

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
            <p>Le Drop Pod est vide.</p>
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
          <img src="${item.image_url}" alt="${item.nom}"
               onerror="this.style.opacity='0.3'" />
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

// Modal logic has been moved to individual figurine pages

// ── Render figurine card ──────────────────────────────────────
function renderCard(fig, index) {
  const cart = getCart();
  const inCart = cart.some(i => i.id === fig.id);
  const isLowStock = fig.stock <= 5;

  const card = document.createElement('article');
  card.className = 'card stagger-in fade-in';
  card.style.setProperty('--stagger', index);
  card.setAttribute('role', 'listitem');
  card.setAttribute('aria-label', fig.nom);

  card.innerHTML = `
    <div class="card-img-wrap">
      <img src="${fig.image_url}" alt="${fig.nom}" loading="lazy"
           onerror="this.src='/images/placeholder.png'; this.alt='Image non disponible'" />
      <span class="card-stock-badge ${isLowStock ? 'badge-low' : 'badge-ok'}" aria-label="Stock: ${fig.stock}">
        ${isLowStock ? '⚠ ' + fig.stock + ' restants' : '✦ En stock'}
      </span>
    </div>
    <div class="card-body">
      <h3 class="card-title">${fig.nom}</h3>
      <p class="card-lore">${fig.description_lore}</p>
      <div class="card-footer">
        <div class="card-price">
          <span class="currency">₵</span>
          <span>${fig.prix_credits.toLocaleString('fr-FR')}</span>
          <span class="unit">crédits imp.</span>
        </div>
        <button
          class="btn-add ${inCart ? 'added' : ''}"
          id="add-btn-${fig.id}"
          data-id="${fig.id}"
          aria-label="${inCart ? 'Figurine déjà dans le Drop Pod' : 'Ajouter ' + fig.nom + ' au Drop Pod'}"
          type="button"
        >
          ${inCart ? '✓ Dans le Pod' : '🐾 Drop Pod'}
        </button>
      </div>
    </div>
  `;

  // Bouton ajouter au panier
  const btn = card.querySelector('.btn-add');
  btn.addEventListener('click', () => {
    addToCart(fig);
    btn.classList.add('added');
    btn.textContent = '✓ Dans le Pod';
    btn.setAttribute('aria-label', 'Figurine déjà dans le Drop Pod');
    showToast(`${fig.nom} ajouté au Drop Pod !`, '🐾');
    // Ouvrir automatiquement le mini-drawer
    openMiniCart();
  });

  // Clic sur l'image pour rediriger vers la page dédiée
  const imgWrap = card.querySelector('.card-img-wrap');
  if (imgWrap) {
    imgWrap.addEventListener('click', () => {
      sessionStorage.setItem('boutiqueScrollY', window.scrollY);
      const slug = fig.nom.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-').replace(/^-+/, '').replace(/-+$/, '');
      window.location.href = `/boutique/figurine/${slug}`;
    });
  }

  return card;
}

// ── Fetch & Render Figurines ──────────────────────────────────
async function loadFigurines() {
  const grid = document.getElementById('figurine-grid');
  const loading = document.getElementById('loading-state');

  if (!grid) return; // Si on n'est pas sur la page boutique, on ne charge rien

  try {
    const res = await fetch('/api/figurines');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const figurines = await res.json();

    if (loading) loading.remove();

    if (figurines.length === 0) {
      grid.innerHTML = `<div class="error-state">
        <p>⚠ Les archives sont vides. L'Omnissiah enquête.</p>
      </div>`;
      return;
    }

    figurines.forEach((fig, i) => grid.appendChild(renderCard(fig, i)));

    const scrollY = sessionStorage.getItem('boutiqueScrollY');
    if (scrollY) {
      setTimeout(() => {
        window.scrollTo({ top: parseInt(scrollY, 10), behavior: 'instant' });
        sessionStorage.removeItem('boutiqueScrollY');
      }, 50);
    }

  } catch (err) {
    console.error('Erreur chargement figurines:', err);
    if (loading) loading.remove();
    grid.innerHTML = `<div class="error-state">
      <p>⚠ ERREUR DE CONNEXION AUX ARCHIVES</p>
      <p style="font-size:0.8rem; color:var(--text-secondary); margin-top:0.5rem; font-family:var(--font-body)">
        ${err.message}<br>Assurez-vous que le serveur est lancé sur le port 3000.
      </p>
    </div>`;
  }
}

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  updateBadge();
  loadFigurines();

  // Lien nav auth affiché si connecté
  const user = (() => { try { return JSON.parse(localStorage.getItem('sm_user')); } catch { return null; } })();
  if (user) {
    const navAuth = document.getElementById('nav-auth');
    if (navAuth) { navAuth.textContent = `👤 ${user.prenom}`; navAuth.href = '/login'; }
  }

  // ── Mini cart drawer events ───────────────────────────────
  document.getElementById('nav-cart-btn')?.addEventListener('click', () => {
    const drawer = document.getElementById('mini-cart');
    if (drawer?.classList.contains('open')) closeMiniCart();
    else openMiniCart();
  });

  document.getElementById('mini-cart-close')?.addEventListener('click', closeMiniCart);
  document.getElementById('mini-cart-overlay')?.addEventListener('click', closeMiniCart);

  // Supprimer un item depuis le mini-drawer (event delegation)
  document.getElementById('mini-cart-body')?.addEventListener('click', e => {
    const btn = e.target.closest('.mini-cart-remove');
    if (!btn) return;
    const id = btn.dataset.id;
    let cart = getCart().filter(i => i.id !== id);
    saveCart(cart);
    const addBtn = document.getElementById(`add-btn-${id}`);
    if (addBtn) {
      addBtn.classList.remove('added');
      addBtn.textContent = '🐾 Drop Pod';
    }
  });

  // Fermer avec Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeMiniCart();
    }
  });
});
