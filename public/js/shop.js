/* ============================================================
   SHOP.JS — Boutique Space Maids (Vanilla JS)
   ============================================================ */

// ── Shared Utilities ─────────────────────────────────────────
function showToast(msg, icon = '🎀') {
    const toast = document.getElementById('toast');
    const msgEl = document.getElementById('toast-msg');
    const iconEl = document.getElementById('toast-icon');
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

// ── Format price ─────────────────────────────────────────────
function formatPrice(credits) {
    return credits.toLocaleString('fr-FR');
}

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
          <span>${formatPrice(fig.prix_credits)}</span>
          <span class="unit">crédits imp.</span>
        </div>
        <button
          class="btn-add ${inCart ? 'added' : ''}"
          id="add-btn-${fig.id}"
          data-id="${fig.id}"
          aria-label="${inCart ? 'Figurine déjà dans le Drop Pod' : 'Ajouter ' + fig.nom + ' au Drop Pod'}"
          type="button"
        >
          ${inCart ? '✓ Dans le Pod' : '🚀 Drop Pod'}
        </button>
      </div>
    </div>
  `;

    // Add to cart handler
    const btn = card.querySelector('.btn-add');
    btn.addEventListener('click', () => {
        addToCart(fig);
        btn.classList.add('added');
        btn.textContent = '✓ Dans le Pod';
        btn.setAttribute('aria-label', 'Figurine déjà dans le Drop Pod');
        showToast(`${fig.nom} ajouté au Drop Pod !`, '🚀');
    });

    return card;
}

// ── Fetch & Render Figurines ──────────────────────────────────
async function loadFigurines() {
    const grid = document.getElementById('figurine-grid');
    const loading = document.getElementById('loading-state');

    try {
        const res = await fetch('/api/figurines');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const figurines = await res.json();

        // Remove loading state
        if (loading) loading.remove();

        if (figurines.length === 0) {
            grid.innerHTML = `<div class="error-state">
        <p>⚠ Les archives sont vides. L'Omnissiah enquête.</p>
      </div>`;
            return;
        }

        figurines.forEach((fig, i) => {
            grid.appendChild(renderCard(fig, i));
        });

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

    // Update nav auth link if logged in
    const user = (() => { try { return JSON.parse(localStorage.getItem('sm_user')); } catch { return null; } })();
    if (user) {
        const navAuth = document.getElementById('nav-auth');
        if (navAuth) { navAuth.textContent = `👤 ${user.prenom}`; navAuth.href = '/login.html'; }
    }
});
