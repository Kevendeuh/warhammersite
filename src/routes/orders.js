const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getCollection, findById, insertOne, updateOne } = require('../db');

const router = express.Router();

// Simple auth middleware — decode token from Authorization header
function authMiddleware(req, res, next) {
    const auth = req.headers['authorization'];
    if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Accès refusé. Identification requise.' });
    }
    try {
        const token = auth.split(' ')[1];
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        const userId = decoded.split(':')[0];
        const user = findById('users', userId);
        if (!user) return res.status(401).json({ error: 'Token invalide.' });
        req.userId = userId;
        req.user = user;
        next();
    } catch {
        res.status(401).json({ error: 'Token corrompu.' });
    }
}

// POST /api/orders — Create a new order
router.post('/', authMiddleware, (req, res) => {
    try {
        const { liste_figurines, adresse_livraison } = req.body;
        if (!liste_figurines || liste_figurines.length === 0) {
            return res.status(400).json({ error: 'Le Drop Pod est vide. Ajoutez des figurines.' });
        }

        // Calculate total price
        let prix_total = 0;
        const figurines = getCollection('figurines');
        const itemsWithDetails = liste_figurines.map(item => {
            const fig = figurines.find(f => f.id === item.id);
            if (!fig) throw new Error(`Figurine ${item.id} introuvable.`);
            prix_total += fig.prix_credits * item.quantite;
            return { id: item.id, nom: fig.nom, quantite: item.quantite, prix_unitaire: fig.prix_credits };
        });

        const order = {
            id: uuidv4(),
            id_commande: `CMD-${Date.now()}`,
            id_utilisateur: req.userId,
            liste_figurines: itemsWithDetails,
            adresse_livraison: adresse_livraison || req.user.adresse_postale,
            statut: 'En cours de préparation',
            prix_total,
            date_commande: new Date().toISOString()
        };

        insertOne('orders', order);
        res.status(201).json({ message: 'Frappe orbitale confirmée ! La livraison est en route.', order });
    } catch (err) {
        res.status(500).json({ error: err.message || 'Erreur serveur Omnissiah.' });
    }
});

// GET /api/orders/my — Get current user's orders
router.get('/my', authMiddleware, (req, res) => {
    const orders = getCollection('orders').filter(o => o.id_utilisateur === req.userId);
    res.json(orders);
});

// PATCH /api/orders/:id/status — Update order status (admin-like)
router.patch('/:id/status', authMiddleware, (req, res) => {
    const { statut } = req.body;
    const updated = updateOne('orders', req.params.id, { statut });
    if (!updated) return res.status(404).json({ error: 'Commande introuvable.' });
    res.json(updated);
});

module.exports = router;
