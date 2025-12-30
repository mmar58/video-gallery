const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const videoRoutes = require('./routes/videos');
const uploadRoutes = require('./routes/upload');
const settingsRoutes = require('./routes/settings');
const thumbnailRoutes = require('./routes/thumbnails');
const socketHandler = require('./socket');
const { getModels } = require('./services/ollamaService');

dotenv.config();

const setupVideoGallery = (app, serverOrIo) => {
    // Determine if we got an IO instance or a Server instance
    let io;
    if (serverOrIo instanceof http.Server || (serverOrIo.constructor && serverOrIo.constructor.name === 'Server')) {
        // It's an HTTP server (or compatible), create IO
        io = new Server(serverOrIo, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });
    } else {
        // Assumption: it's an existing IO instance
        io = serverOrIo;
    }

    // Middleware
    // Ensure inputs are present to avoid overwriting existing app config if not desired?
    // For simplicity, we just add our routes. The parent app should handle body parsers if it's shared,
    // but adding json() again usually doesn't hurt (it just checks content-type).
    app.use(cors());
    app.use(express.json());

    // Serve static assets (videos)
    // We use a resolved path relative to this file to ensure it works when imported from elsewhere
    app.use('/assets', express.static(path.join(__dirname, '../../assets')));

    // Routes
    app.use('/api/videos', videoRoutes);
    app.use('/api/upload', uploadRoutes);
    app.use('/api/settings', settingsRoutes);
    app.use('/api/tags', require('./routes/tags'));
    app.use('/api/thumbnails', thumbnailRoutes);

    // Ollama models endpoint
    app.get('/api/ollama/models', async (req, res) => {
        try {
            const models = await getModels();
            res.json(models);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch Ollama models' });
        }
    });

    app.get('/api/gallery-status', (req, res) => {
        res.send('Video Gallery Backend is active');
    });

    // Initialize Socket.IO
    socketHandler(io);

    return { app, io };
};

// Standalone Execution
if (require.main === module) {
    const app = express();
    const server = http.createServer(app);
    const port = process.env.PORT || 5000;

    setupVideoGallery(app, server);

    app.get('/', (req, res) => {
        res.send('Video Gallery Backend is running');
    });

    server.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}

module.exports = setupVideoGallery;
