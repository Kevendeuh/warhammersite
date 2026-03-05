/* ============================================================
   AUTH.JS — Login / Register (Vanilla JS)
   ============================================================ */

// ── Shared Utilities ──────────────────────────────────────────
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

function showError(id, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
}

function showSuccess(id, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
}

function clearMessages(panel) {
    panel.querySelectorAll('.auth-error, .auth-success').forEach(el => {
        el.style.display = 'none';
        el.textContent = '';
    });
}

// ── Tab Switching ─────────────────────────────────────────────
function switchTab(tabId) {
    const tabs = document.querySelectorAll('.auth-tab');
    const panels = document.querySelectorAll('.auth-form-panel');

    tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
    });
    panels.forEach(p => p.classList.remove('active'));

    const tab = document.getElementById(tabId);
    const panelId = tab?.getAttribute('aria-controls');
    if (tab) { tab.classList.add('active'); tab.setAttribute('aria-selected', 'true'); }
    if (panelId) document.getElementById(panelId)?.classList.add('active');
}

// ── Save session ──────────────────────────────────────────────
function saveSession(token, user) {
    localStorage.setItem('sm_token', token);
    localStorage.setItem('sm_user', JSON.stringify(user));
}

// ── Login ─────────────────────────────────────────────────────
async function handleLogin(e) {
    e.preventDefault();
    const form = document.getElementById('login-form');
    const panel = document.getElementById('panel-login');
    clearMessages(panel);

    const email = document.getElementById('login-email')?.value.trim();
    const password = document.getElementById('login-password')?.value;

    if (!email || !password) {
        showError('login-error', 'Veuillez remplir tous les champs.');
        return;
    }

    const btn = document.getElementById('login-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'VÉRIFICATION EN COURS...'; }

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, mot_de_passe: password })
        });

        const data = await res.json();

        if (!res.ok) {
            showError('login-error', data.error || 'Connexion refusée par l\'Inquisition.');
            return;
        }

        saveSession(data.token, data.user);
        showSuccess('login-success', `✦ Bienvenue, ${data.user.prenom} ! Redirection en cours...`);
        showToast(`Connexion autorisée, ${data.user.prenom} !`, '✦');

        setTimeout(() => { window.location.href = '/'; }, 1500);

    } catch (err) {
        console.error(err);
        showError('login-error', 'Serveur Omnissiah injoignable. Réessayez plus tard.');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'SE CONNECTER AUX ARCHIVES'; }
    }
}

// ── Register ──────────────────────────────────────────────────
async function handleRegister(e) {
    e.preventDefault();
    const panel = document.getElementById('panel-register');
    clearMessages(panel);

    const nom = document.getElementById('reg-nom')?.value.trim();
    const prenom = document.getElementById('reg-prenom')?.value.trim();
    const email = document.getElementById('reg-email')?.value.trim();
    const adresse = document.getElementById('reg-adresse')?.value.trim();
    const password = document.getElementById('reg-password')?.value;

    if (!nom || !prenom || !email || !password) {
        showError('register-error', 'Tous les champs obligatoires doivent être remplis, Soldat.');
        return;
    }

    if (password.length < 6) {
        showError('register-error', 'Le code d\'accès doit contenir au moins 6 caractères.');
        return;
    }

    const btn = document.getElementById('register-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'ENREGISTREMENT EN COURS...'; }

    try {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nom, prenom, email, mot_de_passe: password, adresse_postale: adresse })
        });

        const data = await res.json();

        if (!res.ok) {
            showError('register-error', data.error || 'Enrôlement refusé par le Système.');
            return;
        }

        showSuccess('register-success', '✦ Enrôlement réussi ! Vous pouvez maintenant vous connecter.');
        showToast('Bienvenue dans les archives impériales !', '🎀');

        // Auto-switch to login tab after success
        setTimeout(() => switchTab('tab-login'), 2000);

    } catch (err) {
        console.error(err);
        showError('register-error', 'Serveur Omnissiah injoignable. Réessayez plus tard.');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = '🌸 S\'ENRÔLER DANS LES ARCHIVES'; }
    }
}

// ── Redirect if already logged in ────────────────────────────
function checkAlreadyLoggedIn() {
    const token = localStorage.getItem('sm_token');
    const user = localStorage.getItem('sm_user');
    if (token && user) {
        try {
            const u = JSON.parse(user);
            showToast(`Déjà connecté en tant que ${u.prenom}`, '✦');
            // Don't auto-redirect — let user stay or navigate
        } catch { }
    }
}

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    checkAlreadyLoggedIn();

    // Tab buttons
    document.getElementById('tab-login')?.addEventListener('click', () => switchTab('tab-login'));
    document.getElementById('tab-register')?.addEventListener('click', () => switchTab('tab-register'));

    // Cross-links
    document.getElementById('goto-register')?.addEventListener('click', e => {
        e.preventDefault();
        switchTab('tab-register');
    });
    document.getElementById('goto-login')?.addEventListener('click', e => {
        e.preventDefault();
        switchTab('tab-login');
    });

    // Forms
    document.getElementById('login-form')?.addEventListener('submit', handleLogin);
    document.getElementById('register-form')?.addEventListener('submit', handleRegister);
});
