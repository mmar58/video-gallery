const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const config = {
    // Determine the base path for assets.
    // By default, assuming we are running from src/, assets are in ../../assets
    assetsDir: "G:\\Server\\videos\\assets",

    // Data directory for JSON store
    dataDir: "G:\\Server\\videos\\assets\\data",

    // Port definition
    port: 3033
};

// Derived paths
config.videosDir = path.join(config.assetsDir, 'videos');
config.thumbnailsDir = path.join(config.assetsDir, 'thumbnails');

module.exports = config;
