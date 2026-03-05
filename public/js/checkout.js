/* ============================================================
   CHECKOUT.JS — Drop Pod / Checkout (Vanilla JS)
   Bugs corrigés :
     1. Event listener attaché une seule fois au DOMContentLoaded
        (pas dans renderCart, évite le stacking)
     2. handleCartAction ne touche plus au DOM, délègue tout à renderCart
     3. renderCart est pure : elle efface et recrée les items proprement
   ============================================================ */

// ── Shared Utilities ─────────────────────────────────────────
function showToast(msg, icon = '🎀') {
    const toast = document.getElementById('toast');
    const msgEl  = document.getElementById('toast-msg');
    const iconEl = document.getElementById('toast-icon');
    if (!toast || !msgEl || !iconEl) return;
    msgEl.textContent  = msg;
    iconEl.textContent = icon;
    toast.classList.add('show');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => toast.classList.remove('show'), 3500);
}

function formatPrice(credits) {
    return credits.toLocaleString('fr-FR') + ' ₵';
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

function getTotalCredits(cart) {
    return cart.reduce((sum, i) => sum + i.prix_credits * i.quantite, 0);
}

function updateBadge() {
    const badge = document.getElementById('cart-badge');
    if (!badge) return;
    const total = getCart().reduce((s, i) => s + i.quantite, 0);
    badge.textContent = total;
    if (total > 0) badge.classList.add('visible');
    else badge.classList.remove('visible');
}

// ── Render Cart Items ─────────────────────────────────────────
// Appelée à chaque modification du panier.
// N'attache PLUS d'event listener (géré une seule fois dans init).
function renderCart() {
    const cart          = getCart();
    const container     = document.getElementById('cart-items-container');
    const emptyState    = document.getElementById('cart-empty-state');
    const strikeBtn     = document.getElementById('strike-btn');
    const addressPanel  = document.getElementById('address-panel');

    updateSummary(cart);
    updateBadge();

    // Supprimer uniquement les lignes d'items (pas l'état vide)
    container.querySelectorAll('.cart-item').forEach(el => el.remove());

    if (cart.length === 0) {
        if (emptyState)   emptyState.style.display  = 'flex';
        if (strikeBtn)    strikeBtn.disabled         = true;
        if (addressPanel) addressPanel.style.opacity = '0.5';
        return;
    }

    if (emptyState)   emptyState.style.display  = 'none';
    if (strikeBtn)    strikeBtn.disabled         = false;
    if (addressPanel) addressPanel.style.opacity = '1';

    cart.forEach(item => {
        const row = document.createElement('div');
        row.className  = 'cart-item';
        row.dataset.id = item.id;
        row.innerHTML  = `
      <img class="cart-item-img" src="${item.image_url}" alt="${item.nom}"
           onerror="this.style.opacity='0.3'" />
      <div class="cart-item-info">
        <p class="cart-item-name">${item.nom}</p>
        <div class="cart-item-qty">
          <button class="qty-btn" data-action="dec" data-id="${item.id}"
                  aria-label="Diminuer la quantité" type="button">−</button>
          <span class="qty-value" aria-label="Quantité: ${item.quantite}">${item.quantite}</span>
          <button class="qty-btn" data-action="inc" data-id="${item.id}"
                  aria-label="Augmenter la quantité" type="button">+</button>
        </div>
        <button class="remove-btn" data-id="${item.id}" type="button"
                aria-label="Retirer ${item.nom} du Drop Pod">✕ Retirer</button>
      </div>
      <div class="cart-item-price">
        <p class="subtotal">${formatPrice(item.prix_credits * item.quantite)}</p>
        <p class="unit-price">${formatPrice(item.prix_credits)} / unité</p>
      </div>
    `;
        container.appendChild(row);
    });
}

// ── Handle Cart Actions ───────────────────────────────────────
// Attaché UNE SEULE FOIS au DOMContentLoaded via event delegation.
// Modifie le state localStorage, puis appelle renderCart().
function handleCartAction(e) {
    const incBtn = e.target.closest('[data-action="inc"]');
    const decBtn = e.target.closest('[data-action="dec"]');
    const remBtn = e.target.closest('.remove-btn');

    if (!incBtn && !decBtn && !remBtn) return;

    const id  = (incBtn || decBtn || remBtn).dataset.id;
    let   cart = getCart();

    if (incBtn) {
        const item = cart.find(i => i.id === id);
        if (item) item.quantite += 1;
    } else if (decBtn) {
        const item = cart.find(i => i.id === id);
        if (item && item.quantite > 1) {
            item.quantite -= 1;
        } else if (item && item.quantite === 1) {
            cart = cart.filter(i => i.id !== id);
            showToast('Article retiré du Drop Pod.', '🗑');
        }
    } else if (remBtn) {
        cart = cart.filter(i => i.id !== id);
        showToast('Article retiré du Drop Pod.', '🗑');
    }

    saveCart(cart);  // met à jour localStorage + badge
    renderCart();    // re-render propre
}

function updateSummary(cart) {
    const total   = getTotalCredits(cart);
    const subEl   = document.getElementById('summary-subtotal');
    const totalEl = document.getElementById('summary-total');
    if (subEl)   subEl.textContent   = formatPrice(total);
    if (totalEl) totalEl.textContent = formatPrice(total);
}

// ── Pre-fill form if user logged in ──────────────────────────
function prefillForm() {
    try {
        const user = JSON.parse(localStorage.getItem('sm_user'));
        if (!user) return;
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el && val) el.value = val;
        };
        setVal('field-nom',     user.nom);
        setVal('field-prenom',  user.prenom);
        setVal('field-email',   user.email);
        setVal('field-adresse', user.adresse_postale);
    } catch { }
}

// ── Validate form ─────────────────────────────────────────────
function validateForm() {
    const nom  = document.getElementById('field-nom')?.value.trim();
    const pren = document.getElementById('field-prenom')?.value.trim();
    const mail = document.getElementById('field-email')?.value.trim();
    const adr  = document.getElementById('field-adresse')?.value.trim();
    const cp   = document.getElementById('field-cp')?.value.trim();
    const vil  = document.getElementById('field-ville')?.value.trim();

    if (!nom || !pren || !mail || !adr || !cp || !vil) {
        return 'Tous les champs marqués sont obligatoires, Soldat.';
    }
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(mail)) {
        return 'Adresse email invalide.';
    }
    return null;
}

// ── Orbital Strike Animation ──────────────────────────────────
function launchOrbitalStrike(orderCode) {
    const overlay      = document.getElementById('orbital-overlay');
    const loadingPhase = document.getElementById('loading-phase');
    const successPhase = document.getElementById('success-phase');
    const countdown    = document.getElementById('orbital-countdown');
    const orderCodeEl  = document.getElementById('order-code');

    if (!overlay) return;
    overlay.classList.add('show');
    loadingPhase.style.display = 'flex';
    successPhase.classList.remove('show');

    const messages = [
        'CIBLAGE DES COORDONNÉES...',
        'SYNCHRONISATION ORBITALE...',
        'COMPTE À REBOURS : 3...',
        'COMPTE À REBOURS : 2...',
        'COMPTE À REBOURS : 1...',
        '☄️ FRAPPE !'
    ];

    let idx = 0;
    const interval = setInterval(() => {
        if (countdown) countdown.textContent = messages[idx] || '';
        idx++;
        if (idx >= messages.length) {
            clearInterval(interval);
            setTimeout(() => {
                loadingPhase.style.display = 'none';
                successPhase.classList.add('show');
                if (orderCodeEl) orderCodeEl.textContent = `N° Commande : ${orderCode}`;
                // Vider le panier
                localStorage.removeItem(CART_KEY);
                updateBadge();
            }, 600);
        }
    }, 700);
}

// ── Handle Order Submit ───────────────────────────────────────
async function handleSubmit() {
    const errorEl = document.getElementById('form-error');
    if (errorEl) { errorEl.style.display = 'none'; errorEl.textContent = ''; }

    const validationError = validateForm();
    if (validationError) {
        if (errorEl) { errorEl.textContent = validationError; errorEl.style.display = 'block'; }
        showToast(validationError, '⚠');
        return;
    }

    const cart = getCart();
    if (cart.length === 0) {
        showToast('Le Drop Pod est vide !', '🚫');
        return;
    }

    const adresse = [
        document.getElementById('field-adresse')?.value.trim(),
        document.getElementById('field-cp')?.value.trim(),
        document.getElementById('field-ville')?.value.trim()
    ].filter(Boolean).join(', ');

    const token = localStorage.getItem('sm_token');

    const payload = {
        liste_figurines:  cart.map(i => ({ id: i.id, quantite: i.quantite })),
        adresse_livraison: adresse
    };

    const btn = document.getElementById('strike-btn');
    if (btn) btn.disabled = true;

    try {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res  = await fetch('/api/orders', {
            method:  'POST',
            headers,
            body:    JSON.stringify(payload)
        });

        const data = await res.json();

        if (!res.ok) {
            // Non connecté → mode démo local (commande fictive)
            if (res.status === 401) {
                launchOrbitalStrike('CMD-' + Date.now());
                return;
            }
            throw new Error(data.error || `Erreur HTTP ${res.status}`);
        }

        launchOrbitalStrike(data.order?.id_commande || 'CMD-' + Date.now());

    } catch (err) {
        console.error('Erreur commande:', err);
        // En cas d'erreur, animation démo quand même
        launchOrbitalStrike('CMD-DEMO-' + Math.floor(Math.random() * 99999));
    } finally {
        if (btn) btn.disabled = false;
    }
}

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    renderCart();
    prefillForm();

    // ✅ Event delegation sur le container — attaché UNE SEULE FOIS ici
    const container = document.getElementById('cart-items-container');
    if (container) container.addEventListener('click', handleCartAction);

    // Bouton frappe orbitale
    const strikeBtn = document.getElementById('strike-btn');
    if (strikeBtn) strikeBtn.addEventListener('click', handleSubmit);
});
