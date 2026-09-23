import fs from 'fs';
import path from 'path';
import db from '../data/db';
import thumbnailService from './thumbnailService';

// Time interval to scan (e.g. 5 minutes)
const SCAN_INTERVAL = 5 * 60 * 1000;

let isScanning = false;

export const scanDirectories = async () => {
    if (isScanning) return;
    isScanning = true;
    try {
        console.log('[Scanner] Starting directory scan...');
        const dirs = await db('root_directories').select('*');

        for (const dir of dirs) {
            if (!fs.existsSync(dir.path)) {
                console.warn(`[Scanner] Directory not found on disk, skipping: ${dir.path}`);
                continue;
            }

            const files = fs.readdirSync(dir.path);
            const videoFiles = files.filter(file => {
                const ext = path.extname(file).toLowerCase();
                return ['.mp4', '.webm', '.ogg', '.mov', '.mkv', '.m4v', '.avi'].includes(ext);
            });

            // Keep track of files on disk to clean up deleted files
            const filesOnDisk = new Set(videoFiles);

            for (const file of videoFiles) {
                const filePath = path.join(dir.path, file);
                try {
                    const stats = fs.statSync(filePath);
                    
                    // Upsert into db
                    const existing = await db('videos').where({ directory_id: dir.id, filename: file }).first();
                    
                    if (existing) {
                        // Check if file size or mtime changed to update it
                        // Convert dates to timestamps for comparison, or just update if we want
                        await db('videos').where({ id: existing.id }).update({
                            size: stats.size,
                            file_created_at: stats.birthtime,
                            file_updated_at: stats.mtime
                        });
                    } else {
                        await db('videos').insert({
                            directory_id: dir.id,
                            filename: file,
                            size: stats.size,
                            file_created_at: stats.birthtime,
                            file_updated_at: stats.mtime,
                            likes: 0
                        });
                    }
                } catch (err) {
                    console.error(`[Scanner] Error processing file ${file} in dir ${dir.id}:`, err);
                }
            }

            // Cleanup deleted files
            const dbVideos = await db('videos').where({ directory_id: dir.id }).select('*');
            for (const dbVideo of dbVideos) {
                if (!filesOnDisk.has(dbVideo.filename)) {
                    console.log(`[Scanner] File deleted from disk, removing from DB: ${dbVideo.filename}`);
                    await db('videos').where({ id: dbVideo.id }).delete();
                    
                    // Thumbnails are keyed by combined name in routes
                    const combinedName = `${dir.id}::${dbVideo.filename}`;
                    try {
                        thumbnailService.deleteThumbnail(combinedName);
                    } catch (err) {
                        console.error(`[Scanner] Failed to delete thumbnail for ${combinedName}`, err);
                    }
                }
            }
        }
        console.log('[Scanner] Directory scan completed.');
    } catch (error) {
        console.error('[Scanner] Error during scan:', error);
    } finally {
        isScanning = false;
    }
};

export const startScanner = () => {
    // Run immediately on boot
    scanDirectories();
    // Schedule periodic runs
    setInterval(scanDirectories, SCAN_INTERVAL);
};
