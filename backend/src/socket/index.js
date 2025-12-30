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
    });

    socket.on('disconnect', () => {
        socket.isTagging = false;
        console.log('Client disconnected:', socket.id);
    });
});
};
