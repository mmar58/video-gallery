const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const videoRoutes = require('./routes/videos');
const uploadRoutes = require('./routes/upload');
const settingsRoutes = require('./routes/settings');
const socketHandler = require('./socket');
const { getModels } = require('./services/ollamaService');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for dev
        methods: ["GET", "POST"]
    }
});

const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static assets (videos)
app.use('/assets', express.static(path.join(__dirname, '../../assets')));

// Routes
app.use('/api/videos', videoRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/settings', settingsRoutes);

// Ollama models endpoint
app.get('/api/ollama/models', async (req, res) => {
    try {
        const models = await getModels();
        res.json(models);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch Ollama models' });
    }
});

app.get('/', (req, res) => {
    res.send('Video Gallery Backend is running');
});

// Initialize Socket.IO
socketHandler(io);

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
