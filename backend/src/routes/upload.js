const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

const config = require('../config');

// Ensure uploads directory exists
const uploadDir = config.videosDir;
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Ensure thumbnails directory exists (standard convention from readme)
const thumbnailDir = config.thumbnailsDir;
if (!fs.existsSync(thumbnailDir)) {
    fs.mkdirSync(thumbnailDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Use original name but sanitize or ensure uniqueness if needed. 
        // For now, keeping original name as requested for simplicity
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

router.post('/', upload.single('video'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    res.json({ message: 'File uploaded successfully', file: req.file });
});

module.exports = router;
