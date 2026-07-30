"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const http = require('http');
const { pathToFileURL } = require('url');
const { Server } = require('socket.io');
const videoRoutes = require('./routes/videos').default;
const uploadRoutes = require('./routes/upload');
const settingsRoutes = require('./routes/settings');
const thumbnailRoutes = require('./routes/thumbnails');
const authRoutes = require('./routes/auth').default;
const adminRoutes = require('./routes/admin').default;
const socketHandler = require('./socket');
const { getModels } = require('./services/ollamaService');
const config = require('./config');
dotenv.config();
const loadFrontendHandler = async () => {
    const frontendHandlerPath = path.resolve(__dirname, '../../frontend/build/handler.js');
    if (!fs.existsSync(frontendHandlerPath)) {
        return null;
    }
    const frontendModule = await Promise.resolve(`${pathToFileURL(frontendHandlerPath).href}`).then(s => __importStar(require(s)));
    return frontendModule.handler || null;
};
const setupVideoGallery = async (app, serverOrIo) => {
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
    }
    else {
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
    // Serve static assets (videos)
    app.use('/assets', express.static(config.assetsDir));
    // Routes
    app.use('/api/videos', videoRoutes);
    app.use('/api/upload', uploadRoutes);
    app.use('/api/settings', settingsRoutes);
    app.use('/api/tags', require('./routes/tags'));
    app.use('/api/thumbnails', thumbnailRoutes);
    app.use('/api/auth', authRoutes);
    app.use('/api/admin', adminRoutes);
    // Ollama models endpoint
    app.get('/api/ollama/models', async (req, res) => {
        try {
            const models = await getModels();
            res.json(models);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch Ollama models' });
        }
    });
    app.get('/api/gallery-status', (req, res) => {
        res.send('Video Gallery Backend is active');
    });
    const frontendHandler = await loadFrontendHandler();
    if (frontendHandler) {
        app.use(frontendHandler);
    }
    else {
        console.warn('Svelte frontend handler not found at frontend/build/handler.js. Run the frontend build first.');
    }
    // Initialize Socket.IO
    socketHandler(io);
    // Start background workers
    const { startCleanerWorker } = require('./services/cleanerService');
    startCleanerWorker();
    return { app, io };
};
// Standalone Execution
if (require.main === module) {
    const app = express();
    const server = http.createServer(app);
    const port = process.env.PORT || 5000;
    setupVideoGallery(app, server)
        .then(() => {
        server.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    })
        .catch((error) => {
        console.error('Failed to initialize backend:', error);
        process.exit(1);
    });
}
module.exports = setupVideoGallery;
