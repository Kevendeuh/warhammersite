const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { findByField, insertOne } = require('../db');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { nom, prenom, email, mot_de_passe, adresse_postale } = req.body;
        if (!nom || !prenom || !email || !mot_de_passe) {
            return res.status(400).json({ error: 'Champs obligatoires manquants.' });
        }

        const existing = findByField('users', 'email', email);
        if (existing) {
            return res.status(409).json({ error: 'Cet email est déjà enregistré dans les archives.' });
        }

        const hashed = await bcrypt.hash(mot_de_passe, 10);
        const user = {
            id: uuidv4(),
            nom,
            prenom,
            email,
            mot_de_passe: hashed,
            adresse_postale: adresse_postale || '',
            created_at: new Date().toISOString()
        };

        insertOne('users', user);
        const { mot_de_passe: _, ...safeUser } = user;
        res.status(201).json({ message: 'Soldat enregistré dans les archives impériales.', user: safeUser });
    } catch (err) {
        res.status(500).json({ error: 'Erreur du serveur Omnissiah.' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, mot_de_passe } = req.body;
        if (!email || !mot_de_passe) {
            return res.status(400).json({ error: 'Email et mot de passe requis.' });
        }

        const user = findByField('users', 'email', email);
        if (!user) {
            return res.status(401).json({ error: 'Identifiants invalides.' });
        }

        const match = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
        if (!match) {
            return res.status(401).json({ error: 'Mot de passe incorrect. L\'Inquisition vous surveille.' });
        }

        // Simple token: base64 of user id + timestamp (demo only)
        const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');
        const { mot_de_passe: _, ...safeUser } = user;

        res.json({ message: 'Connexion autorisée. Que l\'Empereur vous guide.', token, user: safeUser });
    } catch (err) {
        res.status(500).json({ error: 'Erreur du serveur Omnissiah.' });
    }
});

module.exports = router;
