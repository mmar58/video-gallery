const express = require('express');
const router = express.Router();
const store = require('../data/store');
const fs = require('fs');
const path = require('path');

const BLACKLIST_FILE = path.join(__dirname, '../../data/blacklist.json');

// Helper to get blacklist
const getBlacklist = () => {
    if (!fs.existsSync(BLACKLIST_FILE)) return [];
    try {
        return JSON.parse(fs.readFileSync(BLACKLIST_FILE, 'utf8'));
    } catch (e) { return []; }
};

// Helper to save blacklist
const saveBlacklist = (list) => {
    const dataDir = path.dirname(BLACKLIST_FILE);
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(BLACKLIST_FILE, JSON.stringify(list, null, 2));
};

// GET /api/tags - Get all tags with counts
router.get('/', (req, res) => {
    try {
        const metadata = store.getAll();
        const tagCounts = {};

        Object.values(metadata).forEach(entry => {
            if (entry.tags && Array.isArray(entry.tags)) {
                entry.tags.forEach(tag => {
                    // Use original case for display keys, or simplified?
                    // Let's count by exact string but maybe group case-insensitively later?
                    // For now, exact string counts.
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                });
            }
        });

        // Convert to array
        const tags = Object.entries(tagCounts).map(([name, count]) => ({ name, count }));
        // Sort by count desc
        tags.sort((a, b) => b.count - a.count);

        res.json(tags);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch tags' });
    }
});

// PUT /api/tags/:tag - Rename tag
router.put('/:tag', (req, res) => {
    try {
        const oldTag = req.params.tag; // Explicitly decoded by express? No, params are decoded.
        // If tag has spaces/special chars, client should encodeURI. Express decodes it.
        const { newName } = req.body;

        if (!newName) return res.status(400).json({ error: 'New name required' });

        store.renameTagInAll(oldTag, newName);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update tag' });
    }
});

// DELETE /api/tags/:tag - Delete tag globally
router.delete('/:tag', (req, res) => {
    try {
        const tag = req.params.tag;
        store.removeTagFromAll(tag);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete tag' });
    }
});

// POST /api/tags/:tag/blacklist - Add to blacklist AND delete globally
router.post('/:tag/blacklist', (req, res) => {
    try {
        const tag = req.params.tag;

        // 1. Add to Blacklist
        const blacklist = getBlacklist();
        const lowerTag = tag.toLowerCase();
        if (!blacklist.includes(lowerTag)) {
            blacklist.push(lowerTag);
            saveBlacklist(blacklist);
        }

        // 2. Remove from all videos
        store.removeTagFromAll(tag);

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to blacklist tag' });
    }
});

module.exports = router;
