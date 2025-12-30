const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const config = {
    // Determine the base path for assets.
    // By default, assuming we are running from src/, assets are in ../../assets
    assetsDir: process.env.ASSETS_PATH || path.resolve(__dirname, '../../assets'),

    // Data directory for JSON store
    dataDir: process.env.DATA_PATH || path.resolve(__dirname, '../data'),

    // Port definition
    port: process.env.PORT || 3033
};

// Derived paths
config.videosDir = path.join(config.assetsDir, 'videos');
config.thumbnailsDir = path.join(config.assetsDir, 'thumbnails');

module.exports = config;
