const fs = require('fs');
const path = require('path');
const { generateTagsFromText } = require('../services/ollamaService');
const store = require('../data/store');

const VIDEO_DIR = path.join(__dirname, '../../../assets/videos');
const BLACKLIST_FILE = path.join(__dirname, '../data/blacklist.json');

// Helper to get blacklist
const getBlacklist = () => {
    if (!fs.existsSync(BLACKLIST_FILE)) return [];
    try {
        return JSON.parse(fs.readFileSync(BLACKLIST_FILE, 'utf8'));
    } catch (e) { return []; }
};

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        // Track tagging state per socket
        socket.isTagging = false;
        socket.abortController = null;

        socket.on('stop-tagging', () => {
            if (socket.isTagging) {
                socket.isTagging = false;
                if (socket.abortController) {
                    socket.abortController.abort(); // Cancel current request immediately
                }
                socket.emit('tagging-log', { message: 'Stopping...', type: 'warning' });
                socket.emit('tagging-status', { isTagging: false });
            }
        });

        socket.on('start-tagging', async (data) => {
            if (socket.isTagging) {
                socket.emit('tagging-log', { message: 'Tagging already in progress.', type: 'warning' });
                return;
            }

            socket.isTagging = true;
            socket.abortController = new AbortController();
            socket.emit('tagging-status', { isTagging: true });

            const { model } = data;
            const modelName = model || 'llama3';

            console.log(`Starting auto-tagging with model: ${modelName}`);
            socket.emit('tagging-log', { message: `Starting...`, type: 'info' });

            try {
                if (!fs.existsSync(VIDEO_DIR)) {
                    socket.emit('tagging-log', { message: 'Video directory not found!', type: 'error' });
                    return;
                }

                const files = fs.readdirSync(VIDEO_DIR);
                const videos = files.filter(file => {
                    const ext = path.extname(file).toLowerCase();
                    return ['.mp4', '.webm', '.ogg', '.mov'].includes(ext);
                });

                socket.emit('tagging-log', { message: `Found ${videos.length} videos.`, type: 'info' });

                for (const video of videos) {
                    // Double check stop status before starting next
                    if (!socket.isTagging) {
                        break;
                    }

                    const meta = store.get(video);
                    if (meta.tags && meta.tags.length > 0) {
                        continue;
                    }

                    socket.emit('tagging-log', { message: `Analysing: ${video.slice(0, 25)}...`, type: 'info' });

                    const baseName = path.basename(video, path.extname(video));
                    const prompt = "Generate 5-8 relevant, concise keywords/tags based on the filename. Return ONLY tags, comma-separated. No sentences.";

                    try {
                        // Pass signal to service
                        const response = await generateTagsFromText(modelName, baseName, prompt, socket.abortController.signal);

                        let rawTags = response.split(/,|;|\n/).map(t => t.trim()).filter(t => t.length > 0);

                        const blacklist = getBlacklist();
                        rawTags = rawTags.filter(t => !blacklist.includes(t.toLowerCase()));

                        const tags = rawTags.filter(t => t.length < 30);

                        if (tags.length > 0) {
                            store.update(video, { tags: tags });
                            socket.emit('tagging-log', { message: `Tagged: ${tags.join(', ')}`, type: 'success' });
                        } else {
                            socket.emit('tagging-log', { message: `No tags generated.`, type: 'warning' });
                        }

                        // Small delay to allow event loop to process other events (like stop)
                        await new Promise(resolve => setTimeout(resolve, 1000));

                    } catch (err) {
                        if (err.message === 'Aborted' || err.name === 'AbortError') {
                            socket.emit('tagging-log', { message: 'Tagging stopped.', type: 'warning' });
                            break; // Exit loop
                        }
                        console.error(`Error tagging ${video}:`, err);
                        socket.emit('tagging-log', { message: `Error: ${err.message}`, type: 'error' });
                    }
                }

                if (socket.isTagging) {
                    socket.emit('tagging-log', { message: 'Process complete!', type: 'success' });
                    socket.emit('tagging-complete');
                }

            } catch (err) {
                console.error('Tagging fatal error:', err);
                socket.emit('tagging-log', { message: 'Fatal error.', type: 'error' });
            } finally {
                socket.isTagging = false;
                socket.emit('tagging-status', { isTagging: false });
                socket.abortController = null;
            }
        });

        socket.on('disconnect', () => {
            socket.isTagging = false;
            console.log('Client disconnected:', socket.id);
        });

        // --- Auto Thumbnail Socket Logic ---
        socket.on('stop-thumbnails', () => {
            socket.isGeneratingThumbnails = false;
            socket.emit('thumbnail-log', { message: 'Stopping...', type: 'warning' });
            socket.emit('thumbnail-status', { isGenerating: false });
        });

        socket.on('start-thumbnails', async (data) => {
            if (socket.isGeneratingThumbnails) return;

            socket.isGeneratingThumbnails = true;
            socket.emit('thumbnail-status', { isGenerating: true });
            socket.emit('thumbnail-log', { message: 'Starting thumbnail generation...', type: 'info' });

            const { force, previews } = data || {};
            const { generateThumbnail, generatePreview } = require('../services/thumbnailService');

            try {
                if (!fs.existsSync(VIDEO_DIR)) {
                    socket.emit('thumbnail-log', { message: 'Video directory not found!', type: 'error' });
                    return;
                }

                const files = fs.readdirSync(VIDEO_DIR);
                const videos = files.filter(file => {
                    const ext = path.extname(file).toLowerCase();
                    return ['.mp4', '.webm', '.ogg', '.mov'].includes(ext);
                });

                socket.emit('thumbnail-log', { message: `Found ${videos.length} videos.`, type: 'info' });

                for (const [index, video] of videos.entries()) {
                    if (!socket.isGeneratingThumbnails) break;

                    const percent = Math.round(((index + 1) / videos.length) * 100);
                    socket.emit('thumbnail-progress', percent);
                    socket.emit('thumbnail-log', { message: `Processing ${video}...`, type: 'info' });

                    try {
                        // 1. Static Thumbnail
                        // By default service checks existence. If "force" is true, we might need to delete first or just rely on overwrite if service supports it.
                        // Impl: create logic to skip if exists and !force
                        // ... Since we can't easily peek into service, let's just call it. Service currently checks fs.existsSync.
                        // Ideally we should update service to accept 'force'. 
                        // For now we will rely on service's check. If user wants FORCE, we should probably delete the file before calling generate.

                        const THUMB_DIR = path.join(__dirname, '../../../assets/thumbnails');
                        const videoThumbDir = path.join(THUMB_DIR, video);
                        const tPath = path.join(videoThumbDir, 'thumbnail.jpg');
                        const pPath = path.join(videoThumbDir, 'preview.jpg');

                        // Static
                        // If force, we can just delete the whole folder? Or individual files?
                        // Service will mkdir if needed.
                        if (force && fs.existsSync(tPath)) fs.unlinkSync(tPath);
                        await generateThumbnail(video);

                        // Preview
                        if (previews) {
                            if (force && fs.existsSync(pPath)) fs.unlinkSync(pPath);
                            await generatePreview(video);
                        }

                        socket.emit('thumbnail-log', { message: `Generated for ${video}`, type: 'success' });
                    } catch (err) {
                        socket.emit('thumbnail-log', { message: `Error: ${err.message}`, type: 'error' });
                    }

                    // Small delay
                    await new Promise(r => setTimeout(r, 100));
                }

                if (socket.isGeneratingThumbnails) {
                    socket.emit('thumbnail-log', { message: 'Thumbnail generation complete!', type: 'success' });
                }

            } catch (err) {
                console.error(err);
                socket.emit('thumbnail-log', { message: 'Fatal error', type: 'error' });
            } finally {
                socket.isGeneratingThumbnails = false;
                socket.emit('thumbnail-status', { isGenerating: false });
            }
        });
    });
};
