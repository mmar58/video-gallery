const db = require('./db');

const DEFAULT_SETTINGS = {
    ollama: {
        tagModel: 'llama3',
        endpoints: [
            { id: 'default', url: 'http://127.0.0.1:11434', weight: 1, active: true }
        ]
    },
    lowBandwidth: {
        allow: true,
        limit: 6
    }
};

function normalizeSettings(settings = {}) {
    return {
        ...DEFAULT_SETTINGS,
        ...settings,
        ollama: {
            ...DEFAULT_SETTINGS.ollama,
            ...(settings.ollama || {}),
            endpoints: (settings.ollama && settings.ollama.endpoints) || DEFAULT_SETTINGS.ollama.endpoints
        },
        lowBandwidth: {
            ...DEFAULT_SETTINGS.lowBandwidth,
            ...(settings.lowBandwidth || {})
        }
    };
}

async function readSettings() {
    try {
        const row = await db('settings').where({ key: 'global' }).first();
        if (!row) {
            return normalizeSettings();
        }
        return normalizeSettings(row.value);
    } catch (error) {
        console.error('Error reading settings:', error);
        return normalizeSettings();
    }
}

async function writeSettings(settings) {
    const normalized = normalizeSettings(settings);

    try {
        await db('settings')
            .insert({ key: 'global', value: JSON.stringify(normalized) })
            .onConflict('key')
            .merge();
    } catch (error) {
        console.error('Error saving settings:', error);
    }

    return normalized;
}

async function getSettings() {
    return await readSettings();
}

async function getOllamaSettings() {
    const settings = await readSettings();
    return settings.ollama;
}

async function updateOllamaSettings(updates = {}) {
    const settings = await readSettings();

    settings.ollama = {
        ...settings.ollama,
        ...updates
    };

    const newSettings = await writeSettings(settings);
    return newSettings.ollama;
}

async function getLowBandwidthSettings() {
    const settings = await readSettings();
    return settings.lowBandwidth;
}

async function updateLowBandwidthSettings(updates = {}) {
    const settings = await readSettings();

    settings.lowBandwidth = {
        ...settings.lowBandwidth,
        ...updates
    };

    const newSettings = await writeSettings(settings);
    return newSettings.lowBandwidth;
}

module.exports = {
    getSettings,
    getOllamaSettings,
    updateOllamaSettings,
    getLowBandwidthSettings,
    updateLowBandwidthSettings
};