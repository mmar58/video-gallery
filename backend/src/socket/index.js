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

        // Track tagging state per socket? Or global?
        // Since it's a local tool, per socket is fine, or global to prevent collisions.
        // Let's use a "running" flag on the socket object itself for simplicity/cancellation.
        socket.isTagging = false;

        socket.on('stop-tagging', () => {
            if (socket.isTagging) {
                socket.isTagging = false; // This will break the loop
                socket.emit('tagging-log', { message: 'Stopping tagging process...', type: 'warning' });
            }
        });

        socket.on('start-tagging', async (data) => {
            if (socket.isTagging) {
                socket.emit('tagging-log', { message: 'Tagging already in progress.', type: 'warning' });
                return;
            }

            socket.isTagging = true;
            const { model } = data;
            const modelName = model || 'llama3'; // Default to a text model

            console.log(`Starting auto-tagging with model: ${modelName}`);
            socket.emit('tagging-log', { message: `Starting...`, type: 'info' });

            try {
                if (!fs.existsSync(VIDEO_DIR)) {
                    socket.emit('tagging-log', { message: 'Video directory not found!', type: 'error' });
                    socket.isTagging = false;
                    return;
                }

                const files = fs.readdirSync(VIDEO_DIR);
                const videos = files.filter(file => {
                    const ext = path.extname(file).toLowerCase();
                    return ['.mp4', '.webm', '.ogg', '.mov'].includes(ext);
                });

                socket.emit('tagging-log', { message: `Found ${videos.length} videos.`, type: 'info' });

                for (const video of videos) {
                    if (!socket.isTagging) {
                        socket.emit('tagging-log', { message: 'Tagging stopped by user.', type: 'warning' });
                        break;
                    }

                    const meta = store.get(video);
                    if (meta.tags && meta.tags.length > 0) {
                        // socket.emit('tagging-log', { message: `Skipping ${video}: Already tagged.`, type: 'info' }); // Too noisy?
                        continue;
                    }

                    socket.emit('tagging-log', { message: `Generating tags for: ${video}`, type: 'info' });

                    // Use filename as context
                    const baseName = path.basename(video, path.extname(video));
                    // enhanced prompt
                    const prompt = "Generate 5-8 relevant, concise keywords/tags based on the filename. Return ONLY tags, comma-separated. No sentences.";

                    try {
                        const response = await generateTagsFromText(modelName, baseName, prompt);

                        // Clean up response
                        let rawTags = response.split(/,|;|\n/).map(t => t.trim()).filter(t => t.length > 0);

                        // Filter Blacklist
                        const blacklist = getBlacklist();
                        rawTags = rawTags.filter(t => !blacklist.includes(t.toLowerCase()));

                        // Filter out nonsense or too long tags
                        const tags = rawTags.filter(t => t.length < 30);

                        if (tags.length > 0) {
                            store.update(video, { tags: tags });
                            socket.emit('tagging-log', { message: `Tagged ${video}: ${tags.join(', ')}`, type: 'success' });
                        } else {
                            socket.emit('tagging-log', { message: `No valid tags generated for ${video}.`, type: 'warning' });
                        }

                    } catch (err) {
                        console.error(`Error tagging ${video}:`, err);
                        socket.emit('tagging-log', { message: `Error: ${err.message}`, type: 'error' });
                    }
                }

                socket.emit('tagging-complete');

            } catch (err) {
                console.error('Tagging fatal error:', err);
                socket.emit('tagging-log', { message: 'Fatal error.', type: 'error' });
            } finally {
                socket.isTagging = false;
            }
        });

        socket.on('disconnect', () => {
            socket.isTagging = false;
            console.log('Client disconnected:', socket.id);
        });
    });
};
