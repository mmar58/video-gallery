const fs = require('fs');
const path = require('path');

const config = require('../config');

const DATA_FILE = path.join(config.dataDir, 'metadata.json');

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
    },

    removeTagFromAll: (tagToRemove) => {
        let modified = false;
        const lowerTag = tagToRemove.toLowerCase();

        Object.keys(metadata).forEach(filename => {
            const entry = metadata[filename];
            if (entry.tags && entry.tags.length > 0) {
                const initialLength = entry.tags.length;
                entry.tags = entry.tags.filter(t => t.toLowerCase() !== lowerTag);
                if (entry.tags.length !== initialLength) modified = true;
            }
        });

        if (modified) save();
    },

    renameTagInAll: (oldTag, newTag) => {
        let modified = false;
        const lowerOld = oldTag.toLowerCase();

        Object.keys(metadata).forEach(filename => {
            const entry = metadata[filename];
            if (entry.tags) {
                const index = entry.tags.findIndex(t => t.toLowerCase() === lowerOld);
                if (index !== -1) {
                    entry.tags[index] = newTag;
                    // Remove duplicates if newTag already existed
                    entry.tags = [...new Set(entry.tags)];
                    modified = true;
                }
            }
        });

        if (modified) save();
    }
};
