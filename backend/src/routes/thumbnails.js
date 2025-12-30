const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { generateThumbnail, deleteThumbnail, getThumbnailPath, generatePreview, getPreviewPath } = require('../services/thumbnailService');

// Serve thumbnail file
router.get('/:filename', (req, res) => {
    const { filename } = req.params;
    const { index } = req.query; // Support ?index=1 etc.
    const thumbnailPath = getThumbnailPath(filename, index);

    if (fs.existsSync(thumbnailPath)) {
        res.sendFile(thumbnailPath);
    } else {
        res.status(404).json({ error: 'Thumbnail not found' });
    }
});

// Generate thumbnail for a video
router.post('/:filename', async (req, res) => {
    try {
        const { filename } = req.params;
        await generateThumbnail(filename);
        res.json({ success: true, message: 'Thumbnail generated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete thumbnail
router.delete('/:filename', (req, res) => {
    const { filename } = req.params;
    deleteThumbnail(filename);
    res.json({ success: true });
});

// Serve preview file
router.get('/:filename/preview', (req, res) => {
    const { filename } = req.params;
    const previewPath = getPreviewPath(filename);

    if (fs.existsSync(previewPath)) {
        res.sendFile(previewPath);
    } else {
        res.status(404).json({ error: 'Preview not found' });
    }
});

// Generate preview for a video
router.post('/:filename/preview', async (req, res) => {
    try {
        const { filename } = req.params;
        await generatePreview(filename);
        res.json({ success: true, message: 'Preview generated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get details of generated assets
router.get('/:filename/details', (req, res) => {
    const { filename } = req.params;
    // We can deduce the directory from the default thumbnail path
    const defaultThumbPath = getThumbnailPath(filename);
    const dir = path.dirname(defaultThumbPath);

    if (!fs.existsSync(dir)) {
        return res.json({ assets: [] });
    }

    try {
        const files = fs.readdirSync(dir);
        const assets = files.map(file => {
            const stats = fs.statSync(path.join(dir, file));
            return {
                name: file,
                size: stats.size,
                created: stats.birthtime
            };
        });
        res.json({ assets });
    } catch (e) {
        res.status(500).json({ error: 'Failed to read asset details' });
    }
});

module.exports = router;
