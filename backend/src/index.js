const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const videoRoutes = require('./routes/videos');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve static assets (videos)
app.use('/assets/videos', express.static(path.join(__dirname, '../../assets/videos')));

app.use('/api/videos', videoRoutes);

app.get('/', (req, res) => {
    res.send('Video Gallery Backend is running');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
