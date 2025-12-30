const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const config = require('../config');

const BLACKLIST_FILE = path.join(config.dataDir, 'blacklist.json');

// Helper to read blacklist
const getBlacklist = () => {
    if (!fs.existsSync(BLACKLIST_FILE)) return [];
    try {
        const data = fs.readFileSync(BLACKLIST_FILE, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        return [];
    }
};

// Helper to save blacklist
const saveBlacklist = (list) => {
    fs.writeFileSync(BLACKLIST_FILE, JSON.stringify(list, null, 2));
};

// GET /api/settings/blacklist - Get all blacklisted words
router.get('/blacklist', (req, res) => {
    res.json(getBlacklist());
});

// POST /api/settings/blacklist - Add a word
router.post('/blacklist', (req, res) => {
    const { word } = req.body;
    if (!word) return res.status(400).json({ error: 'Word is required' });

    const list = getBlacklist();
    const cleanWord = word.toLowerCase().trim();

    if (!list.includes(cleanWord)) {
        list.push(cleanWord);
        list.sort();
        saveBlacklist(list);
    }

    res.json(list);
});

// DELETE /api/settings/blacklist/:word - Remove a word
router.delete('/blacklist/:word', (req, res) => {
    const { word } = req.params;
    let list = getBlacklist();
    const cleanWord = word.toLowerCase().trim();

    list = list.filter(w => w !== cleanWord);
    saveBlacklist(list);

    res.json(list);
});

module.exports = router;
