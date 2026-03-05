// ── Logique pour figurine.html ────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    const loadingState = document.getElementById('loading-state');
    const detailsBlock = document.getElementById('figurine-details');

    if (!id) {
        if (loadingState) {
            loadingState.innerHTML = '<div class="error-state"><p>⚠ IDENTIFIANT MANQUANT DANS LA REQUÊTE.</p></div>';
        }
        return;
    }

    try {
        const res = await fetch(`/api/figurines/${id}`);
        if (!res.ok) {
            throw new Error('Figurine introuvable');
        }
        const fig = await res.json();

        document.title = `${fig.nom} — Armurerie Impériale`;

        document.getElementById('detail-img').src = fig.image_url;
        document.getElementById('detail-img').alt = fig.nom;
        document.getElementById('detail-title').textContent = fig.nom;
        document.getElementById('detail-price').textContent = formatPrice(fig.prix_credits);
        document.getElementById('detail-desc').textContent = fig.description_lore;

        // Bouton d'ajout
        const buyBtn = document.getElementById('detail-buy-btn');

        // Check si déjà dans le panier
        const updateBtnState = () => {
            const cart = getCart();
            const inCart = cart.some(i => i.id === fig.id);
            if (inCart) {
                buyBtn.classList.add('added');
                buyBtn.textContent = '✓ Dans le Pod';
            } else {
                buyBtn.classList.remove('added');
                buyBtn.textContent = '🐾 Ajouter au Drop Pod';
            }
        };

        updateBtnState();

        buyBtn.addEventListener('click', () => {
            addToCart(fig);
            updateBtnState();
            showToast(`${fig.nom} ajouté au Drop Pod !`, '🐾');
            openMiniCart();
        });

        if (loadingState) loadingState.remove();
        if (detailsBlock) detailsBlock.style.display = 'block';

    } catch (err) {
        if (loadingState) {
            loadingState.innerHTML = `<div class="error-state">
            <p>⚠ ARCHIVE INTROUVABLE</p>
            <p style="font-size:0.8rem; color:var(--text-secondary); margin-top:0.5rem; font-family:var(--font-body)">
                La figurine demandée n'existe pas ou la connexion a échoué.
            </p>
            <a href="/boutique.html" class="btn btn-outline" style="margin-top:1rem;">← Retour boutique</a>
        </div>`;
        }
    }
});
