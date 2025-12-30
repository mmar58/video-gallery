const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
ffmpeg.setFfmpegPath(ffmpegPath);
const path = require('path');
const fs = require('fs');

const VIDEO_DIR = path.join(__dirname, '../../assets/video');
const THUMBNAIL_DIR = path.join(__dirname, '../../assets/thumbnails');

if (!fs.existsSync(THUMBNAIL_DIR)) {
    fs.mkdirSync(THUMBNAIL_DIR, { recursive: true });
}

const generateThumbnail = (filename) => {
    return new Promise((resolve, reject) => {
        const videoPath = path.join(VIDEO_DIR, filename);
        const thumbnailPath = path.join(THUMBNAIL_DIR, `${filename}.jpg`);

        if (!fs.existsSync(videoPath)) {
            return reject(new Error('Video not found'));
        }

        // Check if thumbnail already exists
        if (fs.existsSync(thumbnailPath)) {
            return resolve(thumbnailPath);
        }

        ffmpeg(videoPath)
            .screenshots({
                count: 1,
                folder: THUMBNAIL_DIR,
                filename: `${filename}.jpg`,
                size: '320x?', // Fixed width, auto height
            })
            .on('end', () => {
                console.log(`[Thumbnail] Generated for ${filename}`);
                resolve(thumbnailPath);
            })
            .on('error', (err) => {
                console.error(`[Thumbnail] Error generating for ${filename}:`, err);
                reject(err);
            });
    });
};

const generatePreview = (filename) => {
    return new Promise((resolve, reject) => {
        const videoPath = path.join(VIDEO_DIR, filename);
        const previewPath = path.join(THUMBNAIL_DIR, `${filename}_preview.jpg`);

        if (!fs.existsSync(videoPath)) {
            return reject(new Error('Video not found'));
        }

        if (fs.existsSync(previewPath)) {
            return resolve(previewPath);
        }

        // Generate 5x5 sprite sheet (25 frames)
        // select='not(mod(n,100))': select one frame every 100 frames (adjust based on duration? fixed for now)
        // scale=160:-1: downscale width to 160px per frame
        // tile=5x5: arrange in grid
        ffmpeg(videoPath)
            .on('end', () => {
                console.log(`[Preview] Generated for ${filename}`);
                resolve(previewPath);
            })
            .on('error', (err) => {
                console.error(`[Preview] Error generating for ${filename}:`, err);
                reject(err);
            })
            .complexFilter([
                'fps=1', // 1 frame per second to pick from
                'scale=160:-1', // Resize each frame
                'tile=5x5' // Grid layout
            ])
            .frames(1) // Output single image
            .save(previewPath);
    });
};

const deleteThumbnail = (filename) => {
    const thumbnailPath = path.join(THUMBNAIL_DIR, `${filename}.jpg`);
    if (fs.existsSync(thumbnailPath)) {
        fs.unlinkSync(thumbnailPath);
    }
    const previewPath = path.join(THUMBNAIL_DIR, `${filename}_preview.jpg`);
    if (fs.existsSync(previewPath)) {
        fs.unlinkSync(previewPath);
    }
};

const getThumbnailPath = (filename) => {
    return path.join(THUMBNAIL_DIR, `${filename}.jpg`);
};

const getPreviewPath = (filename) => {
    return path.join(THUMBNAIL_DIR, `${filename}_preview.jpg`);
};

module.exports = {
    generateThumbnail,
    generatePreview,
    deleteThumbnail,
    getThumbnailPath,
    getPreviewPath
};
