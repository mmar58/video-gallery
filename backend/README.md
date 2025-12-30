# Video Gallery Backend

The Node.js/Express backend for the Intelligent Video Gallery. It handles video streaming, metadata management, auto-tagging (via Ollama), and thumbnail generation.

## 🚀 Usage

### Standalone

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Configuration**:
    Create a `.env` file (optional, defaults provided):
    ```env
    PORT=5000
    ASSETS_PATH=../../assets
    DATA_PATH=../data
    ```

3.  **Run**:
    ```bash
    npm run dev
    ```

### 🔌 Integration (as a Module)

You can plug this backend into another existing Express application by importing the setup function.

**Example:**

```javascript
const express = require('express');
const http = require('http');
// Import the setup function
const setupVideoGallery = require('./path/to/video-gallery/backend/src/index');

const app = express();
const server = http.createServer(app);

// Initialize the Video Gallery backend logic
// Arguments:
// 1. app: Your Express app instance
// 2. serverOrIo: Your HTTP server instance OR an existing Socket.IO instance
setupVideoGallery(app, server);

server.listen(3000, () => {
    console.log('Combined server running on port 3000');
});
```

This will mount:
*   API Routes at `/api/videos`, `/api/tags`, etc.
*   Static Assets at `/assets`
*   Socket.IO handlers for progress updates

## 📜 Scripts

*   `npm run script:thumb`: Bulk generate thumbnails and animated previews for all videos.
*   `npm run script:tag`: Bulk auto-tag videos using the active Ollama model.
*   `npm run dev`: Start the development server with Nodemon.

## 📂 Structure

*   `src/index.js`: Entry point (exports setup function).
*   `src/routes/`: API route definitions.
*   `src/services/`: Logic for FFmpeg, Ollama, and file operations.
*   `src/socket.js`: Real-time progress emission logic.
*   `data/`: JSON persistence for video metadata.
