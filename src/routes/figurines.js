const express = require('express');
const { getCollection, findById } = require('../db');

const router = express.Router();

// GET /api/figurines
router.get('/', (req, res) => {
    const figurines = getCollection('figurines');
    res.json(figurines);
});

// GET /api/figurines/:id
router.get('/:id', (req, res) => {
    const figurine = findById('figurines', req.params.id);
    if (!figurine) return res.status(404).json({ error: 'Figurine introuvable dans les archives.' });
    res.json(figurine);
});

// GET /api/figurines/slug/:slug
router.get('/slug/:slug', (req, res) => {
    const figurines = getCollection('figurines');
    const slugify = (text) => text.toString().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-').replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-').replace(/^-+/, '').replace(/-+$/, '');

    const figurine = figurines.find(f => slugify(f.nom) === req.params.slug);
    if (!figurine) return res.status(404).json({ error: 'Figurine introuvable dans les archives par nom.' });
    res.json(figurine);
});

module.exports = router;
