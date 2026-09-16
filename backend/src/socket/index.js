const fs = require('fs');
const path = require('path');
const { generateTagsFromText } = require('../services/ollamaService');
const store = require('../data/store');
const { getOllamaSettings } = require('../data/settingsStore');

const config = require('../config');

const VIDEO_DIR = config.videosDir;
const BLACKLIST_FILE = path.join(config.dataDir, 'blacklist.json');

// Helper to get blacklist
const getBlacklist = () => {
    if (!fs.existsSync(BLACKLIST_FILE)) return [];
    try {
        return JSON.parse(fs.readFileSync(BLACKLIST_FILE, 'utf8'));
    } catch (e) { return []; }
};

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your_default_secret_key_change_in_production';

const getUserIdFromToken = (token) => {
    if (!token) return null;
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded.id;
    } catch (err) {
        return null;
    }
};

const getAllowedDirectories = async (userId) => {
    const db = require('../data/db');
    const dirs = await db('root_directories').select('*');
    if (!userId) return []; // Require valid user to get directories
    
    const hiddenPerms = await db('user_directory_permissions')
        .where({ user_id: userId, is_hidden: true });
        
    const hiddenDirIds = new Set(hiddenPerms.map(p => p.directory_id));
    return dirs.filter(d => !hiddenDirIds.has(d.id));
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

        async function runTagging(modelMap, socket, data) {
            socket.isTagging = true;
            socket.abortController = new AbortController();
            socket.emit('tagging-status', { isTagging: true });
            
            socket.emit('tagging-log', { message: `Starting...`, type: 'info' });

            try {
                const userId = getUserIdFromToken(data.token);
                if (!userId) {
                    socket.emit('tagging-log', { message: 'Unauthorized: Invalid token.', type: 'error' });
                    return;
                }

                const dirs = await getAllowedDirectories(userId);
                let allVideos = [];
                
                for (const dir of dirs) {
                    if (!fs.existsSync(dir.path)) continue;
                    const files = fs.readdirSync(dir.path);
                    const videos = files.filter(file => {
                        const ext = path.extname(file).toLowerCase();
                        return ['.mp4', '.webm', '.ogg', '.mov', '.mkv', '.m4v', '.avi'].includes(ext);
                    }).map(file => {
                        return { dirId: dir.id, filename: file, path: path.join(dir.path, file) };
                    });
                    allVideos = allVideos.concat(videos);
                }

                socket.emit('tagging-log', { message: `Found ${allVideos.length} videos.`, type: 'info' });

                const { getModelsPerServer } = require('../services/ollamaService');
                const servers = await getModelsPerServer();
                let concurrency = 0;
                for (const server of servers) {
                    const epId = server.endpoint.id;
                    if (modelMap[epId] && modelMap[epId] !== 'skip') {
                        concurrency += server.endpoint.weight;
                    }
                }
                if (concurrency < 1) concurrency = 1;

                let index = 0;
                const blacklist = getBlacklist();

                async function worker() {
                    while (index < allVideos.length && socket.isTagging) {
                        const videoObj = allVideos[index++];
                        
                        const meta = await store.get(videoObj.filename);
                        if (meta.tags && meta.tags.length > 0) {
                            continue;
                        }

                        socket.emit('tagging-log', { message: `Analysing: ${videoObj.filename.slice(0, 25)}...`, type: 'info' });

                        const baseName = path.basename(videoObj.filename, path.extname(videoObj.filename));
                        const prompt = "Generate 5-8 relevant, concise keywords/tags based on the filename. Return ONLY tags, comma-separated. No sentences.";

                        try {
                            const response = await generateTagsFromText(
                                modelMap, 
                                baseName, 
                                prompt, 
                                socket.abortController.signal,
                                (msg, type) => {
                                    if (socket.isTagging) {
                                        socket.emit('tagging-log', { message: msg, type });
                                    }
                                }
                            );

                            let rawTags = response.split(/,|;|\n/).map(t => t.trim()).filter(t => t.length > 0);
                            rawTags = rawTags.filter(t => !blacklist.includes(t.toLowerCase()));
                            const tags = rawTags.filter(t => t.length < 30);

                            if (tags.length > 0) {
                                await store.update(videoObj.filename, { tags: tags });
                                socket.emit('tagging-log', { message: `Tagged: ${tags.join(', ')}`, type: 'success' });
                            } else {
                                socket.emit('tagging-log', { message: `No tags generated.`, type: 'warning' });
                            }

                            await new Promise(resolve => setTimeout(resolve, 1000));
                        } catch (err) {
                            if (err.message === 'Aborted' || err.name === 'AbortError') {
                                socket.emit('tagging-log', { message: 'Tagging stopped.', type: 'warning' });
                                break;
                            }
                            console.error(`Error tagging ${videoObj.filename}:`, err);
                            socket.emit('tagging-log', { message: `Error: ${err.message}`, type: 'error' });
                        }
                    }
                }

                const workers = [];
                for (let i = 0; i < concurrency; i++) {
                    workers.push(worker());
                }
                await Promise.all(workers);

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
        }

        socket.on('start-tagging-confirmed', async (data) => {
            if (socket.isTagging) return;
            await runTagging(data.modelMap, socket, data);
        });

        socket.on('start-tagging', async (data) => {
            if (socket.isTagging) {
                socket.emit('tagging-log', { message: 'Tagging already in progress.', type: 'warning' });
                return;
            }

            const { model } = data || {};
            const settings = await getOllamaSettings();
            const modelName = model || settings.tagModel || 'llama3';

            console.log(`Checking models for auto-tagging with default model: ${modelName}`);

            try {
                const { getModelsPerServer } = require('../services/ollamaService');
                const servers = await getModelsPerServer();
                
                const mismatchServers = [];
                const modelMap = {};

                for (const server of servers) {
                    const hasModel = server.models.some(m => m.name === modelName);
                    if (!hasModel) {
                        mismatchServers.push(server);
                    }
                    modelMap[server.endpoint.id] = modelName;
                }

                if (mismatchServers.length > 0) {
                    socket.emit('tagging-model-mismatch', {
                        servers: mismatchServers,
                        defaultModel: modelName,
                        modelMap
                    });
                    return;
                }

                await runTagging(modelMap, socket, data);
            } catch (err) {
                console.error('Error in start-tagging setup:', err);
                socket.emit('tagging-log', { message: 'Fatal error checking servers.', type: 'error' });
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
                const userId = getUserIdFromToken(data.token);
                if (!userId) {
                    socket.emit('thumbnail-log', { message: 'Unauthorized: Invalid token.', type: 'error' });
                    return;
                }

                const dirs = await getAllowedDirectories(userId);
                let allVideos = [];
                
                for (const dir of dirs) {
                    if (!fs.existsSync(dir.path)) continue;
                    const files = fs.readdirSync(dir.path);
                    const videos = files.filter(file => {
                        const ext = path.extname(file).toLowerCase();
                        return ['.mp4', '.webm', '.ogg', '.mov', '.mkv', '.m4v', '.avi'].includes(ext);
                    }).map(file => {
                        return { dirId: dir.id, filename: file, path: path.join(dir.path, file) };
                    });
                    allVideos = allVideos.concat(videos);
                }

                socket.emit('thumbnail-log', { message: `Found ${allVideos.length} videos.`, type: 'info' });

                for (const [index, videoObj] of allVideos.entries()) {
                    if (!socket.isGeneratingThumbnails) break;

                    const percent = Math.round(((index + 1) / allVideos.length) * 100);
                    socket.emit('thumbnail-progress', percent);
                    socket.emit('thumbnail-log', { message: `Processing ${videoObj.filename}...`, type: 'info' });

                    try {
                        const combinedName = `${videoObj.dirId}::${videoObj.filename}`;
                        const THUMB_DIR = config.thumbnailsDir;
                        const videoThumbDir = path.join(THUMB_DIR, combinedName);
                        const tPath = path.join(videoThumbDir, 'thumbnail.jpg');
                        const pPath = path.join(videoThumbDir, 'preview.jpg');

                        if (force && fs.existsSync(tPath)) fs.unlinkSync(tPath);
                        await generateThumbnail(combinedName);

                        if (previews) {
                            if (force && fs.existsSync(pPath)) fs.unlinkSync(pPath);
                            await generatePreview(combinedName);
                        }

                        socket.emit('thumbnail-log', { message: `Generated for ${videoObj.filename}`, type: 'success' });
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
