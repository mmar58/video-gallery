const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { generateThumbnail, deleteThumbnail, getThumbnailPath, generatePreview, getPreviewPath } = require('../services/thumbnailService');

// Serve thumbnail file
router.get('/:filename', (req, res) => {
    const { filename } = req.params;
    const thumbnailPath = getThumbnailPath(filename);

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

module.exports = router;
