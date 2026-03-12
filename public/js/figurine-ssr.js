// figurine-ssr.js
// Gestion du bouton "Ajouter au Drop Pod" sur la page détail en mode SSR
document.addEventListener('DOMContentLoaded', () => {
    const buyBtn = document.getElementById('detail-buy-btn');
    if (!buyBtn) return;

    const fig = {
        id: buyBtn.dataset.id,
        nom: buyBtn.dataset.nom,
        image_url: buyBtn.dataset.image,
        prix_credits: parseInt(buyBtn.dataset.prix, 10)
    };

    const lang = window.location.pathname.startsWith('/en') ? 'en' : 'fr';

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
});
