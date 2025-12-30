const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
ffmpeg.setFfmpegPath(ffmpegPath);
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const VIDEO_DIR = path.join(__dirname, '../../../assets/videos');
const THUMBNAIL_DIR = path.join(__dirname, '../../../assets/thumbnails');

if (!fs.existsSync(THUMBNAIL_DIR)) {
    fs.mkdirSync(THUMBNAIL_DIR, { recursive: true });
}

// Helper: Get folder for specific video
const getVideoThumbDir = (filename) => {
    return path.join(THUMBNAIL_DIR, filename);
};

// Helper: Get duration using ffmpeg only (avoids ffprobe dependency)
const getVideoDuration = (filePath) => {
    return new Promise((resolve) => {
        // console.log(`[Debug] Probing: ${filePath}`);
        const proc = spawn(ffmpegPath, ['-i', filePath]);
        let stderr = '';
        proc.stderr.on('data', (d) => stderr += d.toString());
        proc.on('close', (code) => {
            // console.log(`[Debug] Probe finished with code ${code}`);
            // Search for "Duration: HH:MM:SS.mm"
            const match = stderr.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/);
            if (match) {
                const [_, h, m, s] = match;
                const seconds = (parseInt(h) * 3600) + (parseInt(m) * 60) + parseFloat(s);
                // console.log(`[Debug] Duration: ${seconds}s`);
                resolve(seconds);
            } else {
                console.warn(`[Warn] Could not parse duration for ${path.basename(filePath)}`);
                // console.warn(`[Debug] Stderr: ${stderr}`); // lengthy output
                resolve(null);
            }
        });
        proc.on('error', (err) => {
            console.error(`[Error] Failed to spawn ffmpeg for probe:`, err);
            resolve(null);
        });
    });
};

// Generate 5 thumbnails at 20% intervals
const generateThumbnail = (filename) => {
    return new Promise(async (resolve, reject) => {
        const videoPath = path.join(VIDEO_DIR, filename);
        const outputDir = getVideoThumbDir(filename);
        const mainThumbnailPath = path.join(outputDir, 'thumbnail_1.jpg');

        if (!fs.existsSync(videoPath)) return reject(new Error('Video not found'));
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

        // Check if main thumbnail already exists
        if (fs.existsSync(mainThumbnailPath)) return resolve(mainThumbnailPath);

        try {
            const duration = await getVideoDuration(videoPath);
            if (!duration) throw new Error('Could not determine video duration');

            // Calculate explicit timestamps (20%, 40%, 60%, 80%, 90%)
            // We use explicit seconds because % requires ffprobe in fluent-ffmpeg
            const timestamps = [0.2, 0.4, 0.6, 0.8, 0.9].map(p => duration * p);

            ffmpeg(videoPath)
                .screenshots({
                    count: 5,
                    folder: outputDir,
                    filename: 'thumbnail_%i.jpg',
                    size: '320x?',
                    timestamps: timestamps
                })
                .on('end', () => {
                    console.log(`[Thumbnail] Generated 5 thumbnails for ${filename}`);
                    // Copy thumbnail_3 (60%) as default
                    try {
                        const defaultThumb = path.join(outputDir, 'thumbnail.jpg');
                        // if default doesn't exist or we want to overwrite
                        fs.copyFileSync(path.join(outputDir, 'thumbnail_3.jpg'), defaultThumb);
                    } catch (e) { /* ignore */ }
                    resolve(path.join(outputDir, 'thumbnail.jpg'));
                })
                .on('error', (err) => {
                    console.error(`[Thumbnail] Error generating for ${filename}:`, err);
                    reject(err);
                });
        } catch (err) {
            reject(err);
        }
    });
};

const generatePreview = (filename) => {
    return new Promise(async (resolve, reject) => {
        const videoPath = path.join(VIDEO_DIR, filename);
        const outputDir = getVideoThumbDir(filename);
        const previewPath = path.join(outputDir, 'preview.jpg');

        if (!fs.existsSync(videoPath)) return reject(new Error('Video not found'));
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
        if (fs.existsSync(previewPath)) return resolve(previewPath);

        try {
            const duration = await getVideoDuration(videoPath);
            if (!duration) throw new Error('Could not determine video duration');

            // Target: 25 frames
            const fps = 25 / duration;

            ffmpeg(videoPath)
                .on('start', (cmd) => {
                    console.log(`[Preview] Generating Smart Sprite (Duration: ${duration}s, FPS: ${fps.toFixed(4)})`);
                })
                .on('end', () => {
                    console.log(`[Preview] Generated for ${filename}`);
                    resolve(previewPath);
                })
                .on('error', (err) => {
                    console.error(`[Preview] Error generating for ${filename}:`, err);
                    reject(err);
                })
                .videoFilters([
                    `fps=${fps}`,
                    'scale=160:-2',
                    'tile=5x5'
                ])
                .frames(1)
                .save(previewPath);
        } catch (err) {
            reject(err);
        }
    });
};

const deleteThumbnail = (filename) => {
    const outputDir = getVideoThumbDir(filename);
    if (fs.existsSync(outputDir)) {
        fs.rmSync(outputDir, { recursive: true, force: true });
    }
};

const getThumbnailPath = (filename, index = null) => {
    if (index) {
        return path.join(getVideoThumbDir(filename), `thumbnail_${index}.jpg`);
    }
    return path.join(getVideoThumbDir(filename), 'thumbnail.jpg');
};

const getPreviewPath = (filename) => {
    return path.join(getVideoThumbDir(filename), 'preview.jpg');
};

module.exports = {
    generateThumbnail,
    generatePreview,
    deleteThumbnail,
    getThumbnailPath,
    getPreviewPath
};
