// routes/defis.js

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Modèle de données pour les défis
const Defi = mongoose.model('Defi', new mongoose.Schema({
    titre: String,
    description: String,
    difficulte: String
}));

// Middleware d'authentification
function authenticateToken(req, res, next) {
    const token = req.headers['authorization'];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// Route pour récupérer un défi aléatoire
router.get('/random', async (req, res) => {
    try {
        const count = await Defi.countDocuments();
        const random = Math.floor(Math.random() * count);
        const defi = await Defi.findOne().skip(random);
        res.json(defi);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Route pour récupérer plusieurs défis aléatoires
router.get('/random', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 1;
        const defis = await Defi.aggregate([{ $sample: { size: limit } }]);
        res.json(defis);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Route pour ajouter un défi
router.post('/', authenticateToken, async (req, res) => {
    const defi = new Defi({
        titre: req.body.titre,
        description: req.body.description,
        difficulte: req.body.difficulte
    });

    try {
        const newDefi = await defi.save();
        res.status(201).json(newDefi);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Route pour modifier un défi
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const defi = await Defi.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(defi);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Route pour supprimer un défi
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        await Defi.findByIdAndRemove(req.params.id);
        res.json({ message: 'Défi supprimé' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
