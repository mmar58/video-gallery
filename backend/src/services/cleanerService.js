const fs = require('fs');
const path = require('path');
const config = require('../config');
const store = require('../data/store');

const VIDEO_DIR = config.videosDir;
const THUMBNAIL_DIR = config.thumbnailsDir;

const cleanStorage = async () => {
    try {
        console.log('[Cleaner Worker] Starting storage cleanup...');

        // 1. Get all valid video files
        if (!fs.existsSync(VIDEO_DIR)) {
            console.log('[Cleaner Worker] Video directory does not exist yet. Skipping cleanup.');
            return;
        }

        const files = fs.readdirSync(VIDEO_DIR);
        const validVideos = new Set(
            files.filter(file => {
                const ext = path.extname(file).toLowerCase();
                return ['.mp4', '.webm', '.ogg', '.mov'].includes(ext);
            })
        );

        // 2. Clean Database (Metadata Store)
        let storeCleanCount = 0;
        const allMetadata = store.getAll();
        for (const filename of Object.keys(allMetadata)) {
            if (!validVideos.has(filename)) {
                store.delete(filename);
                storeCleanCount++;
            }
        }

        // 3. Clean Thumbnails/Previews
        let thumbCleanCount = 0;
        if (fs.existsSync(THUMBNAIL_DIR)) {
            const thumbItems = fs.readdirSync(THUMBNAIL_DIR);
            for (const item of thumbItems) {
                // The thumbnail directories are named exactly after the video filename
                if (!validVideos.has(item)) {
                    const itemPath = path.join(THUMBNAIL_DIR, item);
                    fs.rmSync(itemPath, { recursive: true, force: true });
                    thumbCleanCount++;
                }
            }
        }

        console.log(`[Cleaner Worker] Cleanup finished. Removed ${storeCleanCount} database entries and ${thumbCleanCount} thumbnail folders.`);
    } catch (error) {
        console.error('[Cleaner Worker] Error during storage cleanup:', error);
    }
};

const startCleanerWorker = () => {
    // Run asynchronously on startup so it doesn't block server initialization
    setTimeout(cleanStorage, 1000);

    // Run periodically every 3 hours (3 * 60 * 60 * 1000 ms)
    setInterval(cleanStorage, 3 * 60 * 60 * 1000);
};

module.exports = {
    cleanStorage,
    startCleanerWorker
};
