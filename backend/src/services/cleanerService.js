const fs = require('fs');
const path = require('path');
const config = require('../config');
const store = require('../data/store');
const db = require('../data/db');

const THUMBNAIL_DIR = config.thumbnailsDir;

const cleanStorage = async () => {
    try {
        console.log('[Cleaner Worker] Starting storage cleanup...');

        // 1. Get all valid video files from all root directories
        const validVideos = new Set();
        
        // Ensure root directory if it's there
        const dirs = await db('root_directories').select('*');
        for (const dir of dirs) {
            if (fs.existsSync(dir.path)) {
                const files = fs.readdirSync(dir.path);
                files.forEach(file => {
                    const ext = path.extname(file).toLowerCase();
                    if (['.mp4', '.webm', '.ogg', '.mov', '.mkv', '.m4v', '.avi'].includes(ext)) {
                        // Keep track of valid keys just like they are stored in DB metadata
                        validVideos.add(`${dir.id}::${file}`);
                    }
                });
            }
        }

        // 2. Clean Database (Metadata Store)
        let storeCleanCount = 0;
        const allMetadata = await store.getAll();
        for (const key of Object.keys(allMetadata)) {
            // key could be "dirId::filename" or just "filename" for old records
            if (!validVideos.has(key)) {
                if (key.includes('::')) {
                    const [dirId, filename] = key.split('::');
                    await store.delete(dirId, filename);
                } else {
                    // For legacy records without directory_id
                    await store.delete(null, key);
                }
                storeCleanCount++;
            }
        }

        // 3. Clean Thumbnails/Previews
        let thumbCleanCount = 0;
        if (fs.existsSync(THUMBNAIL_DIR)) {
            const thumbItems = fs.readdirSync(THUMBNAIL_DIR);
            for (const item of thumbItems) {
                // The thumbnail directories are named exactly after the valid key
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
