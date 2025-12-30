const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../../data/metadata.json');

// Ensure data directory exists
const dataDir = path.dirname(DATA_FILE);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Load data
let metadata = {};
try {
    if (fs.existsSync(DATA_FILE)) {
        metadata = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
} catch (err) {
    console.error('Error reading metadata:', err);
    metadata = {};
}

function save() {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(metadata, null, 2));
    } catch (err) {
        console.error('Error saving metadata:', err);
    }
}

module.exports = {
    getAll: () => metadata,
    get: (filename) => metadata[filename] || { likes: 0, tags: [] },

    update: (filename, updates) => {
        const current = metadata[filename] || { likes: 0, tags: [] };
        metadata[filename] = { ...current, ...updates };
        save();
        return metadata[filename];
    },

    rename: (oldName, newName) => {
        if (metadata[oldName]) {
            metadata[newName] = metadata[oldName];
            delete metadata[oldName];
            save();
        }
    },

    delete: (filename) => {
        if (metadata[filename]) {
            delete metadata[filename];
            save();
        }
    }
};
