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

// Middleware d'authentification pour vérifier si l'utilisateur est administrateur
function authenticateAdmin(req, res, next) {
    // Vérifier si l'utilisateur est authentifié
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ message: 'Token JWT manquant' });

    // Vérifier si l'utilisateur est un administrateur
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Accès non autorisé' });
        if (!user.isAdmin) return res.status(403).json({ message: 'Vous devez être un administrateur pour effectuer cette action' });
        next();
    });
}

// Middleware d'authentification
function authenticateToken(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ message: 'Token JWT manquant' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Accès non autorisé' });
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
router.get('/multiple', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 1; // Limite par défaut à 1 si non spécifiée
        if (limit > 100) {
            return res.status(400).json({ message: 'La limite ne peut pas dépasser 100' });
        }

        const defis = await Defi.aggregate([{ $sample: { size: limit } }]);
        res.json(defis);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Route pour ajouter un défi
router.post('/', authenticateAdmin, async (req, res) => {
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

// Route pour modifier un défi spécifique
router.put('/:id', authenticateToken, async (req, res) => {
    const id = req.params.id;

    try {
        const defi = await Defi.findById(id);
        if (!defi) return res.status(404).json({ message: 'Défi non trouvé' });

        // Vérifiez si l'utilisateur est autorisé à modifier ce défi (ex: propriétaire du défi ou administrateur)
        if (defi.user != req.user.id && !req.user.isAdmin) {
            return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à modifier ce défi' });
        }

        // Mettre à jour les données du défi avec les nouvelles données fournies
        defi.titre = req.body.titre;
        defi.description = req.body.description;
        defi.difficulte = req.body.difficulte;

        const updatedDefi = await defi.save();
        res.json(updatedDefi);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Route pour supprimer un défi spécifique
router.delete('/:id', authenticateToken, async (req, res) => {
    const id = req.params.id;

    try {
        const defi = await Defi.findById(id);
        if (!defi) return res.status(404).json({ message: 'Défi non trouvé' });

        // Vérifiez si l'utilisateur est autorisé à supprimer ce défi (ex: propriétaire du défi ou administrateur)
        if (defi.user != req.user.id && !req.user.isAdmin) {
            return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à supprimer ce défi' });
        }

        await defi.remove();
        res.json({ message: 'Défi supprimé' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
