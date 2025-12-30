const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const store = require('../data/store');

const VIDEO_DIR = path.join(__dirname, '../../../assets/videos');

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
                    tags: meta.tags
                };
            });

        // Search
        const { search, tag, sort } = req.query;
        if (search) {
            const lowerSearch = search.toLowerCase();
            videos = videos.filter(v => v.name.toLowerCase().includes(lowerSearch) || v.tags.some(t => t.toLowerCase().includes(lowerSearch)));
        }
        if (tag) {
            videos = videos.filter(v => v.tags.includes(tag));
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

// DELETE /api/videos/:filename - Delete video
router.delete('/:filename', (req, res) => {
    const filePath = getPath(req.params.filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });

    fs.unlink(filePath, (err) => {
        if (err) return res.status(500).json({ error: 'Delete failed' });

        // Sync metadata
        store.delete(req.params.filename);
        res.json({ success: true });
    });
});

module.exports = router;
