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

module.exports = router;
