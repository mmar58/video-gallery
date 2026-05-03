const fs = require('fs');
const path = require('path');

const config = require('../config');

const SETTINGS_FILE = path.join(config.dataDir, 'settings.json');
const DEFAULT_SETTINGS = {
    ollama: {
        tagModel: 'llama3'
    }
};

const dataDir = path.dirname(SETTINGS_FILE);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

function normalizeSettings(settings = {}) {
    return {
        ...DEFAULT_SETTINGS,
        ...settings,
        ollama: {
            ...DEFAULT_SETTINGS.ollama,
            ...(settings.ollama || {})
        }
    };
}

function readSettings() {
    try {
        if (!fs.existsSync(SETTINGS_FILE)) {
            return normalizeSettings();
        }

        const raw = fs.readFileSync(SETTINGS_FILE, 'utf8');
        return normalizeSettings(JSON.parse(raw));
    } catch (error) {
        console.error('Error reading settings:', error);
        return normalizeSettings();
    }
}

function writeSettings(settings) {
    const normalized = normalizeSettings(settings);

    try {
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(normalized, null, 2));
    } catch (error) {
        console.error('Error saving settings:', error);
    }

    return normalized;
}

function getSettings() {
    return readSettings();
}

function getOllamaSettings() {
    return readSettings().ollama;
}

function updateOllamaSettings(updates = {}) {
    const settings = readSettings();

    settings.ollama = {
        ...settings.ollama,
        ...updates
    };

    return writeSettings(settings).ollama;
}

module.exports = {
    getSettings,
    getOllamaSettings,
    updateOllamaSettings
};