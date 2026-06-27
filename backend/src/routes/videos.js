const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const store = require('../data/store');

const config = require('../config');

const VIDEO_DIR = config.videosDir;

// Helper to get full path
const getPath = (filename) => path.join(VIDEO_DIR, filename);

// GET /api/videos - List all videos with metadata, search, and sort
router.get('/', (req, res) => {
    if (!fs.existsSync(VIDEO_DIR)) {
        return res.status(404).json({ error: 'Video directory not found' });
    }

    fs.readdir(VIDEO_DIR, (err, files) => {
        if (err) return res.status(500).json({ error: 'Failed to read directory' });

        let videos = files
            .filter(file => {
                const ext = path.extname(file).toLowerCase();
                return ['.mp4', '.webm', '.ogg', '.mov'].includes(ext);
            })
            .map(file => {
                const stats = fs.statSync(getPath(file));
                const meta = store.get(file);
                return {
                    name: file,
                    size: stats.size,
                    created: stats.birthtime,
                    likes: meta.likes,
                    tags: meta.tags,
                    hideUntil: meta.hideUntil
                };
            });

        // Search
        const { search, tag, sort, days, dateFrom, dateTo, hidden } = req.query;
        if (search) {
            const lowerSearch = search.toLowerCase();
            videos = videos.filter(v => v.name.toLowerCase().includes(lowerSearch) || v.tags.some(t => t.toLowerCase().includes(lowerSearch)));
        }
        if (tag) {
            videos = videos.filter(v => v.tags.includes(tag));
        }

        // Hidden Filter
        const nowMs = Date.now();
        if (hidden === 'true') {
            // Show ONLY hidden videos
            videos = videos.filter(v => v.hideUntil && v.hideUntil > nowMs);
        } else {
            // Show only NON-hidden videos
            videos = videos.filter(v => !v.hideUntil || v.hideUntil <= nowMs);
        }

        // Date Filtering
        if (days) {
            const now = new Date();
            const past = new Date();
            past.setDate(now.getDate() - parseInt(days));
            videos = videos.filter(v => v.created >= past);
        } else if (dateFrom || dateTo) {
            if (dateFrom) {
                const from = new Date(dateFrom);
                videos = videos.filter(v => v.created >= from);
            }
            if (dateTo) {
                const to = new Date(dateTo);
                // Set to end of day
                to.setHours(23, 59, 59, 999);
                videos = videos.filter(v => v.created <= to);
            }
        }

        // Sort
        if (sort === 'likes') {
            videos.sort((a, b) => b.likes - a.likes);
        } else if (sort === 'random') {
            videos.sort(() => Math.random() - 0.5);
        } else if (sort === 'date') {
            videos.sort((a, b) => b.created - a.created);
        } else {
            // Default: Alphabetical
            videos.sort((a, b) => a.name.localeCompare(b.name));
        }

        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const total = videos.length;
        const totalPages = Math.ceil(total / limit);
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        const paginatedVideos = videos.slice(startIndex, endIndex);

        res.json({
            videos: paginatedVideos,
            pagination: {
                page,
                limit,
                total,
                totalPages
            }
        });
    });
});

// GET /api/videos/:filename/stream - Stream video
router.get('/:filename/stream', (req, res) => {
    const filePath = getPath(req.params.filename);
    if (!fs.existsSync(filePath)) return res.status(404).send('File not found');

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(filePath, { start, end });
        const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'video/mp4',
        };
        res.writeHead(206, head);
        file.pipe(res);
    } else {
        const head = {
            'Content-Length': fileSize,
            'Content-Type': 'video/mp4',
        };
        res.writeHead(200, head);
        fs.createReadStream(filePath).pipe(res);
    }
});

// POST /api/videos/:filename/like - Like video
router.post('/:filename/like', (req, res) => {
    const meta = store.update(req.params.filename, {
        likes: (store.get(req.params.filename).likes || 0) + 1
    });
    res.json(meta);
});

// POST /api/videos/:filename/hide - Hide video for X days
router.post('/:filename/hide', (req, res) => {
    const { days } = req.body;
    let hideUntil = null;
    
    if (days && typeof days === 'number' && days > 0) {
        hideUntil = Date.now() + days * 24 * 60 * 60 * 1000;
    }
    
    const meta = store.update(req.params.filename, { hideUntil });
    res.json(meta);
});

// PUT /api/videos/:filename - Rename video
router.put('/:filename', (req, res) => {
    const oldName = req.params.filename;
    const newName = req.body.newName;

    if (!newName) return res.status(400).json({ error: 'New name required' });

    // Validate new extension matches old (security)
    if (path.extname(oldName) !== path.extname(newName)) {
        return res.status(400).json({ error: 'Cannot change file extension' });
    }

    const oldPath = getPath(oldName);
    const newPath = getPath(newName);

    if (fs.existsSync(newPath)) {
        return res.status(409).json({ error: 'File with new name already exists' });
    }

    fs.rename(oldPath, newPath, (err) => {
        if (err) return res.status(500).json({ error: 'Rename failed' });

        // Sync metadata
        store.rename(oldName, newName);
        res.json({ success: true, newName });
    });
});

const { deleteThumbnail } = require('../services/thumbnailService');

// DELETE /api/videos/:filename - Delete video
router.delete('/:filename', (req, res) => {
    const filePath = getPath(req.params.filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });

    fs.unlink(filePath, (err) => {
        if (err) return res.status(500).json({ error: 'Delete failed' });

        // Sync metadata
        store.delete(req.params.filename);

        // Remove thumbnail
        deleteThumbnail(req.params.filename);

        res.json({ success: true });
    });
});

// GET /api/videos/stats - Get video statistics (date distribution)
router.get('/stats', (req, res) => {
    if (!fs.existsSync(VIDEO_DIR)) {
        return res.status(404).json({ error: 'Video directory not found' });
    }

    fs.readdir(VIDEO_DIR, (err, files) => {
        if (err) return res.status(500).json({ error: 'Failed to read directory' });

        const videoFiles = files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.mp4', '.webm', '.ogg', '.mov'].includes(ext);
        });

        const months = {};
        let minDate = new Date();
        let maxDate = new Date(0);

        videoFiles.forEach(file => {
            const stats = fs.statSync(getPath(file));
            const date = stats.birthtime;
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (months[key]) months[key]++;
            else months[key] = 1;

            if (date < minDate) minDate = date;
            if (date > maxDate) maxDate = date;
        });

        res.json({
            distributions: months, // e.g., {'2024-12': 5, '2024-11': 2}
            minDate,
            maxDate,
            totalVideos: videoFiles.length
        });
    });
});

// GET /api/videos/tags - Get all unique tags (Specific route before parameters ideally, but safe here due to different methods/paths)
router.get('/tags', (req, res) => {
    const allData = store.getAll();
    const tags = new Set();
    Object.values(allData).forEach(meta => {
        if (meta.tags && Array.isArray(meta.tags)) {
            meta.tags.forEach(tag => tags.add(tag));
        }
    });
    res.json(Array.from(tags).sort());
});

// POST /api/videos/:filename/tags - Add tag
router.post('/:filename/tags', (req, res) => {
    const { tag } = req.body;
    if (!tag) return res.status(400).json({ error: 'Tag is required' });

    const currentData = store.get(req.params.filename);
    const currentTags = currentData.tags || [];

    if (!currentTags.includes(tag)) {
        const meta = store.update(req.params.filename, {
            tags: [...currentTags, tag]
        });
        res.json(meta);
    } else {
        res.json(currentData);
    }
});

// DELETE /api/videos/:filename/tags/:tag - Remove tag
router.delete('/:filename/tags/:tag', (req, res) => {
    const { tag } = req.params;
    const currentData = store.get(req.params.filename);
    const currentTags = currentData.tags || [];

    const newTags = currentTags.filter(t => t !== tag);
    const meta = store.update(req.params.filename, {
        tags: newTags
    });
    res.json(meta);
});

// GET /api/tags - Get all unique tags
router.get('/tags', (req, res) => {
    const allData = store.getAll();
    const tags = new Set();
    Object.values(allData).forEach(meta => {
        if (meta.tags && Array.isArray(meta.tags)) {
            meta.tags.forEach(tag => tags.add(tag));
        }
    });
    res.json(Array.from(tags).sort());
});

// POST /api/videos/:filename/tags - Add tag
router.post('/:filename/tags', (req, res) => {
    const { tag } = req.body;
    if (!tag) return res.status(400).json({ error: 'Tag is required' });

    const currentData = store.get(req.params.filename);
    const currentTags = currentData.tags || [];

    if (!currentTags.includes(tag)) {
        const meta = store.update(req.params.filename, {
            tags: [...currentTags, tag]
        });
        res.json(meta);
    } else {
        res.json(currentData);
    }
});

// DELETE /api/videos/:filename/tags/:tag - Remove tag
router.delete('/:filename/tags/:tag', (req, res) => {
    const { tag } = req.params;
    const currentData = store.get(req.params.filename);
    const currentTags = currentData.tags || [];

    const newTags = currentTags.filter(t => t !== tag);
    const meta = store.update(req.params.filename, {
        tags: newTags
    });
    res.json(meta);
});

// POST /api/videos/:filename/trim - Trim video
router.post('/:filename/trim', (req, res) => {
    const { start, end, saveAsNew, newName } = req.body;
    const filename = req.params.filename;
    const filePath = getPath(filename);

    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });
    if (start === undefined || end === undefined) return res.status(400).json({ error: 'Start and end times required' });

    // Validate times (basic)
    if (parseFloat(start) >= parseFloat(end)) {
        return res.status(400).json({ error: 'Start time must be before end time' });
    }

    const ffmpeg = require('fluent-ffmpeg');
    const ffmpegPath = require('ffmpeg-static');
    ffmpeg.setFfmpegPath(ffmpegPath);

    const outputName = saveAsNew && newName ? newName : (saveAsNew ? `trimmed-${Date.now()}-${filename}` : `temp-${filename}`);
    // Ensure output extension matches input
    const ext = path.extname(filename);
    const finalOutputName = path.extname(outputName) === ext ? outputName : outputName + ext;
    const outputPath = getPath(finalOutputName);

    if (fs.existsSync(outputPath)) {
        return res.status(409).json({ error: 'Output file already exists' });
    }

    ffmpeg(filePath)
        .setStartTime(start)
        .setDuration(parseFloat(end) - parseFloat(start))
        .output(outputPath)
        .on('end', () => {
            if (saveAsNew) {
                // Add to store
                store.add(finalOutputName);
                // Generate assets
                require('../services/thumbnailService').generateThumbnail(finalOutputName);
                require('../services/thumbnailService').generatePreview(finalOutputName);

                res.json({ success: true, newFile: finalOutputName });
            } else {
                // Replace original
                // 1. Delete original
                fs.unlink(filePath, (err) => {
                    if (err) {
                        console.error("Failed to delete original after trim:", err);
                        // Try to keep temp file at least?
                        return res.status(500).json({ error: 'Failed to replace file' });
                    }
                    // 2. Rename temp to original
                    fs.rename(outputPath, filePath, (err) => {
                        if (err) return res.status(500).json({ error: 'Failed to rename temp file' });

                        // Regenerate assets for the modified video
                        require('../services/thumbnailService').generateThumbnail(filename);
                        require('../services/thumbnailService').generatePreview(filename);

                        res.json({ success: true });
                    });
                });
            }
        })
        .on('error', (err) => {
            console.error('Error trimming video:', err);
            res.status(500).json({ error: 'Failed to trim video' });
        })
        .run();
});

module.exports = router;
