// ── Logique pour figurine.html ────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    // gère /figurines/:slug et /fr/figurines/:slug et /en/figurines/:slug
    const slug = pathParts[pathParts.length - 1];
    const lang = pathParts[0] === 'en' ? 'en' : 'fr';

    const loadingState = document.getElementById('loading-state');
    const detailsBlock = document.getElementById('figurine-details');

    if (!slug || slug === 'figurine' || slug === 'figurines') {
        if (loadingState) {
            loadingState.innerHTML = '<div class="error-state"><p>⚠ IDENTIFIANT MANQUANT DANS LA REQUÊTE.</p></div>';
        }
        return;
    }

    try {
        const res = await fetch(`/api/figurines/slug/${slug}`);
        if (!res.ok) {
            throw new Error('Figurine introuvable');
        }
        const fig = await res.json();

        // ── SEO dynamique ────────────────────────────────────
        const pageTitle = lang === 'en'
            ? `${fig.nom} — Warhammer 40K Space Maids Miniature | Imperial Armory`
            : `${fig.nom} — Figurine Warhammer 40K Space Maids | Armurerie Impériale`;
        document.title = pageTitle;

        const metaDesc = document.getElementById('page-description');
        if (metaDesc) {
            metaDesc.content = lang === 'en'
                ? `Buy the ${fig.nom} Space Maids Warhammer 40K miniature. ${fig.description_lore.substring(0, 100)}... Price: ${fig.prix_credits.toLocaleString()} imperial credits.`
                : `Achetez la figurine ${fig.nom} Space Maids Warhammer 40K. ${fig.description_lore.substring(0, 100)}... Prix : ${fig.prix_credits.toLocaleString('fr-FR')} crédits impériaux.`;
        }

        const canonical = document.getElementById('page-canonical');
        if (canonical) {
            canonical.href = `https://armurerie-space-maids.com/${lang === 'en' ? 'en/' : ''}figurines/${slug}`;
        }

        // ── Remplissage des champs ────────────────────────────
        document.getElementById('detail-img').src = fig.image_url;
        document.getElementById('detail-img').alt = `${fig.nom} — figurine Warhammer 40K Space Maids`;
        document.getElementById('detail-title').textContent = fig.nom;
        document.getElementById('detail-price').textContent = formatPrice(fig.prix_credits);
        document.getElementById('detail-desc').textContent = fig.description_lore;

        // ── Note globale ──────────────────────────────────────
        const ratingEl = document.getElementById('detail-global-rating');
        if (ratingEl && fig.commentaires && fig.commentaires.length > 0) {
            const avg = fig.commentaires.reduce((acc, c) => acc + c.note, 0) / fig.commentaires.length;
            const full = Math.round(avg);
            const stars = '★'.repeat(full) + '☆'.repeat(5 - full);
            const label = lang === 'en'
                ? `Global rating: ${avg.toFixed(1)}/5 (${fig.commentaires.length} review${fig.commentaires.length > 1 ? 's' : ''})`
                : `Note globale : ${avg.toFixed(1)}/5 (${fig.commentaires.length} avis)`;
            ratingEl.innerHTML = `<span style="color:var(--accent-pink); font-size:1.1rem; letter-spacing:1px;">${stars}</span> <span>${avg.toFixed(1)}/5</span> <small style="color:var(--text-secondary);">(${fig.commentaires.length} ${lang === 'en' ? 'reviews' : 'avis'})</small>`;
            ratingEl.setAttribute('aria-label', label);
        } else if (ratingEl) {
            ratingEl.textContent = lang === 'en' ? 'No ratings yet.' : 'Pas encore de notes.';
        }

        // ── Commentaires (section déroulante) ─────────────────
        const reviewsList = document.getElementById('reviews-list');
        const reviewsDetails = document.getElementById('reviews-details');
        if (reviewsList && fig.commentaires && fig.commentaires.length > 0) {
            reviewsList.innerHTML = '';
            fig.commentaires.forEach(c => {
                const stars = '★'.repeat(c.note) + '☆'.repeat(5 - c.note);
                const dateStr = new Date(c.date).toLocaleDateString(lang === 'en' ? 'en-GB' : 'fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
                const item = document.createElement('div');
                item.className = 'review-item';
                item.innerHTML = `
                    <div class="review-header">
                        <span class="review-author">${escapeHtml(c.auteur)}</span>
                        <span class="review-stars" aria-label="Note : ${c.note}/5">${stars}</span>
                        <span class="review-date">${dateStr}</span>
                    </div>
                    <p class="review-text">${escapeHtml(c.texte)}</p>
                `;
                reviewsList.appendChild(item);
            });

            // Mettre à jour le libellé du déroulant avec le nombre d'avis
            const summary = reviewsDetails?.querySelector('.reviews-summary');
            if (summary) {
                const count = fig.commentaires.length;
                summary.textContent = lang === 'en'
                    ? `Collector reviews (${count})`
                    : `Avis des collectionneurs (${count})`;
            }
        } else if (reviewsList) {
            reviewsList.innerHTML = `<p class="no-reviews">${lang === 'en' ? 'No reviews for this miniature yet.' : 'Aucun avis pour cette figurine.'}</p>`;
        }

        // ── Bouton d'ajout ────────────────────────────────────
        const buyBtn = document.getElementById('detail-buy-btn');

        const updateBtnState = () => {
            const cart = getCart();
            const inCart = cart.some(i => i.id === fig.id);
            if (inCart) {
                buyBtn.classList.add('added');
                buyBtn.textContent = lang === 'en' ? '✓ In Drop Pod' : '✓ Dans le Pod';
            } else {
                buyBtn.classList.remove('added');
                buyBtn.textContent = lang === 'en' ? '🐾 Add to Drop Pod' : '🐾 Ajouter au Drop Pod';
            }
        };

        updateBtnState();

        buyBtn.addEventListener('click', () => {
            addToCart(fig);
            updateBtnState();
            showToast(`${fig.nom} ${lang === 'en' ? 'added to Drop Pod!' : 'ajouté au Drop Pod !'}`, '🐾');
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
            <a href="/figurines" class="btn btn-outline" style="margin-top:1rem;">← Retour figurines</a>
        </div>`;
        }
    }
});

// ── Utilitaire XSS ───────────────────────────────────────────
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
